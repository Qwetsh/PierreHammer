import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { PaintStatus } from '@/components/domain/PaintStatusBadge'
import type { CollectionItem } from '@/types/collection.types'
import { useAuthStore } from '@/stores/authStore'
import * as syncService from '@/services/collectionSyncService'

export interface ProgressStats {
  total: number
  unassembled: number
  assembled: number
  inProgress: number
  completed: number
  percentComplete: number
}

function getAuthContext(): { userId: string } | null {
  const { user, isAuthenticated } = useAuthStore.getState()
  if (!isAuthenticated || !user) return null
  return { userId: user.id }
}

function syncItemInBackground(item: CollectionItem) {
  const auth = getAuthContext()
  if (!auth) return
  syncService.upsertCollectionItem(item, auth.userId).catch(() => {})
}

function syncDeleteInBackground(datasheetId: string) {
  const auth = getAuthContext()
  if (!auth) return
  syncService.deleteCollectionItem(auth.userId, datasheetId).catch(() => {})
}

/** Flatten all squads into a single array of statuses */
function allModels(item: CollectionItem): PaintStatus[] {
  return item.squads.flat()
}

let unsubscribeRealtime: (() => void) | null = null

interface CollectionState {
  items: Record<string, CollectionItem>
  syncing: boolean
  /** Add a new squad of `modelCount` miniatures (or add to existing item) */
  addItem: (datasheetId: string, factionId: string, modelCount?: number) => void
  removeItem: (datasheetId: string) => void
  /** Add another squad to an existing item */
  addSquad: (datasheetId: string, modelCount: number) => void
  /** Remove an entire squad */
  removeSquad: (datasheetId: string, squadIndex: number) => void
  /** Update a single miniature's paint status */
  updateModelStatus: (datasheetId: string, squadIndex: number, modelIndex: number, status: PaintStatus) => void
  /** Set all models in a squad to the same status */
  setSquadStatus: (datasheetId: string, squadIndex: number, status: PaintStatus) => void
  getItem: (datasheetId: string) => CollectionItem | undefined
  /** Total number of individual miniatures owned */
  getOwnedCount: (datasheetId: string) => number
  /** Number of squads */
  getSquadCount: (datasheetId: string) => number
  isOwned: (datasheetId: string) => boolean
  getProgressStats: () => ProgressStats
  syncOnLogin: () => Promise<void>
}

// Migrate from old formats to new squads format
function migrateItem(item: CollectionItem & { quantity?: number; paintStatus?: PaintStatus; instances?: PaintStatus[] }): CollectionItem {
  // Already new format
  if (item.squads && Array.isArray(item.squads) && item.squads.length > 0 && Array.isArray(item.squads[0])) {
    return item
  }

  // Old instances format: each instance was a "box" → convert each to a squad of 1
  if (Array.isArray(item.instances) && item.instances.length > 0) {
    return {
      datasheetId: item.datasheetId,
      factionId: item.factionId,
      squads: item.instances.map((status) => [status]),
    }
  }

  // Very old format: quantity + paintStatus
  const qty = item.quantity ?? 1
  const status = item.paintStatus ?? 'unassembled'
  return {
    datasheetId: item.datasheetId,
    factionId: item.factionId,
    squads: Array.from({ length: qty }, () => [status]),
  }
}

export const useCollectionStore = create<CollectionState>()(
  persist(
    (set, get) => ({
      items: {},
      syncing: false,

      addItem: (datasheetId, factionId, modelCount = 1) => {
        set((state) => {
          const existing = state.items[datasheetId]
          if (existing) {
            const updated = {
              ...existing,
              squads: [...existing.squads, Array(modelCount).fill('unassembled') as PaintStatus[]],
            }
            syncItemInBackground(updated)
            return { items: { ...state.items, [datasheetId]: updated } }
          }
          const newItem: CollectionItem = {
            datasheetId,
            factionId,
            squads: [Array(modelCount).fill('unassembled') as PaintStatus[]],
          }
          syncItemInBackground(newItem)
          return { items: { ...state.items, [datasheetId]: newItem } }
        })
      },

      removeItem: (datasheetId) => {
        syncDeleteInBackground(datasheetId)
        set((state) => {
          const { [datasheetId]: _, ...rest } = state.items
          return { items: rest }
        })
      },

      addSquad: (datasheetId, modelCount) => {
        const item = get().items[datasheetId]
        if (!item) return
        const updated = {
          ...item,
          squads: [...item.squads, Array(modelCount).fill('unassembled') as PaintStatus[]],
        }
        syncItemInBackground(updated)
        set((state) => ({ items: { ...state.items, [datasheetId]: updated } }))
      },

      removeSquad: (datasheetId, squadIndex) => {
        const item = get().items[datasheetId]
        if (!item) return
        const newSquads = item.squads.filter((_, i) => i !== squadIndex)
        if (newSquads.length === 0) {
          get().removeItem(datasheetId)
          return
        }
        const updated = { ...item, squads: newSquads }
        syncItemInBackground(updated)
        set((state) => ({ items: { ...state.items, [datasheetId]: updated } }))
      },

      updateModelStatus: (datasheetId, squadIndex, modelIndex, status) => {
        const item = get().items[datasheetId]
        if (!item) return
        const squad = item.squads[squadIndex]
        if (!squad || modelIndex < 0 || modelIndex >= squad.length) return
        const newSquads = item.squads.map((s, i) => {
          if (i !== squadIndex) return s
          const newSquad = [...s]
          newSquad[modelIndex] = status
          return newSquad
        })
        const updated = { ...item, squads: newSquads }
        syncItemInBackground(updated)
        set((state) => ({ items: { ...state.items, [datasheetId]: updated } }))
      },

      setSquadStatus: (datasheetId, squadIndex, status) => {
        const item = get().items[datasheetId]
        if (!item || !item.squads[squadIndex]) return
        const newSquads = item.squads.map((s, i) =>
          i === squadIndex ? s.map(() => status) : s
        )
        const updated = { ...item, squads: newSquads }
        syncItemInBackground(updated)
        set((state) => ({ items: { ...state.items, [datasheetId]: updated } }))
      },

      getItem: (datasheetId) => get().items[datasheetId],
      getOwnedCount: (datasheetId) => {
        const item = get().items[datasheetId]
        return item ? allModels(item).length : 0
      },
      getSquadCount: (datasheetId) => get().items[datasheetId]?.squads.length ?? 0,
      isOwned: (datasheetId) => datasheetId in get().items,

      getProgressStats: () => {
        const items = Object.values(get().items)
        const all = items.flatMap(allModels)
        const total = all.length
        if (total === 0) return { total: 0, unassembled: 0, assembled: 0, inProgress: 0, completed: 0, percentComplete: 0 }
        const unassembled = all.filter((s) => s === 'unassembled').length
        const assembled = all.filter((s) => s === 'assembled').length
        const inProgress = all.filter((s) => s === 'in-progress').length
        const completed = all.filter((s) => s === 'done').length
        const percentComplete = Math.round((completed / total) * 100)
        return { total, unassembled, assembled, inProgress, completed, percentComplete }
      },

      syncOnLogin: async () => {
        const auth = getAuthContext()
        if (!auth) return
        console.log('[collection] syncOnLogin start')
        set({ syncing: true })
        try {
          const remoteItems = await syncService.fetchRemoteCollection(auth.userId)
          console.log('[collection] remote items:', Object.keys(remoteItems).length)
          set({ items: remoteItems, syncing: false })

          if (unsubscribeRealtime) unsubscribeRealtime()
          unsubscribeRealtime = syncService.subscribeToCollection(auth.userId, (event, item, datasheetId) => {
            console.log('[collection-sync] realtime:', event, datasheetId)
            if (event === 'delete') {
              set((state) => {
                if (!(datasheetId in state.items)) return state
                const { [datasheetId]: _, ...rest } = state.items
                return { items: rest }
              })
            } else if (item) {
              set((state) => ({
                items: { ...state.items, [datasheetId]: item },
              }))
            }
          })
        } catch (e) {
          console.error('[collection] syncOnLogin error:', e)
          set({ syncing: false })
        }
      },
    }),
    {
      name: 'pierrehammer-collection',
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error('Failed to rehydrate collection store:', error)
          localStorage.removeItem('pierrehammer-collection')
          return
        }
        if (state?.items) {
          const migrated: Record<string, CollectionItem> = {}
          let needsMigration = false
          for (const [key, item] of Object.entries(state.items)) {
            const m = migrateItem(item as CollectionItem & { quantity?: number; paintStatus?: PaintStatus; instances?: PaintStatus[] })
            migrated[key] = m
            if (m !== item) needsMigration = true
          }
          if (needsMigration) {
            state.items = migrated
          }
        }
      },
    },
  ),
)

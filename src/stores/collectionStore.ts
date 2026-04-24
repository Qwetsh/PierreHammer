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
  syncService.upsertCollectionItem(item, auth.userId).catch((e) => console.error('Collection sync error:', e))
}

function syncDeleteInBackground(datasheetId: string) {
  const auth = getAuthContext()
  if (!auth) return
  syncService.deleteCollectionItem(auth.userId, datasheetId).catch((e) => console.error('Collection sync error:', e))
}

interface CollectionState {
  items: Record<string, CollectionItem>
  syncing: boolean
  addItem: (datasheetId: string, factionId: string) => void
  removeItem: (datasheetId: string) => void
  removeInstance: (datasheetId: string, instanceIndex: number) => void
  addInstance: (datasheetId: string) => void
  updateInstanceStatus: (datasheetId: string, instanceIndex: number, status: PaintStatus) => void
  getItem: (datasheetId: string) => CollectionItem | undefined
  getOwnedCount: (datasheetId: string) => number
  isOwned: (datasheetId: string) => boolean
  getProgressStats: () => ProgressStats
  syncOnLogin: () => Promise<void>
}

// Migrate old format { quantity, paintStatus } to new { instances }
function migrateItem(item: CollectionItem & { quantity?: number; paintStatus?: PaintStatus }): CollectionItem {
  if (item.instances) return item
  const qty = item.quantity ?? 1
  const status = item.paintStatus ?? 'unassembled'
  return {
    datasheetId: item.datasheetId,
    factionId: item.factionId,
    instances: Array(qty).fill(status),
  }
}

export const useCollectionStore = create<CollectionState>()(
  persist(
    (set, get) => ({
      items: {},
      syncing: false,

      addItem: (datasheetId, factionId) => {
        set((state) => {
          const existing = state.items[datasheetId]
          if (existing) {
            const updated = {
              ...existing,
              instances: [...existing.instances, 'unassembled' as PaintStatus],
            }
            syncItemInBackground(updated)
            return {
              items: { ...state.items, [datasheetId]: updated },
            }
          }
          const newItem: CollectionItem = {
            datasheetId,
            factionId,
            instances: ['unassembled'],
          }
          syncItemInBackground(newItem)
          return {
            items: { ...state.items, [datasheetId]: newItem },
          }
        })
      },

      removeItem: (datasheetId) => {
        syncDeleteInBackground(datasheetId)
        set((state) => {
          const { [datasheetId]: _, ...rest } = state.items
          return { items: rest }
        })
      },

      removeInstance: (datasheetId, instanceIndex) => {
        const item = get().items[datasheetId]
        if (!item) return
        const newInstances = item.instances.filter((_, i) => i !== instanceIndex)
        if (newInstances.length === 0) {
          get().removeItem(datasheetId)
          return
        }
        const updated = { ...item, instances: newInstances }
        syncItemInBackground(updated)
        set((state) => ({
          items: {
            ...state.items,
            [datasheetId]: updated,
          },
        }))
      },

      addInstance: (datasheetId) => {
        const item = get().items[datasheetId]
        if (!item) return
        const updated = {
          ...item,
          instances: [...item.instances, 'unassembled' as PaintStatus],
        }
        syncItemInBackground(updated)
        set((state) => ({
          items: {
            ...state.items,
            [datasheetId]: updated,
          },
        }))
      },

      updateInstanceStatus: (datasheetId, instanceIndex, status) => {
        const item = get().items[datasheetId]
        if (!item || instanceIndex < 0 || instanceIndex >= item.instances.length) return
        const newInstances = [...item.instances]
        newInstances[instanceIndex] = status
        const updated = { ...item, instances: newInstances }
        syncItemInBackground(updated)
        set((state) => ({
          items: {
            ...state.items,
            [datasheetId]: updated,
          },
        }))
      },

      getItem: (datasheetId) => get().items[datasheetId],
      getOwnedCount: (datasheetId) => get().items[datasheetId]?.instances.length ?? 0,
      isOwned: (datasheetId) => datasheetId in get().items,

      getProgressStats: () => {
        const items = Object.values(get().items)
        const allInstances = items.flatMap((i) => i.instances)
        const total = allInstances.length
        if (total === 0) return { total: 0, unassembled: 0, assembled: 0, inProgress: 0, completed: 0, percentComplete: 0 }
        const unassembled = allInstances.filter((s) => s === 'unassembled').length
        const assembled = allInstances.filter((s) => s === 'assembled').length
        const inProgress = allInstances.filter((s) => s === 'in-progress').length
        const completed = allInstances.filter((s) => s === 'done').length
        const percentComplete = Math.round((completed / total) * 100)
        return { total, unassembled, assembled, inProgress, completed, percentComplete }
      },

      syncOnLogin: async () => {
        const auth = getAuthContext()
        if (!auth) return
        set({ syncing: true })
        try {
          const remoteItems = await syncService.fetchRemoteCollection(auth.userId)
          const localItems = get().items

          // Merge: remote wins for existing keys, local-only items get pushed
          const merged: Record<string, CollectionItem> = { ...remoteItems }
          const localOnly: CollectionItem[] = []

          for (const [key, localItem] of Object.entries(localItems)) {
            if (!merged[key]) {
              merged[key] = localItem
              localOnly.push(localItem)
            }
          }

          // Push local-only items to remote
          if (localOnly.length > 0) {
            for (const item of localOnly) {
              await syncService.upsertCollectionItem(item, auth.userId)
            }
          }

          set({ items: merged, syncing: false })
        } catch (e) {
          console.error('syncOnLogin collection error:', e)
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
        // Migrate old format items
        if (state?.items) {
          const migrated: Record<string, CollectionItem> = {}
          let needsMigration = false
          for (const [key, item] of Object.entries(state.items)) {
            const m = migrateItem(item as CollectionItem & { quantity?: number; paintStatus?: PaintStatus })
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

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { PaintStatus } from '@/components/domain/PaintStatusBadge'
import type { CollectionItem } from '@/types/collection.types'

export interface ProgressStats {
  total: number
  unassembled: number
  assembled: number
  inProgress: number
  completed: number
  percentComplete: number
}

interface CollectionState {
  items: Record<string, CollectionItem>
  addItem: (datasheetId: string, factionId: string) => void
  removeItem: (datasheetId: string) => void
  removeInstance: (datasheetId: string, instanceIndex: number) => void
  addInstance: (datasheetId: string) => void
  updateInstanceStatus: (datasheetId: string, instanceIndex: number, status: PaintStatus) => void
  getItem: (datasheetId: string) => CollectionItem | undefined
  getOwnedCount: (datasheetId: string) => number
  isOwned: (datasheetId: string) => boolean
  getProgressStats: () => ProgressStats
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

      addItem: (datasheetId, factionId) => {
        set((state) => {
          const existing = state.items[datasheetId]
          if (existing) {
            return {
              items: {
                ...state.items,
                [datasheetId]: {
                  ...existing,
                  instances: [...existing.instances, 'unassembled'],
                },
              },
            }
          }
          return {
            items: {
              ...state.items,
              [datasheetId]: {
                datasheetId,
                factionId,
                instances: ['unassembled'],
              },
            },
          }
        })
      },

      removeItem: (datasheetId) => {
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
        set((state) => ({
          items: {
            ...state.items,
            [datasheetId]: { ...item, instances: newInstances },
          },
        }))
      },

      addInstance: (datasheetId) => {
        const item = get().items[datasheetId]
        if (!item) return
        set((state) => ({
          items: {
            ...state.items,
            [datasheetId]: {
              ...item,
              instances: [...item.instances, 'unassembled'],
            },
          },
        }))
      },

      updateInstanceStatus: (datasheetId, instanceIndex, status) => {
        const item = get().items[datasheetId]
        if (!item || instanceIndex < 0 || instanceIndex >= item.instances.length) return
        const newInstances = [...item.instances]
        newInstances[instanceIndex] = status
        set((state) => ({
          items: {
            ...state.items,
            [datasheetId]: { ...item, instances: newInstances },
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

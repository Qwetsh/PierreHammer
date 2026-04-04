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
  addItem: (datasheetId: string, factionId: string, quantity?: number) => void
  removeItem: (datasheetId: string) => void
  updateQuantity: (datasheetId: string, quantity: number) => void
  updateStatus: (datasheetId: string, status: PaintStatus) => void
  getItem: (datasheetId: string) => CollectionItem | undefined
  getOwnedCount: (datasheetId: string) => number
  isOwned: (datasheetId: string) => boolean
  getProgressStats: () => ProgressStats
}

export const useCollectionStore = create<CollectionState>()(
  persist(
    (set, get) => ({
      items: {},

      addItem: (datasheetId, factionId, quantity = 1) => {
        set((state) => ({
          items: {
            ...state.items,
            [datasheetId]: {
              datasheetId,
              factionId,
              quantity,
              paintStatus: 'unassembled' as PaintStatus,
            },
          },
        }))
      },

      removeItem: (datasheetId) => {
        set((state) => {
          const { [datasheetId]: _, ...rest } = state.items
          return { items: rest }
        })
      },

      updateQuantity: (datasheetId, quantity) => {
        const item = get().items[datasheetId]
        if (!item) return
        if (quantity <= 0) {
          get().removeItem(datasheetId)
          return
        }
        set((state) => ({
          items: {
            ...state.items,
            [datasheetId]: { ...state.items[datasheetId], quantity },
          },
        }))
      },

      updateStatus: (datasheetId, status) => {
        const item = get().items[datasheetId]
        if (!item) return
        set((state) => ({
          items: {
            ...state.items,
            [datasheetId]: { ...state.items[datasheetId], paintStatus: status },
          },
        }))
      },

      getItem: (datasheetId) => get().items[datasheetId],
      getOwnedCount: (datasheetId) => get().items[datasheetId]?.quantity ?? 0,
      isOwned: (datasheetId) => datasheetId in get().items,

      getProgressStats: () => {
        const items = Object.values(get().items)
        const total = items.length
        if (total === 0) return { total: 0, unassembled: 0, assembled: 0, inProgress: 0, completed: 0, percentComplete: 0 }
        const unassembled = items.filter((i) => i.paintStatus === 'unassembled').length
        const assembled = items.filter((i) => i.paintStatus === 'assembled').length
        const inProgress = items.filter((i) => i.paintStatus === 'in-progress').length
        const completed = items.filter((i) => i.paintStatus === 'done').length
        const percentComplete = Math.round((completed / total) * 100)
        return { total, unassembled, assembled, inProgress, completed, percentComplete }
      },
    }),
    {
      name: 'pierrehammer-collection',
      onRehydrateStorage: () => (_state, error) => {
        if (error) {
          console.error('Failed to rehydrate collection store:', error)
          localStorage.removeItem('pierrehammer-collection')
        }
      },
    },
  ),
)

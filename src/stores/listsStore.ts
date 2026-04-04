import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ArmyList, ListUnit, PointsLimit } from '@/types/armyList.types'

interface ListsState {
  lists: Record<string, ArmyList>
  createList: (name: string, factionId: string, detachment: string, pointsLimit: PointsLimit) => string
  deleteList: (listId: string) => void
  getList: (listId: string) => ArmyList | undefined
  getAllLists: () => ArmyList[]
  addUnit: (listId: string, unit: ListUnit) => void
  removeUnit: (listId: string, unitIndex: number) => void
  updateList: (listId: string, updates: Partial<Pick<ArmyList, 'name' | 'detachment' | 'pointsLimit'>>) => void
}

export const useListsStore = create<ListsState>()(
  persist(
    (set, get) => ({
      lists: {},

      createList: (name, factionId, detachment, pointsLimit) => {
        const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
        const newList: ArmyList = {
          id,
          name,
          factionId,
          detachment,
          pointsLimit,
          units: [],
          createdAt: Date.now(),
        }
        set((state) => ({
          lists: { ...state.lists, [id]: newList },
        }))
        return id
      },

      deleteList: (listId) => {
        set((state) => {
          const { [listId]: _, ...rest } = state.lists
          return { lists: rest }
        })
      },

      getList: (listId) => get().lists[listId],
      getAllLists: () => Object.values(get().lists).sort((a, b) => b.createdAt - a.createdAt),

      addUnit: (listId, unit) => {
        const list = get().lists[listId]
        if (!list) return
        set((state) => ({
          lists: {
            ...state.lists,
            [listId]: { ...state.lists[listId], units: [...state.lists[listId].units, unit] },
          },
        }))
      },

      removeUnit: (listId, unitIndex) => {
        const list = get().lists[listId]
        if (!list) return
        set((state) => ({
          lists: {
            ...state.lists,
            [listId]: {
              ...state.lists[listId],
              units: state.lists[listId].units.filter((_, i) => i !== unitIndex),
            },
          },
        }))
      },

      updateList: (listId, updates) => {
        const list = get().lists[listId]
        if (!list) return
        set((state) => ({
          lists: {
            ...state.lists,
            [listId]: { ...state.lists[listId], ...updates },
          },
        }))
      },
    }),
    {
      name: 'pierrehammer-lists',
      onRehydrateStorage: () => (_state, error) => {
        if (error) {
          console.error('Failed to rehydrate lists store:', error)
          localStorage.removeItem('pierrehammer-lists')
        }
      },
    },
  ),
)

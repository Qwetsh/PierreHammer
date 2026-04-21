import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ArmyList, ListUnit, ListEnhancement, PointsLimit } from '@/types/armyList.types'

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}

interface ListsState {
  lists: Record<string, ArmyList>
  createList: (name: string, factionId: string, detachment: string, pointsLimit: PointsLimit, detachmentId?: string) => string
  deleteList: (listId: string) => void
  getList: (listId: string) => ArmyList | undefined
  getAllLists: () => ArmyList[]
  addUnit: (listId: string, unit: ListUnit) => void
  removeUnit: (listId: string, unitIndex: number) => void
  updateUnit: (listId: string, unitIndex: number, updates: Partial<ListUnit>) => void
  updateList: (listId: string, updates: Partial<Pick<ArmyList, 'name' | 'detachment' | 'detachmentId' | 'pointsLimit'>>) => void
  attachHero: (listId: string, heroIndex: number, squadId: string) => void
  detachHero: (listId: string, heroIndex: number) => void
  setEnhancement: (listId: string, unitIndex: number, enhancement: ListEnhancement | undefined) => void
}

function migrateUnit(u: ListUnit): ListUnit {
  return {
    ...u,
    id: u.id || generateId(),
    selectedPointOptionIndex: u.selectedPointOptionIndex ?? 0,
    selectedWeapons: u.selectedWeapons ?? [],
    notes: u.notes ?? '',
  }
}

export const useListsStore = create<ListsState>()(
  persist(
    (set, get) => ({
      lists: {},

      createList: (name, factionId, detachment, pointsLimit, detachmentId?) => {
        const id = generateId()
        const newList: ArmyList = {
          id,
          name,
          factionId,
          detachment,
          detachmentId,
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
            [listId]: { ...state.lists[listId], units: [...state.lists[listId].units, migrateUnit(unit)] },
          },
        }))
      },

      removeUnit: (listId, unitIndex) => {
        const list = get().lists[listId]
        if (!list) return
        const removedUnit = list.units[unitIndex]
        set((state) => {
          let units = state.lists[listId].units.filter((_, i) => i !== unitIndex)
          // If removing a squad, detach any heroes attached to it
          if (removedUnit) {
            units = units.map((u) =>
              u.attachedToId === removedUnit.id ? { ...u, attachedToId: undefined } : u,
            )
          }
          return {
            lists: {
              ...state.lists,
              [listId]: { ...state.lists[listId], units },
            },
          }
        })
      },

      updateUnit: (listId, unitIndex, updates) => {
        const list = get().lists[listId]
        if (!list || unitIndex < 0 || unitIndex >= list.units.length) return
        set((state) => ({
          lists: {
            ...state.lists,
            [listId]: {
              ...state.lists[listId],
              units: state.lists[listId].units.map((u, i) =>
                i === unitIndex ? { ...migrateUnit(u), ...updates } : u,
              ),
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

      attachHero: (listId, heroIndex, squadId) => {
        const list = get().lists[listId]
        if (!list || heroIndex < 0 || heroIndex >= list.units.length) return
        set((state) => ({
          lists: {
            ...state.lists,
            [listId]: {
              ...state.lists[listId],
              units: state.lists[listId].units.map((u, i) =>
                i === heroIndex ? { ...u, attachedToId: squadId } : u,
              ),
            },
          },
        }))
      },

      detachHero: (listId, heroIndex) => {
        const list = get().lists[listId]
        if (!list || heroIndex < 0 || heroIndex >= list.units.length) return
        set((state) => ({
          lists: {
            ...state.lists,
            [listId]: {
              ...state.lists[listId],
              units: state.lists[listId].units.map((u, i) =>
                i === heroIndex ? { ...u, attachedToId: undefined } : u,
              ),
            },
          },
        }))
      },

      setEnhancement: (listId, unitIndex, enhancement) => {
        const list = get().lists[listId]
        if (!list || unitIndex < 0 || unitIndex >= list.units.length) return
        set((state) => ({
          lists: {
            ...state.lists,
            [listId]: {
              ...state.lists[listId],
              units: state.lists[listId].units.map((u, i) =>
                i === unitIndex ? { ...u, enhancement } : u,
              ),
            },
          },
        }))
      },
    }),
    {
      name: 'pierrehammer-lists',
      version: 2,
      migrate: (persisted, version) => {
        const state = persisted as { lists: Record<string, ArmyList> }
        if (version < 2) {
          // Add IDs to existing units
          for (const list of Object.values(state.lists)) {
            list.units = list.units.map((u) => migrateUnit(u))
          }
        }
        return state
      },
      onRehydrateStorage: () => (_state, error) => {
        if (error) {
          console.error('Failed to rehydrate lists store:', error)
          localStorage.removeItem('pierrehammer-lists')
        }
      },
    },
  ),
)

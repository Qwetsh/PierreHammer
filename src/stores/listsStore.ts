import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ArmyList, ListUnit, ListEnhancement, PointsLimit } from '@/types/armyList.types'
import { useAuthStore } from '@/stores/authStore'
import * as syncService from '@/services/listsSyncService'

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}

/** Fire-and-forget sync helper — never throws */
function syncInBackground(fn: () => Promise<unknown>) {
  fn().catch((e) => console.error('Sync error:', e))
}

function getAuthContext(): { userId: string } | null {
  const { user, isAuthenticated } = useAuthStore.getState()
  if (!isAuthenticated || !user) return null
  return { userId: user.id }
}

interface ListsState {
  lists: Record<string, ArmyList>
  syncing: boolean
  createList: (name: string, factionId: string, detachment: string, pointsLimit: PointsLimit, detachmentId?: string) => string
  deleteList: (listId: string) => void
  getList: (listId: string) => ArmyList | undefined
  getAllLists: () => ArmyList[]
  addUnit: (listId: string, unit: ListUnit) => void
  removeUnit: (listId: string, unitIndex: number) => void
  updateUnit: (listId: string, unitIndex: number, updates: Partial<ListUnit>) => void
  updateList: (listId: string, updates: Partial<Pick<ArmyList, 'name' | 'detachment' | 'detachmentId' | 'pointsLimit' | 'isPublic'>>) => void
  attachHero: (listId: string, heroIndex: number, squadId: string) => void
  detachHero: (listId: string, heroIndex: number) => void
  setEnhancement: (listId: string, unitIndex: number, enhancement: ListEnhancement | undefined) => void
  syncOnLogin: () => Promise<void>
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

/** Sync a single list to remote (push or update) */
function syncList(list: ArmyList) {
  const auth = getAuthContext()
  if (!auth) return
  if (list.remoteId) {
    syncInBackground(() => syncService.updateRemoteList(list.remoteId!, list, auth.userId, list.isPublic))
  } else {
    syncInBackground(async () => {
      const remoteId = await syncService.pushList(list, auth.userId, list.isPublic)
      if (remoteId) {
        useListsStore.setState((state) => ({
          lists: {
            ...state.lists,
            [list.id]: { ...state.lists[list.id], remoteId },
          },
        }))
      }
    })
  }
}

export const useListsStore = create<ListsState>()(
  persist(
    (set, get) => ({
      lists: {},
      syncing: false,

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
        syncList(newList)
        return id
      },

      deleteList: (listId) => {
        const list = get().lists[listId]
        set((state) => {
          const { [listId]: _, ...rest } = state.lists
          return { lists: rest }
        })
        if (list?.remoteId) {
          syncInBackground(() => syncService.deleteRemoteList(list.remoteId!))
        }
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
        syncList(get().lists[listId])
      },

      removeUnit: (listId, unitIndex) => {
        const list = get().lists[listId]
        if (!list) return
        const removedUnit = list.units[unitIndex]
        set((state) => {
          let units = state.lists[listId].units.filter((_, i) => i !== unitIndex)
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
        syncList(get().lists[listId])
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
        syncList(get().lists[listId])
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
        syncList(get().lists[listId])
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
        syncList(get().lists[listId])
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
        syncList(get().lists[listId])
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
        syncList(get().lists[listId])
      },

      syncOnLogin: async () => {
        const auth = getAuthContext()
        if (!auth) return
        set({ syncing: true })
        try {
          const remoteLists = await syncService.fetchRemoteLists(auth.userId)
          const localLists = get().lists

          // Index remote lists by remoteId
          const remoteById = new Map(remoteLists.map((r) => [r.remoteId, r]))

          const merged: Record<string, ArmyList> = {}

          // Remote lists take authority — add all remote lists
          for (const remote of remoteLists) {
            // Check if a local list already points to this remote
            const existingLocal = Object.values(localLists).find((l) => l.remoteId === remote.remoteId)
            merged[existingLocal?.id ?? remote.id] = {
              ...remote,
              id: existingLocal?.id ?? remote.id,
            }
          }

          // Local lists without remoteId → upload them
          for (const local of Object.values(localLists)) {
            if (!local.remoteId && !remoteById.has(local.id)) {
              const remoteId = await syncService.pushList(local, auth.userId, local.isPublic)
              merged[local.id] = { ...local, remoteId: remoteId ?? undefined }
            }
          }

          set({ lists: merged, syncing: false })
        } catch (e) {
          console.error('syncOnLogin error:', e)
          set({ syncing: false })
        }
      },
    }),
    {
      name: 'pierrehammer-lists',
      version: 2,
      migrate: (persisted, version) => {
        const state = persisted as { lists: Record<string, ArmyList> }
        if (version < 2) {
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

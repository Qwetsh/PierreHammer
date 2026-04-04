import { create } from 'zustand'

interface ComparatorState {
  selectedIds: string[]
  factionSlug: string | null
  addUnit: (id: string, factionSlug: string) => void
  removeUnit: (id: string) => void
  clear: () => void
  isSelected: (id: string) => boolean
}

const MAX_UNITS = 3

export const useComparatorStore = create<ComparatorState>((set, get) => ({
  selectedIds: [],
  factionSlug: null,

  addUnit: (id, factionSlug) => {
    const state = get()
    if (state.selectedIds.length >= MAX_UNITS) return
    if (state.selectedIds.includes(id)) return
    if (state.factionSlug && state.factionSlug !== factionSlug) {
      set({ selectedIds: [id], factionSlug })
      return
    }
    set({ selectedIds: [...state.selectedIds, id], factionSlug })
  },

  removeUnit: (id) => {
    set((state) => {
      const next = state.selectedIds.filter((i) => i !== id)
      return { selectedIds: next, factionSlug: next.length > 0 ? state.factionSlug : null }
    })
  },

  clear: () => set({ selectedIds: [], factionSlug: null }),

  isSelected: (id) => get().selectedIds.includes(id),
}))

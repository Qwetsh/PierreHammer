import { create } from 'zustand'
import type { FactionIndex, Faction } from '@/types/gameData.types'
import { loadJSON } from '@/utils/dataLoader'
import { usePointsHistoryStore } from '@/stores/pointsHistoryStore'

const LAST_UPDATE_KEY = 'pierrehammer-last-data-update'

interface GameDataState {
  factionIndex: FactionIndex | null
  loadedFactions: Record<string, Faction>
  failedFactions: Set<string>
  selectedFactionSlug: string | null
  loadingFactions: Set<string>
  error: string | null
  dataUpdateNotification: string | null
  dataWasUpdated: boolean
  loadFactionIndex: () => Promise<void>
  loadFaction: (slug: string) => Promise<void>
  preloadAllFactions: () => Promise<void>
  selectFaction: (slug: string | null) => void
  dismissDataNotification: () => void
  isLoading: boolean
}

export const useGameDataStore = create<GameDataState>((set, get) => ({
  factionIndex: null,
  loadedFactions: {},
  failedFactions: new Set(),
  selectedFactionSlug: null,
  loadingFactions: new Set(),
  error: null,
  dataUpdateNotification: null,
  dataWasUpdated: false,
  isLoading: false,

  loadFactionIndex: async () => {
    if (get().factionIndex || get().isLoading) return
    set({ isLoading: true, error: null })
    try {
      const index = await loadJSON<FactionIndex>(`${import.meta.env.BASE_URL}data/factions.json`)
      const previousUpdate = localStorage.getItem(LAST_UPDATE_KEY)
      const currentUpdate = index.lastUpdate
      let notification: string | null = null
      if (previousUpdate && previousUpdate !== currentUpdate) {
        notification = `Les données de jeu ont été mises à jour (${currentUpdate})`
      }
      localStorage.setItem(LAST_UPDATE_KEY, currentUpdate)
      set({ factionIndex: index, isLoading: false, dataUpdateNotification: notification, dataWasUpdated: !!notification })
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
      set({ error: msg, isLoading: false })
    }
  },

  loadFaction: async (slug: string) => {
    if (get().loadedFactions[slug]) {
      set({ selectedFactionSlug: slug })
      return
    }
    if (get().failedFactions.has(slug) || get().loadingFactions.has(slug)) return
    set((state) => ({
      loadingFactions: new Set(state.loadingFactions).add(slug),
      error: null,
    }))
    try {
      const faction = await loadJSON<Faction>(`${import.meta.env.BASE_URL}data/${slug}.json`)
      usePointsHistoryStore.getState().recordFaction(faction, get().dataWasUpdated)
      set((state) => {
        const loading = new Set(state.loadingFactions)
        loading.delete(slug)
        return {
          loadedFactions: { ...state.loadedFactions, [slug]: faction },
          selectedFactionSlug: slug,
          loadingFactions: loading,
        }
      })
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
      set((state) => {
        const loading = new Set(state.loadingFactions)
        loading.delete(slug)
        const failed = new Set(state.failedFactions)
        failed.add(slug)
        return { error: msg, loadingFactions: loading, failedFactions: failed }
      })
    }
  },

  preloadAllFactions: async () => {
    const state = get()
    const index = state.factionIndex
    if (!index) return
    const toLoad = index.factions
      .map((f) => f.slug)
      .filter((slug) => !state.loadedFactions[slug] && !state.failedFactions.has(slug) && !state.loadingFactions.has(slug))
    if (toLoad.length === 0) return
    const results = await Promise.allSettled(
      toLoad.map(async (slug) => {
        const faction = await loadJSON<Faction>(`${import.meta.env.BASE_URL}data/${slug}.json`)
        usePointsHistoryStore.getState().recordFaction(faction, get().dataWasUpdated)
        return { slug, faction }
      }),
    )
    const newFactions: Record<string, Faction> = {}
    for (const r of results) {
      if (r.status === 'fulfilled') newFactions[r.value.slug] = r.value.faction
    }
    set((s) => ({
      loadedFactions: { ...s.loadedFactions, ...newFactions },
    }))
  },

  selectFaction: (slug: string | null) => {
    set({ selectedFactionSlug: slug })
  },

  dismissDataNotification: () => {
    set({ dataUpdateNotification: null })
  },
}))

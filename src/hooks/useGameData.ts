import { useEffect } from 'react'
import { useGameDataStore } from '@/stores/gameDataStore'
import { useFactionTheme } from '@/hooks/useFactionTheme'

export function useGameData() {
  const {
    factionIndex,
    loadedFactions,
    selectedFactionSlug,
    isLoading: isLoadingIndex,
    loadingFactions,
    error,
    loadFactionIndex,
    loadFaction,
    selectFaction,
  } = useGameDataStore()

  const isLoading = isLoadingIndex || loadingFactions.size > 0

  useFactionTheme(selectedFactionSlug)

  useEffect(() => {
    loadFactionIndex()
  }, [loadFactionIndex])

  const selectedFaction = selectedFactionSlug
    ? loadedFactions[selectedFactionSlug] ?? null
    : null

  return {
    factionIndex,
    selectedFaction,
    selectedFactionSlug,
    isLoading,
    error,
    loadFaction,
    selectFaction,
  }
}

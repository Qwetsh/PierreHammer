import { useEffect } from 'react'

export function useFactionTheme(factionId: string | null) {
  useEffect(() => {
    if (factionId) {
      document.documentElement.dataset.faction = factionId
    } else {
      delete document.documentElement.dataset.faction
    }

    return () => {
      delete document.documentElement.dataset.faction
    }
  }, [factionId])
}

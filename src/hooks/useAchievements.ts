import { useMemo } from 'react'
import { useCollectionStore } from '@/stores/collectionStore'
import { useListsStore } from '@/stores/listsStore'
import { useGameDataStore } from '@/stores/gameDataStore'

export interface Achievement {
  id: string
  label: string
  icon: string
  unlocked: boolean
  category: 'paint' | 'collection' | 'factions' | 'lists'
}

export function useAchievements(): Achievement[] {
  const items = useCollectionStore((s) => s.items)
  const lists = useListsStore((s) => s.lists)
  const factionIndex = useGameDataStore((s) => s.factionIndex)

  return useMemo(() => {
    const allInstances = Object.values(items).flatMap((i) => i.instances)
    const totalUnits = Object.keys(items).length
    const paintedCount = allInstances.filter((s) => s === 'done').length
    const factionIds = new Set(Object.values(items).map((i) => i.factionId))
    const allLists = Object.values(lists)
    const maxPoints = allLists.reduce((max, l) => {
      const pts = l.units.reduce((s, u) => s + u.points + (u.enhancement?.cost || 0), 0)
      return Math.max(max, pts)
    }, 0)

    const totalFactions = factionIndex?.factions.length ?? 0
    const hasCompleteFaction = totalFactions > 0 && Array.from(factionIds).some((fid) => {
      const faction = factionIndex?.factions.find((f) => f.id === fid || f.slug === fid)
      if (!faction) return false
      return faction.datasheetCount > 0 && Object.values(items).filter((i) => i.factionId === fid).length >= faction.datasheetCount
    })

    return [
      { id: 'first-paint', label: 'Premier coup de pinceau', icon: '\u{1F3A8}', unlocked: paintedCount >= 1, category: 'paint' },
      { id: 'paint-10', label: '10 figurines peintes', icon: '\u{1F58C}', unlocked: paintedCount >= 10, category: 'paint' },
      { id: 'paint-50', label: '50 figurines peintes', icon: '\u{2728}', unlocked: paintedCount >= 50, category: 'paint' },
      { id: 'paint-100', label: '100 figurines peintes', icon: '\u{1F451}', unlocked: paintedCount >= 100, category: 'paint' },
      { id: 'first-unit', label: 'Premiere recrue', icon: '\u{1F396}', unlocked: totalUnits >= 1, category: 'collection' },
      { id: 'units-10', label: '10 unites', icon: '\u{1F6E1}', unlocked: totalUnits >= 10, category: 'collection' },
      { id: 'units-50', label: '50 unites', icon: '\u{2694}', unlocked: totalUnits >= 50, category: 'collection' },
      { id: 'units-100', label: 'Centurion', icon: '\u{1F3C6}', unlocked: totalUnits >= 100, category: 'collection' },
      { id: 'multi-faction', label: 'Multi-faction', icon: '\u{1F310}', unlocked: factionIds.size >= 2, category: 'factions' },
      { id: 'faction-complete', label: 'Faction complete', icon: '\u{1F31F}', unlocked: hasCompleteFaction, category: 'factions' },
      { id: 'first-list', label: 'Premiere liste', icon: '\u{1F4CB}', unlocked: allLists.length >= 1, category: 'lists' },
      { id: 'grand-army', label: 'Grande armee (2000pts)', icon: '\u{1F3F0}', unlocked: maxPoints >= 2000, category: 'lists' },
    ]
  }, [items, lists, factionIndex])
}

import { useMemo } from 'react'
import { useCollectionStore } from '@/stores/collectionStore'
import { useListsStore } from '@/stores/listsStore'
import { useGameDataStore } from '@/stores/gameDataStore'
import { useFriendsStore } from '@/stores/friendsStore'
import { useAuthStore } from '@/stores/authStore'

export type AchievementCategory = 'paint' | 'collection' | 'factions' | 'lists' | 'social'

export interface Achievement {
  id: string
  label: string
  description: string
  icon: string
  unlocked: boolean
  current: number
  target: number
  category: AchievementCategory
}

export function useAchievements(): Achievement[] {
  const items = useCollectionStore((s) => s.items)
  const lists = useListsStore((s) => s.lists)
  const factionIndex = useGameDataStore((s) => s.factionIndex)
  const friends = useFriendsStore((s) => s.friends)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const profile = useFriendsStore((s) => s.profile)

  return useMemo(() => {
    const allInstances = Object.values(items).flatMap((i) => i.instances)
    const totalUnits = Object.keys(items).length
    const paintedCount = allInstances.filter((s) => s === 'done').length
    const factionIds = new Set(Object.values(items).map((i) => i.factionId))
    const allLists = Object.values(lists)
    const listFactionIds = new Set(allLists.map((l) => l.factionId))
    const maxUnitsInList = allLists.reduce((max, l) => Math.max(max, l.units.length), 0)
    const friendCount = friends.length
    const hasUsername = !!(profile?.username)

    // Max units in a single faction
    const unitsByFaction: Record<string, number> = {}
    for (const item of Object.values(items)) {
      unitsByFaction[item.factionId] = (unitsByFaction[item.factionId] || 0) + 1
    }
    const maxUnitsInFaction = Math.max(0, ...Object.values(unitsByFaction))

    const hasCompleteFaction = (factionIndex?.factions.length ?? 0) > 0 && Array.from(factionIds).some((fid) => {
      const faction = factionIndex?.factions.find((f) => f.id === fid || f.slug === fid)
      if (!faction) return false
      return faction.datasheetCount > 0 && Object.values(items).filter((i) => i.factionId === fid).length >= faction.datasheetCount
    })

    return [
      // ── Peinture (6) ──
      { id: 'first-paint', label: 'Premier coup de pinceau', description: 'Peins ta première figurine', icon: '\u{1F3A8}', unlocked: paintedCount >= 1, current: Math.min(paintedCount, 1), target: 1, category: 'paint' },
      { id: 'paint-10', label: 'Atelier actif', description: 'Peins 10 figurines', icon: '\u{1F58C}', unlocked: paintedCount >= 10, current: Math.min(paintedCount, 10), target: 10, category: 'paint' },
      { id: 'paint-25', label: 'Maitre peintre', description: 'Peins 25 figurines', icon: '\u{2728}', unlocked: paintedCount >= 25, current: Math.min(paintedCount, 25), target: 25, category: 'paint' },
      { id: 'paint-50', label: 'Artiste de guerre', description: 'Peins 50 figurines', icon: '\u{1F3AD}', unlocked: paintedCount >= 50, current: Math.min(paintedCount, 50), target: 50, category: 'paint' },
      { id: 'paint-75', label: 'Legende doree', description: 'Peins 75 figurines', icon: '\u{1F451}', unlocked: paintedCount >= 75, current: Math.min(paintedCount, 75), target: 75, category: 'paint' },
      { id: 'paint-150', label: 'Legende vivante', description: 'Peins 150 figurines', icon: '\u{1F3C6}', unlocked: paintedCount >= 150, current: Math.min(paintedCount, 150), target: 150, category: 'paint' },

      // ── Collection (6) ──
      { id: 'first-unit', label: 'Premiere recrue', description: 'Ajoute ta première unité', icon: '\u{1F396}', unlocked: totalUnits >= 1, current: Math.min(totalUnits, 1), target: 1, category: 'collection' },
      { id: 'units-5', label: 'Patrouille', description: 'Possède 5 unités différentes', icon: '\u{1F50D}', unlocked: totalUnits >= 5, current: Math.min(totalUnits, 5), target: 5, category: 'collection' },
      { id: 'units-15', label: 'Escouade', description: 'Possède 15 unités différentes', icon: '\u{1F6E1}', unlocked: totalUnits >= 15, current: Math.min(totalUnits, 15), target: 15, category: 'collection' },
      { id: 'units-30', label: 'Bataillon', description: 'Possède 30 unités différentes', icon: '\u{2694}', unlocked: totalUnits >= 30, current: Math.min(totalUnits, 30), target: 30, category: 'collection' },
      { id: 'units-50', label: 'Regiment', description: 'Possède 50 unités différentes', icon: '\u{1F3F0}', unlocked: totalUnits >= 50, current: Math.min(totalUnits, 50), target: 50, category: 'collection' },
      { id: 'units-100', label: 'Legion', description: 'Possède 100 unités différentes', icon: '\u{1F30C}', unlocked: totalUnits >= 100, current: Math.min(totalUnits, 100), target: 100, category: 'collection' },

      // ── Factions (6) ──
      { id: 'faction-2', label: 'Heretique', description: 'Collectionne 2 factions', icon: '\u{1F608}', unlocked: factionIds.size >= 2, current: Math.min(factionIds.size, 2), target: 2, category: 'factions' },
      { id: 'faction-3', label: 'Explorateur', description: 'Collectionne 3 factions', icon: '\u{1F9ED}', unlocked: factionIds.size >= 3, current: Math.min(factionIds.size, 3), target: 3, category: 'factions' },
      { id: 'faction-5', label: 'Diplomate', description: 'Collectionne 5 factions', icon: '\u{1F310}', unlocked: factionIds.size >= 5, current: Math.min(factionIds.size, 5), target: 5, category: 'factions' },
      { id: 'faction-8', label: 'Maitre de guerre', description: 'Collectionne 8 factions', icon: '\u{1F525}', unlocked: factionIds.size >= 8, current: Math.min(factionIds.size, 8), target: 8, category: 'factions' },
      { id: 'faction-devoted', label: 'Devoue', description: 'Possède 20+ unités d\'une même faction', icon: '\u{269C}', unlocked: maxUnitsInFaction >= 20, current: Math.min(maxUnitsInFaction, 20), target: 20, category: 'factions' },
      { id: 'faction-complete', label: 'Faction complete', description: 'Possède toutes les unités d\'une faction', icon: '\u{1F31F}', unlocked: hasCompleteFaction, current: hasCompleteFaction ? 1 : 0, target: 1, category: 'factions' },

      // ── Listes (6) ──
      { id: 'first-list', label: 'Premiere liste', description: 'Crée ta première liste d\'armée', icon: '\u{1F4CB}', unlocked: allLists.length >= 1, current: Math.min(allLists.length, 1), target: 1, category: 'lists' },
      { id: 'lists-3', label: 'Tacticien', description: 'Crée 3 listes d\'armée', icon: '\u{1F4DD}', unlocked: allLists.length >= 3, current: Math.min(allLists.length, 3), target: 3, category: 'lists' },
      { id: 'lists-5', label: 'Stratege', description: 'Crée 5 listes d\'armée', icon: '\u{1F9E0}', unlocked: allLists.length >= 5, current: Math.min(allLists.length, 5), target: 5, category: 'lists' },
      { id: 'lists-10', label: 'Archiviste', description: 'Crée 10 listes d\'armée', icon: '\u{1F4DA}', unlocked: allLists.length >= 10, current: Math.min(allLists.length, 10), target: 10, category: 'lists' },
      { id: 'versatile', label: 'Versatile', description: 'Crée des listes pour 3 factions différentes', icon: '\u{1F500}', unlocked: listFactionIds.size >= 3, current: Math.min(listFactionIds.size, 3), target: 3, category: 'lists' },
      { id: 'big-list', label: 'Armee garnie', description: 'Crée une liste avec 10+ unités', icon: '\u{1F6A9}', unlocked: maxUnitsInList >= 10, current: Math.min(maxUnitsInList, 10), target: 10, category: 'lists' },

      // ── Social (6) ──
      { id: 'account', label: 'Enregistre', description: 'Crée ton compte PierreHammer', icon: '\u{1F4E1}', unlocked: isAuthenticated, current: isAuthenticated ? 1 : 0, target: 1, category: 'social' },
      { id: 'username', label: 'Identifie', description: 'Choisis un pseudo', icon: '\u{1F3F7}', unlocked: hasUsername, current: hasUsername ? 1 : 0, target: 1, category: 'social' },
      { id: 'first-friend', label: 'Premier allie', description: 'Ajoute ton premier ami', icon: '\u{1F91D}', unlocked: friendCount >= 1, current: Math.min(friendCount, 1), target: 1, category: 'social' },
      { id: 'friends-3', label: 'Escouade sociale', description: 'Ajoute 3 amis', icon: '\u{1F465}', unlocked: friendCount >= 3, current: Math.min(friendCount, 3), target: 3, category: 'social' },
      { id: 'friends-5', label: 'Fraternite', description: 'Ajoute 5 amis', icon: '\u{1F46A}', unlocked: friendCount >= 5, current: Math.min(friendCount, 5), target: 5, category: 'social' },
      { id: 'friends-10', label: 'Seigneur de guerre', description: 'Ajoute 10 amis', icon: '\u{1F451}', unlocked: friendCount >= 10, current: Math.min(friendCount, 10), target: 10, category: 'social' },
    ]
  }, [items, lists, factionIndex, friends, isAuthenticated, profile])
}

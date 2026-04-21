import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router'
import { useFactionTheme } from '@/hooks/useFactionTheme'
import { useGameDataStore } from '@/stores/gameDataStore'
import { fetchPublicLists } from '@/services/listsSyncService'
import { calculateTotalPoints, countSquads } from '@/utils/pointsCalculator'
import { getProfile } from '@/services/friendsService'
import type { ArmyList } from '@/types/armyList.types'
import type { Profile } from '@/services/friendsService'

export function FriendListsPage() {
  const { friendId } = useParams<{ friendId: string }>()
  const navigate = useNavigate()
  const loadedFactions = useGameDataStore((s) => s.loadedFactions)
  const loadFaction = useGameDataStore((s) => s.loadFaction)

  const [lists, setLists] = useState<ArmyList[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useFactionTheme(null)

  useEffect(() => {
    if (!friendId) return
    setLoading(true)
    Promise.all([
      fetchPublicLists(friendId),
      getProfile(friendId),
    ]).then(([publicLists, friendProfile]) => {
      setLists(publicLists)
      setProfile(friendProfile)
      // Load faction data for each list
      const factionIds = new Set(publicLists.map((l) => l.factionId))
      factionIds.forEach((id) => loadFaction(id))
      setLoading(false)
    })
  }, [friendId, loadFaction])

  const totalPoints = (list: ArmyList) => {
    const faction = loadedFactions[list.factionId]
    return calculateTotalPoints(list.units, faction?.datasheets)
  }

  return (
    <div className="p-4">
      <button
        className="text-sm mb-4 bg-transparent border-none cursor-pointer"
        style={{ color: 'var(--color-accent)' }}
        onClick={() => navigate('/friends')}
      >
        ← Retour aux amis
      </button>

      <h1 className="font-bold mb-4" style={{ fontSize: 'var(--text-xl)' }}>
        Listes de {profile?.username || profile?.display_name || 'Ami'}
      </h1>

      {loading && (
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Chargement...</p>
      )}

      {!loading && lists.length === 0 && (
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Aucune liste publique.
        </p>
      )}

      {lists.map((list) => (
        <div
          key={list.id}
          className="rounded-lg p-3 mb-3 cursor-pointer"
          style={{ backgroundColor: 'var(--color-surface)' }}
          onClick={() => navigate(`/lists/${list.id}`)}
        >
          <h3 className="font-semibold" style={{ color: 'var(--color-text)' }}>{list.name}</h3>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            {list.factionId} · {list.detachment} · {countSquads(list.units)} escouade{countSquads(list.units) > 1 ? 's' : ''} · {totalPoints(list)}/{list.pointsLimit} pts
          </p>
        </div>
      ))}
    </div>
  )
}

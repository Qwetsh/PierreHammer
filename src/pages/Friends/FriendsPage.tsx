import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { useAuthStore } from '@/stores/authStore'
import { useFriendsStore } from '@/stores/friendsStore'
import { useFactionTheme } from '@/hooks/useFactionTheme'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import type { Friendship } from '@/services/friendsService'

function getFriendProfile(friendship: Friendship, myUserId: string) {
  if (friendship.requester_id === myUserId) {
    return friendship.addressee
  }
  return friendship.requester
}

export function FriendsPage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  const friends = useFriendsStore((s) => s.friends)
  const pendingRequests = useFriendsStore((s) => s.pendingRequests)
  const loading = useFriendsStore((s) => s.loading)
  const searchResults = useFriendsStore((s) => s.searchResults)
  const searching = useFriendsStore((s) => s.searching)
  const loadFriends = useFriendsStore((s) => s.loadFriends)
  const loadPendingRequests = useFriendsStore((s) => s.loadPendingRequests)
  const searchUsers = useFriendsStore((s) => s.searchUsers)
  const sendRequest = useFriendsStore((s) => s.sendRequest)
  const respondToRequest = useFriendsStore((s) => s.respondToRequest)
  const removeFriend = useFriendsStore((s) => s.removeFriend)

  const [searchQuery, setSearchQuery] = useState('')

  useFactionTheme(null)

  useEffect(() => {
    if (isAuthenticated) {
      loadFriends()
      loadPendingRequests()
    }
  }, [isAuthenticated, loadFriends, loadPendingRequests])

  useEffect(() => {
    const timer = setTimeout(() => {
      searchUsers(searchQuery)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery, searchUsers])

  if (!isAuthenticated) {
    return (
      <div className="p-4">
        <h1 className="font-bold mb-4" style={{ fontSize: 'var(--text-xl)' }}>Amis</h1>
        <EmptyState
          title="Connexion requise"
          description="Connecte-toi pour ajouter des amis et voir leurs listes."
        />
      </div>
    )
  }

  return (
    <div className="p-4">
      <h1 className="font-bold mb-4" style={{ fontSize: 'var(--text-xl)' }}>Amis</h1>

      {/* Search bar */}
      <div className="mb-4">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Rechercher par pseudo..."
          className="w-full rounded-lg px-3 py-2 bg-transparent outline-none min-h-[44px]"
          style={{ color: 'var(--color-text)', border: '1px solid var(--color-text-muted)' }}
          aria-label="Rechercher un utilisateur"
        />
      </div>

      {/* Search results */}
      {searchQuery.trim() && (
        <div className="mb-4">
          <h2 className="text-sm font-semibold mb-2" style={{ color: 'var(--color-text-muted)' }}>
            Résultats {searching && '...'}
          </h2>
          {searchResults.length === 0 && !searching && (
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Aucun résultat</p>
          )}
          {searchResults.map((profile) => {
            const alreadyFriend = friends.some(
              (f) => f.requester_id === profile.id || f.addressee_id === profile.id,
            )
            return (
              <div
                key={profile.id}
                className="flex items-center justify-between rounded-lg p-3 mb-2"
                style={{ backgroundColor: 'var(--color-surface)' }}
              >
                <span style={{ color: 'var(--color-text)' }}>{profile.username || profile.display_name || 'Sans pseudo'}</span>
                {alreadyFriend ? (
                  <span className="text-xs" style={{ color: 'var(--color-success)' }}>Ami</span>
                ) : (
                  <Button variant="primary" size="sm" onClick={() => sendRequest(profile.id)}>
                    Ajouter
                  </Button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Pending requests */}
      {pendingRequests.length > 0 && (
        <div className="mb-4">
          <h2 className="text-sm font-semibold mb-2" style={{ color: 'var(--color-text-muted)' }}>
            Demandes en attente ({pendingRequests.length})
          </h2>
          {pendingRequests.map((req) => (
            <div
              key={req.id}
              className="flex items-center justify-between rounded-lg p-3 mb-2"
              style={{ backgroundColor: 'var(--color-surface)' }}
            >
              <span style={{ color: 'var(--color-text)' }}>
                {req.requester?.username || req.requester?.display_name || 'Utilisateur inconnu'}
              </span>
              <div className="flex gap-2">
                <Button variant="primary" size="sm" onClick={() => respondToRequest(req.id, true)}>
                  Accepter
                </Button>
                <Button variant="ghost" size="sm" onClick={() => respondToRequest(req.id, false)}>
                  Refuser
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Friends list */}
      <div>
        <h2 className="text-sm font-semibold mb-2" style={{ color: 'var(--color-text-muted)' }}>
          Mes amis ({friends.length})
        </h2>
        {loading && <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Chargement...</p>}
        {!loading && friends.length === 0 && (
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Aucun ami pour le moment. Recherche un joueur par son pseudo !
          </p>
        )}
        {friends.map((friendship) => {
          const friend = getFriendProfile(friendship, user!.id)
          return (
            <div
              key={friendship.id}
              className="flex items-center justify-between rounded-lg p-3 mb-2 cursor-pointer"
              style={{ backgroundColor: 'var(--color-surface)' }}
              onClick={() => navigate(`/friends/${friend?.id}/lists`)}
            >
              <span style={{ color: 'var(--color-text)' }}>
                {friend?.username || friend?.display_name || 'Sans pseudo'}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Voir listes</span>
                <button
                  className="text-xs px-2 py-1 rounded bg-transparent border-none cursor-pointer"
                  style={{ color: 'var(--color-error)' }}
                  onClick={(e) => {
                    e.stopPropagation()
                    removeFriend(friendship.id)
                  }}
                >
                  Retirer
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

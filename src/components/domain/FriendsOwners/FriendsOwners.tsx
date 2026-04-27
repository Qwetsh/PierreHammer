import { useState, useEffect } from 'react'
import { getFriendsWithDatasheet } from '@/services/friendsService'
import type { FriendOwner } from '@/services/friendsService'
import { supabase } from '@/lib/supabase'

interface FriendsOwnersProps {
  datasheetId: string
}

export function FriendsOwners({ datasheetId }: FriendsOwnersProps) {
  const [friends, setFriends] = useState<FriendOwner[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      const { data: { user } } = await supabase!.auth.getUser()
      if (!user || cancelled) {
        setLoading(false)
        return
      }
      setLoading(true)
      const result = await getFriendsWithDatasheet(datasheetId)
      if (!cancelled) {
        setFriends(result)
        setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [datasheetId])

  if (loading) {
    return (
      <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 12, marginTop: 8 }}>
        <div style={{
          fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 700,
          color: 'var(--color-accent)', letterSpacing: 1, marginBottom: 6,
          textTransform: 'uppercase',
        }}>
          Amis qui possèdent
        </div>
        <div style={{ fontSize: 9, color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
          Chargement...
        </div>
      </div>
    )
  }

  if (friends.length === 0) return null

  return (
    <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 12, marginTop: 8 }}>
      <div style={{
        fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 700,
        color: 'var(--color-accent)', letterSpacing: 1, marginBottom: 8,
        textTransform: 'uppercase',
      }}>
        Amis qui possèdent ({friends.length})
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {friends.map((f) => {
          const name = f.username || f.display_name || 'Anonyme'
          const initial = name.charAt(0).toUpperCase()
          return (
            <div
              key={f.user_id}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '4px 10px 4px 4px',
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 20,
              }}
            >
              <div style={{
                width: 22, height: 22, borderRadius: '50%',
                background: 'color-mix(in srgb, var(--color-accent) 20%, transparent)',
                border: '1px solid var(--color-accent)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, fontWeight: 700, color: 'var(--color-accent)',
                fontFamily: 'var(--font-mono)',
              }}>
                {initial}
              </div>
              <span style={{
                fontSize: 10, fontFamily: 'var(--font-mono)',
                color: 'var(--color-text)', fontWeight: 500,
              }}>
                {name}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

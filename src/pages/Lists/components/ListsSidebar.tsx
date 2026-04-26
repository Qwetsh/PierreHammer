import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { useListsStore } from '@/stores/listsStore'
import { useGameDataStore } from '@/stores/gameDataStore'
import { useAuthStore } from '@/stores/authStore'
import { calculateTotalPoints } from '@/utils/pointsCalculator'
import { HudBar, HudPill } from '@/components/ui/Hud'
import { MSection } from '@/components/ui/Hud'

export function ListsSidebar({ onCreateClick, onListSelect }: { onCreateClick?: () => void; onListSelect?: (listId: string) => void }) {
  const navigate = useNavigate()
  const { listId: activeListId } = useParams<{ listId: string }>()
  const lists = useListsStore((s) => s.lists)
  const getAllLists = useListsStore((s) => s.getAllLists)
  const deleteList = useListsStore((s) => s.deleteList)
  const loadedFactions = useGameDataStore((s) => s.loadedFactions)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const allLists = getAllLists()

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const totalPoints = (listId: string) => {
    const list = lists[listId]
    if (!list) return 0
    const faction = loadedFactions[list.factionId]
    return calculateTotalPoints(list.units, faction?.datasheets)
  }

  // Faction abbreviation (first 3 chars uppercase)
  const factionAbbr = (factionId: string) => factionId.slice(0, 3).toUpperCase()

  // Faction badge color based on faction
  const factionColor = (factionId: string) => {
    const faction = loadedFactions[factionId]
    if (!faction) return 'var(--color-text-muted)'
    return 'var(--color-primary)'
  }

  return (
    <div
      style={{
        width: 260,
        flexShrink: 0,
        borderRight: '1px solid var(--color-border)',
        background: 'var(--color-bg-elevated)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      <div style={{ padding: '12px 16px 8px' }}>
        <MSection>Mes Listes ({allLists.length})</MSection>
      </div>

      {/* Scrollable list */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '0 12px',
          scrollbarWidth: 'thin',
        }}
      >
        {allLists.length === 0 && (
          <div style={{ padding: '12px 4px', color: 'var(--color-text-muted)', fontSize: 11, fontFamily: 'var(--font-mono)', textAlign: 'center' }}>
            Aucune liste
          </div>
        )}
        {allLists.map((list) => {
          const pts = totalPoints(list.id)
          const pct = Math.min(100, (pts / list.pointsLimit) * 100)
          const overBudget = pts > list.pointsLimit
          const isActive = list.id === activeListId

          return (
            <div
              key={list.id}
              onClick={() => onListSelect ? onListSelect(list.id) : navigate(`/lists/${list.id}`)}
              style={{
                padding: '10px 12px',
                marginBottom: 4,
                cursor: 'pointer',
                background: isActive ? 'var(--color-surface)' : 'transparent',
                borderLeft: isActive ? '2px solid var(--color-accent)' : '2px solid transparent',
                transition: 'background 0.15s, border-color 0.15s',
              }}
              onContextMenu={(e) => {
                e.preventDefault()
                setConfirmDeleteId(confirmDeleteId === list.id ? null : list.id)
              }}
            >
              {/* Row 1: faction badge + name + sync */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '1px 5px',
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: 0.5,
                    fontFamily: 'var(--font-mono)',
                    color: '#fff',
                    background: factionColor(list.factionId),
                  }}
                >
                  {factionAbbr(list.factionId)}
                </span>
                <span
                  style={{
                    flex: 1,
                    fontSize: 13,
                    fontWeight: 600,
                    color: 'var(--color-text)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {list.name}
                </span>
                {isAuthenticated && list.remoteId && (
                  <HudPill color="var(--color-success)">SYNC</HudPill>
                )}
                {isAuthenticated && !list.remoteId && (
                  <HudPill color="var(--color-warning)">LOCAL</HudPill>
                )}
              </div>

              {/* Row 2: detachment */}
              <div
                style={{
                  fontSize: 10,
                  color: 'var(--color-text-muted)',
                  fontFamily: 'var(--font-mono)',
                  letterSpacing: 0.3,
                  marginBottom: 6,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {list.detachment}
              </div>

              {/* Row 3: points bar + counter */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <HudBar
                    value={pct}
                    max={100}
                    color={overBudget ? 'var(--color-error)' : 'var(--color-accent)'}
                    height={3}
                  />
                </div>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 12,
                    fontWeight: 600,
                    color: overBudget ? 'var(--color-error)' : 'var(--color-accent)',
                    flexShrink: 0,
                  }}
                >
                  {pts}
                  <span style={{ color: 'var(--color-text-muted)', fontSize: 10 }}>
                    /{list.pointsLimit}
                  </span>
                </span>
              </div>

              {/* Delete confirmation */}
              {confirmDeleteId === list.id && (
                <div style={{ marginTop: 6, display: 'flex', gap: 6 }}>
                  <button
                    style={{
                      flex: 1,
                      padding: '4px 0',
                      fontSize: 9,
                      fontFamily: 'var(--font-mono)',
                      letterSpacing: 1,
                      background: 'var(--color-error)',
                      color: '#fff',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteList(list.id)
                      setConfirmDeleteId(null)
                      if (list.id === activeListId) navigate('/lists')
                    }}
                  >
                    SUPPRIMER
                  </button>
                  <button
                    style={{
                      flex: 1,
                      padding: '4px 0',
                      fontSize: 9,
                      fontFamily: 'var(--font-mono)',
                      letterSpacing: 1,
                      background: 'transparent',
                      color: 'var(--color-text-muted)',
                      border: '1px solid var(--color-border)',
                      cursor: 'pointer',
                    }}
                    onClick={(e) => {
                      e.stopPropagation()
                      setConfirmDeleteId(null)
                    }}
                  >
                    ANNULER
                  </button>
                </div>
              )}
            </div>
          )
        })}

        {/* New list button — flows after the last list */}
        <div style={{ padding: '8px 0 12px' }}>
          <button
            onClick={onCreateClick}
            style={{
              width: '100%',
              padding: '10px 0',
              fontSize: 11,
              fontFamily: 'var(--font-mono)',
              letterSpacing: 1,
              color: 'var(--color-accent)',
              background: 'transparent',
              border: '1px solid var(--color-border)',
              cursor: 'pointer',
              transition: 'border-color 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--color-accent)')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--color-border)')}
          >
            + NOUVELLE LISTE
          </button>
        </div>
      </div>
    </div>
  )
}

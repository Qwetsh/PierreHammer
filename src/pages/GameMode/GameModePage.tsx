import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router'
import { motion } from 'motion/react'
import { useListsStore } from '@/stores/listsStore'
import { useGameDataStore } from '@/stores/gameDataStore'
import { useAuthStore } from '@/stores/authStore'
import { useFriendsStore } from '@/stores/friendsStore'
import { useGameSessionStore } from '@/stores/gameSessionStore'
import { fetchPublicLists } from '@/services/listsSyncService'
import { EmptyState } from '@/components/ui/EmptyState'
import { HudBtn, HudPointsCounter, MSection } from '@/components/ui/Hud'
import { UnitSheet } from '@/components/domain/UnitSheet/UnitSheet'
import { SimulatorPage } from '@/pages/Simulator/SimulatorPage'
import { calculateTotalPoints, resolveUnitPoints } from '@/utils/pointsCalculator'
import type { ArmyList } from '@/types/armyList.types'
import type { Datasheet, Detachment } from '@/types/gameData.types'
import { T } from '@/components/ui/TranslatableText'
import { THtml } from '@/components/ui/TranslatableText'
import type { ListUnit } from '@/types/armyList.types'
import type { Profile } from '@/services/friendsService'

function getModelCount(unit: ListUnit, ds?: Datasheet): number {
  if (!ds || ds.pointOptions.length === 0) return 1
  const opt = ds.pointOptions[unit.selectedPointOptionIndex] ?? ds.pointOptions[0]
  return parseInt(String(opt.models), 10) || 1
}

function isMultiWound(ds: Datasheet): boolean {
  const w = parseInt(ds.profiles[0]?.W ?? '1', 10)
  return w > 1
}

function profileDisplayName(p: { username?: string | null; display_name?: string | null; id: string }): string {
  return p.username || p.display_name || p.id.slice(0, 8)
}

function useIsDesktop(breakpoint = 1024) {
  const [v, setV] = useState(() => typeof window !== 'undefined' ? window.innerWidth >= breakpoint : false)
  useEffect(() => {
    const mql = window.matchMedia(`(min-width: ${breakpoint}px)`)
    const h = (e: MediaQueryListEvent) => setV(e.matches)
    mql.addEventListener('change', h)
    return () => mql.removeEventListener('change', h)
  }, [breakpoint])
  return v
}

// Stratagem type color
function stratTypeColor(type: string): string {
  if (type.toLowerCase().includes('battle tactic')) return 'var(--color-accent)'
  if (type.toLowerCase().includes('epic')) return 'var(--color-purple)'
  return 'var(--color-gold)'
}

export function GameModePage() {
  const { listId } = useParams<{ listId: string }>()
  const navigate = useNavigate()
  const isDesktop = useIsDesktop()
  const list = useListsStore((s) => listId ? s.lists[listId] : undefined)
  const loadFaction = useGameDataStore((s) => s.loadFaction)
  const loadedFactions = useGameDataStore((s) => s.loadedFactions)
  const user = useAuthStore((s) => s.user)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const friends = useFriendsStore((s) => s.friends)
  const loadFriends = useFriendsStore((s) => s.loadFriends)

  const activeSession = useGameSessionStore((s) => s.activeSession)
  const opponentProfile = useGameSessionStore((s) => s.opponentProfile)
  const opponentList = useGameSessionStore((s) => s.opponentList)
  const startSession = useGameSessionStore((s) => s.startSession)
  const loadSession = useGameSessionStore((s) => s.loadSession)
  const endSessionAction = useGameSessionStore((s) => s.endSession)
  const casualties = useGameSessionStore((s) => s.casualties)
  const opponentCasualties = useGameSessionStore((s) => s.opponentCasualties)
  const updateCasualty = useGameSessionStore((s) => s.updateCasualty)
  const resetCasualtyAction = useGameSessionStore((s) => s.resetCasualty)

  const [viewingUnit, setViewingUnit] = useState<{ listUnit: ListUnit; ds: Datasheet } | null>(null)
  const [activeTab, setActiveTab] = useState<'units' | 'stratagems' | 'opponent'>('units')
  const [usedStratagems, setUsedStratagems] = useState<Set<string>>(new Set())

  const [attackingUnit, setAttackingUnit] = useState<{ unit: ListUnit; ds: Datasheet } | null>(null)
  const [showTargetPicker, setShowTargetPicker] = useState(false)

  // Simulator modal state
  const [simParams, setSimParams] = useState<{
    attackerFaction: string
    attackerDs: string
    attackerWeapons: string[]
    defenderFaction: string
    defenderDs: string
  } | null>(null)

  const [showOpponentPicker, setShowOpponentPicker] = useState(false)
  const [selectedFriend, setSelectedFriend] = useState<Profile | null>(null)
  const [friendLists, setFriendLists] = useState<(ArmyList & { remoteId: string })[]>([])
  const [loadingFriendLists, setLoadingFriendLists] = useState(false)

  useEffect(() => {
    if (list) loadFaction(list.factionId)
  }, [list, loadFaction])

  useEffect(() => {
    if (isAuthenticated && user) {
      loadFriends()
      loadSession(user.id)
    }
  }, [isAuthenticated, user, loadFriends, loadSession])

  if (!list || !listId) {
    return (
      <motion.div
        className="fixed inset-0 z-50 flex flex-col"
        style={{ backgroundColor: 'var(--color-bg)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div style={{ padding: 16 }}>
          <HudBtn variant="ghost" onClick={() => navigate(-1)}>&#8592; Retour</HudBtn>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <EmptyState
            title="Liste introuvable"
            description="Cette liste n'existe plus."
            actionLabel="Voir mes listes"
            onAction={() => navigate('/lists')}
          />
        </div>
      </motion.div>
    )
  }

  const faction = loadedFactions[list.factionId]
  const totalPoints = calculateTotalPoints(list.units, faction?.datasheets)

  const detachment: Detachment | undefined = faction?.detachments?.find(
    (d) => d.id === list.detachmentId || d.name === list.detachment,
  )

  const toggleStratagem = (id: string) => {
    setUsedStratagems((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleSelectFriend = async (friend: Profile) => {
    setSelectedFriend(friend)
    setLoadingFriendLists(true)
    const lists = await fetchPublicLists(friend.id)
    setFriendLists(lists)
    setLoadingFriendLists(false)
  }

  const handleSelectOpponentList = async (opponentListId: string) => {
    if (!user || !list.remoteId) return
    const friendId = selectedFriend?.id
    if (!friendId) return
    await startSession(user.id, list.remoteId, friendId, opponentListId)
    setShowOpponentPicker(false)
    setSelectedFriend(null)
    setFriendLists([])
  }

  const opponentFaction = opponentList ? loadedFactions[opponentList.factionId] : null

  const handleEndSession = async (status: 'completed' | 'abandoned') => {
    await endSessionAction(status, {
      player1Faction: faction?.name ?? list.factionId,
      player2Faction: opponentFaction?.name ?? opponentList?.factionId ?? '',
      player1Detachment: list.detachment,
      player2Detachment: opponentList?.detachment ?? '',
    })
    setActiveTab('units')
  }

  const handleAttack = (unit: ListUnit, ds: Datasheet) => {
    setAttackingUnit({ unit, ds })
    setShowTargetPicker(true)
  }

  const handleSelectTarget = (_unit: ListUnit, ds: Datasheet) => {
    if (!attackingUnit) return
    const defFactionId = hasSession && opponentList ? opponentList.factionId : list.factionId
    setShowTargetPicker(false)
    setAttackingUnit(null)
    setSimParams({
      attackerFaction: list.factionId,
      attackerDs: attackingUnit.ds.id,
      attackerWeapons: attackingUnit.unit.selectedWeapons ?? [],
      defenderFaction: defFactionId,
      defenderDs: ds.id,
    })
  }


  const getFriendProfile = (f: { requester?: Profile; addressee?: Profile }): Profile | undefined => {
    if (!user) return undefined
    return f.requester?.id === user.id ? f.addressee : f.requester
  }

  const viewingDatasheet = viewingUnit?.ds ?? null

  const hasSession = !!activeSession
  const hasStratagems = detachment && detachment.stratagems.length > 0

  // =============================================
  // Shared unit row renderer
  // =============================================
  const renderUnitRow = (
    listUnit: ListUnit,
    i: number,
    factionData: typeof faction | null,
    cas: { modelsDestroyed: number; woundsRemaining: number | null } | null,
    playerId: string,
    isOpponent: boolean,
  ) => {
    const datasheet = factionData?.datasheets.find((ds) => ds.id === listUnit.datasheetId)
    const totalModels = getModelCount(listUnit, datasheet)
    const alive = cas ? totalModels - cas.modelsDestroyed : totalModels
    const isDestroyed = cas ? alive <= 0 : false
    const pts = resolveUnitPoints(listUnit, factionData?.datasheets)
    const profile = datasheet?.profiles[0]

    return (
      <div
        key={i}
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          padding: isDesktop ? '12px 16px' : '10px 12px',
          opacity: isDestroyed ? 0.35 : 1,
          transition: 'opacity 0.2s',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: isDesktop ? 14 : 8 }}>
          {/* Unit image (desktop only) */}
          {isDesktop && datasheet?.imageUrl && (
            <img
              src={datasheet.imageUrl}
              alt={listUnit.datasheetName}
              style={{
                width: 40,
                height: 40,
                objectFit: 'cover',
                borderRadius: 4,
                background: 'var(--color-bg)',
                flexShrink: 0,
              }}
            />
          )}

          {/* Name + stats */}
          <div
            style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}
            onClick={() => {
              if (!datasheet) return
              setViewingUnit({ listUnit: listUnit, ds: datasheet })
            }}
          >
            <div style={{
              fontSize: isDesktop ? 14 : 13,
              fontWeight: 600,
              color: 'var(--color-text)',
              textDecoration: isDestroyed ? 'line-through' : 'none',
            }}>
              <T text={listUnit.datasheetName} category="unit" />
            </div>
            {profile && isDesktop && (
              <div style={{
                fontSize: 10,
                color: 'var(--color-text-muted)',
                fontFamily: 'var(--font-mono)',
                letterSpacing: 0.3,
                marginTop: 2,
              }}>
                M{profile.M} T{profile.T} SV{profile.Sv} W{profile.W} LD{profile.Ld} OC{profile.OC}
              </div>
            )}
            {listUnit.enhancement && (
              <div style={{ fontSize: 10, color: 'var(--color-accent)', marginTop: 2 }}>
                &#10022; {listUnit.enhancement.enhancementName} (+{listUnit.enhancement.cost} pts)
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            {!isOpponent && datasheet && datasheet.weapons.length > 0 && (
              <button
                onClick={() => handleAttack(listUnit, datasheet)}
                style={{
                  padding: isDesktop ? '5px 12px' : '4px 8px',
                  fontSize: 10,
                  fontFamily: 'var(--font-mono)',
                  letterSpacing: 0.5,
                  fontWeight: 600,
                  background: 'var(--color-accent)',
                  color: '#000',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                ATTAQUER
              </button>
            )}
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: isDesktop ? 14 : 12,
              fontWeight: 600,
              color: 'var(--color-accent)',
              minWidth: isDesktop ? 50 : 40,
              textAlign: 'right',
            }}>
              {pts} <span style={{ fontSize: 9, color: 'var(--color-text-muted)' }}>pts</span>
            </span>
          </div>
        </div>

        {/* Casualty tracking */}
        {cas && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginTop: 8,
            paddingTop: 8,
            borderTop: '1px solid var(--color-border)',
          }}>
            {/* Model counter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)', letterSpacing: 0.5 }}>
                MODELES
              </span>
              <button
                style={{
                  width: 24, height: 24,
                  background: 'var(--color-bg)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-error)',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
                onClick={() => updateCasualty(playerId, listUnit.id, { modelsDestroyed: Math.min(cas.modelsDestroyed + 1, totalModels) })}
                disabled={alive <= 0}
              >
                -
              </button>
              <span style={{
                fontSize: 12,
                fontFamily: 'var(--font-mono)',
                fontWeight: 600,
                color: alive <= 0 ? 'var(--color-error)' : 'var(--color-text)',
                minWidth: 32,
                textAlign: 'center',
              }}>
                {alive}/{totalModels}
              </span>
              <button
                style={{
                  width: 24, height: 24,
                  background: 'var(--color-bg)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-success)',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
                onClick={() => updateCasualty(playerId, listUnit.id, { modelsDestroyed: Math.max(cas.modelsDestroyed - 1, 0) })}
                disabled={cas.modelsDestroyed <= 0}
              >
                +
              </button>
            </div>

            {/* Wounds tracking for multi-wound single models */}
            {datasheet && isMultiWound(datasheet) && totalModels === 1 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)', letterSpacing: 0.5 }}>
                  PV
                </span>
                <button
                  style={{
                    width: 22, height: 22,
                    background: 'var(--color-bg)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-error)',
                    cursor: 'pointer',
                    fontSize: 11,
                    fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                  onClick={() => {
                    const maxW = parseInt(datasheet.profiles[0]?.W ?? '1', 10)
                    const current = cas.woundsRemaining ?? maxW
                    updateCasualty(playerId, listUnit.id, { woundsRemaining: Math.max(current - 1, 0) })
                  }}
                >
                  -
                </button>
                <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--color-text)', minWidth: 28, textAlign: 'center' }}>
                  {cas.woundsRemaining ?? parseInt(datasheet.profiles[0]?.W ?? '1', 10)}/{datasheet.profiles[0]?.W}
                </span>
                <button
                  style={{
                    width: 22, height: 22,
                    background: 'var(--color-bg)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-success)',
                    cursor: 'pointer',
                    fontSize: 11,
                    fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                  onClick={() => {
                    const maxW = parseInt(datasheet.profiles[0]?.W ?? '1', 10)
                    const current = cas.woundsRemaining ?? maxW
                    updateCasualty(playerId, listUnit.id, { woundsRemaining: Math.min(current + 1, maxW) })
                  }}
                >
                  +
                </button>
              </div>
            )}

            {/* Reset */}
            {(cas.modelsDestroyed > 0 || cas.woundsRemaining !== null) && (
              <button
                style={{
                  marginLeft: 'auto',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 9,
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--color-text-muted)',
                  letterSpacing: 0.5,
                }}
                onClick={() => resetCasualtyAction(playerId, listUnit.id)}
              >
                RESET
              </button>
            )}
          </div>
        )}
      </div>
    )
  }

  // =============================================
  // Stratagems panel content
  // =============================================
  const stratagemContent = detachment && (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* Detachment rule */}
      {detachment.rule && (
        <div style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderLeft: '3px solid var(--color-accent)',
          padding: '12px 14px',
        }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-accent)', marginBottom: 4 }}>
            <T text={detachment.rule.name} category="detachment" />
          </div>
          {detachment.rule.legend && (
            <p style={{ fontSize: 11, fontStyle: 'italic', color: 'var(--color-text-muted)', marginBottom: 6 }}>
              <T text={detachment.rule.legend} category="detachment" />
            </p>
          )}
          <THtml
            html={detachment.rule.description}
            category="detachment"
            style={{ fontSize: 11, lineHeight: 1.5, color: 'var(--color-text)' }}
          />
        </div>
      )}

      {detachment.stratagems.map((strat) => {
        const isUsed = usedStratagems.has(strat.id)
        const typeColor = stratTypeColor(strat.type)
        return (
          <button
            key={strat.id}
            style={{
              textAlign: 'left',
              width: '100%',
              cursor: 'pointer',
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              padding: '10px 12px',
              opacity: isUsed ? 0.4 : 1,
              transition: 'opacity 0.15s',
            }}
            onClick={() => toggleStratagem(strat.id)}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 22,
                height: 22,
                fontSize: 12,
                fontWeight: 700,
                fontFamily: 'var(--font-mono)',
                color: '#fff',
                background: typeColor,
                flexShrink: 0,
              }}>
                {strat.cpCost}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)' }}>
                  <T text={strat.name} category="stratagem" />
                </div>
                <div style={{
                  fontSize: 9,
                  fontFamily: 'var(--font-mono)',
                  letterSpacing: 1,
                  color: typeColor,
                  textTransform: 'uppercase',
                  marginTop: 2,
                }}>
                  {strat.type}
                </div>
                {strat.legend && (
                  <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 4, lineHeight: 1.4 }}>
                    <T text={strat.legend} category="stratagem" />
                  </div>
                )}
                {isUsed && (
                  <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)', marginTop: 4 }}>
                    UTILISE — cliquer pour reactiver
                  </div>
                )}
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )

  // =============================================
  // Centered modal helper
  // =============================================
  const renderModal = (onClose: () => void, content: React.ReactNode) => (
    <div
      data-scroll-lock
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 60,
        background: 'rgba(0,0,0,0.5)',
        backdropFilter: isDesktop ? 'blur(8px)' : undefined,
        WebkitBackdropFilter: isDesktop ? 'blur(8px)' : undefined,
        display: 'flex',
        alignItems: isDesktop ? 'center' : 'flex-end',
        justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--color-bg)',
          border: '1px solid var(--color-border)',
          width: isDesktop ? '90%' : '100%',
          maxWidth: isDesktop ? 500 : 'none',
          maxHeight: isDesktop ? '70vh' : '70vh',
          borderRadius: isDesktop ? 0 : '16px 16px 0 0',
          overflowY: 'auto',
          padding: isDesktop ? 20 : 16,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {content}
      </div>
    </div>
  )

  const playerId = user?.id ?? ''

  // =============================================
  // RENDER
  // =============================================
  return (
    <motion.div
      data-scroll-lock
      className="fixed inset-0 z-50 flex flex-col lg:left-[200px]"
      style={{ backgroundColor: 'var(--color-bg)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
    >
      {/* ========= HEADER ========= */}
      <div style={{
        borderBottom: '1px solid var(--color-border)',
        background: 'var(--color-bg-elevated)',
        padding: isDesktop ? '14px 28px' : '10px 14px',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: isDesktop ? 20 : 10 }}>
            <div>
              <div style={{
                fontSize: 9,
                fontFamily: 'var(--font-mono)',
                letterSpacing: 2,
                color: 'var(--color-accent)',
                textTransform: 'uppercase',
              }}>
                &#9656; MODE PARTIE
              </div>
              <div style={{
                fontSize: isDesktop ? 20 : 15,
                fontWeight: 600,
                color: 'var(--color-text)',
                marginTop: 2,
              }}>
                {hasSession && opponentProfile
                  ? `Vous vs ${profileDisplayName(opponentProfile)}`
                  : list.name}
              </div>
              <div style={{
                fontSize: 10,
                fontFamily: 'var(--font-mono)',
                color: 'var(--color-text-muted)',
                letterSpacing: 0.5,
                marginTop: 2,
              }}>
                {list.factionId} &middot; {list.detachment}
              </div>
            </div>
            {isDesktop && (
              <HudPointsCounter used={totalPoints} limit={list.pointsLimit} size="big" />
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {!isDesktop && (
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 13,
                fontWeight: 600,
                color: totalPoints > list.pointsLimit ? 'var(--color-error)' : 'var(--color-accent)',
              }}>
                {totalPoints}/{list.pointsLimit}
              </span>
            )}
            {isAuthenticated && !hasSession && friends.length > 0 && list.remoteId && (
              <HudBtn variant="primary" onClick={() => setShowOpponentPicker(true)}>
                Jouer contre...
              </HudBtn>
            )}
            {hasSession && (
              <HudBtn variant="accent" onClick={() => handleEndSession('completed')}>
                Terminer
              </HudBtn>
            )}
            <HudBtn variant="ghost" onClick={() => navigate(`/lists/${listId}`)}>
              &#8592; Quitter le mode partie
            </HudBtn>
          </div>
        </div>

        {/* Tabs (mobile only — desktop uses columns) */}
        {!isDesktop && (
          <div style={{ display: 'flex', gap: 4, marginTop: 10 }}>
            {(['units', ...(hasStratagems ? ['stratagems'] : []), ...(hasSession && opponentList ? ['opponent'] : [])] as const).map((tab) => (
              <button
                key={tab}
                style={{
                  flex: 1,
                  padding: '6px 0',
                  fontSize: 10,
                  fontFamily: 'var(--font-mono)',
                  letterSpacing: 0.5,
                  cursor: 'pointer',
                  border: '1px solid var(--color-border)',
                  background: activeTab === tab ? 'var(--color-accent)' : 'transparent',
                  color: activeTab === tab ? '#000' : 'var(--color-text-muted)',
                  fontWeight: activeTab === tab ? 600 : 400,
                }}
                onClick={() => setActiveTab(tab as typeof activeTab)}
              >
                {tab === 'units' ? `UNITES (${list.units.length})` : tab === 'stratagems' ? `STRATAGEMES (${detachment!.stratagems.length})` : 'ADVERSAIRE'}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ========= BODY ========= */}
      {isDesktop ? (
        /* ------- DESKTOP: multi-column layout ------- */
        <div style={{ flex: 1, display: 'flex', minHeight: 0, overflow: 'hidden' }}>
          {/* Left column — Units */}
          <div style={{
            flex: 1,
            minWidth: 0,
            overflowY: 'auto',
            padding: '16px 20px',
          }}>
            <MSection>Unites ({list.units.length})</MSection>
            {list.units.length === 0 ? (
              <EmptyState title="Liste vide" description="Aucune unite dans cette liste." />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10 }}>
                {list.units.map((listUnit, i) => {
                  const cas = hasSession ? (casualties[listUnit.id] ?? { modelsDestroyed: 0, woundsRemaining: null }) : null
                  return renderUnitRow(listUnit, i, faction, cas, playerId, false)
                })}
              </div>
            )}
          </div>

          {/* Right column — Stratagems (+ opponent if session) */}
          {(hasStratagems || (hasSession && opponentList)) && (
            <div style={{
              width: 340,
              flexShrink: 0,
              borderLeft: '1px solid var(--color-border)',
              background: 'var(--color-bg-elevated)',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
            }}>
              {/* Opponent section (if session) */}
              {hasSession && opponentList && (
                <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--color-border)' }}>
                  <MSection>Adversaire — {opponentList.name}</MSection>
                  <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)', marginTop: 4, marginBottom: 8 }}>
                    {opponentList.detachment} &middot; {calculateTotalPoints(opponentList.units, opponentFaction?.datasheets)}/{opponentList.pointsLimit} pts
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {opponentList.units.map((unit, i) => {
                      const oppCas = opponentCasualties[unit.id] ?? { modelsDestroyed: 0, woundsRemaining: null }
                      const opponentId = activeSession?.player2_id === user?.id ? activeSession?.player1_id : activeSession?.player2_id
                      return renderUnitRow(unit, i, opponentFaction, oppCas, opponentId ?? '', true)
                    })}
                  </div>
                </div>
              )}

              {/* Stratagems */}
              {hasStratagems && (
                <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '12px 14px' }}>
                  <MSection>Stratagemes ({detachment!.stratagems.length})</MSection>
                  <div style={{ marginTop: 8 }}>{stratagemContent}</div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* ------- MOBILE: tab-based layout ------- */
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px' }}>
          {activeTab === 'units' && (
            <>
              {list.units.length === 0 ? (
                <EmptyState
                  title="Liste vide"
                  description="Ajoute des unites a ta liste avant de lancer le mode partie."
                  actionLabel="Modifier la liste"
                  onAction={() => navigate(`/lists/${listId}`)}
                />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {list.units.map((listUnit, i) => {
                    const cas = hasSession ? (casualties[listUnit.id] ?? { modelsDestroyed: 0, woundsRemaining: null }) : null
                    return renderUnitRow(listUnit, i, faction, cas, playerId, false)
                  })}
                </div>
              )}
            </>
          )}

          {activeTab === 'stratagems' && stratagemContent}

          {activeTab === 'opponent' && opponentList && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                padding: '10px 12px',
                marginBottom: 4,
              }}>
                <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--color-text)' }}>
                  {opponentList.name}
                </span>
                <span style={{ fontSize: 10, marginLeft: 8, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                  {opponentList.detachment} &middot; {calculateTotalPoints(opponentList.units, opponentFaction?.datasheets)}/{opponentList.pointsLimit} pts
                </span>
              </div>
              {opponentList.units.map((unit, i) => {
                const oppCas = opponentCasualties[unit.id] ?? { modelsDestroyed: 0, woundsRemaining: null }
                const opponentId = activeSession?.player2_id === user?.id ? activeSession?.player1_id : activeSession?.player2_id
                return renderUnitRow(unit, i, opponentFaction, oppCas, opponentId ?? '', true)
              })}
            </div>
          )}
        </div>
      )}

      {/* ========= MODALS ========= */}

      {/* Opponent picker */}
      {showOpponentPicker && renderModal(
        () => { setShowOpponentPicker(false); setSelectedFriend(null); setFriendLists([]) },
        <>
          {!selectedFriend ? (
            <>
              <MSection>Choisir un adversaire</MSection>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10 }}>
                {friends.map((f) => {
                  const profile = getFriendProfile(f)
                  if (!profile) return null
                  return (
                    <button
                      key={f.id}
                      style={{
                        textAlign: 'left',
                        padding: '10px 12px',
                        background: 'var(--color-surface)',
                        border: '1px solid var(--color-border)',
                        color: 'var(--color-text)',
                        cursor: 'pointer',
                        fontSize: 13,
                        fontWeight: 600,
                      }}
                      onClick={() => handleSelectFriend(profile)}
                    >
                      {profileDisplayName(profile)}
                    </button>
                  )
                })}
              </div>
            </>
          ) : (
            <>
              <MSection>Listes de {profileDisplayName(selectedFriend)}</MSection>
              <button
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 10,
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--color-accent)',
                  padding: 0,
                  marginTop: 4,
                  marginBottom: 10,
                }}
                onClick={() => { setSelectedFriend(null); setFriendLists([]) }}
              >
                &#8592; Changer d'adversaire
              </button>
              {loadingFriendLists ? (
                <p style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Chargement...</p>
              ) : friendLists.length === 0 ? (
                <p style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Aucune liste publique</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {friendLists.map((fl) => (
                    <button
                      key={fl.remoteId}
                      style={{
                        textAlign: 'left',
                        padding: '10px 12px',
                        background: 'var(--color-surface)',
                        border: '1px solid var(--color-border)',
                        color: 'var(--color-text)',
                        cursor: 'pointer',
                      }}
                      onClick={() => handleSelectOpponentList(fl.remoteId)}
                    >
                      <span style={{ fontWeight: 600, fontSize: 13 }}>{fl.name}</span>
                      <span style={{ fontSize: 10, marginLeft: 8, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                        {fl.detachment} &middot; {fl.pointsLimit} pts
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
          <div style={{ marginTop: 12 }}>
            <HudBtn variant="ghost" onClick={() => { setShowOpponentPicker(false); setSelectedFriend(null); setFriendLists([]) }}>
              Annuler
            </HudBtn>
          </div>
        </>,
      )}

      {/* Target picker */}
      {showTargetPicker && attackingUnit && renderModal(
        () => { setShowTargetPicker(false); setAttackingUnit(null) },
        <>
          <MSection>{attackingUnit.ds.name} attaque...</MSection>
          {!hasSession && (
            <p style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)', marginTop: 4, marginBottom: 10 }}>
              Mode solo — choisis une cible dans ta liste
            </p>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: hasSession ? 10 : 0 }}>
            {(hasSession && opponentList ? opponentList.units : list.units)
              .filter((u) => {
                if (!hasSession) return u.id !== attackingUnit.unit.id
                const cas = opponentCasualties[u.id]
                const factionData = hasSession ? opponentFaction : faction
                const ds = factionData?.datasheets.find((d) => d.id === u.datasheetId)
                const total = getModelCount(u, ds)
                return !cas || (total - cas.modelsDestroyed) > 0
              })
              .map((u) => {
                const factionData = hasSession && opponentList ? opponentFaction : faction
                const ds = factionData?.datasheets.find((d) => d.id === u.datasheetId)
                if (!ds) return null
                const total = getModelCount(u, ds)
                const casSource = hasSession ? opponentCasualties : casualties
                const cas = casSource[u.id]
                const alive = total - (cas?.modelsDestroyed ?? 0)
                return (
                  <button
                    key={u.id}
                    style={{
                      textAlign: 'left',
                      padding: '10px 12px',
                      background: 'var(--color-surface)',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-text)',
                      cursor: 'pointer',
                    }}
                    onClick={() => handleSelectTarget(u, ds)}
                  >
                    <span style={{ fontWeight: 600, fontSize: 13 }}>{u.datasheetName}</span>
                    <span style={{ fontSize: 10, marginLeft: 8, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}>
                      {alive}/{total} &middot; T:{ds.profiles[0]?.T} Sv:{ds.profiles[0]?.Sv} W:{ds.profiles[0]?.W}
                    </span>
                  </button>
                )
              })}
          </div>
          <div style={{ marginTop: 12 }}>
            <HudBtn variant="ghost" onClick={() => { setShowTargetPicker(false); setAttackingUnit(null) }}>
              Annuler
            </HudBtn>
          </div>
        </>,
      )}

      {/* Unit detail modal */}
      {viewingDatasheet && (
        <div
          data-scroll-lock
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 65,
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: isDesktop ? 'blur(8px)' : undefined,
            WebkitBackdropFilter: isDesktop ? 'blur(8px)' : undefined,
            display: 'flex',
            alignItems: isDesktop ? 'center' : 'flex-end',
            justifyContent: 'center',
          }}
          onClick={() => setViewingUnit(null)}
        >
          <div
            style={{
              background: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              width: isDesktop ? '90%' : '100%',
              maxWidth: isDesktop ? 700 : 'none',
              maxHeight: isDesktop ? '85vh' : '85vh',
              borderRadius: isDesktop ? 0 : '16px 16px 0 0',
              overflowY: 'auto',
              padding: isDesktop ? '24px' : '16px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
              <HudBtn variant="ghost" onClick={() => setViewingUnit(null)}>
                Fermer
              </HudBtn>
            </div>
            <UnitSheet
              datasheet={viewingDatasheet}
              selectedWeapons={viewingUnit?.listUnit.selectedWeapons}
              onSimulate={() => {
                setViewingUnit(null)
                navigate(`/simulate/${list.factionId}/${viewingDatasheet.id}`)
              }}
            />
          </div>
        </div>
      )}

      {/* Simulator modal */}
      {simParams && (
        <div
          data-scroll-lock
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 70,
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: isDesktop ? 'center' : 'flex-end',
            justifyContent: 'center',
          }}
          onClick={() => setSimParams(null)}
        >
          <div
            style={{
              background: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              width: isDesktop ? '92%' : '100%',
              maxWidth: isDesktop ? 960 : 'none',
              maxHeight: isDesktop ? '92vh' : '90vh',
              borderRadius: isDesktop ? 0 : '16px 16px 0 0',
              overflowY: 'auto',
              padding: isDesktop ? '16px 20px' : '16px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <SimulatorPage
              onClose={() => setSimParams(null)}
              initialAttackerFaction={simParams.attackerFaction}
              initialAttackerDs={simParams.attackerDs}
              initialAttackerWeapons={simParams.attackerWeapons}
              initialDefenderFaction={simParams.defenderFaction}
              initialDefenderDs={simParams.defenderDs}
            />
          </div>
        </div>
      )}

    </motion.div>
  )
}

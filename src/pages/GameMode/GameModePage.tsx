import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router'
import { motion } from 'motion/react'
import { useListsStore } from '@/stores/listsStore'
import { useGameDataStore } from '@/stores/gameDataStore'
import { useAuthStore } from '@/stores/authStore'
import { useFriendsStore } from '@/stores/friendsStore'
import { useGameSessionStore } from '@/stores/gameSessionStore'
import { fetchPublicLists } from '@/services/listsSyncService'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { PartySwiper } from '@/features/game-mode/components/PartySwiper'
import { ContextualSimulator } from '@/components/domain/ContextualSimulator/ContextualSimulator'
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

export function GameModePage() {
  const { listId } = useParams<{ listId: string }>()
  const navigate = useNavigate()
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
  const sessionLoading = useGameSessionStore((s) => s.loading)
  const startSession = useGameSessionStore((s) => s.startSession)
  const loadSession = useGameSessionStore((s) => s.loadSession)
  const endSessionAction = useGameSessionStore((s) => s.endSession)
  const casualties = useGameSessionStore((s) => s.casualties)
  const opponentCasualties = useGameSessionStore((s) => s.opponentCasualties)
  const updateCasualty = useGameSessionStore((s) => s.updateCasualty)
  const resetCasualtyAction = useGameSessionStore((s) => s.resetCasualty)

  const [swiperStartIndex, setSwiperStartIndex] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState<'units' | 'stratagems' | 'opponent'>('units')
  const [usedStratagems, setUsedStratagems] = useState<Set<string>>(new Set())

  // Contextual simulation flow
  const [attackingUnit, setAttackingUnit] = useState<{ unit: ListUnit; ds: Datasheet } | null>(null)
  const [showTargetPicker, setShowTargetPicker] = useState(false)
  const [simTarget, setSimTarget] = useState<{ unit: ListUnit; ds: Datasheet } | null>(null)

  // Opponent selection flow
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
        <div className="p-4">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            ← Retour
          </Button>
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

  const unitDatasheets: Datasheet[] = list.units
    .map((unit) => faction?.datasheets.find((ds) => ds.id === unit.datasheetId))
    .filter((ds): ds is Datasheet => ds !== undefined)

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
    setSimTarget(null)
  }

  const handleSelectTarget = (unit: ListUnit, ds: Datasheet) => {
    setSimTarget({ unit, ds })
    setShowTargetPicker(false)
  }

  // Find enhancement data from detachment
  const findEnhancement = (listUnit: ListUnit, factionData: typeof faction | null) => {
    if (!listUnit.enhancement || !factionData?.detachments) return undefined
    for (const det of factionData.detachments) {
      const enh = det.enhancements?.find((e) => e.id === listUnit.enhancement?.enhancementId || e.name === listUnit.enhancement?.enhancementName)
      if (enh) return enh
    }
    return undefined
  }

  // Opponent faction data
  const opponentFaction = opponentList ? loadedFactions[opponentList.factionId] : null

  // Get friend display info from friendship
  const getFriendProfile = (f: { requester?: Profile; addressee?: Profile }): Profile | undefined => {
    if (!user) return undefined
    return f.requester?.id === user.id ? f.addressee : f.requester
  }

  if (swiperStartIndex !== null && unitDatasheets.length > 0) {
    return (
      <PartySwiper
        datasheets={unitDatasheets}
        initialIndex={swiperStartIndex}
        onClose={() => setSwiperStartIndex(null)}
      />
    )
  }

  const hasSession = !!activeSession
  const hasStratagems = detachment && detachment.stratagems.length > 0

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col overflow-y-auto"
      style={{ backgroundColor: 'var(--color-bg)' }}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      <div
        className="sticky top-0 z-10 p-3"
        style={{ backgroundColor: 'var(--color-surface)' }}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex flex-col">
            <span className="font-bold text-sm" style={{ color: 'var(--color-text)' }}>
              {hasSession && opponentProfile
                ? `Vous vs ${profileDisplayName(opponentProfile)}`
                : list.name}
            </span>
            <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              {list.detachment} · {totalPoints}/{list.pointsLimit} pts
            </span>
          </div>
          <div className="flex items-center gap-2">
            {hasSession && (
              <Button variant="secondary" size="sm" onClick={() => handleEndSession('completed')}>
                Terminer
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
              Quitter
            </Button>
          </div>
        </div>

        {/* Session action button */}
        {isAuthenticated && !hasSession && friends.length > 0 && list.remoteId && (
          <Button
            variant="primary"
            size="sm"
            className="w-full mb-2"
            onClick={() => setShowOpponentPicker(true)}
            disabled={sessionLoading}
          >
            Jouer contre...
          </Button>
        )}

        {/* Tabs */}
        <div className="flex gap-1">
          <button
            className="flex-1 text-xs py-1.5 rounded-lg cursor-pointer border-none font-medium"
            style={{
              backgroundColor: activeTab === 'units' ? 'var(--color-primary)' : 'var(--color-bg)',
              color: activeTab === 'units' ? '#fff' : 'var(--color-text-muted)',
            }}
            onClick={() => setActiveTab('units')}
          >
            Unités ({list.units.length})
          </button>
          {hasStratagems && (
            <button
              className="flex-1 text-xs py-1.5 rounded-lg cursor-pointer border-none font-medium"
              style={{
                backgroundColor: activeTab === 'stratagems' ? 'var(--color-primary)' : 'var(--color-bg)',
                color: activeTab === 'stratagems' ? '#fff' : 'var(--color-text-muted)',
              }}
              onClick={() => setActiveTab('stratagems')}
            >
              Stratagèmes ({detachment!.stratagems.length})
            </button>
          )}
          {hasSession && opponentList && (
            <button
              className="flex-1 text-xs py-1.5 rounded-lg cursor-pointer border-none font-medium"
              style={{
                backgroundColor: activeTab === 'opponent' ? 'var(--color-primary)' : 'var(--color-bg)',
                color: activeTab === 'opponent' ? '#fff' : 'var(--color-text-muted)',
              }}
              onClick={() => setActiveTab('opponent')}
            >
              Adversaire
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 p-4">
        {activeTab === 'units' && (
          <>
            {list.units.length === 0 ? (
              <EmptyState
                title="Liste vide"
                description="Ajoute des unités à ta liste avant de lancer le mode partie."
                actionLabel="Modifier la liste"
                onAction={() => navigate(`/lists/${listId}`)}
              />
            ) : (
              <div className="flex flex-col gap-2">
                {list.units.map((listUnit, i) => {
                  const datasheet = faction?.datasheets.find((ds) => ds.id === listUnit.datasheetId)
                  const totalModels = getModelCount(listUnit, datasheet)
                  const cas = hasSession ? (casualties[listUnit.id] ?? { modelsDestroyed: 0, woundsRemaining: null }) : null
                  const alive = cas ? totalModels - cas.modelsDestroyed : totalModels
                  const isDestroyed = cas ? alive <= 0 : false
                  const playerId = user?.id ?? ''
                  return (
                    <div
                      key={i}
                      className="rounded-lg p-3"
                      style={{ backgroundColor: 'var(--color-surface)', opacity: isDestroyed ? 0.4 : 1 }}
                    >
                      <div className="flex items-center justify-between min-h-[44px]">
                        <div
                          className="flex flex-col flex-1 cursor-pointer"
                          onClick={() => {
                            if (!datasheet) return
                            const idx = unitDatasheets.indexOf(datasheet)
                            if (idx >= 0) setSwiperStartIndex(idx)
                          }}
                        >
                          <span className="font-medium text-sm" style={{ color: 'var(--color-text)', textDecoration: isDestroyed ? 'line-through' : 'none' }}>
                            <T text={listUnit.datasheetName} category="unit" />
                          </span>
                          {listUnit.enhancement && (
                            <span className="text-xs" style={{ color: 'var(--color-accent)' }}>
                              ✦ {listUnit.enhancement.enhancementName} (+{listUnit.enhancement.cost} pts)
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {datasheet && datasheet.weapons.length > 0 && (
                            <span
                              className="text-xs px-2 py-1 rounded cursor-pointer font-medium"
                              style={{ backgroundColor: 'var(--color-accent)', color: '#fff' }}
                              onClick={() => handleAttack(listUnit, datasheet)}
                            >
                              Attaquer
                            </span>
                          )}
                          {datasheet && datasheet.weapons.length > 0 && (
                            <span
                              className="text-xs px-2 py-1 rounded cursor-pointer"
                              style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-accent)' }}
                              onClick={() => navigate(`/simulate/${list.factionId}/${datasheet.id}`)}
                            >
                              Simuler
                            </span>
                          )}
                          <span className="text-xs font-mono" style={{ color: 'var(--color-accent)' }}>
                            {resolveUnitPoints(listUnit, faction?.datasheets)} pts
                          </span>
                        </div>
                      </div>

                      {/* Casualty tracking (only in session) */}
                      {hasSession && cas && (
                        <div className="flex items-center gap-3 mt-2 pt-2" style={{ borderTop: '1px solid var(--color-bg)' }}>
                          {/* Model counter */}
                          <div className="flex items-center gap-1">
                            <button
                              className="w-7 h-7 rounded text-sm border-none cursor-pointer font-bold"
                              style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-error, #ef4444)' }}
                              onClick={() => updateCasualty(playerId, listUnit.id, { modelsDestroyed: Math.min(cas.modelsDestroyed + 1, totalModels) })}
                              disabled={alive <= 0}
                            >
                              -
                            </button>
                            <span className="text-xs font-mono min-w-[3ch] text-center" style={{ color: 'var(--color-text)' }}>
                              {alive}/{totalModels}
                            </span>
                            <button
                              className="w-7 h-7 rounded text-sm border-none cursor-pointer font-bold"
                              style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-success, #22c55e)' }}
                              onClick={() => updateCasualty(playerId, listUnit.id, { modelsDestroyed: Math.max(cas.modelsDestroyed - 1, 0) })}
                              disabled={cas.modelsDestroyed <= 0}
                            >
                              +
                            </button>
                          </div>

                          {/* Wounds tracking for multi-wound single models */}
                          {datasheet && isMultiWound(datasheet) && totalModels === 1 && (
                            <div className="flex items-center gap-1">
                              <span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>PV:</span>
                              <button
                                className="w-6 h-6 rounded text-xs border-none cursor-pointer font-bold"
                                style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-error, #ef4444)' }}
                                onClick={() => {
                                  const maxW = parseInt(datasheet.profiles[0]?.W ?? '1', 10)
                                  const current = cas.woundsRemaining ?? maxW
                                  updateCasualty(playerId, listUnit.id, { woundsRemaining: Math.max(current - 1, 0) })
                                }}
                              >
                                -
                              </button>
                              <span className="text-xs font-mono" style={{ color: 'var(--color-text)' }}>
                                {cas.woundsRemaining ?? parseInt(datasheet.profiles[0]?.W ?? '1', 10)}/{datasheet.profiles[0]?.W}
                              </span>
                              <button
                                className="w-6 h-6 rounded text-xs border-none cursor-pointer font-bold"
                                style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-success, #22c55e)' }}
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

                          {/* Reset button */}
                          {(cas.modelsDestroyed > 0 || cas.woundsRemaining !== null) && (
                            <button
                              className="text-[10px] bg-transparent border-none cursor-pointer ml-auto"
                              style={{ color: 'var(--color-text-muted)' }}
                              onClick={() => resetCasualtyAction(playerId, listUnit.id)}
                            >
                              Reset
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}

        {activeTab === 'stratagems' && detachment && (
          <div className="flex flex-col gap-3">
            {detachment.rule && (
              <div
                className="rounded-lg p-3"
                style={{ backgroundColor: 'var(--color-surface)', borderLeft: '3px solid var(--color-accent)' }}
              >
                <h3 className="font-bold text-sm mb-1" style={{ color: 'var(--color-accent)' }}>
                  <T text={detachment.rule.name} category="detachment" />
                </h3>
                {detachment.rule.legend && (
                  <p className="text-xs italic mb-2" style={{ color: 'var(--color-text-muted)' }}>
                    <T text={detachment.rule.legend} category="detachment" />
                  </p>
                )}
                <THtml
                  html={detachment.rule.description}
                  category="detachment"
                  className="text-xs leading-relaxed"
                  style={{ color: 'var(--color-text)' }}
                />
              </div>
            )}

            {detachment.stratagems.map((strat) => {
              const isUsed = usedStratagems.has(strat.id)
              return (
                <button
                  key={strat.id}
                  className="rounded-lg p-3 text-left w-full cursor-pointer border-none"
                  style={{
                    backgroundColor: 'var(--color-surface)',
                    opacity: isUsed ? 0.5 : 1,
                    borderLeft: `3px solid ${strat.type.includes('Battle Tactic') ? '#b33b3b' : strat.type.includes('Strategic Ploy') ? '#5a8cc4' : strat.type.includes('Epic Deed') ? '#9b6bc4' : 'var(--color-accent)'}`,
                  }}
                  onClick={() => toggleStratagem(strat.id)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-sm" style={{ color: 'var(--color-text)' }}>
                      <T text={strat.name} category="stratagem" />
                    </span>
                    <span
                      className="text-xs font-mono px-2 py-0.5 rounded"
                      style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-accent)' }}
                    >
                      {strat.cpCost} CP
                    </span>
                  </div>
                  <div className="text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>
                    {strat.turn && <span>{strat.turn}</span>}
                    {strat.turn && strat.phase && <span> · </span>}
                    {strat.phase && <span>{strat.phase}</span>}
                  </div>
                  {strat.legend && (
                    <p className="text-xs italic mb-1" style={{ color: 'var(--color-text-muted)' }}>
                      <T text={strat.legend} category="stratagem" />
                    </p>
                  )}
                  <THtml
                    html={strat.description}
                    category="stratagem"
                    className="text-xs leading-relaxed"
                    style={{ color: 'var(--color-text)' }}
                  />
                  {isUsed && (
                    <span className="text-xs mt-1 block" style={{ color: 'var(--color-text-muted)' }}>
                      (utilisé — appuyer pour réactiver)
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        )}

        {activeTab === 'opponent' && opponentList && (
          <div className="flex flex-col gap-2">
            <div className="rounded-lg p-3 mb-2" style={{ backgroundColor: 'var(--color-surface)' }}>
              <span className="font-bold text-sm" style={{ color: 'var(--color-text)' }}>
                {opponentList.name}
              </span>
              <span className="text-xs ml-2" style={{ color: 'var(--color-text-muted)' }}>
                {opponentList.detachment} · {calculateTotalPoints(opponentList.units, opponentFaction?.datasheets)}/{opponentList.pointsLimit} pts
              </span>
            </div>
            {opponentList.units.map((unit, i) => {
              const ds = opponentFaction?.datasheets.find((d) => d.id === unit.datasheetId)
              const oppTotalModels = getModelCount(unit, ds)
              const oppCas = opponentCasualties[unit.id] ?? { modelsDestroyed: 0, woundsRemaining: null }
              const oppAlive = oppTotalModels - oppCas.modelsDestroyed
              const oppDestroyed = oppAlive <= 0
              const opponentId = activeSession?.player2_id === user?.id ? activeSession?.player1_id : activeSession?.player2_id
              return (
                <div
                  key={i}
                  className="rounded-lg p-3"
                  style={{ backgroundColor: 'var(--color-surface)', opacity: oppDestroyed ? 0.4 : 1 }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="font-medium text-sm" style={{ color: 'var(--color-text)', textDecoration: oppDestroyed ? 'line-through' : 'none' }}>
                        <T text={unit.datasheetName} category="unit" />
                      </span>
                      {ds?.profiles[0] && (
                        <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                          T:{ds.profiles[0].T} Sv:{ds.profiles[0].Sv} W:{ds.profiles[0].W}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {ds && ds.weapons.length > 0 && (
                        <span
                          className="text-xs px-2 py-1 rounded cursor-pointer"
                          style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-accent)' }}
                          onClick={() => navigate(`/simulate/${opponentList.factionId}/${ds.id}`)}
                        >
                          Simuler
                        </span>
                      )}
                      <span className="text-xs font-mono" style={{ color: 'var(--color-accent)' }}>
                        {resolveUnitPoints(unit, opponentFaction?.datasheets)} pts
                      </span>
                    </div>
                  </div>

                  {/* Opponent casualty tracking */}
                  <div className="flex items-center gap-3 mt-2 pt-2" style={{ borderTop: '1px solid var(--color-bg)' }}>
                    <div className="flex items-center gap-1">
                      <button
                        className="w-7 h-7 rounded text-sm border-none cursor-pointer font-bold"
                        style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-error, #ef4444)' }}
                        onClick={() => opponentId && updateCasualty(opponentId, unit.id, { modelsDestroyed: Math.min(oppCas.modelsDestroyed + 1, oppTotalModels) })}
                        disabled={oppAlive <= 0}
                      >
                        -
                      </button>
                      <span className="text-xs font-mono min-w-[3ch] text-center" style={{ color: 'var(--color-text)' }}>
                        {oppAlive}/{oppTotalModels}
                      </span>
                      <button
                        className="w-7 h-7 rounded text-sm border-none cursor-pointer font-bold"
                        style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-success, #22c55e)' }}
                        onClick={() => opponentId && updateCasualty(opponentId, unit.id, { modelsDestroyed: Math.max(oppCas.modelsDestroyed - 1, 0) })}
                        disabled={oppCas.modelsDestroyed <= 0}
                      >
                        +
                      </button>
                    </div>
                    {(oppCas.modelsDestroyed > 0) && (
                      <button
                        className="text-[10px] bg-transparent border-none cursor-pointer ml-auto"
                        style={{ color: 'var(--color-text-muted)' }}
                        onClick={() => opponentId && resetCasualtyAction(opponentId, unit.id)}
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Opponent picker modal */}
      {showOpponentPicker && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={() => { setShowOpponentPicker(false); setSelectedFriend(null); setFriendLists([]) }}
        >
          <div
            className="w-full max-w-lg rounded-t-xl p-4 max-h-[70vh] overflow-y-auto"
            style={{ backgroundColor: 'var(--color-surface)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {!selectedFriend ? (
              <>
                <h3 className="font-semibold mb-3" style={{ color: 'var(--color-text)' }}>
                  Choisir un adversaire
                </h3>
                <div className="flex flex-col gap-2">
                  {friends.map((f) => {
                    const profile = getFriendProfile(f)
                    if (!profile) return null
                    return (
                      <button
                        key={f.id}
                        className="text-left p-3 rounded-lg cursor-pointer border-none min-h-[44px]"
                        style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}
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
                <h3 className="font-semibold mb-1" style={{ color: 'var(--color-text)' }}>
                  Listes de {profileDisplayName(selectedFriend)}
                </h3>
                <button
                  className="text-xs mb-3 bg-transparent border-none cursor-pointer"
                  style={{ color: 'var(--color-accent)' }}
                  onClick={() => { setSelectedFriend(null); setFriendLists([]) }}
                >
                  ← Changer d'adversaire
                </button>
                {loadingFriendLists ? (
                  <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Chargement...</p>
                ) : friendLists.length === 0 ? (
                  <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Aucune liste publique</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {friendLists.map((fl) => (
                      <button
                        key={fl.remoteId}
                        className="text-left p-3 rounded-lg cursor-pointer border-none min-h-[44px]"
                        style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}
                        onClick={() => handleSelectOpponentList(fl.remoteId)}
                      >
                        <span className="font-medium">{fl.name}</span>
                        <span className="text-xs ml-2" style={{ color: 'var(--color-text-muted)' }}>
                          {fl.detachment} · {fl.pointsLimit} pts
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
            <Button variant="ghost" className="mt-3" onClick={() => { setShowOpponentPicker(false); setSelectedFriend(null); setFriendLists([]) }}>
              Annuler
            </Button>
          </div>
        </div>
      )}
      {/* Target picker for contextual simulation */}
      {showTargetPicker && attackingUnit && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={() => { setShowTargetPicker(false); setAttackingUnit(null) }}
        >
          <div
            className="w-full max-w-lg rounded-t-xl p-4 max-h-[70vh] overflow-y-auto"
            style={{ backgroundColor: 'var(--color-surface)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-semibold mb-3" style={{ color: 'var(--color-text)' }}>
              {attackingUnit.ds.name} attaque...
            </h3>
            {!hasSession && (
              <p className="text-xs mb-2" style={{ color: 'var(--color-text-muted)' }}>
                Mode solo — choisis une cible dans ta liste
              </p>
            )}
            <div className="flex flex-col gap-2">
              {(hasSession && opponentList ? opponentList.units : list.units)
                .filter((u) => {
                  if (!hasSession) {
                    // In solo, don't let a unit attack itself
                    return u.id !== attackingUnit.unit.id
                  }
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
                      className="text-left p-3 rounded-lg cursor-pointer border-none min-h-[44px]"
                      style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}
                      onClick={() => handleSelectTarget(u, ds)}
                    >
                      <span className="font-medium">{u.datasheetName}</span>
                      <span className="text-xs ml-2" style={{ color: 'var(--color-text-muted)' }}>
                        {alive}/{total} · T:{ds.profiles[0]?.T} Sv:{ds.profiles[0]?.Sv} W:{ds.profiles[0]?.W}
                      </span>
                    </button>
                  )
                })}
            </div>
            <Button variant="ghost" className="mt-3" onClick={() => { setShowTargetPicker(false); setAttackingUnit(null) }}>
              Annuler
            </Button>
          </div>
        </div>
      )}

      {/* Contextual simulation result */}
      {simTarget && attackingUnit && (
        <ContextualSimulator
          attackerUnit={attackingUnit.unit}
          attackerDatasheet={attackingUnit.ds}
          attackerCasualty={casualties[attackingUnit.unit.id] ?? null}
          defenderUnit={simTarget.unit}
          defenderDatasheet={simTarget.ds}
          defenderCasualty={(hasSession ? opponentCasualties : casualties)[simTarget.unit.id] ?? null}
          attackerEnhancement={findEnhancement(attackingUnit.unit, faction)}
          defenderEnhancement={findEnhancement(simTarget.unit, hasSession ? opponentFaction : faction)}
          attackerStratagems={detachment?.stratagems ?? []}
          defenderStratagems={hasSession
            ? (opponentFaction?.detachments?.find((d) => d.name === opponentList?.detachment)?.stratagems ?? [])
            : (detachment?.stratagems ?? [])}
          leaderDatasheet={(() => {
            const leaderUnit = list.units.find((u) => u.attachedToId === attackingUnit.unit.id)
            return leaderUnit ? faction?.datasheets.find((ds) => ds.id === leaderUnit.datasheetId) : undefined
          })()}
          onChangeTarget={() => { setSimTarget(null); setShowTargetPicker(true) }}
          onClose={() => { setSimTarget(null); setAttackingUnit(null) }}
        />
      )}
    </motion.div>
  )
}

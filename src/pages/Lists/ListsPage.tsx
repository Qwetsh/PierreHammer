import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { useListsStore } from '@/stores/listsStore'
import { useGameDataStore } from '@/stores/gameDataStore'
import { useGameData } from '@/hooks/useGameData'
import { useFactionTheme } from '@/hooks/useFactionTheme'
import { calculateTotalPoints, countSquads } from '@/utils/pointsCalculator'
import { useAuthStore } from '@/stores/authStore'
import { FactionPicker } from '@/components/domain/FactionPicker'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { HudTopBar, HudBtn, HudBar, HudPanel, HudPill, MTopBar } from '@/components/ui/Hud'
import type { PointsLimit } from '@/types/armyList.types'
import type { Detachment } from '@/types/gameData.types'

const pointsOptions: PointsLimit[] = [1000, 2000, 3000]
const SWIPE_THRESHOLD = 80

function SwipeableListItem({
  children,
  factionId,
  onTap,
  onDelete,
}: {
  children: React.ReactNode
  factionId?: string
  onTap: () => void
  onDelete: () => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const startX = useRef(0)
  const startY = useRef(0)
  const currentX = useRef(0)
  const swiping = useRef(false)
  const isOpen = useRef(false)
  const [offset, setOffset] = useState(0)

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX
    startY.current = e.touches[0].clientY
    swiping.current = false
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    const dx = e.touches[0].clientX - startX.current
    const dy = e.touches[0].clientY - startY.current

    // If vertical scroll is dominant, ignore
    if (!swiping.current && Math.abs(dy) > Math.abs(dx)) return

    swiping.current = true
    const base = isOpen.current ? -SWIPE_THRESHOLD : 0
    currentX.current = Math.min(0, Math.max(-SWIPE_THRESHOLD, base + dx))
    setOffset(currentX.current)
  }

  const handleTouchEnd = () => {
    if (!swiping.current) return
    if (currentX.current < -SWIPE_THRESHOLD / 2) {
      setOffset(-SWIPE_THRESHOLD)
      isOpen.current = true
    } else {
      setOffset(0)
      isOpen.current = false
    }
  }

  const handleClick = () => {
    if (isOpen.current) {
      setOffset(0)
      isOpen.current = false
    } else if (!swiping.current) {
      onTap()
    }
  }

  return (
    <div
      className="relative mb-3 overflow-hidden"
      style={{ minHeight: '44px' }}
      data-faction={factionId}
    >
      {/* Delete button behind — only visible when swiped */}
      {offset < 0 && (
        <div
          className="absolute right-0 top-0 bottom-0 flex items-center justify-center cursor-pointer"
          style={{
            width: `${SWIPE_THRESHOLD}px`,
            backgroundColor: 'var(--color-error)',
          }}
          onClick={onDelete}
        >
          <span className="text-xs font-bold text-white uppercase" style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.05em' }}>
            Suppr.
          </span>
        </div>
      )}

      {/* Foreground card */}
      <div
        ref={containerRef}
        className="list-card"
        style={{
          transform: `translateX(${offset}px)`,
          transition: swiping.current ? 'none' : 'transform 0.25s ease',
          zIndex: 1,
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={handleClick}
      >
        {children}
      </div>
    </div>
  )
}

export function ListsPage() {
  const navigate = useNavigate()
  const lists = useListsStore((s) => s.lists)
  const getAllLists = useListsStore((s) => s.getAllLists)
  const createList = useListsStore((s) => s.createList)
  const deleteList = useListsStore((s) => s.deleteList)
  const { factionIndex } = useGameData()
  const loadedFactions = useGameDataStore((s) => s.loadedFactions)
  const loadFaction = useGameDataStore((s) => s.loadFaction)

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const syncing = useListsStore((s) => s.syncing)

  useFactionTheme(null)

  const allListsForLoad = Object.values(lists)
  useEffect(() => {
    const factionIds = new Set(allListsForLoad.map((l) => l.factionId))
    factionIds.forEach((id) => loadFaction(id))
  }, [allListsForLoad.length, loadFaction])

  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [selectedFaction, setSelectedFaction] = useState<string | null>(null)
  const [selectedDetachment, setSelectedDetachment] = useState<Detachment | null>(null)
  const [detachment, setDetachment] = useState('')
  const [pointsLimit, setPointsLimit] = useState<PointsLimit>(2000)

  const allLists = getAllLists()

  const factionDetachments = selectedFaction
    ? loadedFactions[selectedFaction]?.detachments ?? []
    : []

  const handleSelectFaction = (slug: string | null) => {
    setSelectedFaction(slug)
    setSelectedDetachment(null)
    setDetachment('')
    if (slug) loadFaction(slug)
  }

  const handleCreate = () => {
    if (!name.trim() || !selectedFaction) return
    const detName = selectedDetachment?.name || detachment.trim() || 'Standard'
    const detId = selectedDetachment?.id
    const id = createList(name.trim(), selectedFaction, detName, pointsLimit, detId)
    setShowForm(false)
    setName('')
    setSelectedFaction(null)
    setSelectedDetachment(null)
    setDetachment('')
    setPointsLimit(2000)
    navigate(`/lists/${id}`)
  }

  const totalPoints = (listId: string) => {
    const list = lists[listId]
    if (!list) return 0
    const faction = loadedFactions[list.factionId]
    return calculateTotalPoints(list.units, faction?.datasheets)
  }

  const createFormContent = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nom de la liste"
        className="w-full px-3 py-2 bg-transparent outline-none min-h-[44px] lg:rounded-none lg:border-solid"
        style={{ color: 'var(--color-text)', border: '1px solid var(--color-border)', borderRadius: 8, fontFamily: 'var(--font-sans)' }}
        aria-label="Nom de la liste"
      />
      <div>
        <p className="text-sm mb-2" style={{ color: 'var(--color-text-muted)' }}>Limite de points</p>
        <div className="flex gap-3">
          {pointsOptions.map((pts) => {
            const metal = pts === 1000 ? 'bronze' : pts === 2000 ? 'silver' : 'gold'
            return (
              <button key={pts} className={`btn-points btn-points--${metal} ${pointsLimit === pts ? 'btn-points--selected' : ''}`} onClick={() => setPointsLimit(pts)}>
                {pts}
              </button>
            )
          })}
        </div>
      </div>
      {factionIndex && (
        <div>
          <p className="text-sm mb-2" style={{ color: 'var(--color-text-muted)' }}>Faction</p>
          <FactionPicker
            factions={factionIndex.factions}
            onSelect={handleSelectFaction}
            selectedSlug={selectedFaction}
            detachments={factionDetachments}
            selectedDetachment={selectedDetachment}
            onDetachmentChange={(det) => { setSelectedDetachment(det); setDetachment(det?.name ?? '') }}
          />
        </div>
      )}
      <div className="flex gap-2 mt-2">
        <Button variant="primary" onClick={handleCreate} disabled={!name.trim() || !selectedFaction}>Créer</Button>
        <Button variant="ghost" onClick={() => setShowForm(false)}>Annuler</Button>
      </div>
    </div>
  )

  // Empty state
  if (allLists.length === 0 && !showForm) {
    return (
      <>
        <div className="hidden lg:block">
          <HudTopBar title="Mes Listes" sub="Arsenal" actions={<HudBtn variant="primary" onClick={() => setShowForm(true)}>+ Nouvelle Liste</HudBtn>} />
          <div style={{ padding: '40px 24px', maxWidth: 500, margin: '0 auto' }}>
            <EmptyState title="Pas encore de liste ?" description="Crée ta première liste d'armée pour préparer tes parties." actionLabel="Créer ma première liste" onAction={() => setShowForm(true)} />
          </div>
        </div>
        <div className="lg:hidden">
          <MTopBar title="Mes Listes" sub="Arsenal" actions={<HudBtn variant="primary" onClick={() => setShowForm(true)} style={{ padding: '4px 10px', fontSize: 9 }}>+ Nouvelle</HudBtn>} />
          <div style={{ padding: 16 }}>
            <EmptyState title="Pas encore de liste ?" description="Crée ta première liste d'armée pour préparer tes parties." actionLabel="Créer ma première liste" onAction={() => setShowForm(true)} />
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      {/* ══════ DESKTOP HUD ══════ */}
      <div className="hidden lg:block">
        <HudTopBar
          title="Mes Listes"
          sub="Arsenal"
          actions={
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {isAuthenticated && syncing && (
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-accent)', letterSpacing: 1 }}>SYNC...</span>
              )}
              {!showForm && <HudBtn variant="primary" onClick={() => setShowForm(true)}>+ Nouvelle Liste</HudBtn>}
            </div>
          }
        />
        <div style={{ padding: '16px 24px 24px' }}>
          {showForm && (
            <HudPanel title="Nouvelle Liste" style={{ marginBottom: 20 }}>
              <div style={{ padding: 16 }}>{createFormContent}</div>
            </HudPanel>
          )}

          {/* Lists grid — 2 columns on desktop */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
            {allLists.map((list) => {
              const pts = totalPoints(list.id)
              const pct = Math.min(100, (pts / list.pointsLimit) * 100)
              const overBudget = pts > list.pointsLimit
              return (
                <div
                  key={list.id}
                  onClick={() => navigate(`/lists/${list.id}`)}
                  style={{
                    border: '1px solid var(--color-border)',
                    background: 'var(--color-surface)',
                    padding: '14px 16px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                    transition: 'border-color 0.15s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--color-accent)')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--color-border)')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                        {list.name}
                      </span>
                      {isAuthenticated && list.remoteId && (
                        <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--color-success)', letterSpacing: 1 }}>SYNC</span>
                      )}
                    </div>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 600, color: overBudget ? 'var(--color-error)' : 'var(--color-accent)', flexShrink: 0 }}>
                      {pts}<span style={{ color: 'var(--color-text-muted)', fontSize: 11 }}>/{list.pointsLimit}</span>
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 10, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: 0.5 }}>
                      {list.detachment} {'\u00b7'} {countSquads(list.units)} esc.
                    </span>
                    <div style={{ flex: 1 }}>
                      <HudBar value={pct} max={100} color={overBudget ? 'var(--color-error)' : 'var(--color-accent)'} height={3} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ══════ MOBILE HUD ══════ */}
      <div className="lg:hidden">
        <MTopBar
          title="Mes Listes"
          sub="Arsenal"
          actions={
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              {isAuthenticated && syncing && (
                <HudPill color="var(--color-accent)">SYNC</HudPill>
              )}
              {!showForm && <HudBtn variant="primary" onClick={() => setShowForm(true)} style={{ padding: '4px 10px', fontSize: 9 }}>+ Nouvelle</HudBtn>}
            </div>
          }
        />
        <div style={{ padding: 12 }}>
          {showForm && (
            <HudPanel title="Nouvelle Liste" style={{ marginBottom: 12 }}>
              <div style={{ padding: 12 }}>{createFormContent}</div>
            </HudPanel>
          )}

          {allLists.map((list) => {
            const pts = totalPoints(list.id)
            const pct = Math.min(100, (pts / list.pointsLimit) * 100)
            const overBudget = pts > list.pointsLimit
            return (
              <SwipeableListItem key={list.id} factionId={list.factionId} onTap={() => navigate(`/lists/${list.id}`)} onDelete={() => deleteList(list.id)}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {list.name}
                    </span>
                    {isAuthenticated && list.remoteId && <HudPill color="var(--color-success)">SYNC</HudPill>}
                  </div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600, color: overBudget ? 'var(--color-error)' : 'var(--color-accent)', flexShrink: 0 }}>
                    {pts}<span style={{ color: 'var(--color-text-muted)', fontSize: 10 }}>/{list.pointsLimit}</span>
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 10, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: 0.5 }}>
                    {list.detachment} {'\u00b7'} {countSquads(list.units)} esc.
                  </span>
                  <div style={{ flex: 1 }}>
                    <HudBar value={pct} max={100} color={overBudget ? 'var(--color-error)' : 'var(--color-accent)'} height={3} />
                  </div>
                </div>
              </SwipeableListItem>
            )
          })}
        </div>
      </div>
    </>
  )
}

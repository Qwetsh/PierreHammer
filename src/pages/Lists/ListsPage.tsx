import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { useListsStore } from '@/stores/listsStore'
import { useGameDataStore } from '@/stores/gameDataStore'
import { useGameData } from '@/hooks/useGameData'
import { useFactionTheme } from '@/hooks/useFactionTheme'
import { calculateTotalPoints, countSquads } from '@/utils/pointsCalculator'
import { FactionPicker } from '@/components/domain/FactionPicker'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
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
      className="relative mb-3 overflow-hidden rounded-lg"
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

  if (allLists.length === 0 && !showForm) {
    return (
      <div className="p-4">
        <h1 className="font-bold mb-4" style={{ fontSize: 'var(--text-xl)' }}>Mes Listes</h1>
        <EmptyState
          title="Pas encore de liste ?"
          description="Crée ta première liste d'armée pour préparer tes parties."
          actionLabel="Créer ma première liste"
          onAction={() => setShowForm(true)}
        />
      </div>
    )
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-bold" style={{ fontSize: 'var(--text-xl)' }}>Mes Listes</h1>
        {!showForm && (
          <Button variant="primary" size="sm" onClick={() => setShowForm(true)}>
            + Nouvelle
          </Button>
        )}
      </div>

      {showForm && (
        <div
          className="rounded-lg p-4 mb-4"
          style={{ backgroundColor: 'var(--color-surface)' }}
        >
          <h2 className="font-semibold mb-3" style={{ fontSize: 'var(--text-lg)', color: 'var(--color-text)' }}>
            Nouvelle liste
          </h2>

          <div className="flex flex-col gap-3">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nom de la liste"
              className="w-full rounded-lg px-3 py-2 bg-transparent outline-none min-h-[44px]"
              style={{ color: 'var(--color-text)', border: '1px solid var(--color-text-muted)' }}
              aria-label="Nom de la liste"
            />

            <div>
              <p className="text-sm mb-2" style={{ color: 'var(--color-text-muted)' }}>Limite de points</p>
              <div className="flex gap-3">
                {pointsOptions.map((pts) => {
                  const metal = pts === 1000 ? 'bronze' : pts === 2000 ? 'silver' : 'gold'
                  return (
                    <button
                      key={pts}
                      className={`btn-points btn-points--${metal} ${pointsLimit === pts ? 'btn-points--selected' : ''}`}
                      onClick={() => setPointsLimit(pts)}
                    >
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
                  onDetachmentChange={(det) => {
                    setSelectedDetachment(det)
                    setDetachment(det?.name ?? '')
                  }}
                />
              </div>
            )}

            <div className="flex gap-2 mt-2">
              <Button variant="primary" onClick={handleCreate} disabled={!name.trim() || !selectedFaction}>
                Créer
              </Button>
              <Button variant="ghost" onClick={() => setShowForm(false)}>
                Annuler
              </Button>
            </div>
          </div>
        </div>
      )}

      {allLists.map((list) => (
        <SwipeableListItem
          key={list.id}
          factionId={list.factionId}
          onTap={() => navigate(`/lists/${list.id}`)}
          onDelete={() => deleteList(list.id)}
        >
          <h3 className="font-semibold" style={{ color: 'var(--color-text)' }}>{list.name}</h3>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            {list.factionId} · {list.detachment} · {countSquads(list.units)} escouade{countSquads(list.units) > 1 ? 's' : ''} · {totalPoints(list.id)}/{list.pointsLimit} pts
          </p>
        </SwipeableListItem>
      ))}
    </div>
  )
}

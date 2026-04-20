import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { useListsStore } from '@/stores/listsStore'
import { useGameDataStore } from '@/stores/gameDataStore'
import { useGameData } from '@/hooks/useGameData'
import { calculateTotalPoints, countSquads } from '@/utils/pointsCalculator'
import { FactionPicker } from '@/components/domain/FactionPicker'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import type { PointsLimit } from '@/types/armyList.types'
import type { Detachment } from '@/types/gameData.types'

const pointsOptions: PointsLimit[] = [1000, 2000, 3000]

export function ListsPage() {
  const navigate = useNavigate()
  const lists = useListsStore((s) => s.lists)
  const getAllLists = useListsStore((s) => s.getAllLists)
  const createList = useListsStore((s) => s.createList)
  const deleteList = useListsStore((s) => s.deleteList)
  const { factionIndex } = useGameData()
  const loadedFactions = useGameDataStore((s) => s.loadedFactions)
  const loadFaction = useGameDataStore((s) => s.loadFaction)

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
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

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

  const handleDelete = (listId: string) => {
    if (confirmDeleteId === listId) {
      deleteList(listId)
      setConfirmDeleteId(null)
    } else {
      setConfirmDeleteId(listId)
    }
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

            {factionDetachments.length > 0 ? (
              <select
                value={selectedDetachment?.id ?? ''}
                onChange={(e) => {
                  const det = factionDetachments.find((d) => d.id === e.target.value) ?? null
                  setSelectedDetachment(det)
                  setDetachment(det?.name ?? '')
                }}
                className="w-full rounded-lg px-3 py-2 bg-transparent outline-none min-h-[44px]"
                style={{ color: 'var(--color-text)', border: '1px solid var(--color-text-muted)', backgroundColor: 'var(--color-surface)' }}
                aria-label="Détachement"
              >
                <option value="">— Choisir un détachement —</option>
                {factionDetachments.map((det) => (
                  <option key={det.id} value={det.id}>{det.name}</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={detachment}
                onChange={(e) => setDetachment(e.target.value)}
                placeholder="Détachement (ex: Gladius Task Force)"
                className="w-full rounded-lg px-3 py-2 bg-transparent outline-none min-h-[44px]"
                style={{ color: 'var(--color-text)', border: '1px solid var(--color-text-muted)' }}
                aria-label="Détachement"
              />
            )}

            <div>
              <p className="text-sm mb-2" style={{ color: 'var(--color-text-muted)' }}>Limite de points</p>
              <div className="flex gap-2">
                {pointsOptions.map((pts) => (
                  <button
                    key={pts}
                    className="px-4 py-2 rounded-lg text-sm font-medium min-h-[44px] cursor-pointer border-none"
                    style={{
                      backgroundColor: pointsLimit === pts ? 'var(--color-primary)' : 'var(--color-bg)',
                      color: pointsLimit === pts ? '#ffffff' : 'var(--color-text)',
                    }}
                    onClick={() => setPointsLimit(pts)}
                  >
                    {pts}
                  </button>
                ))}
              </div>
            </div>

            {factionIndex && (
              <div>
                <p className="text-sm mb-2" style={{ color: 'var(--color-text-muted)' }}>Faction</p>
                <FactionPicker
                  factions={factionIndex.factions}
                  onSelect={handleSelectFaction}
                  selectedSlug={selectedFaction}
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
        <div
          key={list.id}
          className="rounded-lg p-3 mb-3 cursor-pointer"
          style={{ backgroundColor: 'var(--color-surface)' }}
        >
          <div
            className="flex items-center justify-between"
            onClick={() => navigate(`/lists/${list.id}`)}
          >
            <div>
              <h3 className="font-semibold" style={{ color: 'var(--color-text)' }}>{list.name}</h3>
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                {list.factionId} · {list.detachment} · {countSquads(list.units)} escouade{countSquads(list.units) > 1 ? 's' : ''} · {totalPoints(list.id)}/{list.pointsLimit} pts
              </p>
            </div>
          </div>
          <div className="flex gap-2 mt-2">
            <Button
              variant="danger"
              size="sm"
              onClick={(e) => { e.stopPropagation(); handleDelete(list.id) }}
            >
              {confirmDeleteId === list.id ? 'Confirmer la suppression' : 'Supprimer'}
            </Button>
            {confirmDeleteId === list.id && (
              <Button variant="ghost" size="sm" onClick={() => setConfirmDeleteId(null)}>
                Annuler
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

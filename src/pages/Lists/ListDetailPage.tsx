import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router'
import { useListsStore } from '@/stores/listsStore'
import { useGameDataStore } from '@/stores/gameDataStore'
import { useCollectionStore } from '@/stores/collectionStore'
import { ArmyListHeader } from '@/components/domain/ArmyListHeader'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { calculateTotalPoints, resolveUnitPoints } from '@/utils/pointsCalculator'
import { validateArmyList } from '@/features/army-list/utils/validateArmyList'
import type { PointsLimit } from '@/types/armyList.types'

export function ListDetailPage() {
  const { listId } = useParams<{ listId: string }>()
  const navigate = useNavigate()
  const list = useListsStore((s) => listId ? s.lists[listId] : undefined)
  const removeUnit = useListsStore((s) => s.removeUnit)
  const updateList = useListsStore((s) => s.updateList)
  const loadedFactions = useGameDataStore((s) => s.loadedFactions)
  const loadFaction = useGameDataStore((s) => s.loadFaction)
  const isOwned = useCollectionStore((s) => s.isOwned)

  useEffect(() => {
    if (list) {
      loadFaction(list.factionId)
    }
  }, [list, loadFaction])

  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [editDetachment, setEditDetachment] = useState('')
  const [editPoints, setEditPoints] = useState<PointsLimit>(2000)

  const validation = useMemo(() => {
    if (!list) return undefined
    const faction = loadedFactions[list.factionId]
    if (!faction) return undefined
    const datasheets = list.units
      .map((u) => faction.datasheets.find((ds) => ds.id === u.datasheetId))
      .filter((ds): ds is NonNullable<typeof ds> => ds !== undefined)
    return validateArmyList(datasheets)
  }, [list, loadedFactions])

  if (!list || !listId) {
    return (
      <div className="p-4" style={{ color: 'var(--color-text-muted)' }}>
        Liste introuvable.
      </div>
    )
  }

  const faction = loadedFactions[list.factionId]
  const totalPoints = calculateTotalPoints(list.units, faction?.datasheets)

  const startEditing = () => {
    setEditName(list.name)
    setEditDetachment(list.detachment)
    setEditPoints(list.pointsLimit)
    setEditing(true)
  }

  const saveEditing = () => {
    const trimmedName = editName.trim()
    if (!trimmedName) return
    updateList(listId, {
      name: trimmedName,
      detachment: editDetachment.trim() || list.detachment,
      pointsLimit: editPoints,
    })
    setEditing(false)
  }

  return (
    <div>
      <ArmyListHeader
        name={list.name}
        factionId={list.factionId}
        detachment={list.detachment}
        currentPoints={totalPoints}
        pointsLimit={list.pointsLimit}
        validation={validation}
      />

      {editing && (
        <div className="p-4 flex flex-col gap-3" style={{ backgroundColor: 'var(--color-surface)', borderBottom: '1px solid var(--color-bg)' }}>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>Nom</label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="rounded-lg px-3 py-2 text-sm border-none outline-none"
              style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}
              autoFocus
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>Détachement</label>
            <input
              type="text"
              value={editDetachment}
              onChange={(e) => setEditDetachment(e.target.value)}
              className="rounded-lg px-3 py-2 text-sm border-none outline-none"
              style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>Limite de points</label>
            <div className="flex gap-2">
              {([1000, 2000, 3000] as PointsLimit[]).map((pts) => (
                <button
                  key={pts}
                  className="flex-1 rounded-lg py-2 text-sm font-medium border-none cursor-pointer min-h-[44px]"
                  style={{
                    backgroundColor: editPoints === pts ? 'var(--color-accent)' : 'var(--color-bg)',
                    color: editPoints === pts ? '#ffffff' : 'var(--color-text)',
                  }}
                  onClick={() => setEditPoints(pts)}
                >
                  {pts}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>Annuler</Button>
            <Button variant="primary" size="sm" onClick={saveEditing}>Enregistrer</Button>
          </div>
        </div>
      )}

      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/lists')}>
            ← Retour aux listes
          </Button>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={startEditing}>
              Modifier
            </Button>
            {list.units.length > 0 && (
              <Button variant="secondary" size="sm" onClick={() => navigate(`/game-mode/${listId}`)}>
                Mode partie
              </Button>
            )}
            <Button variant="primary" size="sm" onClick={() => navigate(`/catalog/${list.factionId}`)}>
              + Ajouter une unité
            </Button>
          </div>
        </div>

        {list.units.length === 0 ? (
          <EmptyState
            title="Liste vide"
            description="Ajoute des unités depuis le catalogue pour commencer à construire ta liste."
            actionLabel="Explorer le catalogue"
            onAction={() => navigate(`/catalog`)}
          />
        ) : (
          <div className="flex flex-col gap-2">
            {list.units.map((unit, i) => {
              const owned = isOwned(unit.datasheetId)
              return (
              <div
                key={i}
                className="flex items-center justify-between rounded-lg p-3 min-h-[44px]"
                style={{
                  backgroundColor: 'var(--color-surface)',
                  opacity: owned ? 1 : 0.5,
                  borderLeft: owned ? 'none' : '3px solid var(--color-warning, #f59e0b)',
                }}
              >
                <div>
                  <span className="font-medium text-sm" style={{ color: 'var(--color-text)' }}>
                    {unit.datasheetName}
                  </span>
                  <span className="text-xs ml-2" style={{ color: 'var(--color-accent)' }}>
                    {resolveUnitPoints(unit, faction?.datasheets)} pts
                  </span>
                  {!owned && (
                    <span className="text-xs ml-2" style={{ color: 'var(--color-warning, #f59e0b)' }}>
                      Non possédé
                    </span>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeUnit(listId, i)}
                  aria-label={`Retirer ${unit.datasheetName}`}
                >
                  ✕
                </Button>
              </div>
              )
            })}
          </div>
        )}

        {totalPoints > list.pointsLimit && (
          <div
            className="mt-4 p-3 rounded-lg text-sm"
            style={{ backgroundColor: 'var(--color-error)', color: '#ffffff' }}
          >
            Attention : la liste dépasse la limite de {list.pointsLimit} points !
          </div>
        )}
      </div>
    </div>
  )
}

import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router'
import { useListsStore } from '@/stores/listsStore'
import { useGameDataStore } from '@/stores/gameDataStore'
import { useCollectionStore } from '@/stores/collectionStore'
import { useToast } from '@/components/ui/Toast'
import { ArmyListHeader } from '@/components/domain/ArmyListHeader'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { EquipmentSelector } from '@/components/domain/EquipmentSelector'
import { calculateTotalPoints, resolveUnitPoints, countSquads, resolveSquadTotalPoints } from '@/utils/pointsCalculator'
import { validateArmyList } from '@/features/army-list/utils/validateArmyList'
import type { PointsLimit, ListUnit } from '@/types/armyList.types'
import type { Datasheet, Detachment, Enhancement } from '@/types/gameData.types'
import { isCharacter, canEquipEnhancement } from '@/utils/enhancementUtils'
import { useFactionTheme } from '@/hooks/useFactionTheme'
import { useAuthStore } from '@/stores/authStore'
import { setListPublic } from '@/services/listsSyncService'

export function ListDetailPage() {
  const { listId } = useParams<{ listId: string }>()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const list = useListsStore((s) => listId ? s.lists[listId] : undefined)

  useFactionTheme(list?.factionId ?? null)
  const removeUnit = useListsStore((s) => s.removeUnit)
  const updateUnit = useListsStore((s) => s.updateUnit)
  const updateList = useListsStore((s) => s.updateList)
  const attachHero = useListsStore((s) => s.attachHero)
  const detachHero = useListsStore((s) => s.detachHero)
  const setEnhancement = useListsStore((s) => s.setEnhancement)
  const loadedFactions = useGameDataStore((s) => s.loadedFactions)
  const loadFaction = useGameDataStore((s) => s.loadFaction)
  const isOwned = useCollectionStore((s) => s.isOwned)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  useEffect(() => {
    if (list) {
      loadFaction(list.factionId)
    }
  }, [list, loadFaction])

  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [editDetachmentId, setEditDetachmentId] = useState<string | undefined>(undefined)
  const [editDetachmentName, setEditDetachmentName] = useState('')
  const [editPoints, setEditPoints] = useState<PointsLimit>(2000)
  const [showDetachmentModal, setShowDetachmentModal] = useState(false)
  const [editingUnitIndex, setEditingUnitIndex] = useState<number | null>(null)
  const [attachingHeroIndex, setAttachingHeroIndex] = useState<number | null>(null)
  const [enhancementUnitIndex, setEnhancementUnitIndex] = useState<number | null>(null)

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

  // listId is guaranteed to be defined after the guard above
  const safeListId = listId as string
  const faction = loadedFactions[list.factionId]
  const totalPoints = calculateTotalPoints(list.units, faction?.datasheets)
  const squadCount = countSquads(list.units)

  const detachment: Detachment | undefined = faction?.detachments?.find(
    (d) => d.id === list.detachmentId || d.name === list.detachment,
  )
  const availableEnhancements: Enhancement[] = detachment?.enhancements ?? []

  // Units that already have an enhancement (for uniqueness check)
  const usedEnhancementIds = new Set(
    list.units.filter((u) => u.enhancement).map((u) => u.enhancement!.enhancementId),
  )

  const factionDetachments: Detachment[] = faction?.detachments ?? []

  const startEditing = () => {
    setEditName(list.name)
    setEditDetachmentId(list.detachmentId)
    setEditDetachmentName(list.detachment)
    setEditPoints(list.pointsLimit)
    setEditing(true)
  }

  const saveEditing = () => {
    const trimmedName = editName.trim()
    if (!trimmedName) return
    updateList(safeListId, {
      name: trimmedName,
      detachment: editDetachmentName || list.detachment,
      detachmentId: editDetachmentId,
      pointsLimit: editPoints,
    })
    setEditing(false)
  }

  const editingUnit = editingUnitIndex !== null ? list.units[editingUnitIndex] : null
  const editingDatasheet: Datasheet | undefined = editingUnit
    ? faction?.datasheets.find((ds) => ds.id === editingUnit.datasheetId)
    : undefined

  const handleSaveEquipment = (pointOptionIndex: number, weapons: string[], notes: string) => {
    if (editingUnitIndex === null || !editingDatasheet) return
    const cost = editingDatasheet.pointOptions[pointOptionIndex]?.cost ?? editingDatasheet.pointOptions[0]?.cost ?? 0
    updateUnit(safeListId, editingUnitIndex, {
      points: cost,
      selectedPointOptionIndex: pointOptionIndex,
      selectedWeapons: weapons,
      notes,
    })
    showToast('Équipement mis à jour', 'success')
    setEditingUnitIndex(null)
  }

  // Build grouped view: squads with their attached heroes
  const squads: Array<{ unit: ListUnit; index: number; heroes: Array<{ unit: ListUnit; index: number }> }> = []
  const freeHeroes: Array<{ unit: ListUnit; index: number }> = []

  list.units.forEach((unit, index) => {
    if (unit.attachedToId) return // skip attached heroes, they'll be nested
    const ds = faction?.datasheets.find((d) => d.id === unit.datasheetId)
    const isChar = isCharacter(ds)

    if (isChar && !unit.attachedToId) {
      // Free hero (not attached to anyone)
      freeHeroes.push({ unit, index })
    } else {
      // Squad — find attached heroes
      const heroes = list.units
        .map((u, i) => ({ unit: u, index: i }))
        .filter((h) => h.unit.attachedToId === unit.id)
      squads.push({ unit, index, heroes })
    }
  })

  // Available squads for hero attachment (non-character units)
  const availableSquads = list.units
    .map((u, i) => ({ unit: u, index: i }))
    .filter(({ unit }) => {
      const ds = faction?.datasheets.find((d) => d.id === unit.datasheetId)
      return !isCharacter(ds) && !unit.attachedToId
    })

  function renderUnitRow(unit: ListUnit, index: number, indent: boolean = false) {
    const owned = isOwned(unit.datasheetId)
    const ds = faction?.datasheets.find((d) => d.id === unit.datasheetId)
    const weaponCount = unit.selectedWeapons?.length ?? 0
    const isChar = isCharacter(ds)

    return (
      <div
        key={unit.id || index}
        className="rounded-lg p-3 min-h-[44px] cursor-pointer"
        style={{
          backgroundColor: 'var(--color-surface)',
          opacity: owned ? 1 : 0.5,
          borderLeft: indent
            ? '3px solid var(--color-accent)'
            : owned ? 'none' : '3px solid var(--color-warning, #f59e0b)',
          marginLeft: indent ? '16px' : 0,
        }}
        onClick={() => setEditingUnitIndex(index)}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            {indent && (
              <span className="text-xs mr-1" style={{ color: 'var(--color-accent)' }}>
                ↳
              </span>
            )}
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
            {ds && ds.pointOptions.length > 1 && (
              <span className="text-xs ml-2" style={{ color: 'var(--color-text-muted)' }}>
                ({ds.pointOptions[unit.selectedPointOptionIndex ?? 0]?.models ?? ds.pointOptions[0].models})
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {weaponCount > 0 && (
              <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                {weaponCount} arme{weaponCount > 1 ? 's' : ''}
              </span>
            )}
            {/* Enhancement for characters */}
            {isChar && ds && availableEnhancements.some((e) => !usedEnhancementIds.has(e.id) && canEquipEnhancement(e, ds)) && !unit.enhancement && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => { e.stopPropagation(); setEnhancementUnitIndex(index) }}
                aria-label="Ajouter une amélioration"
              >
                ✦
              </Button>
            )}
            {/* Attach/Detach for characters */}
            {isChar && unit.attachedToId && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => { e.stopPropagation(); detachHero(safeListId, index) }}
                aria-label="Détacher le héros"
              >
                ⇥
              </Button>
            )}
            {isChar && !unit.attachedToId && availableSquads.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => { e.stopPropagation(); setAttachingHeroIndex(index) }}
                aria-label="Attacher à une escouade"
              >
                ⇤
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => { e.stopPropagation(); removeUnit(safeListId, index) }}
              aria-label={`Retirer ${unit.datasheetName}`}
            >
              ✕
            </Button>
          </div>
        </div>
        {unit.enhancement && (
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs" style={{ color: 'var(--color-accent)' }}>
              ✦ {unit.enhancement.enhancementName} (+{unit.enhancement.cost} pts)
            </span>
            <button
              className="text-xs border-none bg-transparent cursor-pointer"
              style={{ color: 'var(--color-text-muted)' }}
              onClick={(e) => { e.stopPropagation(); setEnhancement(safeListId, index, undefined) }}
            >
              ✕
            </button>
          </div>
        )}
        {unit.notes && (
          <p className="text-xs mt-1 truncate" style={{ color: 'var(--color-text-muted)' }}>
            {unit.notes}
          </p>
        )}
      </div>
    )
  }

  return (
    <div>
      <ArmyListHeader
        name={list.name}
        factionId={list.factionId}
        detachment={list.detachment}
        currentPoints={totalPoints}
        pointsLimit={list.pointsLimit}
        squadCount={squadCount}
        validation={validation}
        onBack={() => navigate('/lists')}
        onEdit={startEditing}
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
            {factionDetachments.length > 0 ? (
              <button
                className="rounded-lg px-3 py-2 text-sm border-none cursor-pointer text-left min-h-[44px]"
                style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}
                onClick={() => setShowDetachmentModal(true)}
              >
                {editDetachmentName || '— Choisir un détachement —'}
              </button>
            ) : (
              <input
                type="text"
                value={editDetachmentName}
                onChange={(e) => setEditDetachmentName(e.target.value)}
                className="rounded-lg px-3 py-2 text-sm border-none outline-none"
                style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}
              />
            )}
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>Limite de points</label>
            <div className="flex gap-3">
              {([1000, 2000, 3000] as PointsLimit[]).map((pts) => {
                const metal = pts === 1000 ? 'bronze' : pts === 2000 ? 'silver' : 'gold'
                return (
                  <button
                    key={pts}
                    className={`btn-points btn-points--${metal} flex-1 ${editPoints === pts ? 'btn-points--selected' : ''}`}
                    onClick={() => setEditPoints(pts)}
                  >
                    {pts}
                  </button>
                )
              })}
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>Annuler</Button>
            <Button variant="primary" size="sm" onClick={saveEditing}>Enregistrer</Button>
          </div>
        </div>
      )}

      {/* Detachment picker modal (edit mode) */}
      {showDetachmentModal && (
        <div className="detachment-modal-overlay" onClick={() => setShowDetachmentModal(false)}>
          <div
            className="detachment-modal"
            onClick={(e) => e.stopPropagation()}
            style={{
              '--tile-primary': 'var(--color-primary)',
              '--tile-accent': 'var(--color-accent)',
              '--tile-surface': 'var(--color-surface)',
            } as React.CSSProperties}
          >
            <h3 className="detachment-modal__title">Détachement</h3>
            <div className="detachment-modal__list">
              {factionDetachments.map((det) => (
                <button
                  key={det.id}
                  type="button"
                  className={`detachment-modal__item ${editDetachmentId === det.id ? 'detachment-modal__item--active' : ''}`}
                  onClick={() => {
                    setEditDetachmentId(det.id)
                    setEditDetachmentName(det.name)
                    setShowDetachmentModal(false)
                  }}
                >
                  {det.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="p-4">
        {list.units.length > 0 && (
          <div className="flex items-center gap-2 mb-4">
            <Button variant="secondary" size="sm" onClick={() => navigate(`/game-mode/${safeListId}`)}>
              Jouer
            </Button>
            <Button variant="primary" size="sm" onClick={() => navigate(`/lists/${safeListId}/add-unit`)}>
              + Ajouter
            </Button>
          </div>
        )}

        {/* Public/Private toggle — only for authenticated users with a synced list */}
        {isAuthenticated && list.remoteId && (
          <button
            className="flex items-center gap-2 mb-4 text-sm bg-transparent border-none cursor-pointer"
            style={{ color: 'var(--color-text-muted)' }}
            onClick={() => {
              const newPublic = !list.isPublic
              updateList(safeListId, { isPublic: newPublic })
              setListPublic(list.remoteId!, newPublic)
            }}
          >
            <span>{list.isPublic ? '🔓' : '🔒'}</span>
            <span>{list.isPublic ? 'Publique' : 'Privée'}</span>
          </button>
        )}

        {list.units.length === 0 ? (
          <EmptyState
            title="Liste vide"
            description="Ajoute des unités depuis le catalogue pour commencer à construire ta liste."
            actionLabel="Ajouter une unité"
            onAction={() => navigate(`/lists/${safeListId}/add-unit`)}
          />
        ) : (
          <div className="flex flex-col gap-2">
            {/* Squads with attached heroes */}
            {squads.map(({ unit, index, heroes }) => {
              const hasHeroes = heroes.length > 0
              const squadTotals = hasHeroes
                ? resolveSquadTotalPoints(unit, list.units, faction?.datasheets)
                : null

              return (
                <div key={unit.id || index}>
                  {renderUnitRow(unit, index)}
                  {heroes.map((h) => renderUnitRow(h.unit, h.index, true))}
                  {hasHeroes && squadTotals && (
                    <div
                      className="text-xs px-3 py-1 rounded-b-lg -mt-1"
                      style={{
                        backgroundColor: 'color-mix(in srgb, var(--color-surface) 60%, transparent)',
                        color: 'var(--color-text-muted)',
                        marginLeft: '16px',
                      }}
                    >
                      Total : {squadTotals.squadPoints} + {squadTotals.heroPoints} = <strong style={{ color: 'var(--color-accent)' }}>{squadTotals.total} pts</strong>
                    </div>
                  )}
                </div>
              )
            })}

            {/* Free heroes (not attached) */}
            {freeHeroes.map(({ unit, index }) => renderUnitRow(unit, index))}
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

      {/* Equipment editor modal */}
      {editingUnitIndex !== null && editingDatasheet && editingUnit && (
        <EquipmentSelector
          datasheet={editingDatasheet}
          initialPointOptionIndex={editingUnit.selectedPointOptionIndex ?? 0}
          initialWeapons={editingUnit.selectedWeapons ?? []}
          initialNotes={editingUnit.notes ?? ''}
          onConfirm={handleSaveEquipment}
          onCancel={() => setEditingUnitIndex(null)}
          confirmLabel="Enregistrer"
        />
      )}

      {/* Enhancement picker modal */}
      {enhancementUnitIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
          onClick={() => setEnhancementUnitIndex(null)}
        >
          <div
            className="w-full max-w-lg rounded-t-xl p-4"
            style={{ backgroundColor: 'var(--color-bg)', maxHeight: '70vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-semibold mb-3" style={{ color: 'var(--color-text)' }}>
              Choisir une amélioration
            </h3>
            <div className="flex flex-col gap-2">
              {availableEnhancements
                .filter((enh) => {
                  if (usedEnhancementIds.has(enh.id)) return false
                  const enhUnit = enhancementUnitIndex !== null ? list.units[enhancementUnitIndex] : null
                  const enhDs = enhUnit ? faction?.datasheets.find((d) => d.id === enhUnit.datasheetId) : undefined
                  return enhDs ? canEquipEnhancement(enh, enhDs) : true
                })
                .map((enh) => (
                  <button
                    key={enh.id}
                    className="text-left rounded-lg p-3 border-none cursor-pointer"
                    style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                    onClick={() => {
                      setEnhancement(safeListId, enhancementUnitIndex, {
                        enhancementId: enh.id,
                        enhancementName: enh.name,
                        cost: enh.cost,
                      })
                      setEnhancementUnitIndex(null)
                      showToast(`${enh.name} assignée`, 'success')
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{enh.name}</span>
                      <span className="text-xs font-mono" style={{ color: 'var(--color-accent)' }}>
                        {enh.cost} pts
                      </span>
                    </div>
                    {enh.legend && (
                      <p className="text-xs italic mt-1" style={{ color: 'var(--color-text-muted)' }}>
                        {enh.legend}
                      </p>
                    )}
                    <div
                      className="text-xs mt-1 leading-relaxed"
                      style={{ color: 'var(--color-text-muted)' }}
                      dangerouslySetInnerHTML={{ __html: enh.description }}
                    />
                  </button>
                ))}
              {availableEnhancements.filter((enh) => !usedEnhancementIds.has(enh.id)).length === 0 && (
                <p className="text-sm text-center py-4" style={{ color: 'var(--color-text-muted)' }}>
                  Toutes les améliorations sont déjà assignées.
                </p>
              )}
            </div>
            <Button variant="ghost" size="sm" className="mt-3" onClick={() => setEnhancementUnitIndex(null)}>
              Annuler
            </Button>
          </div>
        </div>
      )}

      {/* Attach hero modal */}
      {attachingHeroIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
          onClick={() => setAttachingHeroIndex(null)}
        >
          <div
            className="w-full max-w-lg rounded-t-xl p-4"
            style={{ backgroundColor: 'var(--color-bg)', maxHeight: '60vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-semibold mb-3" style={{ color: 'var(--color-text)' }}>
              Attacher à une escouade
            </h3>
            <div className="flex flex-col gap-2">
              {availableSquads.map(({ unit: sq }) => (
                <button
                  key={sq.id}
                  className="text-left rounded-lg p-3 border-none cursor-pointer"
                  style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                  onClick={() => {
                    attachHero(safeListId, attachingHeroIndex, sq.id)
                    setAttachingHeroIndex(null)
                    showToast('Héros attaché', 'success')
                  }}
                >
                  <span className="font-medium text-sm">{sq.datasheetName}</span>
                  <span className="text-xs ml-2" style={{ color: 'var(--color-accent)' }}>
                    {resolveUnitPoints(sq, faction?.datasheets)} pts
                  </span>
                </button>
              ))}
            </div>
            <Button variant="ghost" size="sm" className="mt-3" onClick={() => setAttachingHeroIndex(null)}>
              Annuler
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

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
import { T } from '@/components/ui/TranslatableText'
import { THtml } from '@/components/ui/TranslatableText'
import { useFactionTheme } from '@/hooks/useFactionTheme'
import { useAuthStore } from '@/stores/authStore'
import { setListPublic } from '@/services/listsSyncService'
import { ListsDesktopLayout } from './components/ListsDesktopLayout'
import { ListDetailCenter } from './components/ListDetailCenter'
import { ListRightPanel } from './components/ListRightPanel'

export function ListDetailPage() {
  const { listId } = useParams<{ listId: string }>()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const list = useListsStore((s) => listId ? s.lists[listId] : undefined)

  // On desktop, keep default blue theme (layout handles it); on mobile, apply faction theme
  const isDesktop = typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches
  useFactionTheme(isDesktop ? null : (list?.factionId ?? null))
  const removeUnit = useListsStore((s) => s.removeUnit)
  const updateUnit = useListsStore((s) => s.updateUnit)
  const updateList = useListsStore((s) => s.updateList)
  const attachHero = useListsStore((s) => s.attachHero)
  const detachHero = useListsStore((s) => s.detachHero)
  const setEnhancement = useListsStore((s) => s.setEnhancement)
  const loadedFactions = useGameDataStore((s) => s.loadedFactions)
  const loadFaction = useGameDataStore((s) => s.loadFaction)
  const isOwned = useCollectionStore((s) => s.isOwned)
  const collectionItems = useCollectionStore((s) => s.items)
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
    const isChar = isCharacter(ds)
    const pts = resolveUnitPoints(unit, faction?.datasheets)
    const optIdx = unit.selectedPointOptionIndex ?? 0
    const modelsStr = ds?.pointOptions[optIdx]?.models ?? ds?.pointOptions[0]?.models ?? '1'
    const profile = ds?.profiles[0]
    const statsLine = profile
      ? `${modelsStr} · M${profile.M} T${profile.T} SV${profile.Sv} W${profile.W}`
      : modelsStr

    return (
      <div
        key={unit.id || index}
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderLeftWidth: indent ? 3 : 1,
          borderLeftColor: indent ? 'var(--color-accent)' : owned ? 'var(--color-border)' : 'var(--color-warning, #f59e0b)',
          padding: '10px 12px',
          cursor: 'pointer',
          marginLeft: indent ? 16 : 0,
          opacity: owned ? 1 : 0.6,
        }}
        onClick={() => setEditingUnitIndex(index)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Unit image */}
          {ds?.imageUrl ? (
            <img
              src={ds.imageUrl}
              alt={unit.datasheetName}
              style={{
                width: 40,
                height: 40,
                objectFit: 'cover',
                borderRadius: 4,
                background: 'var(--color-bg)',
                flexShrink: 0,
              }}
            />
          ) : (
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 4,
                background: 'var(--color-bg)',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span style={{ fontSize: 16, color: 'var(--color-text-muted)', opacity: 0.4 }}>?</span>
            </div>
          )}

          {/* Name + stats */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {indent && (
                <span style={{ color: 'var(--color-accent)', fontSize: 11 }}>&#8627;</span>
              )}
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                <T text={unit.datasheetName} category="unit" />
              </span>
            </div>
            <div
              style={{
                fontSize: 9,
                color: 'var(--color-text-muted)',
                fontFamily: 'var(--font-mono)',
                letterSpacing: 0.3,
                marginTop: 2,
              }}
            >
              {statsLine}
            </div>
            {unit.enhancement && (
              <div style={{ fontSize: 9, color: 'var(--color-accent)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                <span>&#10022; {unit.enhancement.enhancementName} (+{unit.enhancement.cost} pts)</span>
                <button
                  style={{ background: 'transparent', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: 9, padding: '0 2px' }}
                  onClick={(e) => { e.stopPropagation(); setEnhancement(safeListId, index, undefined) }}
                >
                  &#10005;
                </button>
              </div>
            )}
            {unit.notes && (
              <div style={{ fontSize: 9, color: 'var(--color-text-muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {unit.notes}
              </div>
            )}
          </div>

          {/* Points */}
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--color-accent)' }}>
              {pts}
            </div>
            <div style={{ fontSize: 8, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: 0.5 }}>
              pts
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flexShrink: 0 }}>
            {isChar && ds && availableEnhancements.some((e) => !usedEnhancementIds.has(e.id) && canEquipEnhancement(e, ds)) && !unit.enhancement && (
              <button
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-accent)', fontSize: 12, padding: '2px 4px' }}
                onClick={(e) => { e.stopPropagation(); setEnhancementUnitIndex(index) }}
                aria-label="Ajouter une amélioration"
              >
                &#10022;
              </button>
            )}
            {isChar && unit.attachedToId && (
              <button
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', fontSize: 11, padding: '2px 4px' }}
                onClick={(e) => { e.stopPropagation(); detachHero(safeListId, index) }}
                aria-label="Détacher le héros"
              >
                &#8677;
              </button>
            )}
            {isChar && !unit.attachedToId && availableSquads.length > 0 && (
              <button
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', fontSize: 11, padding: '2px 4px' }}
                onClick={(e) => { e.stopPropagation(); setAttachingHeroIndex(index) }}
                aria-label="Attacher à une escouade"
              >
                &#8676;
              </button>
            )}
            <button
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', fontSize: 11, padding: '2px 4px' }}
              onClick={(e) => { e.stopPropagation(); removeUnit(safeListId, index) }}
              aria-label={`Retirer ${unit.datasheetName}`}
            >
              &#10005;
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Desktop: 3-column layout
  const desktopView = list && listId ? (
    <ListsDesktopLayout
      center={
        <ListDetailCenter
          list={list}
          listId={listId}
          faction={faction}
        />
      }
      right={
        <ListRightPanel
          list={list}
          faction={faction}
          collectionItems={collectionItems}
        />
      }
    />
  ) : null

  return (
    <div>
      {/* Desktop layout */}
      <div className="hidden lg:block">
        {desktopView}
      </div>

      {/* Mobile layout */}
      <div className="lg:hidden">
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
                  <T text={det.name} category="detachment" />
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
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
                      style={{
                        fontSize: 10,
                        fontFamily: 'var(--font-mono)',
                        padding: '4px 12px',
                        marginLeft: 16,
                        borderLeft: '3px solid var(--color-accent)',
                        color: 'var(--color-text-muted)',
                        background: 'color-mix(in srgb, var(--color-surface) 60%, transparent)',
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
          data-scroll-lock
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
                      <span className="font-medium text-sm"><T text={enh.name} category="enhancement" /></span>
                      <span className="text-xs font-mono" style={{ color: 'var(--color-accent)' }}>
                        {enh.cost} pts
                      </span>
                    </div>
                    {enh.legend && (
                      <p className="text-xs italic mt-1" style={{ color: 'var(--color-text-muted)' }}>
                        <T text={enh.legend} category="enhancement" />
                      </p>
                    )}
                    <THtml
                      html={enh.description}
                      category="enhancement"
                      className="text-xs mt-1 leading-relaxed"
                      style={{ color: 'var(--color-text-muted)' }}
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
          data-scroll-lock
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
                  <span className="font-medium text-sm"><T text={sq.datasheetName} category="unit" /></span>
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
    </div>
  )
}

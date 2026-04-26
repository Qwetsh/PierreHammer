import { useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router'
import { useListsStore } from '@/stores/listsStore'
import { useCollectionStore } from '@/stores/collectionStore'
import { useToast } from '@/components/ui/Toast'
import { useAuthStore } from '@/stores/authStore'
import { setListPublic } from '@/services/listsSyncService'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { EquipmentSelector } from '@/components/domain/EquipmentSelector'
import { UnitCard } from '@/components/domain/UnitCard'
import { SearchBar } from '@/components/ui/SearchBar'
import { HudBtn, HudPointsCounter, MSection } from '@/components/ui/Hud'
import { T } from '@/components/ui/TranslatableText'
import { THtml } from '@/components/ui/TranslatableText'
import { useSearch } from '@/hooks/useSearch'
import { calculateTotalPoints, resolveUnitPoints, countSquads, resolveSquadTotalPoints } from '@/utils/pointsCalculator'
import { validateArmyList } from '@/features/army-list/utils/validateArmyList'
import { isCharacter, canEquipEnhancement } from '@/utils/enhancementUtils'
import type { ArmyList, ListUnit, PointsLimit } from '@/types/armyList.types'
import type { Faction, Datasheet, Detachment, Enhancement } from '@/types/gameData.types'
import type { PaintStatus } from '@/components/domain/PaintStatusBadge'

const extractSearchFields = (ds: Datasheet): string[] => [
  ds.name,
  ...ds.keywords.map((k) => k.keyword),
]

function relativeDate(timestamp: number): string {
  const diff = Date.now() - timestamp
  const days = Math.floor(diff / 86400000)
  if (days === 0) return "aujourd'hui"
  if (days === 1) return 'hier'
  if (days < 30) return `il y a ${days} jours`
  const months = Math.floor(days / 30)
  if (months === 1) return 'il y a 1 mois'
  return `il y a ${months} mois`
}

// Paint status dot colors
const paintDotColor: Record<PaintStatus, string> = {
  unassembled: 'var(--color-error)',
  assembled: 'var(--color-error)',
  'in-progress': 'var(--color-warning)',
  done: 'var(--color-success)',
}

function PaintDots({ datasheetId, collectionItems }: { datasheetId: string; collectionItems: Record<string, { instances: PaintStatus[] }> }) {
  const item = collectionItems[datasheetId]
  if (!item?.instances?.length) {
    return <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-error)', display: 'inline-block' }} />
  }
  return (
    <span style={{ display: 'inline-flex', gap: 3, alignItems: 'center' }}>
      {item.instances.map((status, i) => (
        <span
          key={i}
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: paintDotColor[status] || 'var(--color-error)',
            boxShadow: `0 0 4px ${paintDotColor[status] || 'var(--color-error)'}`,
          }}
        />
      ))}
    </span>
  )
}

function UnitRow({
  unit,
  index,
  indent,
  faction,
  collectionItems,
  onEdit,
  onRemove,
  onAttach,
  onDetach,
  onEnhancement,
  onRemoveEnhancement,
  showAttach,
  showEnhancementBtn,
}: {
  unit: ListUnit
  index: number
  indent: boolean
  faction: Faction | undefined
  collectionItems: Record<string, { instances: PaintStatus[] }>
  onEdit: (index: number) => void
  onRemove: (index: number) => void
  onAttach: (index: number) => void
  onDetach: (index: number) => void
  onEnhancement: (index: number) => void
  onRemoveEnhancement: (index: number) => void
  showAttach: boolean
  showEnhancementBtn: boolean
}) {
  const ds = faction?.datasheets.find((d) => d.id === unit.datasheetId)
  const isChar = isCharacter(ds)
  const pts = resolveUnitPoints(unit, faction?.datasheets)
  const optIdx = unit.selectedPointOptionIndex ?? 0
  const modelsStr = ds?.pointOptions[optIdx]?.models ?? ds?.pointOptions[0]?.models ?? '1'
  const profile = ds?.profiles[0]

  // Stats line — modelsStr may already contain text like "1 model", so use as-is
  const statsLine = profile
    ? `${modelsStr} · M${profile.M} T${profile.T} SV${profile.Sv} W${profile.W}`
    : modelsStr

  return (
    <div
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        padding: '10px 14px',
        cursor: 'pointer',
        marginLeft: indent ? 20 : 0,
        borderLeftColor: indent ? 'var(--color-accent)' : 'var(--color-border)',
        borderLeftWidth: indent ? 3 : 1,
        transition: 'border-color 0.15s',
      }}
      onClick={() => onEdit(index)}
      onMouseEnter={(e) => {
        if (!indent) e.currentTarget.style.borderColor = 'var(--color-border-hot)'
      }}
      onMouseLeave={(e) => {
        if (!indent) e.currentTarget.style.borderColor = 'var(--color-border)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Unit image */}
        {ds?.imageUrl ? (
          <img
            src={ds.imageUrl}
            alt={unit.datasheetName}
            style={{
              width: 44,
              height: 44,
              objectFit: 'cover',
              borderRadius: 4,
              background: 'var(--color-bg)',
              flexShrink: 0,
            }}
          />
        ) : (
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 4,
              background: 'var(--color-bg)',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span style={{ fontSize: 18, color: 'var(--color-text-muted)', opacity: 0.4 }}>?</span>
          </div>
        )}

        {/* Name + stats */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {indent && (
              <span style={{ color: 'var(--color-accent)', fontSize: 11 }}>&#8627;</span>
            )}
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)' }}>
              <T text={unit.datasheetName} category="unit" />
            </span>
          </div>
          <div
            style={{
              fontSize: 10,
              color: 'var(--color-text-muted)',
              fontFamily: 'var(--font-mono)',
              letterSpacing: 0.3,
              marginTop: 2,
            }}
          >
            {statsLine}
          </div>
          {unit.enhancement && (
            <div style={{ fontSize: 10, color: 'var(--color-accent)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
              <span>&#10022; {unit.enhancement.enhancementName} (+{unit.enhancement.cost} pts)</span>
              <button
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--color-text-muted)',
                  cursor: 'pointer',
                  fontSize: 10,
                  padding: '0 2px',
                }}
                onClick={(e) => { e.stopPropagation(); onRemoveEnhancement(index) }}
              >
                &#10005;
              </button>
            </div>
          )}
        </div>

        {/* Paint dots */}
        <PaintDots datasheetId={unit.datasheetId} collectionItems={collectionItems} />

        {/* Points */}
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 18, fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--color-accent)' }}>
            {pts}
          </div>
          <div style={{ fontSize: 9, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: 0.5 }}>
            pts
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flexShrink: 0 }}>
          {showEnhancementBtn && isChar && !unit.enhancement && (
            <button
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-accent)', fontSize: 12, padding: '2px 4px' }}
              onClick={(e) => { e.stopPropagation(); onEnhancement(index) }}
              title="Ajouter une amelioration"
            >
              &#10022;
            </button>
          )}
          {isChar && unit.attachedToId && (
            <button
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', fontSize: 11, padding: '2px 4px' }}
              onClick={(e) => { e.stopPropagation(); onDetach(index) }}
              title="Detacher"
            >
              &#8677;
            </button>
          )}
          {isChar && !unit.attachedToId && showAttach && (
            <button
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', fontSize: 11, padding: '2px 4px' }}
              onClick={(e) => { e.stopPropagation(); onAttach(index) }}
              title="Attacher a une escouade"
            >
              &#8676;
            </button>
          )}
          <button
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', fontSize: 11, padding: '2px 4px' }}
            onClick={(e) => { e.stopPropagation(); onRemove(index) }}
            title={`Retirer ${unit.datasheetName}`}
          >
            &#10005;
          </button>
        </div>
      </div>
    </div>
  )
}

export function ListDetailCenter({
  list,
  listId,
  faction,
}: {
  list: ArmyList
  listId: string
  faction: Faction | undefined
}) {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const removeUnit = useListsStore((s) => s.removeUnit)
  const addUnit = useListsStore((s) => s.addUnit)
  const updateUnit = useListsStore((s) => s.updateUnit)
  const updateList = useListsStore((s) => s.updateList)
  const attachHero = useListsStore((s) => s.attachHero)
  const detachHero = useListsStore((s) => s.detachHero)
  const setEnhancement = useListsStore((s) => s.setEnhancement)
  const collectionItems = useCollectionStore((s) => s.items)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [editDetachmentId, setEditDetachmentId] = useState<string | undefined>(undefined)
  const [editDetachmentName, setEditDetachmentName] = useState('')
  const [editPoints, setEditPoints] = useState<PointsLimit>(2000)
  const [showDetachmentModal, setShowDetachmentModal] = useState(false)
  const [showDetachmentPicker, setShowDetachmentPicker] = useState(false)
  const [editingUnitIndex, setEditingUnitIndex] = useState<number | null>(null)
  const [attachingHeroIndex, setAttachingHeroIndex] = useState<number | null>(null)
  const [enhancementUnitIndex, setEnhancementUnitIndex] = useState<number | null>(null)

  // Add-unit modal states
  const [showAddUnitModal, setShowAddUnitModal] = useState(false)
  const [addUnitQuery, setAddUnitQuery] = useState('')
  const [addUnitRoleFilter, setAddUnitRoleFilter] = useState<string | 'all'>('all')
  const [addUnitOwnedOnly, setAddUnitOwnedOnly] = useState(false)
  const [addUnitSelectedDs, setAddUnitSelectedDs] = useState<Datasheet | null>(null)
  const [addUnitEnhPicker, setAddUnitEnhPicker] = useState<{
    datasheet: Datasheet
    unitIndex: number
    enhancements: Enhancement[]
  } | null>(null)

  const totalPoints = calculateTotalPoints(list.units, faction?.datasheets)
  const squadCount = countSquads(list.units)

  // Total models
  const totalModels = useMemo(() => {
    let count = 0
    for (const unit of list.units) {
      const ds = faction?.datasheets.find((d) => d.id === unit.datasheetId)
      if (!ds) { count += 1; continue }
      const optIdx = unit.selectedPointOptionIndex ?? 0
      const modelsStr = ds.pointOptions[optIdx]?.models ?? ds.pointOptions[0]?.models ?? '1'
      count += parseInt(modelsStr, 10) || 1
    }
    return count
  }, [list.units, faction])

  const validation = useMemo(() => {
    if (!faction) return undefined
    const datasheets = list.units
      .map((u) => faction.datasheets.find((ds) => ds.id === u.datasheetId))
      .filter((ds): ds is NonNullable<typeof ds> => ds !== undefined)
    return validateArmyList(datasheets)
  }, [list, faction])

  const detachment: Detachment | undefined = faction?.detachments?.find(
    (d) => d.id === list.detachmentId || d.name === list.detachment,
  )
  const availableEnhancements: Enhancement[] = detachment?.enhancements ?? []
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
    updateList(listId, {
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
    updateUnit(listId, editingUnitIndex, {
      points: cost,
      selectedPointOptionIndex: pointOptionIndex,
      selectedWeapons: weapons,
      notes,
    })
    showToast('Equipement mis a jour', 'success')
    setEditingUnitIndex(null)
  }

  // Build grouped view: squads with attached heroes
  const squads: Array<{ unit: ListUnit; index: number; heroes: Array<{ unit: ListUnit; index: number }> }> = []
  const freeHeroes: Array<{ unit: ListUnit; index: number }> = []

  list.units.forEach((unit, index) => {
    if (unit.attachedToId) return
    const ds = faction?.datasheets.find((d) => d.id === unit.datasheetId)
    const isChar = isCharacter(ds)
    if (isChar && !unit.attachedToId) {
      freeHeroes.push({ unit, index })
    } else {
      const heroes = list.units
        .map((u, i) => ({ unit: u, index: i }))
        .filter((h) => h.unit.attachedToId === unit.id)
      squads.push({ unit, index, heroes })
    }
  })

  const availableSquads = list.units
    .map((u, i) => ({ unit: u, index: i }))
    .filter(({ unit }) => {
      const ds = faction?.datasheets.find((d) => d.id === unit.datasheetId)
      return !isCharacter(ds) && !unit.attachedToId
    })

  // Add-unit modal: datasheets, roles, filtered list
  const allDatasheets = faction?.datasheets ?? []
  const addUnitRoles = useMemo(() => {
    const r = new Set(allDatasheets.map((ds) => ds.role).filter(Boolean))
    return Array.from(r).sort()
  }, [allDatasheets])

  const roleFilteredDs = useMemo(() => {
    let filtered = allDatasheets
    if (addUnitRoleFilter !== 'all') filtered = filtered.filter((ds) => ds.role === addUnitRoleFilter)
    if (addUnitOwnedOnly) filtered = filtered.filter((ds) => (collectionItems[ds.id]?.instances?.length ?? 0) > 0)
    return filtered
  }, [allDatasheets, addUnitRoleFilter, addUnitOwnedOnly, collectionItems])

  const extractFields = useCallback(extractSearchFields, [])
  const addUnitFiltered = useSearch(roleFilteredDs, addUnitQuery, extractFields)

  const handleAddUnitConfirm = (pointOptionIndex: number, weapons: string[], notes: string) => {
    if (!addUnitSelectedDs) return
    const cost = addUnitSelectedDs.pointOptions[pointOptionIndex]?.cost ?? addUnitSelectedDs.pointOptions[0]?.cost ?? 0
    const unitId = Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
    addUnit(listId, {
      id: unitId,
      datasheetId: addUnitSelectedDs.id,
      datasheetName: addUnitSelectedDs.name,
      points: cost,
      selectedPointOptionIndex: pointOptionIndex,
      selectedWeapons: weapons,
      notes,
    })

    // Check for eligible enhancements
    const enhancements = detachment?.enhancements ?? []
    if (isCharacter(addUnitSelectedDs) && enhancements.length > 0) {
      const eligible = enhancements.filter(
        (e) => !usedEnhancementIds.has(e.id) && canEquipEnhancement(e, addUnitSelectedDs),
      )
      if (eligible.length > 0) {
        const unitIndex = list.units.length
        setAddUnitEnhPicker({ datasheet: addUnitSelectedDs, unitIndex, enhancements: eligible })
        setAddUnitSelectedDs(null)
        return
      }
    }

    showToast(`${addUnitSelectedDs.name} ajoutee`, 'success')
    setAddUnitSelectedDs(null)
  }

  const handleAddUnitEnhancement = (enh: Enhancement) => {
    if (!addUnitEnhPicker) return
    setEnhancement(listId, addUnitEnhPicker.unitIndex, {
      enhancementId: enh.id,
      enhancementName: enh.name,
      cost: enh.cost,
    })
    showToast(`${addUnitEnhPicker.datasheet.name} + ${enh.name} ajoutee`, 'success')
    setAddUnitEnhPicker(null)
  }

  const handleSkipAddUnitEnh = () => {
    if (!addUnitEnhPicker) return
    showToast(`${addUnitEnhPicker.datasheet.name} ajoutee`, 'success')
    setAddUnitEnhPicker(null)
  }

  const closeAddUnitModal = () => {
    setShowAddUnitModal(false)
    setAddUnitQuery('')
    setAddUnitRoleFilter('all')
    setAddUnitSelectedDs(null)
    setAddUnitEnhPicker(null)
  }

  return (
    <div style={{ flex: 1, minWidth: 0, height: '100%', overflow: 'auto' }}>
      {/* Header */}
      <div style={{ padding: '20px 28px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Breadcrumb */}
            <div
              style={{
                fontSize: 9,
                fontFamily: 'var(--font-mono)',
                letterSpacing: 2,
                color: 'var(--color-accent)',
                textTransform: 'uppercase',
                marginBottom: 6,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <span>&#9656; {list.factionId} &middot;</span>
              {factionDetachments.length > 0 ? (
                <button
                  onClick={() => setShowDetachmentPicker(true)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--color-accent)',
                    cursor: 'pointer',
                    fontSize: 9,
                    fontFamily: 'var(--font-mono)',
                    letterSpacing: 2,
                    textTransform: 'uppercase',
                    padding: '2px 4px',
                    borderBottom: '1px dashed var(--color-accent)',
                  }}
                >
                  {list.detachment} {!detachment && '(choisir)'}
                </button>
              ) : (
                <span>{list.detachment}</span>
              )}
            </div>

            {/* Title */}
            <h1
              style={{
                fontSize: 28,
                fontWeight: 600,
                color: 'var(--color-text)',
                margin: 0,
                lineHeight: 1.1,
              }}
            >
              {list.name}
            </h1>

            {/* Subtitle */}
            <div
              style={{
                fontSize: 10,
                fontFamily: 'var(--font-mono)',
                letterSpacing: 1,
                color: 'var(--color-text-muted)',
                textTransform: 'uppercase',
                marginTop: 6,
              }}
            >
              {squadCount} unites &middot; {totalModels} modeles &middot; creee {relativeDate(list.createdAt)}
            </div>
          </div>

          {/* Points counter */}
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div
              style={{
                fontSize: 9,
                fontFamily: 'var(--font-mono)',
                letterSpacing: 2,
                color: 'var(--color-text-muted)',
                textTransform: 'uppercase',
                marginBottom: 4,
              }}
            >
              Points
            </div>
            <HudPointsCounter used={totalPoints} limit={list.pointsLimit} size="big" />
          </div>
        </div>

        {/* Action buttons row */}
        <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
          <HudBtn
            variant="ghost"
            onClick={() => {}}
            style={{ position: 'relative' }}
          >
            <span
              className="btn-tooltip-target"
              onMouseEnter={(e) => {
                const tip = e.currentTarget.querySelector('.btn-tooltip') as HTMLElement
                if (tip) tip.style.display = 'block'
              }}
              onMouseLeave={(e) => {
                const tip = e.currentTarget.querySelector('.btn-tooltip') as HTMLElement
                if (tip) tip.style.display = 'none'
              }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
            >
              &#9998; PDF
              <span
                className="btn-tooltip"
                style={{
                  display: 'none',
                  position: 'absolute',
                  bottom: '110%',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  padding: '4px 8px',
                  fontSize: 9,
                  fontFamily: 'var(--font-mono)',
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text-muted)',
                  whiteSpace: 'nowrap',
                  zIndex: 10,
                }}
              >
                Bientot disponible
              </span>
            </span>
          </HudBtn>
          <HudBtn
            variant="ghost"
            onClick={() => {}}
            style={{ position: 'relative' }}
          >
            <span
              onMouseEnter={(e) => {
                const tip = e.currentTarget.querySelector('.btn-tooltip') as HTMLElement
                if (tip) tip.style.display = 'block'
              }}
              onMouseLeave={(e) => {
                const tip = e.currentTarget.querySelector('.btn-tooltip') as HTMLElement
                if (tip) tip.style.display = 'none'
              }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
            >
              &#9741; DUPLIQUER
              <span
                className="btn-tooltip"
                style={{
                  display: 'none',
                  position: 'absolute',
                  bottom: '110%',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  padding: '4px 8px',
                  fontSize: 9,
                  fontFamily: 'var(--font-mono)',
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text-muted)',
                  whiteSpace: 'nowrap',
                  zIndex: 10,
                }}
              >
                Bientot disponible
              </span>
            </span>
          </HudBtn>
          <HudBtn
            variant="accent"
            onClick={() => navigate(`/game-mode/${listId}`)}
          >
            &#9876; COMMENCER UNE PARTIE
          </HudBtn>
          <div style={{ flex: 1 }} />
          <button
            className="text-xs border-none bg-transparent cursor-pointer"
            style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: 0.5 }}
            onClick={startEditing}
          >
            Modifier
          </button>
        </div>

        {/* Public/Private toggle */}
        {isAuthenticated && list.remoteId && (
          <button
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              marginTop: 12,
              fontSize: 11,
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-text-muted)',
              fontFamily: 'var(--font-mono)',
            }}
            onClick={() => {
              const newPublic = !list.isPublic
              updateList(listId, { isPublic: newPublic })
              setListPublic(list.remoteId!, newPublic)
            }}
          >
            <span>{list.isPublic ? '\u{1F513}' : '\u{1F512}'}</span>
            <span>{list.isPublic ? 'Publique' : 'Privee'}</span>
          </button>
        )}
      </div>

      {/* Edit form */}
      {editing && (
        <div style={{ padding: '0 28px 16px' }}>
          <div
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              padding: 16,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 10, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: 1 }}>NOM</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                style={{
                  padding: '8px 12px',
                  background: 'var(--color-bg)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text)',
                  fontSize: 13,
                  outline: 'none',
                }}
                autoFocus
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 10, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: 1 }}>DETACHEMENT</label>
              {factionDetachments.length > 0 ? (
                <button
                  style={{
                    padding: '8px 12px',
                    background: 'var(--color-bg)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text)',
                    fontSize: 13,
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                  onClick={() => setShowDetachmentModal(true)}
                >
                  {editDetachmentName || '-- Choisir --'}
                </button>
              ) : (
                <input
                  type="text"
                  value={editDetachmentName}
                  onChange={(e) => setEditDetachmentName(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    background: 'var(--color-bg)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text)',
                    fontSize: 13,
                    outline: 'none',
                  }}
                />
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 10, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: 1 }}>LIMITE DE POINTS</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {([1000, 2000, 3000] as PointsLimit[]).map((pts) => {
                  const metal = pts === 1000 ? 'bronze' : pts === 2000 ? 'silver' : 'gold'
                  return (
                    <button
                      key={pts}
                      className={`btn-points btn-points--${metal} ${editPoints === pts ? 'btn-points--selected' : ''}`}
                      style={{ flex: 1 }}
                      onClick={() => setEditPoints(pts)}
                    >
                      {pts}
                    </button>
                  )
                })}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <HudBtn variant="ghost" onClick={() => setEditing(false)}>Annuler</HudBtn>
              <HudBtn variant="primary" onClick={saveEditing}>Enregistrer</HudBtn>
            </div>
          </div>
        </div>
      )}

      {/* Detachment picker modal */}
      {showDetachmentModal && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setShowDetachmentModal(false)}
        >
          <div
            style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', padding: 16, maxWidth: 400, width: '90%' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ color: 'var(--color-text)', fontSize: 14, fontFamily: 'var(--font-mono)', marginBottom: 12 }}>Detachement</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {factionDetachments.map((det) => (
                <button
                  key={det.id}
                  style={{
                    padding: '10px 12px',
                    background: editDetachmentId === det.id ? 'var(--color-surface)' : 'transparent',
                    border: editDetachmentId === det.id ? '1px solid var(--color-accent)' : '1px solid var(--color-border)',
                    color: 'var(--color-text)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontSize: 13,
                  }}
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

      {/* Detachment picker (standalone, outside edit mode) */}
      {showDetachmentPicker && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setShowDetachmentPicker(false)}
        >
          <div
            style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', padding: 16, maxWidth: 400, width: '90%' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ color: 'var(--color-text)', fontSize: 14, fontFamily: 'var(--font-mono)', marginBottom: 12 }}>Choisir un detachement</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {factionDetachments.map((det) => (
                <button
                  key={det.id}
                  style={{
                    padding: '10px 12px',
                    background: list.detachmentId === det.id ? 'var(--color-surface)' : 'transparent',
                    border: list.detachmentId === det.id ? '1px solid var(--color-accent)' : '1px solid var(--color-border)',
                    color: 'var(--color-text)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontSize: 13,
                  }}
                  onClick={() => {
                    updateList(listId, { detachment: det.name, detachmentId: det.id })
                    setShowDetachmentPicker(false)
                  }}
                >
                  <T text={det.name} category="detachment" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Units content */}
      <div style={{ padding: '0 28px 28px' }}>
        {/* Add unit button */}
        <button
          onClick={() => setShowAddUnitModal(true)}
          style={{
            width: '100%',
            padding: '14px 0',
            fontSize: 12,
            fontFamily: 'var(--font-mono)',
            letterSpacing: 1,
            color: 'var(--color-text-dim)',
            background: 'transparent',
            border: '1px solid var(--color-border)',
            cursor: 'pointer',
            marginBottom: 20,
            transition: 'border-color 0.15s, color 0.15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-accent)'
            e.currentTarget.style.color = 'var(--color-accent)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-border)'
            e.currentTarget.style.color = 'var(--color-text-dim)'
          }}
        >
          + AJOUTER UNE UNITE
        </button>

        {list.units.length === 0 ? (
          <EmptyState
            title="Liste vide"
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {/* Squads with attached heroes */}
            {squads.map(({ unit, index, heroes }) => {
              const hasHeroes = heroes.length > 0
              const squadTotals = hasHeroes
                ? resolveSquadTotalPoints(unit, list.units, faction?.datasheets)
                : null

              return (
                <div key={unit.id || index}>
                  <UnitRow
                    unit={unit}
                    index={index}
                    indent={false}
                    faction={faction}
                    collectionItems={collectionItems}
                    onEdit={setEditingUnitIndex}
                    onRemove={(i) => removeUnit(listId, i)}
                    onAttach={setAttachingHeroIndex}
                    onDetach={(i) => detachHero(listId, i)}
                    onEnhancement={setEnhancementUnitIndex}
                    onRemoveEnhancement={(i) => setEnhancement(listId, i, undefined)}
                    showAttach={availableSquads.length > 0}
                    showEnhancementBtn={availableEnhancements.some((e) => !usedEnhancementIds.has(e.id))}
                  />
                  {heroes.map((h) => (
                    <UnitRow
                      key={h.unit.id || h.index}
                      unit={h.unit}
                      index={h.index}
                      indent={true}
                      faction={faction}
                      collectionItems={collectionItems}
                      onEdit={setEditingUnitIndex}
                      onRemove={(i) => removeUnit(listId, i)}
                      onAttach={setAttachingHeroIndex}
                      onDetach={(i) => detachHero(listId, i)}
                      onEnhancement={setEnhancementUnitIndex}
                      onRemoveEnhancement={(i) => setEnhancement(listId, i, undefined)}
                      showAttach={availableSquads.length > 0}
                      showEnhancementBtn={availableEnhancements.some((e) => !usedEnhancementIds.has(e.id))}
                    />
                  ))}
                  {hasHeroes && squadTotals && (
                    <div
                      style={{
                        fontSize: 10,
                        padding: '4px 14px',
                        color: 'var(--color-text-muted)',
                        fontFamily: 'var(--font-mono)',
                        marginLeft: 20,
                        borderLeft: '3px solid var(--color-border)',
                        background: 'color-mix(in srgb, var(--color-surface) 40%, transparent)',
                      }}
                    >
                      Total : {squadTotals.squadPoints} + {squadTotals.heroPoints} ={' '}
                      <strong style={{ color: 'var(--color-accent)' }}>{squadTotals.total} pts</strong>
                    </div>
                  )}
                </div>
              )
            })}

            {/* Free heroes */}
            {freeHeroes.map(({ unit, index }) => (
              <UnitRow
                key={unit.id || index}
                unit={unit}
                index={index}
                indent={false}
                faction={faction}
                collectionItems={collectionItems}
                onEdit={setEditingUnitIndex}
                onRemove={(i) => removeUnit(listId, i)}
                onAttach={setAttachingHeroIndex}
                onDetach={(i) => detachHero(listId, i)}
                onEnhancement={setEnhancementUnitIndex}
                onRemoveEnhancement={(i) => setEnhancement(listId, i, undefined)}
                showAttach={availableSquads.length > 0}
                showEnhancementBtn={availableEnhancements.some((e) => !usedEnhancementIds.has(e.id))}
              />
            ))}
          </div>
        )}

        {totalPoints > list.pointsLimit && (
          <div
            style={{
              marginTop: 16,
              padding: '10px 14px',
              background: 'var(--color-error)',
              color: '#fff',
              fontSize: 12,
              fontFamily: 'var(--font-mono)',
            }}
          >
            Attention : la liste depasse la limite de {list.pointsLimit} points !
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
          ownedCount={collectionItems[editingUnit.datasheetId]?.instances?.length ?? 0}
        />
      )}

      {/* Enhancement picker modal */}
      {enhancementUnitIndex !== null && (
        <div
          data-scroll-lock
          style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setEnhancementUnitIndex(null)}
        >
          <div
            style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', padding: 20, maxWidth: 500, width: '90%', maxHeight: '70vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ color: 'var(--color-text)', fontSize: 14, fontFamily: 'var(--font-mono)', marginBottom: 12 }}>
              Choisir une amelioration
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
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
                    style={{
                      textAlign: 'left',
                      padding: '12px',
                      background: 'var(--color-surface)',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-text)',
                      cursor: 'pointer',
                    }}
                    onClick={() => {
                      setEnhancement(listId, enhancementUnitIndex, {
                        enhancementId: enh.id,
                        enhancementName: enh.name,
                        cost: enh.cost,
                      })
                      setEnhancementUnitIndex(null)
                      showToast(`${enh.name} assignee`, 'success')
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 600, fontSize: 13 }}><T text={enh.name} category="enhancement" /></span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-accent)' }}>{enh.cost} pts</span>
                    </div>
                    {enh.legend && (
                      <p style={{ fontSize: 11, color: 'var(--color-text-muted)', fontStyle: 'italic', marginTop: 4 }}>
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
            </div>
            <div style={{ marginTop: 12 }}>
              <HudBtn variant="ghost" onClick={() => setEnhancementUnitIndex(null)}>Annuler</HudBtn>
            </div>
          </div>
        </div>
      )}

      {/* Attach hero modal */}
      {attachingHeroIndex !== null && (
        <div
          data-scroll-lock
          style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setAttachingHeroIndex(null)}
        >
          <div
            style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', padding: 20, maxWidth: 500, width: '90%', maxHeight: '60vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ color: 'var(--color-text)', fontSize: 14, fontFamily: 'var(--font-mono)', marginBottom: 12 }}>
              Attacher a une escouade
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {availableSquads.map(({ unit: sq }) => (
                <button
                  key={sq.id}
                  style={{
                    textAlign: 'left',
                    padding: '12px',
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text)',
                    cursor: 'pointer',
                  }}
                  onClick={() => {
                    attachHero(listId, attachingHeroIndex, sq.id)
                    setAttachingHeroIndex(null)
                    showToast('Heros attache', 'success')
                  }}
                >
                  <span style={{ fontWeight: 600, fontSize: 13 }}><T text={sq.datasheetName} category="unit" /></span>
                  <span style={{ fontSize: 12, marginLeft: 8, color: 'var(--color-accent)' }}>
                    {resolveUnitPoints(sq, faction?.datasheets)} pts
                  </span>
                </button>
              ))}
            </div>
            <div style={{ marginTop: 12 }}>
              <HudBtn variant="ghost" onClick={() => setAttachingHeroIndex(null)}>Annuler</HudBtn>
            </div>
          </div>
        </div>
      )}

      {/* Add unit modal */}
      {showAddUnitModal && (
        <div
          data-scroll-lock
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 60,
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={closeAddUnitModal}
        >
          <div
            style={{
              background: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              width: '90%',
              maxWidth: 900,
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div style={{
              padding: '16px 20px 12px',
              borderBottom: '1px solid var(--color-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexShrink: 0,
            }}>
              <div>
                <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', letterSpacing: 2, color: 'var(--color-accent)', textTransform: 'uppercase' }}>
                  &#9656; AJOUTER UNE UNITE
                </div>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', marginTop: 4 }}>
                  {totalPoints} / {list.pointsLimit} pts
                </div>
              </div>
              <button
                onClick={closeAddUnitModal}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text-muted)',
                  cursor: 'pointer',
                  fontSize: 11,
                  fontFamily: 'var(--font-mono)',
                  letterSpacing: 1,
                  padding: '6px 12px',
                }}
              >
                FERMER
              </button>
            </div>

            {/* Search + filters */}
            <div style={{ padding: '12px 20px', flexShrink: 0 }}>
              <SearchBar value={addUnitQuery} onChange={setAddUnitQuery} placeholder="Rechercher une unite..." />
              {addUnitRoles.length > 1 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                  <button
                    style={{
                      padding: '4px 10px',
                      fontSize: 10,
                      fontFamily: 'var(--font-mono)',
                      letterSpacing: 0.5,
                      border: '1px solid var(--color-border)',
                      cursor: 'pointer',
                      background: addUnitRoleFilter === 'all' ? 'var(--color-accent)' : 'transparent',
                      color: addUnitRoleFilter === 'all' ? '#000' : 'var(--color-text-muted)',
                    }}
                    onClick={() => setAddUnitRoleFilter('all')}
                  >
                    TOUS
                  </button>
                  {addUnitRoles.map((role) => (
                    <button
                      key={role}
                      style={{
                        padding: '4px 10px',
                        fontSize: 10,
                        fontFamily: 'var(--font-mono)',
                        letterSpacing: 0.5,
                        border: '1px solid var(--color-border)',
                        cursor: 'pointer',
                        background: addUnitRoleFilter === role ? 'var(--color-accent)' : 'transparent',
                        color: addUnitRoleFilter === role ? '#000' : 'var(--color-text-muted)',
                      }}
                      onClick={() => setAddUnitRoleFilter(role)}
                    >
                      {role.toUpperCase()}
                    </button>
                  ))}
                </div>
              )}
              {/* Owned-only toggle */}
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                marginTop: 10,
                fontSize: 10,
                fontFamily: 'var(--font-mono)',
                color: 'var(--color-text-muted)',
                cursor: 'pointer',
                userSelect: 'none',
              }}>
                <input
                  type="checkbox"
                  checked={addUnitOwnedOnly}
                  onChange={(e) => setAddUnitOwnedOnly(e.target.checked)}
                  style={{ accentColor: 'var(--color-accent)', cursor: 'pointer' }}
                />
                Afficher uniquement les figurines possédées
              </label>
            </div>

            {/* Units grid — scrollable */}
            <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '0 20px 20px' }}>
              {addUnitFiltered.length === 0 && addUnitQuery.trim().length >= 2 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--color-text-muted)', fontSize: 12, fontFamily: 'var(--font-mono)' }}>
                  Aucune unite trouvee pour « {addUnitQuery.trim()} »
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
                  {addUnitFiltered.map((ds) => (
                    <UnitCard
                      key={ds.id}
                      datasheet={ds}
                      owned={collectionItems[ds.id]?.instances?.length}
                      instances={collectionItems[ds.id]?.instances}
                      onClick={() => setAddUnitSelectedDs(ds)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add unit — equipment selector */}
      {addUnitSelectedDs && (
        <EquipmentSelector
          datasheet={addUnitSelectedDs}
          onConfirm={handleAddUnitConfirm}
          onCancel={() => setAddUnitSelectedDs(null)}
          confirmLabel="Ajouter a la liste"
          ownedCount={collectionItems[addUnitSelectedDs.id]?.instances?.length ?? 0}
        />
      )}

      {/* Add unit — enhancement picker */}
      {addUnitEnhPicker && (
        <div
          data-scroll-lock
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 70,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={handleSkipAddUnitEnh}
        >
          <div
            style={{
              background: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              padding: 20,
              maxWidth: 500,
              width: '90%',
              maxHeight: '70vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ color: 'var(--color-text)', fontSize: 14, fontFamily: 'var(--font-mono)', marginBottom: 4 }}>
              Amelioration pour {addUnitEnhPicker.datasheet.name}
            </h3>
            <p style={{ fontSize: 10, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', marginBottom: 12 }}>
              Optionnel — cliquer en dehors pour passer
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {addUnitEnhPicker.enhancements.map((enh) => (
                <button
                  key={enh.id}
                  style={{
                    textAlign: 'left',
                    padding: '12px',
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text)',
                    cursor: 'pointer',
                  }}
                  onClick={() => handleAddUnitEnhancement(enh)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, fontSize: 13 }}><T text={enh.name} category="enhancement" /></span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-accent)' }}>{enh.cost} pts</span>
                  </div>
                  {enh.legend && (
                    <p style={{ fontSize: 11, color: 'var(--color-text-muted)', fontStyle: 'italic', marginTop: 4 }}>
                      <T text={enh.legend} category="enhancement" />
                    </p>
                  )}
                </button>
              ))}
            </div>
            <div style={{ marginTop: 12 }}>
              <HudBtn variant="ghost" onClick={handleSkipAddUnitEnh}>Passer</HudBtn>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

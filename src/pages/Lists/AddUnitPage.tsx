import { useState, useCallback, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router'
import { useListsStore } from '@/stores/listsStore'
import { useGameDataStore } from '@/stores/gameDataStore'
import { useCollectionStore } from '@/stores/collectionStore'
import { useSearch } from '@/hooks/useSearch'
import { useFactionTheme } from '@/hooks/useFactionTheme'
import { useToast } from '@/components/ui/Toast'
import { UnitCard } from '@/components/domain/UnitCard'
import { SearchBar } from '@/components/ui/SearchBar'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { EquipmentSelector } from '@/components/domain/EquipmentSelector'
import { calculateTotalPoints } from '@/utils/pointsCalculator'
import { isCharacter, canEquipEnhancement } from '@/utils/enhancementUtils'
import { T } from '@/components/ui/TranslatableText'
import type { Datasheet, Enhancement } from '@/types/gameData.types'

const extractSearchFields = (ds: Datasheet): string[] => [
  ds.name,
  ...ds.keywords.map((k) => k.keyword),
]

export function AddUnitPage() {
  const { listId } = useParams<{ listId: string }>()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const list = useListsStore((s) => listId ? s.lists[listId] : undefined)
  const addUnit = useListsStore((s) => s.addUnit)
  const setEnhancement = useListsStore((s) => s.setEnhancement)
  const loadedFactions = useGameDataStore((s) => s.loadedFactions)
  const loadFaction = useGameDataStore((s) => s.loadFaction)
  const collectionItems = useCollectionStore((s) => s.items)

  const [query, setQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<string | 'all'>('all')
  const [selectedDatasheet, setSelectedDatasheet] = useState<Datasheet | null>(null)
  const [enhancementPicker, setEnhancementPicker] = useState<{
    datasheet: Datasheet
    unitIndex: number
    enhancements: Enhancement[]
  } | null>(null)

  useFactionTheme(list?.factionId ?? null)

  useEffect(() => {
    if (list) loadFaction(list.factionId)
  }, [list, loadFaction])

  const faction = list ? loadedFactions[list.factionId] : undefined
  const datasheets = faction?.datasheets ?? []

  const detachment = useMemo(() => {
    if (!list || !faction?.detachments) return undefined
    return faction.detachments.find((d) => d.id === list.detachmentId) ??
      faction.detachments.find((d) => d.name === list.detachment)
  }, [list, faction])

  const roles = useMemo(() => {
    const r = new Set(datasheets.map((ds) => ds.role).filter(Boolean))
    return Array.from(r).sort()
  }, [datasheets])

  const roleFiltered = useMemo(() => {
    if (roleFilter === 'all') return datasheets
    return datasheets.filter((ds) => ds.role === roleFilter)
  }, [datasheets, roleFilter])

  const extractFields = useCallback(extractSearchFields, [])
  const filteredDatasheets = useSearch(roleFiltered, query, extractFields)

  if (!list || !listId) {
    return (
      <div className="p-4" style={{ color: 'var(--color-text-muted)' }}>
        Liste introuvable.
      </div>
    )
  }

  const totalPoints = faction ? calculateTotalPoints(list.units, faction.datasheets) : 0

  // IDs of enhancements already used in this list
  const usedEnhancementIds = new Set(
    list.units.map((u) => u.enhancement?.enhancementId).filter(Boolean),
  )

  const handleConfirmAdd = (pointOptionIndex: number, weapons: string[], notes: string) => {
    if (!selectedDatasheet) return
    const cost = selectedDatasheet.pointOptions[pointOptionIndex]?.cost ?? selectedDatasheet.pointOptions[0]?.cost ?? 0
    const unitId = Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
    addUnit(listId, {
      id: unitId,
      datasheetId: selectedDatasheet.id,
      datasheetName: selectedDatasheet.name,
      points: cost,
      selectedPointOptionIndex: pointOptionIndex,
      selectedWeapons: weapons,
      notes,
    })

    // Check if this character has eligible enhancements
    const enhancements = detachment?.enhancements ?? []
    if (isCharacter(selectedDatasheet) && enhancements.length > 0) {
      const eligible = enhancements.filter(
        (e) => !usedEnhancementIds.has(e.id) && canEquipEnhancement(e, selectedDatasheet),
      )
      if (eligible.length > 0) {
        // Unit was just added → it's the last one in the list
        const unitIndex = list.units.length // current length = index of newly added unit
        setEnhancementPicker({ datasheet: selectedDatasheet, unitIndex, enhancements: eligible })
        setSelectedDatasheet(null)
        return
      }
    }

    showToast(`${selectedDatasheet.name} ajoutée à ${list.name}`, 'success')
    setSelectedDatasheet(null)
  }

  const handleSelectEnhancement = (enh: Enhancement) => {
    if (!enhancementPicker) return
    setEnhancement(listId, enhancementPicker.unitIndex, {
      enhancementId: enh.id,
      enhancementName: enh.name,
      cost: enh.cost,
    })
    showToast(`${enhancementPicker.datasheet.name} + ${enh.name} ajoutée`, 'success')
    setEnhancementPicker(null)
  }

  const handleSkipEnhancement = () => {
    if (!enhancementPicker) return
    showToast(`${enhancementPicker.datasheet.name} ajoutée à ${list.name}`, 'success')
    setEnhancementPicker(null)
  }

  return (
    <div className="p-4">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <Button variant="ghost" size="sm" onClick={() => navigate(`/lists/${listId}`)}>
            ← Retour à la liste
          </Button>
        </div>
        <div
          className="rounded-lg p-3 mt-2"
          style={{ backgroundColor: 'var(--color-surface)' }}
        >
          <p className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>
            Ajout à : {list.name}
          </p>
          <p className="text-xs" style={{ color: 'var(--color-accent)' }}>
            {totalPoints} / {list.pointsLimit} pts
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="mb-3">
        <SearchBar value={query} onChange={setQuery} placeholder="Rechercher une unité..." />
      </div>

      {/* Role filter chips */}
      {roles.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            className="text-xs px-2.5 py-1 rounded-full cursor-pointer border-none min-h-[32px]"
            style={{
              backgroundColor: roleFilter === 'all' ? 'var(--color-primary)' : 'var(--color-surface)',
              color: roleFilter === 'all' ? '#ffffff' : 'var(--color-text)',
            }}
            onClick={() => setRoleFilter('all')}
          >
            Tous
          </button>
          {roles.map((role) => (
            <button
              key={role}
              className="text-xs px-2.5 py-1 rounded-full cursor-pointer border-none min-h-[32px]"
              style={{
                backgroundColor: roleFilter === role ? 'var(--color-primary)' : 'var(--color-surface)',
                color: roleFilter === role ? '#ffffff' : 'var(--color-text)',
              }}
              onClick={() => setRoleFilter(role)}
            >
              {role}
            </button>
          ))}
        </div>
      )}

      {/* Grid */}
      {filteredDatasheets.length === 0 && query.trim().length >= 2 ? (
        <EmptyState
          title="Aucune unité trouvée"
          description={`Aucune unité trouvée pour '${query.trim()}'`}
          actionLabel="Effacer la recherche"
          onAction={() => setQuery('')}
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {filteredDatasheets.map((ds) => (
            <UnitCard
              key={ds.id}
              datasheet={ds}
              owned={collectionItems[ds.id]?.instances?.length}
              instances={collectionItems[ds.id]?.instances}
              onClick={() => setSelectedDatasheet(ds)}
            />
          ))}
        </div>
      )}

      {/* Equipment selector modal */}
      {selectedDatasheet && (
        <EquipmentSelector
          datasheet={selectedDatasheet}
          onConfirm={handleConfirmAdd}
          onCancel={() => setSelectedDatasheet(null)}
          confirmLabel="Ajouter à la liste"
        />
      )}

      {/* Enhancement picker modal */}
      {enhancementPicker && (
        <div
          className="fixed left-0 right-0 top-0 flex items-end justify-center"
          style={{
            backgroundColor: 'rgba(0,0,0,0.6)',
            zIndex: 70,
            bottom: 'calc(60px + env(safe-area-inset-bottom, 0px))',
          }}
          onClick={handleSkipEnhancement}
        >
          <div
            className="w-full max-w-lg rounded-t-2xl"
            style={{
              backgroundColor: 'var(--color-surface)',
              maxHeight: '60%',
              display: 'flex',
              flexDirection: 'column',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-1">
              <div
                className="w-10 h-1 rounded-full"
                style={{ backgroundColor: 'var(--color-text-muted)', opacity: 0.4 }}
              />
            </div>

            {/* Header */}
            <div className="px-4 pb-3">
              <h3
                className="font-semibold"
                style={{ color: 'var(--color-text)', fontSize: 'var(--text-lg)' }}
              >
                Amélioration pour {enhancementPicker.datasheet.name}
              </h3>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                Optionnel — touche en dehors pour passer
              </p>
            </div>

            {/* Enhancement list */}
            <div
              className="px-4 pb-2 overflow-y-auto"
              style={{
                flex: '1 1 auto',
                minHeight: 0,
                WebkitOverflowScrolling: 'touch',
                scrollbarWidth: 'none',
              }}
            >
              <div className="flex flex-col gap-2">
                {enhancementPicker.enhancements.map((enh) => (
                  <button
                    key={enh.id}
                    className="flex items-center justify-between rounded-lg px-3 py-3 border-none cursor-pointer min-h-[44px] text-left"
                    style={{ backgroundColor: 'var(--color-bg)' }}
                    onClick={() => handleSelectEnhancement(enh)}
                  >
                    <div className="min-w-0 flex-1">
                      <span
                        className="text-sm font-medium block"
                        style={{ color: 'var(--color-text)' }}
                      >
                        <T text={enh.name} category="enhancement" />
                      </span>
                      {enh.legend && (
                        <span
                          className="text-xs italic block mt-0.5"
                          style={{ color: 'var(--color-text-muted)' }}
                        >
                          <T text={enh.legend} category="enhancement" />
                        </span>
                      )}
                    </div>
                    <span
                      className="text-sm font-semibold shrink-0 ml-3"
                      style={{ color: 'var(--color-accent)' }}
                    >
                      {enh.cost} pts
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Skip button */}
            <div
              className="px-4 py-3 shrink-0"
              style={{ borderTop: '1px solid var(--color-bg)' }}
            >
              <Button variant="ghost" onClick={handleSkipEnhancement}>
                Passer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

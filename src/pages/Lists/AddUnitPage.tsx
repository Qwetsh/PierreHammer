import { useState, useCallback, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router'
import { useListsStore } from '@/stores/listsStore'
import { useGameDataStore } from '@/stores/gameDataStore'
import { useCollectionStore } from '@/stores/collectionStore'
import { useSearch } from '@/hooks/useSearch'
import { useToast } from '@/components/ui/Toast'
import { UnitCard } from '@/components/domain/UnitCard'
import { SearchBar } from '@/components/ui/SearchBar'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { EquipmentSelector } from '@/components/domain/EquipmentSelector'
import { calculateTotalPoints } from '@/utils/pointsCalculator'
import type { Datasheet } from '@/types/gameData.types'

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
  const loadedFactions = useGameDataStore((s) => s.loadedFactions)
  const loadFaction = useGameDataStore((s) => s.loadFaction)
  const collectionItems = useCollectionStore((s) => s.items)

  const [query, setQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<string | 'all'>('all')
  const [selectedDatasheet, setSelectedDatasheet] = useState<Datasheet | null>(null)

  useEffect(() => {
    if (list) loadFaction(list.factionId)
  }, [list, loadFaction])

  const faction = list ? loadedFactions[list.factionId] : undefined
  const datasheets = faction?.datasheets ?? []

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

  const handleConfirmAdd = (pointOptionIndex: number, weapons: string[], notes: string) => {
    if (!selectedDatasheet) return
    const cost = selectedDatasheet.pointOptions[pointOptionIndex]?.cost ?? selectedDatasheet.pointOptions[0]?.cost ?? 0
    addUnit(listId, {
      datasheetId: selectedDatasheet.id,
      datasheetName: selectedDatasheet.name,
      points: cost,
      selectedPointOptionIndex: pointOptionIndex,
      selectedWeapons: weapons,
      notes,
    })
    showToast(`${selectedDatasheet.name} ajoutée à ${list.name}`, 'success')
    setSelectedDatasheet(null)
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
    </div>
  )
}

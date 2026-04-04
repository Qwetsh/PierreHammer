import { useState, useMemo, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useCollectionStore } from '@/stores/collectionStore'
import { useGameDataStore } from '@/stores/gameDataStore'
import { useSearch } from '@/hooks/useSearch'
import { CollectionToggle } from '@/components/domain/CollectionToggle'
import type { CollectionView } from '@/components/domain/CollectionToggle'
import { UnitCard } from '@/components/domain/UnitCard'
import { SearchBar } from '@/components/ui/SearchBar'
import { EmptyState } from '@/components/ui/EmptyState'
import { ProgressBar } from '@/components/ui/ProgressBar'
import type { PaintStatus } from '@/components/domain/PaintStatusBadge'
import type { Datasheet } from '@/types/gameData.types'

interface DatasheetWithFaction extends Datasheet {
  factionSlug: string
  factionName: string
}

const paintStatusOptions: { value: PaintStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Tous' },
  { value: 'unassembled', label: 'Non montée' },
  { value: 'assembled', label: 'Montée' },
  { value: 'in-progress', label: 'En cours' },
  { value: 'done', label: 'Terminée' },
]

const extractSearchFields = (ds: DatasheetWithFaction): string[] => [
  ds.name,
  ...ds.keywords.map((k) => k.keyword),
]

export function CollectionPage() {
  const navigate = useNavigate()
  const collectionItems = useCollectionStore((s) => s.items)
  const getProgressStats = useCollectionStore((s) => s.getProgressStats)
  const loadedFactions = useGameDataStore((s) => s.loadedFactions)
  const loadFaction = useGameDataStore((s) => s.loadFaction)
  const loadFactionIndex = useGameDataStore((s) => s.loadFactionIndex)

  const [view, setView] = useState<CollectionView>('owned')
  const [query, setQuery] = useState('')
  const [factionFilter, setFactionFilter] = useState<string | 'all'>('all')
  const [paintFilter, setPaintFilter] = useState<PaintStatus | 'all'>('all')

  // Load faction index on mount
  useEffect(() => {
    loadFactionIndex()
  }, [loadFactionIndex])

  // Load all factions that have owned items
  useEffect(() => {
    const ownedFactionIds = new Set(Object.values(collectionItems).map((i) => i.factionId))
    for (const slug of ownedFactionIds) {
      if (!loadedFactions[slug]) {
        loadFaction(slug)
      }
    }
  }, [collectionItems, loadedFactions, loadFaction])

  // Build flat list of all datasheets from loaded factions
  const allDatasheets = useMemo((): DatasheetWithFaction[] => {
    const result: DatasheetWithFaction[] = []
    for (const [slug, faction] of Object.entries(loadedFactions)) {
      for (const ds of faction.datasheets) {
        result.push({ ...ds, factionSlug: slug, factionName: faction.name })
      }
    }
    return result
  }, [loadedFactions])

  // Apply toggle filter (owned/all)
  const toggleFiltered = useMemo(() => {
    if (view === 'all') return allDatasheets
    return allDatasheets.filter((ds) => ds.id in collectionItems)
  }, [allDatasheets, view, collectionItems])

  // Apply faction filter
  const factionFiltered = useMemo(() => {
    if (factionFilter === 'all') return toggleFiltered
    return toggleFiltered.filter((ds) => ds.factionSlug === factionFilter)
  }, [toggleFiltered, factionFilter])

  // Apply paint status filter
  const paintFiltered = useMemo(() => {
    if (paintFilter === 'all') return factionFiltered
    return factionFiltered.filter((ds) => collectionItems[ds.id]?.paintStatus === paintFilter)
  }, [factionFiltered, paintFilter, collectionItems])

  // Apply text search
  const extractFields = useCallback(extractSearchFields, [])
  const filteredDatasheets = useSearch(paintFiltered, query, extractFields)

  // Get unique faction slugs for filter chips
  const availableFactions = useMemo(() => {
    const factions = new Map<string, string>()
    for (const ds of toggleFiltered) {
      factions.set(ds.factionSlug, ds.factionName)
    }
    return Array.from(factions.entries()).map(([slug, name]) => ({ slug, name }))
  }, [toggleFiltered])

  const hasCollection = Object.keys(collectionItems).length > 0
  const hasFilters = query.trim().length >= 2 || factionFilter !== 'all' || paintFilter !== 'all'

  const resetFilters = () => {
    setQuery('')
    setFactionFilter('all')
    setPaintFilter('all')
  }

  // Empty collection state
  if (view === 'owned' && !hasCollection) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4" style={{ fontSize: 'var(--text-2xl)' }}>Collection</h1>
        <CollectionToggle value={view} onChange={setView} />
        <div className="mt-8">
          <EmptyState
            title="Aucune figurine"
            description="Tu n'as pas encore ajouté de figurines à ta collection."
            actionLabel="Explorer le catalogue"
            onAction={() => navigate('/catalog')}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4" style={{ fontSize: 'var(--text-2xl)' }}>Collection</h1>

      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <CollectionToggle value={view} onChange={setView} />
        <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          {filteredDatasheets.length} unité{filteredDatasheets.length !== 1 ? 's' : ''}
        </span>
      </div>

      {view === 'owned' && hasCollection && (() => {
        const stats = getProgressStats()
        return (
          <div className="mb-4">
            <ProgressBar
              variant="segmented"
              value={stats.percentComplete}
              segments={[
                { value: stats.unassembled, color: 'var(--color-text-muted)', label: 'Non montée' },
                { value: stats.assembled, color: 'var(--color-warning)', label: 'Montée' },
                { value: stats.inProgress, color: 'var(--color-accent)', label: 'En cours' },
                { value: stats.completed, color: 'var(--color-success)', label: 'Terminée' },
              ]}
            />
          </div>
        )
      })()}

      <div className="mb-3">
        <SearchBar value={query} onChange={setQuery} placeholder="Rechercher une unité..." />
      </div>

      {/* Faction filter chips */}
      {availableFactions.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-3">
          <button
            className="text-xs px-2.5 py-1 rounded-full cursor-pointer border-none min-h-[32px]"
            style={{
              backgroundColor: factionFilter === 'all' ? 'var(--color-primary)' : 'var(--color-surface)',
              color: factionFilter === 'all' ? '#ffffff' : 'var(--color-text)',
            }}
            onClick={() => setFactionFilter('all')}
          >
            Toutes
          </button>
          {availableFactions.map((f) => (
            <button
              key={f.slug}
              className="text-xs px-2.5 py-1 rounded-full cursor-pointer border-none min-h-[32px]"
              style={{
                backgroundColor: factionFilter === f.slug ? 'var(--color-primary)' : 'var(--color-surface)',
                color: factionFilter === f.slug ? '#ffffff' : 'var(--color-text)',
              }}
              onClick={() => setFactionFilter(f.slug)}
            >
              {f.name}
            </button>
          ))}
        </div>
      )}

      {/* Paint status filter chips */}
      {view === 'owned' && (
        <div className="flex flex-wrap gap-2 mb-4">
          {paintStatusOptions.map((opt) => (
            <button
              key={opt.value}
              className="text-xs px-2.5 py-1 rounded-full cursor-pointer border-none min-h-[32px]"
              style={{
                backgroundColor: paintFilter === opt.value ? 'var(--color-primary)' : 'var(--color-surface)',
                color: paintFilter === opt.value ? '#ffffff' : 'var(--color-text)',
              }}
              onClick={() => setPaintFilter(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}

      {filteredDatasheets.length === 0 && hasFilters ? (
        <EmptyState
          title="Aucune figurine ne correspond"
          description="Essaie d'ajuster tes filtres pour trouver ce que tu cherches."
          actionLabel="Réinitialiser les filtres"
          onAction={resetFilters}
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {filteredDatasheets.map((ds) => (
            <UnitCard
              key={ds.id}
              datasheet={ds}
              owned={collectionItems[ds.id]?.quantity}
              paintStatus={collectionItems[ds.id]?.paintStatus}
              onClick={() => navigate(`/catalog/${ds.factionSlug}/${ds.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

import { useState, useMemo, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useCollectionStore } from '@/stores/collectionStore'
import { useGameDataStore } from '@/stores/gameDataStore'
import { useFavoritesStore } from '@/stores/favoritesStore'
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

type SortKey = 'name' | 'points' | 'role' | 'paintStatus'

const sortLabels: Record<SortKey, string> = {
  name: 'Nom',
  points: 'Points',
  role: 'Rôle',
  paintStatus: 'Peinture',
}

const paintOrder: Record<PaintStatus, number> = {
  unassembled: 0,
  assembled: 1,
  'in-progress': 2,
  done: 3,
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
  const favorites = useFavoritesStore((s) => s.favorites)

  const [view, setView] = useState<CollectionView>('owned')
  const [query, setQuery] = useState('')
  const [factionFilter, setFactionFilter] = useState<string | 'all'>('all')
  const [paintFilter, setPaintFilter] = useState<PaintStatus | 'all'>('all')
  const [sortBy, setSortBy] = useState<SortKey>('name')

  useEffect(() => {
    loadFactionIndex()
  }, [loadFactionIndex])

  useEffect(() => {
    const ownedFactionIds = new Set(Object.values(collectionItems).map((i) => i.factionId))
    for (const slug of ownedFactionIds) {
      if (!loadedFactions[slug]) {
        loadFaction(slug)
      }
    }
  }, [collectionItems, loadedFactions, loadFaction])

  const allDatasheets = useMemo((): DatasheetWithFaction[] => {
    const result: DatasheetWithFaction[] = []
    for (const [slug, faction] of Object.entries(loadedFactions)) {
      for (const ds of faction.datasheets) {
        result.push({ ...ds, factionSlug: slug, factionName: faction.name })
      }
    }
    return result
  }, [loadedFactions])

  const toggleFiltered = useMemo(() => {
    if (view === 'all') return allDatasheets
    return allDatasheets.filter((ds) => ds.id in collectionItems)
  }, [allDatasheets, view, collectionItems])

  const factionFiltered = useMemo(() => {
    if (factionFilter === 'all') return toggleFiltered
    return toggleFiltered.filter((ds) => ds.factionSlug === factionFilter)
  }, [toggleFiltered, factionFilter])

  const paintFiltered = useMemo(() => {
    if (paintFilter === 'all') return factionFiltered
    return factionFiltered.filter((ds) => collectionItems[ds.id]?.paintStatus === paintFilter)
  }, [factionFiltered, paintFilter, collectionItems])

  const extractFields = useCallback(extractSearchFields, [])
  const searched = useSearch(paintFiltered, query, extractFields)

  const sortedDatasheets = useMemo(() => {
    return [...searched].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name, 'fr')
        case 'points': {
          const pa = a.pointOptions[0]?.cost ?? 0
          const pb = b.pointOptions[0]?.cost ?? 0
          return pa - pb
        }
        case 'role':
          return (a.role || '').localeCompare(b.role || '', 'fr')
        case 'paintStatus': {
          const sa = collectionItems[a.id]?.paintStatus ?? 'unassembled'
          const sb = collectionItems[b.id]?.paintStatus ?? 'unassembled'
          return paintOrder[sa] - paintOrder[sb]
        }
      }
    })
  }, [searched, sortBy, collectionItems])

  // Separate favorites
  const favoriteDatasheets = useMemo(
    () => sortedDatasheets.filter((ds) => favorites.includes(ds.id)),
    [sortedDatasheets, favorites],
  )
  const nonFavoriteDatasheets = useMemo(
    () => sortedDatasheets.filter((ds) => !favorites.includes(ds.id)),
    [sortedDatasheets, favorites],
  )

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

  const renderGrid = (items: DatasheetWithFaction[]) => (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
      {items.map((ds) => (
        <UnitCard
          key={ds.id}
          datasheet={ds}
          owned={collectionItems[ds.id]?.quantity}
          paintStatus={collectionItems[ds.id]?.paintStatus}
          onClick={() => navigate(`/catalog/${ds.factionSlug}/${ds.id}`)}
        />
      ))}
    </div>
  )

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
          {sortedDatasheets.length} unité{sortedDatasheets.length !== 1 ? 's' : ''}
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
        <div className="flex flex-wrap gap-2 mb-3">
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

      {/* Sort controls */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Trier par :</span>
        {(Object.keys(sortLabels) as SortKey[]).map((key) => {
          if (key === 'paintStatus' && view !== 'owned') return null
          return (
            <button
              key={key}
              className="text-xs px-2 py-1 rounded cursor-pointer border-none min-h-[28px]"
              style={{
                backgroundColor: sortBy === key ? 'var(--color-accent)' : 'var(--color-surface)',
                color: sortBy === key ? '#ffffff' : 'var(--color-text)',
              }}
              onClick={() => setSortBy(key)}
            >
              {sortLabels[key]}
            </button>
          )
        })}
      </div>

      {sortedDatasheets.length === 0 && hasFilters ? (
        <EmptyState
          title="Aucune figurine ne correspond"
          description="Essaie d'ajuster tes filtres pour trouver ce que tu cherches."
          actionLabel="Réinitialiser les filtres"
          onAction={resetFilters}
        />
      ) : (
        <>
          {/* Favorites section */}
          {favoriteDatasheets.length > 0 && (
            <div className="mb-6">
              <h2 className="text-sm font-semibold mb-2" style={{ color: 'var(--color-warning, #f59e0b)' }}>
                Favoris ({favoriteDatasheets.length})
              </h2>
              {renderGrid(favoriteDatasheets)}
            </div>
          )}

          {/* Main grid */}
          {nonFavoriteDatasheets.length > 0 && (
            <>
              {favoriteDatasheets.length > 0 && (
                <h2 className="text-sm font-semibold mb-2" style={{ color: 'var(--color-text-muted)' }}>
                  Toutes les unités
                </h2>
              )}
              {renderGrid(nonFavoriteDatasheets)}
            </>
          )}
        </>
      )}
    </div>
  )
}

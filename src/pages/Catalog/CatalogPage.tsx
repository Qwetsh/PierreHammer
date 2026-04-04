import { useState, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router'
import { useGameData } from '@/hooks/useGameData'
import { useSearch } from '@/hooks/useSearch'
import { FactionPicker } from '@/components/domain/FactionPicker'
import { UnitCard } from '@/components/domain/UnitCard'
import { SearchBar } from '@/components/ui/SearchBar'
import { EmptyState } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/Button'
import { CompareBar } from '@/components/domain/CompareBar'
import { useCollectionStore } from '@/stores/collectionStore'
import { useFavoritesStore } from '@/stores/favoritesStore'
import { useComparatorStore } from '@/stores/comparatorStore'
import type { Datasheet } from '@/types/gameData.types'

type SortKey = 'name' | 'points' | 'role'

const sortLabels: Record<SortKey, string> = {
  name: 'Nom',
  points: 'Points',
  role: 'Rôle',
}

const extractSearchFields = (ds: Datasheet): string[] => [
  ds.name,
  ...ds.keywords.map((k) => k.keyword),
]

function sortDatasheets(items: Datasheet[], sortBy: SortKey): Datasheet[] {
  return [...items].sort((a, b) => {
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
    }
  })
}

export function CatalogPage() {
  const navigate = useNavigate()
  const { factionIndex, selectedFaction, selectedFactionSlug, isLoading, error, loadFaction, selectFaction } = useGameData()
  const [query, setQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<string | 'all'>('all')
  const [sortBy, setSortBy] = useState<SortKey>('name')
  const [compareMode, setCompareMode] = useState(false)
  const collectionItems = useCollectionStore((s) => s.items)
  const favorites = useFavoritesStore((s) => s.favorites)
  const { addUnit: addToCompare, removeUnit: removeFromCompare, isSelected, selectedIds, clear: clearCompare } = useComparatorStore()

  const datasheets = selectedFaction?.datasheets ?? []

  const roles = useMemo(() => {
    const r = new Set(datasheets.map((ds) => ds.role).filter(Boolean))
    return Array.from(r).sort()
  }, [datasheets])

  const roleFiltered = useMemo(() => {
    if (roleFilter === 'all') return datasheets
    return datasheets.filter((ds) => ds.role === roleFilter)
  }, [datasheets, roleFilter])

  const extractFields = useCallback(extractSearchFields, [])
  const searched = useSearch(roleFiltered, query, extractFields)
  const sorted = useMemo(() => sortDatasheets(searched, sortBy), [searched, sortBy])

  // Separate favorites
  const favoriteDatasheets = useMemo(
    () => sorted.filter((ds) => favorites.includes(ds.id)),
    [sorted, favorites],
  )
  const nonFavoriteDatasheets = useMemo(
    () => sorted.filter((ds) => !favorites.includes(ds.id)),
    [sorted, favorites],
  )

  const toggleCompareMode = () => {
    if (compareMode) {
      clearCompare()
    }
    setCompareMode(!compareMode)
  }

  if (error) {
    return (
      <div className="p-4" style={{ color: 'var(--color-error)' }}>
        Erreur: {error}
      </div>
    )
  }

  if (isLoading && !factionIndex) {
    return (
      <div className="p-4" style={{ color: 'var(--color-text-muted)' }}>
        Chargement...
      </div>
    )
  }

  if (!selectedFaction && factionIndex) {
    return (
      <div>
        <div className="p-4">
          <h1 className="text-2xl font-bold" style={{ fontSize: 'var(--text-2xl)' }}>
            Catalogue
          </h1>
          {factionIndex.lastUpdate && (
            <p className="mt-1" style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
              Données à jour au {factionIndex.lastUpdate}
            </p>
          )}
        </div>
        <FactionPicker factions={factionIndex.factions} onSelect={loadFaction} />
      </div>
    )
  }

  if (selectedFaction) {
    const renderGrid = (items: Datasheet[]) => (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {items.map((ds) => (
          <UnitCard
            key={ds.id}
            datasheet={ds}
            owned={collectionItems[ds.id]?.instances?.length}
            instances={collectionItems[ds.id]?.instances}
            onClick={() => navigate(`/catalog/${selectedFactionSlug}/${ds.id}`)}
            selectable={compareMode}
            selected={isSelected(ds.id)}
            onToggleSelect={() => {
              if (isSelected(ds.id)) {
                removeFromCompare(ds.id)
              } else {
                addToCompare(ds.id, selectedFactionSlug ?? '')
              }
            }}
          />
        ))}
      </div>
    )

    return (
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold" style={{ fontSize: 'var(--text-2xl)' }}>
              {selectedFaction.name}
            </h1>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
              {sorted.length} unité{sorted.length !== 1 ? 's' : ''} trouvée{sorted.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={compareMode ? 'primary' : 'ghost'}
              size="sm"
              onClick={toggleCompareMode}
            >
              {compareMode ? 'Annuler' : 'Comparer'}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => selectFaction(null)}>
              Changer
            </Button>
          </div>
        </div>

        {/* Search bar */}
        <div className="mb-3">
          <SearchBar value={query} onChange={setQuery} placeholder="Rechercher une unité..." />
        </div>

        {/* Role filter chips */}
        {roles.length > 1 && (
          <div className="flex flex-wrap gap-2 mb-3">
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

        {/* Sort select */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Trier par :</span>
          {(Object.keys(sortLabels) as SortKey[]).map((key) => (
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
          ))}
        </div>

        {isLoading && <p style={{ color: 'var(--color-text-muted)' }}>Chargement...</p>}

        {sorted.length === 0 && query.trim().length >= 2 ? (
          <EmptyState
            title="Aucune unité trouvée"
            description={`Aucune unité trouvée pour '${query.trim()}'`}
            actionLabel="Effacer la recherche"
            onAction={() => setQuery('')}
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

        {/* Compare bar */}
        {compareMode && selectedIds.length > 0 && <CompareBar />}
      </div>
    )
  }

  return null
}

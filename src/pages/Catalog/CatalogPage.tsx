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

const LEGENDS_SOURCE_ID_THRESHOLD = 350

function isLegendsUnit(ds: Datasheet): boolean {
  const id = parseInt(ds.sourceId, 10)
  return !isNaN(id) && id >= LEGENDS_SOURCE_ID_THRESHOLD
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
  const [showLegends, setShowLegends] = useState(false)
  const [selectedKeywords, setSelectedKeywords] = useState<Set<string>>(new Set())
  const [keywordSearch, setKeywordSearch] = useState('')
  const [keywordDropdownOpen, setKeywordDropdownOpen] = useState(false)
  const collectionItems = useCollectionStore((s) => s.items)
  const favorites = useFavoritesStore((s) => s.favorites)
  const { addUnit: addToCompare, removeUnit: removeFromCompare, isSelected, selectedIds, clear: clearCompare } = useComparatorStore()

  const datasheets = selectedFaction?.datasheets ?? []

  // Count Legends units for this faction
  const legendsCount = useMemo(
    () => datasheets.filter(isLegendsUnit).length,
    [datasheets],
  )

  // Filter out Legends first
  const legendsFiltered = useMemo(() => {
    if (showLegends) return datasheets
    return datasheets.filter((ds) => !isLegendsUnit(ds))
  }, [datasheets, showLegends])

  const roles = useMemo(() => {
    const r = new Set(legendsFiltered.map((ds) => ds.role).filter(Boolean))
    return Array.from(r).sort()
  }, [legendsFiltered])

  // Extract all non-faction keywords for filter chips
  const allKeywords = useMemo(() => {
    const kw = new Map<string, number>()
    for (const ds of legendsFiltered) {
      for (const k of ds.keywords) {
        if (!k.isFactionKeyword) {
          kw.set(k.keyword, (kw.get(k.keyword) ?? 0) + 1)
        }
      }
    }
    return Array.from(kw.entries())
      .sort((a, b) => b[1] - a[1]) // sort by frequency
      .map(([keyword]) => keyword)
  }, [legendsFiltered])

  const roleFiltered = useMemo(() => {
    if (roleFilter === 'all') return legendsFiltered
    return legendsFiltered.filter((ds) => ds.role === roleFilter)
  }, [legendsFiltered, roleFilter])

  // Keyword filter
  const keywordFiltered = useMemo(() => {
    if (selectedKeywords.size === 0) return roleFiltered
    return roleFiltered.filter((ds) =>
      Array.from(selectedKeywords).every((kw) =>
        ds.keywords.some((k) => k.keyword === kw),
      ),
    )
  }, [roleFiltered, selectedKeywords])

  const extractFields = useCallback(extractSearchFields, [])
  const searched = useSearch(keywordFiltered, query, extractFields)
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

  const filteredKeywordSuggestions = useMemo(() => {
    if (!keywordSearch.trim()) return allKeywords.filter((kw) => !selectedKeywords.has(kw)).slice(0, 8)
    const q = keywordSearch.toLowerCase()
    return allKeywords.filter((kw) => !selectedKeywords.has(kw) && kw.toLowerCase().includes(q)).slice(0, 8)
  }, [allKeywords, keywordSearch, selectedKeywords])

  const addKeyword = (kw: string) => {
    setSelectedKeywords((prev) => new Set(prev).add(kw))
    setKeywordSearch('')
    setKeywordDropdownOpen(false)
  }

  const removeKeyword = (kw: string) => {
    setSelectedKeywords((prev) => {
      const next = new Set(prev)
      next.delete(kw)
      return next
    })
  }

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
        <FactionPicker factions={factionIndex.factions} onSelect={(slug) => { if (slug) loadFaction(slug) }} />
      </div>
    )
  }

  if (selectedFaction) {
    const renderGrid = (items: Datasheet[]) => (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
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

        {/* Sort + Legends toggle row */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
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

          {legendsCount > 0 && (
            <>
              <span className="text-xs ml-auto" style={{ color: 'var(--color-text-muted)' }}>|</span>
              <button
                className="text-xs px-2.5 py-1 rounded cursor-pointer border-none min-h-[28px]"
                style={{
                  backgroundColor: showLegends ? 'var(--color-warning, #f59e0b)' : 'var(--color-surface)',
                  color: showLegends ? '#ffffff' : 'var(--color-text-muted)',
                }}
                onClick={() => setShowLegends(!showLegends)}
              >
                Legends ({legendsCount})
              </button>
            </>
          )}
        </div>

        {/* Keyword filter */}
        {allKeywords.length > 0 && (
          <div className="mb-4">
            {/* Selected keyword tags */}
            {selectedKeywords.size > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {Array.from(selectedKeywords).map((kw) => (
                  <button
                    key={kw}
                    className="text-xs px-2 py-1 rounded-full cursor-pointer border-none min-h-[28px] flex items-center gap-1"
                    style={{ backgroundColor: 'var(--color-primary)', color: '#ffffff' }}
                    onClick={() => removeKeyword(kw)}
                  >
                    {kw} <span style={{ opacity: 0.7 }}>&times;</span>
                  </button>
                ))}
                <button
                  className="text-xs px-2 py-1 rounded-full cursor-pointer border-none min-h-[28px]"
                  style={{ backgroundColor: 'transparent', color: 'var(--color-error, #ef4444)' }}
                  onClick={() => setSelectedKeywords(new Set())}
                >
                  Tout effacer
                </button>
              </div>
            )}

            {/* Keyword search input + dropdown */}
            <div className="relative">
              <input
                type="text"
                value={keywordSearch}
                onChange={(e) => { setKeywordSearch(e.target.value); setKeywordDropdownOpen(true) }}
                onFocus={() => setKeywordDropdownOpen(true)}
                placeholder="Filtrer par mot-clé..."
                className="w-full text-sm px-3 py-2 rounded-lg border-none outline-none"
                style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
              />
              {keywordDropdownOpen && filteredKeywordSuggestions.length > 0 && (
                <>
                  <div
                    className="fixed inset-0"
                    style={{ zIndex: 9 }}
                    onClick={() => setKeywordDropdownOpen(false)}
                  />
                  <div
                    className="absolute left-0 right-0 mt-1 rounded-lg overflow-hidden shadow-lg"
                    style={{ backgroundColor: 'var(--color-surface)', zIndex: 10 }}
                  >
                    {filteredKeywordSuggestions.map((kw) => (
                      <button
                        key={kw}
                        className="w-full text-left text-sm px-3 py-2 border-none cursor-pointer"
                        style={{ backgroundColor: 'transparent', color: 'var(--color-text)' }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-bg)')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                        onClick={() => addKeyword(kw)}
                      >
                        {kw}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

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

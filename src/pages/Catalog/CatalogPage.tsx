import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import ReactDOM from 'react-dom'
import { useNavigate } from 'react-router'
import { useGameData } from '@/hooks/useGameData'
import { useSearch } from '@/hooks/useSearch'
import { useTranslation } from '@/hooks/useTranslation'
import { FactionPicker } from '@/components/domain/FactionPicker'
import { UnitCard } from '@/components/domain/UnitCard'
import { UnitSheet } from '@/components/domain/UnitSheet'
import { InlineSimulator } from '@/components/domain/Simulator/InlineSimulator'
import { CompareModal } from '@/components/domain/CompareModal'
import { EmptyState } from '@/components/ui/EmptyState'
import { HudTopBar, HudSearch, HudChip, HudBtn, HudPill, MTopBar } from '@/components/ui/Hud'
import { useCollectionStore } from '@/stores/collectionStore'
import { useFavoritesStore } from '@/stores/favoritesStore'
import { useListsStore } from '@/stores/listsStore'
import { isCharacter, canEquipEnhancement } from '@/utils/enhancementUtils'
import { getKeywordDescription } from '@/utils/keywordDescriptions'
import { usePreferencesStore } from '@/stores/preferencesStore'
import { useGwPriceStore } from '@/stores/gwPriceStore'
import { useCustomImage } from '@/hooks/useCustomImage'
import { T, THtml } from '@/components/ui/TranslatableText'
import type { Datasheet, Faction } from '@/types/gameData.types'

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
  const { factionIndex, selectedFaction, selectedFactionSlug, isLoading, error, loadFaction, selectFaction } = useGameData()
  const [query, setQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<string | 'all'>('all')
  const [chapterFilter, setChapterFilter] = useState<string | 'all'>('all')
  const [sortBy, setSortBy] = useState<SortKey>('name')
  const [showLegends, setShowLegends] = useState(false)
  const [showPrices, setShowPrices] = useState(false)
  const [pointsRange, setPointsRange] = useState<[number, number] | null>(null)
  const [priceRange, setPriceRange] = useState<[number, number] | null>(null)
  const [selectedKeywords, setSelectedKeywords] = useState<Set<string>>(new Set())
  const [keywordSearch, setKeywordSearch] = useState('')
  const [keywordDropdownOpen, setKeywordDropdownOpen] = useState(false)
  const [modalUnit, setModalUnit] = useState<Datasheet | null>(null)
  const collectionItems = useCollectionStore((s) => s.items)
  const addItem = useCollectionStore((s) => s.addItem)
  const addSquad = useCollectionStore((s) => s.addSquad)
  const removeSquad = useCollectionStore((s) => s.removeSquad)
  const favorites = useFavoritesStore((s) => s.favorites)
  const allLists = useListsStore((s) => s.getAllLists)
  const addUnitToList = useListsStore((s) => s.addUnit)

  const loadPrices = useGwPriceStore((s) => s.loadPrices)
  const gwGetPrice = useGwPriceStore((s) => s.getPrice)
  const gwLoaded = useGwPriceStore((s) => s.loaded)
  const favoriteFactionSlug = usePreferencesStore((s) => s.favoriteFactionSlug)
  const hasAutoLoaded = useRef(false)

  // Auto-load favorite faction on first visit if no faction selected
  useEffect(() => {
    if (!hasAutoLoaded.current && favoriteFactionSlug && factionIndex && !selectedFactionSlug) {
      hasAutoLoaded.current = true
      loadFaction(favoriteFactionSlug)
      selectFaction(favoriteFactionSlug)
    }
  }, [favoriteFactionSlug, factionIndex, selectedFactionSlug, loadFaction, selectFaction])

  useEffect(() => { loadPrices() }, [loadPrices])

  // Reset chapter filter when faction changes
  useEffect(() => { setChapterFilter('all') }, [selectedFactionSlug])

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

  // Detect subfactions (chapters) — faction keywords that appear on some but not all units
  const chapters = useMemo(() => {
    const factionKwCounts = new Map<string, number>()
    for (const ds of legendsFiltered) {
      for (const k of ds.keywords) {
        if (k.isFactionKeyword) factionKwCounts.set(k.keyword, (factionKwCounts.get(k.keyword) ?? 0) + 1)
      }
    }
    // A chapter is a faction keyword that doesn't appear on ALL units (i.e. not the main faction keyword)
    const total = legendsFiltered.length
    return Array.from(factionKwCounts.entries())
      .filter(([, count]) => count < total && count >= 2)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }))
  }, [legendsFiltered])

  const hasChapters = chapters.length > 1

  // All chapter names for quick lookup
  const chapterNames = useMemo(() => new Set(chapters.map((c) => c.name)), [chapters])

  // Filter by chapter: show chapter-specific + generic (no chapter keyword) units
  const chapterFiltered = useMemo(() => {
    if (!hasChapters || chapterFilter === 'all') return legendsFiltered
    return legendsFiltered.filter((ds) => {
      const dsChapters = ds.keywords.filter((k) => k.isFactionKeyword && chapterNames.has(k.keyword))
      // Generic unit (no chapter keyword) → show in all chapters
      if (dsChapters.length === 0) return true
      // Chapter-specific → show only if matches filter
      return dsChapters.some((k) => k.keyword === chapterFilter)
    })
  }, [legendsFiltered, chapterFilter, hasChapters, chapterNames])

  const roles = useMemo(() => {
    const r = new Set(chapterFiltered.map((ds) => ds.role).filter(Boolean))
    return Array.from(r).sort()
  }, [chapterFiltered])

  // Extract all non-faction keywords for filter chips
  const allKeywords = useMemo(() => {
    const kw = new Map<string, number>()
    for (const ds of chapterFiltered) {
      for (const k of ds.keywords) {
        if (!k.isFactionKeyword) {
          kw.set(k.keyword, (kw.get(k.keyword) ?? 0) + 1)
        }
      }
    }
    return Array.from(kw.entries())
      .sort((a, b) => b[1] - a[1]) // sort by frequency
      .map(([keyword]) => keyword)
  }, [chapterFiltered])

  const roleFiltered = useMemo(() => {
    if (roleFilter === 'all') return chapterFiltered
    return chapterFiltered.filter((ds) => ds.role === roleFilter)
  }, [chapterFiltered, roleFilter])

  // Keyword filter
  const keywordFiltered = useMemo(() => {
    if (selectedKeywords.size === 0) return roleFiltered
    return roleFiltered.filter((ds) =>
      Array.from(selectedKeywords).every((kw) =>
        ds.keywords.some((k) => k.keyword === kw),
      ),
    )
  }, [roleFiltered, selectedKeywords])

  // Compute points bounds from current faction
  const pointsBounds = useMemo(() => {
    if (keywordFiltered.length === 0) return { min: 0, max: 500 }
    let min = Infinity, max = 0
    for (const ds of keywordFiltered) {
      const cost = ds.pointOptions[0]?.cost ?? 0
      if (cost < min) min = cost
      if (cost > max) max = cost
    }
    return { min: min === Infinity ? 0 : min, max: max || 500 }
  }, [keywordFiltered])

  // Compute price bounds from current faction
  const priceBounds = useMemo(() => {
    if (!gwLoaded || keywordFiltered.length === 0) return { min: 0, max: 200 }
    let min = Infinity, max = 0
    for (const ds of keywordFiltered) {
      const price = gwGetPrice(ds.name)
      if (price !== null) {
        if (price < min) min = price
        if (price > max) max = price
      }
    }
    return { min: min === Infinity ? 0 : Math.floor(min), max: max ? Math.ceil(max) : 200 }
  }, [keywordFiltered, gwLoaded, gwGetPrice])

  // Filter by points range
  const pointsFiltered = useMemo(() => {
    if (!pointsRange) return keywordFiltered
    return keywordFiltered.filter((ds) => {
      const cost = ds.pointOptions[0]?.cost ?? 0
      return cost >= pointsRange[0] && cost <= pointsRange[1]
    })
  }, [keywordFiltered, pointsRange])

  // Filter by price range
  const rangeFiltered = useMemo(() => {
    if (!priceRange || !gwLoaded) return pointsFiltered
    return pointsFiltered.filter((ds) => {
      const price = gwGetPrice(ds.name)
      if (price === null) return true // keep units without a known price
      return price >= priceRange[0] && price <= priceRange[1]
    })
  }, [pointsFiltered, priceRange, gwLoaded, gwGetPrice])

  const { t } = useTranslation()
  const extractFields = useCallback(extractSearchFields, [])
  const searched = useSearch(rangeFiltered, query, extractFields, t)
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
      <>
        {/* Desktop */}
        <div className="hidden lg:block">
          <HudTopBar
            title="Catalogue"
            sub="Codex"
            actions={
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-text-muted)', letterSpacing: 1 }}>
                MAJ {factionIndex.lastUpdate || '—'}
              </span>
            }
          />
          <FactionPicker factions={factionIndex.factions} onSelect={(slug) => { if (slug) { loadFaction(slug); selectFaction(slug) } }} />
        </div>
        {/* Mobile */}
        <div className="lg:hidden">
          <MTopBar
            title="Catalogue"
            sub="Codex"
            actions={
              factionIndex.lastUpdate ? (
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--color-text-muted)', letterSpacing: 1 }}>
                  MAJ {factionIndex.lastUpdate}
                </span>
              ) : undefined
            }
          />
          <FactionPicker factions={factionIndex.factions} onSelect={(slug) => { if (slug) { loadFaction(slug); selectFaction(slug) } }} />
        </div>
      </>
    )
  }

  if (selectedFaction) {
    const renderGrid = (items: Datasheet[]) => (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {items.map((ds) => (
          <UnitCard
            key={ds.id}
            datasheet={ds}
            owned={collectionItems[ds.id]?.squads.flat().length}
            instances={collectionItems[ds.id]?.squads.flat()}
            onClick={() => setModalUnit(ds)}
            showPrice={showPrices}
          />
        ))}
      </div>
    )

    const gridContent = (
      <>
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
            {favoriteDatasheets.length > 0 && (
              <div className="mb-6">
                <div className="text-sm font-semibold mb-2 lg:hidden" style={{ color: 'var(--color-warning, #f59e0b)' }}>
                  Favoris ({favoriteDatasheets.length})
                </div>
                <div className="hidden lg:block mb-2" style={{ fontSize: 10, color: 'var(--color-gold)', fontFamily: 'var(--font-mono)', letterSpacing: 1.5, textTransform: 'uppercase' as const }}>
                  {'\u2605'} Favoris ({favoriteDatasheets.length})
                </div>
                {renderGrid(favoriteDatasheets)}
              </div>
            )}
            {nonFavoriteDatasheets.length > 0 && renderGrid(nonFavoriteDatasheets)}
          </>
        )}
      </>
    )

    return (
      <>
        {/* ══════ DESKTOP HUD ══════ */}
        <div className="hidden lg:block">
          <HudTopBar
            title={selectedFaction.name}
            sub="Codex"
            actions={
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-text-muted)' }}>
                  {sorted.length} unité{sorted.length !== 1 ? 's' : ''}
                </span>
                <HudBtn variant="ghost" onClick={() => selectFaction(null)}>Changer</HudBtn>
              </div>
            }
          />
          <div style={{ padding: '16px 24px 24px' }}>
            {/* Search + filters */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
              <HudSearch value={query} onChange={setQuery} placeholder="Rechercher une unité..." />
              {/* Chapters (subfactions) — separate row */}
              {hasChapters && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', letterSpacing: 1, color: 'var(--color-text-muted)', textTransform: 'uppercase', flexShrink: 0 }}>Chapitre</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 6 }}>
                    <HudChip active={chapterFilter === 'all'} onClick={() => setChapterFilter('all')}>Tous</HudChip>
                    {chapters.map((ch) => (
                      <HudChip key={ch.name} active={chapterFilter === ch.name} onClick={() => setChapterFilter(ch.name)}>{ch.name} ({ch.count})</HudChip>
                    ))}
                  </div>
                </div>
              )}
              <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 6, alignItems: 'center' }}>
                {/* Roles */}
                {roles.length > 1 && (
                  <>
                    <HudChip active={roleFilter === 'all'} onClick={() => setRoleFilter('all')}>Tous</HudChip>
                    {roles.map((role) => (
                      <HudChip key={role} active={roleFilter === role} onClick={() => setRoleFilter(role)}>{role}</HudChip>
                    ))}
                    <span style={{ width: 1, height: 20, background: 'var(--color-border)', margin: '0 4px' }} />
                  </>
                )}
                {/* Sort */}
                {(Object.keys(sortLabels) as SortKey[]).map((key) => (
                  <HudChip key={key} active={sortBy === key} onClick={() => setSortBy(key)}>{sortLabels[key]}</HudChip>
                ))}
                {legendsCount > 0 && (
                  <HudChip active={showLegends} onClick={() => setShowLegends(!showLegends)} color="var(--color-gold)">
                    Legends ({legendsCount})
                  </HudChip>
                )}
                <span style={{ width: 1, height: 20, background: 'var(--color-border)', margin: '0 4px' }} />
                <HudChip active={showPrices} onClick={() => setShowPrices(!showPrices)} color="var(--color-gold)">
                  Prix €
                </HudChip>
              </div>
              {/* Keywords */}
              {allKeywords.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 6, alignItems: 'center' }}>
                  {Array.from(selectedKeywords).map((kw) => (
                    <HudChip key={kw} active onClick={() => removeKeyword(kw)}>{kw} {'\u00d7'}</HudChip>
                  ))}
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      value={keywordSearch}
                      onChange={(e) => { setKeywordSearch(e.target.value); setKeywordDropdownOpen(true) }}
                      onFocus={() => setKeywordDropdownOpen(true)}
                      placeholder="+ mot-clé"
                      style={{
                        width: 120,
                        padding: '4px 8px',
                        fontSize: 10,
                        fontFamily: 'var(--font-mono)',
                        background: 'var(--color-bg-input)',
                        border: '1px solid var(--color-border)',
                        color: 'var(--color-text)',
                        outline: 'none',
                      }}
                    />
                    {keywordDropdownOpen && filteredKeywordSuggestions.length > 0 && (
                      <>
                        <div className="fixed inset-0" style={{ zIndex: 9 }} onClick={() => setKeywordDropdownOpen(false)} />
                        <div style={{ position: 'absolute', left: 0, right: 0, marginTop: 2, background: 'var(--color-surface)', border: '1px solid var(--color-border)', zIndex: 10 }}>
                          {filteredKeywordSuggestions.map((kw) => (
                            <button
                              key={kw}
                              style={{ display: 'block', width: '100%', textAlign: 'left' as const, padding: '6px 8px', fontSize: 10, fontFamily: 'var(--font-mono)', background: 'transparent', border: 'none', color: 'var(--color-text)', cursor: 'pointer' }}
                              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-surface-alt)')}
                              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                              onClick={() => addKeyword(kw)}
                            >
                              {kw}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                  {selectedKeywords.size > 0 && (
                    <button
                      style={{ background: 'transparent', border: 'none', color: 'var(--color-error)', fontSize: 10, fontFamily: 'var(--font-mono)', cursor: 'pointer' }}
                      onClick={() => setSelectedKeywords(new Set())}
                    >
                      Effacer
                    </button>
                  )}
                </div>
              )}
              {/* Range sliders */}
              <div style={{ display: 'flex', gap: 24 }}>
                <div style={{ flex: 1 }}>
                  <HudRangeSlider
                    label="Points"
                    min={pointsBounds.min}
                    max={pointsBounds.max}
                    value={pointsRange}
                    onChange={setPointsRange}
                    suffix=" pts"
                  />
                </div>
                {gwLoaded && (
                  <div style={{ flex: 1 }}>
                    <HudRangeSlider
                      label="Prix €"
                      min={priceBounds.min}
                      max={priceBounds.max}
                      value={priceRange}
                      onChange={setPriceRange}
                      suffix=" €"
                    />
                  </div>
                )}
              </div>
            </div>
            {gridContent}
          </div>
        </div>

        {/* ══════ MOBILE HUD ══════ */}
        <div className="lg:hidden">
          <MTopBar
            title={selectedFaction.name}
            sub="Codex"
            actions={
              <HudBtn variant="ghost" onClick={() => selectFaction(null)} style={{ padding: '4px 8px', fontSize: 9 }}>Changer</HudBtn>
            }
          />
          <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <HudSearch value={query} onChange={setQuery} placeholder="Rechercher une unité..." />

            {/* Chapters (subfactions) */}
            {hasChapters && (
              <div>
                <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', letterSpacing: 1, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>Chapitre</div>
                <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
                  <HudChip active={chapterFilter === 'all'} onClick={() => setChapterFilter('all')}>Tous</HudChip>
                  {chapters.map((ch) => (
                    <HudChip key={ch.name} active={chapterFilter === ch.name} onClick={() => setChapterFilter(ch.name)}>{ch.name}</HudChip>
                  ))}
                </div>
              </div>
            )}

            {/* Roles */}
            {roles.length > 1 && (
              <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
                <HudChip active={roleFilter === 'all'} onClick={() => setRoleFilter('all')}>Tous</HudChip>
                {roles.map((role) => (
                  <HudChip key={role} active={roleFilter === role} onClick={() => setRoleFilter(role)}>{role}</HudChip>
                ))}
              </div>
            )}

            {/* Sort + Legends */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
              {(Object.keys(sortLabels) as SortKey[]).map((key) => (
                <HudChip key={key} active={sortBy === key} onClick={() => setSortBy(key)}>{sortLabels[key]}</HudChip>
              ))}
              {legendsCount > 0 && (
                <HudChip active={showLegends} onClick={() => setShowLegends(!showLegends)} color="var(--color-gold)">
                  Legends ({legendsCount})
                </HudChip>
              )}
              <HudChip active={showPrices} onClick={() => setShowPrices(!showPrices)} color="var(--color-gold)">
                Prix €
              </HudChip>
            </div>

            {/* Keywords */}
            {allKeywords.length > 0 && (
              <div>
                {selectedKeywords.size > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                    {Array.from(selectedKeywords).map((kw) => (
                      <HudChip key={kw} active onClick={() => removeKeyword(kw)}>{kw} {'\u00d7'}</HudChip>
                    ))}
                    <button
                      style={{ background: 'transparent', border: 'none', color: 'var(--color-error)', fontSize: 10, fontFamily: 'var(--font-mono)', cursor: 'pointer' }}
                      onClick={() => setSelectedKeywords(new Set())}
                    >
                      Effacer
                    </button>
                  </div>
                )}
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    value={keywordSearch}
                    onChange={(e) => { setKeywordSearch(e.target.value); setKeywordDropdownOpen(true) }}
                    onFocus={() => setKeywordDropdownOpen(true)}
                    placeholder="+ mot-clé"
                    style={{
                      width: '100%',
                      padding: '6px 10px',
                      fontSize: 11,
                      fontFamily: 'var(--font-mono)',
                      background: 'var(--color-bg-input)',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-text)',
                      outline: 'none',
                    }}
                  />
                  {keywordDropdownOpen && filteredKeywordSuggestions.length > 0 && (
                    <>
                      <div className="fixed inset-0" style={{ zIndex: 9 }} onClick={() => setKeywordDropdownOpen(false)} />
                      <div style={{ position: 'absolute', left: 0, right: 0, marginTop: 2, background: 'var(--color-surface)', border: '1px solid var(--color-border)', zIndex: 10 }}>
                        {filteredKeywordSuggestions.map((kw) => (
                          <button
                            key={kw}
                            style={{ display: 'block', width: '100%', textAlign: 'left', padding: '6px 10px', fontSize: 11, fontFamily: 'var(--font-mono)', background: 'transparent', border: 'none', color: 'var(--color-text)', cursor: 'pointer' }}
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

            {/* Range sliders */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <HudRangeSlider
                label="Points"
                min={pointsBounds.min}
                max={pointsBounds.max}
                value={pointsRange}
                onChange={setPointsRange}
                suffix=" pts"
              />
              {gwLoaded && (
                <HudRangeSlider
                  label="Prix €"
                  min={priceBounds.min}
                  max={priceBounds.max}
                  value={priceRange}
                  onChange={setPriceRange}
                  suffix=" €"
                />
              )}
            </div>

            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-text-muted)' }}>
              {sorted.length} unité{sorted.length !== 1 ? 's' : ''}
            </span>

            {gridContent}
          </div>
        </div>

        {/* ══════ UNIT DETAIL MODAL ══════ */}
        {modalUnit && <UnitDetailModal
          datasheet={modalUnit}
          factionId={selectedFactionSlug ?? ''}
          faction={selectedFaction}
          collectionItems={collectionItems}
          addItem={addItem}
          addSquad={addSquad}
          removeSquad={removeSquad}
          allLists={allLists}
          addUnitToList={addUnitToList}
          onClose={() => setModalUnit(null)}
          attackerFaction={selectedFaction}
          attackerFactionSlug={selectedFactionSlug ?? ''}
        />}
      </>
    )
  }

  return null
}

const paintDotConfig: Record<string, { color: string; label: string }> = {
  unassembled: { color: 'var(--color-text-muted)', label: 'Non montée' },
  assembled: { color: 'var(--color-warning)', label: 'Montée' },
  'in-progress': { color: 'var(--color-accent)', label: 'En cours' },
  done: { color: 'var(--color-success)', label: 'Terminée' },
}

function parseWeaponAbilities(s: string): string[] {
  if (!s || s === '-' || s === '–') return []
  return s.split(',').map(a => a.trim()).filter(Boolean)
}

function DesktopSectionHeader({ children, icon }: { children: string; icon?: string }) {
  return (
    <div style={{ fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase' as const, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', padding: '14px 16px 8px', display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ color: 'var(--color-accent)' }}>{icon || '▸'}</span>
      {children}
    </div>
  )
}

function WeaponKeywordPill({ keyword }: { keyword: string }) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null)
  const desc = getKeywordDescription(keyword)
  const ref = useRef<HTMLSpanElement>(null)

  const handleEnter = () => {
    if (!ref.current || desc.length === 0) return
    const rect = ref.current.getBoundingClientRect()
    setPos({ x: rect.left + rect.width / 2, y: rect.top })
  }

  return (
    <span
      ref={ref}
      style={{ display: 'inline-block', cursor: 'default' }}
      onMouseEnter={handleEnter}
      onMouseLeave={() => setPos(null)}
    >
      <HudPill>{keyword}</HudPill>
      {pos && desc.length > 0 && ReactDOM.createPortal(
        <div style={{
          position: 'fixed',
          left: pos.x,
          top: pos.y,
          transform: 'translate(-50%, -100%)',
          marginTop: -6,
          padding: '10px 14px',
          background: 'var(--color-bg)',
          border: '1px solid color-mix(in srgb, var(--color-accent) 30%, var(--color-border))',
          boxShadow: '0 0 20px rgba(79,212,255,0.08), 0 4px 12px rgba(0,0,0,0.4)',
          zIndex: 9999,
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
        }}>
          {desc.map((line, i) => (
            <div key={i} style={{ fontSize: 11, color: 'var(--color-text-muted)', lineHeight: 1.5, fontFamily: 'var(--font-mono)' }}>
              {line}
            </div>
          ))}
        </div>,
        document.body,
      )}
    </span>
  )
}

function UnitDetailModal({
  datasheet,
  factionId,
  faction,
  collectionItems,
  addItem,
  addSquad,
  removeSquad,
  allLists,
  addUnitToList,
  onClose,
  attackerFaction,
  attackerFactionSlug,
}: {
  datasheet: Datasheet
  factionId: string
  faction: Faction | null
  collectionItems: Record<string, { squads: string[][] }>
  addItem: (id: string, factionId: string, modelCount?: number) => void
  addSquad: (id: string, modelCount: number) => void
  removeSquad: (id: string, squadIndex: number) => void
  allLists: () => { id: string; name: string; factionId: string; units: { datasheetId: string; points: number; enhancement?: { cost: number } }[]; pointsLimit: number }[]
  addUnitToList: (listId: string, unit: any) => void
  onClose: () => void
  attackerFaction: any
  attackerFactionSlug: string
}) {
  const navigate = useNavigate()
  const [showListPicker, setShowListPicker] = useState(false)
  const [simMode, setSimMode] = useState(false)
  const [compareOpen, setCompareOpen] = useState(false)
  const [selectedAbility, setSelectedAbility] = useState<{ name: string; description: string } | null>(null)

  const item = collectionItems[datasheet.id]
  const ownedCount = item?.squads.flat().length ?? 0
  const squadCount = item?.squads.length ?? 0
  const points = datasheet.pointOptions.length > 0 ? datasheet.pointOptions[0].cost : 0
  const modelCount = parseInt(datasheet.pointOptions[0]?.models) || 1

  const enhancementGroups = useMemo(() => {
    if (!isCharacter(datasheet) || !faction?.detachments) return []
    return faction.detachments
      .map((det) => ({
        detachmentName: det.name,
        enhancements: (det.enhancements ?? []).filter((e) => canEquipEnhancement(e, datasheet)),
      }))
      .filter((g) => g.enhancements.length > 0)
  }, [datasheet, faction])

  const gwGetPrice = useGwPriceStore((s) => s.getPrice)
  const gwLoaded = useGwPriceStore((s) => s.loaded)
  const gwPrice = gwLoaded ? gwGetPrice(datasheet.name) : null
  const { customImageUrl, save: saveCustomImage } = useCustomImage(datasheet.id)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const factionKeywords = datasheet.keywords.filter(k => k.isFactionKeyword).map(k => k.keyword)
  const rangedWeapons = datasheet.weapons.filter(w => w.type !== 'Melee' && w.range !== 'Melee')
  const meleeWeapons = datasheet.weapons.filter(w => w.type === 'Melee' || w.range === 'Melee')
  const imageUrl = customImageUrl || datasheet.imageUrl

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const handleAddToList = () => {
    const lists = allLists().filter((l) => l.factionId === factionId)
    if (lists.length === 0) return
    if (lists.length === 1) {
      addUnitToList(lists[0].id, {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        datasheetId: datasheet.id,
        datasheetName: datasheet.name,
        points,
        selectedPointOptionIndex: 0,
        selectedWeapons: [],
        notes: '',
      })
      return
    }
    setShowListPicker(true)
  }

  const handleSelectList = (listId: string) => {
    addUnitToList(listId, {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      datasheetId: datasheet.id,
      datasheetName: datasheet.name,
      points,
      selectedPointOptionIndex: 0,
      selectedWeapons: [],
      notes: '',
    })
    setShowListPicker(false)
  }

  const handleUpdateQuantity = (qty: number) => {
    if (qty > squadCount) {
      addSquad(datasheet.id, modelCount)
    } else if (qty < squadCount && qty >= 0) {
      removeSquad(datasheet.id, squadCount - 1)
    }
  }

  const isMobileModal = typeof window !== 'undefined' && window.innerWidth < 1024
  const [dragY, setDragY] = useState(0)
  const [dragging, setDragging] = useState(false)
  const dragStartY = useRef(0)
  const modalRef = useRef<HTMLDivElement>(null)

  const handleDragStart = useCallback((clientY: number) => {
    if (!isMobileModal) return
    const el = modalRef.current
    if (el && el.scrollTop > 0) return
    dragStartY.current = clientY
    setDragging(true)
  }, [isMobileModal])

  const handleDragMove = useCallback((clientY: number) => {
    if (!dragging) return
    const dy = clientY - dragStartY.current
    setDragY(Math.max(0, dy))
  }, [dragging])

  const handleDragEnd = useCallback(() => {
    if (!dragging) return
    setDragging(false)
    if (dragY > 120) {
      onClose()
    }
    setDragY(0)
  }, [dragging, dragY, onClose])

  return (
    <div
      data-scroll-lock
      className="fixed inset-0 z-50 flex items-end lg:items-center justify-center"
      style={{
        backgroundColor: `rgba(0,0,0,${0.6 - Math.min(dragY / 500, 0.4)})`,
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
      }}
      onClick={onClose}
    >
      <div
        ref={modalRef}
        className="unit-detail-modal"
        style={{
          width: isMobileModal ? '100%' : '95%',
          maxWidth: simMode ? 1000 : (isMobileModal ? 600 : 960),
          maxHeight: isMobileModal ? '92vh' : '90vh',
          overflowY: 'auto',
          background: 'var(--color-bg)',
          border: isMobileModal ? '1px solid var(--color-border)' : '1px solid color-mix(in srgb, var(--color-accent) 30%, var(--color-border))',
          borderBottom: isMobileModal ? 'none' : '1px solid color-mix(in srgb, var(--color-accent) 30%, var(--color-border))',
          borderRadius: isMobileModal ? '16px 16px 0 0' : undefined,
          boxShadow: isMobileModal ? undefined : '0 0 80px rgba(79,212,255,0.07), 0 0 30px rgba(79,212,255,0.05), inset 0 1px 0 rgba(79,212,255,0.06)',
          padding: isMobileModal ? 16 : 0,
          paddingTop: isMobileModal ? 8 : 0,
          position: 'relative',
          animation: isMobileModal ? 'modal-slide-up 0.25s ease' : 'modal-slide-up 0.25s ease',
          transform: dragY > 0 ? `translateY(${dragY}px)` : undefined,
          transition: dragging ? 'none' : 'transform 0.25s ease',
        }}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => handleDragStart(e.touches[0].clientY)}
        onTouchMove={(e) => handleDragMove(e.touches[0].clientY)}
        onTouchEnd={handleDragEnd}
      >
        {isMobileModal ? (
          <>
            {/* Mobile: drag handle */}
            <div className="flex justify-center mb-2" style={{ paddingTop: 4, paddingBottom: 4 }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: 'var(--color-text-muted)', opacity: 0.5 }} />
            </div>
            {simMode ? (
              <InlineSimulator
                attackerDatasheet={datasheet}
                attackerFaction={attackerFaction}
                attackerFactionSlug={attackerFactionSlug}
                onBack={() => setSimMode(false)}
              />
            ) : (
              <UnitSheet
                datasheet={datasheet}
                ownedCount={squadCount}
                enhancementGroups={enhancementGroups}
                onAddToCollection={() => addItem(datasheet.id, factionId, modelCount)}
                onUpdateQuantity={handleUpdateQuantity}
                onAddToList={handleAddToList}
                onSimulate={datasheet.weapons.length > 0 ? () => navigate(`/simulate/${factionId}/${datasheet.id}`) : undefined}
                onCompare={() => setCompareOpen(true)}
                forceAccordion
              />
            )}
          </>
        ) : simMode ? (
          <InlineSimulator
            attackerDatasheet={datasheet}
            attackerFaction={attackerFaction}
            attackerFactionSlug={attackerFactionSlug}
            onBack={() => setSimMode(false)}
          />
        ) : (
          <>
            {/* Hidden file input for photo */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) saveCustomImage(file)
                e.target.value = ''
              }}
            />

            {/* ── Header + Profile (2 columns: photo | info + stats) ── */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)' }}>
              {/* Left — Photo */}
              {imageUrl && (
                <div style={{ width: 220, flexShrink: 0, borderRight: '1px solid var(--color-border)', overflow: 'hidden', position: 'relative' }}>
                  <img
                    src={imageUrl}
                    alt={datasheet.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', display: 'block' }}
                  />
                  {/* Diagonal scan lines */}
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'repeating-linear-gradient(45deg, transparent, transparent 7px, rgba(79,212,255,0.10) 7px, rgba(79,212,255,0.10) 8px)',
                    pointerEvents: 'none',
                  }} />
                  {/* Corner target brackets */}
                  {([
                    { top: 8, left: 8, borderTop: '2px solid', borderLeft: '2px solid' },
                    { top: 8, right: 8, borderTop: '2px solid', borderRight: '2px solid' },
                    { bottom: 8, left: 8, borderBottom: '2px solid', borderLeft: '2px solid' },
                    { bottom: 8, right: 8, borderBottom: '2px solid', borderRight: '2px solid' },
                  ] as const).map((pos, i) => (
                    <div key={i} style={{
                      position: 'absolute',
                      width: 14,
                      height: 14,
                      ...pos,
                      color: 'rgba(79,212,255,0.35)',
                      borderColor: 'rgba(79,212,255,0.35)',
                      pointerEvents: 'none',
                    } as React.CSSProperties} />
                  ))}
                </div>
              )}
              {/* Right — Info + Profile */}
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                {/* Info bar */}
                <div style={{ padding: '14px 20px 10px', flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)', letterSpacing: 0.5 }}>
                          {factionKeywords.join(' \u203a ') || faction?.name || ''}
                        </span>
                        {datasheet.role && <HudPill>{datasheet.role}</HudPill>}
                      </div>
                      <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-text)', margin: '4px 0 0', lineHeight: 1.2 }}>
                        <T text={datasheet.name} category="unit" />
                      </h2>
                      <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)', marginTop: 2, letterSpacing: 0.5 }}>
                        ID {datasheet.sourceId || datasheet.id} {'\u00b7'} {modelCount} mod{'\u00e8'}le{modelCount > 1 ? 's' : ''}
                      </div>
                      {gwPrice !== null && (
                        <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--color-gold, #c4a535)', marginTop: 4, fontWeight: 600 }}>
                          {gwPrice} € <span style={{ fontSize: 9, color: 'var(--color-text-muted)', fontWeight: 400, letterSpacing: 0.5 }}>GW</span>
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                      <div style={{ border: '1px solid var(--color-border)', padding: '6px 14px', fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 600, color: 'var(--color-text)', letterSpacing: 0.5 }}>
                        {points} <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>PTS</span>
                      </div>
                      <button
                        onClick={onClose}
                        style={{ background: 'transparent', border: 'none', color: 'var(--color-text-muted)', fontSize: 10, fontFamily: 'var(--font-mono)', cursor: 'pointer', letterSpacing: 0.5 }}
                      >
                        {'\u00d7'} FERMER [ESC]
                      </button>
                    </div>
                  </div>
                </div>
                {/* Profile stats */}
                {datasheet.profiles.length > 0 && (
                  <div style={{ borderTop: '1px solid var(--color-border)' }}>
                    <DesktopSectionHeader>Profil</DesktopSectionHeader>
                    <div style={{ padding: '0 16px 12px' }}>
                      {datasheet.profiles.map((p, pi) => (
                        <div key={pi} style={{ display: 'flex', gap: 2, marginBottom: pi < datasheet.profiles.length - 1 ? 6 : 0 }}>
                          {([
                            { label: 'M', value: p.M },
                            { label: 'T', value: p.T },
                            { label: 'SV', value: p.Sv },
                            { label: 'W', value: p.W },
                            { label: 'LD', value: p.Ld },
                            { label: 'OC', value: p.OC },
                          ] as const).map(({ label, value }) => (
                            <div key={label} style={{ flex: 1, border: '1px solid var(--color-border)', padding: '8px 0', textAlign: 'center', background: 'var(--color-surface)' }}>
                              <div style={{ fontSize: 9, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: 1, textTransform: 'uppercase' }}>{label}</div>
                              <div style={{ fontSize: 22, fontWeight: 600, color: 'var(--color-accent)', marginTop: 2 }}>{value}</div>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ── Weapons (2 columns) ── */}
            {datasheet.weapons.length > 0 && (
              <div style={{ display: 'flex', borderTop: '1px solid var(--color-border)', marginTop: 8 }}>
                <div style={{ flex: 1, borderRight: meleeWeapons.length > 0 ? '1px solid var(--color-border)' : 'none' }}>
                  {rangedWeapons.length > 0 && (
                    <>
                      <DesktopSectionHeader icon="+">Armes de tir</DesktopSectionHeader>
                      <div style={{ padding: '0 16px 12px' }}>
                        {rangedWeapons.map((w, i) => {
                          const abs = parseWeaponAbilities(w.abilities)
                          return (
                            <div key={i} style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', padding: '10px 12px', marginBottom: 6 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)' }}><T text={w.name} category="weapon" /></span>
                                <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}>{w.range}</span>
                              </div>
                              <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 4, fontFamily: 'var(--font-mono)', letterSpacing: 0.3 }}>
                                A <span style={{ color: 'var(--color-text)', fontWeight: 600 }}>{w.A}</span>
                                {' '}CT <span style={{ color: 'var(--color-text)', fontWeight: 600 }}>{w.BS_WS}</span>
                                {' '}F <span style={{ color: 'var(--color-text)', fontWeight: 600 }}>{w.S}</span>
                                {' '}PA <span style={{ color: 'var(--color-text)', fontWeight: 600 }}>{w.AP}</span>
                                {' '}D <span style={{ color: 'var(--color-text)', fontWeight: 600 }}>{w.D}</span>
                              </div>
                              {abs.length > 0 && (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
                                  {abs.map(a => <WeaponKeywordPill key={a} keyword={a} />)}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </>
                  )}
                </div>
                {meleeWeapons.length > 0 && (
                  <div style={{ flex: 1 }}>
                    <DesktopSectionHeader icon={'\u2694'}>Armes de m{'\u00ea'}l{'\u00e9'}e</DesktopSectionHeader>
                    <div style={{ padding: '0 16px 12px' }}>
                      {meleeWeapons.map((w, i) => {
                        const abs = parseWeaponAbilities(w.abilities)
                        return (
                          <div key={i} style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', padding: '10px 12px', marginBottom: 6 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)' }}>
                              <T text={w.name} category="weapon" />
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 4, fontFamily: 'var(--font-mono)', letterSpacing: 0.3 }}>
                              A <span style={{ color: 'var(--color-text)', fontWeight: 600 }}>{w.A}</span>
                              {' '}CC <span style={{ color: 'var(--color-text)', fontWeight: 600 }}>{w.BS_WS}</span>
                              {' '}F <span style={{ color: 'var(--color-text)', fontWeight: 600 }}>{w.S}</span>
                              {' '}PA <span style={{ color: 'var(--color-text)', fontWeight: 600 }}>{w.AP}</span>
                              {' '}D <span style={{ color: 'var(--color-text)', fontWeight: 600 }}>{w.D}</span>
                            </div>
                            {abs.length > 0 && (
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
                                {abs.map(a => <WeaponKeywordPill key={a} keyword={a} />)}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Abilities ── */}
            {datasheet.abilities.length > 0 && (
              <div style={{ borderTop: '1px solid var(--color-border)' }}>
                <DesktopSectionHeader icon={'\u2699'}>Capacit{'\u00e9'}s</DesktopSectionHeader>
                <div style={{ padding: '0 16px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {datasheet.abilities.map((a, i) => (
                    <button
                      key={`${a.id}-${i}`}
                      onClick={() => setSelectedAbility({ name: a.name, description: a.description })}
                      style={{
                        background: 'var(--color-surface)',
                        border: '1px solid var(--color-border)',
                        padding: '10px 14px',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'border-color 0.15s, box-shadow 0.15s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--color-accent) 40%, var(--color-border))'
                        e.currentTarget.style.boxShadow = '0 0 12px rgba(79,212,255,0.08)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'var(--color-border)'
                        e.currentTarget.style.boxShadow = 'none'
                      }}
                    >
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>
                        <T text={a.name} category="ability" />
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── Keywords + Instances (2 columns) ── */}
            <div style={{ display: 'flex', borderTop: '1px solid var(--color-border)' }}>
              <div style={{ flex: 1, borderRight: '1px solid var(--color-border)' }}>
                <DesktopSectionHeader icon={'\u229e'}>Mots-cl{'\u00e9'}s</DesktopSectionHeader>
                <div style={{ padding: '0 16px 12px', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {datasheet.keywords.map((k, i) => (
                    <HudPill key={i} color={k.isFactionKeyword ? 'var(--color-primary)' : undefined}>
                      <T text={k.keyword} category="keyword" />
                    </HudPill>
                  ))}
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <DesktopSectionHeader icon={'\u25cf'}>Instances poss{'\u00e9'}d{'\u00e9'}es</DesktopSectionHeader>
                <div style={{ padding: '0 16px 12px' }}>
                  {item?.squads.length ? (
                    item.squads.map((squad, si) => (
                      <div key={si} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)', minWidth: 24 }}>
                          #{String(si + 1).padStart(2, '0')}
                        </span>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {squad.map((status, mi) => (
                            <span
                              key={mi}
                              title={paintDotConfig[status]?.label || status}
                              style={{
                                display: 'inline-block',
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                background: paintDotConfig[status]?.color || 'var(--color-text-muted)',
                                boxShadow: status === 'done' ? '0 0 4px var(--color-success)' : 'none',
                                cursor: 'default',
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    <span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                      Aucune instance
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* ── Action Bar ── */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '12px 16px', borderTop: '1px solid var(--color-border)', background: 'var(--color-bg-elevated)' }}>
              <HudBtn variant="accent" onClick={() => {
                if (ownedCount === 0) addItem(datasheet.id, factionId, modelCount)
                else addSquad(datasheet.id, modelCount)
              }}>
                + Ajouter {'\u00e0'} la collection
              </HudBtn>
              {ownedCount > 0 && (
                <HudBtn variant="ghost" onClick={() => navigate('/collection')}>
                  {'\u2699'} Afficher dans la collection
                </HudBtn>
              )}
              <HudBtn variant="ghost" onClick={() => fileInputRef.current?.click()}>
                {'\ud83d\udcf7'} Ajouter photo
              </HudBtn>
              <HudBtn variant="ghost" onClick={handleAddToList}>
                + Ajouter {'\u00e0'} une liste
              </HudBtn>
              {datasheet.weapons.length > 0 && (
                <HudBtn variant="ghost" onClick={() => setSimMode(true)}>
                  Simuler
                </HudBtn>
              )}
              <HudBtn variant="ghost" onClick={() => setCompareOpen(true)}>
                Comparer
              </HudBtn>
            </div>
          </>
        )}

        <CompareModal
          open={compareOpen}
          onClose={() => setCompareOpen(false)}
          sourceDatasheet={datasheet}
          sourceFactionName={faction?.name ?? ''}
        />

        {/* Ability detail sub-modal */}
        {selectedAbility && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}
            onClick={() => setSelectedAbility(null)}
          >
            <div
              style={{
                width: '90%',
                maxWidth: 520,
                background: 'var(--color-bg)',
                border: '1px solid var(--color-border)',
                boxShadow: '0 0 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(79,212,255,0.06)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header bar */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 16px',
                borderBottom: '1px solid var(--color-border)',
                background: 'var(--color-surface-alt)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: 'var(--color-accent)', fontSize: 11, textShadow: '0 0 6px var(--color-accent)' }}>{'\u2699'}</span>
                  <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--color-text-dim)' }}>
                    Capacit{'\u00e9'}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedAbility(null)}
                  style={{ background: 'transparent', border: 'none', color: 'var(--color-text-muted)', fontSize: 10, fontFamily: 'var(--font-mono)', cursor: 'pointer', letterSpacing: 0.5 }}
                >
                  {'\u00d7'} FERMER
                </button>
              </div>
              {/* Content */}
              <div style={{ padding: '16px 20px 20px' }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)', marginBottom: 10 }}>
                  <T text={selectedAbility.name} category="ability" />
                </h3>
                <THtml
                  html={selectedAbility.description}
                  category="ability"
                  style={{ fontSize: 13, color: 'var(--color-text-muted)', lineHeight: 1.6 }}
                />
              </div>
            </div>
          </div>
        )}

        {/* List picker sub-modal */}
        {showListPicker && (
          <div
            data-scroll-lock
            className="fixed inset-0 z-50 flex items-end justify-center"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
            onClick={() => setShowListPicker(false)}
          >
            <div
              style={{ width: '100%', maxWidth: 500, padding: 16, background: 'var(--color-surface)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 style={{ fontWeight: 600, marginBottom: 12, color: 'var(--color-text)' }}>
                Ajouter à quelle liste ?
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                {allLists()
                  .filter((l) => l.factionId === factionId)
                  .map((list) => (
                    <button
                      key={list.id}
                      style={{
                        textAlign: 'left',
                        padding: '10px 14px',
                        background: 'var(--color-bg)',
                        border: '1px solid var(--color-border)',
                        color: 'var(--color-text)',
                        cursor: 'pointer',
                      }}
                      onClick={() => handleSelectList(list.id)}
                    >
                      {list.name}
                    </button>
                  ))}
              </div>
              <button
                style={{ background: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)', padding: '8px 16px', cursor: 'pointer', width: '100%' }}
                onClick={() => setShowListPicker(false)}
              >
                Annuler
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function HudRangeSlider({
  label,
  min,
  max,
  value,
  onChange,
  suffix,
}: {
  label: string
  min: number
  max: number
  value: [number, number] | null
  onChange: (v: [number, number] | null) => void
  suffix?: string
}) {
  const lo = value?.[0] ?? min
  const hi = value?.[1] ?? max
  const isActive = value !== null
  const sfx = suffix ?? ''

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
      <button
        onClick={() => onChange(isActive ? null : [min, max])}
        style={{
          fontSize: 9,
          fontFamily: 'var(--font-mono)',
          letterSpacing: 1,
          color: isActive ? 'var(--color-accent)' : 'var(--color-text-muted)',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          textTransform: 'uppercase',
          flexShrink: 0,
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </button>
      {isActive && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--color-text)', minWidth: 32, textAlign: 'right' }}>
            {lo}{sfx}
          </span>
          <input
            type="range"
            min={min}
            max={max}
            value={lo}
            onChange={(e) => {
              const v = Number(e.target.value)
              onChange([Math.min(v, hi), hi])
            }}
            style={{ flex: 1, accentColor: 'var(--color-accent)', cursor: 'pointer', minWidth: 60 }}
          />
          <input
            type="range"
            min={min}
            max={max}
            value={hi}
            onChange={(e) => {
              const v = Number(e.target.value)
              onChange([lo, Math.max(v, lo)])
            }}
            style={{ flex: 1, accentColor: 'var(--color-accent)', cursor: 'pointer', minWidth: 60 }}
          />
          <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--color-text)', minWidth: 32 }}>
            {hi}{sfx}
          </span>
          <button
            onClick={() => onChange(null)}
            style={{ background: 'transparent', border: 'none', color: 'var(--color-error)', fontSize: 10, fontFamily: 'var(--font-mono)', cursor: 'pointer', flexShrink: 0 }}
          >
            ×
          </button>
        </div>
      )}
    </div>
  )
}

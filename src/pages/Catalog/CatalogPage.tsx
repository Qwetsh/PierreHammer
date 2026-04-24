import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router'
import { useGameData } from '@/hooks/useGameData'
import { useSearch } from '@/hooks/useSearch'
import { FactionPicker } from '@/components/domain/FactionPicker'
import { UnitCard } from '@/components/domain/UnitCard'
import { UnitSheet } from '@/components/domain/UnitSheet'
import { InlineSimulator } from '@/components/domain/Simulator/InlineSimulator'
import { CompareModal } from '@/components/domain/CompareModal'
import { EmptyState } from '@/components/ui/EmptyState'
import { HudTopBar, HudSearch, HudChip, HudBtn, MTopBar } from '@/components/ui/Hud'
import { useCollectionStore } from '@/stores/collectionStore'
import { useFavoritesStore } from '@/stores/favoritesStore'
import { useListsStore } from '@/stores/listsStore'
import { isCharacter, canEquipEnhancement } from '@/utils/enhancementUtils'
import { usePreferencesStore } from '@/stores/preferencesStore'
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
  const [sortBy, setSortBy] = useState<SortKey>('name')
  const [showLegends, setShowLegends] = useState(false)
  const [selectedKeywords, setSelectedKeywords] = useState<Set<string>>(new Set())
  const [keywordSearch, setKeywordSearch] = useState('')
  const [keywordDropdownOpen, setKeywordDropdownOpen] = useState(false)
  const [modalUnit, setModalUnit] = useState<Datasheet | null>(null)
  const collectionItems = useCollectionStore((s) => s.items)
  const addItem = useCollectionStore((s) => s.addItem)
  const addInstance = useCollectionStore((s) => s.addInstance)
  const removeInstance = useCollectionStore((s) => s.removeInstance)
  const favorites = useFavoritesStore((s) => s.favorites)
  const allLists = useListsStore((s) => s.getAllLists)
  const addUnitToList = useListsStore((s) => s.addUnit)

  const favoriteFactionSlug = usePreferencesStore((s) => s.favoriteFactionSlug)
  const hasAutoLoaded = useRef(false)

  // Auto-load favorite faction on first visit if no faction selected
  useEffect(() => {
    if (!hasAutoLoaded.current && favoriteFactionSlug && factionIndex && !selectedFactionSlug) {
      hasAutoLoaded.current = true
      loadFaction(favoriteFactionSlug)
    }
  }, [favoriteFactionSlug, factionIndex, selectedFactionSlug, loadFaction])

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
          <FactionPicker factions={factionIndex.factions} onSelect={(slug) => { if (slug) loadFaction(slug) }} />
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
          <FactionPicker factions={factionIndex.factions} onSelect={(slug) => { if (slug) loadFaction(slug) }} />
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
            owned={collectionItems[ds.id]?.instances?.length}
            instances={collectionItems[ds.id]?.instances}
            onClick={() => setModalUnit(ds)}
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
          addInstance={addInstance}
          removeInstance={removeInstance}
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

function UnitDetailModal({
  datasheet,
  factionId,
  faction,
  collectionItems,
  addItem,
  addInstance,
  removeInstance,
  allLists,
  addUnitToList,
  onClose,
  attackerFaction,
  attackerFactionSlug,
}: {
  datasheet: Datasheet
  factionId: string
  faction: Faction | null
  collectionItems: Record<string, { instances: string[] }>
  addItem: (id: string, factionId: string) => void
  addInstance: (id: string) => void
  removeInstance: (id: string, index: number) => void
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

  const ownedCount = collectionItems[datasheet.id]?.instances?.length ?? 0
  const points = datasheet.pointOptions.length > 0 ? datasheet.pointOptions[0].cost : 0

  const enhancementGroups = useMemo(() => {
    if (!isCharacter(datasheet) || !faction?.detachments) return []
    return faction.detachments
      .map((det) => ({
        detachmentName: det.name,
        enhancements: (det.enhancements ?? []).filter((e) => canEquipEnhancement(e, datasheet)),
      }))
      .filter((g) => g.enhancements.length > 0)
  }, [datasheet, faction])

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
    if (qty > ownedCount) {
      addInstance(datasheet.id)
    } else if (qty < ownedCount && qty >= 0) {
      removeInstance(datasheet.id, ownedCount - 1)
    }
  }

  return (
    <div
      data-scroll-lock
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <div
        className="unit-detail-modal"
        style={{
          width: '95%',
          maxWidth: simMode ? 1000 : 600,
          maxHeight: '90vh',
          overflowY: 'auto',
          background: 'var(--color-bg)',
          border: '1px solid var(--color-border)',
          padding: 16,
          position: 'relative',
          animation: 'modal-slide-up 0.25s ease',
          transition: 'max-width 0.3s ease',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'sticky',
            top: 0,
            float: 'right',
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text-muted)',
            width: 32,
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: 16,
            zIndex: 10,
          }}
        >
          {'\u2715'}
        </button>

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
            ownedCount={ownedCount}
            enhancementGroups={enhancementGroups}
            onAddToCollection={() => addItem(datasheet.id, factionId)}
            onUpdateQuantity={handleUpdateQuantity}
            onAddToList={handleAddToList}
            onSimulate={datasheet.weapons.length > 0 ? () => {
              if (window.innerWidth < 1024) {
                navigate(`/simulate/${factionId}/${datasheet.id}`)
              } else {
                setSimMode(true)
              }
            } : undefined}
            onCompare={() => setCompareOpen(true)}
            forceAccordion
          />
        )}

        <CompareModal
          open={compareOpen}
          onClose={() => setCompareOpen(false)}
          sourceDatasheet={datasheet}
          sourceFactionName={faction?.name ?? ''}
        />

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

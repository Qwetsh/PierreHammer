import { useState, useMemo, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useCollectionStore } from '@/stores/collectionStore'
import { useGameDataStore } from '@/stores/gameDataStore'
import { useFavoritesStore } from '@/stores/favoritesStore'
import { useSearch } from '@/hooks/useSearch'
import { useTranslation } from '@/hooks/useTranslation'
import { UnitCard } from '@/components/domain/UnitCard'
import { EmptyState } from '@/components/ui/EmptyState'
import { HudPanel, HudChip, HudSearch, HudSegmentedBar, HudTopBar, MTopBar } from '@/components/ui/Hud'
import type { PaintStatus } from '@/components/domain/PaintStatusBadge'
import type { Datasheet } from '@/types/gameData.types'
import { T } from '@/components/ui/TranslatableText'
import { PaintingHelper } from '@/components/domain/PaintingHelper/PaintingHelper'
import { FriendsOwners } from '@/components/domain/FriendsOwners/FriendsOwners'

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

const paintDotColors: Record<PaintStatus, string> = {
  unassembled: 'var(--color-text-muted)',
  assembled: 'var(--color-warning)',
  'in-progress': 'var(--color-accent)',
  done: 'var(--color-success)',
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

  const updateModelStatus = useCollectionStore((s) => s.updateModelStatus)
  const setSquadStatus = useCollectionStore((s) => s.setSquadStatus)
  const addSquad = useCollectionStore((s) => s.addSquad)
  const removeSquad = useCollectionStore((s) => s.removeSquad)

  const [query, setQuery] = useState('')
  const [factionFilter, setFactionFilter] = useState<string | 'all'>('all')
  const [paintFilter, setPaintFilter] = useState<PaintStatus | 'all'>('all')
  const [sortBy, setSortBy] = useState<SortKey>('name')
  const [editingId, setEditingId] = useState<string | null>(null)

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
    return allDatasheets.filter((ds) => ds.id in collectionItems)
  }, [allDatasheets, collectionItems])

  const factionFiltered = useMemo(() => {
    if (factionFilter === 'all') return toggleFiltered
    return toggleFiltered.filter((ds) => ds.factionSlug === factionFilter)
  }, [toggleFiltered, factionFilter])

  const paintFiltered = useMemo(() => {
    if (paintFilter === 'all') return factionFiltered
    return factionFiltered.filter((ds) => {
      const item = collectionItems[ds.id]
      return item?.squads.flat().some((s) => s === paintFilter)
    })
  }, [factionFiltered, paintFilter, collectionItems])

  const { t } = useTranslation()
  const extractFields = useCallback(extractSearchFields, [])
  const searched = useSearch(paintFiltered, query, extractFields, t)

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
          const ia = collectionItems[a.id]?.squads.flat() ?? []
          const ib = collectionItems[b.id]?.squads.flat() ?? []
          const sa = ia.length > 0 ? Math.min(...ia.map((s) => paintOrder[s])) : 0
          const sb = ib.length > 0 ? Math.min(...ib.map((s) => paintOrder[s])) : 0
          return sa - sb
        }
      }
    })
  }, [searched, sortBy, collectionItems])

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

  const paintCycle: PaintStatus[] = ['unassembled', 'assembled', 'in-progress', 'done']
  const paintLabels: Record<PaintStatus, string> = {
    unassembled: 'Non montée',
    assembled: 'Montée',
    'in-progress': 'En cours',
    done: 'Terminée',
  }

  const editingItem = editingId ? collectionItems[editingId] : null
  const editingDatasheet = editingId ? sortedDatasheets.find((ds) => ds.id === editingId) ?? allDatasheets.find((ds) => ds.id === editingId) : null

  const stats = getProgressStats()

  const renderGrid = (items: DatasheetWithFaction[]) => (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {items.map((ds) => (
        <UnitCard
          key={ds.id}
          datasheet={ds}
          owned={collectionItems[ds.id]?.squads.flat().length}
          instances={collectionItems[ds.id]?.squads.flat()}
          onClick={() => {
            if (collectionItems[ds.id]) {
              setEditingId(ds.id)
            } else {
              navigate(`/catalog/${ds.factionSlug}/${ds.id}`)
            }
          }}
        />
      ))}
    </div>
  )

  if (!hasCollection) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4" style={{ fontSize: 'var(--text-2xl)' }}>Collection</h1>
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
    <>
      {/* ══════ DESKTOP HUD LAYOUT ══════ */}
      <div className="hidden lg:block">
        <HudTopBar
          title="Collection"
          sub="Arsenal"
          actions={
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-text-muted)' }}>
              {sortedDatasheets.length} unité{sortedDatasheets.length !== 1 ? 's' : ''}
            </span>
          }
        />

        <div style={{ padding: '16px 24px 24px' }}>
          {/* Paint progression + search row */}
          <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
            {/* Paint progress panel */}
            {hasCollection && (
              <HudPanel title="Progression" style={{ width: 280, flexShrink: 0 }}>
                <div style={{ padding: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 600, color: 'var(--color-accent)' }}>
                      {stats.percentComplete}%
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-text-muted)' }}>
                      {stats.completed}/{stats.total}
                    </span>
                  </div>
                  <HudSegmentedBar
                    height={6}
                    segments={[
                      { value: stats.completed, color: 'var(--color-success)' },
                      { value: stats.inProgress, color: 'var(--color-accent)' },
                      { value: stats.assembled, color: 'var(--color-warning)' },
                      { value: stats.unassembled, color: '#536577' },
                    ]}
                  />
                </div>
              </HudPanel>
            )}

            {/* Search + filters */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <HudSearch value={query} onChange={setQuery} placeholder="Rechercher une unité..." />
              <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 6 }}>
                {/* Faction chips */}
                {availableFactions.length > 1 && (
                  <>
                    <HudChip active={factionFilter === 'all'} onClick={() => setFactionFilter('all')}>Toutes</HudChip>
                    {availableFactions.map((f) => (
                      <HudChip key={f.slug} active={factionFilter === f.slug} onClick={() => setFactionFilter(f.slug)}>
                        <T text={f.name} category="faction" />
                      </HudChip>
                    ))}
                    <span style={{ width: 1, height: 24, background: 'var(--color-border)', margin: '0 4px' }} />
                  </>
                )}
                {/* Paint status chips */}
                {paintStatusOptions.map((opt) => (
                  <HudChip key={opt.value} active={paintFilter === opt.value} onClick={() => setPaintFilter(opt.value)}>
                    {opt.label}
                  </HudChip>
                ))}
              </div>
              {/* Sort */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 9, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: 1.5, textTransform: 'uppercase' as const }}>
                  Tri
                </span>
                {(Object.keys(sortLabels) as SortKey[]).map((key) => (
                    <HudChip key={key} active={sortBy === key} onClick={() => setSortBy(key)}>
                      {sortLabels[key]}
                    </HudChip>
                ))}
              </div>
            </div>
          </div>

          {/* Grid */}
          {sortedDatasheets.length === 0 && hasFilters ? (
            <EmptyState
              title="Aucune figurine ne correspond"
              description="Essaie d'ajuster tes filtres pour trouver ce que tu cherches."
              actionLabel="Réinitialiser les filtres"
              onAction={resetFilters}
            />
          ) : (
            <>
              {favoriteDatasheets.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 10, color: 'var(--color-gold)', fontFamily: 'var(--font-mono)', letterSpacing: 1.5, textTransform: 'uppercase' as const, marginBottom: 8 }}>
                    {'\u2605'} Favoris ({favoriteDatasheets.length})
                  </div>
                  {renderGrid(favoriteDatasheets)}
                </div>
              )}
              {nonFavoriteDatasheets.length > 0 && renderGrid(nonFavoriteDatasheets)}
            </>
          )}
        </div>

        {/* Desktop instance editor — side panel */}
        {editingId && editingItem && editingDatasheet && (
          <div
            data-scroll-lock
            className="fixed inset-0"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 60 }}
            onClick={() => setEditingId(null)}
          >
            <div
              className="fixed top-0 right-0 bottom-0"
              style={{ width: 380, background: 'var(--color-bg-elevated)', borderLeft: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text)' }}>
                    <T text={editingDatasheet.name} category="unit" />
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                    {editingItem.squads.length} escouade{editingItem.squads.length > 1 ? 's' : ''} · {editingItem.squads.flat().length} figurines
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  {editingDatasheet.pointOptions.length > 1 && (
                    <select
                      id="squad-size-select"
                      style={{
                        padding: '4px 6px',
                        fontSize: 10,
                        fontFamily: 'var(--font-mono)',
                        background: 'var(--color-surface)',
                        color: 'var(--color-text)',
                        border: '1px solid var(--color-border)',
                        cursor: 'pointer',
                      }}
                    >
                      {editingDatasheet.pointOptions.map((opt, i) => (
                        <option key={i} value={i}>{opt.models}</option>
                      ))}
                    </select>
                  )}
                  <button
                    style={{ padding: '5px 12px', fontSize: 11, fontFamily: 'var(--font-mono)', background: 'color-mix(in srgb, var(--color-accent) 10%, transparent)', color: 'var(--color-accent)', border: '1px solid var(--color-accent)', cursor: 'pointer' }}
                    onClick={() => {
                      const selectEl = document.getElementById('squad-size-select') as HTMLSelectElement | null
                      const idx = selectEl ? Number(selectEl.value) : 0
                      const mc = parseInt(editingDatasheet.pointOptions[idx]?.models ?? editingDatasheet.pointOptions[0]?.models) || 1
                      addSquad(editingId, mc)
                    }}
                  >
                    + Escouade
                  </button>
                  <button
                    style={{ padding: '5px 10px', fontSize: 11, background: 'transparent', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)', cursor: 'pointer' }}
                    onClick={() => setEditingId(null)}
                  >
                    {'\u2715'}
                  </button>
                </div>
              </div>
              <div style={{ flex: 1, overflow: 'auto', padding: '12px 20px' }}>
                {editingItem.squads.map((squad, si) => (
                  <div key={si} style={{ marginBottom: 16 }}>
                    {/* Squad header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--color-accent)', letterSpacing: 1 }}>
                          ESC. {si + 1}
                        </span>
                        <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}>
                          {squad.length} fig. · {squad.filter((s) => s === 'done').length}/{squad.length} peintes
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {paintCycle.map((s) => (
                          <button
                            key={s}
                            title={`Tout marquer ${paintLabels[s]}`}
                            style={{
                              width: 16, height: 16, padding: 0, fontSize: 7,
                              background: 'transparent', color: paintDotColors[s],
                              border: `1px solid ${paintDotColors[s]}`, cursor: 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}
                            onClick={() => setSquadStatus(editingId, si, s)}
                          >
                            {'\u25cf'}
                          </button>
                        ))}
                        <button
                          style={{ background: 'transparent', border: 'none', color: 'var(--color-error)', cursor: 'pointer', fontSize: 10, padding: '0 4px' }}
                          onClick={() => {
                            removeSquad(editingId, si)
                            if (editingItem.squads.length <= 1) setEditingId(null)
                          }}
                        >
                          {'\u2715'}
                        </button>
                      </div>
                    </div>
                    {/* Individual models */}
                    <div style={{ borderLeft: '2px solid var(--color-border)', paddingLeft: 10 }}>
                      {squad.map((status, mi) => (
                        <div
                          key={mi}
                          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', borderBottom: '1px solid var(--color-border)' }}
                        >
                          <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)', width: 16 }}>
                            {mi + 1}
                          </span>
                          <div style={{ display: 'flex', gap: 3, flex: 1 }}>
                            {paintCycle.map((s) => (
                              <button
                                key={s}
                                style={{
                                  flex: 1, padding: '3px 0', fontSize: 8,
                                  fontFamily: 'var(--font-mono)', letterSpacing: 0.5,
                                  textTransform: 'uppercase' as const,
                                  background: status === s ? `color-mix(in srgb, ${paintDotColors[s]} 20%, transparent)` : 'transparent',
                                  color: status === s ? paintDotColors[s] : 'var(--color-text-muted)',
                                  border: `1px solid ${status === s ? paintDotColors[s] : 'var(--color-border)'}`,
                                  cursor: 'pointer',
                                }}
                                onClick={() => updateModelStatus(editingId, si, mi, s)}
                              >
                                {paintLabels[s]}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                {editingItem && editingDatasheet && (
                  <PaintingHelper
                    factionId={editingItem.factionId}
                    unitName={editingDatasheet.name}
                    factionName={editingDatasheet.factionName}
                  />
                )}
                {editingId && <FriendsOwners datasheetId={editingId} />}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ══════ MOBILE HUD LAYOUT ══════ */}
      <div className="lg:hidden">
        <MTopBar
          title="Collection"
          sub="Arsenal"
          actions={
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-text-muted)' }}>
              {sortedDatasheets.length} unité{sortedDatasheets.length !== 1 ? 's' : ''}
            </span>
          }
        />
        <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {hasCollection && (
            <HudSegmentedBar
              height={6}
              segments={[
                { value: stats.completed, color: 'var(--color-success)' },
                { value: stats.inProgress, color: 'var(--color-accent)' },
                { value: stats.assembled, color: 'var(--color-warning)' },
                { value: stats.unassembled, color: '#536577' },
              ]}
            />
          )}

          <HudSearch value={query} onChange={setQuery} placeholder="Rechercher une unité..." />

          {/* Faction chips — horizontal scroll */}
          {availableFactions.length > 1 && (
            <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
              <HudChip active={factionFilter === 'all'} onClick={() => setFactionFilter('all')}>Toutes</HudChip>
              {availableFactions.map((f) => (
                <HudChip key={f.slug} active={factionFilter === f.slug} onClick={() => setFactionFilter(f.slug)}>
                  <T text={f.name} category="faction" />
                </HudChip>
              ))}
            </div>
          )}

          {/* Paint status chips */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {paintStatusOptions.map((opt) => (
              <HudChip key={opt.value} active={paintFilter === opt.value} onClick={() => setPaintFilter(opt.value)}>
                {opt.label}
              </HudChip>
            ))}
          </div>

          {/* Sort */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 9, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: 1.5, textTransform: 'uppercase' }}>Tri</span>
            {(Object.keys(sortLabels) as SortKey[]).map((key) => {
              if (false) return null
              return <HudChip key={key} active={sortBy === key} onClick={() => setSortBy(key)}>{sortLabels[key]}</HudChip>
            })}
          </div>

          {/* Grid */}
          {sortedDatasheets.length === 0 && hasFilters ? (
            <EmptyState
              title="Aucune figurine ne correspond"
              description="Essaie d'ajuster tes filtres pour trouver ce que tu cherches."
              actionLabel="Réinitialiser les filtres"
              onAction={resetFilters}
            />
          ) : (
            <>
              {favoriteDatasheets.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 10, color: 'var(--color-gold, #f0b540)', fontFamily: 'var(--font-mono)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 }}>
                    {'\u2605'} Favoris ({favoriteDatasheets.length})
                  </div>
                  {renderGrid(favoriteDatasheets)}
                </div>
              )}
              {nonFavoriteDatasheets.length > 0 && renderGrid(nonFavoriteDatasheets)}
            </>
          )}
        </div>

        {/* Mobile instance editor — bottom sheet HUD */}
        {editingId && editingItem && editingDatasheet && (
          <div
            data-scroll-lock
            className="fixed left-0 right-0 top-0 flex items-end justify-center"
            style={{
              backgroundColor: 'rgba(0,0,0,0.6)',
              zIndex: 60,
              bottom: 'calc(60px + env(safe-area-inset-bottom, 0px))',
            }}
            onClick={() => setEditingId(null)}
          >
            <div
              className="w-full max-w-lg"
              style={{ backgroundColor: 'var(--color-surface)', maxHeight: '70%', display: 'flex', flexDirection: 'column' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)' }}>
                    <T text={editingDatasheet.name} category="unit" />
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                    {editingItem.squads.length} esc. · {editingItem.squads.flat().length} figurines
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    style={{ padding: '5px 10px', fontSize: 10, fontFamily: 'var(--font-mono)', background: 'color-mix(in srgb, var(--color-accent) 10%, transparent)', color: 'var(--color-accent)', border: '1px solid var(--color-accent)', cursor: 'pointer' }}
                    onClick={() => {
                      const mc = parseInt(editingDatasheet.pointOptions[0]?.models) || 1
                      addSquad(editingId, mc)
                    }}
                  >
                    + ESC.
                  </button>
                  <button
                    style={{ padding: '5px 8px', fontSize: 10, background: 'transparent', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)', cursor: 'pointer' }}
                    onClick={() => setEditingId(null)}
                  >
                    {'\u2715'}
                  </button>
                </div>
              </div>
              <div style={{ flex: '1 1 auto', minHeight: 0, overflow: 'auto', padding: '8px 16px' }}>
                {editingItem.squads.map((squad, si) => (
                  <div key={si} style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--color-accent)', letterSpacing: 1 }}>
                          ESC. {si + 1}
                        </span>
                        <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}>
                          {squad.filter((s) => s === 'done').length}/{squad.length}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {paintCycle.map((s) => (
                          <button
                            key={s}
                            style={{
                              width: 16, height: 16, padding: 0, fontSize: 7,
                              background: 'transparent', color: paintDotColors[s],
                              border: `1px solid ${paintDotColors[s]}`, cursor: 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}
                            onClick={() => setSquadStatus(editingId, si, s)}
                          >
                            {'\u25cf'}
                          </button>
                        ))}
                        <button
                          style={{ background: 'transparent', border: 'none', color: 'var(--color-error)', cursor: 'pointer', fontSize: 10, padding: '0 4px' }}
                          onClick={() => {
                            removeSquad(editingId, si)
                            if (editingItem.squads.length <= 1) setEditingId(null)
                          }}
                        >
                          {'\u2715'}
                        </button>
                      </div>
                    </div>
                    <div style={{ borderLeft: '2px solid var(--color-border)', paddingLeft: 8 }}>
                      {squad.map((status, mi) => (
                        <div
                          key={mi}
                          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 0', borderBottom: '1px solid var(--color-border)' }}
                        >
                          <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)', width: 16 }}>
                            {mi + 1}
                          </span>
                          <div style={{ display: 'flex', gap: 3, flex: 1 }}>
                            {paintCycle.map((s) => (
                              <button
                                key={s}
                                style={{
                                  flex: 1, padding: '3px 0', fontSize: 8,
                                  fontFamily: 'var(--font-mono)', letterSpacing: 0.5,
                                  textTransform: 'uppercase',
                                  background: status === s ? `color-mix(in srgb, ${paintDotColors[s]} 20%, transparent)` : 'transparent',
                                  color: status === s ? paintDotColors[s] : 'var(--color-text-muted)',
                                  border: `1px solid ${status === s ? paintDotColors[s] : 'var(--color-border)'}`,
                                  cursor: 'pointer',
                                }}
                                onClick={() => updateModelStatus(editingId, si, mi, s)}
                              >
                                {paintLabels[s]}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                {editingItem && editingDatasheet && (
                  <PaintingHelper
                    factionId={editingItem.factionId}
                    unitName={editingDatasheet.name}
                    factionName={editingDatasheet.factionName}
                  />
                )}
                {editingId && <FriendsOwners datasheetId={editingId} />}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

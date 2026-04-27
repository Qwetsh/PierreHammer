import { useState, useEffect, useMemo } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useGameDataStore } from '@/stores/gameDataStore'
import { useTranslation } from '@/hooks/useTranslation'
import type { Datasheet } from '@/types/gameData.types'

interface CompareUnit {
  datasheet: Datasheet
  factionName: string
}

interface CompareModalProps {
  open: boolean
  onClose: () => void
  sourceDatasheet: Datasheet
  sourceFactionName: string
}

const MAX_COMPARE = 3
const statLabels = ['M', 'T', 'Sv', 'invSv', 'W', 'Ld', 'OC'] as const
type StatKey = (typeof statLabels)[number]

function getBestStat(stat: StatKey, datasheets: Datasheet[]): string {
  const values = datasheets.map((ds) => ds.profiles[0]?.[stat] ?? '')
  const nums = values.map((v) => parseInt(v.replace(/[^0-9]/g, ''), 10) || 0)
  const lowerIsBetter = stat === 'Sv' || stat === 'Ld' || stat === 'invSv'
  const best = lowerIsBetter ? Math.min(...nums.filter((n) => n > 0)) : Math.max(...nums)
  const bestIdx = nums.indexOf(best)
  return values[bestIdx] ?? ''
}

function useIsMobile() {
  const [mobile, setMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 1024)
  useEffect(() => {
    const mql = window.matchMedia('(max-width: 1023px)')
    const handler = (e: MediaQueryListEvent) => setMobile(e.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [])
  return mobile
}

export function CompareModal({ open, onClose, sourceDatasheet, sourceFactionName }: CompareModalProps) {
  const { t: tr } = useTranslation()
  const factionIndex = useGameDataStore((s) => s.factionIndex)
  const loadedFactions = useGameDataStore((s) => s.loadedFactions)
  const loadFaction = useGameDataStore((s) => s.loadFaction)
  const preloadAllFactions = useGameDataStore((s) => s.preloadAllFactions)
  const isMobile = useIsMobile()

  const [targets, setTargets] = useState<CompareUnit[]>([])
  const [addingUnit, setAddingUnit] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [browseFaction, setBrowseFaction] = useState<string | null>(null)
  const [preloading, setPreloading] = useState(false)

  // Preload all factions silently (single batch, no theme change)
  useEffect(() => {
    if (!open || !factionIndex) return
    const allLoaded = factionIndex.factions.every((f) => !!loadedFactions[f.slug])
    if (allLoaded) return
    setPreloading(true)
    preloadAllFactions().finally(() => setPreloading(false))
  }, [open, factionIndex]) // eslint-disable-line react-hooks/exhaustive-deps

  // Reset on open
  useEffect(() => {
    if (open) {
      setTargets([])
      setAddingUnit(true)
      setSearchQuery('')
      setBrowseFaction(null)
      setPreloading(false)
    }
  }, [open])

  const excludedIds = useMemo(() => {
    const ids = new Set([sourceDatasheet.id])
    for (const t of targets) ids.add(t.datasheet.id)
    return ids
  }, [sourceDatasheet.id, targets])

  // Cross-faction search
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return []
    const words = q.split(/\s+/).filter(Boolean)
    const results: (Datasheet & { factionName: string })[] = []
    for (const faction of Object.values(loadedFactions)) {
      for (const ds of faction.datasheets) {
        const name = ds.name.toLowerCase()
        const translated = tr(ds.name).toLowerCase()
        if (!excludedIds.has(ds.id) && words.every((w) => name.includes(w) || translated.includes(w))) {
          results.push({ ...ds, factionName: faction.name })
        }
      }
    }
    return results.sort((a, b) => a.name.localeCompare(b.name, 'fr')).slice(0, 20)
  }, [loadedFactions, searchQuery, excludedIds])

  // Browse a specific faction
  const browseDatasheets = useMemo(() => {
    if (!browseFaction) return []
    const faction = loadedFactions[browseFaction]
    if (!faction) return []
    return faction.datasheets
      .filter((ds) => !excludedIds.has(ds.id))
      .sort((a, b) => a.name.localeCompare(b.name, 'fr'))
  }, [browseFaction, loadedFactions, excludedIds])

  const browseFactionName = browseFaction ? (loadedFactions[browseFaction]?.name ?? '') : ''

  const selectUnit = (ds: Datasheet, factionName: string) => {
    setTargets((prev) => [...prev, { datasheet: ds, factionName }])
    setAddingUnit(false)
    setSearchQuery('')
    setBrowseFaction(null)
  }

  const removeTarget = (index: number) => {
    setTargets((prev) => {
      const next = prev.filter((_, i) => i !== index)
      if (next.length === 0) setAddingUnit(true)
      return next
    })
  }

  const allUnits: CompareUnit[] = [{ datasheet: sourceDatasheet, factionName: sourceFactionName }, ...targets]
  const canAddMore = targets.length < MAX_COMPARE - 1
  const showComparison = targets.length > 0 && !addingUnit
  const unitCount = allUnits.length

  // Desktop modal width adapts to unit count
  const desktopMaxWidth = addingUnit ? 520 : unitCount === 2 ? 700 : 900

  if (!open) return null

  const isMelee = (w: { type: string; range: string }) => w.type === 'Melee' || w.range === 'Melee'

  return (
    <AnimatePresence>
      {open && (
        <div
          data-scroll-lock
          className="fixed inset-0 z-[90] flex items-end lg:items-center lg:justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}
          onClick={onClose}
        >
          <motion.div
            initial={isMobile ? { y: '100%' } : { y: 30, opacity: 0 }}
            animate={isMobile ? { y: 0 } : { y: 0, opacity: 1 }}
            exit={isMobile ? { y: '100%' } : { y: 30, opacity: 0 }}
            transition={isMobile ? { type: 'spring', damping: 28, stiffness: 320 } : { duration: 0.2 }}
            className="w-full lg:w-auto"
            style={{
              maxHeight: '85vh',
              maxWidth: isMobile ? undefined : desktopMaxWidth,
              minWidth: isMobile ? undefined : 420,
              overflowY: 'auto',
              backgroundColor: 'var(--color-bg)',
              borderTop: '1px solid var(--color-border)',
              borderLeft: isMobile ? 'none' : '1px solid var(--color-border)',
              borderRight: isMobile ? 'none' : '1px solid var(--color-border)',
              borderBottom: isMobile ? 'none' : '1px solid var(--color-border)',
              transition: 'max-width 0.3s ease',
            }}
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          >
            {/* Drag handle (mobile) */}
            <div className="lg:hidden flex justify-center pt-2 pb-1">
              <div style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: 'var(--color-text-muted)', opacity: 0.4 }} />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--color-border)' }}>
              <h2 className="font-semibold" style={{ fontSize: 'var(--text-lg)', color: 'var(--color-text)' }}>
                Comparateur
              </h2>
              <button
                onClick={onClose}
                className="flex items-center justify-center border-none cursor-pointer"
                style={{ width: 32, height: 32, backgroundColor: 'var(--color-surface)', color: 'var(--color-text-muted)', fontSize: 14 }}
              >
                {'\u2715'}
              </button>
            </div>

            <div className="p-4">
              {showComparison ? (
                /* ═══════ COMPARISON VIEW ═══════ */
                <div>
                  {/* Unit headers */}
                  <div className="grid gap-2 mb-4" style={{ gridTemplateColumns: `repeat(${unitCount}, 1fr)` }}>
                    {allUnits.map((unit, i) => (
                      <div
                        key={unit.datasheet.id}
                        className="rounded-lg p-2 text-center"
                        style={{ backgroundColor: 'var(--color-surface)' }}
                      >
                        <p className="font-semibold text-xs mb-0.5" style={{ color: 'var(--color-text)' }}>
                          {unit.datasheet.name}
                        </p>
                        <p style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>{unit.factionName}</p>
                        <p style={{ fontSize: 11, color: 'var(--color-accent)', fontWeight: 600 }}>
                          {unit.datasheet.pointOptions[0]?.cost ?? '?'} pts
                        </p>
                        {i > 0 && (
                          <button
                            className="text-xs mt-1 cursor-pointer bg-transparent border-none"
                            style={{ color: 'var(--color-text-muted)' }}
                            onClick={() => removeTarget(i - 1)}
                          >
                            Retirer
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Stats table */}
                  <SectionLabel>Profil</SectionLabel>
                  <div className="overflow-x-auto mb-3">
                    <table className="w-full text-sm" style={{ color: 'var(--color-text)', minWidth: unitCount === 3 ? 380 : undefined }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--color-surface)' }}>
                          <th className="text-left py-1 pr-2" style={{ fontSize: 11 }}>Stat</th>
                          {allUnits.map((u) => (
                            <th key={u.datasheet.id} className="text-center px-1 py-1" style={{ fontSize: 11 }}>
                              {u.datasheet.name.split(' ').slice(0, 2).join(' ')}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {statLabels.map((stat) => {
                          const bestVal = getBestStat(stat, allUnits.map((u) => u.datasheet))
                          return (
                            <tr key={stat} style={{ borderBottom: '1px solid var(--color-surface)' }}>
                              <td className="py-1 pr-2 font-medium" style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{stat === 'invSv' ? 'INV' : stat}</td>
                              {allUnits.map((u) => {
                                const val = u.datasheet.profiles[0]?.[stat] ?? '-'
                                return (
                                  <td
                                    key={u.datasheet.id}
                                    className="text-center px-1 py-1 font-medium"
                                    style={{ fontSize: 12, color: val === bestVal && unitCount > 1 ? 'var(--color-success)' : 'var(--color-text)' }}
                                  >
                                    {val}
                                  </td>
                                )
                              })}
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Weapons */}
                  <SectionLabel>Armes</SectionLabel>
                  <div className="overflow-x-auto mb-3">
                    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${unitCount}, 1fr)`, minWidth: unitCount === 3 ? 500 : undefined }}>
                      {allUnits.map((u) => (
                        <div key={u.datasheet.id} className="flex flex-col gap-1">
                          {u.datasheet.weapons.map((w, i) => (
                            <div
                              key={i}
                              className="rounded px-2 py-1 text-xs"
                              style={{ backgroundColor: 'var(--color-surface)' }}
                            >
                              <p className="font-medium" style={{ color: isMelee(w) ? 'var(--color-warning, #f59e0b)' : 'var(--color-text)' }}>
                                {w.name}
                              </p>
                              <p style={{ color: 'var(--color-text-muted)', fontSize: 10 }}>
                                {w.range !== 'Melee' ? `${w.range} ` : ''}A{w.A} {w.BS_WS} F{w.S} PA{w.AP} D{w.D}
                              </p>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Abilities */}
                  <SectionLabel>Capacités</SectionLabel>
                  <div className="overflow-x-auto mb-3">
                    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${unitCount}, 1fr)`, minWidth: unitCount === 3 ? 400 : undefined }}>
                      {allUnits.map((u) => (
                        <div key={u.datasheet.id} className="flex flex-col gap-1">
                          {u.datasheet.abilities.map((a) => (
                            <div
                              key={a.id}
                              className="rounded px-2 py-1 text-xs"
                              style={{ backgroundColor: 'var(--color-surface)' }}
                            >
                              <p className="font-medium" style={{ color: 'var(--color-accent)' }}>{a.name}</p>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Add 3rd unit */}
                  {canAddMore && (
                    <button
                      className="w-full py-2 mt-2 text-sm cursor-pointer border-none rounded"
                      style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-accent)', fontFamily: 'var(--font-mono)', fontSize: 11 }}
                      onClick={() => setAddingUnit(true)}
                    >
                      + Ajouter une unité
                    </button>
                  )}
                </div>
              ) : (
                /* ═══════ PICKER VIEW ═══════ */
                <div>
                  {/* Source unit mini-card */}
                  <div
                    className="rounded-lg p-3 mb-4"
                    style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>{sourceDatasheet.name}</p>
                        <p style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>{sourceFactionName}</p>
                      </div>
                      <p style={{ fontSize: 12, color: 'var(--color-accent)', fontWeight: 600 }}>
                        {sourceDatasheet.pointOptions[0]?.cost ?? '?'} pts
                      </p>
                    </div>
                  </div>

                  {/* Already selected targets */}
                  {targets.length > 0 && (
                    <div className="flex flex-col gap-2 mb-4">
                      {targets.map((t, i) => (
                        <div
                          key={t.datasheet.id}
                          className="rounded-lg p-2 flex items-center justify-between"
                          style={{ backgroundColor: 'var(--color-surface)' }}
                        >
                          <div>
                            <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>{t.datasheet.name}</p>
                            <p style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>{t.factionName}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span style={{ fontSize: 11, color: 'var(--color-accent)' }}>{t.datasheet.pointOptions[0]?.cost ?? '?'} pts</span>
                            <button
                              className="text-xs cursor-pointer bg-transparent border-none"
                              style={{ color: 'var(--color-text-muted)' }}
                              onClick={() => removeTarget(i)}
                            >
                              {'\u2715'}
                            </button>
                          </div>
                        </div>
                      ))}
                      <button
                        className="text-sm py-2 cursor-pointer border-none rounded"
                        style={{ backgroundColor: 'var(--color-accent)', color: '#fff' }}
                        onClick={() => setAddingUnit(false)}
                      >
                        Voir la comparaison
                      </button>
                    </div>
                  )}

                  {/* Search bar */}
                  <p className="text-xs mb-2" style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: 0.5 }}>
                    {targets.length === 0 ? 'Choisir une unité à comparer' : 'Ajouter une unité'}
                  </p>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); if (e.target.value.trim()) setBrowseFaction(null) }}
                    placeholder="Rechercher une unité (toutes factions)..."
                    className="w-full mb-3"
                    style={{
                      padding: '10px 12px',
                      fontSize: 13,
                      backgroundColor: 'var(--color-bg-input, var(--color-surface))',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-text)',
                      outline: 'none',
                    }}
                  />

                  {/* Loading indicator */}
                  {preloading && (
                    <div className="flex items-center gap-2 mb-3 py-2 px-3 rounded" style={{ backgroundColor: 'var(--color-surface)' }}>
                      <span className="compare-spinner" />
                      <span className="text-xs" style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                        Chargement des factions...
                      </span>
                    </div>
                  )}

                  {/* Search results */}
                  {searchQuery.trim() ? (
                    <div className="flex flex-col gap-1" style={{ maxHeight: 300, overflowY: 'auto' }}>
                      {searchResults.length === 0 ? (
                        <p className="text-xs py-4 text-center" style={{ color: 'var(--color-text-muted)' }}>
                          {preloading ? 'Chargement en cours...' : 'Aucune unité trouvée'}
                        </p>
                      ) : (
                        searchResults.map((ds) => (
                          <button
                            key={ds.id}
                            className="w-full text-left p-2 rounded cursor-pointer border-none"
                            style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                            onClick={() => selectUnit(ds, ds.factionName)}
                          >
                            <span className="text-sm font-medium">{ds.name}</span>
                            <span className="text-xs ml-2" style={{ color: 'var(--color-text-muted)' }}>{ds.factionName}</span>
                            <span className="text-xs ml-1" style={{ color: 'var(--color-accent)' }}>
                              {ds.pointOptions[0]?.cost ?? '?'} pts
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  ) : browseFaction ? (
                    /* Browsing a faction */
                    <div>
                      <button
                        className="text-xs mb-2 cursor-pointer bg-transparent border-none"
                        style={{ color: 'var(--color-accent)' }}
                        onClick={() => setBrowseFaction(null)}
                      >
                        ← {browseFactionName}
                      </button>
                      <div className="flex flex-col gap-1" style={{ maxHeight: 300, overflowY: 'auto' }}>
                        {browseDatasheets.map((ds) => (
                          <button
                            key={ds.id}
                            className="w-full text-left p-2 rounded cursor-pointer border-none"
                            style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                            onClick={() => selectUnit(ds, browseFactionName)}
                          >
                            <span className="text-sm font-medium">{ds.name}</span>
                            <span className="text-xs ml-2" style={{ color: 'var(--color-accent)' }}>
                              {ds.pointOptions[0]?.cost ?? '?'} pts
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    /* Faction list */
                    <div className="flex flex-col gap-1" style={{ maxHeight: 300, overflowY: 'auto' }}>
                      {factionIndex?.factions.map((f) => (
                        <button
                          key={f.slug}
                          className="w-full text-left p-2 rounded cursor-pointer border-none flex items-center justify-between"
                          style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
                          onClick={() => { setBrowseFaction(f.slug); if (!loadedFactions[f.slug]) loadFaction(f.slug) }}
                        >
                          <span className="text-sm">{f.name}</span>
                          <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{f.datasheetCount}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

function SectionLabel({ children }: { children: string }) {
  return (
    <p
      className="font-semibold mb-1.5"
      style={{ fontSize: 12, color: 'var(--color-text)', fontFamily: 'var(--font-mono)', letterSpacing: 0.5, textTransform: 'uppercase' }}
    >
      {children}
    </p>
  )
}

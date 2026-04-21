import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router'
import { useGameDataStore } from '@/stores/gameDataStore'
import { useGameData } from '@/hooks/useGameData'
import { useFactionTheme } from '@/hooks/useFactionTheme'
import { resolveCombat, parseDiceNotation } from '@/utils/combatEngine'
import { parseWeaponKeywords } from '@/utils/weaponKeywordParser'
import { extractCombatEffects } from '@/utils/combatEffectsExtractor'
import { Button } from '@/components/ui/Button'
import type { Weapon, Datasheet, Profile } from '@/types/gameData.types'
import type { CombatResult } from '@/types/combat.types'

function StatBadge({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="flex flex-col items-center rounded-lg px-2 py-1.5" style={{ backgroundColor: 'var(--color-surface)', minWidth: '60px' }}>
      <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{label}</span>
      <span className="font-bold text-sm" style={{ color: 'var(--color-accent)' }}>{value}</span>
      {sub && <span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>{sub}</span>}
    </div>
  )
}

function ResultBar({ label, value, max, detail }: { label: string; value: number; max: number; detail?: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0
  return (
    <div className="mb-2">
      <div className="flex justify-between text-xs mb-0.5">
        <span style={{ color: 'var(--color-text)' }}>{label}</span>
        <span style={{ color: 'var(--color-accent)' }}>
          {Math.round(value * 100) / 100}
          {detail && <span style={{ color: 'var(--color-text-muted)' }}> {detail}</span>}
        </span>
      </div>
      <div className="rounded-full h-2 overflow-hidden" style={{ backgroundColor: 'var(--color-surface)' }}>
        <div className="h-full rounded-full transition-all duration-300" style={{ width: `${pct}%`, backgroundColor: 'var(--color-accent)' }} />
      </div>
    </div>
  )
}

function KeywordBadge({ text }: { text: string }) {
  return (
    <span className="text-[10px] px-1.5 py-0.5 rounded font-medium" style={{ backgroundColor: 'var(--color-primary)', color: '#fff' }}>
      {text}
    </span>
  )
}

export function SimulatorPage() {
  const { factionId, datasheetId } = useParams<{ factionId?: string; datasheetId?: string }>()
  const navigate = useNavigate()
  const { factionIndex } = useGameData()
  const loadedFactions = useGameDataStore((s) => s.loadedFactions)
  const loadFaction = useGameDataStore((s) => s.loadFaction)

  useFactionTheme(factionId ?? null)

  // --- Attacker state ---
  const [attackerFactionSlug, setAttackerFactionSlug] = useState<string | null>(factionId ?? null)
  const [attackerDatasheet, setAttackerDatasheet] = useState<Datasheet | null>(null)
  const [selectedWeapon, setSelectedWeapon] = useState<Weapon | null>(null)
  const [attackerCount, setAttackerCount] = useState(5)

  // --- Defender state ---
  const [defenderFactionSlug, setDefenderFactionSlug] = useState<string | null>(null)
  const [defenderDatasheet, setDefenderDatasheet] = useState<Datasheet | null>(null)
  const [defenderCount, setDefenderCount] = useState(5)

  // --- Toggles ---
  const [halfRange, setHalfRange] = useState(false)
  const [charged, setCharged] = useState(false)
  const [stationary, setStationary] = useState(true)
  const [inCover, setInCover] = useState(false)

  // --- Search ---
  const [attackerSearch, setAttackerSearch] = useState('')
  const [defenderSearch, setDefenderSearch] = useState('')

  // Load initial faction
  useEffect(() => {
    if (factionId) loadFaction(factionId)
  }, [factionId, loadFaction])

  // Set initial datasheet from URL params
  useEffect(() => {
    if (factionId && datasheetId && loadedFactions[factionId]) {
      const ds = loadedFactions[factionId].datasheets.find((d) => d.id === datasheetId)
      if (ds) {
        setAttackerDatasheet(ds)
        const defaultCount = ds.pointOptions[0]?.models
        if (defaultCount) setAttackerCount(parseInt(String(defaultCount), 10) || 5)
        // Auto-select first weapon
        if (ds.weapons.length > 0) setSelectedWeapon(ds.weapons[0])
      }
    }
  }, [factionId, datasheetId, loadedFactions])

  // Load faction on slug change
  useEffect(() => {
    if (attackerFactionSlug) loadFaction(attackerFactionSlug)
  }, [attackerFactionSlug, loadFaction])

  useEffect(() => {
    if (defenderFactionSlug) loadFaction(defenderFactionSlug)
  }, [defenderFactionSlug, loadFaction])

  // Faction datasheets
  const attackerFaction = attackerFactionSlug ? loadedFactions[attackerFactionSlug] : null
  const defenderFaction = defenderFactionSlug ? loadedFactions[defenderFactionSlug] : null

  const attackerDatasheets = useMemo(() => {
    if (!attackerFaction) return []
    const q = attackerSearch.toLowerCase()
    return q ? attackerFaction.datasheets.filter((d) => d.name.toLowerCase().includes(q)) : attackerFaction.datasheets
  }, [attackerFaction, attackerSearch])

  const defenderDatasheets = useMemo(() => {
    if (!defenderFaction) return []
    const q = defenderSearch.toLowerCase()
    return q ? defenderFaction.datasheets.filter((d) => d.name.toLowerCase().includes(q)) : defenderFaction.datasheets
  }, [defenderFaction, defenderSearch])

  // Factions list
  const factions = factionIndex?.factions ?? []

  // --- Combat result ---
  const result: CombatResult | null = useMemo(() => {
    if (!selectedWeapon || !attackerDatasheet || !defenderDatasheet) return null
    const attackerProfile = attackerDatasheet.profiles[0]
    const defenderProfile = defenderDatasheet.profiles[0]
    if (!attackerProfile || !defenderProfile) return null

    return resolveCombat({
      weapon: selectedWeapon,
      weaponKeywords: parseWeaponKeywords(selectedWeapon.abilities),
      attackerProfile,
      attackerCount,
      attackerEffects: extractCombatEffects(attackerDatasheet),
      defenderProfile,
      defenderEffects: extractCombatEffects(defenderDatasheet),
      defenderCount,
      halfRange,
      charged,
      stationary,
      inCover,
    })
  }, [selectedWeapon, attackerDatasheet, defenderDatasheet, attackerCount, defenderCount, halfRange, charged, stationary, inCover])

  const weaponKeywords = selectedWeapon ? parseWeaponKeywords(selectedWeapon.abilities) : null
  const defenderEffects = defenderDatasheet ? extractCombatEffects(defenderDatasheet) : null

  // Active keyword labels for display
  const activeKeywords: string[] = []
  if (weaponKeywords) {
    if (weaponKeywords.sustainedHits) activeKeywords.push(`Sustained Hits ${weaponKeywords.sustainedHits}`)
    if (weaponKeywords.lethalHits) activeKeywords.push('Lethal Hits')
    if (weaponKeywords.devastatingWounds) activeKeywords.push('Devastating Wounds')
    if (weaponKeywords.anti) weaponKeywords.anti.forEach((a) => activeKeywords.push(`Anti-${a.keyword} ${a.threshold}+`))
    if (weaponKeywords.twinLinked) activeKeywords.push('Twin-linked')
    if (weaponKeywords.torrent) activeKeywords.push('Torrent')
    if (weaponKeywords.blast) activeKeywords.push('Blast')
    if (weaponKeywords.rapidFire) activeKeywords.push(`Rapid Fire ${weaponKeywords.rapidFire}`)
    if (weaponKeywords.melta) activeKeywords.push(`Melta ${weaponKeywords.melta}`)
    if (weaponKeywords.lance) activeKeywords.push('Lance')
    if (weaponKeywords.heavy) activeKeywords.push('Heavy')
    if (weaponKeywords.ignoresCover) activeKeywords.push('Ignores Cover')
    if (weaponKeywords.hazardous) activeKeywords.push('Hazardous')
    if (weaponKeywords.pistol) activeKeywords.push('Pistol')
    if (weaponKeywords.precision) activeKeywords.push('Precision')
  }

  return (
    <div className="p-4 pb-24">
      <button
        className="text-sm mb-3 bg-transparent border-none cursor-pointer"
        style={{ color: 'var(--color-accent)' }}
        onClick={() => navigate(-1)}
      >
        ← Retour
      </button>

      <h1 className="font-bold mb-4" style={{ fontSize: 'var(--text-xl)' }}>Simulateur de combat</h1>

      {/* ===== ATTACKER ===== */}
      <section className="mb-4">
        <h2 className="text-sm font-semibold mb-2" style={{ color: 'var(--color-text-muted)' }}>Attaquant</h2>

        {!attackerDatasheet ? (
          <div className="rounded-lg p-3" style={{ backgroundColor: 'var(--color-surface)' }}>
            {/* Faction picker */}
            <p className="text-xs mb-2" style={{ color: 'var(--color-text-muted)' }}>Faction</p>
            <div className="flex flex-wrap gap-1 mb-2">
              {factions.map((f) => (
                <button
                  key={f.id}
                  className="text-xs px-2 py-1 rounded border-none cursor-pointer"
                  style={{
                    backgroundColor: attackerFactionSlug === f.id ? 'var(--color-accent)' : 'var(--color-bg)',
                    color: attackerFactionSlug === f.id ? '#fff' : 'var(--color-text)',
                  }}
                  onClick={() => { setAttackerFactionSlug(f.id); setAttackerDatasheet(null); setSelectedWeapon(null) }}
                >
                  {f.name}
                </button>
              ))}
            </div>

            {attackerFactionSlug && (
              <>
                <input
                  type="text"
                  value={attackerSearch}
                  onChange={(e) => setAttackerSearch(e.target.value)}
                  placeholder="Rechercher une unité..."
                  className="w-full rounded px-2 py-1.5 text-sm mb-2 border-none outline-none"
                  style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}
                />
                <div className="max-h-48 overflow-y-auto">
                  {attackerDatasheets.slice(0, 30).map((ds) => (
                    <button
                      key={ds.id}
                      className="block w-full text-left text-sm px-2 py-1.5 border-none cursor-pointer rounded mb-1"
                      style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}
                      onClick={() => {
                        setAttackerDatasheet(ds)
                        setSelectedWeapon(ds.weapons[0] ?? null)
                        const m = ds.pointOptions[0]?.models
                        if (m) setAttackerCount(parseInt(String(m), 10) || 5)
                      }}
                    >
                      {ds.name}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="rounded-lg p-3" style={{ backgroundColor: 'var(--color-surface)' }}>
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-sm" style={{ color: 'var(--color-text)' }}>{attackerDatasheet.name}</span>
              <button
                className="text-xs bg-transparent border-none cursor-pointer"
                style={{ color: 'var(--color-accent)' }}
                onClick={() => { setAttackerDatasheet(null); setSelectedWeapon(null) }}
              >
                Changer
              </button>
            </div>

            {/* Attacker count */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Modèles :</span>
              <input
                type="number"
                min={1}
                max={30}
                value={attackerCount}
                onChange={(e) => setAttackerCount(Math.max(1, Number(e.target.value)))}
                className="w-16 rounded px-2 py-1 text-sm text-center border-none outline-none"
                style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}
              />
            </div>

            {/* Weapon selection */}
            <p className="text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>Arme</p>
            <div className="flex flex-col gap-1">
              {attackerDatasheet.weapons.map((w, i) => (
                <button
                  key={`${w.name}-${i}`}
                  className="flex items-center justify-between text-left text-xs px-2 py-1.5 rounded border-none cursor-pointer"
                  style={{
                    backgroundColor: selectedWeapon === w ? 'var(--color-accent)' : 'var(--color-bg)',
                    color: selectedWeapon === w ? '#fff' : 'var(--color-text)',
                  }}
                  onClick={() => setSelectedWeapon(w)}
                >
                  <span>{w.name}</span>
                  <span style={{ opacity: 0.7 }}>
                    A:{w.A} S:{w.S} AP:{w.AP} D:{w.D}
                  </span>
                </button>
              ))}
            </div>

            {/* Active keywords */}
            {activeKeywords.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {activeKeywords.map((kw) => <KeywordBadge key={kw} text={kw} />)}
              </div>
            )}
          </div>
        )}
      </section>

      {/* ===== DEFENDER ===== */}
      <section className="mb-4">
        <h2 className="text-sm font-semibold mb-2" style={{ color: 'var(--color-text-muted)' }}>Cible</h2>

        {!defenderDatasheet ? (
          <div className="rounded-lg p-3" style={{ backgroundColor: 'var(--color-surface)' }}>
            <p className="text-xs mb-2" style={{ color: 'var(--color-text-muted)' }}>Faction</p>
            <div className="flex flex-wrap gap-1 mb-2">
              {factions.map((f) => (
                <button
                  key={f.id}
                  className="text-xs px-2 py-1 rounded border-none cursor-pointer"
                  style={{
                    backgroundColor: defenderFactionSlug === f.id ? 'var(--color-accent)' : 'var(--color-bg)',
                    color: defenderFactionSlug === f.id ? '#fff' : 'var(--color-text)',
                  }}
                  onClick={() => { setDefenderFactionSlug(f.id); setDefenderDatasheet(null) }}
                >
                  {f.name}
                </button>
              ))}
            </div>

            {defenderFactionSlug && (
              <>
                <input
                  type="text"
                  value={defenderSearch}
                  onChange={(e) => setDefenderSearch(e.target.value)}
                  placeholder="Rechercher une unité..."
                  className="w-full rounded px-2 py-1.5 text-sm mb-2 border-none outline-none"
                  style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}
                />
                <div className="max-h-48 overflow-y-auto">
                  {defenderDatasheets.slice(0, 30).map((ds) => (
                    <button
                      key={ds.id}
                      className="block w-full text-left text-sm px-2 py-1.5 border-none cursor-pointer rounded mb-1"
                      style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}
                      onClick={() => {
                        setDefenderDatasheet(ds)
                        const m = ds.pointOptions[0]?.models
                        if (m) setDefenderCount(parseInt(String(m), 10) || 5)
                      }}
                    >
                      {ds.name}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="rounded-lg p-3" style={{ backgroundColor: 'var(--color-surface)' }}>
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-sm" style={{ color: 'var(--color-text)' }}>{defenderDatasheet.name}</span>
              <button
                className="text-xs bg-transparent border-none cursor-pointer"
                style={{ color: 'var(--color-accent)' }}
                onClick={() => setDefenderDatasheet(null)}
              >
                Changer
              </button>
            </div>

            {/* Defender count */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Modèles :</span>
              <input
                type="number"
                min={1}
                max={30}
                value={defenderCount}
                onChange={(e) => setDefenderCount(Math.max(1, Number(e.target.value)))}
                className="w-16 rounded px-2 py-1 text-sm text-center border-none outline-none"
                style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}
              />
            </div>

            {/* Defender profile */}
            {defenderDatasheet.profiles[0] && (
              <div className="flex flex-wrap gap-1.5">
                <StatBadge label="T" value={defenderDatasheet.profiles[0].T} />
                <StatBadge label="Sv" value={defenderDatasheet.profiles[0].Sv} />
                <StatBadge label="W" value={defenderDatasheet.profiles[0].W} />
                {defenderDatasheet.profiles[0].invSv !== '-' && (
                  <StatBadge label="Inv" value={`${defenderDatasheet.profiles[0].invSv}+`} />
                )}
              </div>
            )}

            {/* Defender active abilities */}
            {defenderEffects && (
              <div className="flex flex-wrap gap-1 mt-2">
                {defenderEffects.feelNoPain && <KeywordBadge text={`FnP ${defenderEffects.feelNoPain}+`} />}
                {defenderEffects.stealth && <KeywordBadge text="Stealth" />}
                {defenderEffects.damageReduction && <KeywordBadge text={`-${defenderEffects.damageReduction} Damage`} />}
                {defenderEffects.invulnerable && <KeywordBadge text={`Invuln ${defenderEffects.invulnerable.value}+`} />}
              </div>
            )}
          </div>
        )}
      </section>

      {/* ===== TOGGLES ===== */}
      {selectedWeapon && defenderDatasheet && (
        <section className="mb-4">
          <div className="flex flex-wrap gap-2">
            {(weaponKeywords?.rapidFire || weaponKeywords?.melta) && (
              <ToggleChip label="Demi-portée" active={halfRange} onToggle={() => setHalfRange(!halfRange)} />
            )}
            {weaponKeywords?.lance && (
              <ToggleChip label="A chargé" active={charged} onToggle={() => setCharged(!charged)} />
            )}
            {weaponKeywords?.heavy && (
              <ToggleChip label="Stationnaire" active={stationary} onToggle={() => setStationary(!stationary)} />
            )}
            <ToggleChip label="Couvert" active={inCover} onToggle={() => setInCover(!inCover)} />
          </div>
        </section>
      )}

      {/* ===== RESULTS ===== */}
      {result && (
        <section>
          <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-text-muted)' }}>Résultats</h2>

          <div className="rounded-lg p-3 mb-3" style={{ backgroundColor: 'var(--color-surface)' }}>
            <ResultBar
              label="Attaques"
              value={result.attacksTotal}
              max={result.attacksTotal}
              detail={`(${attackerCount}× A:${selectedWeapon!.A})`}
            />
            <ResultBar
              label="Hits"
              value={result.hitsExpected}
              max={result.attacksTotal}
              detail={result.steps.hitThreshold > 0 ? `sur ${result.steps.hitThreshold}+` : 'auto'}
            />
            <ResultBar
              label="Wounds"
              value={result.woundsExpected}
              max={result.hitsExpected}
              detail={`sur ${result.steps.woundThreshold}+`}
            />
            <ResultBar
              label="Saves ratés"
              value={result.unsavedWounds}
              max={result.woundsExpected}
              detail={`${result.steps.usedInvuln ? 'invuln' : 'save'} ${result.steps.saveThreshold}+`}
            />
            <ResultBar
              label="Dégâts"
              value={result.damageTotal}
              max={result.damageTotal}
              detail={`(D:${selectedWeapon!.D} avg ${result.steps.avgDamagePerWound})`}
            />
            {result.steps.fnpThreshold && (
              <ResultBar
                label="Après FnP"
                value={result.damageAfterFnp}
                max={result.damageTotal}
                detail={`FnP ${result.steps.fnpThreshold}+`}
              />
            )}
            {result.mortalWounds > 0 && (
              <div className="text-xs mt-1" style={{ color: 'var(--color-warning)' }}>
                dont {Math.round(result.mortalWounds * 100) / 100} mortal wounds
              </div>
            )}
          </div>

          {/* Kills */}
          <div className="rounded-lg p-4 text-center" style={{ backgroundColor: 'var(--color-surface)' }}>
            <p className="text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>Kills estimés</p>
            <p className="text-3xl font-bold" style={{ color: 'var(--color-accent)' }}>
              {Math.round(result.estimatedKills * 10) / 10}
            </p>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              sur {defenderCount} modèle{defenderCount > 1 ? 's' : ''} ({defenderDatasheet!.profiles[0]?.W}W)
            </p>
          </div>
        </section>
      )}

      {!selectedWeapon && attackerDatasheet && (
        <p className="text-sm text-center mt-4" style={{ color: 'var(--color-text-muted)' }}>
          Sélectionne une arme pour lancer la simulation
        </p>
      )}

      {selectedWeapon && !defenderDatasheet && (
        <p className="text-sm text-center mt-4" style={{ color: 'var(--color-text-muted)' }}>
          Sélectionne une cible pour voir les résultats
        </p>
      )}
    </div>
  )
}

function ToggleChip({ label, active, onToggle }: { label: string; active: boolean; onToggle: () => void }) {
  return (
    <button
      className="text-xs px-3 py-1.5 rounded-full border-none cursor-pointer"
      style={{
        backgroundColor: active ? 'var(--color-accent)' : 'var(--color-surface)',
        color: active ? '#fff' : 'var(--color-text-muted)',
      }}
      onClick={onToggle}
    >
      {label}
    </button>
  )
}

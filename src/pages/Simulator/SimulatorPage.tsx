import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router'
import { useGameDataStore } from '@/stores/gameDataStore'
import { useGameData } from '@/hooks/useGameData'
import { resolveCombat } from '@/utils/combatEngine'
import { parseWeaponKeywords } from '@/utils/weaponKeywordParser'
import { extractCombatEffects, extractEnhancementEffects } from '@/utils/combatEffectsExtractor'
import { parseStratagemEffect, isStratagemRelevant } from '@/utils/stratagemEffectParser'
import { SimulatorCard } from '@/components/domain/Simulator/SimulatorCard'
import type { Weapon, Datasheet, Detachment, Enhancement, Stratagem } from '@/types/gameData.types'
import type { CombatResult, AbilityEffect } from '@/types/combat.types'

function mergeEffects(a: AbilityEffect, b: AbilityEffect): AbilityEffect {
  return {
    feelNoPain: a.feelNoPain && b.feelNoPain ? Math.min(a.feelNoPain, b.feelNoPain) : a.feelNoPain ?? b.feelNoPain,
    stealth: a.stealth || b.stealth,
    ignoresCover: a.ignoresCover || b.ignoresCover,
    damageReduction: (a.damageReduction ?? 0) + (b.damageReduction ?? 0) || undefined,
    extraAttacks: (a.extraAttacks ?? 0) + (b.extraAttacks ?? 0) || undefined,
    invulnerable: a.invulnerable && b.invulnerable
      ? { value: Math.min(a.invulnerable.value, b.invulnerable.value) }
      : a.invulnerable ?? b.invulnerable,
    modifiers: [...(a.modifiers ?? []), ...(b.modifiers ?? [])].length > 0
      ? [...(a.modifiers ?? []), ...(b.modifiers ?? [])]
      : undefined,
  }
}

function round(n: number): string {
  return (Math.round(n * 10) / 10).toString()
}

function ResultBar({ label, value, max, detail }: { label: string; value: number; max: number; detail?: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0
  return (
    <div className="mb-2">
      <div className="flex justify-between text-xs mb-0.5 lg:text-sm">
        <span style={{ color: 'var(--color-text)' }}>{label}</span>
        <span style={{ color: 'var(--color-accent)' }}>
          {round(value)}
          {detail && <span style={{ color: 'var(--color-text-muted)' }}> {detail}</span>}
        </span>
      </div>
      <div className="rounded-full h-2 overflow-hidden lg:h-3" style={{ backgroundColor: 'var(--color-surface)' }}>
        <div className="h-full rounded-full transition-all duration-300" style={{ width: `${pct}%`, backgroundColor: 'var(--color-accent)' }} />
      </div>
    </div>
  )
}

function KeywordBadge({ text }: { text: string }) {
  return (
    <span className="text-[10px] px-1.5 py-0.5 rounded font-medium lg:text-xs lg:px-2 lg:py-1" style={{ backgroundColor: 'var(--color-primary)', color: '#fff' }}>
      {text}
    </span>
  )
}

interface SideState {
  factionSlug: string | null
  detachment: Detachment | null
  datasheet: Datasheet | null
  weapon: Weapon | null
  enhancement: Enhancement | null
  modelCount: number
}

const emptySide: SideState = { factionSlug: null, detachment: null, datasheet: null, weapon: null, enhancement: null, modelCount: 5 }

export function SimulatorPage() {
  const { factionId, datasheetId } = useParams<{ factionId?: string; datasheetId?: string }>()
  const navigate = useNavigate()
  const { factionIndex } = useGameData()
  const loadedFactions = useGameDataStore((s) => s.loadedFactions)
  const loadFaction = useGameDataStore((s) => s.loadFaction)

  const [attacker, setAttacker] = useState<SideState>({ ...emptySide, factionSlug: factionId ?? null })
  const [defender, setDefender] = useState<SideState>({ ...emptySide })

  // Toggles
  const [halfRange, setHalfRange] = useState(false)
  const [charged, setCharged] = useState(false)
  const [stationary, setStationary] = useState(true)
  const [inCover, setInCover] = useState(false)

  // Stratagems
  const [activeAttackerStrats, setActiveAttackerStrats] = useState<Set<string>>(new Set())
  const [activeDefenderStrats, setActiveDefenderStrats] = useState<Set<string>>(new Set())

  const factions = factionIndex?.factions ?? []

  // Load factions when selected
  useEffect(() => {
    if (attacker.factionSlug) loadFaction(attacker.factionSlug)
  }, [attacker.factionSlug, loadFaction])

  useEffect(() => {
    if (defender.factionSlug) loadFaction(defender.factionSlug)
  }, [defender.factionSlug, loadFaction])

  // Handle URL params (coming from a datasheet page)
  useEffect(() => {
    if (factionId && datasheetId && loadedFactions[factionId]) {
      const faction = loadedFactions[factionId]
      const ds = faction.datasheets.find((d) => d.id === datasheetId)
      if (ds) {
        const det = faction.detachments?.[0] ?? null
        setAttacker({
          factionSlug: factionId,
          detachment: det,
          datasheet: ds,
          weapon: ds.weapons[0] ?? null,
          enhancement: null,
          modelCount: parseInt(String(ds.pointOptions[0]?.models), 10) || 5,
        })
      }
    }
  }, [factionId, datasheetId, loadedFactions])

  // Derived data
  const attackerFaction = attacker.factionSlug ? loadedFactions[attacker.factionSlug] : null
  const defenderFaction = defender.factionSlug ? loadedFactions[defender.factionSlug] : null

  const attackerStratagems = attacker.detachment?.stratagems ?? []
  const defenderStratagems = defender.detachment?.stratagems ?? []

  // Combat effects with enhancements
  const attackerEffects = useMemo(() => {
    if (!attacker.datasheet) return {}
    let effects = extractCombatEffects(attacker.datasheet)
    if (attacker.enhancement) {
      effects = mergeEffects(effects, extractEnhancementEffects(attacker.enhancement))
    }
    for (const strat of attackerStratagems) {
      if (activeAttackerStrats.has(strat.id)) {
        const eff = parseStratagemEffect(strat)
        if (eff) effects = mergeEffects(effects, eff)
      }
    }
    return effects
  }, [attacker.datasheet, attacker.enhancement, attackerStratagems, activeAttackerStrats])

  const defenderEffects = useMemo(() => {
    if (!defender.datasheet) return {}
    let effects = extractCombatEffects(defender.datasheet)
    if (defender.enhancement) {
      effects = mergeEffects(effects, extractEnhancementEffects(defender.enhancement))
    }
    for (const strat of defenderStratagems) {
      if (activeDefenderStrats.has(strat.id)) {
        const eff = parseStratagemEffect(strat)
        if (eff) effects = mergeEffects(effects, eff)
      }
    }
    return effects
  }, [defender.datasheet, defender.enhancement, defenderStratagems, activeDefenderStrats])

  // Combat result
  const result: CombatResult | null = useMemo(() => {
    if (!attacker.weapon || !attacker.datasheet || !defender.datasheet) return null
    const attackerProfile = attacker.datasheet.profiles[0]
    const defenderProfile = defender.datasheet.profiles[0]
    if (!attackerProfile || !defenderProfile) return null
    return resolveCombat({
      weapon: attacker.weapon,
      weaponKeywords: parseWeaponKeywords(attacker.weapon.abilities),
      attackerProfile,
      attackerCount: attacker.modelCount,
      attackerEffects,
      defenderProfile,
      defenderEffects,
      defenderCount: defender.modelCount,
      halfRange, charged, stationary, inCover,
    })
  }, [attacker, defender, attackerEffects, defenderEffects, halfRange, charged, stationary, inCover])

  // Baseline (without strats) for delta
  const baselineResult: CombatResult | null = useMemo(() => {
    if (!attacker.weapon || !attacker.datasheet || !defender.datasheet) return null
    if (activeAttackerStrats.size === 0 && activeDefenderStrats.size === 0) return null
    const attackerProfile = attacker.datasheet.profiles[0]
    const defenderProfile = defender.datasheet.profiles[0]
    if (!attackerProfile || !defenderProfile) return null
    let atkEff = extractCombatEffects(attacker.datasheet)
    if (attacker.enhancement) atkEff = mergeEffects(atkEff, extractEnhancementEffects(attacker.enhancement))
    let defEff = extractCombatEffects(defender.datasheet)
    if (defender.enhancement) defEff = mergeEffects(defEff, extractEnhancementEffects(defender.enhancement))
    return resolveCombat({
      weapon: attacker.weapon,
      weaponKeywords: parseWeaponKeywords(attacker.weapon.abilities),
      attackerProfile,
      attackerCount: attacker.modelCount,
      attackerEffects: atkEff,
      defenderProfile,
      defenderEffects: defEff,
      defenderCount: defender.modelCount,
      halfRange, charged, stationary, inCover,
    })
  }, [attacker, defender, activeAttackerStrats.size, activeDefenderStrats.size, halfRange, charged, stationary, inCover])

  const damageDelta = result && baselineResult ? result.damageAfterFnp - baselineResult.damageAfterFnp : null

  const weaponKeywords = attacker.weapon ? parseWeaponKeywords(attacker.weapon.abilities) : null
  const weaponType: 'ranged' | 'melee' = attacker.weapon?.type === 'Melee' || attacker.weapon?.range === 'Melee' ? 'melee' : 'ranged'

  const filteredAttackerStrats = attackerStratagems.filter((s) => isStratagemRelevant(s, weaponType))
  const filteredDefenderStrats = defenderStratagems.filter((s) => isStratagemRelevant(s, weaponType))

  // Active keywords for display
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
    <div className="p-4 pb-24 lg:max-w-5xl lg:mx-auto lg:py-8">
      <button
        className="text-sm mb-3 bg-transparent border-none cursor-pointer lg:text-base"
        style={{ color: 'var(--color-accent)' }}
        onClick={() => navigate(-1)}
      >
        ← Retour
      </button>

      <h1 className="font-bold mb-4 lg:text-2xl lg:mb-6" style={{ fontSize: 'var(--text-xl)' }}>Simulateur de combat</h1>

      {/* ===== CARDS: ATTACKER vs DEFENDER ===== */}
      <div className="flex flex-col gap-3 mb-4 lg:flex-row lg:items-stretch lg:gap-6">
        <SimulatorCard
          role="attacker"
          factions={factions}
          loadedFactions={loadedFactions}
          factionSlug={attacker.factionSlug}
          factionName={attackerFaction?.name ?? null}
          detachment={attacker.detachment}
          datasheet={attacker.datasheet}
          selectedWeapon={attacker.weapon}
          enhancement={attacker.enhancement}
          modelCount={attacker.modelCount}
          onLoadFaction={loadFaction}
          onFactionSelect={(slug, det) => {
            loadFaction(slug)
            setAttacker({ ...emptySide, factionSlug: slug, detachment: det })
            setActiveAttackerStrats(new Set())
          }}
          onUnitSelect={(ds) => {
            setAttacker((prev) => ({
              ...prev,
              datasheet: ds,
              weapon: ds.weapons[0] ?? null,
              enhancement: null,
              modelCount: parseInt(String(ds.pointOptions[0]?.models), 10) || 5,
            }))
          }}
          onWeaponSelect={(w) => setAttacker((prev) => ({ ...prev, weapon: w }))}
          onEnhancementSelect={(e) => setAttacker((prev) => ({ ...prev, enhancement: e }))}
          onModelCountChange={(n) => setAttacker((prev) => ({ ...prev, modelCount: n }))}
          onReset={() => { setAttacker({ ...emptySide }); setActiveAttackerStrats(new Set()) }}
        />

        <div className="flex justify-center lg:items-center lg:shrink-0">
          <span className="text-lg font-bold lg:text-2xl" style={{ color: 'var(--color-text-muted)' }}>VS</span>
        </div>

        <SimulatorCard
          role="defender"
          factions={factions}
          loadedFactions={loadedFactions}
          factionSlug={defender.factionSlug}
          factionName={defenderFaction?.name ?? null}
          detachment={defender.detachment}
          datasheet={defender.datasheet}
          selectedWeapon={defender.weapon}
          enhancement={defender.enhancement}
          modelCount={defender.modelCount}
          onLoadFaction={loadFaction}
          onFactionSelect={(slug, det) => {
            loadFaction(slug)
            setDefender({ ...emptySide, factionSlug: slug, detachment: det })
            setActiveDefenderStrats(new Set())
          }}
          onUnitSelect={(ds) => {
            setDefender((prev) => ({
              ...prev,
              datasheet: ds,
              weapon: ds.weapons[0] ?? null,
              enhancement: null,
              modelCount: parseInt(String(ds.pointOptions[0]?.models), 10) || 5,
            }))
          }}
          onWeaponSelect={(w) => setDefender((prev) => ({ ...prev, weapon: w }))}
          onEnhancementSelect={(e) => setDefender((prev) => ({ ...prev, enhancement: e }))}
          onModelCountChange={(n) => setDefender((prev) => ({ ...prev, modelCount: n }))}
          onReset={() => { setDefender({ ...emptySide }); setActiveDefenderStrats(new Set()) }}
        />
      </div>

      {/* ===== WEAPON KEYWORDS ===== */}
      {activeKeywords.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {activeKeywords.map((kw) => <KeywordBadge key={kw} text={kw} />)}
        </div>
      )}

      {/* ===== TOGGLES ===== */}
      {attacker.weapon && defender.datasheet && (
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

      {/* ===== STRATAGEMS ===== */}
      {(filteredAttackerStrats.length > 0 || filteredDefenderStrats.length > 0) && attacker.weapon && defender.datasheet && (
        <section className="mb-4">
          <p className="text-xs font-medium mb-2 lg:text-sm" style={{ color: 'var(--color-text-muted)' }}>Stratagèmes</p>
          <div className="flex flex-col gap-1 lg:grid lg:grid-cols-2 lg:gap-2">
            {filteredAttackerStrats.map((strat) => {
              const isActive = activeAttackerStrats.has(strat.id)
              const parsed = parseStratagemEffect(strat)
              return (
                <StratagemToggle
                  key={strat.id}
                  strat={strat}
                  isActive={isActive}
                  parsed={!!parsed}
                  variant="attacker"
                  onToggle={() => {
                    const next = new Set(activeAttackerStrats)
                    isActive ? next.delete(strat.id) : next.add(strat.id)
                    setActiveAttackerStrats(next)
                  }}
                />
              )
            })}
            {filteredDefenderStrats.map((strat) => {
              const isActive = activeDefenderStrats.has(strat.id)
              const parsed = parseStratagemEffect(strat)
              return (
                <StratagemToggle
                  key={`def-${strat.id}`}
                  strat={strat}
                  isActive={isActive}
                  parsed={!!parsed}
                  variant="defender"
                  onToggle={() => {
                    const next = new Set(activeDefenderStrats)
                    isActive ? next.delete(strat.id) : next.add(strat.id)
                    setActiveDefenderStrats(next)
                  }}
                />
              )
            })}
          </div>
          {damageDelta !== null && damageDelta !== 0 && (
            <p className="text-xs mt-1 font-medium" style={{ color: damageDelta > 0 ? 'var(--color-success, #22c55e)' : 'var(--color-error, #ef4444)' }}>
              {damageDelta > 0 ? '+' : ''}{round(damageDelta)} dégâts avec stratagèmes
            </p>
          )}
        </section>
      )}

      {/* ===== RESULTS ===== */}
      {result && (
        <section>
          <h2 className="text-sm font-semibold mb-3 lg:text-base" style={{ color: 'var(--color-text-muted)' }}>Résultats</h2>

          <div className="lg:flex lg:gap-6 lg:items-start">
          <div className="rounded-lg p-3 mb-3 lg:flex-1 lg:p-5" style={{ backgroundColor: 'var(--color-surface)' }}>
            <ResultBar
              label="Attaques"
              value={result.attacksTotal}
              max={result.attacksTotal}
              detail={`(${attacker.modelCount}× A:${attacker.weapon!.A})`}
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
              detail={`(D:${attacker.weapon!.D} avg ${result.steps.avgDamagePerWound})`}
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
              <div className="text-xs mt-1" style={{ color: 'var(--color-warning, #f59e0b)' }}>
                dont {round(result.mortalWounds)} mortal wounds
              </div>
            )}
          </div>

          {/* Kills */}
          <div className="rounded-lg p-4 text-center lg:w-48 lg:shrink-0 lg:p-6" style={{ backgroundColor: 'var(--color-surface)' }}>
            <p className="text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>Kills estimés</p>
            <p className="text-3xl font-bold lg:text-4xl" style={{ color: 'var(--color-accent)' }}>
              {round(result.estimatedKills)}
            </p>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              sur {defender.modelCount} modèle{defender.modelCount > 1 ? 's' : ''} ({defender.datasheet!.profiles[0]?.W}W)
            </p>
          </div>
          </div>
        </section>
      )}

      {/* ===== Hints ===== */}
      {attacker.datasheet && !attacker.weapon && (
        <p className="text-sm text-center mt-4" style={{ color: 'var(--color-text-muted)' }}>
          Sélectionne une arme pour lancer la simulation
        </p>
      )}
      {attacker.weapon && !defender.datasheet && (
        <p className="text-sm text-center mt-4" style={{ color: 'var(--color-text-muted)' }}>
          Sélectionne une cible pour voir les résultats
        </p>
      )}
      {!attacker.factionSlug && !defender.factionSlug && (
        <p className="text-sm text-center mt-8" style={{ color: 'var(--color-text-muted)' }}>
          Choisis un attaquant et une cible pour simuler un combat
        </p>
      )}
    </div>
  )
}

function ToggleChip({ label, active, onToggle }: { label: string; active: boolean; onToggle: () => void }) {
  return (
    <button
      className="text-xs px-3 py-1.5 rounded-full border-none cursor-pointer lg:text-sm lg:px-4 lg:py-2"
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

function StratagemToggle({ strat, isActive, parsed, variant, onToggle }: {
  strat: Stratagem
  isActive: boolean
  parsed: boolean
  variant: 'attacker' | 'defender'
  onToggle: () => void
}) {
  const activeColor = variant === 'attacker' ? 'var(--color-accent)' : 'var(--color-error, #ef4444)'
  return (
    <button
      className="flex items-center justify-between text-xs px-2 py-1.5 rounded border-none cursor-pointer lg:text-sm lg:px-3 lg:py-2"
      style={{
        backgroundColor: isActive ? activeColor : 'var(--color-surface)',
        color: isActive ? '#fff' : variant === 'defender' ? 'var(--color-text-muted)' : 'var(--color-text)',
        opacity: parsed ? 1 : 0.6,
      }}
      onClick={onToggle}
    >
      <span>{variant === 'defender' ? 'Def: ' : ''}{strat.name} {!parsed && '(lecture seule)'}</span>
      <span style={{ opacity: 0.7 }}>{strat.cpCost} CP</span>
    </button>
  )
}

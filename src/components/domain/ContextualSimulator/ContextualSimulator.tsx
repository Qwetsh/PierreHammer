import { useMemo, useState } from 'react'
import type { Datasheet, Weapon, Stratagem } from '@/types/gameData.types'
import type { ListUnit } from '@/types/armyList.types'
import type { CasualtyState } from '@/stores/gameSessionStore'
import type { CombatResult, AbilityEffect } from '@/types/combat.types'
import { resolveCombat } from '@/utils/combatEngine'
import { parseWeaponKeywords } from '@/utils/weaponKeywordParser'
import { extractCombatEffects, extractEnhancementEffects } from '@/utils/combatEffectsExtractor'
import { findBestWeapon } from '@/utils/findBestWeapon'
import { parseStratagemEffect, isStratagemRelevant } from '@/utils/stratagemEffectParser'
import { resolveActiveProfile, getCombinedWeapons } from '@/utils/profileResolver'
import { Button } from '@/components/ui/Button'
import { T } from '@/components/ui/TranslatableText'

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

interface ContextualSimulatorProps {
  attackerUnit: ListUnit
  attackerDatasheet: Datasheet
  attackerCasualty: CasualtyState | null
  defenderUnit: ListUnit
  defenderDatasheet: Datasheet
  defenderCasualty: CasualtyState | null
  attackerEnhancement?: { name: string; description: string; id: string; cost: number; legend?: string }
  defenderEnhancement?: { name: string; description: string; id: string; cost: number; legend?: string }
  attackerStratagems?: Stratagem[]
  defenderStratagems?: Stratagem[]
  leaderDatasheet?: Datasheet
  onChangeTarget: () => void
  onClose: () => void
}

function getModelCount(unit: ListUnit, ds: Datasheet): number {
  if (ds.pointOptions.length === 0) return 1
  const opt = ds.pointOptions[unit.selectedPointOptionIndex] ?? ds.pointOptions[0]
  return parseInt(String(opt.models), 10) || 1
}

export function ContextualSimulator({
  attackerUnit,
  attackerDatasheet,
  attackerCasualty,
  defenderUnit,
  defenderDatasheet,
  defenderCasualty,
  attackerEnhancement,
  defenderEnhancement,
  attackerStratagems = [],
  defenderStratagems = [],
  leaderDatasheet,
  onChangeTarget,
  onClose,
}: ContextualSimulatorProps) {
  // Resolve damaged profiles
  const attackerResolved = resolveActiveProfile(attackerDatasheet, attackerCasualty?.woundsRemaining ?? null)
  const defenderResolved = resolveActiveProfile(defenderDatasheet, defenderCasualty?.woundsRemaining ?? null)
  const attackerProfile = attackerResolved.profile
  const defenderProfile = defenderResolved.profile

  const totalAttackers = getModelCount(attackerUnit, attackerDatasheet)
  const totalDefenders = getModelCount(defenderUnit, defenderDatasheet)
  const attackerCount = totalAttackers - (attackerCasualty?.modelsDestroyed ?? 0)
  const defenderCount = totalDefenders - (defenderCasualty?.modelsDestroyed ?? 0)

  // Combined weapons (include leader if attached)
  const combinedWeapons = useMemo(() => getCombinedWeapons(attackerDatasheet, leaderDatasheet), [attackerDatasheet, leaderDatasheet])

  // Active stratagems
  const [activeAttackerStrats, setActiveAttackerStrats] = useState<Set<string>>(new Set())
  const [activeDefenderStrats, setActiveDefenderStrats] = useState<Set<string>>(new Set())

  const weaponType = (weapon: Weapon | null): 'ranged' | 'melee' =>
    weapon?.type === 'Melee' || weapon?.range === 'Melee' ? 'melee' : 'ranged'

  const attackerEffects = useMemo(() => {
    let effects = extractCombatEffects(attackerDatasheet)
    if (attackerEnhancement) {
      effects = mergeEffects(effects, extractEnhancementEffects(attackerEnhancement as never))
    }
    // Apply damaged profile effects
    if (attackerResolved.damagedEffects) {
      effects = mergeEffects(effects, attackerResolved.damagedEffects)
    }
    // Apply active attacker stratagems
    for (const strat of attackerStratagems) {
      if (activeAttackerStrats.has(strat.id)) {
        const eff = parseStratagemEffect(strat)
        if (eff) effects = mergeEffects(effects, eff)
      }
    }
    return effects
  }, [attackerDatasheet, attackerEnhancement, attackerResolved.damagedEffects, attackerStratagems, activeAttackerStrats])

  const defenderEffects = useMemo(() => {
    let effects = extractCombatEffects(defenderDatasheet)
    if (defenderEnhancement) {
      effects = mergeEffects(effects, extractEnhancementEffects(defenderEnhancement as never))
    }
    // Apply damaged profile effects
    if (defenderResolved.damagedEffects) {
      effects = mergeEffects(effects, defenderResolved.damagedEffects)
    }
    // Apply active defender stratagems
    for (const strat of defenderStratagems) {
      if (activeDefenderStrats.has(strat.id)) {
        const eff = parseStratagemEffect(strat)
        if (eff) effects = mergeEffects(effects, eff)
      }
    }
    return effects
  }, [defenderDatasheet, defenderEnhancement, defenderResolved.damagedEffects, defenderStratagems, activeDefenderStrats])

  // All weapons (attacker + leader)
  const allWeapons = useMemo(() => combinedWeapons.map((cw) => cw.weapon), [combinedWeapons])

  // Auto-select best weapon
  const bestWeapon = useMemo(() => {
    if (!attackerProfile || !defenderProfile) return allWeapons[0] ?? null
    return findBestWeapon(
      allWeapons,
      attackerProfile,
      attackerCount,
      attackerEffects,
      defenderProfile,
      defenderCount,
      defenderEffects,
    )
  }, [allWeapons, attackerProfile, defenderProfile, attackerCount, defenderCount, attackerEffects, defenderEffects])

  const [selectedWeapon, setSelectedWeapon] = useState<Weapon | null>(bestWeapon)

  // Use best weapon as default if no selection yet
  const weapon = selectedWeapon ?? bestWeapon
  const isBestWeapon = weapon === bestWeapon

  const result: CombatResult | null = useMemo(() => {
    if (!weapon || !attackerProfile || !defenderProfile) return null
    return resolveCombat({
      weapon,
      weaponKeywords: parseWeaponKeywords(weapon.abilities),
      attackerProfile,
      attackerCount: Math.max(attackerCount, 0),
      attackerEffects,
      defenderProfile,
      defenderCount: Math.max(defenderCount, 0),
      defenderEffects,
    })
  }, [weapon, attackerProfile, defenderProfile, attackerCount, defenderCount, attackerEffects, defenderEffects])

  // Baseline result (without stratagems) for delta display
  const baselineResult: CombatResult | null = useMemo(() => {
    if (!weapon || !attackerProfile || !defenderProfile) return null
    if (activeAttackerStrats.size === 0 && activeDefenderStrats.size === 0) return null
    let atkEff = extractCombatEffects(attackerDatasheet)
    if (attackerEnhancement) atkEff = mergeEffects(atkEff, extractEnhancementEffects(attackerEnhancement as never))
    if (attackerResolved.damagedEffects) atkEff = mergeEffects(atkEff, attackerResolved.damagedEffects)
    let defEff = extractCombatEffects(defenderDatasheet)
    if (defenderEnhancement) defEff = mergeEffects(defEff, extractEnhancementEffects(defenderEnhancement as never))
    if (defenderResolved.damagedEffects) defEff = mergeEffects(defEff, defenderResolved.damagedEffects)
    return resolveCombat({
      weapon,
      weaponKeywords: parseWeaponKeywords(weapon.abilities),
      attackerProfile,
      attackerCount: Math.max(attackerCount, 0),
      attackerEffects: atkEff,
      defenderProfile,
      defenderCount: Math.max(defenderCount, 0),
      defenderEffects: defEff,
    })
  }, [weapon, attackerProfile, defenderProfile, attackerCount, defenderCount, attackerDatasheet, defenderDatasheet, attackerEnhancement, defenderEnhancement, activeAttackerStrats.size, activeDefenderStrats.size])

  const damageDelta = result && baselineResult ? result.damageAfterFnp - baselineResult.damageAfterFnp : null

  // Filter stratagems by weapon type
  const filteredAttackerStrats = attackerStratagems.filter((s) => isStratagemRelevant(s, weaponType(weapon)))
  const filteredDefenderStrats = defenderStratagems.filter((s) => isStratagemRelevant(s, weaponType(weapon)))

  if (!attackerProfile || !defenderProfile) return null

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-t-xl p-4 max-h-[85vh] overflow-y-auto"
        style={{ backgroundColor: 'var(--color-bg)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-sm" style={{ color: 'var(--color-text)' }}>
            <T text={attackerUnit.datasheetName} category="unit" /> → <T text={defenderUnit.datasheetName} category="unit" />
          </h3>
          <button
            className="text-xs bg-transparent border-none cursor-pointer"
            style={{ color: 'var(--color-text-muted)' }}
            onClick={onClose}
          >
            Fermer
          </button>
        </div>

        {/* Context info */}
        <div className="flex items-center gap-3 mb-3 text-xs" style={{ color: 'var(--color-text-muted)' }}>
          <span>
            {attackerCount}/{totalAttackers} modèles
            {attackerResolved.damagedEffects && (
              <span className="ml-1 px-1 py-0.5 rounded text-[10px]" style={{ backgroundColor: 'var(--color-warning, #f59e0b)', color: '#fff' }}>
                Endommagé
              </span>
            )}
          </span>
          <span>vs</span>
          <span>
            {defenderCount}/{totalDefenders} modèles (T:{defenderProfile.T} Sv:{defenderProfile.Sv} W:{defenderProfile.W})
            {defenderResolved.damagedEffects && (
              <span className="ml-1 px-1 py-0.5 rounded text-[10px]" style={{ backgroundColor: 'var(--color-warning, #f59e0b)', color: '#fff' }}>
                Endommagé
              </span>
            )}
          </span>
        </div>

        {/* Enhancements */}
        {(attackerEnhancement || defenderEnhancement) && (
          <div className="flex flex-wrap gap-1 mb-3">
            {attackerEnhancement && (
              <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--color-primary)', color: '#fff' }}>
                <T text={attackerEnhancement.name} category="enhancement" />
              </span>
            )}
            {defenderEnhancement && (
              <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}>
                Def: <T text={defenderEnhancement.name} category="enhancement" />
              </span>
            )}
          </div>
        )}

        {/* Weapon selector */}
        <div className="mb-3">
          <p className="text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>
            Arme {isBestWeapon && weapon ? '(meilleure)' : ''}
          </p>
          <div className="flex flex-col gap-1">
            {combinedWeapons.map((cw, i) => (
              <button
                key={`${cw.weapon.name}-${i}`}
                className="flex items-center justify-between text-xs px-2 py-1.5 rounded border-none cursor-pointer"
                style={{
                  backgroundColor: weapon === cw.weapon ? 'var(--color-accent)' : 'var(--color-surface)',
                  color: weapon === cw.weapon ? '#fff' : 'var(--color-text)',
                }}
                onClick={() => setSelectedWeapon(cw.weapon)}
              >
                <span>
                  {cw.fromLeader && <span style={{ opacity: 0.7 }}>[Leader] </span>}
                  <T text={cw.weapon.name} category="weapon" />
                  {cw.weapon === bestWeapon && <span style={{ opacity: 0.7 }}> *</span>}
                </span>
                <span style={{ opacity: 0.7 }}>A:{cw.weapon.A} S:{cw.weapon.S} AP:{cw.weapon.AP} D:{cw.weapon.D}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Stratagems */}
        {(filteredAttackerStrats.length > 0 || filteredDefenderStrats.length > 0) && (
          <div className="mb-3">
            <p className="text-xs font-medium mb-1" style={{ color: 'var(--color-text-muted)' }}>Stratagèmes</p>
            <div className="flex flex-col gap-1">
              {filteredAttackerStrats.map((strat) => {
                const isActive = activeAttackerStrats.has(strat.id)
                const parsed = parseStratagemEffect(strat)
                return (
                  <button
                    key={strat.id}
                    className="flex items-center justify-between text-xs px-2 py-1.5 rounded border-none cursor-pointer"
                    style={{
                      backgroundColor: isActive ? 'var(--color-accent)' : 'var(--color-surface)',
                      color: isActive ? '#fff' : 'var(--color-text)',
                      opacity: parsed ? 1 : 0.6,
                    }}
                    onClick={() => {
                      const next = new Set(activeAttackerStrats)
                      isActive ? next.delete(strat.id) : next.add(strat.id)
                      setActiveAttackerStrats(next)
                    }}
                  >
                    <span><T text={strat.name} category="stratagem" /> {!parsed && '(lecture seule)'}</span>
                    <span style={{ opacity: 0.7 }}>{strat.cpCost} CP</span>
                  </button>
                )
              })}
              {filteredDefenderStrats.map((strat) => {
                const isActive = activeDefenderStrats.has(strat.id)
                const parsed = parseStratagemEffect(strat)
                return (
                  <button
                    key={`def-${strat.id}`}
                    className="flex items-center justify-between text-xs px-2 py-1.5 rounded border-none cursor-pointer"
                    style={{
                      backgroundColor: isActive ? 'var(--color-error, #ef4444)' : 'var(--color-surface)',
                      color: isActive ? '#fff' : 'var(--color-text-muted)',
                      opacity: parsed ? 1 : 0.6,
                    }}
                    onClick={() => {
                      const next = new Set(activeDefenderStrats)
                      isActive ? next.delete(strat.id) : next.add(strat.id)
                      setActiveDefenderStrats(next)
                    }}
                  >
                    <span>Def: <T text={strat.name} category="stratagem" /> {!parsed && '(lecture seule)'}</span>
                    <span style={{ opacity: 0.7 }}>{strat.cpCost} CP</span>
                  </button>
                )
              })}
            </div>
            {damageDelta !== null && damageDelta !== 0 && (
              <p className="text-xs mt-1 font-medium" style={{ color: damageDelta > 0 ? 'var(--color-success, #22c55e)' : 'var(--color-error, #ef4444)' }}>
                {damageDelta > 0 ? '+' : ''}{round(damageDelta)} dégâts avec stratagèmes
              </p>
            )}
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="rounded-lg p-3" style={{ backgroundColor: 'var(--color-surface)' }}>
            <ResultRow label="Attaques" value={result.attacksTotal} max={result.attacksTotal} />
            <ResultRow
              label="Hits"
              value={result.hitsExpected}
              max={result.attacksTotal}
              detail={result.steps.hitThreshold > 0 ? `sur ${result.steps.hitThreshold}+` : 'auto'}
            />
            <ResultRow
              label="Wounds"
              value={result.woundsExpected}
              max={result.hitsExpected}
              detail={`sur ${result.steps.woundThreshold}+`}
            />
            <ResultRow
              label="Saves ratés"
              value={result.unsavedWounds}
              max={result.woundsExpected}
              detail={`${result.steps.usedInvuln ? 'invuln' : 'save'} ${result.steps.saveThreshold}+`}
            />
            <ResultRow
              label="Dégâts"
              value={result.damageAfterFnp}
              max={result.damageTotal}
              detail={result.steps.fnpThreshold ? `FnP ${result.steps.fnpThreshold}+` : undefined}
            />
            {result.mortalWounds > 0 && (
              <p className="text-xs mt-1" style={{ color: 'var(--color-warning, #f59e0b)' }}>
                dont {round(result.mortalWounds)} mortal wounds
              </p>
            )}
            <div className="mt-3 text-center">
              <p className="text-2xl font-bold" style={{ color: 'var(--color-accent)' }}>
                {round(result.estimatedKills)} kills
              </p>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                sur {defenderCount} modèle{defenderCount > 1 ? 's' : ''} ({defenderProfile.W}W)
              </p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 mt-3">
          <Button variant="secondary" size="sm" onClick={onChangeTarget}>
            Changer de cible
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Fermer
          </Button>
        </div>
      </div>
    </div>
  )
}

function round(n: number): string {
  return (Math.round(n * 10) / 10).toString()
}

function ResultRow({ label, value, max, detail }: { label: string; value: number; max: number; detail?: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0
  return (
    <div className="mb-2">
      <div className="flex justify-between text-xs mb-0.5">
        <span style={{ color: 'var(--color-text)' }}>{label}</span>
        <span style={{ color: 'var(--color-accent)' }}>
          {round(value)}
          {detail && <span style={{ color: 'var(--color-text-muted)' }}> {detail}</span>}
        </span>
      </div>
      <div className="rounded-full h-1.5 overflow-hidden" style={{ backgroundColor: 'var(--color-bg)' }}>
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: 'var(--color-accent)' }} />
      </div>
    </div>
  )
}

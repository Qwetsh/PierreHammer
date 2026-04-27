import { useMemo } from 'react'
import type { Weapon, Datasheet, Enhancement, Stratagem } from '@/types/gameData.types'
import type { CombatResult, AbilityEffect, WeaponKeywords } from '@/types/combat.types'
import type { CombatExplanations, NamedEffect } from '@/utils/combatExplainer'
import { resolveCombat } from '@/utils/combatEngine'
import { parseWeaponKeywords } from '@/utils/weaponKeywordParser'
import { extractCombatEffects, extractEnhancementEffects } from '@/utils/combatEffectsExtractor'
import { parseStratagemEffect, isStratagemRelevant } from '@/utils/stratagemEffectParser'
import { buildExplanations } from '@/utils/combatExplainer'

// ============================================================
// mergeEffects — shared logic
// ============================================================

export function mergeEffects(a: AbilityEffect, b: AbilityEffect): AbilityEffect {
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
    rerollOnesHit: a.rerollOnesHit || b.rerollOnesHit,
    rerollOnesWound: a.rerollOnesWound || b.rerollOnesWound,
  }
}

// ============================================================
// Hook input
// ============================================================

export interface UseSimulationInput {
  weapon: Weapon | null
  attackerDatasheet: Datasheet | null
  attackerCount: number
  attackerEnhancement?: Enhancement | { name: string; description: string; id: string; cost: number; legend?: string } | null
  defenderDatasheet: Datasheet | null
  defenderCount: number
  defenderEnhancement?: Enhancement | { name: string; description: string; id: string; cost: number; legend?: string } | null
  attackerStratagems?: Stratagem[]
  defenderStratagems?: Stratagem[]
  activeAttackerStrats?: Set<string>
  activeDefenderStrats?: Set<string>
  halfRange?: boolean
  charged?: boolean
  stationary?: boolean
  inCover?: boolean
  /** Common ability toggles */
  rerollOnesHit?: boolean
  rerollOnesWound?: boolean
  plusOneToHit?: boolean
  plusOneToWound?: boolean
  /** Extra effects to merge into attacker (e.g. damaged profile effects) */
  attackerExtraEffects?: AbilityEffect | null
  /** Extra effects to merge into defender (e.g. damaged profile effects) */
  defenderExtraEffects?: AbilityEffect | null
}

// ============================================================
// Hook output
// ============================================================

export interface TargetedKeyword {
  keyword: string
  reason: string
}

export interface UseSimulationResult {
  result: CombatResult | null
  baselineResult: CombatResult | null
  damageDelta: number | null
  attackerEffects: AbilityEffect
  defenderEffects: AbilityEffect
  weaponKeywords: WeaponKeywords | null
  activeKeywords: string[]
  weaponType: 'ranged' | 'melee'
  defenderKws: string[]
  targetedDefenderKeywords: TargetedKeyword[]
  explanations: CombatExplanations | null
  filteredAttackerStrats: Stratagem[]
  filteredDefenderStrats: Stratagem[]
}

// ============================================================
// Hook
// ============================================================

export function useSimulation(input: UseSimulationInput): UseSimulationResult {
  const {
    weapon,
    attackerDatasheet,
    attackerCount,
    attackerEnhancement,
    defenderDatasheet,
    defenderCount,
    defenderEnhancement,
    attackerStratagems = [],
    defenderStratagems = [],
    activeAttackerStrats = new Set<string>(),
    activeDefenderStrats = new Set<string>(),
    halfRange = false,
    charged = false,
    stationary = true,
    inCover = false,
    rerollOnesHit = false,
    rerollOnesWound = false,
    plusOneToHit = false,
    plusOneToWound = false,
    attackerExtraEffects = null,
    defenderExtraEffects = null,
  } = input

  // --- Effects ---
  const attackerEffects = useMemo(() => {
    if (!attackerDatasheet) return {}
    let effects = extractCombatEffects(attackerDatasheet)
    if (attackerEnhancement) effects = mergeEffects(effects, extractEnhancementEffects(attackerEnhancement as never))
    if (attackerExtraEffects) effects = mergeEffects(effects, attackerExtraEffects)
    // Common ability toggles
    if (rerollOnesHit) effects = mergeEffects(effects, { rerollOnesHit: true })
    if (rerollOnesWound) effects = mergeEffects(effects, { rerollOnesWound: true })
    if (plusOneToHit) effects = mergeEffects(effects, { modifiers: [{ phase: 'hit', value: 1 }] })
    if (plusOneToWound) effects = mergeEffects(effects, { modifiers: [{ phase: 'wound', value: 1 }] })
    for (const strat of attackerStratagems) {
      if (activeAttackerStrats.has(strat.id)) {
        const eff = parseStratagemEffect(strat)
        if (eff) effects = mergeEffects(effects, eff)
      }
    }
    return effects
  }, [attackerDatasheet, attackerEnhancement, attackerExtraEffects, attackerStratagems, activeAttackerStrats, rerollOnesHit, rerollOnesWound, plusOneToHit, plusOneToWound])

  const defenderEffects = useMemo(() => {
    if (!defenderDatasheet) return {}
    let effects = extractCombatEffects(defenderDatasheet)
    if (defenderEnhancement) effects = mergeEffects(effects, extractEnhancementEffects(defenderEnhancement as never))
    if (defenderExtraEffects) effects = mergeEffects(effects, defenderExtraEffects)
    for (const strat of defenderStratagems) {
      if (activeDefenderStrats.has(strat.id)) {
        const eff = parseStratagemEffect(strat)
        if (eff) effects = mergeEffects(effects, eff)
      }
    }
    return effects
  }, [defenderDatasheet, defenderEnhancement, defenderExtraEffects, defenderStratagems, activeDefenderStrats])

  // --- Defender keywords ---
  const defenderKws = useMemo(() => {
    if (!defenderDatasheet) return []
    return defenderDatasheet.keywords.filter((k) => !k.isFactionKeyword).map((k) => k.keyword)
  }, [defenderDatasheet])

  // --- Weapon keywords ---
  const weaponKeywords = useMemo(() => weapon ? parseWeaponKeywords(weapon.abilities) : null, [weapon])

  const weaponType: 'ranged' | 'melee' = weapon?.type === 'Melee' || weapon?.range === 'Melee' ? 'melee' : 'ranged'

  // --- Combat result ---
  const result: CombatResult | null = useMemo(() => {
    if (!weapon || !attackerDatasheet || !defenderDatasheet) return null
    const attackerProfile = attackerDatasheet.profiles[0]
    const defenderProfile = defenderDatasheet.profiles[0]
    if (!attackerProfile || !defenderProfile || !weaponKeywords) return null
    return resolveCombat({
      weapon,
      weaponKeywords,
      attackerProfile,
      attackerCount,
      attackerEffects,
      defenderProfile,
      defenderEffects,
      defenderCount,
      defenderKeywords: defenderKws,
      halfRange, charged, stationary, inCover,
    })
  }, [weapon, weaponKeywords, attackerDatasheet, defenderDatasheet, attackerCount, defenderCount, attackerEffects, defenderEffects, defenderKws, halfRange, charged, stationary, inCover])

  // --- Baseline (without strats) ---
  const baselineResult: CombatResult | null = useMemo(() => {
    if (!weapon || !attackerDatasheet || !defenderDatasheet) return null
    if (activeAttackerStrats.size === 0 && activeDefenderStrats.size === 0) return null
    const attackerProfile = attackerDatasheet.profiles[0]
    const defenderProfile = defenderDatasheet.profiles[0]
    if (!attackerProfile || !defenderProfile || !weaponKeywords) return null
    let atkEff = extractCombatEffects(attackerDatasheet)
    if (attackerEnhancement) atkEff = mergeEffects(atkEff, extractEnhancementEffects(attackerEnhancement as never))
    if (attackerExtraEffects) atkEff = mergeEffects(atkEff, attackerExtraEffects)
    let defEff = extractCombatEffects(defenderDatasheet)
    if (defenderEnhancement) defEff = mergeEffects(defEff, extractEnhancementEffects(defenderEnhancement as never))
    if (defenderExtraEffects) defEff = mergeEffects(defEff, defenderExtraEffects)
    return resolveCombat({
      weapon,
      weaponKeywords,
      attackerProfile,
      attackerCount,
      attackerEffects: atkEff,
      defenderProfile,
      defenderCount,
      defenderEffects: defEff,
      defenderKeywords: defenderKws,
      halfRange, charged, stationary, inCover,
    })
  }, [weapon, weaponKeywords, attackerDatasheet, defenderDatasheet, attackerCount, defenderCount, attackerEnhancement, defenderEnhancement, attackerExtraEffects, defenderExtraEffects, activeAttackerStrats.size, activeDefenderStrats.size, defenderKws, halfRange, charged, stationary, inCover])

  const damageDelta = result && baselineResult ? result.damageAfterFnp - baselineResult.damageAfterFnp : null

  // --- Explanations ---
  const explanations = useMemo(() => {
    if (!result || !weapon || !attackerDatasheet || !defenderDatasheet) return null
    const attackerProfile = attackerDatasheet.profiles[0]
    const defenderProfile = defenderDatasheet.profiles[0]
    if (!attackerProfile || !defenderProfile || !weaponKeywords) return null

    const atkSources: NamedEffect[] = [{ source: 'Capacites', effects: extractCombatEffects(attackerDatasheet) }]
    if (attackerEnhancement) atkSources.push({ source: (attackerEnhancement as { name: string }).name, effects: extractEnhancementEffects(attackerEnhancement as never) })
    for (const strat of attackerStratagems) {
      if (activeAttackerStrats.has(strat.id)) {
        const eff = parseStratagemEffect(strat)
        if (eff) atkSources.push({ source: strat.name, effects: eff })
      }
    }

    const defSources: NamedEffect[] = [{ source: 'Capacites', effects: extractCombatEffects(defenderDatasheet) }]
    if (defenderEnhancement) defSources.push({ source: (defenderEnhancement as { name: string }).name, effects: extractEnhancementEffects(defenderEnhancement as never) })
    for (const strat of defenderStratagems) {
      if (activeDefenderStrats.has(strat.id)) {
        const eff = parseStratagemEffect(strat)
        if (eff) defSources.push({ source: strat.name, effects: eff })
      }
    }

    return buildExplanations({
      weapon, weaponKeywords, attackerCount, defenderCount,
      attackerProfile, defenderProfile,
      attackerEffects, defenderEffects, result,
      halfRange, charged, stationary, inCover,
      attackerSources: atkSources, defenderSources: defSources,
    })
  }, [result, weapon, weaponKeywords, attackerDatasheet, defenderDatasheet, attackerCount, defenderCount, attackerEnhancement, defenderEnhancement, attackerEffects, defenderEffects, halfRange, charged, stationary, inCover, attackerStratagems, activeAttackerStrats, defenderStratagems, activeDefenderStrats])

  // --- Active weapon keywords for display ---
  const activeKeywords: string[] = useMemo(() => {
    if (!weaponKeywords) return []
    const kws: string[] = []
    if (weaponKeywords.sustainedHits) kws.push(`Sustained Hits ${weaponKeywords.sustainedHits}`)
    if (weaponKeywords.lethalHits) kws.push('Lethal Hits')
    if (weaponKeywords.devastatingWounds) kws.push('Devastating Wounds')
    if (weaponKeywords.anti) weaponKeywords.anti.forEach((a) => kws.push(`Anti-${a.keyword} ${a.threshold}+`))
    if (weaponKeywords.twinLinked) kws.push('Twin-linked')
    if (weaponKeywords.torrent) kws.push('Torrent')
    if (weaponKeywords.blast) kws.push('Blast')
    if (weaponKeywords.rapidFire) kws.push(`Rapid Fire ${weaponKeywords.rapidFire}`)
    if (weaponKeywords.melta) kws.push(`Melta ${weaponKeywords.melta}`)
    if (weaponKeywords.lance) kws.push('Lance')
    if (weaponKeywords.heavy) kws.push('Heavy')
    if (weaponKeywords.ignoresCover) kws.push('Ignores Cover')
    if (weaponKeywords.hazardous) kws.push('Hazardous')
    if (weaponKeywords.pistol) kws.push('Pistol')
    if (weaponKeywords.precision) kws.push('Precision')
    return kws
  }, [weaponKeywords])

  // --- Targeted defender keywords ---
  const targetedDefenderKeywords: TargetedKeyword[] = useMemo(() => {
    if (!defenderDatasheet || !weaponKeywords) return []
    const targets: TargetedKeyword[] = []

    if (weaponKeywords.anti) {
      for (const anti of weaponKeywords.anti) {
        const match = defenderKws.find((k) => k.toLowerCase() === anti.keyword.toLowerCase())
        if (match) {
          targets.push({ keyword: match, reason: `Anti-${anti.keyword} ${anti.threshold}+` })
        }
      }
    }

    if (attackerEffects.modifiers) {
      for (const mod of attackerEffects.modifiers) {
        if (mod.condition?.startsWith('vs_keyword:')) {
          const requiredKw = mod.condition.slice('vs_keyword:'.length)
          const match = defenderKws.find((k) => k.toLowerCase() === requiredKw.toLowerCase())
          if (match && !targets.some((t) => t.keyword === match)) {
            targets.push({ keyword: match, reason: `${mod.phase} ${mod.value > 0 ? '+' : ''}${mod.value}` })
          }
        }
      }
    }

    return targets
  }, [defenderDatasheet, weaponKeywords, defenderKws, attackerEffects])

  // --- Filtered stratagems ---
  const filteredAttackerStrats = useMemo(
    () => attackerStratagems.filter((s) => isStratagemRelevant(s, weaponType)),
    [attackerStratagems, weaponType],
  )
  const filteredDefenderStrats = useMemo(
    () => defenderStratagems.filter((s) => isStratagemRelevant(s, weaponType)),
    [defenderStratagems, weaponType],
  )

  return {
    result,
    baselineResult,
    damageDelta,
    attackerEffects,
    defenderEffects,
    weaponKeywords,
    activeKeywords,
    weaponType,
    defenderKws,
    targetedDefenderKeywords,
    explanations,
    filteredAttackerStrats,
    filteredDefenderStrats,
  }
}

import type { CombatInput, CombatResult, WeaponKeywords, AbilityEffect } from '@/types/combat.types'

// ============================================================
// Helpers
// ============================================================

/**
 * Parse dice notation string to its average value.
 * "3" → 3, "D6" → 3.5, "D3" → 2, "2D6" → 7, "D6+1" → 4.5, "2D3+3" → 7
 */
export function parseDiceNotation(value: string | number): number {
  if (typeof value === 'number') return value
  const s = value.trim().toUpperCase()
  if (!s) return 0

  // Pure number
  const num = Number(s)
  if (!isNaN(num)) return num

  // Pattern: NdS+B or dS+B
  const match = s.match(/^(\d*)D(\d+)([+-]\d+)?$/)
  if (match) {
    const count = match[1] ? Number(match[1]) : 1
    const sides = Number(match[2])
    const bonus = match[3] ? Number(match[3]) : 0
    return count * (sides + 1) / 2 + bonus
  }

  return 0
}

/**
 * Parse threshold string: "3+" → 3, "3" → 3, "N/A" → 0, "-" → 0
 */
export function parseThreshold(value: string): number {
  const s = value.trim().replace('+', '').replace('"', '')
  const n = parseInt(s, 10)
  return isNaN(n) ? 0 : n
}

/**
 * Wound roll threshold based on Strength vs Toughness (W40K 10e table).
 */
export function getWoundThreshold(strength: number, toughness: number): number {
  if (strength <= 0 || toughness <= 0) return 6
  if (strength >= 2 * toughness) return 2
  if (strength > toughness) return 3
  if (strength === toughness) return 4
  if (toughness >= 2 * strength) return 6
  return 5 // S < T but not half
}

/**
 * Clamp a threshold to valid range [2, 6].
 * Natural 1 always fails, so effective minimum is 2.
 */
function clampThreshold(t: number): number {
  return Math.max(2, Math.min(6, t))
}

/**
 * Probability of passing a dice roll with given threshold (on D6).
 */
function pSuccess(threshold: number): number {
  const t = clampThreshold(threshold)
  return (7 - t) / 6
}

/**
 * Probability of rolling a natural 6 on D6.
 */
const P_CRIT = 1 / 6

/**
 * Collect modifiers for a given phase from ability effects, optionally filtered by condition.
 */
function sumModifiers(effects: AbilityEffect, phase: string, condition?: string): number {
  if (!effects.modifiers) return 0
  return effects.modifiers
    .filter((m) => m.phase === phase && (!condition || !m.condition || m.condition === condition))
    .reduce((sum, m) => sum + m.value, 0)
}

// ============================================================
// Combat Resolution
// ============================================================

export function resolveCombat(input: CombatInput): CombatResult {
  const {
    weapon,
    weaponKeywords: kw,
    attackerProfile,
    attackerCount,
    attackerEffects,
    defenderProfile,
    defenderEffects,
    defenderCount,
    halfRange = false,
    charged = false,
    stationary = true,
    inCover = false,
  } = input

  const isRanged = weapon.type.toLowerCase().includes('ranged') || parseThreshold(weapon.range) > 0

  // ---- Step 1: Number of attacks ----
  let attacks = parseDiceNotation(weapon.A) * attackerCount

  // Blast: +1 attack per 5 models in target unit
  if (kw.blast && defenderCount > 0) {
    attacks += Math.floor(defenderCount / 5) * attackerCount
  }

  // Rapid fire: +N attacks at half range
  if (kw.rapidFire !== undefined) {
    const rfBonus = parseDiceNotation(kw.rapidFire)
    if (halfRange) {
      attacks += rfBonus * attackerCount
    }
  }

  // Extra attacks from abilities
  if (attackerEffects.extraAttacks) {
    attacks += attackerEffects.extraAttacks * attackerCount
  }

  // ---- Step 2: Hit roll ----
  let hitThreshold = parseThreshold(weapon.BS_WS)

  // Torrent: auto-hit
  const isTorrent = !!kw.torrent

  if (!isTorrent && hitThreshold > 0) {
    // Heavy: +1 to hit if stationary (lower threshold)
    if (kw.heavy && stationary) {
      hitThreshold -= 1
    }

    // Stealth from defender: -1 to hit (ranged only)
    if (isRanged && defenderEffects.stealth) {
      hitThreshold += 1
    }

    // Apply hit modifiers from attacker effects
    const attackerHitMod = sumModifiers(attackerEffects, 'hit', isRanged ? 'ranged_only' : 'melee_only')
      + sumModifiers(attackerEffects, 'hit') // unconditional
    hitThreshold -= attackerHitMod

    // Apply hit modifiers from defender effects (negative = harder for attacker)
    const defenderHitMod = sumModifiers(defenderEffects, 'hit', isRanged ? 'ranged_only' : undefined)
    hitThreshold -= defenderHitMod

    hitThreshold = clampThreshold(hitThreshold)
  }

  let hitsExpected: number
  let critHits = 0
  let lethalHitWounds = 0

  if (isTorrent) {
    hitsExpected = attacks
    // No crits from torrent (auto-hit, no dice rolled)
  } else if (hitThreshold <= 0) {
    hitsExpected = 0
  } else {
    const normalHitP = pSuccess(hitThreshold)
    hitsExpected = attacks * normalHitP

    // Critical hits on natural 6
    critHits = attacks * P_CRIT

    // Sustained hits: each crit generates N extra hits
    if (kw.sustainedHits !== undefined) {
      const sustainedN = parseDiceNotation(kw.sustainedHits)
      hitsExpected += critHits * sustainedN
    }

    // Lethal hits: crits auto-wound (skip wound roll)
    if (kw.lethalHits) {
      lethalHitWounds = critHits
      // Remove lethal hits from the pool going to wound roll
      hitsExpected -= critHits
    }
  }

  // ---- Step 3: Wound roll ----
  const strength = parseThreshold(weapon.S)
  const toughness = parseThreshold(defenderProfile.T)
  let woundThreshold = getWoundThreshold(strength, toughness)

  // Lance: +1 to wound if charged (melee)
  if (kw.lance && charged) {
    woundThreshold -= 1
  }

  // Apply wound modifiers
  const attackerWoundMod = sumModifiers(attackerEffects, 'wound')
  woundThreshold -= attackerWoundMod
  woundThreshold = clampThreshold(woundThreshold)

  // Anti-X: critical wounds trigger on anti threshold instead of 6
  // In W40K 10e, anti-X modifies the critical wound threshold
  let critWoundThreshold = 6
  if (kw.anti && kw.anti.length > 0) {
    // Use the best (lowest) anti threshold
    // In a real game you'd check keywords, but here we assume the anti applies
    const bestAnti = Math.min(...kw.anti.map((a) => a.threshold))
    critWoundThreshold = Math.min(critWoundThreshold, bestAnti)
  }

  const pCritWound = (7 - clampThreshold(critWoundThreshold)) / 6
  const pNormalWound = pSuccess(woundThreshold)

  // Twin-linked: reroll failed wound rolls
  let effectiveWoundP = pNormalWound
  if (kw.twinLinked) {
    const pFail = 1 - pNormalWound
    effectiveWoundP = pNormalWound + pFail * pNormalWound
  }

  let woundsExpected = hitsExpected * effectiveWoundP + lethalHitWounds

  // Devastating wounds: critical wounds become mortal wounds (bypass save)
  let mortalWounds = 0
  let critWounds = 0
  if (kw.devastatingWounds) {
    // Critical wounds from hits that went to wound roll
    critWounds = hitsExpected * pCritWound
    mortalWounds += critWounds * parseDiceNotation(weapon.D)
    // Remove crit wounds from normal wound pool (they bypass save)
    woundsExpected -= critWounds
  }

  // ---- Step 4: Save roll ----
  const sv = parseThreshold(defenderProfile.Sv)
  const ap = parseThreshold(weapon.AP) // AP is negative in rules, stored as positive or negative
  const apValue = weapon.AP.includes('-') ? Math.abs(ap) : ap

  let modifiedSave = sv + apValue

  // Cover bonus: +1 to save (if not ignores cover and ranged)
  if (inCover && isRanged && !kw.ignoresCover && !attackerEffects.ignoresCover) {
    modifiedSave -= 1 // better save
  }

  // Check invulnerable save
  const invSv = parseThreshold(defenderProfile.invSv)
  const abilityInvuln = defenderEffects.invulnerable?.value
  const bestInvuln = abilityInvuln
    ? (invSv > 0 ? Math.min(invSv, abilityInvuln) : abilityInvuln)
    : invSv

  let saveThreshold = modifiedSave
  let usedInvuln = false

  if (bestInvuln > 0 && bestInvuln < modifiedSave) {
    saveThreshold = bestInvuln
    usedInvuln = true
  }

  saveThreshold = clampThreshold(saveThreshold)

  const pSaveFail = 1 - pSuccess(saveThreshold)
  const unsavedWounds = woundsExpected * pSaveFail

  // ---- Step 5: Damage ----
  let avgDamage = parseDiceNotation(weapon.D)

  // Melta: +N damage at half range
  if (kw.melta !== undefined && halfRange) {
    avgDamage += kw.melta
  }

  // Damage reduction from defender
  if (defenderEffects.damageReduction) {
    avgDamage = Math.max(1, avgDamage - defenderEffects.damageReduction)
  }

  const damageTotal = unsavedWounds * avgDamage + mortalWounds

  // ---- Step 6: Feel No Pain ----
  const fnpThreshold = defenderEffects.feelNoPain
  let damageAfterFnp = damageTotal

  if (fnpThreshold && fnpThreshold >= 2 && fnpThreshold <= 6) {
    const pFnpFail = 1 - pSuccess(fnpThreshold)
    damageAfterFnp = damageTotal * pFnpFail
  }

  // ---- Step 7: Estimated kills ----
  const defenderWounds = parseThreshold(defenderProfile.W)
  const estimatedKills = defenderWounds > 0
    ? Math.min(defenderCount, damageAfterFnp / defenderWounds)
    : 0

  // ---- Round results ----
  const round2 = (n: number) => Math.round(n * 100) / 100

  return {
    attacksTotal: round2(attacks),
    hitsExpected: round2(hitsExpected + lethalHitWounds + (kw.sustainedHits !== undefined ? critHits * parseDiceNotation(kw.sustainedHits) : 0)),
    woundsExpected: round2(woundsExpected + critWounds + lethalHitWounds),
    unsavedWounds: round2(unsavedWounds + (mortalWounds > 0 ? mortalWounds / avgDamage : 0)),
    damageTotal: round2(damageTotal),
    damageAfterFnp: round2(damageAfterFnp),
    estimatedKills: round2(estimatedKills),
    mortalWounds: round2(mortalWounds),
    steps: {
      hitThreshold: isTorrent ? 0 : hitThreshold,
      woundThreshold,
      saveThreshold,
      usedInvuln,
      avgDamagePerWound: round2(avgDamage),
      ...(fnpThreshold ? { fnpThreshold } : {}),
    },
  }
}

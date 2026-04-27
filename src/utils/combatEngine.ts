import type { CombatInput, CombatResult, AbilityEffect } from '@/types/combat.types'

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
 * Supports conditions: 'ranged_only', 'melee_only', 'vs_keyword:VEHICLE', etc.
 */
function sumModifiers(effects: AbilityEffect, phase: string, condition?: string, defenderKeywords?: string[]): number {
  if (!effects.modifiers) return 0
  return effects.modifiers
    .filter((m) => {
      if (m.phase !== phase) return false
      if (!m.condition) return true
      // ranged_only / melee_only
      if (m.condition === 'ranged_only' || m.condition === 'melee_only') {
        return !condition || m.condition === condition
      }
      // vs_keyword:X — check if defender has that keyword
      if (m.condition.startsWith('vs_keyword:') && defenderKeywords) {
        const requiredKw = m.condition.slice('vs_keyword:'.length).toLowerCase()
        return defenderKeywords.some((k) => k.toLowerCase() === requiredKw)
      }
      // Unknown condition — apply by default if no filter or matches
      return !condition || m.condition === condition
    })
    .reduce((sum, m) => sum + m.value, 0)
}

// ============================================================
// Combat Resolution
// ============================================================

export function resolveCombat(input: CombatInput): CombatResult {
  const {
    weapon,
    weaponKeywords: kw,
    attackerProfile: _attackerProfile,
    attackerCount,
    attackerEffects,
    defenderProfile,
    defenderEffects,
    defenderCount,
    defenderKeywords = [],
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
    // W40K 10e: total hit modifier capped at +1/-1 (all sources combined)
    let rawHitMod = 0

    // Heavy: +1 to hit if stationary
    if (kw.heavy && stationary) rawHitMod += 1

    // Stealth from defender: -1 to hit (ranged only)
    if (isRanged && defenderEffects.stealth) rawHitMod -= 1

    // Ability modifiers
    rawHitMod += sumModifiers(attackerEffects, 'hit', isRanged ? 'ranged_only' : 'melee_only', defenderKeywords)
    rawHitMod += sumModifiers(attackerEffects, 'hit', undefined, defenderKeywords)
    rawHitMod += sumModifiers(defenderEffects, 'hit', isRanged ? 'ranged_only' : undefined, defenderKeywords)

    // Cap at +1/-1 per W40K 10e core rules
    const cappedHitMod = Math.max(-1, Math.min(1, rawHitMod))
    hitThreshold -= cappedHitMod

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
    let normalHitP = pSuccess(hitThreshold)
    // Reroll 1s to hit: 1/6 chance of rolling a 1, rerolled with normalHitP chance
    if (attackerEffects.rerollOnesHit) {
      normalHitP = normalHitP + (1 / 6) * normalHitP
    }
    hitsExpected = attacks * normalHitP

    // Critical hits on natural 6
    critHits = attacks * P_CRIT

    // Lethal hits: crits auto-wound (skip wound roll)
    // Must be resolved BEFORE sustained hits are added, because sustained hits
    // are normal hits (not crits) per W40K 10e rules
    if (kw.lethalHits) {
      lethalHitWounds = critHits
      // Remove lethal hits from the pool going to wound roll
      hitsExpected -= critHits
    }

    // Sustained hits: each crit generates N extra NORMAL hits (not crits)
    if (kw.sustainedHits !== undefined) {
      const sustainedN = parseDiceNotation(kw.sustainedHits)
      hitsExpected += critHits * sustainedN
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

  // Apply wound modifiers — W40K 10e: total wound modifier capped at +1/-1
  const attackerWoundMod = sumModifiers(attackerEffects, 'wound', undefined, defenderKeywords)
  const defenderWoundMod = sumModifiers(defenderEffects, 'wound', undefined, defenderKeywords)
  const totalWoundMod = Math.max(-1, Math.min(1, attackerWoundMod + defenderWoundMod))
  woundThreshold -= totalWoundMod
  woundThreshold = clampThreshold(woundThreshold)

  // Anti-X: critical wounds trigger on anti threshold instead of 6
  // W40K 10e: anti-X only applies if the defender has the matching keyword
  let critWoundThreshold = 6
  if (kw.anti && kw.anti.length > 0 && defenderKeywords.length > 0) {
    const defKwsLower = defenderKeywords.map((k) => k.toLowerCase())
    const matchingAnti = kw.anti.filter((a) => defKwsLower.includes(a.keyword.toLowerCase()))
    if (matchingAnti.length > 0) {
      const bestAnti = Math.min(...matchingAnti.map((a) => a.threshold))
      critWoundThreshold = Math.min(critWoundThreshold, bestAnti)
    }
  }

  const pCritWound = (7 - clampThreshold(critWoundThreshold)) / 6
  // W40K 10e: critical wounds are always successful wound rolls
  // So effective wound threshold = min(normal threshold, crit threshold)
  const effectiveWoundThreshold = Math.min(woundThreshold, critWoundThreshold)
  const pNormalWound = pSuccess(effectiveWoundThreshold)

  // Twin-linked: reroll failed wound rolls
  let effectiveWoundP = pNormalWound
  if (kw.twinLinked) {
    const pFail = 1 - pNormalWound
    effectiveWoundP = pNormalWound + pFail * pNormalWound
  } else if (attackerEffects.rerollOnesWound) {
    // Reroll 1s to wound: 1/6 chance of rolling a 1, rerolled with pNormalWound chance
    effectiveWoundP = pNormalWound + (1 / 6) * pNormalWound
  }

  let woundsExpected = hitsExpected * effectiveWoundP + lethalHitWounds

  // Devastating wounds: track crit wounds for mortal wound calculation
  let critWounds = 0
  if (kw.devastatingWounds) {
    // Critical wounds from hits that went to wound roll
    critWounds = hitsExpected * pCritWound
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

  // Devastating wounds: mortal wounds use damage characteristic (includes Melta)
  // but NOT damage reduction (mortal wounds ignore damage reduction per W40K 10e)
  const mortalWounds = critWounds * avgDamage

  // Damage reduction from defender (only applies to normal wounds, not mortal)
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
    hitsExpected: round2(hitsExpected + lethalHitWounds),
    woundsExpected: round2(woundsExpected + critWounds),
    unsavedWounds: round2(unsavedWounds + critWounds),
    damageTotal: round2(damageTotal),
    damageAfterFnp: round2(damageAfterFnp),
    estimatedKills: round2(estimatedKills),
    mortalWounds: round2(mortalWounds),
    mortalWoundCount: round2(critWounds),
    steps: {
      hitThreshold: isTorrent ? 0 : hitThreshold,
      woundThreshold: effectiveWoundThreshold,
      saveThreshold,
      usedInvuln,
      avgDamagePerWound: round2(avgDamage),
      ...(fnpThreshold ? { fnpThreshold } : {}),
    },
  }
}

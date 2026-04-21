import type { Datasheet, Profile } from '@/types/gameData.types'
import type { AbilityEffect } from '@/types/combat.types'

/**
 * Parse a damaged range string like "1-6" to { min, max }.
 */
export function parseDamagedRange(range: string): { min: number; max: number } | null {
  if (!range || range === '-') return null
  const match = range.match(/(\d+)\s*-\s*(\d+)/)
  if (!match) return null
  return { min: Number(match[1]), max: Number(match[2]) }
}

/**
 * Check if a unit is in its damaged state based on wounds remaining.
 */
export function isDamaged(datasheet: Datasheet, woundsRemaining: number | null): boolean {
  if (woundsRemaining === null) return false
  const range = parseDamagedRange(datasheet.damagedRange)
  if (!range) return false
  return woundsRemaining >= range.min && woundsRemaining <= range.max
}

/**
 * Parse the damagedDescription to extract combat effects.
 * Common patterns: "subtract 1 from the Hit roll", "subtract X from attacks", etc.
 */
export function parseDamagedEffects(description: string): AbilityEffect {
  const text = description.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase()
  const result: AbilityEffect = {}

  // "subtract 1 from the Hit roll" / "-1 to hit rolls"
  if (/subtract\s+1.{0,20}hit roll/i.test(text) || /-1.{0,10}hit/i.test(text)) {
    result.modifiers = [...(result.modifiers ?? []), { phase: 'hit', value: -1 }]
  }

  // "subtract 1 from wound rolls"
  if (/subtract\s+1.{0,20}wound roll/i.test(text) || /-1.{0,10}wound/i.test(text)) {
    result.modifiers = [...(result.modifiers ?? []), { phase: 'wound', value: -1 }]
  }

  return result
}

/**
 * Resolve the active profile for a datasheet, considering damaged state.
 * Returns the first profile (most datasheets have one) and damaged effects if applicable.
 */
export function resolveActiveProfile(
  datasheet: Datasheet,
  woundsRemaining: number | null,
): { profile: Profile; damagedEffects: AbilityEffect | null } {
  const profile = datasheet.profiles[0]
  if (!profile) {
    return { profile: { name: '', M: '0', T: '0', Sv: '7+', W: '1', Ld: '6+', OC: '0', invSv: '-', invSvDescr: '' }, damagedEffects: null }
  }

  if (isDamaged(datasheet, woundsRemaining)) {
    return {
      profile,
      damagedEffects: parseDamagedEffects(datasheet.damagedDescription),
    }
  }

  return { profile, damagedEffects: null }
}

/**
 * Parse unitComposition text to extract model counts per profile.
 * Example: "1 Sergeant, 4 Marines" → [{ name: 'Sergeant', count: 1 }, { name: 'Marines', count: 4 }]
 * Falls back to even distribution if unparsable.
 */
export function parseModelDistribution(
  profiles: Profile[],
  unitComposition: string,
  totalModels: number,
): { profile: Profile; count: number }[] {
  if (profiles.length <= 1) {
    return profiles.map((p) => ({ profile: p, count: totalModels }))
  }

  const distribution: { profile: Profile; count: number }[] = []
  const text = unitComposition.replace(/<[^>]+>/g, ' ').toLowerCase()

  for (const profile of profiles) {
    const name = profile.name.toLowerCase()
    // Match patterns like "1 Sergeant" or "4 Marines"
    const regex = new RegExp(`(\\d+)\\s+${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i')
    const match = text.match(regex)
    if (match) {
      distribution.push({ profile, count: Number(match[1]) })
    }
  }

  // If we parsed successfully, return
  if (distribution.length > 0) {
    return distribution
  }

  // Fallback: first profile gets most models, rest get 1 each
  if (profiles.length === 2) {
    return [
      { profile: profiles[0], count: Math.max(totalModels - 1, 1) },
      { profile: profiles[1], count: 1 },
    ]
  }

  return profiles.map((p) => ({ profile: p, count: Math.max(1, Math.floor(totalModels / profiles.length)) }))
}

/**
 * Get combined weapons for an attacker unit, including any attached leader's weapons.
 */
export function getCombinedWeapons(
  attackerDatasheet: Datasheet,
  leaderDatasheet?: Datasheet,
): { weapon: import('@/types/gameData.types').Weapon; fromLeader: boolean }[] {
  const weapons = attackerDatasheet.weapons.map((w) => ({ weapon: w, fromLeader: false }))
  if (leaderDatasheet) {
    for (const w of leaderDatasheet.weapons) {
      weapons.push({ weapon: w, fromLeader: true })
    }
  }
  return weapons
}

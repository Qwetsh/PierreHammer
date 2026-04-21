import type { Datasheet, Enhancement } from '@/types/gameData.types'
import type { AbilityEffect, CombatModifier } from '@/types/combat.types'
import { lookupAbility } from '@/data/abilityRegistry'

/**
 * Try to extract a Feel No Pain threshold from an ability name via regex.
 * Handles patterns like "Feel No Pain 5+", "feel no pain 4+".
 */
function parseFnpFromName(name: string): number | null {
  const match = name.match(/feel no pain\s+(\d)\+/i)
  return match ? Number(match[1]) : null
}

/**
 * Try to extract an invulnerable save from an ability name.
 * Handles patterns like "4+ invulnerable save".
 */
function parseInvulnFromName(name: string): number | null {
  const match = name.match(/(\d)\+\s*invulnerable save/i)
  return match ? Number(match[1]) : null
}

/**
 * Merge a single AbilityEffect into an accumulator.
 * For FnP, keeps the best (lowest threshold).
 * For invulnerable, keeps the best (lowest value).
 * For damageReduction, sums them.
 * For modifiers, concatenates.
 */
function mergeEffect(acc: AbilityEffect, effect: AbilityEffect): void {
  if (effect.feelNoPain !== undefined) {
    acc.feelNoPain = acc.feelNoPain !== undefined
      ? Math.min(acc.feelNoPain, effect.feelNoPain)
      : effect.feelNoPain
  }

  if (effect.invulnerable) {
    if (!acc.invulnerable || effect.invulnerable.value < acc.invulnerable.value) {
      acc.invulnerable = effect.invulnerable
    }
  }

  if (effect.damageReduction !== undefined) {
    acc.damageReduction = (acc.damageReduction ?? 0) + effect.damageReduction
  }

  if (effect.extraAttacks !== undefined) {
    acc.extraAttacks = (acc.extraAttacks ?? 0) + effect.extraAttacks
  }

  if (effect.stealth) {
    acc.stealth = true
  }

  if (effect.ignoresCover) {
    acc.ignoresCover = true
  }

  if (effect.mortalWounds) {
    acc.mortalWounds = effect.mortalWounds
  }

  if (effect.modifiers) {
    if (!acc.modifiers) acc.modifiers = []
    acc.modifiers.push(...effect.modifiers)
  }
}

/**
 * Extract aggregated combat effects from a Datasheet's abilities and profile.
 * Looks up each ability in the registry, falls back to regex parsing for FnP/invuln.
 * Unknown abilities are silently ignored.
 */
export function extractCombatEffects(datasheet: Datasheet): AbilityEffect {
  const result: AbilityEffect = {}

  // Parse abilities
  for (const ability of datasheet.abilities) {
    // 1. Try registry lookup
    const registryEffect = lookupAbility(ability.name)
    if (registryEffect) {
      mergeEffect(result, registryEffect)
      continue
    }

    // 2. Fallback: try regex parsing from ability name
    const fnp = parseFnpFromName(ability.name)
    if (fnp !== null) {
      mergeEffect(result, { feelNoPain: fnp })
      continue
    }

    const invuln = parseInvulnFromName(ability.name)
    if (invuln !== null) {
      mergeEffect(result, { invulnerable: { value: invuln } })
      continue
    }

    // 3. Check description for common patterns (simple text, not heavy HTML)
    const descLower = ability.description.toLowerCase()
    if (descLower.includes('feel no pain')) {
      const descFnp = descLower.match(/feel no pain\s+(\d)\+/)
      if (descFnp) {
        mergeEffect(result, { feelNoPain: Number(descFnp[1]) })
      }
    }

    // Unknown ability — silently ignored
  }

  // Parse invulnerable save from profile
  for (const profile of datasheet.profiles) {
    if (profile.invSv && profile.invSv !== '-' && profile.invSv !== '') {
      const invValue = parseInt(profile.invSv, 10)
      if (!isNaN(invValue)) {
        mergeEffect(result, { invulnerable: { value: invValue } })
      }
    }
  }

  return result
}

/**
 * Extract combat effects from an Enhancement description.
 * Pattern-based — covers common patterns, not exhaustive.
 */
export function extractEnhancementEffects(enhancement: Enhancement): AbilityEffect {
  const result: AbilityEffect = {}
  const desc = enhancement.description.toLowerCase()

  // Feel No Pain
  const fnpMatch = desc.match(/feel no pain\s+(\d)\+/)
  if (fnpMatch) {
    result.feelNoPain = Number(fnpMatch[1])
  }

  // Invulnerable save
  const invulnMatch = desc.match(/(\d)\+\s*invulnerable save/)
  if (invulnMatch) {
    result.invulnerable = { value: Number(invulnMatch[1]) }
  }

  // Extra attacks
  const attacksMatch = desc.match(/add\s+(\d+)\s+to the attacks/i)
  if (attacksMatch) {
    result.extraAttacks = Number(attacksMatch[1])
  }

  // Modifier: +N to wound rolls
  const modifiers: CombatModifier[] = []

  const woundModMatch = desc.match(/(?:add\s+)?(\d+)\s+to (?:the\s+)?wound rolls?/i)
  if (woundModMatch) {
    modifiers.push({ phase: 'wound', value: Number(woundModMatch[1]) })
  }

  // Modifier: +N to hit rolls
  const hitModMatch = desc.match(/(?:add\s+)?(\d+)\s+to (?:the\s+)?hit rolls?/i)
  if (hitModMatch) {
    modifiers.push({ phase: 'hit', value: Number(hitModMatch[1]) })
  }

  // Damage reduction
  const dmgRedMatch = desc.match(/(?:reduce|subtract)\s+(\d+)\s+from\s+the\s+damage/i)
  if (dmgRedMatch) {
    result.damageReduction = Number(dmgRedMatch[1])
  }

  // Stealth / -1 to hit
  if (desc.includes('stealth') || desc.match(/subtract\s+1\s+from\s+(?:the\s+)?hit rolls?.*ranged/i)) {
    result.stealth = true
  }

  if (modifiers.length > 0) {
    result.modifiers = modifiers
  }

  return result
}

import type { AbilityEffect } from '@/types/combat.types'

/**
 * Static registry mapping normalized ability names (lowercase) to their combat effects.
 * Only abilities with direct mechanical impact on combat resolution are included.
 * Abilities that are purely informational (targeting rules, deployment, etc.) are omitted.
 *
 * To add a new ability: just add an entry with the lowercase name as key.
 */
export const abilityRegistry: Record<string, AbilityEffect> = {
  // --- Core Abilities ---
  'stealth': {
    stealth: true,
    modifiers: [{ phase: 'hit', value: -1, condition: 'ranged_only' }],
  },
  'feel no pain 4+': { feelNoPain: 4 },
  'feel no pain 5+': { feelNoPain: 5 },
  'feel no pain 6+': { feelNoPain: 6 },
  'feel no pain 3+': { feelNoPain: 3 },

  // --- Frequent Faction/Datasheet abilities ---
  // Damage reduction
  'damage reduction': { damageReduction: 1 },

  // Invulnerable saves (when granted by abilities, not profile)
  '4+ invulnerable save': { invulnerable: { value: 4 } },
  '5+ invulnerable save': { invulnerable: { value: 5 } },
  '6+ invulnerable save': { invulnerable: { value: 6 } },

  // Common modifiers
  'cover': {
    modifiers: [{ phase: 'save', value: 1, condition: 'ranged_only' }],
  },
}

/**
 * Look up an ability by name in the registry.
 * Returns undefined if not found (caller should handle gracefully).
 */
export function lookupAbility(abilityName: string): AbilityEffect | undefined {
  return abilityRegistry[abilityName.trim().toLowerCase()]
}

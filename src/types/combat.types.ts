// === Weapon Keywords (Story 11.1) ===

export interface AntiKeyword {
  keyword: string
  threshold: number
}

export interface WeaponKeywords {
  sustainedHits?: number | string  // "sustained hits 2" → 2, "sustained hits d3" → 'd3'
  lethalHits?: boolean
  devastatingWounds?: boolean
  anti?: AntiKeyword[]
  twinLinked?: boolean
  torrent?: boolean
  blast?: boolean
  hazardous?: boolean
  heavy?: boolean
  assault?: boolean
  rapidFire?: number | string      // "rapid fire 2" → 2, "rapid fire d6+3" → 'd6+3'
  melta?: number
  lance?: boolean
  indirectFire?: boolean
  precision?: boolean
  pistol?: boolean
  ignoresCover?: boolean
  oneShot?: boolean
  extraAttacks?: boolean
  conversion?: boolean
}

// === Ability Effects (Story 11.2) ===

export type CombatModifierPhase = 'hit' | 'wound' | 'save' | 'damage' | 'fnp' | 'attacks'

export interface CombatModifier {
  phase: CombatModifierPhase
  value: number
  condition?: string  // "ranged_only", "melee_only", "vs_keyword:VEHICLE"
}

export interface AbilityEffect {
  feelNoPain?: number           // threshold (5 = 5+, 6 = 6+)
  modifiers?: CombatModifier[]
  mortalWounds?: { threshold: number; amount: string }
  invulnerable?: { value: number; condition?: string }
  damageReduction?: number      // -1 damage per attack
  extraAttacks?: number
  stealth?: boolean             // shorthand for -1 to hit (ranged)
  ignoresCover?: boolean
  rerollOnesHit?: boolean       // reroll 1s to hit
  rerollOnesWound?: boolean     // reroll 1s to wound
}

// === Combat Engine I/O (Story 11.3) ===

export interface CombatInput {
  weapon: import('@/types/gameData.types').Weapon
  weaponKeywords: WeaponKeywords
  attackerProfile: import('@/types/gameData.types').Profile
  attackerCount: number
  attackerEffects: AbilityEffect
  defenderProfile: import('@/types/gameData.types').Profile
  defenderEffects: AbilityEffect
  defenderCount: number
  /** Defender's unit keywords (e.g. ['VEHICLE', 'INFANTRY']) for conditional modifiers */
  defenderKeywords?: string[]
  /** Whether attacker is at half range (for rapid fire, melta) */
  halfRange?: boolean
  /** Whether attacker charged this turn (for lance) */
  charged?: boolean
  /** Whether attacker remained stationary (for heavy) */
  stationary?: boolean
  /** Whether defender is in cover */
  inCover?: boolean
}

export interface CombatSteps {
  hitThreshold: number
  woundThreshold: number
  saveThreshold: number
  usedInvuln: boolean
  avgDamagePerWound: number
  fnpThreshold?: number
}

export interface CombatResult {
  attacksTotal: number
  hitsExpected: number
  woundsExpected: number
  unsavedWounds: number
  damageTotal: number
  damageAfterFnp: number
  estimatedKills: number
  /** Total damage dealt by mortal wounds (count × avg damage per wound) */
  mortalWounds: number
  /** Number of mortal wound instances (critical wounds that bypassed saves) */
  mortalWoundCount: number
  steps: CombatSteps
}

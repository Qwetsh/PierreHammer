import type { Weapon, Profile } from '@/types/gameData.types'
import type { AbilityEffect } from '@/types/combat.types'
import { resolveCombat } from './combatEngine'
import { parseWeaponKeywords } from './weaponKeywordParser'

/**
 * Find the weapon that deals the most expected damage after FnP against a given defender.
 * Returns null if weapons array is empty.
 */
export function findBestWeapon(
  weapons: Weapon[],
  attackerProfile: Profile,
  attackerCount: number,
  attackerEffects: AbilityEffect,
  defenderProfile: Profile,
  defenderCount: number,
  defenderEffects: AbilityEffect,
): Weapon | null {
  if (weapons.length === 0) return null
  if (weapons.length === 1) return weapons[0]

  let best: Weapon = weapons[0]
  let bestDamage = -1

  for (const weapon of weapons) {
    const result = resolveCombat({
      weapon,
      weaponKeywords: parseWeaponKeywords(weapon.abilities),
      attackerProfile,
      attackerCount,
      attackerEffects,
      defenderProfile,
      defenderCount,
      defenderEffects,
    })
    if (result.damageAfterFnp > bestDamage) {
      bestDamage = result.damageAfterFnp
      best = weapon
    }
  }

  return best
}

/**
 * Find the best weapon separately for ranged and melee categories.
 */
export function findBestWeaponByCategory(
  weapons: Weapon[],
  attackerProfile: Profile,
  attackerCount: number,
  attackerEffects: AbilityEffect,
  defenderProfile: Profile,
  defenderCount: number,
  defenderEffects: AbilityEffect,
): { ranged: Weapon | null; melee: Weapon | null } {
  const ranged = weapons.filter((w) => w.type === 'Ranged' || (w.range && w.range !== 'Melee'))
  const melee = weapons.filter((w) => w.type === 'Melee' || w.range === 'Melee')

  return {
    ranged: findBestWeapon(ranged, attackerProfile, attackerCount, attackerEffects, defenderProfile, defenderCount, defenderEffects),
    melee: findBestWeapon(melee, attackerProfile, attackerCount, attackerEffects, defenderProfile, defenderCount, defenderEffects),
  }
}

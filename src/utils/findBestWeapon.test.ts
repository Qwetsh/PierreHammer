import { describe, it, expect } from 'vitest'
import { findBestWeapon, findBestWeaponByCategory } from './findBestWeapon'
import type { Weapon, Profile } from '@/types/gameData.types'
import type { AbilityEffect } from '@/types/combat.types'

function makeProfile(overrides: Partial<Profile> = {}): Profile {
  return {
    name: 'Test',
    M: '6"',
    T: '4',
    Sv: '3+',
    W: '2',
    Ld: '6+',
    OC: '1',
    invSv: '-',
    invSvDescr: '',
    ...overrides,
  }
}

function makeWeapon(overrides: Partial<Weapon> = {}): Weapon {
  return {
    name: 'Test',
    type: 'Ranged',
    range: '24"',
    A: '2',
    BS_WS: '3+',
    S: '4',
    AP: '-1',
    D: '1',
    abilities: '',
    ...overrides,
  }
}

const noEffects: AbilityEffect = {}

describe('findBestWeapon', () => {
  it('returns null for empty array', () => {
    expect(findBestWeapon([], makeProfile(), 5, noEffects, makeProfile(), 5, noEffects)).toBeNull()
  })

  it('returns only weapon when single', () => {
    const w = makeWeapon({ name: 'Only' })
    expect(findBestWeapon([w], makeProfile(), 5, noEffects, makeProfile(), 5, noEffects)).toBe(w)
  })

  it('selects higher damage weapon against target', () => {
    const weak = makeWeapon({ name: 'Weak', S: '3', D: '1', AP: '0' })
    const strong = makeWeapon({ name: 'Strong', S: '8', D: '3', AP: '-3' })
    const result = findBestWeapon([weak, strong], makeProfile(), 5, noEffects, makeProfile({ T: '4', Sv: '3+' }), 5, noEffects)
    expect(result?.name).toBe('Strong')
  })

  it('selects anti-tank weapon against high-T target', () => {
    const bolter = makeWeapon({ name: 'Bolter', S: '4', D: '1', AP: '0', A: '4' })
    const lascannon = makeWeapon({ name: 'Lascannon', S: '12', D: 'D6+1', AP: '-3', A: '1' })
    const result = findBestWeapon(
      [bolter, lascannon],
      makeProfile(), 5, noEffects,
      makeProfile({ T: '12', Sv: '2+', W: '14' }), 1, noEffects,
    )
    expect(result?.name).toBe('Lascannon')
  })
})

describe('findBestWeaponByCategory', () => {
  it('separates ranged and melee', () => {
    const ranged = makeWeapon({ name: 'Bolter', type: 'Ranged', range: '24"' })
    const melee = makeWeapon({ name: 'Sword', type: 'Melee', range: 'Melee', S: '5', D: '2', AP: '-2' })

    const result = findBestWeaponByCategory(
      [ranged, melee],
      makeProfile(), 5, noEffects,
      makeProfile(), 5, noEffects,
    )
    expect(result.ranged?.name).toBe('Bolter')
    expect(result.melee?.name).toBe('Sword')
  })

  it('returns null for missing category', () => {
    const melee = makeWeapon({ name: 'Sword', type: 'Melee', range: 'Melee' })
    const result = findBestWeaponByCategory(
      [melee],
      makeProfile(), 5, noEffects,
      makeProfile(), 5, noEffects,
    )
    expect(result.ranged).toBeNull()
    expect(result.melee?.name).toBe('Sword')
  })
})

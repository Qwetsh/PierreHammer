import { describe, it, expect } from 'vitest'
import { parseDamagedRange, isDamaged, parseDamagedEffects, resolveActiveProfile, parseModelDistribution, getCombinedWeapons } from './profileResolver'
import type { Datasheet, Profile, Weapon } from '@/types/gameData.types'

function makeProfile(overrides: Partial<Profile> = {}): Profile {
  return { name: 'Test', M: '10"', T: '10', Sv: '3+', W: '14', Ld: '6+', OC: '5', invSv: '-', invSvDescr: '', ...overrides }
}

function makeDatasheet(overrides: Partial<Datasheet> = {}): Datasheet {
  return {
    id: 'ds1',
    name: 'Tank',
    factionId: 'sm',
    imageUrl: '',
    unitComposition: '',
    loadout: '',
    keywords: [],
    damagedDescription: '',
    damagedRange: '',
    profiles: [makeProfile()],
    weapons: [],
    abilities: [],
    pointOptions: [],
    ...overrides,
  } as Datasheet
}

describe('parseDamagedRange', () => {
  it('parses "1-6"', () => {
    expect(parseDamagedRange('1-6')).toEqual({ min: 1, max: 6 })
  })

  it('parses "1-4"', () => {
    expect(parseDamagedRange('1-4')).toEqual({ min: 1, max: 4 })
  })

  it('returns null for empty/dash', () => {
    expect(parseDamagedRange('')).toBeNull()
    expect(parseDamagedRange('-')).toBeNull()
  })
})

describe('isDamaged', () => {
  const ds = makeDatasheet({ damagedRange: '1-6' })

  it('true when wounds in range', () => {
    expect(isDamaged(ds, 3)).toBe(true)
    expect(isDamaged(ds, 1)).toBe(true)
    expect(isDamaged(ds, 6)).toBe(true)
  })

  it('false when wounds above range', () => {
    expect(isDamaged(ds, 7)).toBe(false)
  })

  it('false when wounds null (full health)', () => {
    expect(isDamaged(ds, null)).toBe(false)
  })

  it('false when no damagedRange', () => {
    const noDmg = makeDatasheet({ damagedRange: '' })
    expect(isDamaged(noDmg, 3)).toBe(false)
  })
})

describe('parseDamagedEffects', () => {
  it('parses "subtract 1 from the Hit roll"', () => {
    const effects = parseDamagedEffects('Each time this model makes an attack, subtract 1 from the Hit roll.')
    expect(effects.modifiers).toContainEqual({ phase: 'hit', value: -1 })
  })

  it('parses "-1 to hit"', () => {
    const effects = parseDamagedEffects('-1 to hit rolls')
    expect(effects.modifiers).toContainEqual({ phase: 'hit', value: -1 })
  })

  it('returns empty for non-combat description', () => {
    const effects = parseDamagedEffects('This model loses the Deadly Demise ability.')
    expect(effects.modifiers).toBeUndefined()
  })
})

describe('resolveActiveProfile', () => {
  it('returns base profile when not damaged', () => {
    const ds = makeDatasheet({ damagedRange: '1-6', damagedDescription: 'subtract 1 from the Hit roll' })
    const result = resolveActiveProfile(ds, null)
    expect(result.damagedEffects).toBeNull()
    expect(result.profile.T).toBe('10')
  })

  it('returns damaged effects when in range', () => {
    const ds = makeDatasheet({ damagedRange: '1-6', damagedDescription: 'Each time this model makes an attack, subtract 1 from the Hit roll.' })
    const result = resolveActiveProfile(ds, 5)
    expect(result.damagedEffects).not.toBeNull()
    expect(result.damagedEffects!.modifiers).toContainEqual({ phase: 'hit', value: -1 })
  })

  it('returns base profile when above damaged range', () => {
    const ds = makeDatasheet({ damagedRange: '1-6', damagedDescription: 'subtract 1 from the Hit roll' })
    const result = resolveActiveProfile(ds, 10)
    expect(result.damagedEffects).toBeNull()
  })
})

function makeWeapon(overrides: Partial<Weapon> = {}): Weapon {
  return { name: 'Bolter', type: 'ranged', range: '24"', A: '2', BS_WS: '3+', S: '4', AP: '0', D: '1', abilities: '', ...overrides }
}

describe('parseModelDistribution', () => {
  const sergeant = makeProfile({ name: 'Sergeant' })
  const marine = makeProfile({ name: 'Intercessor' })

  it('returns single profile with totalModels', () => {
    const result = parseModelDistribution([marine], '', 5)
    expect(result).toEqual([{ profile: marine, count: 5 }])
  })

  it('parses "1 Sergeant" and "4 Intercessor" from unitComposition', () => {
    const result = parseModelDistribution([sergeant, marine], '1 Sergeant, 4 Intercessor', 5)
    expect(result).toContainEqual({ profile: sergeant, count: 1 })
    expect(result).toContainEqual({ profile: marine, count: 4 })
  })

  it('falls back to N-1 / 1 for 2 profiles when text is unparsable', () => {
    const result = parseModelDistribution([marine, sergeant], 'Some unparsable text', 5)
    expect(result).toEqual([
      { profile: marine, count: 4 },
      { profile: sergeant, count: 1 },
    ])
  })

  it('falls back to even distribution for 3+ profiles', () => {
    const third = makeProfile({ name: 'Heavy' })
    const result = parseModelDistribution([marine, sergeant, third], 'unparsable', 9)
    expect(result).toEqual([
      { profile: marine, count: 3 },
      { profile: sergeant, count: 3 },
      { profile: third, count: 3 },
    ])
  })
})

describe('getCombinedWeapons', () => {
  it('returns only attacker weapons when no leader', () => {
    const bolter = makeWeapon({ name: 'Bolt Rifle' })
    const ds = makeDatasheet({ weapons: [bolter] })
    const result = getCombinedWeapons(ds)
    expect(result).toEqual([{ weapon: bolter, fromLeader: false }])
  })

  it('combines attacker and leader weapons', () => {
    const bolter = makeWeapon({ name: 'Bolt Rifle' })
    const sword = makeWeapon({ name: 'Power Sword', type: 'melee' })
    const attacker = makeDatasheet({ weapons: [bolter] })
    const leader = makeDatasheet({ weapons: [sword] })
    const result = getCombinedWeapons(attacker, leader)
    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({ weapon: bolter, fromLeader: false })
    expect(result[1]).toEqual({ weapon: sword, fromLeader: true })
  })
})

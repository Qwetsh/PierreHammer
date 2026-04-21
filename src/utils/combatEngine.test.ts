import { describe, it, expect } from 'vitest'
import {
  parseDiceNotation,
  parseThreshold,
  getWoundThreshold,
  resolveCombat,
} from './combatEngine'
import type { CombatInput } from '@/types/combat.types'
import type { Weapon, Profile } from '@/types/gameData.types'

// ============================================================
// Helper builders
// ============================================================

function makeWeapon(overrides: Partial<Weapon> = {}): Weapon {
  return {
    name: 'Test Weapon',
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

function makeInput(overrides: Partial<CombatInput> = {}): CombatInput {
  return {
    weapon: makeWeapon(),
    weaponKeywords: {},
    attackerProfile: makeProfile(),
    attackerCount: 5,
    attackerEffects: {},
    defenderProfile: makeProfile(),
    defenderEffects: {},
    defenderCount: 5,
    ...overrides,
  }
}

// ============================================================
// parseDiceNotation
// ============================================================

describe('parseDiceNotation', () => {
  it('parses plain number', () => {
    expect(parseDiceNotation('3')).toBe(3)
  })

  it('parses number type', () => {
    expect(parseDiceNotation(5)).toBe(5)
  })

  it('parses D6', () => {
    expect(parseDiceNotation('D6')).toBe(3.5)
  })

  it('parses D3', () => {
    expect(parseDiceNotation('D3')).toBe(2)
  })

  it('parses 2D6', () => {
    expect(parseDiceNotation('2D6')).toBe(7)
  })

  it('parses D6+1', () => {
    expect(parseDiceNotation('D6+1')).toBe(4.5)
  })

  it('parses D6+3', () => {
    expect(parseDiceNotation('D6+3')).toBe(6.5)
  })

  it('parses 2D3+3', () => {
    expect(parseDiceNotation('2D3+3')).toBe(7)
  })

  it('parses d6 lowercase', () => {
    expect(parseDiceNotation('d6')).toBe(3.5)
  })

  it('returns 0 for empty string', () => {
    expect(parseDiceNotation('')).toBe(0)
  })

  it('returns 0 for invalid', () => {
    expect(parseDiceNotation('abc')).toBe(0)
  })

  it('parses D6-1', () => {
    expect(parseDiceNotation('D6-1')).toBe(2.5)
  })
})

// ============================================================
// parseThreshold
// ============================================================

describe('parseThreshold', () => {
  it('parses "3+" to 3', () => {
    expect(parseThreshold('3+')).toBe(3)
  })

  it('parses "3" to 3', () => {
    expect(parseThreshold('3')).toBe(3)
  })

  it('parses "N/A" to 0', () => {
    expect(parseThreshold('N/A')).toBe(0)
  })

  it('parses "-" to 0', () => {
    expect(parseThreshold('-')).toBe(0)
  })

  it('parses "4+" to 4', () => {
    expect(parseThreshold('4+')).toBe(4)
  })
})

// ============================================================
// getWoundThreshold
// ============================================================

describe('getWoundThreshold', () => {
  it('S >= 2T → 2+', () => {
    expect(getWoundThreshold(8, 4)).toBe(2)
    expect(getWoundThreshold(10, 4)).toBe(2)
    expect(getWoundThreshold(24, 3)).toBe(2)
  })

  it('S > T → 3+', () => {
    expect(getWoundThreshold(5, 4)).toBe(3)
    expect(getWoundThreshold(6, 4)).toBe(3)
    expect(getWoundThreshold(7, 4)).toBe(3) // 7 > 4 but 7 < 8
  })

  it('S = T → 4+', () => {
    expect(getWoundThreshold(4, 4)).toBe(4)
    expect(getWoundThreshold(1, 1)).toBe(4)
  })

  it('S < T → 5+', () => {
    expect(getWoundThreshold(3, 4)).toBe(5)
    expect(getWoundThreshold(3, 5)).toBe(5)
  })

  it('T >= 2S → 6+', () => {
    expect(getWoundThreshold(2, 4)).toBe(6)
    expect(getWoundThreshold(3, 8)).toBe(6)
    expect(getWoundThreshold(1, 12)).toBe(6)
  })

  it('edge case S=0 → 6', () => {
    expect(getWoundThreshold(0, 4)).toBe(6)
  })
})

// ============================================================
// resolveCombat — basic pipeline
// ============================================================

describe('resolveCombat', () => {
  it('basic attack: 5 models, 2A, BS3+, S4 vs T4 Sv3+ AP-1, D1', () => {
    const result = resolveCombat(makeInput())
    // 10 attacks, hit on 3+ (4/6 = 66.7%), wound on 4+ (50%), save on 4+ (50%), D1
    expect(result.attacksTotal).toBe(10)
    expect(result.hitsExpected).toBeGreaterThan(5)
    expect(result.hitsExpected).toBeLessThan(8)
    expect(result.woundsExpected).toBeGreaterThan(2)
    expect(result.damageAfterFnp).toBeGreaterThan(0)
    expect(result.steps.hitThreshold).toBe(3)
    expect(result.steps.woundThreshold).toBe(4)
    expect(result.steps.saveThreshold).toBe(4)
    expect(result.steps.usedInvuln).toBe(false)
  })

  it('torrent: auto-hits', () => {
    const result = resolveCombat(makeInput({
      weaponKeywords: { torrent: true },
    }))
    // All attacks hit
    expect(result.hitsExpected).toBe(10) // 5 models × 2A
    expect(result.steps.hitThreshold).toBe(0)
  })

  it('invulnerable save used when better', () => {
    const result = resolveCombat(makeInput({
      weapon: makeWeapon({ AP: '-3' }),
      defenderProfile: makeProfile({ Sv: '3+', invSv: '4' }),
    }))
    // Sv 3+ with AP-3 = 6+, but invuln 4+ is better
    expect(result.steps.usedInvuln).toBe(true)
    expect(result.steps.saveThreshold).toBe(4)
  })

  it('invulnerable save NOT used when armour is better', () => {
    const result = resolveCombat(makeInput({
      weapon: makeWeapon({ AP: '0' }),
      defenderProfile: makeProfile({ Sv: '2+', invSv: '4' }),
    }))
    // Sv 2+ with AP0 = 2+, invuln 4+ is worse
    expect(result.steps.usedInvuln).toBe(false)
    expect(result.steps.saveThreshold).toBe(2)
  })

  it('feel no pain reduces damage', () => {
    const withFnp = resolveCombat(makeInput({
      defenderEffects: { feelNoPain: 5 },
    }))
    const withoutFnp = resolveCombat(makeInput())
    expect(withFnp.damageAfterFnp).toBeLessThan(withoutFnp.damageAfterFnp)
    expect(withFnp.steps.fnpThreshold).toBe(5)
  })

  it('stealth increases hit threshold (ranged)', () => {
    const withStealth = resolveCombat(makeInput({
      defenderEffects: { stealth: true },
    }))
    expect(withStealth.steps.hitThreshold).toBe(4) // 3+ → 4+
  })

  it('heavy improves hit threshold when stationary', () => {
    const result = resolveCombat(makeInput({
      weaponKeywords: { heavy: true },
      stationary: true,
    }))
    expect(result.steps.hitThreshold).toBe(2) // 3+ → 2+
  })

  it('sustained hits adds extra hits', () => {
    const withSH = resolveCombat(makeInput({
      weaponKeywords: { sustainedHits: 2 },
    }))
    const without = resolveCombat(makeInput())
    expect(withSH.hitsExpected).toBeGreaterThan(without.hitsExpected)
  })

  it('lethal hits: crits auto-wound', () => {
    const withLH = resolveCombat(makeInput({
      weaponKeywords: { lethalHits: true },
    }))
    const without = resolveCombat(makeInput())
    // Lethal hits should produce more wounds because crits skip wound roll
    expect(withLH.woundsExpected).toBeGreaterThanOrEqual(without.woundsExpected)
  })

  it('devastating wounds: crits wound become mortal wounds', () => {
    const result = resolveCombat(makeInput({
      weaponKeywords: { devastatingWounds: true },
      weapon: makeWeapon({ D: '3' }),
    }))
    expect(result.mortalWounds).toBeGreaterThan(0)
  })

  it('twin-linked: rerolls failed wounds', () => {
    const withTL = resolveCombat(makeInput({
      weaponKeywords: { twinLinked: true },
    }))
    const without = resolveCombat(makeInput())
    expect(withTL.woundsExpected).toBeGreaterThan(without.woundsExpected)
  })

  it('blast: adds attacks per 5 models', () => {
    const result = resolveCombat(makeInput({
      weaponKeywords: { blast: true },
      defenderCount: 20,
    }))
    // 20 models → +4 attacks per attacker (floor(20/5)=4), 5 attackers → +20
    expect(result.attacksTotal).toBe(30) // 10 base + 20 from blast
  })

  it('rapid fire: adds attacks at half range', () => {
    const atHalf = resolveCombat(makeInput({
      weaponKeywords: { rapidFire: 1 },
      halfRange: true,
    }))
    const notHalf = resolveCombat(makeInput({
      weaponKeywords: { rapidFire: 1 },
      halfRange: false,
    }))
    expect(atHalf.attacksTotal).toBe(15) // 10 + 5×1
    expect(notHalf.attacksTotal).toBe(10)
  })

  it('melta: adds damage at half range', () => {
    const atHalf = resolveCombat(makeInput({
      weapon: makeWeapon({ D: '3' }),
      weaponKeywords: { melta: 2 },
      halfRange: true,
    }))
    const notHalf = resolveCombat(makeInput({
      weapon: makeWeapon({ D: '3' }),
      weaponKeywords: { melta: 2 },
      halfRange: false,
    }))
    expect(atHalf.steps.avgDamagePerWound).toBe(5) // 3 + 2
    expect(notHalf.steps.avgDamagePerWound).toBe(3)
  })

  it('lance: improves wound threshold on charge', () => {
    const onCharge = resolveCombat(makeInput({
      weapon: makeWeapon({ type: 'Melee', range: '-' }),
      weaponKeywords: { lance: true },
      charged: true,
    }))
    const noCharge = resolveCombat(makeInput({
      weapon: makeWeapon({ type: 'Melee', range: '-' }),
      weaponKeywords: { lance: true },
      charged: false,
    }))
    expect(onCharge.steps.woundThreshold).toBe(3) // 4+ → 3+
    expect(noCharge.steps.woundThreshold).toBe(4) // normal
  })

  it('ignores cover: defender gets no cover bonus', () => {
    const withCover = resolveCombat(makeInput({
      inCover: true,
    }))
    const ignoring = resolveCombat(makeInput({
      weaponKeywords: { ignoresCover: true },
      inCover: true,
    }))
    // With cover defender saves better, ignoring cover undoes that
    expect(ignoring.unsavedWounds).toBeGreaterThan(withCover.unsavedWounds)
  })

  it('damage reduction: min 1 damage', () => {
    const result = resolveCombat(makeInput({
      weapon: makeWeapon({ D: '1' }),
      defenderEffects: { damageReduction: 3 },
    }))
    // D1 - 3 = min 1
    expect(result.steps.avgDamagePerWound).toBe(1)
  })

  it('anti-X lowers critical wound threshold', () => {
    const withAnti = resolveCombat(makeInput({
      weaponKeywords: { anti: [{ keyword: 'infantry', threshold: 4 }] },
    }))
    const without = resolveCombat(makeInput())
    // Anti-infantry 4+ means more crit wounds → more wounds expected
    expect(withAnti.woundsExpected).toBeGreaterThanOrEqual(without.woundsExpected)
  })

  it('estimated kills cannot exceed defender count', () => {
    const result = resolveCombat(makeInput({
      weapon: makeWeapon({ A: '100', D: '10' }),
      attackerCount: 10,
      defenderCount: 3,
    }))
    expect(result.estimatedKills).toBeLessThanOrEqual(3)
  })

  it('D6 damage weapon averages correctly', () => {
    const result = resolveCombat(makeInput({
      weapon: makeWeapon({ D: 'D6' }),
    }))
    expect(result.steps.avgDamagePerWound).toBe(3.5)
  })

  it('0 attacker count gives 0 damage', () => {
    const result = resolveCombat(makeInput({ attackerCount: 0 }))
    expect(result.attacksTotal).toBe(0)
    expect(result.damageAfterFnp).toBe(0)
  })

  it('ability invulnerable used when better than profile', () => {
    const result = resolveCombat(makeInput({
      weapon: makeWeapon({ AP: '-3' }),
      defenderProfile: makeProfile({ Sv: '3+', invSv: '5' }),
      defenderEffects: { invulnerable: { value: 4 } },
    }))
    // Profile invSv=5, ability invuln=4 → use 4
    expect(result.steps.usedInvuln).toBe(true)
    expect(result.steps.saveThreshold).toBe(4)
  })
})

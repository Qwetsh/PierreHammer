import { describe, it, expect } from 'vitest'
import {
  calcDiceSuccesses,
  calcAverageDice,
  calcChargeSuccess,
  calc2D6Distribution,
} from './diceCalculator'

describe('calcDiceSuccesses', () => {
  it('returns 0 for 0 dice', () => {
    expect(calcDiceSuccesses(0, 4)).toBe(0)
  })

  it('returns 0 for threshold > 6', () => {
    expect(calcDiceSuccesses(10, 7)).toBe(0)
  })

  it('calculates 4+ on 12 dice (50%)', () => {
    expect(calcDiceSuccesses(12, 4)).toBe(6)
  })

  it('calculates 3+ on 6 dice (66.67%)', () => {
    expect(calcDiceSuccesses(6, 3)).toBe(4)
  })

  it('calculates 2+ on 6 dice (83.33%)', () => {
    expect(calcDiceSuccesses(6, 2)).toBe(5)
  })

  it('calculates 6+ on 36 dice (16.67%)', () => {
    expect(calcDiceSuccesses(36, 6)).toBe(6)
  })

  it('handles reroll ones', () => {
    // 12 dice, 4+: base 6, reroll ones: 12 * 1/6 * 0.5 = 1
    expect(calcDiceSuccesses(12, 4, 'ones')).toBe(7)
  })

  it('handles reroll all failures', () => {
    // 12 dice, 4+: base 6, reroll failures: 12 * 0.5 * 0.5 = 3
    expect(calcDiceSuccesses(12, 4, 'all-failures')).toBe(9)
  })

  it('handles modifier', () => {
    // 12 dice, 4+ with +1 modifier → effectively 3+
    expect(calcDiceSuccesses(12, 4, 'none', 1)).toBe(8)
  })
})

describe('calcAverageDice', () => {
  it('returns flat bonus for 0 dice', () => {
    expect(calcAverageDice(0, 6, 3)).toBe(3)
  })

  it('calculates 1D6 average', () => {
    expect(calcAverageDice(1, 6)).toBe(3.5)
  })

  it('calculates 5D6 average', () => {
    expect(calcAverageDice(5, 6)).toBe(17.5)
  })

  it('calculates 5D6+2 average', () => {
    expect(calcAverageDice(5, 6, 2)).toBe(19.5)
  })

  it('calculates D3 average', () => {
    expect(calcAverageDice(1, 3)).toBe(2)
  })

  it('calculates 3D3+1 average', () => {
    expect(calcAverageDice(3, 3, 1)).toBe(7)
  })
})

describe('calcChargeSuccess', () => {
  it('returns 100% for distance 0 or less', () => {
    expect(calcChargeSuccess(0)).toBe(100)
    expect(calcChargeSuccess(-1)).toBe(100)
  })

  it('calculates 7" charge (58.33%)', () => {
    // 2D6 >= 7: 21/36 combinations
    expect(calcChargeSuccess(7)).toBe(58.33)
  })

  it('calculates 12" charge (2.78%)', () => {
    // 2D6 >= 12: only double 6 = 1/36
    expect(calcChargeSuccess(12)).toBe(2.78)
  })

  it('calculates 2" charge (100%)', () => {
    // 2D6 always >= 2
    expect(calcChargeSuccess(2)).toBe(100)
  })

  it('applies bonus correctly', () => {
    // 9" with +2 bonus = need 7 on 2D6
    expect(calcChargeSuccess(9, 2)).toBe(58.33)
  })

  it('calculates with reroll', () => {
    // 9" charge base = 27.78%, with reroll: 27.78 + 72.22 * 27.78
    const result = calcChargeSuccess(9, 0, true)
    expect(result).toBeGreaterThan(27)
    expect(result).toBeLessThan(50)
  })
})

describe('calc2D6Distribution', () => {
  it('returns 11 entries (2 through 12)', () => {
    const dist = calc2D6Distribution()
    expect(dist).toHaveLength(11)
    expect(dist[0].value).toBe(2)
    expect(dist[10].value).toBe(12)
  })

  it('has correct probability for 7 (16.67%)', () => {
    const dist = calc2D6Distribution()
    const seven = dist.find((d) => d.value === 7)
    expect(seven?.probability).toBe(16.67)
  })

  it('cumulative for 12 is ~100%', () => {
    const dist = calc2D6Distribution()
    expect(dist[10].cumulative).toBeCloseTo(100, 0)
  })

  it('probability for 2 and 12 are equal (2.78%)', () => {
    const dist = calc2D6Distribution()
    expect(dist[0].probability).toBe(2.78)
    expect(dist[10].probability).toBe(2.78)
  })
})

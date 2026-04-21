import { describe, it, expect } from 'vitest'
import { parseStratagemEffect, isStratagemRelevant } from './stratagemEffectParser'
import type { Stratagem } from '@/types/gameData.types'

function makeStrat(overrides: Partial<Stratagem> = {}): Stratagem {
  return {
    id: 's1',
    name: 'Test Strat',
    type: 'Battle Tactic',
    cpCost: 1,
    legend: '',
    turn: 'Your turn',
    phase: 'Shooting phase',
    description: '',
    ...overrides,
  }
}

describe('parseStratagemEffect', () => {
  it('+1 to hit rolls', () => {
    const effect = parseStratagemEffect(makeStrat({ description: 'Until the end of the phase, add 1 to hit rolls made for that unit.' }))
    expect(effect).not.toBeNull()
    expect(effect!.modifiers).toContainEqual({ phase: 'hit', value: 1 })
  })

  it('+1 to wound rolls', () => {
    const effect = parseStratagemEffect(makeStrat({ description: 'Add 1 to wound rolls made by this unit.' }))
    expect(effect).not.toBeNull()
    expect(effect!.modifiers).toContainEqual({ phase: 'wound', value: 1 })
  })

  it('-1 to hit rolls (defender)', () => {
    const effect = parseStratagemEffect(makeStrat({ description: 'Subtract 1 from hit rolls targeting that unit.' }))
    expect(effect).not.toBeNull()
    expect(effect!.modifiers).toContainEqual({ phase: 'hit', value: -1 })
  })

  it('improve AP by 1', () => {
    const effect = parseStratagemEffect(makeStrat({ description: 'Improve the Armour Penetration of attacks by 1.' }))
    expect(effect).not.toBeNull()
    expect(effect!.modifiers).toContainEqual({ phase: 'save', value: -1 })
  })

  it('+1 to save rolls', () => {
    const effect = parseStratagemEffect(makeStrat({ description: 'Add 1 to saving throws made for that unit.' }))
    expect(effect).not.toBeNull()
    expect(effect!.modifiers).toContainEqual({ phase: 'save', value: 1 })
  })

  it('feel no pain', () => {
    const effect = parseStratagemEffect(makeStrat({ description: 'Until the end of the phase, models in that unit have a Feel No Pain 5+ ability.' }))
    expect(effect).not.toBeNull()
    expect(effect!.feelNoPain).toBe(5)
  })

  it('+1 damage', () => {
    const effect = parseStratagemEffect(makeStrat({ description: 'Add 1 to the Damage characteristic of those attacks.' }))
    expect(effect).not.toBeNull()
    expect(effect!.modifiers).toContainEqual({ phase: 'damage', value: 1 })
  })

  it('-1 damage (defender)', () => {
    const effect = parseStratagemEffect(makeStrat({ description: 'Reduce the damage of each attack by 1, to a minimum of 1.' }))
    expect(effect).not.toBeNull()
    expect(effect!.damageReduction).toBe(1)
  })

  it('invulnerable save', () => {
    const effect = parseStratagemEffect(makeStrat({ description: 'Until the end of the phase, that unit has an invulnerable save of 4+.' }))
    expect(effect).not.toBeNull()
    expect(effect!.invulnerable).toEqual({ value: 4 })
  })

  it('stealth / cover benefit', () => {
    const effect = parseStratagemEffect(makeStrat({ description: 'Until the end of the phase, that unit has the benefit of cover.' }))
    expect(effect).not.toBeNull()
    expect(effect!.stealth).toBe(true)
  })

  it('returns null for unparsable', () => {
    const effect = parseStratagemEffect(makeStrat({ description: 'Select one enemy unit within 12". That unit must take a Battle-shock test.' }))
    expect(effect).toBeNull()
  })

  it('handles HTML tags in description', () => {
    const effect = parseStratagemEffect(makeStrat({ description: '<p>Add <b>1</b> to <i>hit rolls</i> made for that unit.</p>' }))
    expect(effect).not.toBeNull()
    expect(effect!.modifiers).toContainEqual({ phase: 'hit', value: 1 })
  })

  it('multiple effects in one stratagem', () => {
    const effect = parseStratagemEffect(makeStrat({ description: 'Add 1 to hit rolls and add 1 to wound rolls made by that unit.' }))
    expect(effect).not.toBeNull()
    expect(effect!.modifiers).toContainEqual({ phase: 'hit', value: 1 })
    expect(effect!.modifiers).toContainEqual({ phase: 'wound', value: 1 })
  })
})

describe('isStratagemRelevant', () => {
  it('shooting phase relevant for ranged', () => {
    expect(isStratagemRelevant(makeStrat({ phase: 'Shooting phase' }), 'ranged')).toBe(true)
  })

  it('shooting phase not relevant for melee', () => {
    expect(isStratagemRelevant(makeStrat({ phase: 'Shooting phase' }), 'melee')).toBe(false)
  })

  it('fight phase relevant for melee', () => {
    expect(isStratagemRelevant(makeStrat({ phase: 'Fight phase' }), 'melee')).toBe(true)
  })

  it('any phase relevant for both', () => {
    expect(isStratagemRelevant(makeStrat({ phase: 'Any phase' }), 'ranged')).toBe(true)
    expect(isStratagemRelevant(makeStrat({ phase: 'Any phase' }), 'melee')).toBe(true)
  })

  it('command phase relevant for both (Battle Tactics)', () => {
    expect(isStratagemRelevant(makeStrat({ phase: 'Command phase' }), 'ranged')).toBe(true)
  })
})

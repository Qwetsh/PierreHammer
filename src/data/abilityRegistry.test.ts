import { describe, it, expect } from 'vitest'
import { lookupAbility, abilityRegistry } from './abilityRegistry'

describe('abilityRegistry', () => {
  it('has entries in the registry', () => {
    expect(Object.keys(abilityRegistry).length).toBeGreaterThan(0)
  })

  it('lookupAbility returns stealth effect', () => {
    const effect = lookupAbility('Stealth')
    expect(effect).toBeDefined()
    expect(effect!.stealth).toBe(true)
    expect(effect!.modifiers).toHaveLength(1)
    expect(effect!.modifiers![0]).toEqual({ phase: 'hit', value: -1, condition: 'ranged_only' })
  })

  it('lookupAbility returns feel no pain 5+', () => {
    const effect = lookupAbility('Feel No Pain 5+')
    expect(effect).toBeDefined()
    expect(effect!.feelNoPain).toBe(5)
  })

  it('lookupAbility returns feel no pain 6+', () => {
    expect(lookupAbility('Feel No Pain 6+')?.feelNoPain).toBe(6)
  })

  it('lookupAbility returns feel no pain 4+', () => {
    expect(lookupAbility('Feel No Pain 4+')?.feelNoPain).toBe(4)
  })

  it('lookupAbility is case-insensitive', () => {
    expect(lookupAbility('STEALTH')).toBeDefined()
    expect(lookupAbility('feel no pain 5+')).toBeDefined()
  })

  it('lookupAbility returns undefined for unknown ability', () => {
    expect(lookupAbility('Unknown Weird Ability')).toBeUndefined()
  })

  it('invulnerable save entries have correct values', () => {
    expect(lookupAbility('4+ invulnerable save')?.invulnerable?.value).toBe(4)
    expect(lookupAbility('5+ invulnerable save')?.invulnerable?.value).toBe(5)
  })

  it('damage reduction entry works', () => {
    expect(lookupAbility('Damage Reduction')?.damageReduction).toBe(1)
  })
})

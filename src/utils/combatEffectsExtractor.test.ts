import { describe, it, expect } from 'vitest'
import { extractCombatEffects, extractEnhancementEffects } from './combatEffectsExtractor'
import type { Datasheet, Enhancement } from '@/types/gameData.types'

function makeDatasheet(overrides: Partial<Datasheet> = {}): Datasheet {
  return {
    id: 'ds-1',
    name: 'Test Unit',
    factionId: 'test',
    sourceId: 'src-1',
    role: 'Troops',
    unitComposition: '',
    transport: '',
    leader: '',
    loadout: '',
    keywords: [],
    damagedDescription: '',
    damagedRange: '',
    profiles: [{ name: 'Test', M: '6"', T: '4', Sv: '3+', W: '2', Ld: '6+', OC: '1', invSv: '-', invSvDescr: '' }],
    weapons: [],
    abilities: [],
    pointOptions: [],
    ...overrides,
  }
}

describe('extractCombatEffects', () => {
  it('returns empty effect for datasheet with no abilities', () => {
    const ds = makeDatasheet()
    const effects = extractCombatEffects(ds)
    expect(effects).toEqual({})
  })

  it('extracts Stealth from registry', () => {
    const ds = makeDatasheet({
      abilities: [{ id: '1', name: 'Stealth', description: '', type: 'Core', parameter: '' }],
    })
    const effects = extractCombatEffects(ds)
    expect(effects.stealth).toBe(true)
    expect(effects.modifiers).toHaveLength(1)
    expect(effects.modifiers![0]).toEqual({ phase: 'hit', value: -1, condition: 'ranged_only' })
  })

  it('extracts Feel No Pain 5+ from registry', () => {
    const ds = makeDatasheet({
      abilities: [{ id: '2', name: 'Feel No Pain 5+', description: '', type: 'Core', parameter: '' }],
    })
    expect(extractCombatEffects(ds).feelNoPain).toBe(5)
  })

  it('extracts Feel No Pain from ability name via regex fallback', () => {
    const ds = makeDatasheet({
      abilities: [{ id: '3', name: 'Narthecium (Feel No Pain 6+)', description: '', type: 'Datasheet', parameter: '' }],
    })
    expect(extractCombatEffects(ds).feelNoPain).toBe(6)
  })

  it('extracts Feel No Pain from description as last resort', () => {
    const ds = makeDatasheet({
      abilities: [{
        id: '4',
        name: "Omnissiah's Blessing",
        description: 'that model has the Feel No Pain 5+ ability',
        type: 'Datasheet',
        parameter: '',
      }],
    })
    expect(extractCombatEffects(ds).feelNoPain).toBe(5)
  })

  it('extracts invulnerable save from profile', () => {
    const ds = makeDatasheet({
      profiles: [{ name: 'Cawl', M: '8"', T: '8', Sv: '2+', W: '10', Ld: '6+', OC: '3', invSv: '4', invSvDescr: '' }],
    })
    const effects = extractCombatEffects(ds)
    expect(effects.invulnerable).toEqual({ value: 4 })
  })

  it('invulnerable from profile: "-" means no invuln', () => {
    const ds = makeDatasheet({
      profiles: [{ name: 'Basic', M: '6"', T: '4', Sv: '3+', W: '2', Ld: '6+', OC: '1', invSv: '-', invSvDescr: '' }],
    })
    expect(extractCombatEffects(ds).invulnerable).toBeUndefined()
  })

  it('keeps best FnP when multiple abilities give FnP', () => {
    const ds = makeDatasheet({
      abilities: [
        { id: '1', name: 'Feel No Pain 5+', description: '', type: 'Core', parameter: '' },
        { id: '2', name: 'Feel No Pain 4+', description: '', type: 'Datasheet', parameter: '' },
      ],
    })
    expect(extractCombatEffects(ds).feelNoPain).toBe(4)
  })

  it('keeps best invulnerable when ability and profile both give one', () => {
    const ds = makeDatasheet({
      abilities: [{ id: '1', name: '4+ invulnerable save', description: '', type: 'Core', parameter: '' }],
      profiles: [{ name: 'Test', M: '6"', T: '4', Sv: '3+', W: '2', Ld: '6+', OC: '1', invSv: '5', invSvDescr: '' }],
    })
    expect(extractCombatEffects(ds).invulnerable?.value).toBe(4)
  })

  it('silently ignores unknown abilities', () => {
    const ds = makeDatasheet({
      abilities: [
        { id: '1', name: 'Some Weird Custom Ability', description: 'does stuff', type: 'Datasheet', parameter: '' },
        { id: '2', name: 'Stealth', description: '', type: 'Core', parameter: '' },
      ],
    })
    const effects = extractCombatEffects(ds)
    expect(effects.stealth).toBe(true)
    // No crash, unknown ability ignored
  })

  it('merges multiple abilities into one effect', () => {
    const ds = makeDatasheet({
      abilities: [
        { id: '1', name: 'Stealth', description: '', type: 'Core', parameter: '' },
        { id: '2', name: 'Feel No Pain 5+', description: '', type: 'Core', parameter: '' },
      ],
      profiles: [{ name: 'Test', M: '6"', T: '4', Sv: '3+', W: '2', Ld: '6+', OC: '1', invSv: '4', invSvDescr: '' }],
    })
    const effects = extractCombatEffects(ds)
    expect(effects.stealth).toBe(true)
    expect(effects.feelNoPain).toBe(5)
    expect(effects.invulnerable?.value).toBe(4)
    expect(effects.modifiers).toHaveLength(1)
  })
})

describe('extractEnhancementEffects', () => {
  function makeEnhancement(description: string): Enhancement {
    return { id: 'e-1', name: 'Test Enhancement', cost: 10, legend: '', description }
  }

  it('returns empty for enhancement with no parseable effects', () => {
    const effects = extractEnhancementEffects(makeEnhancement('Some fluff text with no mechanical effect.'))
    expect(effects).toEqual({})
  })

  it('extracts Feel No Pain from description', () => {
    const effects = extractEnhancementEffects(makeEnhancement('the bearer has the Feel No Pain 5+ ability.'))
    expect(effects.feelNoPain).toBe(5)
  })

  it('extracts invulnerable save', () => {
    const effects = extractEnhancementEffects(makeEnhancement('the bearer has a 4+ invulnerable save.'))
    expect(effects.invulnerable?.value).toBe(4)
  })

  it('extracts extra attacks', () => {
    const effects = extractEnhancementEffects(makeEnhancement('Add 1 to the Attacks characteristic of the bearer\'s melee weapons.'))
    expect(effects.extraAttacks).toBe(1)
  })

  it('extracts +1 to wound rolls', () => {
    const effects = extractEnhancementEffects(makeEnhancement('Each time the bearer makes an attack, add 1 to the wound roll.'))
    expect(effects.modifiers).toHaveLength(1)
    expect(effects.modifiers![0]).toEqual({ phase: 'wound', value: 1 })
  })

  it('extracts +1 to hit rolls', () => {
    const effects = extractEnhancementEffects(makeEnhancement('Add 1 to hit rolls for attacks made by this model.'))
    expect(effects.modifiers).toHaveLength(1)
    expect(effects.modifiers![0]).toEqual({ phase: 'hit', value: 1 })
  })

  it('extracts damage reduction', () => {
    const effects = extractEnhancementEffects(makeEnhancement('Each time an attack is allocated, reduce 1 from the Damage.'))
    expect(effects.damageReduction).toBe(1)
  })

  it('extracts stealth', () => {
    const effects = extractEnhancementEffects(makeEnhancement('This model has the Stealth ability.'))
    expect(effects.stealth).toBe(true)
  })

  it('extracts Mark of Devotion style: Add 1 to the Attacks', () => {
    const effects = extractEnhancementEffects(
      makeEnhancement('Add 1 to the Attacks characteristic of the bearer\'s melee weapons. While the bearer\'s unit is Righteous, add 2 to the Attacks characteristic.'),
    )
    expect(effects.extraAttacks).toBe(1)
  })

  it('extracts multiple effects from one enhancement', () => {
    const effects = extractEnhancementEffects(
      makeEnhancement('The bearer has a 4+ invulnerable save and the Feel No Pain 5+ ability. Add 1 to the Attacks characteristic.'),
    )
    expect(effects.invulnerable?.value).toBe(4)
    expect(effects.feelNoPain).toBe(5)
    expect(effects.extraAttacks).toBe(1)
  })
})

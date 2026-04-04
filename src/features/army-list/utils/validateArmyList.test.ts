import { validateArmyList } from './validateArmyList'
import type { Datasheet } from '@/types/gameData.types'

function makeUnit(overrides: Partial<Datasheet> = {}): Datasheet {
  return {
    id: 'ds-' + Math.random().toString(36).slice(2, 6),
    name: 'Test Unit',
    factionId: 'space-marines',
    sourceId: 'src-1',
    role: 'Troops',
    unitComposition: '5',
    transport: '',
    leader: '',
    loadout: '',
    keywords: [],
    damagedDescription: '',
    damagedRange: '',
    profiles: [],
    weapons: [],
    abilities: [],
    pointOptions: [],
    ...overrides,
  }
}

function makeBattleline(): Datasheet {
  return makeUnit({ keywords: [{ keyword: 'Battleline', model: '', isFactionKeyword: false }] })
}

function makeTransport(): Datasheet {
  return makeUnit({ keywords: [{ keyword: 'Dedicated Transport', model: '', isFactionKeyword: false }] })
}

function makeEpicHero(id: string, name: string): Datasheet {
  return makeUnit({ id, name, keywords: [{ keyword: 'Epic Hero', model: '', isFactionKeyword: false }] })
}

describe('validateArmyList', () => {
  it('returns valid for empty list', () => {
    const result = validateArmyList([])
    expect(result.valid).toBe(true)
    expect(result.violations).toHaveLength(0)
  })

  it('returns valid for list under limits', () => {
    const result = validateArmyList([makeBattleline(), makeBattleline(), makeUnit()])
    expect(result.valid).toBe(true)
  })

  it('flags too many Battleline units', () => {
    const units = Array.from({ length: 7 }, () => makeBattleline())
    const result = validateArmyList(units)
    expect(result.valid).toBe(false)
    expect(result.violations.some((v) => v.type === 'max-battleline')).toBe(true)
  })

  it('flags too many Dedicated Transports', () => {
    const units = Array.from({ length: 7 }, () => makeTransport())
    const result = validateArmyList(units)
    expect(result.valid).toBe(false)
    expect(result.violations.some((v) => v.type === 'max-transport')).toBe(true)
  })

  it('flags duplicate Epic Heroes', () => {
    const hero = makeEpicHero('hero-1', 'Calgar')
    const result = validateArmyList([hero, { ...hero }])
    expect(result.valid).toBe(false)
    expect(result.violations.some((v) => v.type === 'duplicate-epic-hero')).toBe(true)
  })

  it('allows different Epic Heroes', () => {
    const result = validateArmyList([
      makeEpicHero('hero-1', 'Calgar'),
      makeEpicHero('hero-2', 'Guilliman'),
    ])
    expect(result.valid).toBe(true)
  })

  it('flags too many enhancements', () => {
    const unit = makeUnit({
      abilities: [
        { id: 'e1', name: 'Enh1', description: '', type: 'Enhancement', parameter: '' },
        { id: 'e2', name: 'Enh2', description: '', type: 'Enhancement', parameter: '' },
      ],
    })
    const unit2 = makeUnit({
      abilities: [
        { id: 'e3', name: 'Enh3', description: '', type: 'Enhancement', parameter: '' },
        { id: 'e4', name: 'Enh4', description: '', type: 'enhancement', parameter: '' },
      ],
    })
    const result = validateArmyList([unit, unit2])
    expect(result.valid).toBe(false)
    expect(result.violations.some((v) => v.type === 'max-enhancements')).toBe(true)
  })

  it('returns multiple violations', () => {
    const hero = makeEpicHero('hero-1', 'Calgar')
    const units = [
      ...Array.from({ length: 7 }, () => makeBattleline()),
      hero,
      { ...hero },
    ]
    const result = validateArmyList(units)
    expect(result.violations.length).toBeGreaterThanOrEqual(2)
  })
})

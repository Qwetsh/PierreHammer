import type { Datasheet } from '@/types/gameData.types'

export type ViolationSeverity = 'error' | 'warning'

export interface Violation {
  type: string
  message: string
  severity: ViolationSeverity
}

export interface ValidationResult {
  valid: boolean
  violations: Violation[]
}

const MAX_BATTLELINE = 6
const MAX_DEDICATED_TRANSPORT = 6
const MAX_ENHANCEMENTS = 3

function hasKeyword(datasheet: Datasheet, keyword: string): boolean {
  return datasheet.keywords.some((k) => k.keyword.toUpperCase() === keyword.toUpperCase())
}

export function validateArmyList(datasheets: Datasheet[]): ValidationResult {
  const violations: Violation[] = []

  // Count Battleline
  const battlelineCount = datasheets.filter((ds) => hasKeyword(ds, 'BATTLELINE')).length
  if (battlelineCount > MAX_BATTLELINE) {
    violations.push({
      type: 'max-battleline',
      message: `Trop d'unités Battleline : ${battlelineCount}/${MAX_BATTLELINE} max.`,
      severity: 'error',
    })
  }

  // Count Dedicated Transport
  const transportCount = datasheets.filter((ds) => hasKeyword(ds, 'DEDICATED TRANSPORT')).length
  if (transportCount > MAX_DEDICATED_TRANSPORT) {
    violations.push({
      type: 'max-transport',
      message: `Trop de Transports Dédiés : ${transportCount}/${MAX_DEDICATED_TRANSPORT} max.`,
      severity: 'error',
    })
  }

  // Check Epic Heroes uniqueness
  const epicHeroes = datasheets.filter((ds) => hasKeyword(ds, 'EPIC HERO'))
  const seenIds = new Set<string>()
  for (const hero of epicHeroes) {
    if (seenIds.has(hero.id)) {
      violations.push({
        type: 'duplicate-epic-hero',
        message: `${hero.name} (Epic Hero) est en double.`,
        severity: 'error',
      })
    }
    seenIds.add(hero.id)
  }

  // Enhancement count (based on abilities of type 'enhancement')
  const enhancementCount = datasheets.reduce(
    (count, ds) => count + ds.abilities.filter((a) => a.type.toLowerCase() === 'enhancement').length,
    0,
  )
  if (enhancementCount > MAX_ENHANCEMENTS) {
    violations.push({
      type: 'max-enhancements',
      message: `Trop d'optimisations : ${enhancementCount}/${MAX_ENHANCEMENTS} max.`,
      severity: 'error',
    })
  }

  return {
    valid: violations.length === 0,
    violations,
  }
}

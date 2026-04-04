import type { ParseResult } from './types.js'

export function validate(result: ParseResult): { valid: boolean; issues: string[] } {
  const issues: string[] = []

  // Check each faction has at least 1 datasheet
  for (const faction of result.factions.values()) {
    if (faction.datasheetIds.length === 0) {
      issues.push(`Faction '${faction.name}' (${faction.id}) n'a aucune datasheet`)
    }
  }

  // Check each datasheet has a name and points
  for (const ds of result.datasheets.values()) {
    if (!ds.name) {
      issues.push(`Datasheet ${ds.id} n'a pas de nom`)
    }
    if (ds.pointOptions.length === 0) {
      issues.push(`Datasheet '${ds.name}' (${ds.id}) n'a pas d'options de points`)
    }
  }

  if (issues.length > 0) {
    console.log(`\n⚠️ Validation: ${issues.length} problèmes détectés`)
    for (const issue of issues.slice(0, 20)) {
      console.log(`  - ${issue}`)
    }
    if (issues.length > 20) {
      console.log(`  ... et ${issues.length - 20} autres`)
    }
  } else {
    console.log('✅ Validation: aucun problème détecté')
  }

  return { valid: issues.length === 0, issues }
}

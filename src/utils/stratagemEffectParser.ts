import type { Stratagem } from '@/types/gameData.types'
import type { AbilityEffect } from '@/types/combat.types'

/**
 * Strip HTML tags from text.
 */
function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

/**
 * Parse a stratagem's description to extract mechanical combat effects.
 * Best-effort: covers common patterns. Returns null for unparsable stratagems.
 */
export function parseStratagemEffect(stratagem: Stratagem): AbilityEffect | null {
  const text = stripHtml(stratagem.description).toLowerCase()
  const result: AbilityEffect = {}
  let found = false

  // +1 to hit rolls / add 1 to hit rolls
  if (/(\+1|add 1).{0,20}(hit roll|to hit)/i.test(text)) {
    result.modifiers = [...(result.modifiers ?? []), { phase: 'hit', value: 1 }]
    found = true
  }

  // -1 to hit rolls (defender)
  if (/(-1|subtract 1).{0,20}(hit roll|to hit)/i.test(text)) {
    result.modifiers = [...(result.modifiers ?? []), { phase: 'hit', value: -1 }]
    found = true
  }

  // +1 to wound rolls
  if (/(\+1|add 1).{0,20}(wound roll|to wound)/i.test(text)) {
    result.modifiers = [...(result.modifiers ?? []), { phase: 'wound', value: 1 }]
    found = true
  }

  // -1 to wound rolls (defender)
  if (/(-1|subtract 1).{0,20}(wound roll|to wound)/i.test(text)) {
    result.modifiers = [...(result.modifiers ?? []), { phase: 'wound', value: -1 }]
    found = true
  }

  // Improve AP by 1 / worsen AP by 1
  if (/improve.{0,30}(armour|ap).{0,30}(by\s+)?1/i.test(text) || /(\+1|add 1).{0,30}(ap|armour.penetration)/i.test(text)) {
    result.modifiers = [...(result.modifiers ?? []), { phase: 'save', value: -1 }]
    found = true
  }

  // +1 to save rolls (defender)
  if (/(\+1|add 1).{0,20}(save|saving)/i.test(text)) {
    result.modifiers = [...(result.modifiers ?? []), { phase: 'save', value: 1 }]
    found = true
  }

  // Feel No Pain
  const fnpMatch = text.match(/feel no pain\s*(\d)\+/i)
  if (fnpMatch) {
    result.feelNoPain = Number(fnpMatch[1])
    found = true
  }

  // Lethal hits
  if (/lethal hits/i.test(text)) {
    // This is a weapon keyword effect — we note it but apply as modifier since we can't add keywords
    // The caller will handle this separately
    found = true
  }

  // Sustained hits
  if (/sustained hits/i.test(text)) {
    found = true
  }

  // +1 to damage / add 1 to the damage
  if (/(\+1|add 1).{0,20}damage/i.test(text)) {
    result.modifiers = [...(result.modifiers ?? []), { phase: 'damage', value: 1 }]
    found = true
  }

  // -1 damage (defender)
  if (/reduce.{0,40}damage.{0,20}(by 1|minimum)/i.test(text) || /(-1|subtract 1).{0,20}damage/i.test(text) || /damage.{0,20}(-1|reduced by 1)/i.test(text)) {
    result.damageReduction = 1
    found = true
  }

  // Invulnerable save
  const invMatch = text.match(/invulnerable save\s*(?:of\s*)?(\d)\+/i)
  if (invMatch) {
    result.invulnerable = { value: Number(invMatch[1]) }
    found = true
  }

  // Stealth / -1 to ranged hit
  if (/stealth/i.test(text) || /(benefit|has).{0,20}cover/i.test(text)) {
    result.stealth = true
    found = true
  }

  return found ? result : null
}

/**
 * Check if a stratagem is relevant to a given weapon type (ranged/melee).
 */
export function isStratagemRelevant(stratagem: Stratagem, weaponType: 'ranged' | 'melee'): boolean {
  const phase = stratagem.phase.toLowerCase()
  if (phase.includes('any') || phase === '') return true
  if (weaponType === 'ranged' && phase.includes('shooting')) return true
  if (weaponType === 'melee' && (phase.includes('fight') || phase.includes('combat'))) return true
  // Also include if the phase is generic (command, movement...)
  if (phase.includes('command') || phase.includes('battle')) return true
  return false
}

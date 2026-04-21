import type { Datasheet, Enhancement } from '@/types/gameData.types'

export function isCharacter(ds: Datasheet | undefined): boolean {
  if (!ds) return false
  return ds.keywords.some((k) => k.keyword.toUpperCase() === 'CHARACTER')
}

/** Strip HTML tags from a string */
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '')
}

/** Normalize for comparison: uppercase + strip accents */
function normalize(s: string): string {
  return s
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

export function canEquipEnhancement(enh: Enhancement, ds: Datasheet): boolean {
  // Strip HTML first, then match the restriction pattern
  const cleanDesc = stripHtml(enh.description)
  const match = cleanDesc.match(/^(.+?)\s+model only\b/i)
  if (!match) return true

  const allowedNames = match[1]
    .split(/,\s*|\s+or\s+|\s+and\s+/i)
    .map((s) => normalize(s.trim()))
    .filter((s) => s.length > 0)

  const dsName = normalize(ds.name)
  const dsKeywords = ds.keywords.map((k) => normalize(k.keyword))

  return allowedNames.some(
    (allowed) =>
      dsName.includes(allowed) ||
      allowed.includes(dsName) ||
      dsKeywords.some((kw) => kw.includes(allowed) || allowed.includes(kw)),
  )
}

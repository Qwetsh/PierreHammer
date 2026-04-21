import type { WeaponKeywords, AntiKeyword } from '@/types/combat.types'

/**
 * Parse the comma-separated `abilities` string from a Weapon into structured keywords.
 * Case-insensitive, handles inconsistent spacing, returns {} for empty/unknown input.
 */
export function parseWeaponKeywords(abilitiesText: string): WeaponKeywords {
  if (!abilitiesText || !abilitiesText.trim()) return {}

  const result: WeaponKeywords = {}
  const segments = abilitiesText.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean)

  for (const seg of segments) {
    // --- Keywords with numeric/dice parameters ---

    // sustained hits N or sustained hits dX
    const sustainedMatch = seg.match(/^sustained hits\s+(\d+|d\d+(?:[+-]\d+)?)$/)
    if (sustainedMatch) {
      const val = sustainedMatch[1]
      result.sustainedHits = /^\d+$/.test(val) ? Number(val) : val
      continue
    }

    // rapid fire N or rapid fire dX+Y
    const rapidFireMatch = seg.match(/^rapid fire\s+(\d+|d\d+(?:[+-]\d+)?)$/)
    if (rapidFireMatch) {
      const val = rapidFireMatch[1]
      result.rapidFire = /^\d+$/.test(val) ? Number(val) : val
      continue
    }

    // melta N
    const meltaMatch = seg.match(/^melta\s+(\d+)$/)
    if (meltaMatch) {
      result.melta = Number(meltaMatch[1])
      continue
    }

    // anti-X N+ (e.g., anti-vehicle 4+, anti-infantry 3+, anti-psyker 2+)
    const antiMatch = seg.match(/^anti-([\w][\w\s]*?)\s*(\d)\+$/)
    if (antiMatch) {
      const entry: AntiKeyword = { keyword: antiMatch[1].trim(), threshold: Number(antiMatch[2]) }
      if (!result.anti) result.anti = []
      result.anti.push(entry)
      continue
    }

    // --- Boolean keywords ---
    if (seg === 'lethal hits') { result.lethalHits = true; continue }
    if (seg === 'devastating wounds') { result.devastatingWounds = true; continue }
    if (seg === 'twin-linked') { result.twinLinked = true; continue }
    if (seg === 'torrent') { result.torrent = true; continue }
    if (seg === 'blast') { result.blast = true; continue }
    if (seg === 'hazardous') { result.hazardous = true; continue }
    if (seg === 'heavy') { result.heavy = true; continue }
    if (seg === 'assault') { result.assault = true; continue }
    if (seg === 'lance') { result.lance = true; continue }
    if (seg === 'indirect fire') { result.indirectFire = true; continue }
    if (seg === 'precision') { result.precision = true; continue }
    if (seg === 'pistol') { result.pistol = true; continue }
    if (seg === 'ignores cover') { result.ignoresCover = true; continue }
    if (seg === 'one shot') { result.oneShot = true; continue }
    if (seg === 'extra attacks') { result.extraAttacks = true; continue }
    if (seg === 'conversion') { result.conversion = true; continue }

    // Unknown keyword — silently ignored
  }

  return result
}

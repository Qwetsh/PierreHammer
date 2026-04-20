import { readFile, writeFile, readdir } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse as csvParse } from 'csv-parse'
import { Readable } from 'node:stream'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUTPUT_DIR = join(__dirname, '..', '..', 'public', 'data')
const BASE_URL = 'https://wahapedia.ru/wh40k10ed'

interface RawStratagem {
  faction_id: string
  name: string
  id: string
  type: string
  cp_cost: string
  legend: string
  turn: string
  phase: string
  detachment: string
  detachment_id: string
  description: string
}

interface RawDetachmentAbility {
  id: string
  faction_id: string
  name: string
  legend: string
  description: string
  detachment: string
  detachment_id: string
}

interface RawEnhancement {
  faction_id: string
  id: string
  name: string
  cost: string
  detachment: string
  detachment_id: string
  legend: string
  description: string
}

interface Detachment {
  id: string
  name: string
  rule: { name: string; legend: string; description: string } | null
  stratagems: Array<{
    id: string
    name: string
    type: string
    cpCost: number
    legend: string
    turn: string
    phase: string
    description: string
  }>
  enhancements: Array<{
    id: string
    name: string
    cost: number
    legend: string
    description: string
  }>
}

async function downloadCsv(filename: string): Promise<string> {
  const url = `${BASE_URL}/${filename}`
  console.log(`  Téléchargement ${filename}...`)
  const response = await fetch(url)
  if (!response.ok) throw new Error(`HTTP ${response.status} pour ${filename}`)
  const text = await response.text()
  console.log(`  ✅ ${filename} (${(text.length / 1024).toFixed(1)} Ko)`)
  return text
}

async function parseCsv<T>(text: string): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const records: T[] = []
    const stream = Readable.from(text)
    stream
      .pipe(
        csvParse({
          columns: true,
          skip_empty_lines: true,
          relax_column_count: true,
          trim: true,
          delimiter: '|',
          bom: true,
          quote: false,
        }),
      )
      .on('data', (record: T) => records.push(record))
      .on('end', () => resolve(records))
      .on('error', (err) => reject(err))
  })
}

function buildDetachments(
  factionId: string,
  stratagems: RawStratagem[],
  abilities: RawDetachmentAbility[],
  enhancements: RawEnhancement[],
): Detachment[] {
  const fs = stratagems.filter((s) => s.faction_id === factionId)
  const fa = abilities.filter((a) => a.faction_id === factionId)
  const fe = enhancements.filter((e) => e.faction_id === factionId)

  const names = new Set<string>()
  for (const s of fs) if (s.detachment) names.add(s.detachment)
  for (const a of fa) if (a.detachment) names.add(a.detachment)
  for (const e of fe) if (e.detachment) names.add(e.detachment)

  return Array.from(names).sort().map((detName) => {
    const ability = fa.find((a) => a.detachment === detName)
    const rule = ability
      ? { name: ability.name, legend: ability.legend, description: ability.description }
      : null

    const detId = ability?.detachment_id
      || fs.find((s) => s.detachment === detName)?.detachment_id
      || fe.find((e) => e.detachment === detName)?.detachment_id
      || ''

    return {
      id: detId,
      name: detName,
      rule,
      stratagems: fs
        .filter((s) => s.detachment === detName)
        .map((s) => ({
          id: s.id,
          name: s.name,
          type: s.type,
          cpCost: parseInt(s.cp_cost, 10) || 0,
          legend: s.legend,
          turn: s.turn,
          phase: s.phase,
          description: s.description,
        })),
      enhancements: fe
        .filter((e) => e.detachment === detName)
        .map((e) => ({
          id: e.id,
          name: e.name,
          cost: parseInt(e.cost, 10) || 0,
          legend: e.legend,
          description: e.description,
        })),
    }
  })
}

function extractSlugFromLink(link: string): string {
  return link.replace(/\/$/, '').split('/').pop() || ''
}

export async function enrichDetachments(): Promise<void> {
  const startTime = performance.now()
  console.log('🔧 Enrichissement des données avec détachements\n')

  // Download CSVs (including Factions for ID mapping)
  const [factionsText, stratText, abilText, enhText] = await Promise.all([
    downloadCsv('Factions.csv'),
    downloadCsv('Stratagems.csv'),
    downloadCsv('Detachment_abilities.csv'),
    downloadCsv('Enhancements.csv'),
  ])

  // Parse
  console.log('\n📂 Parsing...')
  const rawFactions = await parseCsv<{ id: string; name: string; link: string }>(factionsText)
  const stratagems = await parseCsv<RawStratagem>(stratText)
  const abilities = await parseCsv<RawDetachmentAbility>(abilText)
  const enhancements = await parseCsv<RawEnhancement>(enhText)
  console.log(`  ${stratagems.length} stratagèmes, ${abilities.length} règles, ${enhancements.length} améliorations`)

  // Build mapping: wahapedia short ID -> slug (used in our JSON filenames)
  const idToSlug = new Map<string, string>()
  for (const f of rawFactions) {
    const slug = extractSlugFromLink(f.link)
    if (slug) idToSlug.set(f.id, slug)
  }
  console.log(`  ${idToSlug.size} mappings faction ID → slug`)

  // Also build reverse: slug -> Set<wahapedia IDs> for matching
  const slugToIds = new Map<string, string[]>()
  for (const [wId, slug] of idToSlug) {
    if (!slugToIds.has(slug)) slugToIds.set(slug, [])
    slugToIds.get(slug)!.push(wId)
  }

  // Read existing faction JSONs and enrich
  console.log('\n📝 Enrichissement des fichiers JSON...')
  const files = await readdir(OUTPUT_DIR)
  const jsonFiles = files.filter((f) => f.endsWith('.json') && f !== 'factions.json')

  let enriched = 0
  for (const jsonFile of jsonFiles) {
    const filePath = join(OUTPUT_DIR, jsonFile)
    const raw = await readFile(filePath, 'utf-8')
    const faction = JSON.parse(raw)

    // Find wahapedia IDs for this faction's slug
    const slug = jsonFile.replace('.json', '')
    const wahaIds = slugToIds.get(slug)

    if (!wahaIds || wahaIds.length === 0) {
      // Try matching by faction.id directly
      if (!faction.detachments) {
        faction.detachments = []
        await writeFile(filePath, JSON.stringify(faction, null, 2), 'utf-8')
      }
      continue
    }

    // Merge detachments from all wahapedia IDs that map to this slug
    const allDetachments: Detachment[] = []
    for (const wahaId of wahaIds) {
      allDetachments.push(...buildDetachments(wahaId, stratagems, abilities, enhancements))
    }

    faction.detachments = allDetachments
    await writeFile(filePath, JSON.stringify(faction, null, 2), 'utf-8')

    const detCount = allDetachments.length
    const stratCount = allDetachments.reduce((s, d) => s + d.stratagems.length, 0)
    const enhCount = allDetachments.reduce((s, d) => s + d.enhancements.length, 0)
    if (detCount > 0) {
      console.log(`  ✅ ${jsonFile}: ${detCount} détachements, ${stratCount} stratagèmes, ${enhCount} améliorations`)
      enriched++
    }
  }

  const elapsed = ((performance.now() - startTime) / 1000).toFixed(2)
  console.log(`\n🏁 ${enriched} factions enrichies en ${elapsed}s`)
}

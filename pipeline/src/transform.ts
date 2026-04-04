import { mkdir, writeFile, readFile } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { ParseResult } from './types.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const CSV_DIR = join(__dirname, '..', 'csv')
const OUTPUT_DIR = join(__dirname, '..', '..', 'public', 'data')
const IMAGE_CACHE = join(__dirname, '..', 'cache', 'image-cache.json')

async function loadImageCache(): Promise<Record<string, string | null>> {
  try {
    const raw = await readFile(IMAGE_CACHE, 'utf-8')
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

function toKebabCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

async function getLastUpdate(): Promise<string> {
  try {
    const content = await readFile(join(CSV_DIR, 'Last_update.csv'), 'utf-8')
    const lines = content.trim().split('\n')
    if (lines.length >= 2) {
      // First line is header, second line has the date
      const parts = lines[1].split('|')
      return parts[0]?.trim() || new Date().toISOString().split('T')[0]
    }
  } catch {
    // fallback
  }
  return new Date().toISOString().split('T')[0]
}

export async function generate(result: ParseResult): Promise<void> {
  const startTime = performance.now()
  await mkdir(OUTPUT_DIR, { recursive: true })

  const lastUpdate = await getLastUpdate()
  const imageCache = await loadImageCache()
  const imageCacheSize = Object.values(imageCache).filter(Boolean).length
  if (imageCacheSize > 0) {
    console.log(`🖼️ ${imageCacheSize} image URLs chargées depuis le cache`)
  }

  // Generate factions.json index
  const factionsIndex = {
    lastUpdate,
    factions: Array.from(result.factions.values()).map((f) => ({
      id: f.id,
      name: f.name,
      slug: toKebabCase(f.name),
      datasheetCount: f.datasheetIds.length,
    })),
  }

  const factionsPath = join(OUTPUT_DIR, 'factions.json')
  await writeFile(factionsPath, JSON.stringify(factionsIndex, null, 2), 'utf-8')
  console.log(`✅ factions.json (${factionsIndex.factions.length} factions, ${(JSON.stringify(factionsIndex).length / 1024).toFixed(1)} Ko)`)

  // Generate per-faction JSON files
  let totalDatasheets = 0

  for (const faction of result.factions.values()) {
    const slug = toKebabCase(faction.name)
    const datasheets = faction.datasheetIds
      .map((id) => result.datasheets.get(id))
      .filter(Boolean)
      .map((ds) => {
        const imgUrl = imageCache[ds.id]
        return imgUrl ? { ...ds, imageUrl: imgUrl } : ds
      })

    const factionData = {
      id: faction.id,
      name: faction.name,
      slug,
      datasheets,
    }

    const filePath = join(OUTPUT_DIR, `${slug}.json`)
    const json = JSON.stringify(factionData, null, 2)
    await writeFile(filePath, json, 'utf-8')
    totalDatasheets += datasheets.length
    console.log(`  ✅ ${slug}.json (${datasheets.length} datasheets, ${(json.length / 1024).toFixed(1)} Ko)`)
  }

  const elapsed = ((performance.now() - startTime) / 1000).toFixed(2)
  console.log(`\n📊 Génération terminée:`)
  console.log(`  Factions: ${result.factions.size}`)
  console.log(`  Datasheets total: ${totalDatasheets}`)
  console.log(`  Sortie: ${OUTPUT_DIR}`)
  console.log(`  Temps: ${elapsed}s`)
}

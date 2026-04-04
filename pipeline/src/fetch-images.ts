import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const CACHE_DIR = join(__dirname, '..', 'cache')
const CACHE_FILE = join(CACHE_DIR, 'image-cache.json')

const FANDOM_API = 'https://warhammer40k.fandom.com/api.php'
const SCALE_WIDTH = 400

// Throttle: max 1 request per 200ms to be polite
const DELAY_MS = 200

interface ImageCache {
  [datasheetId: string]: string | null // URL or null if not found
}

interface FandomQueryPage {
  pageid?: number
  ns: number
  title: string
  images?: { ns: number; title: string }[]
  missing?: string
}

interface FandomImageInfo {
  url: string
  width: number
  height: number
  size: number
}

interface FandomImagePage {
  pageid?: number
  title: string
  imageinfo?: FandomImageInfo[]
  missing?: string
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

async function loadCache(): Promise<ImageCache> {
  try {
    const raw = await readFile(CACHE_FILE, 'utf-8')
    return JSON.parse(raw) as ImageCache
  } catch {
    return {}
  }
}

async function saveCache(cache: ImageCache): Promise<void> {
  await mkdir(CACHE_DIR, { recursive: true })
  await writeFile(CACHE_FILE, JSON.stringify(cache, null, 2), 'utf-8')
}

async function fandomQuery(params: Record<string, string>): Promise<unknown> {
  const url = new URL(FANDOM_API)
  url.searchParams.set('format', 'json')
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v)
  }

  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`Fandom API ${res.status}`)
  return res.json()
}

/**
 * Try to find the best wiki page for a unit name.
 * Strategy: opensearch for fuzzy matching, then fall back to exact title.
 */
async function findWikiPage(unitName: string): Promise<string | null> {
  // Try opensearch first (handles fuzzy matching)
  const result = await fandomQuery({
    action: 'opensearch',
    search: unitName,
    limit: '5',
  }) as [string, string[]]

  if (result[1] && result[1].length > 0) {
    // Return the first match - opensearch returns the best match first
    return result[1][0]
  }
  return null
}

/**
 * Get image file names from a wiki page
 */
async function getPageImages(pageTitle: string): Promise<string[]> {
  const result = await fandomQuery({
    action: 'query',
    titles: pageTitle,
    prop: 'images',
    imlimit: '20',
  }) as { query: { pages: Record<string, FandomQueryPage> } }

  const pages = Object.values(result.query.pages)
  if (pages.length === 0 || pages[0].missing !== undefined) return []

  const images = pages[0].images ?? []
  return images
    .map((img) => img.title)
    .filter((title) => {
      const lower = title.toLowerCase()
      // Filter out common non-unit images
      return !lower.includes('icon') &&
        !lower.includes('logo') &&
        !lower.includes('banner') &&
        !lower.includes('symbol') &&
        !lower.includes('map') &&
        !lower.includes('chart') &&
        !lower.includes('diagram') &&
        !lower.includes('wiki') &&
        (lower.endsWith('.jpg') || lower.endsWith('.png') || lower.endsWith('.jpeg') || lower.endsWith('.webp'))
    })
}

/**
 * Get the direct URL for an image file
 */
async function getImageUrl(fileTitle: string): Promise<string | null> {
  const result = await fandomQuery({
    action: 'query',
    titles: fileTitle,
    prop: 'imageinfo',
    iiprop: 'url|size',
  }) as { query: { pages: Record<string, FandomImagePage> } }

  const pages = Object.values(result.query.pages)
  if (pages.length === 0) return null

  const page = pages[0]
  if (page.missing !== undefined || !page.imageinfo?.length) return null

  const info = page.imageinfo[0]
  // Use scaled version for efficiency
  const baseUrl = info.url
  if (baseUrl.includes('/revision/latest')) {
    return baseUrl.replace('/revision/latest', `/revision/latest/scale-to-width-down/${SCALE_WIDTH}`)
  }
  return baseUrl
}

/**
 * Score an image filename for relevance to the unit name.
 * Higher = better match.
 */
function scoreImage(imageTitle: string, unitName: string): number {
  const imgLower = imageTitle.toLowerCase().replace(/^file:/, '')
  const unitLower = unitName.toLowerCase()
  const unitWords = unitLower.split(/[\s-]+/).filter((w) => w.length > 2)

  let score = 0

  // Bonus: image name contains unit words
  for (const word of unitWords) {
    if (imgLower.includes(word)) score += 10
  }

  // Bonus: prefer miniature/model photos
  if (imgLower.includes('mini') || imgLower.includes('model')) score += 5
  if (imgLower.includes('squad') || imgLower.includes('unit')) score += 3

  // Penalty: artwork/concept usually less useful for identification
  if (imgLower.includes('artwork') || imgLower.includes('art')) score -= 2
  if (imgLower.includes('codex') || imgLower.includes('cover')) score -= 3

  // Prefer jpg (usually photos) over png (usually diagrams)
  if (imgLower.endsWith('.jpg') || imgLower.endsWith('.jpeg')) score += 1

  return score
}

interface DatasheetEntry {
  id: string
  name: string
}

export async function fetchImages(datasheets: DatasheetEntry[]): Promise<ImageCache> {
  const cache = await loadCache()
  const toFetch = datasheets.filter((ds) => !(ds.id in cache))

  if (toFetch.length === 0) {
    console.log(`✅ Toutes les ${datasheets.length} images sont en cache`)
    return cache
  }

  console.log(`🔍 ${toFetch.length} images à récupérer (${Object.keys(cache).length} en cache)`)

  let found = 0
  let notFound = 0

  for (let i = 0; i < toFetch.length; i++) {
    const ds = toFetch[i]
    const progress = `[${i + 1}/${toFetch.length}]`

    try {
      // Step 1: Find the wiki page
      const pageTitle = await findWikiPage(ds.name)
      await sleep(DELAY_MS)

      if (!pageTitle) {
        console.log(`  ${progress} ❌ ${ds.name} — page non trouvée`)
        cache[ds.id] = null
        notFound++
        continue
      }

      // Step 2: Get images from the page
      const imageFiles = await getPageImages(pageTitle)
      await sleep(DELAY_MS)

      if (imageFiles.length === 0) {
        console.log(`  ${progress} ❌ ${ds.name} — aucune image sur "${pageTitle}"`)
        cache[ds.id] = null
        notFound++
        continue
      }

      // Step 3: Pick the best image
      const scored = imageFiles
        .map((f) => ({ file: f, score: scoreImage(f, ds.name) }))
        .sort((a, b) => b.score - a.score)

      const bestFile = scored[0].file

      // Step 4: Get the direct URL
      const url = await getImageUrl(bestFile)
      await sleep(DELAY_MS)

      if (url) {
        cache[ds.id] = url
        found++
        console.log(`  ${progress} ✅ ${ds.name} → ${bestFile.replace('File:', '')}`)
      } else {
        cache[ds.id] = null
        notFound++
        console.log(`  ${progress} ❌ ${ds.name} — URL non résolue`)
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.log(`  ${progress} ⚠️ ${ds.name} — erreur: ${msg}`)
      cache[ds.id] = null
      notFound++
    }

    // Save cache periodically (every 50 units)
    if ((i + 1) % 50 === 0) {
      await saveCache(cache)
      console.log(`  💾 Cache sauvegardé (${i + 1}/${toFetch.length})`)
    }
  }

  await saveCache(cache)
  console.log(`\n📊 Résultat: ${found} trouvées, ${notFound} non trouvées`)

  return cache
}

/**
 * CLI: Run standalone to fetch images for all datasheets in existing JSON files
 */
async function main() {
  const outputDir = join(__dirname, '..', '..', 'public', 'data')
  const factionsIndex = JSON.parse(await readFile(join(outputDir, 'factions.json'), 'utf-8'))

  const allDatasheets: DatasheetEntry[] = []

  for (const faction of factionsIndex.factions) {
    const factionData = JSON.parse(await readFile(join(outputDir, `${faction.slug}.json`), 'utf-8'))
    for (const ds of factionData.datasheets) {
      allDatasheets.push({ id: ds.id, name: ds.name })
    }
  }

  console.log(`📋 ${allDatasheets.length} datasheets à traiter\n`)
  await fetchImages(allDatasheets)
}

// Run if called directly
if (process.argv[1]?.includes('fetch-images')) {
  main().catch((err) => {
    console.error('Erreur fatale:', err)
    process.exitCode = 1
  })
}

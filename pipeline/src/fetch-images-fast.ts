/**
 * Fast parallel image fetcher - processes remaining uncached datasheets
 * Uses batch concurrency (5 at a time) with 100ms delay between batches
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const CACHE_DIR = join(__dirname, '..', 'cache')
const CACHE_FILE = join(CACHE_DIR, 'image-cache.json')
const FANDOM_API = 'https://warhammer40k.fandom.com/api.php'
const SCALE_WIDTH = 400
const CONCURRENCY = 5
const BATCH_DELAY = 150

interface ImageCache {
  [datasheetId: string]: string | null
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

async function loadCache(): Promise<ImageCache> {
  try {
    return JSON.parse(await readFile(CACHE_FILE, 'utf-8'))
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
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`API ${res.status}`)
  return res.json()
}

function scoreImage(imageTitle: string, unitName: string): number {
  const imgLower = imageTitle.toLowerCase().replace(/^file:/, '')
  const unitWords = unitName.toLowerCase().split(/[\s-]+/).filter((w) => w.length > 2)
  let score = 0
  for (const word of unitWords) {
    if (imgLower.includes(word)) score += 10
  }
  if (imgLower.includes('mini') || imgLower.includes('model')) score += 5
  if (imgLower.includes('squad') || imgLower.includes('unit')) score += 3
  if (imgLower.includes('artwork') || imgLower.includes('art')) score -= 2
  if (imgLower.includes('codex') || imgLower.includes('cover')) score -= 3
  if (imgLower.endsWith('.jpg') || imgLower.endsWith('.jpeg')) score += 1
  return score
}

async function fetchOneUnit(name: string): Promise<string | null> {
  // Step 1: opensearch for page
  const search = await fandomQuery({ action: 'opensearch', search: name, limit: '3' }) as [string, string[]]
  if (!search[1]?.length) return null
  const pageTitle = search[1][0]

  // Step 2: get images
  const result = await fandomQuery({
    action: 'query', titles: pageTitle, prop: 'images', imlimit: '20',
  }) as { query: { pages: Record<string, { images?: { title: string }[]; missing?: string }> } }
  const page = Object.values(result.query.pages)[0]
  if (page.missing !== undefined || !page.images?.length) return null

  const filtered = page.images
    .map((img) => img.title)
    .filter((t) => {
      const l = t.toLowerCase()
      return !l.includes('icon') && !l.includes('logo') && !l.includes('banner') &&
        !l.includes('symbol') && !l.includes('map') && !l.includes('chart') &&
        !l.includes('diagram') && !l.includes('wiki') &&
        (l.endsWith('.jpg') || l.endsWith('.png') || l.endsWith('.jpeg') || l.endsWith('.webp'))
    })
  if (!filtered.length) return null

  const best = filtered.sort((a, b) => scoreImage(b, name) - scoreImage(a, name))[0]

  // Step 3: get URL
  const imgResult = await fandomQuery({
    action: 'query', titles: best, prop: 'imageinfo', iiprop: 'url|size',
  }) as { query: { pages: Record<string, { imageinfo?: { url: string }[]; missing?: string }> } }
  const imgPage = Object.values(imgResult.query.pages)[0]
  if (imgPage.missing !== undefined || !imgPage.imageinfo?.length) return null

  const url = imgPage.imageinfo[0].url
  return url.includes('/revision/latest')
    ? url.replace('/revision/latest', `/revision/latest/scale-to-width-down/${SCALE_WIDTH}`)
    : url
}

async function main() {
  const outputDir = join(__dirname, '..', '..', 'public', 'data')
  const factionsIndex = JSON.parse(await readFile(join(outputDir, 'factions.json'), 'utf-8'))

  const allDatasheets: { id: string; name: string }[] = []
  for (const faction of factionsIndex.factions) {
    const factionData = JSON.parse(await readFile(join(outputDir, `${faction.slug}.json`), 'utf-8'))
    for (const ds of factionData.datasheets) {
      allDatasheets.push({ id: ds.id, name: ds.name })
    }
  }

  const cache = await loadCache()
  const toFetch = allDatasheets.filter((ds) => !(ds.id in cache))

  console.log(`📋 ${allDatasheets.length} datasheets total`)
  console.log(`✅ ${Object.keys(cache).length} déjà en cache`)
  console.log(`🔍 ${toFetch.length} restantes à récupérer (${CONCURRENCY} en parallèle)\n`)

  if (toFetch.length === 0) {
    const found = Object.values(cache).filter(Boolean).length
    console.log(`Terminé ! ${found} images sur ${Object.keys(cache).length} datasheets`)
    return
  }

  let processed = 0
  let found = 0
  let errors = 0

  for (let i = 0; i < toFetch.length; i += CONCURRENCY) {
    const batch = toFetch.slice(i, i + CONCURRENCY)

    const results = await Promise.allSettled(
      batch.map(async (ds) => {
        try {
          const url = await fetchOneUnit(ds.name)
          cache[ds.id] = url
          if (url) found++
          return { id: ds.id, name: ds.name, url }
        } catch (err) {
          cache[ds.id] = null
          errors++
          return { id: ds.id, name: ds.name, url: null, error: err }
        }
      })
    )

    processed += batch.length
    for (const r of results) {
      if (r.status === 'fulfilled' && r.value.url) {
        process.stdout.write('.')
      } else {
        process.stdout.write('x')
      }
    }

    // Progress every 100
    if (processed % 100 < CONCURRENCY) {
      const total = toFetch.length
      const pct = ((processed / total) * 100).toFixed(0)
      console.log(` [${processed}/${total}] ${pct}% — ${found} trouvées`)
      await saveCache(cache)
    }

    await sleep(BATCH_DELAY)
  }

  await saveCache(cache)
  const totalFound = Object.values(cache).filter(Boolean).length
  console.log(`\n\n📊 Terminé ! ${totalFound} images sur ${Object.keys(cache).length} datasheets (${errors} erreurs)`)
}

main().catch((err) => {
  console.error('Erreur fatale:', err)
  process.exitCode = 1
})

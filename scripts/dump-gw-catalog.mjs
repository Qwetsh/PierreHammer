/**
 * One-time dump of Games Workshop product catalog via their public Algolia search API.
 * Filters for Warhammer 40,000 miniatureKit products only.
 *
 * Usage: node scripts/dump-gw-catalog.mjs
 * Output: scripts/gw-catalog-40k.json
 */

const APP_ID = 'M5ZIQZNQ2H'
const API_KEY = '92c6a8254f9d34362df8e6d96475e5d8'
const INDEX_EN = 'prod-lazarus-product-en-gb'
const INDEX_FR = 'prod-lazarus-product-fr-fr'
const HITS_PER_PAGE = 100 // Algolia max

function makeEndpoint(index) {
  return `https://${APP_ID}-dsn.algolia.net/1/indexes/${index}/query`
}

async function fetchPage(index, page) {
  const res = await fetch(makeEndpoint(index), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Algolia-Application-Id': APP_ID,
      'X-Algolia-API-Key': API_KEY,
    },
    body: JSON.stringify({
      query: '',
      hitsPerPage: HITS_PER_PAGE,
      page,
      filters: 'productType:miniatureKit',
      facetFilters: [['GameSystemsRoot.lvl0:Warhammer 40,000']],
      attributesToRetrieve: [
        'objectID',
        'name',
        'slug',
        'price',
        'ctPrice',
        'sku',
        'images',
        'productType',
        'material',
        'isAvailable',
        'isPreOrder',
        'isInStock',
        'GameSystemsRoot',
      ],
    }),
  })

  if (!res.ok) {
    throw new Error(`Algolia error ${res.status}: ${await res.text()}`)
  }
  return res.json()
}

async function fetchAll(index) {
  console.log(`Fetching ${index} page 0...`)
  const first = await fetchPage(index, 0)
  const totalPages = first.nbPages
  console.log(`  ${first.nbHits} products across ${totalPages} pages`)
  const allHits = [...first.hits]
  for (let page = 1; page < totalPages; page++) {
    console.log(`  Fetching page ${page}/${totalPages - 1}...`)
    const data = await fetchPage(index, page)
    allHits.push(...data.hits)
    await new Promise((r) => setTimeout(r, 200))
  }
  return allHits
}

async function main() {
  // Fetch both EN (for names) and FR (for EUR prices) indexes
  const [enHits, frHits] = await Promise.all([
    fetchAll(INDEX_EN),
    fetchAll(INDEX_FR),
  ])

  // Build objectID → EUR price map from FR index
  const eurPriceMap = new Map()
  for (const hit of frHits) {
    eurPriceMap.set(hit.objectID, hit.price)
  }
  console.log(`\nEN: ${enHits.length} products, FR: ${frHits.length} products`)
  console.log(`EUR prices mapped: ${eurPriceMap.size}`)

  const allHits = enHits

  // Non-faction lvl1 categories to skip when extracting faction
  const NON_FACTION_LVL1 = new Set([
    'Unit Type',
    'Commencez ici',
    'Start Here',
    'Boarding Actions',
    'Terrain - Killzones',
    'Get Started',
  ])
  // lvl2 values that are NOT real factions (category placeholders)
  const NON_FACTION_LVL2 = new Set([
    'Type d\'Unité',
    'Unit Type',
  ])

  // Normalize into a cleaner structure
  const products = allHits.map((hit) => {
    const gsr = hit.GameSystemsRoot ?? {}

    // Find the real faction from lvl1/lvl2 by skipping non-faction categories
    let faction = null
    let factionPath = null
    let category = null

    // lvl2 entries look like "Warhammer 40,000 > Armées de l'Imperium > Astra Militarum"
    // We want the one where the lvl1 parent is NOT "Unit Type" etc.
    for (const entry of gsr.lvl2 ?? []) {
      const parts = entry.split(' > ')
      if (parts.length >= 3 && !NON_FACTION_LVL1.has(parts[1]) && !NON_FACTION_LVL2.has(parts[2])) {
        faction = parts[2]
        factionPath = entry
        break
      }
    }

    // category from lvl3 (e.g. "Infanterie", "Véhicules")
    for (const entry of gsr.lvl3 ?? []) {
      const parts = entry.split(' > ')
      if (parts.length >= 4 && !NON_FACTION_LVL1.has(parts[1]) && !NON_FACTION_LVL2.has(parts[2])) {
        category = parts[3]
        break
      }
    }

    // Fallback: if no faction found in lvl2, try lvl1
    if (!faction) {
      for (const entry of gsr.lvl1 ?? []) {
        const parts = entry.split(' > ')
        if (parts.length >= 2 && !NON_FACTION_LVL1.has(parts[1])) {
          faction = parts[1]
          factionPath = entry
          break
        }
      }
    }

    // Use EUR price from FR index, fallback to GBP price from EN index
    const eurPrice = eurPriceMap.get(hit.objectID)

    return {
      id: hit.objectID,
      name: hit.name,
      slug: hit.slug,
      price: eurPrice ?? hit.price,
      currency: eurPrice !== undefined ? 'EUR' : (hit.ctPrice?.currencyCode ?? 'GBP'),
      sku: hit.sku,
      image: hit.images?.[0] ? `https://www.games-workshop.com${hit.images[0]}` : null,
      material: hit.material ?? [],
      available: hit.isAvailable ?? false,
      preOrder: hit.isPreOrder ?? false,
      inStock: hit.isInStock ?? false,
      gameSystem: gsr.lvl0?.[0] ?? null,
      faction,
      category,
      factionPath,
    }
  })

  const { writeFileSync } = await import('node:fs')
  const outPath = new URL('./gw-catalog-40k.json', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')
  writeFileSync(outPath, JSON.stringify(products, null, 2), 'utf-8')

  console.log(`\nDone! ${products.length} products saved to ${outPath}`)

  // Quick stats
  const factions = new Map()
  for (const p of products) {
    const f = p.faction ?? 'Unknown'
    factions.set(f, (factions.get(f) ?? 0) + 1)
  }
  console.log(`\nFactions found (${factions.size}):`)
  for (const [name, count] of [...factions.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${name}: ${count}`)
  }
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})

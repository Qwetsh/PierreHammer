/**
 * Script de génération des données de jeu à partir des CSV Wahapedia.
 *
 * Usage:
 *   node scripts/generate-data.mjs                    # Génère toutes les factions
 *   node scripts/generate-data.mjs SM ORK AE          # Génère seulement ces factions
 *   node scripts/generate-data.mjs --download          # Retélécharge les CSV puis génère
 *   node scripts/generate-data.mjs --download SM ORK   # Retélécharge + factions spécifiques
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { execSync } from 'child_process'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = join(__dirname, 'data')
const OUT_DIR = join(__dirname, '..', 'public', 'data')

// ─── CSV Parsing ────────────────────────────────────────────
function parseCSV(filename) {
  const raw = readFileSync(join(DATA_DIR, filename), 'utf-8')
  const lines = raw.replace(/^\uFEFF/, '').split('\n').filter(l => l.trim())
  const headers = lines[0].split('|').map(h => h.trim()).filter(Boolean)
  return lines.slice(1).map(line => {
    const values = line.split('|')
    const obj = {}
    headers.forEach((h, i) => { obj[h] = (values[i] || '').trim() })
    return obj
  })
}

// ─── Download CSVs ──────────────────────────────────────────
const CSV_FILES = [
  'Factions', 'Datasheets', 'Datasheets_abilities', 'Datasheets_keywords',
  'Datasheets_models', 'Datasheets_wargear', 'Datasheets_unit_composition',
  'Datasheets_models_cost', 'Abilities',
]

function downloadCSVs() {
  mkdirSync(DATA_DIR, { recursive: true })
  console.log('Téléchargement des CSV Wahapedia...')
  for (const name of CSV_FILES) {
    const url = `https://wahapedia.ru/wh40k10ed/${name}.csv`
    const out = join(DATA_DIR, `${name}.csv`)
    console.log(`  ${name}.csv`)
    execSync(`curl -sL "${url}" -o "${out}"`)
  }
  console.log('Téléchargement terminé.\n')
}

// ─── Slug helpers ───────────────────────────────────────────
function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

function factionSlug(link) {
  if (!link) return ''
  const parts = link.split('/')
  return parts[parts.length - 1] || parts[parts.length - 2]
}

// ─── Main generation ────────────────────────────────────────
function generate(factionFilter) {
  // Parse all CSVs
  const factions = parseCSV('Factions.csv')
  const datasheets = parseCSV('Datasheets.csv')
  const models = parseCSV('Datasheets_models.csv')
  const wargear = parseCSV('Datasheets_wargear.csv')
  const keywords = parseCSV('Datasheets_keywords.csv')
  const dsAbilities = parseCSV('Datasheets_abilities.csv')
  const abilities = parseCSV('Abilities.csv')
  const costs = parseCSV('Datasheets_models_cost.csv')
  const compositions = parseCSV('Datasheets_unit_composition.csv')

  // Build lookup maps
  const abilityMap = new Map()
  abilities.forEach(a => abilityMap.set(a.id, a))

  // Group by datasheet_id
  const group = (arr) => {
    const map = new Map()
    arr.forEach(row => {
      const id = row.datasheet_id
      if (!map.has(id)) map.set(id, [])
      map.get(id).push(row)
    })
    return map
  }

  const modelsByDs = group(models)
  const wargearByDs = group(wargear)
  const keywordsByDs = group(keywords)
  const abilitiesByDs = group(dsAbilities)
  const costsByDs = group(costs)
  const compByDs = group(compositions)

  // Filter factions
  const targetFactions = factionFilter.length > 0
    ? factions.filter(f => factionFilter.includes(f.id))
    : factions.filter(f => !['TL', 'UN', 'UA'].includes(f.id)) // Skip non-playable

  mkdirSync(OUT_DIR, { recursive: true })

  // Build faction index
  const factionIndex = {
    lastUpdate: new Date().toISOString().slice(0, 10),
    factions: [],
  }

  for (const faction of targetFactions) {
    const slug = factionSlug(faction.link)
    const factionDatasheets = datasheets.filter(ds =>
      ds.faction_id === faction.id && ds.legend !== 'true' && ds.virtual !== 'true'
    )

    console.log(`${faction.name} (${faction.id}): ${factionDatasheets.length} datasheets`)

    const dsOutput = factionDatasheets.map(ds => {
      // Profiles
      const profiles = (modelsByDs.get(ds.id) || []).map(m => ({
        name: m.name,
        M: m.M,
        T: m.T,
        Sv: m.Sv,
        W: m.W,
        Ld: m.Ld,
        OC: m.OC,
        invSv: m.inv_sv || '',
        invSvDescr: m.inv_sv_descr || '',
      }))

      // Weapons
      const weapons = (wargearByDs.get(ds.id) || []).map(w => ({
        name: w.name,
        type: w.type,
        range: w.range ? `${w.range}"` : 'Melee',
        A: w.A,
        BS_WS: w.BS_WS,
        S: w.S,
        AP: w.AP,
        D: w.D,
        abilities: w.description || '',
      }))

      // Keywords
      const kws = (keywordsByDs.get(ds.id) || []).map(k => ({
        keyword: k.keyword,
        model: k.model || '',
        isFactionKeyword: k.is_faction_keyword === 'true',
      }))

      // Abilities
      const abils = (abilitiesByDs.get(ds.id) || []).map(da => {
        const full = abilityMap.get(da.ability_id)
        return {
          id: da.ability_id || '',
          name: da.name || full?.name || '',
          description: da.description || full?.description || '',
          type: da.type || full?.type || '',
          parameter: da.parameter || full?.parameter || '',
        }
      }).filter(a => a.name)

      // Points
      const pointOptions = (costsByDs.get(ds.id) || []).map(c => ({
        cost: parseInt(c.cost, 10) || 0,
        models: c.description || '',
      }))

      // Unit composition
      const compLines = (compByDs.get(ds.id) || []).map(c => c.description).filter(Boolean)
      const unitComposition = compLines.join('\n') || ds.loadout || ''

      return {
        id: ds.id,
        name: ds.name,
        factionId: slug,
        sourceId: ds.source_id,
        role: ds.role || '',
        unitComposition,
        transport: ds.transport || '',
        leader: ds.leader_footer || '',
        loadout: ds.loadout || '',
        keywords: kws,
        damagedDescription: ds.damaged_description || '',
        damagedRange: ds.damaged_w || '',
        profiles,
        weapons,
        abilities: abils,
        pointOptions,
      }
    })

    // Write faction JSON
    const factionOut = {
      id: slug,
      name: faction.name,
      slug,
      datasheets: dsOutput,
    }
    writeFileSync(join(OUT_DIR, `${slug}.json`), JSON.stringify(factionOut, null, 2))

    factionIndex.factions.push({
      id: slug,
      name: faction.name,
      slug,
      datasheetCount: dsOutput.length,
    })
  }

  // Write index
  writeFileSync(join(OUT_DIR, 'factions.json'), JSON.stringify(factionIndex, null, 2))

  console.log(`\n✓ ${factionIndex.factions.length} factions générées dans public/data/`)
  console.log(`✓ Index mis à jour: public/data/factions.json`)
}

// ─── CLI ────────────────────────────────────────────────────
const args = process.argv.slice(2)
const shouldDownload = args.includes('--download')
const factionFilter = args.filter(a => !a.startsWith('--'))

if (shouldDownload) {
  downloadCSVs()
}

if (!existsSync(join(DATA_DIR, 'Datasheets.csv'))) {
  console.log('CSV non trouvés, téléchargement automatique...')
  downloadCSVs()
}

generate(factionFilter)

import { createReadStream } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse as csvParse } from 'csv-parse'
import type {
  RawFaction,
  RawDatasheet,
  RawAbility,
  RawKeyword,
  RawModel,
  RawWargear,
  RawPoints,
  RawStratagem,
  RawDetachmentAbility,
  RawEnhancement,
  Faction,
  Datasheet,
  Profile,
  Weapon,
  Ability,
  Keyword,
  PointOption,
  ParseResult,
} from './types.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const CSV_DIR = join(__dirname, '..', 'csv')

function csvPath(filename: string): string {
  return join(CSV_DIR, filename)
}

async function parseCsvFile<T>(filename: string): Promise<T[]> {
  const records: T[] = []
  const filePath = csvPath(filename)

  return new Promise((resolve, reject) => {
    createReadStream(filePath, 'utf-8')
      .pipe(
        csvParse({
          columns: true,
          skip_empty_lines: true,
          relax_column_count: true,
          trim: true,
          delimiter: '|',
        })
      )
      .on('data', (record: T) => records.push(record))
      .on('end', () => resolve(records))
      .on('error', (err) => reject(new Error(`Erreur parsing ${filename}: ${err.message}`)))
  })
}

function parseFactions(raw: RawFaction[]): Map<string, Faction> {
  const factions = new Map<string, Faction>()
  for (const r of raw) {
    factions.set(r.id, {
      id: r.id,
      name: r.name,
      link: r.link,
      datasheetIds: [],
    })
  }
  return factions
}

function parseProfiles(rawModels: RawModel[], datasheetId: string): Profile[] {
  return rawModels
    .filter((m) => m.datasheet_id === datasheetId)
    .map((m) => ({
      name: m.name,
      M: m.M,
      T: m.T,
      Sv: m.Sv,
      W: m.W,
      Ld: m.Ld,
      OC: m.OC,
      invSv: m.inv_sv,
      invSvDescr: m.inv_sv_descr,
    }))
}

function parseWeapons(rawWargear: RawWargear[], datasheetId: string): Weapon[] {
  return rawWargear
    .filter((w) => w.datasheet_id === datasheetId)
    .map((w) => ({
      name: w.name,
      type: w.type,
      range: w.range,
      A: w.A,
      BS_WS: w.BS_WS,
      S: w.S,
      AP: w.AP,
      D: w.D,
      abilities: w.abilities,
    }))
}

function parseAbilities(rawAbilities: RawAbility[], datasheetId: string): Ability[] {
  return rawAbilities
    .filter((a) => a.datasheet_id === datasheetId)
    .map((a) => ({
      id: a.id,
      name: a.name,
      description: a.description,
      type: a.type,
      parameter: a.parameter,
    }))
}

function parseKeywords(rawKeywords: RawKeyword[], datasheetId: string): Keyword[] {
  return rawKeywords
    .filter((k) => k.datasheet_id === datasheetId)
    .map((k) => ({
      keyword: k.keyword,
      model: k.model,
      isFactionKeyword: k.is_faction_keyword === 'true',
    }))
}

function parsePointOptions(rawPoints: RawPoints[], datasheetId: string): PointOption[] {
  return rawPoints
    .filter((p) => p.datasheet_id === datasheetId)
    .map((p) => ({
      cost: parseInt(p.cost, 10) || 0,
      models: p.models,
    }))
}

export async function parseData(): Promise<ParseResult> {
  const startTime = performance.now()
  const errors: string[] = []
  const warnings: string[] = []

  console.log('📂 Parsing des fichiers CSV...\n')

  // Parse all CSV files
  let rawFactions: RawFaction[]
  let rawDatasheets: RawDatasheet[]
  let rawAbilities: RawAbility[]
  let rawKeywords: RawKeyword[]
  let rawModels: RawModel[]
  let rawWargear: RawWargear[]
  let rawPoints: RawPoints[]
  let rawStratagems: RawStratagem[]
  let rawDetachmentAbilities: RawDetachmentAbility[]
  let rawEnhancements: RawEnhancement[]

  try {
    console.log('  Parsing Factions.csv...')
    rawFactions = await parseCsvFile<RawFaction>('Factions.csv')
    console.log(`  ✅ ${rawFactions.length} factions`)

    console.log('  Parsing Datasheets.csv...')
    rawDatasheets = await parseCsvFile<RawDatasheet>('Datasheets.csv')
    console.log(`  ✅ ${rawDatasheets.length} datasheets`)

    console.log('  Parsing Abilities.csv...')
    rawAbilities = await parseCsvFile<RawAbility>('Abilities.csv')
    console.log(`  ✅ ${rawAbilities.length} abilities`)

    console.log('  Parsing Keywords.csv...')
    rawKeywords = await parseCsvFile<RawKeyword>('Keywords.csv')
    console.log(`  ✅ ${rawKeywords.length} keywords`)

    console.log('  Parsing Models.csv...')
    rawModels = await parseCsvFile<RawModel>('Models.csv')
    console.log(`  ✅ ${rawModels.length} models`)

    console.log('  Parsing Wargear.csv...')
    rawWargear = await parseCsvFile<RawWargear>('Wargear.csv')
    console.log(`  ✅ ${rawWargear.length} wargear`)

    console.log('  Parsing Datasheets_points.csv...')
    rawPoints = await parseCsvFile<RawPoints>('Datasheets_points.csv')
    console.log(`  ✅ ${rawPoints.length} point options`)

    console.log('  Parsing Stratagems.csv...')
    rawStratagems = await parseCsvFile<RawStratagem>('Stratagems.csv')
    console.log(`  ✅ ${rawStratagems.length} stratagems`)

    console.log('  Parsing Detachment_abilities.csv...')
    rawDetachmentAbilities = await parseCsvFile<RawDetachmentAbility>('Detachment_abilities.csv')
    console.log(`  ✅ ${rawDetachmentAbilities.length} detachment abilities`)

    console.log('  Parsing Enhancements.csv...')
    rawEnhancements = await parseCsvFile<RawEnhancement>('Enhancements.csv')
    console.log(`  ✅ ${rawEnhancements.length} enhancements`)
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error(`\n❌ Erreur fatale de parsing: ${msg}`)
    process.exitCode = 1
    return { factions: new Map(), datasheets: new Map(), stratagems: [], detachmentAbilities: [], enhancements: [], errors: [msg], warnings: [] }
  }

  // Build faction map
  const factions = parseFactions(rawFactions)

  // Build datasheet map with linked entities
  const datasheets = new Map<string, Datasheet>()
  console.log('\n🔗 Liaison des entités...')

  for (const raw of rawDatasheets) {
    // Validate faction exists
    if (!factions.has(raw.faction_id)) {
      warnings.push(`Datasheet '${raw.name}' (${raw.id}) référence faction_id '${raw.faction_id}' inexistante`)
    } else {
      factions.get(raw.faction_id)!.datasheetIds.push(raw.id)
    }

    const datasheet: Datasheet = {
      id: raw.id,
      name: raw.name,
      factionId: raw.faction_id,
      sourceId: raw.source_id,
      role: raw.role,
      unitComposition: raw.unit_composition,
      transport: raw.transport,
      leader: raw.leader,
      loadout: raw.loadout,
      keywords: parseKeywords(rawKeywords, raw.id),
      damagedDescription: raw.damaged_description,
      damagedRange: raw.damaged_range,
      profiles: parseProfiles(rawModels, raw.id),
      weapons: parseWeapons(rawWargear, raw.id),
      abilities: parseAbilities(rawAbilities, raw.id),
      pointOptions: parsePointOptions(rawPoints, raw.id),
    }

    datasheets.set(raw.id, datasheet)
  }

  // Validate orphan references
  const datasheetIds = new Set(datasheets.keys())

  for (const ability of rawAbilities) {
    if (!datasheetIds.has(ability.datasheet_id)) {
      warnings.push(`Ability '${ability.name}' (${ability.id}) référence datasheet_id '${ability.datasheet_id}' inexistant`)
    }
  }

  for (const keyword of rawKeywords) {
    if (!datasheetIds.has(keyword.datasheet_id)) {
      warnings.push(`Keyword '${keyword.keyword}' référence datasheet_id '${keyword.datasheet_id}' inexistant`)
    }
  }

  // Check datasheets without faction
  for (const [, ds] of datasheets) {
    if (!ds.factionId) {
      errors.push(`Datasheet '${ds.name}' (${ds.id}) n'a pas de faction`)
    }
  }

  // Summary
  const elapsed = ((performance.now() - startTime) / 1000).toFixed(2)
  console.log(`\n📊 Résumé du parsing:`)
  console.log(`  Factions: ${factions.size}`)
  console.log(`  Datasheets: ${datasheets.size}`)
  console.log(`  Erreurs: ${errors.length}`)
  console.log(`  Warnings: ${warnings.length}`)
  console.log(`  Temps: ${elapsed}s`)

  if (warnings.length > 0) {
    console.log(`\n⚠️ Warnings (${warnings.length}):`)
    for (const w of warnings.slice(0, 20)) {
      console.log(`  - ${w}`)
    }
    if (warnings.length > 20) {
      console.log(`  ... et ${warnings.length - 20} autres`)
    }
  }

  if (errors.length > 0) {
    console.log(`\n❌ Erreurs (${errors.length}):`)
    for (const e of errors) {
      console.log(`  - ${e}`)
    }
    process.exitCode = 1
  }

  return { factions, datasheets, stratagems: rawStratagems, detachmentAbilities: rawDetachmentAbilities, enhancements: rawEnhancements, errors, warnings }
}

export async function parse(): Promise<void> {
  await parseData()
}

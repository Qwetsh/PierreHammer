import { readFile, writeFile } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { download } from './download.js'
import { parseData } from './parse.js'
import { generate } from './transform.js'
import { validate } from './validate.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const LAST_UPDATE_FILE = join(__dirname, '..', '.last-update')
const REMOTE_URL = 'https://wahapedia.ru/wh40k10ed/Last_update.csv'

async function getLocalDate(): Promise<string | null> {
  try {
    const content = await readFile(LAST_UPDATE_FILE, 'utf-8')
    return content.trim()
  } catch {
    return null
  }
}

async function getRemoteDate(): Promise<string> {
  const response = await fetch(REMOTE_URL)
  if (!response.ok) {
    throw new Error(`Impossible de télécharger Last_update.csv: HTTP ${response.status}`)
  }
  const content = await response.text()
  const lines = content.trim().split('\n')
  if (lines.length >= 2) {
    const parts = lines[1].split('|')
    return parts[0]?.trim() || ''
  }
  return ''
}

async function saveLocalDate(date: string): Promise<void> {
  await writeFile(LAST_UPDATE_FILE, date, 'utf-8')
}

export async function checkUpdate(): Promise<void> {
  console.log('🔍 Vérification des mises à jour Wahapedia...\n')

  let remoteDate: string
  try {
    remoteDate = await getRemoteDate()
    console.log(`  Date distante: ${remoteDate}`)
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error(`❌ ${msg}`)
    process.exitCode = 1
    return
  }

  const localDate = await getLocalDate()
  console.log(`  Date locale:   ${localDate || '(aucune)'}`)

  if (localDate === remoteDate) {
    console.log(`\n✅ Les données sont à jour (dernière mise à jour: ${remoteDate}). Aucune action nécessaire.`)
    return
  }

  console.log(`\n🆕 Nouvelle mise à jour détectée ! Lancement du pipeline...\n`)

  try {
    console.log('━━━ Étape 1: Download ━━━')
    await download()
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error(`\n❌ Pipeline arrêté: ${msg}`)
    process.exitCode = 1
    return
  }

  console.log('\n━━━ Étape 2: Parse ━━━')
  const result = await parseData()

  if (result.errors.length > 0) {
    console.error('\n❌ Pipeline arrêté: erreurs de parsing')
    process.exitCode = 1
    return
  }

  console.log('\n━━━ Étape 3: Validate ━━━')
  const { valid, issues } = validate(result)
  // Allow known issues (some datasheets legitimately have no points) but block if too many
  const criticalIssues = issues.filter((i) => !i.includes("n'a pas d'options de points") && !i.includes("n'a aucune datasheet"))
  if (criticalIssues.length > 0) {
    console.error(`\n❌ Pipeline arrêté: ${criticalIssues.length} problème(s) critique(s) de validation`)
    for (const issue of criticalIssues) console.error(`  - ${issue}`)
    process.exitCode = 1
    return
  }

  console.log('\n━━━ Étape 4: Generate ━━━')
  await generate(result)

  await saveLocalDate(remoteDate)
  console.log(`\n🏁 Mise à jour terminée. Date sauvegardée: ${remoteDate}`)
}

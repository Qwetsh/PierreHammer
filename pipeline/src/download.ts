import { mkdir, writeFile } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const BASE_URL = 'https://wahapedia.ru/wh40k10ed'

const CSV_FILES = [
  'Factions.csv',
  'Datasheets.csv',
  'Abilities.csv',
  'Keywords.csv',
  'Models.csv',
  'Wargear.csv',
  'Datasheets_points.csv',
  'Last_update.csv',
  'Stratagems.csv',
  'Detachment_abilities.csv',
  'Enhancements.csv',
] as const

const __dirname = dirname(fileURLToPath(import.meta.url))
const CSV_DIR = join(__dirname, '..', 'csv')

function looksLikeCsv(content: string): boolean {
  const firstLine = content.split('\n')[0] ?? ''
  return firstLine.includes('|') || firstLine.includes(',') || firstLine.includes('\t')
}

async function downloadFile(filename: string, index: number, total: number): Promise<boolean> {
  const url = `${BASE_URL}/${filename}`
  console.log(`Téléchargement [${index + 1}/${total}]: ${filename}...`)

  try {
    const response = await fetch(url)

    if (!response.ok) {
      console.error(`  ❌ Erreur téléchargement ${filename}: HTTP ${response.status}`)
      return false
    }

    const content = await response.text()

    if (!looksLikeCsv(content)) {
      console.error(`  ⚠️ ${filename}: le contenu ne ressemble pas à du CSV`)
      return false
    }

    const filePath = join(CSV_DIR, filename)
    await writeFile(filePath, content, 'utf-8')
    console.log(`  ✅ ${filename} (${(content.length / 1024).toFixed(1)} Ko)`)
    return true
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error(`  ❌ Erreur téléchargement ${filename}: ${message}`)
    return false
  }
}

export async function download(): Promise<void> {
  await mkdir(CSV_DIR, { recursive: true })

  let successCount = 0
  const total = CSV_FILES.length

  for (let i = 0; i < CSV_FILES.length; i++) {
    const success = await downloadFile(CSV_FILES[i], i, total)
    if (success) successCount++
  }

  console.log(`\n📊 Résumé: ${successCount}/${total} fichiers téléchargés avec succès`)

  if (successCount < total) {
    process.exitCode = 1
  }
}

import { download } from './download.js'
import { parse, parseData } from './parse.js'
import { generate } from './transform.js'
import { validate } from './validate.js'
import { checkUpdate } from './check-update.js'
import { fetchImages } from './fetch-images.js'
import { enrichDetachments } from './enrich-detachments.js'

async function pipeline(): Promise<void> {
  const startTime = performance.now()
  console.log('🚀 Pipeline complet: download → parse → generate\n')

  console.log('━━━ Étape 1: Download ━━━')
  await download()

  console.log('\n━━━ Étape 2: Parse ━━━')
  const result = await parseData()

  if (result.errors.length > 0) {
    console.error('\n❌ Pipeline arrêté: erreurs de parsing')
    process.exitCode = 1
    return
  }

  console.log('\n━━━ Étape 3: Validate ━━━')
  validate(result)

  console.log('\n━━━ Étape 4: Generate ━━━')
  await generate(result)

  const elapsed = ((performance.now() - startTime) / 1000).toFixed(2)
  console.log(`\n🏁 Pipeline terminé en ${elapsed}s`)
}

const commands: Record<string, () => Promise<void>> = {
  download,
  parse,
  pipeline,
  generate: async () => {
    const result = await parseData()
    await generate(result)
  },
  'fetch-images': async () => {
    const result = await parseData()
    const allDatasheets = Array.from(result.datasheets.values()).map((ds) => ({
      id: ds.id,
      name: ds.name,
    }))
    console.log(`📋 ${allDatasheets.length} datasheets à traiter\n`)
    await fetchImages(allDatasheets)
    console.log('\n💡 Relancez "generate" pour injecter les URLs dans les JSON')
  },
  'check-update': checkUpdate,
  'enrich-detachments': enrichDetachments,
}

async function main() {
  const command = process.argv[2]

  if (!command || !commands[command]) {
    console.log('Usage: tsx src/index.ts <command>')
    console.log('Commandes disponibles:')
    console.log('  download       Télécharger les CSV Wahapedia')
    console.log('  parse          Parser les CSV et lier les entités')
    console.log('  generate       Générer les JSON par faction')
    console.log('  pipeline       Exécuter le pipeline complet (download → parse → generate)')
    console.log('  fetch-images   Récupérer les images depuis le Wiki Fandom 40k')
    console.log('  check-update   Vérifier les mises à jour et relancer si nécessaire')
    process.exitCode = 1
    return
  }

  await commands[command]()
}

main().catch((error) => {
  console.error('Erreur fatale:', error)
  process.exitCode = 1
})

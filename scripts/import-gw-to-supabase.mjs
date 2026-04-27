/**
 * Import GW catalog products into Supabase gw_products table.
 * Usage: node scripts/import-gw-to-supabase.mjs
 */

import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://tppecozmygtjmbcdqgfc.supabase.co'
// Use the service role key for bulk insert (bypasses RLS)
// Fallback to anon key from .env
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRwcGVjb3pteWd0am1iY2RxZ2ZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxODQzMjUsImV4cCI6MjA4NDc2MDMyNX0.GNp7ztQPodSKkyeYF32Wvt8-CFjEvl5g1iZMKFzyZ2I'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

const catalog = JSON.parse(readFileSync(new URL('./gw-catalog-40k.json', import.meta.url), 'utf-8'))

const rows = catalog.map((p) => ({
  gw_id: p.id,
  name: p.name,
  slug: p.slug,
  price: p.price,
  currency: p.currency,
  sku: p.sku,
  image_url: p.image,
  faction: p.faction,
  category: p.category,
  faction_path: p.factionPath,
  available: p.available,
}))

console.log(`Importing ${rows.length} products...`)

// Supabase REST API has a limit, batch by 200
const BATCH = 200
let imported = 0

for (let i = 0; i < rows.length; i += BATCH) {
  const batch = rows.slice(i, i + BATCH)
  const { error } = await supabase
    .from('gw_products')
    .upsert(batch, { onConflict: 'gw_id' })

  if (error) {
    console.error(`Batch ${i / BATCH} failed:`, error.message)
    process.exit(1)
  }
  imported += batch.length
  console.log(`  ${imported}/${rows.length}`)
}

console.log(`Done! ${imported} products imported.`)

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

interface GwProduct {
  gw_id: string
  name: string
  price: number
  image_url: string | null
  faction: string | null
}

/** Cache for resolved lookups so we don't rescan 928 entries every render */
const lookupCache = new Map<string, number | null>()

interface GwPriceState {
  /** name (lowercased) → price EUR */
  priceByName: Record<string, number>
  /** All products for advanced lookups */
  products: GwProduct[]
  loaded: boolean
  loading: boolean
  loadPrices: () => Promise<void>
  /** Get GW retail price for a datasheet by name (cached) */
  getPrice: (datasheetName: string) => number | null
  /** Get total collection value */
  getCollectionValue: (
    items: Record<string, { datasheetId: string; factionId: string; squads: unknown[][] }>,
    getDatasheetName: (datasheetId: string) => string | undefined,
  ) => number
}

/** Normalize name for matching: lowercase, strip accents, remove punctuation */
function normalize(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[''`]/g, "'")
    .replace(/[^a-z0-9' ]/g, '')
    .trim()
}

/** Get significant words (3+ chars) from a normalized name, sorted for order-independent comparison */
function getWords(normalized: string): string[] {
  return normalized.split(/\s+/).filter((w) => w.length >= 3).sort()
}

/** Check if all words from `a` appear in `b` (or vice versa) */
function wordsMatch(a: string, b: string): boolean {
  const wordsA = getWords(a)
  const wordsB = getWords(b)
  if (wordsA.length === 0 || wordsB.length === 0) return false
  const shorter = wordsA.length <= wordsB.length ? wordsA : wordsB
  const longer = wordsA.length <= wordsB.length ? wordsB : wordsA
  return shorter.every((w) => longer.some((lw) => lw.includes(w) || w.includes(lw)))
}

/** Try exact → substring → word-based matching against priceByName */
function findPrice(key: string, priceByName: Record<string, number>): number | null {
  if (key in priceByName) return priceByName[key]
  // Substring inclusion
  for (const [gwKey, price] of Object.entries(priceByName)) {
    if (gwKey.includes(key) || key.includes(gwKey)) return price
  }
  // Word-based match
  for (const [gwKey, price] of Object.entries(priceByName)) {
    if (wordsMatch(key, gwKey)) return price
  }
  return null
}

export const useGwPriceStore = create<GwPriceState>()(
  persist(
    (set, get) => ({
      priceByName: {},
      products: [],
      loaded: false,
      loading: false,

      loadPrices: async () => {
        if (get().loaded || get().loading) return
        if (!isSupabaseConfigured || !supabase) return
        set({ loading: true })
        try {
          const { data, error } = await supabase
            .from('gw_products')
            .select('gw_id, name, price, image_url, faction')
          if (error) throw error
          if (!data) return

          const priceByName: Record<string, number> = {}
          for (const p of data) {
            const key = normalize(p.name)
            // Keep the lowest price if multiple matches (e.g. same name, different kits)
            if (!(key in priceByName) || p.price < priceByName[key]) {
              priceByName[key] = p.price
            }
          }

          lookupCache.clear()
          set({
            priceByName,
            products: data as GwProduct[],
            loaded: true,
            loading: false,
          })
        } catch (e) {
          console.error('[gw-prices] Failed to load:', e)
          set({ loading: false })
        }
      },

      getPrice: (datasheetName: string) => {
        if (lookupCache.has(datasheetName)) return lookupCache.get(datasheetName)!

        const { priceByName } = get()
        const key = normalize(datasheetName)
        let result: number | null = null

        result = findPrice(key, priceByName)

        lookupCache.set(datasheetName, result)
        return result
      },

      getCollectionValue: (items, getDatasheetName) => {
        const { getPrice } = get()
        let total = 0
        for (const item of Object.values(items)) {
          const name = getDatasheetName(item.datasheetId)
          if (!name) continue
          const price = getPrice(name)
          if (price !== null) {
            // Each squad = 1 box purchased
            total += price * item.squads.length
          }
        }
        return total
      },
    }),
    {
      name: 'pierrehammer-gw-prices-v2',
      partialize: (state) => ({
        priceByName: state.priceByName,
        products: state.products,
        loaded: state.loaded,
      }),
    },
  ),
)

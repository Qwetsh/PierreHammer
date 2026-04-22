import { create } from 'zustand'
import type { TranslationCategory, TranslationsByCategory } from '@/types/translation.types'
import { fetchAllTranslations, upsertTranslation, deleteTranslation } from '@/services/translationService'

const LOCAL_STORAGE_KEY = 'pierrehammer-translations'

interface TranslationState {
  /** All translations grouped by category */
  translations: TranslationsByCategory
  /** Whether translations have been loaded */
  loaded: boolean
  /** Whether translation edit mode is active (desktop only) */
  editMode: boolean

  /** Load translations from localStorage cache, then sync from Supabase */
  initialize: () => Promise<void>
  /** Translate a term — returns translated text or original if not found */
  t: (englishKey: string, category?: TranslationCategory) => string
  /** Set or update a translation */
  setTranslation: (category: TranslationCategory, englishKey: string, translatedText: string) => Promise<void>
  /** Remove a translation (revert to English) */
  removeTranslation: (category: TranslationCategory, englishKey: string) => Promise<void>
  /** Toggle edit mode */
  toggleEditMode: () => void
}

function loadFromLocalStorage(): TranslationsByCategory {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveToLocalStorage(translations: TranslationsByCategory): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(translations))
  } catch {
    // localStorage might be full — silently ignore
  }
}

export const useTranslationStore = create<TranslationState>((set, get) => ({
  translations: {},
  loaded: false,
  editMode: false,

  initialize: async () => {
    // 1. Load from cache immediately (fast, works offline)
    const cached = loadFromLocalStorage()
    set({ translations: cached, loaded: true })

    // 2. Fetch from Supabase in background (authoritative, shared)
    const remote = await fetchAllTranslations()
    if (Object.keys(remote).length > 0) {
      // Merge: remote wins over cache
      const merged = { ...cached }
      for (const [cat, entries] of Object.entries(remote)) {
        merged[cat as TranslationCategory] = {
          ...merged[cat as TranslationCategory],
          ...entries,
        }
      }
      set({ translations: merged })
      saveToLocalStorage(merged)
    }
  },

  t: (englishKey: string, category?: TranslationCategory): string => {
    const { translations } = get()

    // If category specified, look in that category only
    if (category) {
      return translations[category]?.[englishKey] ?? englishKey
    }

    // Otherwise search all categories (unit, weapon, ability, etc.)
    for (const catMap of Object.values(translations)) {
      if (catMap?.[englishKey]) return catMap[englishKey]
    }

    return englishKey
  },

  setTranslation: async (category, englishKey, translatedText) => {
    // Update local state immediately
    set((state) => {
      const updated = { ...state.translations }
      if (!updated[category]) updated[category] = {}
      updated[category]![englishKey] = translatedText
      saveToLocalStorage(updated)
      return { translations: updated }
    })

    // Sync to Supabase in background
    await upsertTranslation({ category, englishKey, translatedText })
  },

  removeTranslation: async (category, englishKey) => {
    // Update local state immediately
    set((state) => {
      const updated = { ...state.translations }
      if (updated[category]) {
        delete updated[category]![englishKey]
      }
      saveToLocalStorage(updated)
      return { translations: updated }
    })

    // Sync to Supabase in background
    await deleteTranslation(category, englishKey)
  },

  toggleEditMode: () => {
    set((state) => ({ editMode: !state.editMode }))
  },
}))

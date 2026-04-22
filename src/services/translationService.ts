import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import type { Translation, TranslationCategory, TranslationsByCategory } from '@/types/translation.types'

/**
 * Fetch all translations from Supabase.
 * Returns them grouped by category for efficient lookup.
 */
export async function fetchAllTranslations(): Promise<TranslationsByCategory> {
  if (!isSupabaseConfigured || !supabase) return {}

  try {
    const { data, error } = await supabase
      .from('translations')
      .select('category, english_key, translated_text, updated_by, updated_at')

    if (error) {
      console.error('[translationService] fetch error:', error.message)
      return {}
    }

    const result: TranslationsByCategory = {}
    for (const row of data ?? []) {
      const cat = row.category as TranslationCategory
      if (!result[cat]) result[cat] = {}
      result[cat]![row.english_key] = row.translated_text
    }
    return result
  } catch (err) {
    console.error('[translationService] fetch exception:', err)
    return {}
  }
}

/**
 * Upsert a single translation.
 * Uses the (category, english_key) unique constraint for conflict resolution.
 */
export async function upsertTranslation(
  translation: Pick<Translation, 'category' | 'englishKey' | 'translatedText'>
): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false

  try {
    const userId = (await supabase.auth.getUser()).data.user?.id ?? null

    const { error } = await supabase
      .from('translations')
      .upsert(
        {
          category: translation.category,
          english_key: translation.englishKey,
          translated_text: translation.translatedText,
          updated_by: userId,
        },
        { onConflict: 'category,english_key' }
      )

    if (error) {
      console.error('[translationService] upsert error:', error.message)
      return false
    }
    return true
  } catch (err) {
    console.error('[translationService] upsert exception:', err)
    return false
  }
}

/**
 * Delete a translation (revert to English).
 */
export async function deleteTranslation(
  category: TranslationCategory,
  englishKey: string
): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false

  try {
    const { error } = await supabase
      .from('translations')
      .delete()
      .eq('category', category)
      .eq('english_key', englishKey)

    if (error) {
      console.error('[translationService] delete error:', error.message)
      return false
    }
    return true
  } catch (err) {
    console.error('[translationService] delete exception:', err)
    return false
  }
}

export type TranslationCategory =
  | 'unit'
  | 'weapon'
  | 'ability'
  | 'stratagem'
  | 'enhancement'
  | 'detachment'
  | 'faction'
  | 'keyword'
  | 'other'

export interface Translation {
  category: TranslationCategory
  englishKey: string
  translatedText: string
  updatedBy?: string
  updatedAt?: string
}

/** Map of english_key -> translated_text, grouped by category */
export type TranslationMap = Record<string, string>
export type TranslationsByCategory = Partial<Record<TranslationCategory, TranslationMap>>

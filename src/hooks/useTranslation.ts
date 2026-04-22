import { useCallback } from 'react'
import { useTranslationStore } from '@/stores/translationStore'
import type { TranslationCategory } from '@/types/translation.types'

/**
 * Hook to access translation functions.
 *
 * Usage:
 *   const { t } = useTranslation()
 *   t("Bolt Rifle")              // searches all categories
 *   t("Bolt Rifle", "weapon")    // searches weapon category only
 */
export function useTranslation() {
  const tFromStore = useTranslationStore((s) => s.t)
  const editMode = useTranslationStore((s) => s.editMode)
  const setTranslation = useTranslationStore((s) => s.setTranslation)
  const removeTranslation = useTranslationStore((s) => s.removeTranslation)
  const toggleEditMode = useTranslationStore((s) => s.toggleEditMode)

  const t = useCallback(
    (englishKey: string, category?: TranslationCategory) => tFromStore(englishKey, category),
    [tFromStore]
  )

  return { t, editMode, setTranslation, removeTranslation, toggleEditMode }
}

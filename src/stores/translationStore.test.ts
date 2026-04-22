import { describe, it, expect, beforeEach } from 'vitest'
import { useTranslationStore } from './translationStore'

describe('translationStore', () => {
  beforeEach(() => {
    // Reset store to initial state
    useTranslationStore.setState({
      translations: {},
      loaded: false,
      editMode: false,
    })
    localStorage.clear()
  })

  describe('t()', () => {
    it('returns original text when no translation exists', () => {
      const { t } = useTranslationStore.getState()
      expect(t('Bolt Rifle')).toBe('Bolt Rifle')
    })

    it('returns translated text when translation exists with category', () => {
      useTranslationStore.setState({
        translations: { weapon: { 'Bolt Rifle': 'Fusil Bolter' } },
      })
      const { t } = useTranslationStore.getState()
      expect(t('Bolt Rifle', 'weapon')).toBe('Fusil Bolter')
    })

    it('returns translated text searching all categories when no category specified', () => {
      useTranslationStore.setState({
        translations: { weapon: { 'Bolt Rifle': 'Fusil Bolter' } },
      })
      const { t } = useTranslationStore.getState()
      expect(t('Bolt Rifle')).toBe('Fusil Bolter')
    })

    it('returns original when category specified but translation in different category', () => {
      useTranslationStore.setState({
        translations: { weapon: { 'Stealth': 'Furtivité' } },
      })
      const { t } = useTranslationStore.getState()
      expect(t('Stealth', 'ability')).toBe('Stealth')
    })
  })

  describe('setTranslation()', () => {
    it('adds a translation to the store', async () => {
      await useTranslationStore.getState().setTranslation('weapon', 'Bolt Rifle', 'Fusil Bolter')
      const { t } = useTranslationStore.getState()
      expect(t('Bolt Rifle', 'weapon')).toBe('Fusil Bolter')
    })

    it('saves to localStorage', async () => {
      await useTranslationStore.getState().setTranslation('unit', 'Intercessors', 'Intercesseurs')
      const stored = JSON.parse(localStorage.getItem('pierrehammer-translations') ?? '{}')
      expect(stored.unit?.['Intercessors']).toBe('Intercesseurs')
    })

    it('overwrites existing translation', async () => {
      await useTranslationStore.getState().setTranslation('weapon', 'Bolt Rifle', 'Fusil Bolter')
      await useTranslationStore.getState().setTranslation('weapon', 'Bolt Rifle', 'Bolter')
      const { t } = useTranslationStore.getState()
      expect(t('Bolt Rifle', 'weapon')).toBe('Bolter')
    })
  })

  describe('removeTranslation()', () => {
    it('removes a translation, reverting to English', async () => {
      await useTranslationStore.getState().setTranslation('weapon', 'Bolt Rifle', 'Fusil Bolter')
      await useTranslationStore.getState().removeTranslation('weapon', 'Bolt Rifle')
      const { t } = useTranslationStore.getState()
      expect(t('Bolt Rifle', 'weapon')).toBe('Bolt Rifle')
    })
  })

  describe('toggleEditMode()', () => {
    it('toggles edit mode on and off', () => {
      expect(useTranslationStore.getState().editMode).toBe(false)
      useTranslationStore.getState().toggleEditMode()
      expect(useTranslationStore.getState().editMode).toBe(true)
      useTranslationStore.getState().toggleEditMode()
      expect(useTranslationStore.getState().editMode).toBe(false)
    })
  })
})

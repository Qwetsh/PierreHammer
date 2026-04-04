import { usePreferencesStore } from './preferencesStore'

describe('preferencesStore', () => {
  beforeEach(() => {
    usePreferencesStore.setState({ activeFactionId: null, activeListId: null, locale: 'fr' })
  })

  it('sets active faction', () => {
    usePreferencesStore.getState().setActiveFaction('space-marines')
    expect(usePreferencesStore.getState().activeFactionId).toBe('space-marines')
  })

  it('sets active list', () => {
    usePreferencesStore.getState().setActiveList('list-1')
    expect(usePreferencesStore.getState().activeListId).toBe('list-1')
  })

  it('clears active faction', () => {
    usePreferencesStore.getState().setActiveFaction('orks')
    usePreferencesStore.getState().setActiveFaction(null)
    expect(usePreferencesStore.getState().activeFactionId).toBeNull()
  })

  it('has default locale fr', () => {
    expect(usePreferencesStore.getState().locale).toBe('fr')
  })
})

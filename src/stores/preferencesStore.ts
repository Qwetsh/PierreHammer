import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface PreferencesState {
  activeFactionId: string | null
  activeListId: string | null
  locale: string
  hasSeenSplash: boolean
  setActiveFaction: (factionId: string | null) => void
  setActiveList: (listId: string | null) => void
  markSplashSeen: () => void
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      activeFactionId: null,
      activeListId: null,
      locale: 'fr',
      hasSeenSplash: false,

      setActiveFaction: (factionId) => set({ activeFactionId: factionId }),
      setActiveList: (listId) => set({ activeListId: listId }),
      markSplashSeen: () => set({ hasSeenSplash: true }),
    }),
    {
      name: 'pierrehammer-preferences',
      onRehydrateStorage: () => (_state, error) => {
        if (error) {
          console.error('Failed to rehydrate preferences store:', error)
          localStorage.removeItem('pierrehammer-preferences')
        }
      },
    },
  ),
)

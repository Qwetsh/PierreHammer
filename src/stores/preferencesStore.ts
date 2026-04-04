import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ColorVisionMode = 'normal' | 'deuteranopia' | 'protanopia' | 'tritanopia'

interface PreferencesState {
  activeFactionId: string | null
  activeListId: string | null
  locale: string
  hasSeenSplash: boolean
  colorVisionMode: ColorVisionMode
  setActiveFaction: (factionId: string | null) => void
  setActiveList: (listId: string | null) => void
  markSplashSeen: () => void
  setColorVisionMode: (mode: ColorVisionMode) => void
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      activeFactionId: null,
      activeListId: null,
      locale: 'fr',
      hasSeenSplash: false,
      colorVisionMode: 'normal',

      setActiveFaction: (factionId) => set({ activeFactionId: factionId }),
      setActiveList: (listId) => set({ activeListId: listId }),
      markSplashSeen: () => set({ hasSeenSplash: true }),
      setColorVisionMode: (mode) => set({ colorVisionMode: mode }),
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

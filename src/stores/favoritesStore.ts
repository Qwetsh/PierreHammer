import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface FavoritesState {
  favorites: string[]
  toggleFavorite: (datasheetId: string) => void
  isFavorite: (datasheetId: string) => boolean
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favorites: [],

      toggleFavorite: (datasheetId) => {
        set((state) => {
          const idx = state.favorites.indexOf(datasheetId)
          if (idx >= 0) {
            return { favorites: state.favorites.filter((id) => id !== datasheetId) }
          }
          return { favorites: [...state.favorites, datasheetId] }
        })
      },

      isFavorite: (datasheetId) => get().favorites.includes(datasheetId),
    }),
    {
      name: 'pierrehammer-favorites',
    },
  ),
)

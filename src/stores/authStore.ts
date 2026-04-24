import { create } from 'zustand'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import type { User, AuthError } from '@supabase/supabase-js'

interface AuthState {
  user: User | null
  loading: boolean
  isAuthenticated: boolean
  initialize: () => void
  signUp: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signOut: () => Promise<void>
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  loading: true,
  isAuthenticated: false,

  initialize: () => {
    if (!isSupabaseConfigured || !supabase) {
      set({ loading: false })
      return
    }

    const triggerSync = (session: { user: User }) => {
      import('@/stores/listsStore').then(({ useListsStore }) => {
        useListsStore.getState().syncOnLogin()
      })
      import('@/stores/collectionStore').then(({ useCollectionStore }) => {
        useCollectionStore.getState().syncOnLogin()
      })
      import('@/services/customImageSyncService').then(async ({ syncLocalToRemote, syncRemoteToLocal }) => {
        const { getCustomImageBlob, listCustomImageIds, hasCustomImage, saveCustomImageBlob } = await import('@/stores/customImageStore')
        const userId = session.user.id
        const localIds = await listCustomImageIds()
        await syncLocalToRemote(userId, getCustomImageBlob, localIds)
        await syncRemoteToLocal(userId, hasCustomImage, saveCustomImageBlob)
      })
    }

    let hasSynced = false

    supabase.auth.getSession().then(({ data: { session } }) => {
      set({
        user: session?.user ?? null,
        isAuthenticated: !!session?.user,
        loading: false,
      })
      if (session?.user && !hasSynced) {
        hasSynced = true
        triggerSync(session)
      }
    })

    supabase.auth.onAuthStateChange((_event, session) => {
      const wasAuthenticated = useAuthStore.getState().isAuthenticated
      set({
        user: session?.user ?? null,
        isAuthenticated: !!session?.user,
        loading: false,
      })
      if (!wasAuthenticated && session?.user && !hasSynced) {
        hasSynced = true
        triggerSync(session)
      }
    })
  },

  signUp: async (email, password) => {
    if (!supabase) return { error: { message: 'Supabase non configuré' } as AuthError }
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (!error && data.user) {
      set({ user: data.user, isAuthenticated: true })
    }
    return { error }
  },

  signIn: async (email, password) => {
    if (!supabase) return { error: { message: 'Supabase non configuré' } as AuthError }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (!error && data.user) {
      set({ user: data.user, isAuthenticated: true })
    }
    return { error }
  },

  signOut: async () => {
    if (!supabase) return
    await supabase.auth.signOut()
    set({ user: null, isAuthenticated: false })
  },
}))

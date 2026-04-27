import { create } from 'zustand'
import type { Friendship, Profile } from '@/services/friendsService'
import * as friendsService from '@/services/friendsService'
import { useAuthStore } from '@/stores/authStore'

interface FriendsState {
  friends: Friendship[]
  pendingRequests: Friendship[]
  sentRequests: Friendship[]
  profile: Profile | null
  loading: boolean
  searchResults: Profile[]
  searching: boolean

  loadFriends: () => Promise<void>
  loadPendingRequests: () => Promise<void>
  loadSentRequests: () => Promise<void>
  loadProfile: () => Promise<void>
  searchUsers: (query: string) => Promise<void>
  sendRequest: (addresseeId: string) => Promise<{ ok: boolean; error?: string }>
  respondToRequest: (friendshipId: string, accept: boolean) => Promise<{ ok: boolean; error?: string }>
  removeFriend: (friendshipId: string) => Promise<{ ok: boolean; error?: string }>
  cancelRequest: (friendshipId: string) => Promise<{ ok: boolean; error?: string }>
  updateUsername: (username: string) => Promise<boolean>
}

function getUserId(): string | null {
  const { user, isAuthenticated } = useAuthStore.getState()
  if (!isAuthenticated || !user) return null
  return user.id
}

export const useFriendsStore = create<FriendsState>()((set, get) => ({
  friends: [],
  pendingRequests: [],
  sentRequests: [],
  profile: null,
  loading: false,
  searchResults: [],
  searching: false,

  loadFriends: async () => {
    const userId = getUserId()
    if (!userId) return
    set({ loading: true })
    try {
      const friends = await friendsService.getFriends(userId)
      set({ friends, loading: false })
    } catch {
      set({ loading: false })
    }
  },

  loadPendingRequests: async () => {
    const userId = getUserId()
    if (!userId) return
    try {
      const pendingRequests = await friendsService.getPendingRequests(userId)
      set({ pendingRequests })
    } catch {
      // silent
    }
  },

  loadSentRequests: async () => {
    const userId = getUserId()
    if (!userId) return
    try {
      const sentRequests = await friendsService.getSentRequests(userId)
      set({ sentRequests })
    } catch {
      // silent
    }
  },

  loadProfile: async () => {
    const userId = getUserId()
    if (!userId) return
    try {
      const profile = await friendsService.getProfile(userId)
      set({ profile })
    } catch {
      // silent
    }
  },

  searchUsers: async (query: string) => {
    if (!query.trim()) {
      set({ searchResults: [] })
      return
    }
    set({ searching: true })
    try {
      const results = await friendsService.searchUsers(query)
      const userId = getUserId()
      set({ searchResults: results.filter((r) => r.id !== userId), searching: false })
    } catch {
      set({ searching: false })
    }
  },

  sendRequest: async (addresseeId: string) => {
    const userId = getUserId()
    if (!userId) return { ok: false, error: 'Non connecté' }

    // Check if already friends or request already sent
    const { friends, sentRequests } = get()
    const alreadyFriend = friends.some(
      (f) => f.requester_id === addresseeId || f.addressee_id === addresseeId,
    )
    if (alreadyFriend) return { ok: false, error: 'Déjà ami avec ce joueur' }

    const alreadySent = sentRequests.some(
      (f) => f.addressee_id === addresseeId,
    )
    if (alreadySent) return { ok: false, error: 'Demande déjà envoyée' }

    const id = await friendsService.sendFriendRequest(userId, addresseeId)
    if (id) {
      await get().loadSentRequests()
      return { ok: true }
    }
    return { ok: false, error: 'Erreur lors de l\'envoi de la demande' }
  },

  respondToRequest: async (friendshipId: string, accept: boolean) => {
    const ok = await friendsService.respondToRequest(friendshipId, accept)
    if (ok) {
      await Promise.all([get().loadFriends(), get().loadPendingRequests()])
      return { ok: true }
    }
    return { ok: false, error: 'Erreur lors du traitement de la demande' }
  },

  removeFriend: async (friendshipId: string) => {
    const ok = await friendsService.removeFriend(friendshipId)
    if (ok) {
      set((state) => ({ friends: state.friends.filter((f) => f.id !== friendshipId) }))
      return { ok: true }
    }
    return { ok: false, error: 'Erreur lors de la suppression' }
  },

  cancelRequest: async (friendshipId: string) => {
    const ok = await friendsService.removeFriend(friendshipId)
    if (ok) {
      set((state) => ({ sentRequests: state.sentRequests.filter((f) => f.id !== friendshipId) }))
      return { ok: true }
    }
    return { ok: false, error: 'Erreur lors de l\'annulation' }
  },

  updateUsername: async (username: string) => {
    const userId = getUserId()
    if (!userId) return false
    const ok = await friendsService.updateUsername(userId, username)
    if (ok) {
      set((state) => ({
        profile: state.profile ? { ...state.profile, username } : null,
      }))
    }
    return ok
  },
}))

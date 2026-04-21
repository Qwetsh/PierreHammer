import { create } from 'zustand'
import type { Friendship, Profile } from '@/services/friendsService'
import * as friendsService from '@/services/friendsService'
import { useAuthStore } from '@/stores/authStore'

interface FriendsState {
  friends: Friendship[]
  pendingRequests: Friendship[]
  profile: Profile | null
  loading: boolean
  searchResults: Profile[]
  searching: boolean

  loadFriends: () => Promise<void>
  loadPendingRequests: () => Promise<void>
  loadProfile: () => Promise<void>
  searchUsers: (query: string) => Promise<void>
  sendRequest: (addresseeId: string) => Promise<boolean>
  respondToRequest: (friendshipId: string, accept: boolean) => Promise<boolean>
  removeFriend: (friendshipId: string) => Promise<boolean>
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
      // ignore
    }
  },

  loadProfile: async () => {
    const userId = getUserId()
    if (!userId) return
    try {
      const profile = await friendsService.getProfile(userId)
      set({ profile })
    } catch {
      // ignore
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
      // Exclude self
      const userId = getUserId()
      set({ searchResults: results.filter((r) => r.id !== userId), searching: false })
    } catch {
      set({ searching: false })
    }
  },

  sendRequest: async (addresseeId: string) => {
    const userId = getUserId()
    if (!userId) return false
    const id = await friendsService.sendFriendRequest(userId, addresseeId)
    if (id) {
      await get().loadPendingRequests()
      return true
    }
    return false
  },

  respondToRequest: async (friendshipId: string, accept: boolean) => {
    const ok = await friendsService.respondToRequest(friendshipId, accept)
    if (ok) {
      await Promise.all([get().loadFriends(), get().loadPendingRequests()])
    }
    return ok
  },

  removeFriend: async (friendshipId: string) => {
    const ok = await friendsService.removeFriend(friendshipId)
    if (ok) {
      set((state) => ({ friends: state.friends.filter((f) => f.id !== friendshipId) }))
    }
    return ok
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

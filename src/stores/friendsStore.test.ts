import { vi, describe, it, expect, beforeEach } from 'vitest'
import { useFriendsStore } from './friendsStore'

// Mock auth state
let mockAuthState = { user: null as { id: string } | null, isAuthenticated: false }
vi.mock('@/stores/authStore', () => ({
  useAuthStore: {
    getState: () => ({ ...mockAuthState, loading: false, initialize: vi.fn(), signUp: vi.fn(), signIn: vi.fn(), signOut: vi.fn() }),
  },
}))

// Mock friends service
vi.mock('@/services/friendsService', () => ({
  getFriends: vi.fn().mockResolvedValue([]),
  getPendingRequests: vi.fn().mockResolvedValue([]),
  searchUsers: vi.fn().mockResolvedValue([]),
  sendFriendRequest: vi.fn().mockResolvedValue('f1'),
  respondToRequest: vi.fn().mockResolvedValue(true),
  removeFriend: vi.fn().mockResolvedValue(true),
  updateUsername: vi.fn().mockResolvedValue(true),
  getProfile: vi.fn().mockResolvedValue({ id: 'u1', username: 'bob', created_at: '2024-01-01' }),
}))

describe('friendsStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useFriendsStore.setState({ friends: [], pendingRequests: [], profile: null, loading: false, searchResults: [], searching: false })
    mockAuthState = { user: { id: 'u1' }, isAuthenticated: true }
  })

  it('loadFriends populates friends array', async () => {
    const svc = await import('@/services/friendsService')
    vi.mocked(svc.getFriends).mockResolvedValue([
      { id: 'f1', requester_id: 'u1', addressee_id: 'u2', status: 'accepted', created_at: '2024-01-01' },
    ])
    await useFriendsStore.getState().loadFriends()
    expect(useFriendsStore.getState().friends).toHaveLength(1)
  })

  it('does nothing when not authenticated', async () => {
    mockAuthState = { user: null, isAuthenticated: false }
    await useFriendsStore.getState().loadFriends()
    expect(useFriendsStore.getState().friends).toHaveLength(0)
  })

  it('searchUsers populates searchResults excluding self', async () => {
    const svc = await import('@/services/friendsService')
    vi.mocked(svc.searchUsers).mockResolvedValue([
      { id: 'u1', username: 'me', created_at: '2024-01-01' },
      { id: 'u2', username: 'other', created_at: '2024-01-01' },
    ])
    await useFriendsStore.getState().searchUsers('test')
    expect(useFriendsStore.getState().searchResults).toHaveLength(1)
    expect(useFriendsStore.getState().searchResults[0].username).toBe('other')
  })

  it('sendRequest calls service with correct userId', async () => {
    const svc = await import('@/services/friendsService')
    await useFriendsStore.getState().sendRequest('u2')
    expect(svc.sendFriendRequest).toHaveBeenCalledWith('u1', 'u2')
  })

  it('removeFriend removes from state', async () => {
    useFriendsStore.setState({
      friends: [{ id: 'f1', requester_id: 'u1', addressee_id: 'u2', status: 'accepted', created_at: '2024-01-01' }],
    })
    await useFriendsStore.getState().removeFriend('f1')
    expect(useFriendsStore.getState().friends).toHaveLength(0)
  })

  it('updateUsername updates profile in state', async () => {
    useFriendsStore.setState({ profile: { id: 'u1', username: 'old', created_at: '2024-01-01' } })
    await useFriendsStore.getState().updateUsername('new-name')
    expect(useFriendsStore.getState().profile?.username).toBe('new-name')
  })
})

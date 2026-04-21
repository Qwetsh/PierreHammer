import { vi, describe, it, expect, beforeEach } from 'vitest'

// Shared result that tests can set before calling service methods
let mockResult: { data: unknown; error: unknown }

// Every method returns a thenable+chainable proxy
function createChain(): Record<string, unknown> {
  const handler: ProxyHandler<Record<string, unknown>> = {
    get(_target, prop) {
      if (prop === 'then') {
        // Make it thenable — resolves to mockResult
        return (resolve: (v: unknown) => void) => resolve(mockResult)
      }
      // Any method call returns a new proxy (chainable)
      return vi.fn(() => new Proxy({}, handler))
    },
  }
  return new Proxy({}, handler)
}

const mockFromCalls: string[] = []
const mockFrom = vi.fn((table: string) => {
  mockFromCalls.push(table)
  return createChain()
})

vi.mock('@/lib/supabase', () => ({
  isSupabaseConfigured: true,
  supabase: { from: (...args: unknown[]) => mockFrom(...(args as [string])) },
}))

import {
  searchUsers,
  sendFriendRequest,
  respondToRequest,
  getFriends,
  getPendingRequests,
  removeFriend,
  updateUsername,
  getProfile,
} from './friendsService'

describe('friendsService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFromCalls.length = 0
    mockResult = { data: [], error: null }
  })

  it('searchUsers queries profiles with ilike', async () => {
    mockResult = { data: [{ id: 'u1', username: 'bob', created_at: '2024-01-01' }], error: null }
    const results = await searchUsers('bob')
    expect(mockFromCalls).toContain('profiles')
    expect(results).toHaveLength(1)
    expect(results[0].username).toBe('bob')
  })

  it('searchUsers returns empty on blank query', async () => {
    const results = await searchUsers('  ')
    expect(mockFromCalls).toHaveLength(0)
    expect(results).toEqual([])
  })

  it('sendFriendRequest inserts a pending friendship', async () => {
    mockResult = { data: { id: 'f1' }, error: null }
    const id = await sendFriendRequest('req-id', 'addr-id')
    expect(mockFromCalls).toContain('ph_friendships')
    expect(id).toBe('f1')
  })

  it('respondToRequest updates friendship status to accepted', async () => {
    mockResult = { data: null, error: null }
    const result = await respondToRequest('f1', true)
    expect(mockFromCalls).toContain('ph_friendships')
    expect(result).toBe(true)
  })

  it('respondToRequest updates friendship status to rejected', async () => {
    mockResult = { data: null, error: null }
    const result = await respondToRequest('f1', false)
    expect(result).toBe(true)
  })

  it('getFriends queries accepted friendships', async () => {
    mockResult = { data: [{ id: 'f1', requester_id: 'u1', addressee_id: 'u2', status: 'accepted', created_at: '2024-01-01' }], error: null }
    const friends = await getFriends('u1')
    expect(mockFromCalls).toContain('ph_friendships')
    expect(friends).toHaveLength(1)
  })

  it('getPendingRequests queries pending friendships for addressee', async () => {
    mockResult = { data: [{ id: 'f2', requester_id: 'u2', addressee_id: 'u1', status: 'pending', created_at: '2024-01-01' }], error: null }
    const pending = await getPendingRequests('u1')
    expect(mockFromCalls).toContain('ph_friendships')
    expect(pending).toHaveLength(1)
  })

  it('removeFriend deletes the friendship', async () => {
    mockResult = { data: null, error: null }
    const result = await removeFriend('f1')
    expect(mockFromCalls).toContain('ph_friendships')
    expect(result).toBe(true)
  })

  it('updateUsername updates the profile', async () => {
    mockResult = { data: null, error: null }
    const result = await updateUsername('u1', 'new-name')
    expect(mockFromCalls).toContain('profiles')
    expect(result).toBe(true)
  })

  it('getProfile fetches a single profile', async () => {
    mockResult = { data: { id: 'u1', username: 'bob', created_at: '2024-01-01' }, error: null }
    const profile = await getProfile('u1')
    expect(mockFromCalls).toContain('profiles')
    expect(profile?.username).toBe('bob')
  })

  it('returns empty/null/false on supabase error', async () => {
    mockResult = { data: null, error: { message: 'fail' } }
    expect(await searchUsers('test')).toEqual([])
    expect(await sendFriendRequest('a', 'b')).toBeNull()
    expect(await respondToRequest('f1', true)).toBe(false)
    expect(await removeFriend('f1')).toBe(false)
    expect(await updateUsername('u1', 'x')).toBe(false)
    expect(await getProfile('u1')).toBeNull()
  })
})

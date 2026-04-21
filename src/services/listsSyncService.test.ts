import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockSelect = vi.fn()
const mockInsert = vi.fn()
const mockUpdate = vi.fn()
const mockDeleteFn = vi.fn()
const mockEq = vi.fn()
const mockOrder = vi.fn()
const mockSingle = vi.fn()

function chainable() {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
    delete: mockDeleteFn,
    eq: mockEq,
    order: mockOrder,
    single: mockSingle,
  }
  for (const fn of Object.values(chain)) {
    fn.mockReturnValue(chain)
  }
  return chain
}

const mockFrom = vi.fn()

vi.mock('@/lib/supabase', () => ({
  isSupabaseConfigured: true,
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
  },
}))

import {
  fetchRemoteLists,
  pushList,
  updateRemoteList,
  deleteRemoteList,
} from './listsSyncService'

const mockRemoteList = {
  id: 'remote-uuid-1',
  user_id: 'user-uuid',
  name: 'Test List',
  faction_id: 'space-marines',
  detachment: 'Gladius Task Force',
  detachment_id: 'det-1',
  points_limit: 2000,
  units: [],
  is_public: false,
  created_at: '2026-04-01T00:00:00Z',
  updated_at: '2026-04-01T00:00:00Z',
}

describe('listsSyncService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    const chain = chainable()
    mockFrom.mockReturnValue(chain)
  })

  describe('fetchRemoteLists', () => {
    it('returns mapped local lists on success', async () => {
      mockOrder.mockResolvedValue({ data: [mockRemoteList], error: null })

      const result = await fetchRemoteLists('user-uuid')

      expect(mockFrom).toHaveBeenCalledWith('army_lists')
      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('Test List')
      expect(result[0].factionId).toBe('space-marines')
      expect(result[0].remoteId).toBe('remote-uuid-1')
    })

    it('returns empty array on error', async () => {
      mockOrder.mockResolvedValue({ data: null, error: { message: 'DB error' } })

      const result = await fetchRemoteLists('user-uuid')
      expect(result).toEqual([])
    })
  })

  describe('pushList', () => {
    it('returns remote ID on success', async () => {
      mockSingle.mockResolvedValue({ data: { id: 'new-remote-uuid' }, error: null })

      const localList = {
        id: 'local-1',
        name: 'My List',
        factionId: 'orks',
        detachment: 'Waaagh!',
        pointsLimit: 1000 as const,
        units: [],
        createdAt: Date.now(),
      }
      const result = await pushList(localList, 'user-uuid')

      expect(result).toBe('new-remote-uuid')
      expect(mockFrom).toHaveBeenCalledWith('army_lists')
    })

    it('returns null on error', async () => {
      mockSingle.mockResolvedValue({ data: null, error: { message: 'Insert error' } })

      const result = await pushList(
        { id: 'x', name: 'X', factionId: 'x', detachment: 'x', pointsLimit: 1000, units: [], createdAt: 0 },
        'user-uuid',
      )
      expect(result).toBeNull()
    })
  })

  describe('updateRemoteList', () => {
    it('returns true on success', async () => {
      mockEq.mockResolvedValue({ error: null })

      const result = await updateRemoteList(
        'remote-uuid-1',
        { id: 'x', name: 'Updated', factionId: 'x', detachment: 'x', pointsLimit: 2000, units: [], createdAt: 0 },
        'user-uuid',
      )
      expect(result).toBe(true)
    })

    it('returns false on error', async () => {
      mockEq.mockResolvedValue({ error: { message: 'Update error' } })

      const result = await updateRemoteList(
        'remote-uuid-1',
        { id: 'x', name: 'X', factionId: 'x', detachment: 'x', pointsLimit: 2000, units: [], createdAt: 0 },
        'user-uuid',
      )
      expect(result).toBe(false)
    })
  })

  describe('deleteRemoteList', () => {
    it('returns true on success', async () => {
      mockEq.mockResolvedValue({ error: null })

      const result = await deleteRemoteList('remote-uuid-1')
      expect(result).toBe(true)
    })

    it('returns false on error', async () => {
      mockEq.mockResolvedValue({ error: { message: 'Delete error' } })

      const result = await deleteRemoteList('remote-uuid-1')
      expect(result).toBe(false)
    })
  })
})

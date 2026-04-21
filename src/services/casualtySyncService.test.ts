import { describe, it, expect, vi, beforeEach } from 'vitest'

let mockResult: { data: unknown; error: unknown }

function createChain(): Record<string, unknown> {
  const handler: ProxyHandler<Record<string, unknown>> = {
    get(_target, prop) {
      if (prop === 'then') {
        return (resolve: (v: unknown) => void) => resolve(mockResult)
      }
      return vi.fn(() => new Proxy({}, handler))
    },
  }
  return new Proxy({}, handler)
}

const mockChannel = {
  on: vi.fn().mockReturnThis(),
  subscribe: vi.fn().mockReturnThis(),
}

vi.mock('@/lib/supabase', () => ({
  isSupabaseConfigured: true,
  supabase: {
    from: vi.fn(() => createChain()),
    channel: vi.fn(() => mockChannel),
    removeChannel: vi.fn(),
  },
}))

import { upsertCasualty, getCasualties, resetCasualty, subscribeToCasualties } from './casualtySyncService'

describe('casualtySyncService', () => {
  beforeEach(() => {
    mockResult = { data: null, error: null }
    vi.clearAllMocks()
  })

  it('upsertCasualty returns true on success', async () => {
    mockResult = { data: null, error: null }
    const ok = await upsertCasualty({
      session_id: 's1',
      player_id: 'p1',
      list_unit_id: 'u1',
      models_destroyed: 2,
      wounds_remaining: null,
    })
    expect(ok).toBe(true)
  })

  it('upsertCasualty returns false on error', async () => {
    mockResult = { data: null, error: { message: 'fail' } }
    const ok = await upsertCasualty({
      session_id: 's1',
      player_id: 'p1',
      list_unit_id: 'u1',
      models_destroyed: 0,
      wounds_remaining: null,
    })
    expect(ok).toBe(false)
  })

  it('getCasualties returns records on success', async () => {
    const records = [{ id: 'c1', session_id: 's1', player_id: 'p1', list_unit_id: 'u1', models_destroyed: 1, wounds_remaining: null }]
    mockResult = { data: records, error: null }
    const result = await getCasualties('s1')
    expect(result).toEqual(records)
  })

  it('getCasualties returns empty on error', async () => {
    mockResult = { data: null, error: { message: 'fail' } }
    const result = await getCasualties('s1')
    expect(result).toEqual([])
  })

  it('resetCasualty returns true on success', async () => {
    mockResult = { data: null, error: null }
    const ok = await resetCasualty('s1', 'p1', 'u1')
    expect(ok).toBe(true)
  })

  it('subscribeToCasualties returns unsubscribe function', () => {
    const unsub = subscribeToCasualties('s1', vi.fn())
    expect(typeof unsub).toBe('function')
    expect(mockChannel.on).toHaveBeenCalled()
    expect(mockChannel.subscribe).toHaveBeenCalled()
  })
})

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

vi.mock('@/lib/supabase', () => ({
  isSupabaseConfigured: true,
  supabase: {
    from: vi.fn(() => createChain()),
  },
}))

import { createSession, getActiveSession, endSession } from './gameSessionService'

describe('gameSessionService', () => {
  beforeEach(() => {
    mockResult = { data: null, error: null }
  })

  it('createSession returns session on success', async () => {
    const session = {
      id: 's1',
      player1_id: 'p1',
      player2_id: 'p2',
      player1_list_id: 'l1',
      player2_list_id: 'l2',
      status: 'active',
      created_at: '2026-01-01',
      updated_at: '2026-01-01',
    }
    mockResult = { data: session, error: null }
    const result = await createSession('p1', 'l1', 'p2', 'l2')
    expect(result).toEqual(session)
  })

  it('createSession returns null on error', async () => {
    mockResult = { data: null, error: { message: 'fail' } }
    const result = await createSession('p1', 'l1', 'p2', 'l2')
    expect(result).toBeNull()
  })

  it('getActiveSession returns session on success', async () => {
    const session = { id: 's1', status: 'active' }
    mockResult = { data: session, error: null }
    const result = await getActiveSession('p1')
    expect(result).toEqual(session)
  })

  it('getActiveSession returns null when no session', async () => {
    mockResult = { data: null, error: null }
    const result = await getActiveSession('p1')
    expect(result).toBeNull()
  })

  it('endSession returns true on success', async () => {
    mockResult = { data: null, error: null }
    const result = await endSession('s1', 'completed')
    expect(result).toBe(true)
  })

  it('endSession returns false on error', async () => {
    mockResult = { data: null, error: { message: 'fail' } }
    const result = await endSession('s1', 'completed')
    expect(result).toBe(false)
  })
})

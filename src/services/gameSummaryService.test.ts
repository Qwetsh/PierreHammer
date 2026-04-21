import { describe, it, expect, vi, beforeEach } from 'vitest'
import { computeSummaryStats, createSummary, getSummariesForUser, type SummaryInput } from './gameSummaryService'

// Mock supabase
const mockFrom = vi.fn()
vi.mock('@/lib/supabase', () => ({
  isSupabaseConfigured: true,
  supabase: { from: (...args: unknown[]) => mockFrom(...args) },
}))

function makeInput(overrides: Partial<SummaryInput> = {}): SummaryInput {
  return {
    sessionId: 'sess1',
    player1Id: 'p1',
    player2Id: 'p2',
    player1Faction: 'Space Marines',
    player2Faction: 'Orks',
    player1Detachment: 'Gladius',
    player2Detachment: 'Waaagh!',
    sessionCreatedAt: new Date(Date.now() - 90 * 60000).toISOString(), // 90 min ago
    player1Casualties: {},
    player2Casualties: {},
    player1TotalUnits: 5,
    player2TotalUnits: 5,
    ...overrides,
  }
}

// Proxy-based query builder mock
function mockQueryBuilder(finalData: unknown, finalError: unknown = null) {
  const result = { data: finalData, error: finalError }
  const handler: ProxyHandler<object> = {
    get(_target, prop) {
      if (prop === 'then') {
        // Make it thenable — resolve with data/error when awaited
        return (resolve: (v: unknown) => void) => resolve(result)
      }
      if (prop === 'single' || prop === 'maybeSingle') {
        return () => Promise.resolve(result)
      }
      return (..._args: unknown[]) => new Proxy({}, handler)
    },
  }
  return new Proxy({}, handler)
}

describe('computeSummaryStats', () => {
  it('computes duration from session start', () => {
    const input = makeInput()
    const stats = computeSummaryStats(input)
    expect(stats.durationMinutes).toBeGreaterThanOrEqual(89)
    expect(stats.durationMinutes).toBeLessThanOrEqual(91)
  })

  it('counts models destroyed per player', () => {
    const input = makeInput({
      player1Casualties: {
        u1: { modelsDestroyed: 3, woundsRemaining: null },
        u2: { modelsDestroyed: 1, woundsRemaining: 2 },
      },
      player2Casualties: {
        u3: { modelsDestroyed: 5, woundsRemaining: null },
      },
    })
    const stats = computeSummaryStats(input)
    expect(stats.player1ModelsDestroyed).toBe(4)
    expect(stats.player2ModelsDestroyed).toBe(5)
  })

  it('counts units with casualties as destroyed', () => {
    const input = makeInput({
      player1Casualties: {
        u1: { modelsDestroyed: 3, woundsRemaining: null },
        u2: { modelsDestroyed: 0, woundsRemaining: 5 }, // wounded but no models destroyed
      },
    })
    const stats = computeSummaryStats(input)
    expect(stats.player1UnitsDestroyed).toBe(1) // only u1 has modelsDestroyed > 0
  })

  it('returns zero for no casualties', () => {
    const stats = computeSummaryStats(makeInput())
    expect(stats.player1UnitsDestroyed).toBe(0)
    expect(stats.player2UnitsDestroyed).toBe(0)
    expect(stats.player1ModelsDestroyed).toBe(0)
    expect(stats.player2ModelsDestroyed).toBe(0)
  })
})

describe('createSummary', () => {
  beforeEach(() => { mockFrom.mockReset() })

  it('inserts summary and returns data', async () => {
    const summary = { id: 'sum1', session_id: 'sess1' }
    mockFrom.mockReturnValue(mockQueryBuilder(summary))
    const result = await createSummary(makeInput())
    expect(result).toEqual(summary)
    expect(mockFrom).toHaveBeenCalledWith('game_summaries')
  })

  it('returns null on error', async () => {
    mockFrom.mockReturnValue(mockQueryBuilder(null, { message: 'fail' }))
    const result = await createSummary(makeInput())
    expect(result).toBeNull()
  })
})

describe('getSummariesForUser', () => {
  beforeEach(() => { mockFrom.mockReset() })

  it('returns summaries array', async () => {
    const summaries = [{ id: 'sum1' }, { id: 'sum2' }]
    // getSummariesForUser doesn't call .single(), it returns array
    const builder: Record<string, unknown> = {}
    const handler: ProxyHandler<Record<string, unknown>> = {
      get(_target, prop) {
        if (prop === 'then') return undefined
        if (prop === 'limit') {
          return () => Promise.resolve({ data: summaries, error: null })
        }
        return (..._args: unknown[]) => new Proxy(builder, handler)
      },
    }
    mockFrom.mockReturnValue(new Proxy(builder, handler))

    const result = await getSummariesForUser('p1')
    expect(result).toEqual(summaries)
  })
})

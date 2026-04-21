import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useGameSessionStore } from './gameSessionStore'

const mockCreateSession = vi.fn()
const mockGetActiveSession = vi.fn()
const mockEndSession = vi.fn()
const mockGetProfile = vi.fn()
const mockFetchPublicLists = vi.fn()
const mockLoadFaction = vi.fn()
const mockGetCasualties = vi.fn()
const mockUpsertCasualty = vi.fn()
const mockResetCasualty = vi.fn()
const mockSubscribeToCasualties = vi.fn()

vi.mock('@/services/gameSessionService', () => ({
  createSession: (...args: unknown[]) => mockCreateSession(...args),
  getActiveSession: (...args: unknown[]) => mockGetActiveSession(...args),
  endSession: (...args: unknown[]) => mockEndSession(...args),
}))

vi.mock('@/services/listsSyncService', () => ({
  fetchPublicLists: (...args: unknown[]) => mockFetchPublicLists(...args),
}))

vi.mock('@/services/friendsService', () => ({
  getProfile: (...args: unknown[]) => mockGetProfile(...args),
}))

vi.mock('@/services/casualtySyncService', () => ({
  getCasualties: (...args: unknown[]) => mockGetCasualties(...args),
  upsertCasualty: (...args: unknown[]) => mockUpsertCasualty(...args),
  resetCasualty: (...args: unknown[]) => mockResetCasualty(...args),
  subscribeToCasualties: (...args: unknown[]) => mockSubscribeToCasualties(...args),
}))

vi.mock('./gameDataStore', () => ({
  useGameDataStore: {
    getState: () => ({ loadFaction: mockLoadFaction }),
  },
}))

describe('gameSessionStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    mockSubscribeToCasualties.mockReturnValue(vi.fn())
    useGameSessionStore.setState({
      activeSession: null,
      opponentProfile: null,
      opponentList: null,
      loading: false,
      casualties: {},
      opponentCasualties: {},
      _unsubscribe: null,
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('startSession creates session and loads opponent data', async () => {
    const session = { id: 's1', player1_id: 'p1', player2_id: 'p2', player1_list_id: 'l1', player2_list_id: 'l2', status: 'active' }
    const profile = { id: 'p2', username: 'Bob', display_name: null, created_at: '2026-01-01' }
    const list = { id: 'local', remoteId: 'l2', factionId: 'sm', name: 'Bob list', units: [] }

    mockCreateSession.mockResolvedValue(session)
    mockGetProfile.mockResolvedValue(profile)
    mockFetchPublicLists.mockResolvedValue([list])

    const ok = await useGameSessionStore.getState().startSession('p1', 'l1', 'p2', 'l2')
    expect(ok).toBe(true)

    const state = useGameSessionStore.getState()
    expect(state.activeSession).toEqual(session)
    expect(state.opponentProfile).toEqual(profile)
    expect(state.opponentList).toEqual(list)
    expect(mockLoadFaction).toHaveBeenCalledWith('sm')
    expect(mockSubscribeToCasualties).toHaveBeenCalledWith('s1', expect.any(Function))
  })

  it('startSession returns false on failure', async () => {
    mockCreateSession.mockResolvedValue(null)
    const ok = await useGameSessionStore.getState().startSession('p1', 'l1', 'p2', 'l2')
    expect(ok).toBe(false)
  })

  it('loadSession loads existing session with casualties', async () => {
    const session = { id: 's1', player1_id: 'p1', player2_id: 'p2', player1_list_id: 'l1', player2_list_id: 'l2', status: 'active' }
    const profile = { id: 'p2', username: 'Bob', display_name: null, created_at: '2026-01-01' }
    const list = { id: 'local', remoteId: 'l2', factionId: 'csm', name: 'Bob list', units: [] }

    mockGetActiveSession.mockResolvedValue(session)
    mockGetProfile.mockResolvedValue(profile)
    mockFetchPublicLists.mockResolvedValue([list])
    mockGetCasualties.mockResolvedValue([
      { player_id: 'p1', list_unit_id: 'u1', models_destroyed: 2, wounds_remaining: null },
      { player_id: 'p2', list_unit_id: 'u2', models_destroyed: 1, wounds_remaining: 5 },
    ])

    await useGameSessionStore.getState().loadSession('p1')

    const state = useGameSessionStore.getState()
    expect(state.activeSession).toEqual(session)
    expect(state.casualties).toEqual({ u1: { modelsDestroyed: 2, woundsRemaining: null } })
    expect(state.opponentCasualties).toEqual({ u2: { modelsDestroyed: 1, woundsRemaining: 5 } })
  })

  it('loadSession clears state when no session', async () => {
    mockGetActiveSession.mockResolvedValue(null)
    await useGameSessionStore.getState().loadSession('p1')
    expect(useGameSessionStore.getState().activeSession).toBeNull()
  })

  it('endSession updates status and clears state', async () => {
    const unsub = vi.fn()
    useGameSessionStore.setState({
      activeSession: { id: 's1', player1_id: 'p1', player2_id: 'p2', player1_list_id: 'l1', player2_list_id: 'l2', status: 'active', created_at: '', updated_at: '' },
      opponentProfile: { id: 'p2', username: 'Bob', display_name: null, created_at: '' },
      casualties: { u1: { modelsDestroyed: 2, woundsRemaining: null } },
      _unsubscribe: unsub,
    })
    mockEndSession.mockResolvedValue(true)

    const ok = await useGameSessionStore.getState().endSession('completed')
    expect(ok).toBe(true)
    expect(unsub).toHaveBeenCalled()
    expect(useGameSessionStore.getState().activeSession).toBeNull()
    expect(useGameSessionStore.getState().casualties).toEqual({})
  })

  it('updateCasualty updates local state and debounces sync', () => {
    useGameSessionStore.setState({
      activeSession: { id: 's1', player1_id: 'p1', player2_id: 'p2', player1_list_id: 'l1', player2_list_id: 'l2', status: 'active', created_at: '', updated_at: '' },
    })

    useGameSessionStore.getState().updateCasualty('p1', 'u1', { modelsDestroyed: 3 })
    expect(useGameSessionStore.getState().casualties.u1).toEqual({ modelsDestroyed: 3, woundsRemaining: null })

    // Sync not called yet (debounce)
    expect(mockUpsertCasualty).not.toHaveBeenCalled()

    // After debounce
    vi.advanceTimersByTime(300)
    expect(mockUpsertCasualty).toHaveBeenCalledWith({
      session_id: 's1',
      player_id: 'p1',
      list_unit_id: 'u1',
      models_destroyed: 3,
      wounds_remaining: null,
    })
  })

  it('resetCasualty removes from state and deletes from DB', () => {
    useGameSessionStore.setState({
      activeSession: { id: 's1', player1_id: 'p1', player2_id: 'p2', player1_list_id: 'l1', player2_list_id: 'l2', status: 'active', created_at: '', updated_at: '' },
      casualties: { u1: { modelsDestroyed: 2, woundsRemaining: null } },
    })

    useGameSessionStore.getState().resetCasualty('p1', 'u1')
    expect(useGameSessionStore.getState().casualties.u1).toBeUndefined()
    expect(mockResetCasualty).toHaveBeenCalledWith('s1', 'p1', 'u1')
  })

  it('_applyCasualtyEvent updates correct side', () => {
    useGameSessionStore.setState({
      casualties: {},
      opponentCasualties: {},
    })

    useGameSessionStore.getState()._applyCasualtyEvent(
      { session_id: 's1', player_id: 'p2', list_unit_id: 'u5', models_destroyed: 1, wounds_remaining: 3 },
      'p1',
    )

    expect(useGameSessionStore.getState().opponentCasualties.u5).toEqual({ modelsDestroyed: 1, woundsRemaining: 3 })
    expect(useGameSessionStore.getState().casualties.u5).toBeUndefined()
  })

  it('clearSession resets all state', () => {
    const unsub = vi.fn()
    useGameSessionStore.setState({
      activeSession: { id: 's1' } as never,
      casualties: { u1: { modelsDestroyed: 1, woundsRemaining: null } },
      _unsubscribe: unsub,
    })
    useGameSessionStore.getState().clearSession()
    const state = useGameSessionStore.getState()
    expect(state.activeSession).toBeNull()
    expect(state.casualties).toEqual({})
    expect(unsub).toHaveBeenCalled()
  })
})

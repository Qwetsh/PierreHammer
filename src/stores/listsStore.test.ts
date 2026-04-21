import { vi, describe, it, expect, beforeEach } from 'vitest'
import { useListsStore } from './listsStore'

// Mock the sync service to be a no-op in existing tests
vi.mock('@/services/listsSyncService', () => ({
  fetchRemoteLists: vi.fn().mockResolvedValue([]),
  pushList: vi.fn().mockResolvedValue(null),
  updateRemoteList: vi.fn().mockResolvedValue(true),
  deleteRemoteList: vi.fn().mockResolvedValue(true),
  setListPublic: vi.fn().mockResolvedValue(true),
}))

// Mock authStore — mutable for per-test override
let mockAuthState = { user: null as { id: string } | null, isAuthenticated: false }
vi.mock('@/stores/authStore', () => ({
  useAuthStore: {
    getState: () => ({ ...mockAuthState, loading: false, initialize: vi.fn(), signUp: vi.fn(), signIn: vi.fn(), signOut: vi.fn() }),
  },
}))

describe('listsStore', () => {
  beforeEach(() => {
    useListsStore.setState({ lists: {}, syncing: false })
  })

  it('creates a list and returns its id', () => {
    const id = useListsStore.getState().createList('Ma liste', 'space-marines', 'Gladius', 2000)
    expect(id).toBeTruthy()
    const list = useListsStore.getState().getList(id)
    expect(list?.name).toBe('Ma liste')
    expect(list?.factionId).toBe('space-marines')
    expect(list?.detachment).toBe('Gladius')
    expect(list?.pointsLimit).toBe(2000)
    expect(list?.units).toEqual([])
  })

  it('deletes a list', () => {
    const id = useListsStore.getState().createList('Test', 'f-1', 'det', 1000)
    useListsStore.getState().deleteList(id)
    expect(useListsStore.getState().getList(id)).toBeUndefined()
  })

  it('returns all lists', () => {
    useListsStore.getState().createList('First', 'f-1', 'det', 1000)
    useListsStore.getState().createList('Second', 'f-1', 'det', 2000)
    const all = useListsStore.getState().getAllLists()
    expect(all).toHaveLength(2)
    const names = all.map((l) => l.name)
    expect(names).toContain('First')
    expect(names).toContain('Second')
  })

  it('adds a unit to a list', () => {
    const id = useListsStore.getState().createList('Test', 'f-1', 'det', 2000)
    useListsStore.getState().addUnit(id, { id: 'u1', datasheetId: 'ds-1', datasheetName: 'Intercessors', points: 90, selectedPointOptionIndex: 0, selectedWeapons: [], notes: '' })
    expect(useListsStore.getState().getList(id)?.units).toHaveLength(1)
  })

  it('removes a unit from a list by index', () => {
    const id = useListsStore.getState().createList('Test', 'f-1', 'det', 2000)
    useListsStore.getState().addUnit(id, { id: 'u1', datasheetId: 'ds-1', datasheetName: 'Intercessors', points: 90, selectedPointOptionIndex: 0, selectedWeapons: [], notes: '' })
    useListsStore.getState().addUnit(id, { id: 'u2', datasheetId: 'ds-2', datasheetName: 'Terminators', points: 200, selectedPointOptionIndex: 0, selectedWeapons: [], notes: '' })
    useListsStore.getState().removeUnit(id, 0)
    const units = useListsStore.getState().getList(id)?.units ?? []
    expect(units).toHaveLength(1)
    expect(units[0].datasheetName).toBe('Terminators')
  })

  it('updates list properties', () => {
    const id = useListsStore.getState().createList('Old Name', 'f-1', 'det', 1000)
    useListsStore.getState().updateList(id, { name: 'New Name', pointsLimit: 3000 })
    const list = useListsStore.getState().getList(id)
    expect(list?.name).toBe('New Name')
    expect(list?.pointsLimit).toBe(3000)
  })
})

describe('listsStore syncOnLogin', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useListsStore.setState({ lists: {}, syncing: false })
    mockAuthState = { user: null, isAuthenticated: false }
  })

  it('merges remote lists on login', async () => {
    useListsStore.setState({
      lists: {
        'local-1': {
          id: 'local-1',
          name: 'Local List',
          factionId: 'orks',
          detachment: 'Waaagh',
          pointsLimit: 1000,
          units: [],
          createdAt: 1000,
        },
      },
    })

    mockAuthState = { user: { id: 'user-uuid' }, isAuthenticated: true }

    const syncModule = await import('@/services/listsSyncService')
    vi.mocked(syncModule.fetchRemoteLists).mockResolvedValue([
      {
        id: 'remote-uuid',
        remoteId: 'remote-uuid',
        name: 'Remote List',
        factionId: 'space-marines',
        detachment: 'Gladius',
        pointsLimit: 2000,
        units: [],
        createdAt: 2000,
        isPublic: false,
      },
    ])
    vi.mocked(syncModule.pushList).mockResolvedValue('new-remote-uuid')

    await useListsStore.getState().syncOnLogin()

    const lists = useListsStore.getState().getAllLists()
    expect(lists).toHaveLength(2)

    const names = lists.map((l) => l.name)
    expect(names).toContain('Remote List')
    expect(names).toContain('Local List')

    const localList = lists.find((l) => l.name === 'Local List')
    expect(localList?.remoteId).toBe('new-remote-uuid')
  })

  it('does nothing if not authenticated', async () => {
    mockAuthState = { user: null, isAuthenticated: false }

    await useListsStore.getState().syncOnLogin()
    expect(useListsStore.getState().syncing).toBe(false)
  })
})

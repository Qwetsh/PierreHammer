import { useListsStore } from './listsStore'

describe('listsStore', () => {
  beforeEach(() => {
    useListsStore.setState({ lists: {} })
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
    useListsStore.getState().addUnit(id, { datasheetId: 'ds-1', datasheetName: 'Intercessors', points: 90, selectedPointOptionIndex: 0, selectedWeapons: [], notes: '' })
    expect(useListsStore.getState().getList(id)?.units).toHaveLength(1)
  })

  it('removes a unit from a list by index', () => {
    const id = useListsStore.getState().createList('Test', 'f-1', 'det', 2000)
    useListsStore.getState().addUnit(id, { datasheetId: 'ds-1', datasheetName: 'Intercessors', points: 90, selectedPointOptionIndex: 0, selectedWeapons: [], notes: '' })
    useListsStore.getState().addUnit(id, { datasheetId: 'ds-2', datasheetName: 'Terminators', points: 200, selectedPointOptionIndex: 0, selectedWeapons: [], notes: '' })
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

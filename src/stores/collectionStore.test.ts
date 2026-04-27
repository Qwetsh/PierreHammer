import { useCollectionStore } from './collectionStore'

describe('collectionStore', () => {
  beforeEach(() => {
    useCollectionStore.setState({ items: {} })
  })

  it('adds an item with one squad of N unassembled models', () => {
    useCollectionStore.getState().addItem('ds-1', 'f-1', 5)
    const item = useCollectionStore.getState().getItem('ds-1')
    expect(item).toEqual({
      datasheetId: 'ds-1',
      factionId: 'f-1',
      squads: [['unassembled', 'unassembled', 'unassembled', 'unassembled', 'unassembled']],
    })
    expect(useCollectionStore.getState().getOwnedCount('ds-1')).toBe(5)
  })

  it('adds another squad when item already exists', () => {
    useCollectionStore.getState().addItem('ds-1', 'f-1', 3)
    useCollectionStore.getState().addItem('ds-1', 'f-1', 3)
    expect(useCollectionStore.getState().getSquadCount('ds-1')).toBe(2)
    expect(useCollectionStore.getState().getOwnedCount('ds-1')).toBe(6)
  })

  it('removes an item entirely', () => {
    useCollectionStore.getState().addItem('ds-1', 'f-1')
    useCollectionStore.getState().removeItem('ds-1')
    expect(useCollectionStore.getState().isOwned('ds-1')).toBe(false)
  })

  it('removes a specific squad', () => {
    useCollectionStore.getState().addItem('ds-1', 'f-1', 2)
    useCollectionStore.getState().addSquad('ds-1', 2)
    useCollectionStore.getState().updateModelStatus('ds-1', 1, 0, 'done')
    useCollectionStore.getState().removeSquad('ds-1', 0)
    const item = useCollectionStore.getState().getItem('ds-1')
    expect(item?.squads).toEqual([['done', 'unassembled']])
  })

  it('removes item when last squad is removed', () => {
    useCollectionStore.getState().addItem('ds-1', 'f-1')
    useCollectionStore.getState().removeSquad('ds-1', 0)
    expect(useCollectionStore.getState().isOwned('ds-1')).toBe(false)
  })

  it('adds a squad to existing item', () => {
    useCollectionStore.getState().addItem('ds-1', 'f-1', 5)
    useCollectionStore.getState().addSquad('ds-1', 5)
    expect(useCollectionStore.getState().getSquadCount('ds-1')).toBe(2)
    expect(useCollectionStore.getState().getOwnedCount('ds-1')).toBe(10)
  })

  it('updates individual model status', () => {
    useCollectionStore.getState().addItem('ds-1', 'f-1', 3)
    useCollectionStore.getState().updateModelStatus('ds-1', 0, 0, 'done')
    useCollectionStore.getState().updateModelStatus('ds-1', 0, 1, 'assembled')
    const item = useCollectionStore.getState().getItem('ds-1')
    expect(item?.squads).toEqual([['done', 'assembled', 'unassembled']])
  })

  it('sets all models in a squad to same status', () => {
    useCollectionStore.getState().addItem('ds-1', 'f-1', 3)
    useCollectionStore.getState().setSquadStatus('ds-1', 0, 'done')
    const item = useCollectionStore.getState().getItem('ds-1')
    expect(item?.squads).toEqual([['done', 'done', 'done']])
  })

  it('isOwned returns false for unknown item', () => {
    expect(useCollectionStore.getState().isOwned('unknown')).toBe(false)
  })

  it('getOwnedCount returns 0 for unknown item', () => {
    expect(useCollectionStore.getState().getOwnedCount('unknown')).toBe(0)
  })

  it('getProgressStats counts models across all squads', () => {
    useCollectionStore.getState().addItem('ds-1', 'f-1', 2)
    useCollectionStore.getState().addSquad('ds-1', 2)
    useCollectionStore.getState().updateModelStatus('ds-1', 0, 0, 'done')
    useCollectionStore.getState().addItem('ds-2', 'f-1', 1)
    const stats = useCollectionStore.getState().getProgressStats()
    expect(stats.total).toBe(5)
    expect(stats.completed).toBe(1)
    expect(stats.unassembled).toBe(4)
  })
})

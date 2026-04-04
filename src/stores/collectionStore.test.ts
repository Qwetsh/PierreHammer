import { useCollectionStore } from './collectionStore'

describe('collectionStore', () => {
  beforeEach(() => {
    useCollectionStore.setState({ items: {} })
  })

  it('adds an item with one unassembled instance', () => {
    useCollectionStore.getState().addItem('ds-1', 'f-1')
    const item = useCollectionStore.getState().getItem('ds-1')
    expect(item).toEqual({
      datasheetId: 'ds-1',
      factionId: 'f-1',
      instances: ['unassembled'],
    })
  })

  it('adds another instance when item already exists', () => {
    useCollectionStore.getState().addItem('ds-1', 'f-1')
    useCollectionStore.getState().addItem('ds-1', 'f-1')
    expect(useCollectionStore.getState().getOwnedCount('ds-1')).toBe(2)
  })

  it('removes an item entirely', () => {
    useCollectionStore.getState().addItem('ds-1', 'f-1')
    useCollectionStore.getState().removeItem('ds-1')
    expect(useCollectionStore.getState().isOwned('ds-1')).toBe(false)
  })

  it('removes a specific instance', () => {
    useCollectionStore.getState().addItem('ds-1', 'f-1')
    useCollectionStore.getState().addItem('ds-1', 'f-1')
    useCollectionStore.getState().updateInstanceStatus('ds-1', 1, 'done')
    useCollectionStore.getState().removeInstance('ds-1', 0)
    const item = useCollectionStore.getState().getItem('ds-1')
    expect(item?.instances).toEqual(['done'])
  })

  it('removes item when last instance is removed', () => {
    useCollectionStore.getState().addItem('ds-1', 'f-1')
    useCollectionStore.getState().removeInstance('ds-1', 0)
    expect(useCollectionStore.getState().isOwned('ds-1')).toBe(false)
  })

  it('adds an instance to existing item', () => {
    useCollectionStore.getState().addItem('ds-1', 'f-1')
    useCollectionStore.getState().addInstance('ds-1')
    expect(useCollectionStore.getState().getOwnedCount('ds-1')).toBe(2)
  })

  it('updates instance status by index', () => {
    useCollectionStore.getState().addItem('ds-1', 'f-1')
    useCollectionStore.getState().addItem('ds-1', 'f-1')
    useCollectionStore.getState().updateInstanceStatus('ds-1', 0, 'done')
    useCollectionStore.getState().updateInstanceStatus('ds-1', 1, 'assembled')
    const item = useCollectionStore.getState().getItem('ds-1')
    expect(item?.instances).toEqual(['done', 'assembled'])
  })

  it('isOwned returns false for unknown item', () => {
    expect(useCollectionStore.getState().isOwned('unknown')).toBe(false)
  })

  it('getOwnedCount returns 0 for unknown item', () => {
    expect(useCollectionStore.getState().getOwnedCount('unknown')).toBe(0)
  })

  it('getProgressStats counts instances across all items', () => {
    useCollectionStore.getState().addItem('ds-1', 'f-1')
    useCollectionStore.getState().addItem('ds-1', 'f-1')
    useCollectionStore.getState().updateInstanceStatus('ds-1', 0, 'done')
    useCollectionStore.getState().addItem('ds-2', 'f-1')
    const stats = useCollectionStore.getState().getProgressStats()
    expect(stats.total).toBe(3)
    expect(stats.completed).toBe(1)
    expect(stats.unassembled).toBe(2)
  })
})

import { useCollectionStore } from './collectionStore'

describe('collectionStore', () => {
  beforeEach(() => {
    useCollectionStore.setState({ items: {} })
  })

  it('adds an item with default quantity and paint status', () => {
    useCollectionStore.getState().addItem('ds-1', 'f-1')
    const item = useCollectionStore.getState().getItem('ds-1')
    expect(item).toEqual({
      datasheetId: 'ds-1',
      factionId: 'f-1',
      quantity: 1,
      paintStatus: 'unassembled',
    })
  })

  it('adds an item with custom quantity', () => {
    useCollectionStore.getState().addItem('ds-1', 'f-1', 3)
    expect(useCollectionStore.getState().getOwnedCount('ds-1')).toBe(3)
  })

  it('removes an item', () => {
    useCollectionStore.getState().addItem('ds-1', 'f-1')
    useCollectionStore.getState().removeItem('ds-1')
    expect(useCollectionStore.getState().isOwned('ds-1')).toBe(false)
  })

  it('updates quantity', () => {
    useCollectionStore.getState().addItem('ds-1', 'f-1')
    useCollectionStore.getState().updateQuantity('ds-1', 5)
    expect(useCollectionStore.getState().getOwnedCount('ds-1')).toBe(5)
  })

  it('removes item when quantity set to 0', () => {
    useCollectionStore.getState().addItem('ds-1', 'f-1', 2)
    useCollectionStore.getState().updateQuantity('ds-1', 0)
    expect(useCollectionStore.getState().isOwned('ds-1')).toBe(false)
  })

  it('updates paint status', () => {
    useCollectionStore.getState().addItem('ds-1', 'f-1')
    useCollectionStore.getState().updateStatus('ds-1', 'done')
    expect(useCollectionStore.getState().getItem('ds-1')?.paintStatus).toBe('done')
  })

  it('isOwned returns false for unknown item', () => {
    expect(useCollectionStore.getState().isOwned('unknown')).toBe(false)
  })

  it('getOwnedCount returns 0 for unknown item', () => {
    expect(useCollectionStore.getState().getOwnedCount('unknown')).toBe(0)
  })
})

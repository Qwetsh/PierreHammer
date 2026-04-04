import { renderHook } from '@testing-library/react'
import { useFactionTheme } from './useFactionTheme'

describe('useFactionTheme', () => {
  afterEach(() => {
    delete document.documentElement.dataset.faction
  })

  it('sets data-faction attribute on html element', () => {
    renderHook(() => useFactionTheme('space-marines'))
    expect(document.documentElement.dataset.faction).toBe('space-marines')
  })

  it('updates data-faction when faction changes', () => {
    const { rerender } = renderHook(
      ({ faction }) => useFactionTheme(faction),
      { initialProps: { faction: 'space-marines' as string | null } }
    )
    expect(document.documentElement.dataset.faction).toBe('space-marines')

    rerender({ faction: 'orks' })
    expect(document.documentElement.dataset.faction).toBe('orks')
  })

  it('removes data-faction on cleanup', () => {
    const { unmount } = renderHook(() => useFactionTheme('necrons'))
    expect(document.documentElement.dataset.faction).toBe('necrons')

    unmount()
    expect(document.documentElement.dataset.faction).toBeUndefined()
  })

  it('removes data-faction when null is passed', () => {
    const { rerender } = renderHook(
      ({ faction }) => useFactionTheme(faction),
      { initialProps: { faction: 'chaos' as string | null } }
    )
    expect(document.documentElement.dataset.faction).toBe('chaos')

    rerender({ faction: null })
    expect(document.documentElement.dataset.faction).toBeUndefined()
  })
})

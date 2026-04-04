import { renderHook } from '@testing-library/react'
import { useSearch } from './useSearch'

interface TestItem {
  name: string
  tags: string[]
}

const items: TestItem[] = [
  { name: 'Intercessors', tags: ['Infantry', 'Battleline'] },
  { name: 'Terminators', tags: ['Infantry', 'Elite'] },
  { name: 'Redemptor Dreadnought', tags: ['Vehicle', 'Walker'] },
]

const extract = (item: TestItem) => [item.name, ...item.tags]

describe('useSearch', () => {
  it('returns all items when query is empty', () => {
    const { result } = renderHook(() => useSearch(items, '', extract))
    expect(result.current).toHaveLength(3)
  })

  it('returns all items when query is less than 2 chars', () => {
    const { result } = renderHook(() => useSearch(items, 'I', extract))
    expect(result.current).toHaveLength(3)
  })

  it('filters by name substring', () => {
    const { result } = renderHook(() => useSearch(items, 'termin', extract))
    expect(result.current).toHaveLength(1)
    expect(result.current[0].name).toBe('Terminators')
  })

  it('filters by tag/keyword', () => {
    const { result } = renderHook(() => useSearch(items, 'vehicle', extract))
    expect(result.current).toHaveLength(1)
    expect(result.current[0].name).toBe('Redemptor Dreadnought')
  })

  it('is case-insensitive', () => {
    const { result } = renderHook(() => useSearch(items, 'INFANTRY', extract))
    expect(result.current).toHaveLength(2)
  })

  it('returns empty array when no match', () => {
    const { result } = renderHook(() => useSearch(items, 'Tyranid', extract))
    expect(result.current).toHaveLength(0)
  })

  it('matches partial strings', () => {
    const { result } = renderHook(() => useSearch(items, 'Dread', extract))
    expect(result.current).toHaveLength(1)
    expect(result.current[0].name).toBe('Redemptor Dreadnought')
  })

  it('trims whitespace from query', () => {
    const { result } = renderHook(() => useSearch(items, '  termin  ', extract))
    expect(result.current).toHaveLength(1)
  })
})

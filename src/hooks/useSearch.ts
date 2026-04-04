import { useMemo } from 'react'

type FieldExtractor<T> = (item: T) => string | string[]

export function useSearch<T>(items: T[], query: string, extractFields: FieldExtractor<T>): T[] {
  return useMemo(() => {
    const trimmed = query.trim().toLowerCase()
    if (trimmed.length < 2) return items

    return items.filter((item) => {
      const fields = extractFields(item)
      const values = Array.isArray(fields) ? fields : [fields]
      return values.some((v) => v.toLowerCase().includes(trimmed))
    })
  }, [items, query, extractFields])
}

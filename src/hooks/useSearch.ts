import { useMemo } from 'react'

type FieldExtractor<T> = (item: T) => string | string[]

export function useSearch<T>(
  items: T[],
  query: string,
  extractFields: FieldExtractor<T>,
  translate?: (key: string) => string,
): T[] {
  return useMemo(() => {
    const trimmed = query.trim().toLowerCase()
    if (trimmed.length < 2) return items

    const words = trimmed.split(/\s+/).filter(Boolean)

    return items.filter((item) => {
      const fields = extractFields(item)
      const raw = Array.isArray(fields) ? fields : [fields]
      const values = translate
        ? raw.flatMap((v) => { const tr = translate(v); return tr !== v ? [v, tr] : [v] })
        : raw
      return words.every((word) =>
        values.some((v) => v.toLowerCase().includes(word))
      )
    })
  }, [items, query, extractFields, translate])
}

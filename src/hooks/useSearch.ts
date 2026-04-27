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

    const allWords = trimmed.split(/\s+/).filter(Boolean)
    const positiveWords = allWords.filter((w) => !w.startsWith('-'))
    const negativeWords = allWords.filter((w) => w.startsWith('-') && w.length > 1).map((w) => w.slice(1))

    return items.filter((item) => {
      const fields = extractFields(item)
      const raw = Array.isArray(fields) ? fields : [fields]
      const values = translate
        ? raw.flatMap((v) => { const tr = translate(v); return tr !== v ? [v, tr] : [v] })
        : raw
      const matchesPositive = positiveWords.length === 0 || positiveWords.every((word) =>
        values.some((v) => v.toLowerCase().includes(word))
      )
      const matchesNegative = negativeWords.some((word) =>
        values.some((v) => v.toLowerCase().includes(word))
      )
      return matchesPositive && !matchesNegative
    })
  }, [items, query, extractFields, translate])
}

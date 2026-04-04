export interface Segment {
  value: number
  color: string
  label: string
}

interface ProgressBarProps {
  value?: number
  variant?: 'simple' | 'segmented'
  segments?: Segment[]
}

export function ProgressBar({ value = 0, variant = 'simple', segments }: ProgressBarProps) {
  if (variant === 'segmented' && segments) {
    const total = segments.reduce((sum, s) => sum + s.value, 0)

    return (
      <div>
        <div
          className="flex w-full h-3 rounded-full overflow-hidden"
          style={{ backgroundColor: 'var(--color-surface)' }}
          role="progressbar"
          aria-valuenow={Math.round(value)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Progression de la collection"
        >
          {segments.map((seg, i) => {
            const pct = total > 0 ? (seg.value / total) * 100 : 0
            if (pct === 0) return null
            return (
              <div
                key={i}
                style={{ width: `${pct}%`, backgroundColor: seg.color }}
                title={`${seg.label}: ${seg.value}`}
              />
            )
          })}
        </div>
        <div className="flex flex-wrap gap-3 mt-2">
          {segments.map((seg, i) => (
            <div key={i} className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-text-muted)' }}>
              <span
                className="inline-block w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: seg.color }}
              />
              {seg.label}: {seg.value}
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div
      className="w-full h-3 rounded-full overflow-hidden"
      style={{ backgroundColor: 'var(--color-surface)' }}
      role="progressbar"
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Progression de la collection"
    >
      <div
        className="h-full rounded-full transition-all"
        style={{ width: `${Math.min(100, Math.max(0, value))}%`, backgroundColor: 'var(--color-success)' }}
      />
    </div>
  )
}

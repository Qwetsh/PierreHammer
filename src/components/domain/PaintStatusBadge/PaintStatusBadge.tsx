import { useState, useCallback } from 'react'

export type PaintStatus = 'unassembled' | 'assembled' | 'in-progress' | 'done'

interface PaintStatusBadgeProps {
  status: PaintStatus
  size?: 'dot' | 'full'
  onCycle?: () => void
}

const statusConfig: Record<PaintStatus, { symbol: string; label: string; color: string }> = {
  unassembled: { symbol: '○', label: 'Non montée', color: 'var(--color-text-muted)' },
  assembled: { symbol: '◐', label: 'Montée', color: 'var(--color-warning)' },
  'in-progress': { symbol: '◑', label: 'En cours', color: 'var(--color-accent)' },
  done: { symbol: '●', label: 'Terminée', color: 'var(--color-success)' },
}

export function PaintStatusBadge({ status, size = 'dot', onCycle }: PaintStatusBadgeProps) {
  const config = statusConfig[status]
  const [pulsing, setPulsing] = useState(false)

  const handleClick = useCallback(() => {
    if (!onCycle) return
    setPulsing(true)
    onCycle()
  }, [onCycle])

  const handleAnimationEnd = useCallback(() => {
    setPulsing(false)
  }, [])

  if (size === 'dot') {
    return (
      <button
        onClick={handleClick}
        disabled={!onCycle}
        className={`inline-flex items-center justify-center min-h-[44px] min-w-[44px] bg-transparent border-none cursor-pointer disabled:cursor-default${pulsing ? ' animate-pulse-once' : ''}`}
        style={{ color: config.color }}
        aria-label={config.label}
        onAnimationEnd={handleAnimationEnd}
      >
        <span className="text-lg">{config.symbol}</span>
      </button>
    )
  }

  return (
    <button
      onClick={handleClick}
      disabled={!onCycle}
      className={`inline-flex items-center gap-2 px-2 py-1 rounded min-h-[44px] bg-transparent border-none cursor-pointer disabled:cursor-default${pulsing ? ' animate-pulse-once' : ''}`}
      style={{ color: config.color }}
      aria-label={config.label}
      onAnimationEnd={handleAnimationEnd}
    >
      <span className="text-lg">{config.symbol}</span>
      <span className="text-sm">{config.label}</span>
    </button>
  )
}

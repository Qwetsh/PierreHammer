import { useState, useEffect, useRef } from 'react'

interface PointsCounterProps {
  current: number
  limit: number
}

function getColor(current: number, limit: number): string {
  if (current > limit) return 'var(--color-error)'
  if (current > limit * 0.9) return 'var(--color-warning)'
  return 'var(--color-success)'
}

export function PointsCounter({ current, limit }: PointsCounterProps) {
  const [pulsing, setPulsing] = useState(false)
  const prevCurrent = useRef(current)

  useEffect(() => {
    if (prevCurrent.current !== current) {
      setPulsing(true)
      prevCurrent.current = current
    }
  }, [current])

  return (
    <span
      className={`font-medium${pulsing ? ' animate-pulse-once' : ''}`}
      style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--text-xl)',
        color: getColor(current, limit),
      }}
      aria-live="polite"
      onAnimationEnd={() => setPulsing(false)}
    >
      {current} / {limit} pts
    </span>
  )
}

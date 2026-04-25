import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'

interface StepExplainerProps {
  lines: string[]
  children: React.ReactNode
  color?: string
  /** If true, hide the [?] indicator (for inline elements like pills) */
  inline?: boolean
}

function TooltipContent({ lines, color }: { lines: string[]; color: string }) {
  return (
    <>
      {lines.map((line, i) => {
        const isSummary = line.startsWith('Seuil final') || line.startsWith('Degats effectifs') || line.startsWith('PV par modele') || line.startsWith('Total:')
        return (
          <div
            key={i}
            style={{
              fontSize: 10,
              fontFamily: 'var(--font-mono)',
              color: isSummary ? color : 'var(--color-text-dim, #94a3b8)',
              lineHeight: 1.5,
              fontWeight: isSummary ? 600 : 400,
              borderTop: isSummary && i > 0
                ? '1px solid rgba(255,255,255,0.08)' : undefined,
              paddingTop: isSummary && i > 0 ? 4 : undefined,
              marginTop: isSummary && i > 0 ? 4 : undefined,
            }}
          >
            {line}
          </div>
        )
      })}
    </>
  )
}

export function StepExplainer({ lines, children, color = 'var(--color-accent)', inline = false }: StepExplainerProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ top: number; left: number; arrowLeft: number } | null>(null)

  const updatePosition = useCallback(() => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const tooltipWidth = 280
    // Center on trigger, but clamp to viewport
    let left = rect.left + rect.width / 2 - tooltipWidth / 2
    left = Math.max(8, Math.min(left, window.innerWidth - tooltipWidth - 8))
    const arrowLeft = rect.left + rect.width / 2 - left
    setPos({ top: rect.top - 6, left, arrowLeft })
  }, [])

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    document.addEventListener('touchstart', handler)
    return () => {
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('touchstart', handler)
    }
  }, [open])

  // Recalc position on scroll/resize when open
  useEffect(() => {
    if (!open) return
    updatePosition()
    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)
    return () => {
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
    }
  }, [open, updatePosition])

  if (lines.length === 0) return <>{children}</>

  const hint = !inline && (
    <div style={{
      fontSize: 7,
      fontFamily: 'var(--font-mono)',
      color,
      opacity: 0.6,
      letterSpacing: 0.5,
      marginTop: 2,
    }}>
      [?]
    </div>
  )

  const portalTooltip = open && pos && createPortal(
    <div
      style={{
        position: 'fixed',
        bottom: window.innerHeight - pos.top,
        left: pos.left,
        width: 280,
        background: '#1a1f2e',
        border: `1px solid ${color}`,
        padding: '8px 10px',
        zIndex: 10000,
        boxShadow: `0 4px 16px rgba(0,0,0,0.5), 0 0 8px ${color}33`,
        pointerEvents: 'none',
      }}
    >
      {/* Arrow */}
      <div style={{
        position: 'absolute',
        bottom: -5,
        left: pos.arrowLeft,
        width: 8,
        height: 8,
        background: '#1a1f2e',
        borderRight: `1px solid ${color}`,
        borderBottom: `1px solid ${color}`,
        transform: 'rotate(45deg)',
      }} />
      <TooltipContent lines={lines} color={color} />
    </div>,
    document.body,
  )

  return (
    <div
      ref={ref}
      style={{ position: 'relative', cursor: 'pointer', display: inline ? 'inline-block' : undefined }}
      onClick={() => setOpen(!open)}
      onMouseEnter={() => { updatePosition(); setOpen(true) }}
      onMouseLeave={() => setOpen(false)}
    >
      {children}
      {hint}
      {portalTooltip}
    </div>
  )
}

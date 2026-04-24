import { useState, useRef, useCallback, useEffect, type ReactNode } from 'react'
import { BottomNav } from '@/components/ui/BottomNav'
import { CalculatorModal } from '@/components/ui/CalculatorModal/CalculatorModal'
import { usePreferencesStore } from '@/stores/preferencesStore'

const FAB_SIZE = 48
const EDGE_MARGIN = 8
const STORAGE_KEY = 'pierrehammer-fab-pos'

function getDefaultPos() {
  return {
    x: window.innerWidth - FAB_SIZE - 16,
    y: window.innerHeight - FAB_SIZE - 56 - 16,
  }
}

function clamp(pos: { x: number; y: number }) {
  return {
    x: Math.max(EDGE_MARGIN, Math.min(pos.x, window.innerWidth - FAB_SIZE - EDGE_MARGIN)),
    y: Math.max(EDGE_MARGIN, Math.min(pos.y, window.innerHeight - FAB_SIZE - EDGE_MARGIN)),
  }
}

function loadSavedPos(): { x: number; y: number } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (typeof parsed.x === 'number' && typeof parsed.y === 'number') return clamp(parsed)
  } catch { /* ignore */ }
  return null
}

function DraggableFab({ onClick }: { onClick: () => void }) {
  const [pos, setPos] = useState(() => loadSavedPos() || getDefaultPos())
  const dragging = useRef(false)
  const hasMoved = useRef(false)
  const startTouch = useRef({ x: 0, y: 0 })
  const startPos = useRef({ x: 0, y: 0 })
  const fabRef = useRef<HTMLButtonElement>(null)

  // Keep position in bounds on resize
  useEffect(() => {
    const onResize = () => setPos((p) => clamp(p))
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const endDrag = useCallback((clientX: number, clientY: number) => {
    if (!dragging.current) return
    dragging.current = false
    if (hasMoved.current) {
      const final = clamp({ x: startPos.current.x + (clientX - startTouch.current.x), y: startPos.current.y + (clientY - startTouch.current.y) })
      setPos(final)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(final))
    } else {
      onClick()
    }
  }, [onClick])

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault()
    dragging.current = true
    hasMoved.current = false
    startTouch.current = { x: e.clientX, y: e.clientY }
    startPos.current = { ...pos }
  }, [pos])

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current) return
    const dx = e.clientX - startTouch.current.x
    const dy = e.clientY - startTouch.current.y
    if (!hasMoved.current && Math.abs(dx) < 4 && Math.abs(dy) < 4) return
    hasMoved.current = true
    setPos(clamp({ x: startPos.current.x + dx, y: startPos.current.y + dy }))
  }, [])

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    endDrag(e.clientX, e.clientY)
  }, [endDrag])

  const onPointerCancel = useCallback(() => {
    // On mobile, pointercancel can fire instead of pointerup — treat as tap
    if (dragging.current && !hasMoved.current) {
      dragging.current = false
      onClick()
    } else {
      dragging.current = false
    }
  }, [onClick])

  return (
    <button
      ref={fabRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      className="fixed z-50 flex items-center justify-center rounded-full border-none cursor-grab active:cursor-grabbing select-none"
      style={{
        left: pos.x,
        top: pos.y,
        width: FAB_SIZE,
        height: FAB_SIZE,
        backgroundColor: 'var(--color-accent)',
        color: '#ffffff',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4), 0 0 12px color-mix(in srgb, var(--color-accent) 30%, transparent)',
        touchAction: 'none',
      }}
      title="Calculateur"
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="2" width="16" height="20" rx="2" />
        <line x1="8" y1="6" x2="16" y2="6" />
        <line x1="8" y1="10" x2="10" y2="10" />
        <line x1="14" y1="10" x2="16" y2="10" />
        <line x1="8" y1="14" x2="10" y2="14" />
        <line x1="14" y1="14" x2="16" y2="14" />
        <line x1="8" y1="18" x2="16" y2="18" />
      </svg>
    </button>
  )
}

export function AppShell({ children }: { children: ReactNode }) {
  const [calcOpen, setCalcOpen] = useState(false)
  const showCalculatorFab = usePreferencesStore((s) => s.showCalculatorFab)

  return (
    <div
      className="min-h-screen relative"
      style={{
        backgroundColor: 'var(--color-bg)',
        backgroundImage: 'var(--faction-gradient)',
        backgroundAttachment: 'fixed',
        transition: 'background 0.5s ease',
      }}
    >
      {/* HUD scan lines overlay (desktop only) */}
      <div
        className="hidden lg:block fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: `repeating-linear-gradient(0deg, rgba(79,212,255,0.018) 0 1px, transparent 1px 4px)`,
        }}
      />

      <a href="#main-content" className="skip-link">
        Aller au contenu principal
      </a>
      <main
        id="main-content"
        className="relative z-10 p-4 lg:ml-[200px] lg:p-0"
        style={{ paddingBottom: 'calc(56px + env(safe-area-inset-bottom, 0px) + 16px)' }}
      >
        {children}
      </main>
      <BottomNav />

      {/* Draggable Calculator FAB */}
      {showCalculatorFab && <DraggableFab onClick={() => setCalcOpen(true)} />}

      {/* Calculator modal */}
      <CalculatorModal open={calcOpen} onClose={() => setCalcOpen(false)} />
    </div>
  )
}

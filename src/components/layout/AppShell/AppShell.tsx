import { useState, useRef, useEffect, type ReactNode } from 'react'
import { BottomNav } from '@/components/ui/BottomNav'
import { CalculatorModal } from '@/components/ui/CalculatorModal/CalculatorModal'
import { usePreferencesStore } from '@/stores/preferencesStore'

const FAB_SIZE = 48
const DOCKED_WIDTH = 6
const DOCKED_HEIGHT = 56
const EDGE_MARGIN = 8
const DOCK_THRESHOLD = 24
const STORAGE_KEY = 'pierrehammer-fab-pos'
const STORAGE_KEY_DOCK = 'pierrehammer-fab-dock'

type DockSide = 'left' | 'right' | null

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

function loadSavedDock(): { side: DockSide; y: number } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DOCK)
    if (!raw) return { side: null, y: 0 }
    const parsed = JSON.parse(raw)
    return { side: parsed.side || null, y: parsed.y || 0 }
  } catch { /* ignore */ }
  return { side: null, y: 0 }
}

function DraggableFab({ onClick }: { onClick: () => void }) {
  const [pos, setPos] = useState(() => loadSavedPos() || getDefaultPos())
  const [docked, setDocked] = useState<DockSide>(() => loadSavedDock().side)
  const [dockedY, setDockedY] = useState(() => loadSavedDock().y)
  const dragging = useRef(false)
  const hasMoved = useRef(false)
  const startTouch = useRef({ x: 0, y: 0 })
  const startPos = useRef({ x: 0, y: 0 })
  const fabRef = useRef<HTMLButtonElement>(null)
  const onClickRef = useRef(onClick)
  onClickRef.current = onClick
  const dockedRef = useRef(docked)
  dockedRef.current = docked

  // Keep position in bounds on resize
  useEffect(() => {
    const onResize = () => setPos((p) => clamp(p))
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // All drag + tap logic via native listeners
  useEffect(() => {
    const el = fabRef.current
    if (!el) return

    const beginDrag = (clientX: number, clientY: number) => {
      dragging.current = true
      hasMoved.current = false
      startTouch.current = { x: clientX, y: clientY }

      // Undock on drag start
      if (dockedRef.current) {
        const undockX = dockedRef.current === 'left' ? EDGE_MARGIN : window.innerWidth - FAB_SIZE - EDGE_MARGIN
        const rect = el.getBoundingClientRect()
        startPos.current = { x: undockX, y: rect.top }
        setDocked(null)
        setPos({ x: undockX, y: rect.top })
        localStorage.removeItem(STORAGE_KEY_DOCK)
      } else {
        const rect = el.getBoundingClientRect()
        startPos.current = { x: rect.left, y: rect.top }
      }
    }

    const moveDrag = (clientX: number, clientY: number) => {
      if (!dragging.current) return
      const dx = clientX - startTouch.current.x
      const dy = clientY - startTouch.current.y
      if (!hasMoved.current && Math.abs(dx) < 6 && Math.abs(dy) < 6) return
      hasMoved.current = true
      setPos(clamp({ x: startPos.current.x + dx, y: startPos.current.y + dy }))
    }

    const endDrag = () => {
      if (!dragging.current) return
      dragging.current = false
      if (hasMoved.current) {
        setPos((p) => {
          // Check if near edge → dock
          if (p.x <= DOCK_THRESHOLD) {
            const dy = p.y + FAB_SIZE / 2 - DOCKED_HEIGHT / 2
            setDocked('left')
            setDockedY(dy)
            localStorage.setItem(STORAGE_KEY_DOCK, JSON.stringify({ side: 'left', y: dy }))
            return p
          }
          if (p.x >= window.innerWidth - FAB_SIZE - DOCK_THRESHOLD) {
            const dy = p.y + FAB_SIZE / 2 - DOCKED_HEIGHT / 2
            setDocked('right')
            setDockedY(dy)
            localStorage.setItem(STORAGE_KEY_DOCK, JSON.stringify({ side: 'right', y: dy }))
            return p
          }
          localStorage.setItem(STORAGE_KEY, JSON.stringify(p))
          return p
        })
      } else {
        onClickRef.current()
      }
    }

    // --- Touch ---
    const onTouchStart = (e: TouchEvent) => {
      beginDrag(e.touches[0].clientX, e.touches[0].clientY)
    }
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault()
      moveDrag(e.touches[0].clientX, e.touches[0].clientY)
    }
    const onTouchEnd = (e: TouchEvent) => {
      if (!hasMoved.current) e.preventDefault()
      endDrag()
    }

    // --- Mouse (desktop) ---
    const onMouseDown = (e: MouseEvent) => {
      e.preventDefault()
      beginDrag(e.clientX, e.clientY)
      const onMouseMove = (ev: MouseEvent) => moveDrag(ev.clientX, ev.clientY)
      const onMouseUp = () => {
        window.removeEventListener('mousemove', onMouseMove)
        window.removeEventListener('mouseup', onMouseUp)
        endDrag()
      }
      window.addEventListener('mousemove', onMouseMove)
      window.addEventListener('mouseup', onMouseUp)
    }

    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchmove', onTouchMove, { passive: false })
    el.addEventListener('touchend', onTouchEnd)
    el.addEventListener('mousedown', onMouseDown)

    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('touchend', onTouchEnd)
      el.removeEventListener('mousedown', onMouseDown)
    }
  }, [])

  const isDocked = docked !== null

  return (
    <button
      ref={fabRef}
      className="fixed z-50 flex items-center justify-center border-none cursor-grab active:cursor-grabbing select-none"
      style={{
        left: isDocked ? (docked === 'left' ? 0 : undefined) : pos.x,
        right: isDocked && docked === 'right' ? 0 : undefined,
        top: isDocked ? dockedY : pos.y,
        width: isDocked ? DOCKED_WIDTH : FAB_SIZE,
        height: isDocked ? DOCKED_HEIGHT : FAB_SIZE,
        borderRadius: isDocked ? (docked === 'left' ? '0 4px 4px 0' : '4px 0 0 4px') : '50%',
        backgroundColor: 'var(--color-accent)',
        color: '#ffffff',
        opacity: isDocked ? 0.35 : 0.45,
        boxShadow: isDocked ? 'none' : '0 2px 8px rgba(0, 0, 0, 0.3)',
        touchAction: 'none',
        overflow: 'hidden',
        transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1), height 0.3s cubic-bezier(0.4,0,0.2,1), border-radius 0.3s cubic-bezier(0.4,0,0.2,1), opacity 0.3s ease, box-shadow 0.3s ease',
      }}
      title="Calculateur"
    >
      <svg
        width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        style={{
          pointerEvents: 'none',
          opacity: isDocked ? 0 : 1,
          transform: isDocked ? 'scale(0.3)' : 'scale(1)',
          transition: 'opacity 0.2s ease, transform 0.25s cubic-bezier(0.4,0,0.2,1)',
        }}
      >
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
        className="relative z-10 p-4 lg:ml-[200px] lg:p-0 app-shell-main"
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

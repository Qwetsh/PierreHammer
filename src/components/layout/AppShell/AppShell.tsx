import { useState, type ReactNode } from 'react'
import { BottomNav } from '@/components/ui/BottomNav'
import { CalculatorModal } from '@/components/ui/CalculatorModal/CalculatorModal'
import { usePreferencesStore } from '@/stores/preferencesStore'

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

      {/* Calculator FAB */}
      {showCalculatorFab && <button
        onClick={() => setCalcOpen(true)}
        className="fixed z-50 flex items-center justify-center rounded-full border-none cursor-pointer"
        style={{
          bottom: 'calc(56px + env(safe-area-inset-bottom, 0px) + 16px)',
          right: '16px',
          width: '48px',
          height: '48px',
          backgroundColor: 'var(--color-accent)',
          color: '#ffffff',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4), 0 0 12px color-mix(in srgb, var(--color-accent) 30%, transparent)',
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
      </button>}

      {/* Calculator modal */}
      <CalculatorModal open={calcOpen} onClose={() => setCalcOpen(false)} />
    </div>
  )
}

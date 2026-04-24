import type { ReactNode } from 'react'
import { BottomNav } from '@/components/ui/BottomNav'

export function AppShell({ children }: { children: ReactNode }) {
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
    </div>
  )
}

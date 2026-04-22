import type { ReactNode } from 'react'
import { BottomNav } from '@/components/ui/BottomNav'

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: 'var(--color-bg)',
        backgroundImage: 'var(--faction-gradient)',
        backgroundAttachment: 'fixed',
        transition: 'background 0.5s ease',
      }}
    >
      <a href="#main-content" className="skip-link">
        Aller au contenu principal
      </a>
      <main
        id="main-content"
        className="p-4 lg:ml-[200px] lg:p-6"
        style={{ paddingBottom: 'calc(56px + env(safe-area-inset-bottom, 0px) + 16px)' }}
      >
        {children}
      </main>
      <BottomNav />
    </div>
  )
}

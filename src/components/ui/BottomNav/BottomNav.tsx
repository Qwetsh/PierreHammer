import { NavLink } from 'react-router'

const tabs = [
  {
    to: '/collection',
    label: 'Collection',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    to: '/lists',
    label: 'Mes Listes',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="8" y1="6" x2="21" y2="6" />
        <line x1="8" y1="12" x2="21" y2="12" />
        <line x1="8" y1="18" x2="21" y2="18" />
        <line x1="3" y1="6" x2="3.01" y2="6" />
        <line x1="3" y1="12" x2="3.01" y2="12" />
        <line x1="3" y1="18" x2="3.01" y2="18" />
      </svg>
    ),
  },
  {
    to: '/catalog',
    label: 'Catalogue',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    ),
  },
  {
    to: '/profile',
    label: 'Profil',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
] as const

export function BottomNav() {
  return (
    <nav
      role="tablist"
      className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around"
      style={{
        height: 'calc(60px + env(safe-area-inset-bottom, 0px))',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        backgroundColor: 'color-mix(in srgb, var(--color-surface) 85%, transparent)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderTop: '1px solid color-mix(in srgb, var(--color-primary) 20%, transparent)',
      }}
    >
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          role="tab"
          className="relative flex flex-1 flex-col items-center justify-center gap-1 py-2 no-underline transition-all duration-200"
          style={({ isActive }) => ({
            color: isActive ? 'var(--color-accent)' : 'var(--color-text-muted)',
            transform: isActive ? 'translateY(-1px)' : 'none',
          })}
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <span
                  className="absolute top-0 left-1/2 -translate-x-1/2 rounded-full"
                  style={{
                    width: '24px',
                    height: '3px',
                    backgroundColor: 'var(--color-accent)',
                  }}
                />
              )}
              {tab.icon}
              <span className="text-xs font-medium">{tab.label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}

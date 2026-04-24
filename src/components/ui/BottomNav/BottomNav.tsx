import { useState, useRef, useEffect } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router'
import { useAuthStore } from '@/stores/authStore'
import { useTranslationStore } from '@/stores/translationStore'

interface Tab {
  to: string
  label: string
  icon: React.ReactNode
  hudIcon: string
  authOnly?: boolean
}

const primaryTabs: Tab[] = [
  {
    to: '/dashboard',
    label: 'Home',
    hudIcon: '⬡',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    to: '/collection',
    label: 'Collection',
    hudIcon: '◈',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    to: '/lists',
    label: 'Listes',
    hudIcon: '▤',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
    label: 'Codex',
    hudIcon: '☷',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    ),
  },
]

const secondaryTabs: Tab[] = [
  {
    to: '/friends',
    label: 'Amis',
    hudIcon: '◎',
    authOnly: true,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    to: '/simulate',
    label: 'Simulateur',
    hudIcon: '⚔',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
        <polyline points="14 2 14 8 20 8" />
      </svg>
    ),
  },
  {
    to: '/profile',
    label: 'Profil',
    hudIcon: '◉',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
]

// All tabs for desktop sidebar
const allTabs: Tab[] = [...primaryTabs, ...secondaryTabs]

export function BottomNav() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const editMode = useTranslationStore((s) => s.editMode)
  const toggleEditMode = useTranslationStore((s) => s.toggleEditMode)
  const navigate = useNavigate()
  const location = useLocation()

  const [moreOpen, setMoreOpen] = useState(false)
  const moreRef = useRef<HTMLDivElement>(null)

  const visiblePrimary = primaryTabs.filter((tab) => !tab.authOnly || isAuthenticated)
  const visibleSecondary = secondaryTabs.filter((tab) => !tab.authOnly || isAuthenticated)
  const visibleAll = allTabs.filter((tab) => !tab.authOnly || isAuthenticated)

  // Is current route in the "more" menu?
  const isSecondaryActive = visibleSecondary.some((t) => location.pathname.startsWith(t.to))

  // Close menu on outside click
  useEffect(() => {
    if (!moreOpen) return
    function handleClick(e: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false)
      }
    }
    document.addEventListener('pointerdown', handleClick)
    return () => document.removeEventListener('pointerdown', handleClick)
  }, [moreOpen])

  // Close menu on route change
  useEffect(() => { setMoreOpen(false) }, [location.pathname])

  return (
    <>
      {/* Mobile: bottom nav bar — HUD style, 5 items */}
      <nav
        role="tablist"
        className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around lg:hidden"
        style={{
          height: 'calc(56px + env(safe-area-inset-bottom, 0px))',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          backgroundColor: 'var(--color-bg-elevated)',
          borderTop: '1px solid var(--color-border)',
        }}
      >
        {visiblePrimary.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            role="tab"
            className="relative flex flex-1 flex-col items-center justify-center gap-0.5 py-1.5 no-underline"
            style={({ isActive }) => ({
              color: isActive ? 'var(--color-accent)' : 'var(--color-text-muted)',
            })}
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span
                    className="absolute top-0 left-1/2 -translate-x-1/2"
                    style={{
                      width: '20px',
                      height: '2px',
                      backgroundColor: 'var(--color-accent)',
                    }}
                  />
                )}
                <span style={{ filter: isActive ? 'drop-shadow(0 0 4px var(--color-accent))' : 'none' }}>
                  {tab.icon}
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 8,
                    letterSpacing: 0.5,
                    textTransform: 'uppercase',
                    fontWeight: 500,
                  }}
                >
                  {tab.label}
                </span>
              </>
            )}
          </NavLink>
        ))}

        {/* "More" button */}
        <div ref={moreRef} className="relative flex flex-1 flex-col items-center justify-center">
          <button
            onClick={() => setMoreOpen((v) => !v)}
            className="relative flex flex-col items-center justify-center gap-0.5 py-1.5 border-none bg-transparent cursor-pointer"
            style={{
              color: isSecondaryActive || moreOpen ? 'var(--color-accent)' : 'var(--color-text-muted)',
            }}
          >
            {(isSecondaryActive && !moreOpen) && (
              <span
                className="absolute top-0 left-1/2 -translate-x-1/2"
                style={{
                  width: '20px',
                  height: '2px',
                  backgroundColor: 'var(--color-accent)',
                }}
              />
            )}
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="5" cy="12" r="2" />
              <circle cx="12" cy="12" r="2" />
              <circle cx="19" cy="12" r="2" />
            </svg>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 8,
                letterSpacing: 0.5,
                textTransform: 'uppercase',
                fontWeight: 500,
              }}
            >
              Plus
            </span>
          </button>

          {/* Popover menu */}
          {moreOpen && (
            <div
              style={{
                position: 'absolute',
                bottom: 'calc(100% + 12px)',
                right: -8,
                backgroundColor: 'var(--color-bg-elevated)',
                border: '1px solid var(--color-border)',
                minWidth: 160,
                zIndex: 100,
                boxShadow: '0 -4px 20px rgba(0,0,0,0.4)',
              }}
            >
              {visibleSecondary.map((tab) => {
                const active = location.pathname.startsWith(tab.to)
                return (
                  <button
                    key={tab.to}
                    onClick={() => navigate(tab.to)}
                    className="w-full border-none cursor-pointer flex items-center gap-3"
                    style={{
                      padding: '12px 16px',
                      background: active
                        ? 'color-mix(in srgb, var(--color-accent) 10%, transparent)'
                        : 'transparent',
                      color: active ? 'var(--color-accent)' : 'var(--color-text)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: 11,
                      letterSpacing: 0.5,
                      textTransform: 'uppercase',
                      borderBottom: '1px solid var(--color-border)',
                    }}
                  >
                    <span style={{ opacity: 0.7 }}>{tab.icon}</span>
                    {tab.label}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </nav>

      {/* Desktop: HUD sidebar */}
      <nav
        role="tablist"
        className="hidden lg:flex fixed top-0 left-0 bottom-0 z-50 flex-col w-[200px]"
        style={{
          backgroundColor: 'var(--color-bg-elevated)',
          borderRight: '1px solid var(--color-border)',
          fontFamily: 'var(--font-sans)',
        }}
      >
        {/* Logo */}
        <div
          className="flex items-center gap-2.5 px-[18px] py-5"
          style={{ borderBottom: '1px solid var(--color-border)' }}
        >
          <svg width="22" height="22" viewBox="0 0 22 22">
            <rect x="1" y="1" width="20" height="20" fill="none" stroke="var(--color-accent)" strokeWidth="1.2" />
            <rect x="5" y="5" width="12" height="12" fill="none" stroke="var(--color-accent)" strokeWidth="0.5" opacity="0.5" />
            <path d="M 7 11 L 11 7 L 15 11 L 11 15 Z" fill="var(--color-accent)" />
          </svg>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)', letterSpacing: 0.5, lineHeight: 1 }}>
              PierreHammer
            </div>
            <div style={{ fontSize: 9, color: 'var(--color-accent)', letterSpacing: 2, marginTop: 3, fontFamily: 'var(--font-mono)' }}>
              CODEX
            </div>
          </div>
        </div>

        {/* Nav items */}
        <div className="flex-1 overflow-auto" style={{ padding: '14px 0' }}>
          {visibleAll.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              role="tab"
              className="flex items-center gap-3 no-underline"
              style={({ isActive }) => ({
                padding: '11px 18px',
                color: isActive ? 'var(--color-accent)' : 'var(--color-text-dim)',
                background: isActive
                  ? `linear-gradient(90deg, color-mix(in srgb, var(--color-accent) 8%, transparent), transparent)`
                  : 'transparent',
                borderLeft: isActive ? '2px solid var(--color-accent)' : '2px solid transparent',
                fontSize: 13,
                fontWeight: isActive ? 500 : 400,
                cursor: 'pointer',
                transition: 'color 0.1s',
              })}
            >
              {({ isActive }) => (
                <>
                  <span
                    style={{
                      fontSize: 14,
                      width: 14,
                      textAlign: 'center' as const,
                      textShadow: isActive ? `0 0 8px var(--color-accent)` : 'none',
                    }}
                  >
                    {tab.hudIcon}
                  </span>
                  <span>{tab.label}</span>
                  {isActive && (
                    <span
                      style={{
                        marginLeft: 'auto',
                        color: 'var(--color-accent)',
                        fontFamily: 'var(--font-mono)',
                        fontSize: 10,
                      }}
                    >
                      ▸
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>

        {/* User footer */}
        <div
          className="px-[18px] py-3.5"
          style={{
            borderTop: '1px solid var(--color-border)',
            fontSize: 10,
            fontFamily: 'var(--font-mono)',
            color: 'var(--color-text-muted)',
          }}
        >
          <button
            onClick={toggleEditMode}
            className="w-full border-none cursor-pointer"
            style={{
              padding: '5px 8px',
              border: '1px solid var(--color-border)',
              background: editMode ? 'color-mix(in srgb, var(--color-accent) 10%, transparent)' : 'transparent',
              color: editMode ? 'var(--color-accent)' : 'var(--color-text-dim)',
              textAlign: 'center' as const,
              letterSpacing: 1,
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
            }}
            title={editMode ? 'Desactiver le mode traduction' : 'Activer le mode traduction'}
          >
            ◇ TRADUCTIONS
            {editMode && (
              <span
                className="inline-block ml-2 rounded-full"
                style={{
                  width: 6,
                  height: 6,
                  backgroundColor: 'var(--color-accent)',
                  boxShadow: `0 0 6px var(--color-accent)`,
                }}
              />
            )}
          </button>
        </div>
      </nav>
    </>
  )
}

import type { CSSProperties, ReactNode, MouseEventHandler } from 'react'

// ── HUD Panel ──
// Bordered panel with optional title bar, used for content sections
export function HudPanel({
  title,
  right,
  children,
  padding = 0,
  style,
  className,
}: {
  title?: string
  right?: ReactNode
  children: ReactNode
  padding?: number | string
  style?: CSSProperties
  className?: string
}) {
  return (
    <div
      className={className}
      style={{
        border: '1px solid var(--color-border)',
        background: 'var(--color-surface)',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
        boxShadow: 'inset 0 1px 0 rgba(79,212,255,0.04)',
        ...style,
      }}
    >
      {title && (
        <div
          style={{
            height: 28,
            padding: '0 12px',
            display: 'flex',
            alignItems: 'center',
            borderBottom: '1px solid var(--color-border)',
            background: 'var(--color-surface-alt)',
            fontSize: 10,
            letterSpacing: 1.8,
            color: 'var(--color-text-dim)',
            fontWeight: 500,
            fontFamily: 'var(--font-mono)',
            textTransform: 'uppercase',
          }}
        >
          <span style={{ color: 'var(--color-accent)', marginRight: 8, textShadow: '0 0 6px var(--color-accent)' }}>
            ▸
          </span>
          <span>{title}</span>
          <span style={{ flex: 1 }} />
          {right}
        </div>
      )}
      <div style={{ padding, flex: 1, minHeight: 0, overflow: 'auto' }}>{children}</div>
    </div>
  )
}

// ── HUD Button ──
export function HudBtn({
  children,
  variant = 'ghost',
  onClick,
  icon,
  style,
  disabled,
}: {
  children: ReactNode
  variant?: 'primary' | 'ghost' | 'accent' | 'danger' | 'solid'
  onClick?: () => void
  icon?: ReactNode
  style?: CSSProperties
  disabled?: boolean
}) {
  const variants = {
    primary: {
      bg: 'var(--color-accent)',
      color: '#05080e',
      border: 'var(--color-accent)',
      shadow: '0 0 12px color-mix(in srgb, var(--color-accent) 40%, transparent)',
    },
    ghost: { bg: 'transparent', color: 'var(--color-text-dim)', border: 'var(--color-border)', shadow: 'none' },
    accent: { bg: 'transparent', color: 'var(--color-accent)', border: 'var(--color-accent)', shadow: 'none' },
    danger: { bg: 'transparent', color: 'var(--color-error)', border: 'var(--color-error)', shadow: 'none' },
    solid: { bg: 'var(--color-surface-alt)', color: 'var(--color-text)', border: 'var(--color-border)', shadow: 'none' },
  }
  const v = variants[variant]
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '7px 14px',
        fontSize: 11,
        letterSpacing: 0.8,
        cursor: disabled ? 'not-allowed' : 'pointer',
        background: v.bg,
        color: v.color,
        border: `1px solid ${v.border}`,
        fontFamily: 'var(--font-mono)',
        fontWeight: 500,
        borderRadius: 0,
        transition: 'transform 0.08s, box-shadow 0.15s',
        boxShadow: v.shadow,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        opacity: disabled ? 0.5 : 1,
        ...style,
      }}
    >
      {icon && <span>{icon}</span>}
      {children}
    </button>
  )
}

// ── HUD Chip (filter toggle) ──
export function HudChip({
  children,
  active,
  onClick,
  color,
  count,
}: {
  children: ReactNode
  active?: boolean
  onClick?: () => void
  color?: string
  count?: number | null
}) {
  const c = color || 'var(--color-accent)'
  return (
    <div
      onClick={onClick}
      style={{
        padding: '5px 11px',
        fontSize: 10.5,
        cursor: 'pointer',
        border: `1px solid ${active ? c : 'var(--color-border)'}`,
        background: active ? `color-mix(in srgb, ${c} 8%, transparent)` : 'transparent',
        color: active ? c : 'var(--color-text-dim)',
        fontFamily: 'var(--font-mono)',
        letterSpacing: 0.5,
        textTransform: 'uppercase',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
      }}
    >
      {children}
      {count != null && <span style={{ opacity: 0.6 }}>{count}</span>}
    </div>
  )
}

// ── HUD Pill (small tag) ──
export function HudPill({ children, color }: { children: ReactNode; color?: string }) {
  const c = color || 'var(--color-accent)'
  return (
    <span
      style={{
        padding: '2px 8px',
        fontSize: 9.5,
        letterSpacing: 1,
        textTransform: 'uppercase',
        color: c,
        border: `1px solid color-mix(in srgb, ${c} 35%, transparent)`,
        background: `color-mix(in srgb, ${c} 6%, transparent)`,
        fontFamily: 'var(--font-mono)',
        fontWeight: 500,
      }}
    >
      {children}
    </span>
  )
}

// ── HUD Dot (status indicator) ──
export function HudDot({ color, size = 6, glow = true }: { color: string; size?: number; glow?: boolean }) {
  return (
    <span
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        background: color,
        borderRadius: '50%',
        boxShadow: glow ? `0 0 6px ${color}` : 'none',
      }}
    />
  )
}

// ── HUD Stat ──
export function HudStat({
  label,
  value,
  unit,
  color,
  big,
}: {
  label: string
  value: string | number
  unit?: string
  color?: string
  big?: boolean
}) {
  const c = color || 'var(--color-text)'
  return (
    <div>
      <div
        style={{
          fontSize: 9,
          color: 'var(--color-text-muted)',
          letterSpacing: 1.8,
          textTransform: 'uppercase',
          fontFamily: 'var(--font-mono)',
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: big ? 34 : 22,
          color: c,
          fontWeight: 500,
          letterSpacing: -0.5,
          lineHeight: 1,
          marginTop: 4,
          fontFamily: 'var(--font-sans)',
        }}
      >
        {value}
        {unit && (
          <span style={{ fontSize: 11, color: 'var(--color-text-muted)', marginLeft: 4, letterSpacing: 1, fontFamily: 'var(--font-mono)' }}>
            {unit}
          </span>
        )}
      </div>
    </div>
  )
}

// ── HUD Segmented Bar (paint progress) ──
export function HudSegmentedBar({
  segments,
  height = 8,
}: {
  segments: { value: number; color: string }[]
  height?: number
}) {
  const total = segments.reduce((a, s) => a + s.value, 0)
  return (
    <div
      style={{
        display: 'flex',
        height,
        border: '1px solid var(--color-border)',
        background: 'var(--color-bg-input)',
      }}
    >
      {segments.map((s, i) => (
        <div
          key={i}
          style={{
            flex: s.value / (total || 1),
            background: s.color,
            backgroundImage: `repeating-linear-gradient(90deg, ${s.color} 0 3px, rgba(0,0,0,0.25) 3px 4px)`,
          }}
        />
      ))}
    </div>
  )
}

// ── HUD Progress Bar ──
export function HudBar({
  value,
  max,
  color,
  width = '100%',
  height = 4,
}: {
  value: number
  max: number
  color?: string
  width?: string | number
  height?: number
}) {
  const c = color || 'var(--color-accent)'
  const pct = Math.min(100, (value / max) * 100)
  return (
    <div
      style={{
        width,
        height,
        background: 'var(--color-bg-input)',
        border: '1px solid var(--color-border-soft)',
        position: 'relative',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          width: `${pct}%`,
          background: c,
          boxShadow: `0 0 6px color-mix(in srgb, ${c} 60%, transparent)`,
        }}
      />
    </div>
  )
}

// ── HUD Points Counter ──
export function HudPointsCounter({
  used,
  limit,
  size = 'normal',
}: {
  used: number
  limit: number
  size?: 'normal' | 'big'
}) {
  const pct = used / limit
  const color =
    pct > 1 ? 'var(--color-error)' : pct > 0.95 ? 'var(--color-warning)' : pct > 0.5 ? 'var(--color-accent)' : 'var(--color-success)'
  const fs = size === 'big' ? 26 : 14
  return (
    <span style={{ fontFamily: 'var(--font-mono)', color, fontSize: fs, fontWeight: 600, letterSpacing: 0.5 }}>
      {used}
      <span style={{ opacity: 0.5 }}>/{limit}</span>
    </span>
  )
}

// ── HUD Top Bar ──
// Page header with title, subtitle, and action buttons
export function HudTopBar({
  title,
  sub,
  actions,
}: {
  title: string
  sub?: string
  actions?: ReactNode
}) {
  return (
    <div
      style={{
        padding: '14px 28px',
        borderBottom: '1px solid var(--color-border)',
        display: 'flex',
        alignItems: 'center',
        background: 'var(--color-bg-elevated)',
        flexShrink: 0,
      }}
    >
      <div>
        {sub && (
          <div
            style={{
              fontSize: 9,
              color: 'var(--color-accent)',
              letterSpacing: 2.5,
              fontFamily: 'var(--font-mono)',
              textTransform: 'uppercase',
            }}
          >
            ▸ {sub}
          </div>
        )}
        <div
          style={{
            fontSize: 22,
            color: 'var(--color-text)',
            letterSpacing: -0.3,
            lineHeight: 1.1,
            marginTop: sub ? 3 : 0,
            fontWeight: 600,
          }}
        >
          {title}
        </div>
      </div>
      <div style={{ flex: 1 }} />
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>{actions}</div>
    </div>
  )
}

// ── HUD Search Input ──
export function HudSearch({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <div
      style={{
        flex: 1,
        background: 'var(--color-bg-input)',
        border: '1px solid var(--color-border)',
        padding: '8px 12px',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}
    >
      <span style={{ color: 'var(--color-accent)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>&gt;</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || 'Rechercher...'}
        style={{
          flex: 1,
          background: 'transparent',
          border: 'none',
          outline: 'none',
          color: 'var(--color-text)',
          fontSize: 12,
          fontFamily: 'var(--font-mono)',
        }}
      />
    </div>
  )
}

// ── Mobile Top Bar ──
// Compact header for mobile HUD pages
export function MTopBar({
  title,
  sub,
  actions,
}: {
  title: string
  sub?: string
  actions?: ReactNode
}) {
  return (
    <div
      style={{
        padding: '12px 16px',
        borderBottom: '1px solid var(--color-border)',
        display: 'flex',
        alignItems: 'center',
        background: 'var(--color-bg-elevated)',
        flexShrink: 0,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        {sub && (
          <div
            style={{
              fontSize: 8,
              color: 'var(--color-accent)',
              letterSpacing: 2,
              fontFamily: 'var(--font-mono)',
              textTransform: 'uppercase',
            }}
          >
            {'\u25b8'} {sub}
          </div>
        )}
        <div
          style={{
            fontSize: 17,
            color: 'var(--color-text)',
            letterSpacing: -0.3,
            lineHeight: 1.1,
            marginTop: sub ? 2 : 0,
            fontWeight: 600,
          }}
        >
          {title}
        </div>
      </div>
      {actions && <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>{actions}</div>}
    </div>
  )
}

// ── Mobile Section label ──
export function MSection({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        fontSize: 9,
        letterSpacing: 1.5,
        textTransform: 'uppercase',
        color: 'var(--color-text-muted)',
        fontFamily: 'var(--font-mono)',
        padding: '10px 0 4px',
        display: 'flex',
        alignItems: 'center',
        gap: 4,
      }}
    >
      <span style={{ color: 'var(--color-accent)' }}>{'\u25b8'}</span>
      {children}
    </div>
  )
}

// ── Mobile Quick Card ──
export function MQuickCard({
  icon,
  label,
  sub,
  onClick,
}: {
  icon: string
  label: string
  sub: string
  onClick: MouseEventHandler
}) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: '12px',
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}
    >
      <span
        style={{
          fontSize: 14,
          width: 18,
          textAlign: 'center',
          color: 'var(--color-accent)',
          textShadow: '0 0 6px var(--color-accent)',
        }}
      >
        {icon}
      </span>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text)' }}>{label}</div>
        <div style={{ fontSize: 8, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: 0.5, marginTop: 1 }}>{sub}</div>
      </div>
    </div>
  )
}

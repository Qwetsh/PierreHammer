import { useState } from 'react'
import type { Datasheet } from '@/types/gameData.types'
import type { PaintStatus } from '@/components/domain/PaintStatusBadge'
import { usePointsHistoryStore } from '@/stores/pointsHistoryStore'
import { useFavoritesStore } from '@/stores/favoritesStore'
import { useCustomImage } from '@/hooks/useCustomImage'
import { T } from '@/components/ui/TranslatableText'

type UnitVariant = 'standard' | 'battleline' | 'epic-hero'

interface UnitCardProps {
  datasheet: Datasheet
  owned?: number
  instances?: PaintStatus[]
  onClick?: () => void
  selectable?: boolean
  selected?: boolean
  onToggleSelect?: () => void
}

function getVariant(datasheet: Datasheet): UnitVariant {
  const kwList = datasheet.keywords.map((k) => k.keyword.toUpperCase())
  if (kwList.includes('EPIC HERO')) return 'epic-hero'
  if (kwList.includes('BATTLELINE')) return 'battleline'
  return 'standard'
}

interface VariantStyle {
  badge?: string
  badgeBg: string
  glowColor: string
}

const variantStyles: Record<UnitVariant, VariantStyle> = {
  standard: {
    badgeBg: 'var(--color-primary)',
    glowColor: 'rgba(0,0,0,0.3)',
  },
  battleline: {
    badge: 'Battleline',
    badgeBg: 'var(--color-card-battleline)',
    glowColor: 'rgba(30,64,175,0.3)',
  },
  'epic-hero': {
    badge: 'Epic Hero',
    badgeBg: 'var(--color-card-epic)',
    glowColor: 'rgba(196,165,53,0.35)',
  },
}

function getPoints(datasheet: Datasheet): string {
  if (datasheet.pointOptions.length > 0) {
    return `${datasheet.pointOptions[0].cost}`
  }
  return ''
}

function getInitials(name: string): string {
  return name
    .split(/[\s-]+/)
    .filter((w) => w.length > 0 && w[0] === w[0].toUpperCase())
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
}

const paintDotColors: Record<PaintStatus, string> = {
  unassembled: 'var(--color-text-muted)',
  assembled: 'var(--color-warning)',
  'in-progress': 'var(--color-accent)',
  done: 'var(--color-success)',
}

const paintBarColors: Record<PaintStatus, string> = {
  unassembled: '#536577',
  assembled: '#f0b540',
  'in-progress': 'var(--color-accent)',
  done: '#5ee0a0',
}

const statLabels = ['M', 'T', 'Sv', 'W', 'Ld', 'OC'] as const

export function UnitCard({ datasheet, owned, instances, onClick, selectable, selected, onToggleSelect }: UnitCardProps) {
  const variant = getVariant(datasheet)
  const style = variantStyles[variant]
  const points = getPoints(datasheet)
  const initials = getInitials(datasheet.name)
  const delta = usePointsHistoryStore((s) => s.getDelta(datasheet.id, datasheet.factionId))
  const isFavorite = useFavoritesStore((s) => s.favorites.includes(datasheet.id))
  const toggleFavorite = useFavoritesStore((s) => s.toggleFavorite)
  const profile = datasheet.profiles[0]
  const { customImageUrl } = useCustomImage(datasheet.id)
  const [imgError, setImgError] = useState(false)
  const imageUrl = customImageUrl || datasheet.imageUrl
  const hasImage = imageUrl && !imgError

  const handleClick = () => {
    if (selectable && onToggleSelect) {
      onToggleSelect()
    } else {
      onClick?.()
    }
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleClick() } }}
      className={`unit-card unit-card--${variant} animate-fade-in`}
      style={{
        color: 'var(--color-text)',
        outline: selected ? '2px solid var(--color-accent)' : 'none',
        outlineOffset: '-2px',
        cursor: 'pointer',
      }}
    >
      {/* Shimmer overlay for Epic Heroes */}
      {variant === 'epic-hero' && <div className="unit-card__shimmer" />}

      {/* ── MOBILE: Favorite star (absolute positioned) ── */}
      <button
        className="absolute top-1 right-1 z-10 bg-transparent border-none cursor-pointer p-1 lg:hidden"
        style={{ color: isFavorite ? 'var(--color-warning, #f59e0b)' : 'var(--color-text-muted)', fontSize: '0.85rem' }}
        onClick={(e) => { e.stopPropagation(); toggleFavorite(datasheet.id) }}
        aria-label={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
      >
        {isFavorite ? '\u2605' : '\u2606'}
      </button>

      {/* ── MOBILE: Compare checkbox ── */}
      {selectable && (
        <div
          className="absolute top-1 left-1 z-10 w-5 h-5 rounded-full flex items-center justify-center lg:hidden"
          style={{
            backgroundColor: selected ? 'var(--color-accent)' : 'rgba(0,0,0,0.4)',
            border: '2px solid var(--color-accent)',
          }}
        >
          {selected && <span className="text-white text-xs font-bold">{'\u2713'}</span>}
        </div>
      )}

      {/* ── IMAGE PANEL ── */}
      {hasImage && (
        <div className="unit-card__image-panel">
          <img
            src={imageUrl}
            alt={datasheet.name}
            className="unit-card__image-panel-img"
            onError={() => setImgError(true)}
            loading="lazy"
          />
          <div className="unit-card__image-panel-fade" />
          {/* HUD corner brackets (desktop only, rendered via CSS) */}
          <div className="unit-card__hud-corners" />
          <div className="unit-card__hud-corners-bottom" />
          {/* Overlay badges on image */}
          <div className="unit-card__image-overlay">
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              {style.badge && (
                <span className="unit-card__type-badge">
                  <T text={style.badge} category="keyword" />
                </span>
              )}
            </div>
            <span className="unit-card__points" style={{ fontSize: 12 }}>
              {points && <>{points} <span className="unit-card__points-label">PTS</span></>}
            </span>
          </div>
        </div>
      )}
      {!hasImage && (
        <div
          className="unit-card__image-panel unit-card__image-panel--initials"
          style={{
            background: `linear-gradient(135deg, ${style.badgeBg}, color-mix(in srgb, ${style.badgeBg} 60%, #000))`,
          }}
        >
          <span className="unit-card__image-panel-letters">{initials}</span>
          <div className="unit-card__hud-corners" />
          <div className="unit-card__hud-corners-bottom" />
          <div className="unit-card__image-overlay">
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              {style.badge && (
                <span className="unit-card__type-badge">
                  <T text={style.badge} category="keyword" />
                </span>
              )}
            </div>
            <span className="unit-card__points" style={{ fontSize: 12 }}>
              {points && <>{points} <span className="unit-card__points-label">PTS</span></>}
            </span>
          </div>
        </div>
      )}

      {/* ── INFO SECTION ── */}
      <div className="unit-card__info">
        {/* Top section: Avatar + Name */}
        <div className="flex items-center gap-2.5 p-3 pb-2" style={{ position: 'relative', zIndex: 2 }}>
          <div
            className={`unit-card__avatar ${hasImage ? 'unit-card__avatar--img' : ''}`}
            style={hasImage ? {
              boxShadow: `0 2px 8px ${style.glowColor}, inset 0 1px 0 rgba(255,255,255,0.15)`,
            } : {
              background: `linear-gradient(135deg, ${style.badgeBg}, color-mix(in srgb, ${style.badgeBg} 60%, #000))`,
              boxShadow: `0 2px 8px ${style.glowColor}, inset 0 1px 0 rgba(255,255,255,0.15)`,
            }}
          >
            {hasImage ? (
              <img
                src={imageUrl}
                alt={datasheet.name}
                className="unit-card__avatar-img"
                onError={() => setImgError(true)}
                loading="lazy"
              />
            ) : (
              initials
            )}
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <T text={datasheet.name} category="unit" className="unit-card__name truncate" />
            {/* Mobile: points under name */}
            <div className="flex items-center gap-1.5 mt-0.5 lg:hidden">
              {points && (
                <span className="unit-card__points">
                  {points} <span className="unit-card__points-label">PTS</span>
                </span>
              )}
              {delta !== 0 && (
                <span className={`unit-card__delta ${delta > 0 ? 'unit-card__delta--up' : 'unit-card__delta--down'}`}>
                  {delta > 0 ? `+${delta}` : delta}
                </span>
              )}
            </div>
            {/* Desktop: role + delta */}
            <div className="hidden lg:flex items-center gap-2 mt-0.5">
              <span style={{ fontSize: 10, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: 0.5, textTransform: 'uppercase' as const }}>
                {datasheet.role || 'Unit'}
              </span>
              {delta !== 0 && (
                <span className={`unit-card__delta ${delta > 0 ? 'unit-card__delta--up' : 'unit-card__delta--down'}`}>
                  {delta > 0 ? `+${delta}` : delta}
                </span>
              )}
            </div>
          </div>

          {/* Desktop: Favorite + Compare (top right of info section) */}
          <div className="hidden lg:flex items-center gap-2" style={{ position: 'absolute', top: 10, right: 10 }}>
            {selectable && (
              <div
                className={`unit-card__compare-check ${selected ? 'unit-card__compare-check--active' : ''}`}
                onClick={(e) => { e.stopPropagation(); onToggleSelect?.() }}
              >
                {selected && '\u2713'}
              </div>
            )}
            <button
              className={`unit-card__fav-btn ${isFavorite ? 'unit-card__fav-btn--active' : ''}`}
              style={{ color: isFavorite ? 'var(--color-gold)' : 'var(--color-text-muted)' }}
              onClick={(e) => { e.stopPropagation(); toggleFavorite(datasheet.id) }}
              aria-label={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            >
              {isFavorite ? '\u2605' : '\u2606'}
            </button>
          </div>
        </div>

        {/* Stat line */}
        {profile && (
          <div className="unit-card__stats">
            {statLabels.map((stat) => {
              const val = profile[stat]
              if (!val) return null
              return (
                <div key={stat} className="flex flex-col items-center" style={{ minWidth: '20px' }}>
                  <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', letterSpacing: '0.05em', lineHeight: 1 }}>
                    {stat}
                  </span>
                  <span className="font-bold" style={{ fontSize: '0.85rem', lineHeight: '1.3', color: 'var(--color-text)' }}>
                    {val}
                  </span>
                </div>
              )
            })}
          </div>
        )}

        {/* ── MOBILE: Footer badges + ownership ── */}
        <div className="flex items-center gap-1.5 px-3 py-2 flex-wrap lg:hidden" style={{ position: 'relative', zIndex: 2 }}>
          {style.badge && (
            <span
              className="unit-card__type-badge"
              style={{
                background: `linear-gradient(135deg, ${style.badgeBg}, color-mix(in srgb, ${style.badgeBg} 50%, #000))`,
                boxShadow: `0 1px 4px ${style.glowColor}`,
              }}
            >
              <T text={style.badge} category="keyword" />
            </span>
          )}
          {owned !== undefined && owned > 0 && (
            <div className="flex items-center gap-1">
              <span className="font-semibold" style={{ color: 'var(--color-success)', fontSize: '0.75rem' }}>
                x{owned}
              </span>
              {instances && instances.length > 0 && (
                <div className="flex items-center gap-0.5">
                  {instances.map((status, i) => (
                    <span
                      key={i}
                      className="inline-block rounded-full"
                      style={{
                        width: '6px',
                        height: '6px',
                        backgroundColor: paintDotColors[status],
                        boxShadow: `0 0 3px ${paintDotColors[status]}`,
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── DESKTOP: Ownership + paint bar ── */}
        {owned !== undefined && owned > 0 && (
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5" style={{ borderTop: '1px solid var(--color-border)' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-success)', fontWeight: 600 }}>
              x{owned}
            </span>
            {instances && instances.length > 0 && (
              <div className="unit-card__paint-bar" style={{ flex: 1 }}>
                {instances.map((status, i) => (
                  <div
                    key={i}
                    style={{
                      flex: 1,
                      background: paintBarColors[status],
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

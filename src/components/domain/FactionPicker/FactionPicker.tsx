import { useState } from 'react'
import type { FactionSummary, Detachment } from '@/types/gameData.types'
import { T } from '@/components/ui/TranslatableText'

interface FactionPickerProps {
  factions: FactionSummary[]
  onSelect: (slug: string | null) => void
  selectedSlug?: string | null
  detachments?: Detachment[]
  selectedDetachment?: Detachment | null
  onDetachmentChange?: (det: Detachment | null) => void
  /** When false, all factions stay visible on select (desktop). Default true (mobile). */
  collapseOnSelect?: boolean
}

interface FactionTheme {
  primary: string
  accent: string
  surface: string
  tag: string
}

const factionThemes: Record<string, FactionTheme> = {
  'space-marines':       { primary: '#1b3a6b', accent: '#c4a535', surface: '#141e33', tag: 'SM' },
  'orks':                { primary: '#2d4a1e', accent: '#ff6b35', surface: '#1a2813', tag: 'ORK' },
  'aeldari':             { primary: '#0d6b58', accent: '#50c878', surface: '#0f2420', tag: 'AEL' },
  'necrons':             { primary: '#1a3a1a', accent: '#5ee0a0', surface: '#0f1f0f', tag: 'NEC' },
  'chaos':               { primary: '#5c1a1a', accent: '#ff2020', surface: '#2a1010', tag: 'CHS' },
  'tyranids':            { primary: '#4a1a5c', accent: '#c850c0', surface: '#1f0f28', tag: 'TYR' },
  'adeptus-custodes':    { primary: '#6b5a1e', accent: '#ffd700', surface: '#1f1a0f', tag: 'CUS' },
  'adepta-sororitas':    { primary: '#5c1a3a', accent: '#e6a8c8', surface: '#1f0f18', tag: 'SOR' },
  'death-guard':         { primary: '#4a5c1a', accent: '#b8cc3c', surface: '#1a1f0f', tag: 'DG' },
  'thousand-sons':       { primary: '#1a3a6b', accent: '#40e0d0', surface: '#0f1828', tag: 'TSN' },
  't-au-empire':         { primary: '#1a4a5c', accent: '#ff6b35', surface: '#0f1f28', tag: 'TAU' },
  'chaos-space-marines': { primary: '#5c1a1a', accent: '#ff2020', surface: '#2a1010', tag: 'CSM' },
  'world-eaters':        { primary: '#5c1a1a', accent: '#ff2020', surface: '#2a1010', tag: 'WE' },
  'emperor-s-children':  { primary: '#5c1a3a', accent: '#c77dff', surface: '#2a1018', tag: 'EC' },
  'drukhari':            { primary: '#3a1a5c', accent: '#8b5cf6', surface: '#180f28', tag: 'DRU' },
  'imperial-knights':    { primary: '#4a3a1a', accent: '#c4a535', surface: '#1a160f', tag: 'IK' },
  'chaos-knights':       { primary: '#4a3a1a', accent: '#d64b6b', surface: '#1a160f', tag: 'CK' },
  'astra-militarum':     { primary: '#3a4a2e', accent: '#c4a535', surface: '#161f10', tag: 'AM' },
  'grey-knights':        { primary: '#3a3a5c', accent: '#a0a0ff', surface: '#161628', tag: 'GK' },
  'leagues-of-votann':   { primary: '#5c4a1a', accent: '#ff9800', surface: '#1f1a0f', tag: 'VOT' },
  'adeptus-mechanicus':  { primary: '#5c1a1a', accent: '#ff4444', surface: '#1f0f0f', tag: 'ADM' },
  'genestealer-cults':   { primary: '#4a1a5c', accent: '#9c27b0', surface: '#1f0f28', tag: 'GSC' },
  'chaos-daemons':       { primary: '#5c1a2a', accent: '#ff1744', surface: '#2a1015', tag: 'CD' },
  'imperial-agents':     { primary: '#3a3a4a', accent: '#c4a535', surface: '#16161f', tag: 'IA' },
  'blood-angels':        { primary: '#5c1a1a', accent: '#ff2020', surface: '#2a1010', tag: 'BA' },
  'dark-angels':         { primary: '#1a3a1a', accent: '#50c878', surface: '#0f1f0f', tag: 'DA' },
  'black-templars':      { primary: '#2a2a2a', accent: '#e4edf7', surface: '#141414', tag: 'BT' },
  'space-wolves':        { primary: '#1a3a5c', accent: '#6bb5ff', surface: '#0f1828', tag: 'SW' },
  'deathwatch':          { primary: '#1a1a2a', accent: '#a0a0ff', surface: '#0f0f18', tag: 'DW' },
}

const defaultTheme: FactionTheme = { primary: '#4a6fa5', accent: '#4fd4ff', surface: '#1a1a2e', tag: '???' }

const localImageOverrides: Record<string, string> = {
  'tyranids': 'Tyranid.jpg',
  'chaos-daemons': 'Chaosdemons.jpg',
  'imperial-knights': 'Imperialknight.jpg',
  'imperial-agents': 'imperial-agents-banner.webp',
  'space-marines': 'space-marines.webp',
  'emperor-s-children': 'emperor-s-children.png',
}

function FactionImage({ slug, fallbackUrl, name }: { slug: string; fallbackUrl?: string; name: string }) {
  const filename = localImageOverrides[slug] ?? `${slug}.jpg`
  const [src, setSrc] = useState(`${import.meta.env.BASE_URL}img/factions/${filename}`)
  const [error, setError] = useState(false)
  if (error) return null
  return (
    <img
      src={src}
      alt={name}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
      onError={() => {
        if (fallbackUrl && src !== fallbackUrl) {
          setSrc(fallbackUrl)
        } else {
          setError(true)
        }
      }}
      loading="lazy"
    />
  )
}

export function FactionPicker({
  factions,
  onSelect,
  selectedSlug,
  detachments = [],
  selectedDetachment,
  onDetachmentChange,
  collapseOnSelect = true,
}: FactionPickerProps) {
  const [showDetachments, setShowDetachments] = useState(false)

  return (
    <div style={{ padding: '14px 14px 20px' }}>
      {/* Header mono — only shown on mobile (collapse mode) when no faction selected */}
      {collapseOnSelect && !selectedSlug && (
        <div style={{
          fontSize: 10,
          color: 'var(--color-text-muted)',
          fontFamily: 'var(--font-mono)',
          letterSpacing: 1.5,
          marginBottom: 14,
        }}>
          {'\u25b8'} SELECTIONNEZ UNE FACTION
        </div>
      )}

      <div className="faction-picker-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
        {factions
          .filter((faction) => !selectedSlug || !collapseOnSelect || selectedSlug === faction.slug)
          .map((faction) => {
            const theme = factionThemes[faction.slug] ?? defaultTheme
            const color = theme.accent
            const isSelected = selectedSlug === faction.slug
            const isDimmed = !collapseOnSelect && !!selectedSlug && !isSelected

            return (
              <div key={faction.id} className={isSelected && collapseOnSelect ? 'faction-tile-wrapper--expanded' : ''}>
                <div
                  onClick={() => {
                    if (isSelected) {
                      onSelect(null)
                      setShowDetachments(false)
                    } else {
                      onSelect(faction.slug)
                    }
                  }}

                  className="faction-tile-card"
                  style={{
                    position: 'relative',
                    overflow: 'hidden',
                    border: isSelected && !collapseOnSelect
                      ? `2px solid ${color}`
                      : '1px solid var(--color-border)',
                    background: 'var(--color-surface)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'border-color 0.15s, box-shadow 0.15s, transform 0.15s, opacity 0.2s',
                    opacity: isDimmed ? 0.4 : 1,
                    boxShadow: isSelected && !collapseOnSelect
                      ? `0 0 16px ${color}40`
                      : undefined,
                  }}
                >
                  {/* Visual block */}
                  <div className="faction-tile__visual" style={{
                    position: 'relative',
                    overflow: 'hidden',
                    background: `
                      radial-gradient(ellipse at 50% 45%, ${color}55 0%, ${color}18 35%, transparent 70%),
                      radial-gradient(ellipse at 70% 80%, ${color}22 0%, transparent 50%),
                      linear-gradient(180deg, #0a121c 0%, #05080e 100%)`,
                  }}>
                    {/* Faction photo */}
                    <FactionImage slug={faction.slug} fallbackUrl={faction.imageUrl} name={faction.name} />

                    {/* Scanlines overlay */}
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      opacity: 0.35,
                      backgroundImage: `repeating-linear-gradient(0deg, transparent 0 2px, ${color}0a 2px 3px)`,
                      pointerEvents: 'none',
                    }} />

                    {/* Gradient fade — smooth transition into label block */}
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.15) 40%, rgba(14,22,34,0.7) 80%, var(--color-surface) 100%)',
                      pointerEvents: 'none',
                    }} />

                    {/* Tag mono — top left */}
                    <div style={{
                      position: 'absolute',
                      top: 6,
                      left: 6,
                      fontFamily: 'var(--font-mono)',
                      fontSize: 8,
                      color,
                      letterSpacing: 1.5,
                      fontWeight: 600,
                      textShadow: `0 0 6px ${color}`,
                    }}>
                      {theme.tag}
                    </div>

                    {/* Corner bracket — top right */}
                    <div style={{
                      position: 'absolute',
                      top: 6,
                      right: 6,
                      width: 8,
                      height: 8,
                      borderTop: `1px solid ${color}`,
                      borderRight: `1px solid ${color}`,
                    }} />

                    {/* Corner bracket — bottom left */}
                    <div style={{
                      position: 'absolute',
                      bottom: 6,
                      left: 6,
                      width: 8,
                      height: 8,
                      borderBottom: `1px solid ${color}`,
                      borderLeft: `1px solid ${color}`,
                    }} />
                  </div>

                  {/* Label block */}
                  <div className="faction-tile__label" style={{
                    padding: '10px 10px 12px',
                    borderLeft: `2px solid ${color}`,
                    background: 'var(--color-surface)',
                    position: 'relative',
                    zIndex: 1,
                  }}>
                    <T
                      text={faction.name}
                      category="faction"
                      style={{ fontSize: 13, color: 'var(--color-text)', fontWeight: 600, lineHeight: 1.2, display: 'block' }}
                    />
                  </div>

                  {/* Detachment button when selected */}
                  {isSelected && detachments.length > 0 && (
                    <button
                      type="button"
                      className={`faction-tile__detachment-btn ${selectedDetachment ? 'faction-tile__detachment-btn--active' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowDetachments(true)
                      }}
                    >
                      {selectedDetachment?.name ?? 'Choisir un détachement'}
                    </button>
                  )}
                </div>

                {/* Detachment modal */}
                {showDetachments && isSelected && detachments.length > 0 && (
                  <div className="detachment-modal-overlay" onClick={() => setShowDetachments(false)}>
                    <div
                      className="detachment-modal"
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        '--tile-primary': theme.primary,
                        '--tile-accent': theme.accent,
                        '--tile-surface': theme.surface,
                      } as React.CSSProperties}
                    >
                      <h3 className="detachment-modal__title">Détachement</h3>
                      <div className="detachment-modal__list">
                        {detachments.map((det) => (
                          <button
                            key={det.id}
                            type="button"
                            className={`detachment-modal__item ${selectedDetachment?.id === det.id ? 'detachment-modal__item--active' : ''}`}
                            onClick={() => {
                              onDetachmentChange?.(det)
                              setShowDetachments(false)
                            }}
                          >
                            <T text={det.name} category="detachment" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
      </div>
    </div>
  )
}

import { useState } from 'react'
import { factionPaintSchemes } from '@/data/factionPaintSchemes'
import type { PaintColor } from '@/data/factionPaintSchemes'

interface PaintingHelperProps {
  factionId: string
  unitName: string
  factionName: string
}

const typeLabels: Record<PaintColor['type'], string> = {
  base: 'Base',
  layer: 'Layer',
  shade: 'Shade',
  contrast: 'Contrast',
  dry: 'Dry',
  technical: 'Technical',
}

const typeBorderColors: Record<PaintColor['type'], string> = {
  base: '#3B82F6',
  layer: '#A855F7',
  shade: '#6B7280',
  contrast: '#F59E0B',
  dry: '#10B981',
  technical: '#EF4444',
}

function lighten(hex: string, amount: number): string {
  const r = Math.min(255, parseInt(hex.slice(1, 3), 16) + amount)
  const g = Math.min(255, parseInt(hex.slice(3, 5), 16) + amount)
  const b = Math.min(255, parseInt(hex.slice(5, 7), 16) + amount)
  return `rgb(${r},${g},${b})`
}

export function PaintingHelper({ factionId, unitName, factionName }: PaintingHelperProps) {
  const [hoveredColor, setHoveredColor] = useState<PaintColor | null>(null)

  const scheme = factionPaintSchemes[factionId]
  const searchQuery = encodeURIComponent(`how to paint ${unitName} ${factionName} warhammer 40k`)
  const youtubeSearchUrl = `https://www.youtube.com/results?search_query=${searchQuery}`

  return (
    <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 12, marginTop: 8 }}>
      {/* Section title */}
      <div style={{
        fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 700,
        color: 'var(--color-accent)', letterSpacing: 1, marginBottom: 8,
        textTransform: 'uppercase',
      }}>
        Aide peinture
      </div>

      {/* Paint palette */}
      {scheme && (
        <div style={{ marginBottom: 10 }}>
          <div style={{
            fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)',
            marginBottom: 6, letterSpacing: 0.5,
          }}>
            {scheme.schemeName}
          </div>

          {/* Color swatches — Citadel style circles */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
            {scheme.colors.map((color) => {
              const isActive = hoveredColor === color
              const ringColor = typeBorderColors[color.type]
              return (
                <div
                  key={color.name}
                  onMouseEnter={() => setHoveredColor(color)}
                  onMouseLeave={() => setHoveredColor(null)}
                  onTouchStart={() => setHoveredColor(isActive ? null : color)}
                  style={{
                    width: 34, height: 34,
                    borderRadius: '50%',
                    background: `radial-gradient(circle at 35% 35%, ${lighten(color.hex, 40)}, ${color.hex} 70%)`,
                    border: `3px solid ${ringColor}`,
                    cursor: 'pointer',
                    boxShadow: isActive
                      ? `0 0 0 2px var(--color-accent), 0 2px 8px ${ringColor}80`
                      : `inset 0 -2px 4px rgba(0,0,0,0.3), 0 1px 3px rgba(0,0,0,0.4)`,
                    transition: 'box-shadow 0.2s, transform 0.15s',
                    transform: isActive ? 'scale(1.15)' : 'scale(1)',
                    position: 'relative',
                  }}
                />
              )
            })}
          </div>

          {/* Hover tooltip — paint name */}
          <div style={{
            minHeight: 30,
            padding: '4px 0',
            transition: 'opacity 0.2s',
            opacity: hoveredColor ? 1 : 0.4,
          }}>
            {hoveredColor ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 14, height: 14, borderRadius: '50%',
                  background: `radial-gradient(circle at 35% 35%, ${lighten(hoveredColor.hex, 40)}, ${hoveredColor.hex} 70%)`,
                  border: `2px solid ${typeBorderColors[hoveredColor.type]}`,
                  boxShadow: 'inset 0 -1px 2px rgba(0,0,0,0.3)',
                  flexShrink: 0,
                }} />
                <span style={{
                  fontSize: 11, color: 'var(--color-text)', fontWeight: 600,
                }}>
                  {hoveredColor.name}
                </span>
                <span style={{
                  fontSize: 8, fontFamily: 'var(--font-mono)',
                  color: typeBorderColors[hoveredColor.type],
                  padding: '2px 5px',
                  background: `${typeBorderColors[hoveredColor.type]}15`,
                  border: `1px solid ${typeBorderColors[hoveredColor.type]}50`,
                  borderRadius: 8, letterSpacing: 0.5,
                  textTransform: 'uppercase',
                  fontWeight: 700,
                }}>
                  {typeLabels[hoveredColor.type]}
                </span>
              </div>
            ) : (
              <span style={{ fontSize: 9, color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                Survolez une couleur
              </span>
            )}
          </div>
        </div>
      )}

      {/* YouTube search button */}
      <a
        href={youtubeSearchUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          width: '100%', padding: '8px 12px',
          fontSize: 11, fontFamily: 'var(--font-mono)',
          background: 'color-mix(in srgb, #FF0000 10%, transparent)',
          color: '#FF4444',
          border: '1px solid rgba(255,0,0,0.3)',
          cursor: 'pointer', letterSpacing: 0.5,
          textDecoration: 'none', boxSizing: 'border-box',
        }}
      >
        <span style={{ fontSize: 14 }}>{'\u25B6'}</span>
        Tutos peinture YouTube
      </a>
    </div>
  )
}

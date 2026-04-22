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
}

interface FactionTheme {
  primary: string
  accent: string
  surface: string
}

const factionThemes: Record<string, FactionTheme> = {
  'space-marines':      { primary: '#1b3a6b', accent: '#c4a535', surface: '#141e33' },
  'orks':               { primary: '#2d4a1e', accent: '#ff6b35', surface: '#1a2813' },
  'aeldari':            { primary: '#0d6b58', accent: '#50c878', surface: '#0f2420' },
  'necrons':            { primary: '#1a3a1a', accent: '#00ff41', surface: '#0f1f0f' },
  'chaos':              { primary: '#5c1a1a', accent: '#ff2020', surface: '#2a1010' },
  'tyranids':           { primary: '#4a1a5c', accent: '#c850c0', surface: '#1f0f28' },
  'adeptus-custodes':   { primary: '#6b5a1e', accent: '#ffd700', surface: '#1f1a0f' },
  'adepta-sororitas':   { primary: '#5c1a3a', accent: '#e6a8c8', surface: '#1f0f18' },
  'death-guard':        { primary: '#4a5c1a', accent: '#b8cc3c', surface: '#1a1f0f' },
  'thousand-sons':      { primary: '#1a3a6b', accent: '#40e0d0', surface: '#0f1828' },
  't-au-empire':        { primary: '#1a4a5c', accent: '#ff6b35', surface: '#0f1f28' },
  'chaos-space-marines':{ primary: '#5c1a1a', accent: '#ff2020', surface: '#2a1010' },
  'world-eaters':       { primary: '#5c1a1a', accent: '#ff2020', surface: '#2a1010' },
  'emperor-s-children': { primary: '#5c1a1a', accent: '#ff2020', surface: '#2a1010' },
  'drukhari':           { primary: '#3a1a5c', accent: '#8b5cf6', surface: '#180f28' },
  'imperial-knights':   { primary: '#4a3a1a', accent: '#c4a535', surface: '#1a160f' },
  'chaos-knights':      { primary: '#4a3a1a', accent: '#c4a535', surface: '#1a160f' },
  'astra-militarum':    { primary: '#3a4a2e', accent: '#c4a535', surface: '#161f10' },
  'grey-knights':       { primary: '#3a3a5c', accent: '#a0a0ff', surface: '#161628' },
  'leagues-of-votann':  { primary: '#5c4a1a', accent: '#ff9800', surface: '#1f1a0f' },
  'adeptus-mechanicus': { primary: '#5c1a1a', accent: '#ff4444', surface: '#1f0f0f' },
  'genestealer-cults':  { primary: '#4a1a5c', accent: '#9c27b0', surface: '#1f0f28' },
  'chaos-daemons':      { primary: '#5c1a2a', accent: '#ff1744', surface: '#2a1015' },
  'imperial-agents':    { primary: '#3a3a4a', accent: '#c4a535', surface: '#16161f' },
}

const defaultTheme: FactionTheme = { primary: '#4a6fa5', accent: '#c4a535', surface: '#1a1a2e' }

function getInitials(name: string): string {
  return name
    .split(/[\s-]+/)
    .filter((w) => w.length > 0 && w[0] === w[0].toUpperCase())
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
}

export function FactionPicker({
  factions,
  onSelect,
  selectedSlug,
  detachments = [],
  selectedDetachment,
  onDetachmentChange,
}: FactionPickerProps) {
  const [showDetachments, setShowDetachments] = useState(false)

  return (
    <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 lg:grid-cols-4">
      {factions
        .filter((faction) => !selectedSlug || selectedSlug === faction.slug)
        .map((faction) => {
        const theme = factionThemes[faction.slug] ?? defaultTheme
        const isSelected = selectedSlug === faction.slug

        return (
          <div key={faction.id} className={isSelected ? 'faction-tile-wrapper--expanded' : ''}>
            <button
              className={`faction-tile animate-fade-in ${isSelected ? 'faction-tile--selected faction-tile--expanded' : ''}`}
              style={{
                '--tile-primary': theme.primary,
                '--tile-accent': theme.accent,
                '--tile-surface': theme.surface,
              } as React.CSSProperties}
              onClick={() => {
                if (isSelected) {
                  onSelect(null)
                  setShowDetachments(false)
                } else {
                  onSelect(faction.slug)
                }
              }}
            >
              <div className="faction-tile__sigil">
                {getInitials(faction.name)}
              </div>
              <T text={faction.name} category="faction" className="faction-tile__name" />
              <span className="faction-tile__count">{faction.datasheetCount} unités</span>
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
            </button>

            {showDetachments && isSelected && detachments.length > 0 && (
              <div className="detachment-modal-overlay" onClick={() => setShowDetachments(false)}>
                <div className="detachment-modal" onClick={(e) => e.stopPropagation()}
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
  )
}

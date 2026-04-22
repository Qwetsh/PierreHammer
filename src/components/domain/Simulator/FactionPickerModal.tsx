import { useState } from 'react'
import type { FactionSummary, Detachment } from '@/types/gameData.types'

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

export function getThemeForFaction(slug: string): FactionTheme {
  return factionThemes[slug] ?? defaultTheme
}

function getInitials(name: string): string {
  return name
    .split(/[\s-]+/)
    .filter((w) => w.length > 0 && w[0] === w[0].toUpperCase())
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
}

interface FactionPickerModalProps {
  factions: FactionSummary[]
  detachments: Detachment[]
  onFactionChosen?: (slug: string) => void
  onSelect: (factionSlug: string, detachment: Detachment | null) => void
  onClose: () => void
}

export function FactionPickerModal({ factions, detachments, onFactionChosen, onSelect, onClose }: FactionPickerModalProps) {
  const [selectedFaction, setSelectedFaction] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const filteredFactions = search
    ? factions.filter((f) => f.name.toLowerCase().includes(search.toLowerCase()))
    : factions

  // Step 2: detachment selection (faction chosen, detachments loaded)
  if (selectedFaction && detachments.length > 0) {
    const theme = getThemeForFaction(selectedFaction)
    const factionName = factions.find((f) => f.slug === selectedFaction)?.name ?? selectedFaction

    return (
      <div className="fixed inset-0 z-[80] flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }} onClick={onClose}>
        <div
          className="w-full max-w-md rounded-xl p-5 max-h-[80vh] lg:max-w-lg lg:p-6 overflow-y-auto"
          style={{ backgroundColor: 'var(--color-bg)' }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold"
              style={{ backgroundColor: theme.primary, color: theme.accent }}
            >
              {getInitials(factionName)}
            </div>
            <div>
              <h3 className="font-bold text-sm" style={{ color: 'var(--color-text)' }}>{factionName}</h3>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Choisis un détachement</p>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {detachments.map((det) => (
              <button
                key={det.id}
                className="text-left rounded-lg p-3 border-none cursor-pointer transition-colors"
                style={{ backgroundColor: theme.surface, color: 'var(--color-text)' }}
                onClick={() => onSelect(selectedFaction, det)}
              >
                <span className="font-medium text-sm">{det.name}</span>
                {det.rule && (
                  <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                    {det.rule.name}
                  </p>
                )}
              </button>
            ))}
          </div>

          <button
            className="mt-3 text-xs bg-transparent border-none cursor-pointer"
            style={{ color: 'var(--color-text-muted)' }}
            onClick={() => setSelectedFaction(null)}
          >
            ← Changer de faction
          </button>
        </div>
      </div>
    )
  }

  // Faction chosen but detachments not loaded yet — show loading
  if (selectedFaction && detachments.length === 0) {
    const theme = getThemeForFaction(selectedFaction)
    const factionName = factions.find((f) => f.slug === selectedFaction)?.name ?? selectedFaction
    return (
      <div className="fixed inset-0 z-[80] flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }} onClick={onClose}>
        <div
          className="w-full max-w-md rounded-xl p-5 text-center"
          style={{ backgroundColor: 'var(--color-bg)' }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold"
              style={{ backgroundColor: theme.primary, color: theme.accent }}
            >
              {getInitials(factionName)}
            </div>
            <h3 className="font-bold text-sm" style={{ color: 'var(--color-text)' }}>{factionName}</h3>
          </div>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Chargement des détachements...</p>
          <button
            className="mt-3 text-xs bg-transparent border-none cursor-pointer"
            style={{ color: 'var(--color-text-muted)' }}
            onClick={() => setSelectedFaction(null)}
          >
            ← Changer de faction
          </button>
        </div>
      </div>
    )
  }

  // Step 1: faction selection
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }} onClick={onClose}>
      <div
        className="w-full max-w-md rounded-xl p-5 max-h-[80vh] lg:max-w-lg lg:p-6 overflow-y-auto"
        style={{ backgroundColor: 'var(--color-bg)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-bold text-base mb-3" style={{ color: 'var(--color-text)' }}>Choisir une faction</h3>

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher..."
          className="w-full rounded-lg px-3 py-2 text-sm mb-3 border-none outline-none"
          style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
          autoFocus
        />

        <div className="grid grid-cols-2 gap-2 lg:grid-cols-3">
          {filteredFactions.map((faction) => {
            const theme = getThemeForFaction(faction.slug)
            return (
              <button
                key={faction.id}
                className="flex items-center gap-2 rounded-lg p-2.5 border-none cursor-pointer transition-colors"
                style={{ backgroundColor: theme.surface, color: 'var(--color-text)' }}
                onClick={() => {
                  setSelectedFaction(faction.slug)
                  onFactionChosen?.(faction.slug)
                }}
              >
                <div
                  className="w-8 h-8 rounded flex items-center justify-center text-xs font-bold shrink-0"
                  style={{ backgroundColor: theme.primary, color: theme.accent }}
                >
                  {getInitials(faction.name)}
                </div>
                <span className="text-xs font-medium truncate">{faction.name}</span>
              </button>
            )
          })}
        </div>

        <button
          className="mt-4 w-full text-center text-xs bg-transparent border-none cursor-pointer"
          style={{ color: 'var(--color-text-muted)' }}
          onClick={onClose}
        >
          Annuler
        </button>
      </div>
    </div>
  )
}

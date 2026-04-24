import { useState } from 'react'
import type { FactionSummary, Detachment } from '@/types/gameData.types'
import { T } from '@/components/ui/TranslatableText'

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
          className="w-full max-w-md p-5 max-h-[80vh] lg:max-w-lg lg:p-6 overflow-y-auto"
          style={{ backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)' }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div
              style={{
                width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-mono)',
                backgroundColor: theme.primary, color: theme.accent, border: '1px solid var(--color-border)',
              }}
            >
              {getInitials(factionName)}
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--color-text)' }}><T text={factionName} category="faction" /></div>
              <div style={{ fontSize: 9, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: 1, textTransform: 'uppercase' }}>Choisis un détachement</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {detachments.map((det) => (
              <button
                key={det.id}
                onClick={() => onSelect(selectedFaction, det)}
                style={{
                  textAlign: 'left', padding: '10px 12px', cursor: 'pointer',
                  backgroundColor: 'var(--color-surface)', color: 'var(--color-text)',
                  border: '1px solid var(--color-border)', fontSize: 12,
                }}
              >
                <span style={{ fontWeight: 600 }}><T text={det.name} category="detachment" /></span>
                {det.rule && (
                  <div style={{ fontSize: 10, marginTop: 4, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                    {det.rule.name}
                  </div>
                )}
              </button>
            ))}
          </div>

          <button
            onClick={() => setSelectedFaction(null)}
            style={{
              marginTop: 12, fontSize: 10, background: 'transparent', border: 'none',
              color: 'var(--color-text-muted)', cursor: 'pointer', fontFamily: 'var(--font-mono)',
            }}
          >
            ← Changer de faction
          </button>
        </div>
      </div>
    )
  }

  // Faction chosen but detachments not loaded yet — show loading
  if (selectedFaction && detachments.length === 0) {
    const factionName = factions.find((f) => f.slug === selectedFaction)?.name ?? selectedFaction
    return (
      <div className="fixed inset-0 z-[80] flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }} onClick={onClose}>
        <div
          className="w-full max-w-md p-5 text-center"
          style={{ backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)' }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)', marginBottom: 8 }}><T text={factionName} category="faction" /></div>
          <div style={{ fontSize: 10, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: 1 }}>Chargement des détachements...</div>
          <button
            onClick={() => setSelectedFaction(null)}
            style={{
              marginTop: 12, fontSize: 10, background: 'transparent', border: 'none',
              color: 'var(--color-text-muted)', cursor: 'pointer', fontFamily: 'var(--font-mono)',
            }}
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
        className="w-full max-w-md p-5 max-h-[80vh] lg:max-w-lg lg:p-6 overflow-y-auto"
        style={{ backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--color-accent)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 12 }}>
          {'\u25b8'} Choisir une faction
        </div>

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher..."
          style={{
            width: '100%', padding: '8px 10px', fontSize: 12, marginBottom: 12,
            backgroundColor: 'var(--color-surface)', color: 'var(--color-text)',
            border: '1px solid var(--color-border)', outline: 'none', fontFamily: 'var(--font-mono)',
          }}
          autoFocus
        />

        <div className="grid grid-cols-2 gap-1.5 lg:grid-cols-3">
          {filteredFactions.map((faction) => {
            const theme = getThemeForFaction(faction.slug)
            return (
              <button
                key={faction.id}
                onClick={() => {
                  setSelectedFaction(faction.slug)
                  onFactionChosen?.(faction.slug)
                }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px',
                  backgroundColor: 'var(--color-surface)', color: 'var(--color-text)',
                  border: '1px solid var(--color-border)', cursor: 'pointer', fontSize: 11,
                }}
              >
                <div
                  style={{
                    width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 9, fontWeight: 700, fontFamily: 'var(--font-mono)', flexShrink: 0,
                    backgroundColor: theme.primary, color: theme.accent, border: '1px solid var(--color-border)',
                  }}
                >
                  {getInitials(faction.name)}
                </div>
                <span style={{ fontSize: 11, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  <T text={faction.name} category="faction" />
                </span>
              </button>
            )
          })}
        </div>

        <button
          onClick={onClose}
          style={{
            marginTop: 16, width: '100%', textAlign: 'center', fontSize: 10,
            background: 'transparent', border: '1px solid var(--color-border)',
            color: 'var(--color-text-muted)', cursor: 'pointer', padding: '6px 0',
            fontFamily: 'var(--font-mono)', letterSpacing: 0.5,
          }}
        >
          Annuler
        </button>
      </div>
    </div>
  )
}

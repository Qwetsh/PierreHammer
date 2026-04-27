import { useState } from 'react'
import type { Datasheet, Detachment, Enhancement, Weapon, FactionSummary, Faction } from '@/types/gameData.types'
import { getThemeForFaction } from './FactionPickerModal'
import { FactionPickerModal } from './FactionPickerModal'
import { UnitSearchModal } from './UnitSearchModal'
import { WeaponPickerModal } from './WeaponPickerModal'
import { EnhancementPickerModal } from './EnhancementPickerModal'
import { T } from '@/components/ui/TranslatableText'

interface SimulatorCardProps {
  role: 'attacker' | 'defender'
  factions: FactionSummary[]
  loadedFactions: Record<string, Faction>
  // Selected state
  factionSlug: string | null
  factionName: string | null
  detachment: Detachment | null
  datasheet: Datasheet | null
  selectedWeapon: Weapon | null
  enhancement: Enhancement | null
  modelCount: number
  // Callbacks
  onLoadFaction: (slug: string) => void
  onFactionSelect: (slug: string, detachment: Detachment | null) => void
  onUnitSelect: (ds: Datasheet) => void
  onWeaponSelect: (w: Weapon) => void
  onEnhancementSelect: (e: Enhancement | null) => void
  onModelCountChange: (n: number) => void
  onReset: () => void
}

export function SimulatorCard({
  role,
  factions,
  loadedFactions,
  factionSlug,
  factionName,
  detachment,
  datasheet,
  selectedWeapon,
  enhancement,
  modelCount,
  onLoadFaction,
  onFactionSelect,
  onUnitSelect,
  onWeaponSelect,
  onEnhancementSelect,
  onModelCountChange,
  onReset,
}: SimulatorCardProps) {
  const [showFactionPicker, setShowFactionPicker] = useState(false)
  const [showUnitSearch, setShowUnitSearch] = useState(false)
  const [showWeaponPicker, setShowWeaponPicker] = useState(false)
  const [showEnhancementPicker, setShowEnhancementPicker] = useState(false)
  const [pendingFactionSlug, setPendingFactionSlug] = useState<string | null>(null)

  const label = role === 'attacker' ? 'ATTAQUANT' : 'CIBLE'
  const theme = factionSlug ? getThemeForFaction(factionSlug) : null
  const enhancements = detachment?.enhancements ?? []
  const faction = factionSlug ? loadedFactions[factionSlug] : null
  const datasheets = faction?.datasheets ?? []

  // Get detachments for the faction currently being picked (may differ from confirmed faction)
  const pendingFaction = pendingFactionSlug ? loadedFactions[pendingFactionSlug] : null
  const pickerDetachments = pendingFaction?.detachments ?? []

  // Empty state — no faction selected
  if (!factionSlug) {
    return (
      <>
        <button
          className="w-full rounded-xl p-6 border-2 border-dashed cursor-pointer flex flex-col items-center justify-center gap-2 bg-transparent transition-colors min-h-[120px] lg:min-h-[240px] lg:flex-1"
          style={{ borderColor: 'var(--color-text-muted)', color: 'var(--color-text-muted)' }}
          onClick={() => setShowFactionPicker(true)}
        >
          <span className="text-2xl">
            {role === 'attacker' ? '\u2694' : '\uD83D\uDEE1'}
          </span>
          <span className="text-xs font-bold uppercase tracking-wider lg:text-base">{label}</span>
          <span className="text-[10px] lg:text-sm">Choisir une faction</span>
        </button>

        {showFactionPicker && (
          <FactionPickerModal
            factions={factions}
            detachments={pickerDetachments}
            onFactionChosen={(slug) => {
              setPendingFactionSlug(slug)
              onLoadFaction(slug)
            }}
            onSelect={(slug, det) => {
              onFactionSelect(slug, det)
              setPendingFactionSlug(null)
              setShowFactionPicker(false)
            }}
            onClose={() => { setShowFactionPicker(false); setPendingFactionSlug(null) }}
          />
        )}
      </>
    )
  }

  // Faction selected
  return (
    <>
      <div
        className="w-full rounded-xl overflow-hidden flex flex-col lg:flex-1"
        style={{ backgroundColor: theme!.surface, border: `1px solid ${theme!.primary}` }}
      >
        {/* Faction header */}
        <div className="px-3 pt-3 pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <div
                className="w-8 h-8 rounded flex items-center justify-center text-xs font-bold shrink-0 lg:w-10 lg:h-10 lg:text-sm"
                style={{ backgroundColor: theme!.primary, color: theme!.accent }}
              >
                {factionName?.split(/[\s-]+/).filter((w) => w[0] === w[0]?.toUpperCase()).slice(0, 2).map((w) => w[0]).join('') ?? '?'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold truncate lg:text-sm" style={{ color: theme!.accent }}>{factionName && <T text={factionName} category="faction" />}</p>
                <p className="text-[10px] truncate lg:text-xs" style={{ color: 'var(--color-text-muted)' }}>{detachment && <T text={detachment.name} category="detachment" />}</p>
              </div>
            </div>
            <button
              className="text-[10px] bg-transparent border-none cursor-pointer shrink-0 lg:text-xs"
              style={{ color: 'var(--color-text-muted)' }}
              onClick={onReset}
            >
              Changer
            </button>
          </div>
        </div>

        {/* Unit card */}
        <div className="px-3 pb-3 flex-1 flex flex-col">
          {!datasheet ? (
            <button
              className="flex-1 rounded-lg border border-dashed cursor-pointer flex flex-col items-center justify-center gap-1 bg-transparent"
              style={{ borderColor: theme!.primary, color: 'var(--color-text-muted)' }}
              onClick={() => setShowUnitSearch(true)}
            >
              <span className="text-sm font-medium lg:text-base">Unité</span>
              <span className="text-[10px] lg:text-sm">Choisir</span>
            </button>
          ) : (
            <div
              className="rounded-lg p-2.5 flex-1 flex flex-col gap-2"
              style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}
            >
              {/* Unit name + points + change */}
              <div className="flex items-center justify-between">
                <div className="flex items-baseline gap-1.5 min-w-0">
                  <span className="text-sm font-medium truncate lg:text-base" style={{ color: 'var(--color-text)' }}>
                    <T text={datasheet.name} category="unit" />
                  </span>
                  {datasheet.pointOptions[0] && (
                    <span className="text-[10px] shrink-0 lg:text-xs" style={{ fontFamily: 'var(--font-mono)', color: theme!.accent, fontWeight: 600 }}>
                      {datasheet.pointOptions[0].cost}pts
                    </span>
                  )}
                </div>
                <button
                  className="text-[10px] bg-transparent border-none cursor-pointer shrink-0 lg:text-xs"
                  style={{ color: theme!.accent }}
                  onClick={() => setShowUnitSearch(true)}
                >
                  Changer
                </button>
              </div>

              {/* Weapon */}
              <button
                className="text-left rounded px-2 py-1.5 border-none cursor-pointer text-xs lg:text-sm lg:py-2"
                style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--color-text)' }}
                onClick={() => setShowWeaponPicker(true)}
              >
                <span style={{ color: 'var(--color-text-muted)' }}>Arme: </span>
                <span className="font-medium">{selectedWeapon ? <T text={selectedWeapon.name} category="weapon" /> : 'Choisir'}</span>
                {selectedWeapon && (
                  <span className="ml-1" style={{ opacity: 0.5 }}>
                    A:{selectedWeapon.A} S:{selectedWeapon.S} AP:{selectedWeapon.AP} D:{selectedWeapon.D}
                  </span>
                )}
              </button>

              {/* Enhancement */}
              {enhancements.length > 0 && (
                <button
                  className="text-left rounded px-2 py-1.5 border-none cursor-pointer text-xs lg:text-sm lg:py-2"
                  style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--color-text)' }}
                  onClick={() => setShowEnhancementPicker(true)}
                >
                  <span style={{ color: 'var(--color-text-muted)' }}>Optimisation: </span>
                  <span className="font-medium" style={{ color: enhancement ? theme!.accent : 'var(--color-text-muted)' }}>
                    {enhancement ? <T text={enhancement.name} category="enhancement" /> : 'Aucune'}
                  </span>
                </button>
              )}

              {/* Model count */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] lg:text-xs" style={{ color: 'var(--color-text-muted)' }}>Modèles:</span>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={modelCount}
                  onChange={(e) => onModelCountChange(Math.max(1, Number(e.target.value)))}
                  className="w-14 rounded px-2 py-1 text-xs text-center border-none outline-none lg:text-sm lg:w-16"
                  style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--color-text)' }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showUnitSearch && (
        <UnitSearchModal
          datasheets={datasheets}
          onSelect={(ds) => { onUnitSelect(ds); setShowUnitSearch(false) }}
          onClose={() => setShowUnitSearch(false)}
        />
      )}
      {showWeaponPicker && datasheet && (
        <WeaponPickerModal
          weapons={datasheet.weapons}
          selectedWeapon={selectedWeapon}
          onSelect={onWeaponSelect}
          onClose={() => setShowWeaponPicker(false)}
        />
      )}
      {showEnhancementPicker && (
        <EnhancementPickerModal
          enhancements={enhancements}
          selectedEnhancement={enhancement}
          onSelect={onEnhancementSelect}
          onClose={() => setShowEnhancementPicker(false)}
        />
      )}
    </>
  )
}

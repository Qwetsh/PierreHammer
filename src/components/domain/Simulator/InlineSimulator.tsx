import { useEffect, useMemo, useState } from 'react'
import { useGameDataStore } from '@/stores/gameDataStore'
import { useGameData } from '@/hooks/useGameData'
import { parseStratagemEffect } from '@/utils/stratagemEffectParser'
import { FactionPickerModal } from './FactionPickerModal'
import { UnitSearchModal } from './UnitSearchModal'
import { WeaponPickerModal } from './WeaponPickerModal'
import { EnhancementPickerModal } from './EnhancementPickerModal'
import { isCharacter, canEquipEnhancement } from '@/utils/enhancementUtils'
import { HudPill } from '@/components/ui/Hud'
import { T } from '@/components/ui/TranslatableText'
import type { Weapon, Datasheet, Detachment, Enhancement, Faction } from '@/types/gameData.types'
import { getKeywordDescription } from '@/utils/keywordDescriptions'
import { StepExplainer } from './StepExplainer'
import { useSimulation } from '@/hooks/useSimulation'

function round(n: number): string {
  return (Math.round(n * 10) / 10).toString()
}

interface SideState {
  factionSlug: string | null
  detachment: Detachment | null
  datasheet: Datasheet | null
  weapon: Weapon | null
  enhancement: Enhancement | null
  modelCount: number
}

const emptySide: SideState = { factionSlug: null, detachment: null, datasheet: null, weapon: null, enhancement: null, modelCount: 5 }

interface InlineSimulatorProps {
  attackerDatasheet: Datasheet
  attackerFaction: Faction
  attackerFactionSlug: string
  onBack: () => void
}

export function InlineSimulator({ attackerDatasheet, attackerFaction, attackerFactionSlug: _attackerFactionSlug, onBack }: InlineSimulatorProps) {
  const { factionIndex } = useGameData()
  const loadedFactions = useGameDataStore((s) => s.loadedFactions)
  const loadFaction = useGameDataStore((s) => s.loadFaction)

  const detachments = attackerFaction.detachments ?? []
  const [attackerDetachment, setAttackerDetachment] = useState<Detachment | null>(detachments[0] ?? null)
  const [attackerEnhancement, setAttackerEnhancement] = useState<Enhancement | null>(null)

  const [weapon, setWeapon] = useState<Weapon | null>(attackerDatasheet.weapons[0] ?? null)
  const [modelCount, setModelCount] = useState(() => parseInt(String(attackerDatasheet.pointOptions[0]?.models), 10) || 5)
  const [showWeaponPicker, setShowWeaponPicker] = useState(false)
  const [showEnhancementPicker, setShowEnhancementPicker] = useState(false)

  // Defender modals
  const [showDefFactionPicker, setShowDefFactionPicker] = useState(false)
  const [showDefUnitSearch, setShowDefUnitSearch] = useState(false)
  const [showDefWeaponPicker, setShowDefWeaponPicker] = useState(false)
  const [showDefEnhancementPicker, setShowDefEnhancementPicker] = useState(false)
  const [pendingDefFactionSlug, setPendingDefFactionSlug] = useState<string | null>(null)

  // Available enhancements for this unit in the selected detachment
  const attackerEnhancements = useMemo(() => {
    if (!attackerDetachment || !isCharacter(attackerDatasheet)) return []
    return (attackerDetachment.enhancements ?? []).filter((e) => canEquipEnhancement(e, attackerDatasheet))
  }, [attackerDetachment, attackerDatasheet])

  const [defender, setDefender] = useState<SideState>({ ...emptySide })

  // Defender enhancements
  const defenderEnhancements = useMemo(() => {
    if (!defender.detachment || !defender.datasheet || !isCharacter(defender.datasheet)) return []
    return (defender.detachment.enhancements ?? []).filter((e) => canEquipEnhancement(e, defender.datasheet!))
  }, [defender.detachment, defender.datasheet])

  const pendingDefFaction = pendingDefFactionSlug ? loadedFactions[pendingDefFactionSlug] : null
  const defPickerDetachments = pendingDefFaction?.detachments ?? []

  const [halfRange, setHalfRange] = useState(false)
  const [charged, setCharged] = useState(false)
  const [stationary, setStationary] = useState(true)
  const [inCover, setInCover] = useState(false)
  const [rerollOnesHit, setRerollOnesHit] = useState(false)
  const [rerollOnesWound, setRerollOnesWound] = useState(false)
  const [plusOneToHit, setPlusOneToHit] = useState(false)
  const [plusOneToWound, setPlusOneToWound] = useState(false)

  const [activeAttackerStrats, setActiveAttackerStrats] = useState<Set<string>>(new Set())
  const [activeDefenderStrats, setActiveDefenderStrats] = useState<Set<string>>(new Set())

  const factions = factionIndex?.factions ?? []

  useEffect(() => {
    if (defender.factionSlug) loadFaction(defender.factionSlug)
  }, [defender.factionSlug, loadFaction])

  const defenderFaction = defender.factionSlug ? loadedFactions[defender.factionSlug] : null

  const attackerStratagems = attackerDetachment?.stratagems ?? []
  const defenderStratagems = defender.detachment?.stratagems ?? []

  const {
    result,
    weaponKeywords, activeKeywords,
    targetedDefenderKeywords, explanations,
    filteredAttackerStrats, filteredDefenderStrats,
  } = useSimulation({
    weapon,
    attackerDatasheet,
    attackerCount: modelCount,
    attackerEnhancement,
    defenderDatasheet: defender.datasheet,
    defenderCount: defender.modelCount,
    defenderEnhancement: defender.enhancement,
    attackerStratagems,
    defenderStratagems,
    activeAttackerStrats,
    activeDefenderStrats,
    halfRange, charged, stationary, inCover,
    rerollOnesHit, rerollOnesWound, plusOneToHit, plusOneToWound,
  })

  const profile = attackerDatasheet.profiles[0]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Back button */}
      <button
        onClick={onBack}
        style={{
          alignSelf: 'flex-start',
          background: 'transparent',
          border: '1px solid var(--color-border)',
          color: 'var(--color-text-muted)',
          padding: '4px 12px',
          cursor: 'pointer',
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          letterSpacing: 0.5,
        }}
      >
        {'\u2190'} Fiche unité
      </button>

      {/* === ROW-BASED LAYOUT: each row is a 2-col grid === */}
      {/* Row: Labels */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--color-accent)', letterSpacing: 1.5, textTransform: 'uppercase' }}>
          {'\u25b8'} Attaquant
        </div>
        <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--color-error, #ef4444)', letterSpacing: 1.5, textTransform: 'uppercase' }}>
          {'\u25b8'} Cible
        </div>
      </div>

      {/* Row: Headers */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'start' }}>
        {/* Attacker header */}
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', padding: 12 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)' }}>
              <T text={attackerDatasheet.name} category="unit" />
            </div>
            {attackerDatasheet.pointOptions[0] && (
              <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--color-accent)', fontWeight: 600 }}>
                {attackerDatasheet.pointOptions[0].cost} pts
              </span>
            )}
          </div>
          <div style={{ fontSize: 10, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
            <T text={attackerFaction.name} category="faction" />
          </div>
          {detachments.length > 0 && (
            <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)', letterSpacing: 1, flexShrink: 0 }}>DET.</span>
              <select
                value={attackerDetachment?.id ?? ''}
                onChange={(e) => {
                  const det = detachments.find((d) => d.id === e.target.value) ?? null
                  setAttackerDetachment(det)
                  setAttackerEnhancement(null)
                  setActiveAttackerStrats(new Set())
                }}
                style={{
                  flex: 1, padding: '4px 8px', fontSize: 11, fontFamily: 'var(--font-mono)',
                  background: 'var(--color-surface)', border: '1px solid var(--color-border)',
                  color: 'var(--color-text)', outline: 'none', cursor: 'pointer', colorScheme: 'dark',
                }}
              >
                {detachments.map((det) => (
                  <option key={det.id} value={det.id} style={{ background: 'var(--color-surface)', color: 'var(--color-text)' }}>{det.name}</option>
                ))}
              </select>
            </div>
          )}
          {profile && (
            <div style={{ display: 'flex', gap: 4, marginTop: 10 }}>
              {(['M', 'T', 'Sv', 'W', 'Ld', 'OC'] as const).map((stat) => {
                const val = profile[stat]
                if (!val) return null
                return (
                  <div key={stat} style={{ flex: 1, textAlign: 'center', border: '1px solid var(--color-border)', background: 'rgba(255,255,255,0.03)', padding: '4px 0' }}>
                    <div style={{ fontSize: 7, color: 'var(--color-accent)', fontFamily: 'var(--font-mono)', letterSpacing: 1, textTransform: 'uppercase' }}>{stat}</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)', lineHeight: 1.2 }}>{val}</div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Defender header */}
        {!defender.factionSlug ? (
          <button
            onClick={() => setShowDefFactionPicker(true)}
            style={{
              minHeight: 120, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6,
              background: 'var(--color-surface)', border: '2px dashed var(--color-border)', color: 'var(--color-text-muted)', cursor: 'pointer',
            }}
          >
            <span style={{ fontSize: 20 }}>{'\uD83D\uDEE1'}</span>
            <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', letterSpacing: 1 }}>CHOISIR UNE FACTION</span>
          </button>
        ) : (
          <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', padding: 12 }}>
            {!defender.datasheet ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)' }}>
                    {defenderFaction?.name ? <T text={defenderFaction.name} category="faction" /> : '...'}
                  </div>
                  <button
                    onClick={() => { setDefender({ ...emptySide }); setActiveDefenderStrats(new Set()) }}
                    style={{ background: 'transparent', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: 10, fontFamily: 'var(--font-mono)' }}
                  >
                    Changer
                  </button>
                </div>
                {defenderFaction && (defenderFaction.detachments ?? []).length > 0 && (
                  <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)', letterSpacing: 1, flexShrink: 0 }}>DET.</span>
                    <select
                      value={defender.detachment?.id ?? ''}
                      onChange={(e) => {
                        const det = (defenderFaction.detachments ?? []).find((d) => d.id === e.target.value) ?? null
                        setDefender((prev) => ({ ...prev, detachment: det, enhancement: null }))
                        setActiveDefenderStrats(new Set())
                      }}
                      style={{
                        flex: 1, padding: '4px 8px', fontSize: 11, fontFamily: 'var(--font-mono)',
                        background: 'var(--color-surface)', border: '1px solid var(--color-border)',
                        color: 'var(--color-text)', outline: 'none', cursor: 'pointer', colorScheme: 'dark',
                      }}
                    >
                      {(defenderFaction.detachments ?? []).map((det) => (
                        <option key={det.id} value={det.id} style={{ background: 'var(--color-surface)', color: 'var(--color-text)' }}>{det.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                <button
                  onClick={() => setShowDefUnitSearch(true)}
                  style={{
                    width: '100%', marginTop: 10, padding: '12px 10px', background: 'transparent',
                    border: '2px dashed var(--color-border)', color: 'var(--color-text-muted)', cursor: 'pointer',
                    fontSize: 11, fontFamily: 'var(--font-mono)', textAlign: 'center',
                  }}
                >
                  Choisir une unité
                </button>
              </>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)' }}>
                    <T text={defender.datasheet.name} category="unit" />
                  </div>
                  {defender.datasheet.pointOptions[0] && (
                    <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--color-error, #ef4444)', fontWeight: 600 }}>
                      {defender.datasheet.pointOptions[0].cost} pts
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: 10, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                    {defenderFaction?.name ? <T text={defenderFaction.name} category="faction" /> : '...'}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => setShowDefUnitSearch(true)} style={{ background: 'transparent', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: 10, fontFamily: 'var(--font-mono)' }}>Unité</button>
                    <button onClick={() => { setDefender({ ...emptySide }); setActiveDefenderStrats(new Set()) }} style={{ background: 'transparent', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: 10, fontFamily: 'var(--font-mono)' }}>Faction</button>
                  </div>
                </div>
                {defenderFaction && (defenderFaction.detachments ?? []).length > 0 && (
                  <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)', letterSpacing: 1, flexShrink: 0 }}>DET.</span>
                    <select
                      value={defender.detachment?.id ?? ''}
                      onChange={(e) => {
                        const det = (defenderFaction.detachments ?? []).find((d) => d.id === e.target.value) ?? null
                        setDefender((prev) => ({ ...prev, detachment: det, enhancement: null }))
                        setActiveDefenderStrats(new Set())
                      }}
                      style={{
                        flex: 1, padding: '4px 8px', fontSize: 11, fontFamily: 'var(--font-mono)',
                        background: 'var(--color-surface)', border: '1px solid var(--color-border)',
                        color: 'var(--color-text)', outline: 'none', cursor: 'pointer', colorScheme: 'dark',
                      }}
                    >
                      {(defenderFaction.detachments ?? []).map((det) => (
                        <option key={det.id} value={det.id} style={{ background: 'var(--color-surface)', color: 'var(--color-text)' }}>{det.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                {defender.datasheet.profiles[0] && (
                  <div style={{ display: 'flex', gap: 4, marginTop: 10 }}>
                    {(['M', 'T', 'Sv', 'W', 'Ld', 'OC'] as const).map((stat) => {
                      const val = defender.datasheet!.profiles[0][stat]
                      if (!val) return null
                      return (
                        <div key={stat} style={{ flex: 1, textAlign: 'center', border: '1px solid var(--color-border)', background: 'rgba(255,255,255,0.03)', padding: '4px 0' }}>
                          <div style={{ fontSize: 7, color: 'var(--color-error, #ef4444)', fontFamily: 'var(--font-mono)', letterSpacing: 1, textTransform: 'uppercase' }}>{stat}</div>
                          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)', lineHeight: 1.2 }}>{val}</div>
                        </div>
                      )
                    })}
                  </div>
                )}
                {targetedDefenderKeywords.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
                    {targetedDefenderKeywords.map(({ keyword, reason }) => (
                      <span
                        key={keyword}
                        title={reason}
                        style={{
                          fontSize: 9, fontFamily: 'var(--font-mono)', letterSpacing: 0.5,
                          padding: '2px 6px', background: 'rgba(239,68,68,0.15)',
                          border: '1px solid rgba(239,68,68,0.4)', color: 'var(--color-error, #ef4444)',
                        }}
                      >
                        {keyword} <span style={{ opacity: 0.7 }}>({reason})</span>
                      </span>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Row: Weapon */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'start' }}>
        {/* Attacker weapon */}
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', padding: 10 }}>
          <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)', letterSpacing: 1, marginBottom: 6 }}>ARME</div>
          <button
            onClick={() => setShowWeaponPicker(true)}
            style={{
              width: '100%', textAlign: 'left', padding: '8px 10px', background: 'rgba(255,255,255,0.05)',
              border: `1px solid ${weapon ? 'var(--color-accent)' : 'var(--color-border)'}`,
              color: 'var(--color-text)', cursor: 'pointer', fontSize: 12,
            }}
          >
            <div style={{ fontWeight: 600 }}>{weapon ? <T text={weapon.name} category="weapon" /> : 'Choisir une arme'}</div>
            {weapon && (
              <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginTop: 2, fontFamily: 'var(--font-mono)' }}>
                {weapon.range !== 'Melee' && `${weapon.range} `}A:{weapon.A} {weapon.type === 'Melee' || weapon.range === 'Melee' ? 'CC' : 'CT'}:{weapon.BS_WS} S:{weapon.S} AP:{weapon.AP} D:{weapon.D}
              </div>
            )}
          </button>
          {activeKeywords.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
              {activeKeywords.map((kw) => {
                const desc = getKeywordDescription(kw)
                if (desc.length === 0) return <HudPill key={kw}>{kw}</HudPill>
                return (
                  <StepExplainer key={kw} lines={desc} color="var(--color-accent)" inline>
                    <HudPill>{kw}</HudPill>
                  </StepExplainer>
                )
              })}
            </div>
          )}
        </div>

        {/* Defender weapon */}
        {defender.datasheet ? (
          <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', padding: 10 }}>
            <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)', letterSpacing: 1, marginBottom: 6 }}>ARME</div>
            <button
              onClick={() => setShowDefWeaponPicker(true)}
              style={{
                width: '100%', textAlign: 'left', padding: '8px 10px', background: 'rgba(255,255,255,0.05)',
                border: `1px solid ${defender.weapon ? 'var(--color-error, #ef4444)' : 'var(--color-border)'}`,
                color: 'var(--color-text)', cursor: 'pointer', fontSize: 12,
              }}
            >
              <div style={{ fontWeight: 600 }}>{defender.weapon ? <T text={defender.weapon.name} category="weapon" /> : 'Choisir'}</div>
              {defender.weapon && (
                <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginTop: 2, fontFamily: 'var(--font-mono)' }}>
                  {defender.weapon.range !== 'Melee' && `${defender.weapon.range} `}A:{defender.weapon.A} {defender.weapon.type === 'Melee' || defender.weapon.range === 'Melee' ? 'CC' : 'CT'}:{defender.weapon.BS_WS} S:{defender.weapon.S} AP:{defender.weapon.AP} D:{defender.weapon.D}
                </div>
              )}
            </button>
          </div>
        ) : <div />}
      </div>

      {/* Row: Enhancement (only if either side has enhancements) */}
      {(attackerEnhancements.length > 0 || (defender.datasheet && defenderEnhancements.length > 0)) && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'start' }}>
          {/* Attacker enhancement */}
          {attackerEnhancements.length > 0 ? (
            <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', padding: 10 }}>
              <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)', letterSpacing: 1, marginBottom: 6 }}>OPTIMISATION</div>
              <button
                onClick={() => setShowEnhancementPicker(true)}
                style={{
                  width: '100%', textAlign: 'left', padding: '8px 10px', background: 'rgba(255,255,255,0.05)',
                  border: `1px solid ${attackerEnhancement ? 'var(--color-accent)' : 'var(--color-border)'}`,
                  color: 'var(--color-text)', cursor: 'pointer', fontSize: 12,
                }}
              >
                {attackerEnhancement ? (
                  <div>
                    <span style={{ fontWeight: 600 }}><T text={attackerEnhancement.name} category="enhancement" /></span>
                    <span style={{ color: 'var(--color-accent)', marginLeft: 6, fontFamily: 'var(--font-mono)', fontSize: 10 }}>{attackerEnhancement.cost} pts</span>
                  </div>
                ) : (
                  <span style={{ color: 'var(--color-text-muted)' }}>Aucune</span>
                )}
              </button>
            </div>
          ) : <div />}

          {/* Defender enhancement */}
          {defender.datasheet && defenderEnhancements.length > 0 ? (
            <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', padding: 10 }}>
              <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)', letterSpacing: 1, marginBottom: 6 }}>OPTIMISATION</div>
              <button
                onClick={() => setShowDefEnhancementPicker(true)}
                style={{
                  width: '100%', textAlign: 'left', padding: '8px 10px', background: 'rgba(255,255,255,0.05)',
                  border: `1px solid ${defender.enhancement ? 'var(--color-error, #ef4444)' : 'var(--color-border)'}`,
                  color: 'var(--color-text)', cursor: 'pointer', fontSize: 12,
                }}
              >
                {defender.enhancement ? (
                  <div>
                    <span style={{ fontWeight: 600 }}><T text={defender.enhancement.name} category="enhancement" /></span>
                    <span style={{ color: 'var(--color-error, #ef4444)', marginLeft: 6, fontFamily: 'var(--font-mono)', fontSize: 10 }}>{defender.enhancement.cost} pts</span>
                  </div>
                ) : (
                  <span style={{ color: 'var(--color-text-muted)' }}>Aucune</span>
                )}
              </button>
            </div>
          ) : <div />}
        </div>
      )}

      {/* Row: Model count */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'start' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--color-surface)', border: '1px solid var(--color-border)', padding: '8px 10px' }}>
          <span style={{ fontSize: 10, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>MODÈLES</span>
          <input
            type="number" min={1} max={30} value={modelCount}
            onChange={(e) => setModelCount(Math.max(1, Number(e.target.value)))}
            style={{ width: 50, padding: '4px 6px', fontSize: 12, textAlign: 'center', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--color-border)', color: 'var(--color-text)', outline: 'none' }}
          />
        </div>
        {defender.datasheet ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--color-surface)', border: '1px solid var(--color-border)', padding: '8px 10px' }}>
            <span style={{ fontSize: 10, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>MODÈLES</span>
            <input
              type="number" min={1} max={30} value={defender.modelCount}
              onChange={(e) => setDefender((prev) => ({ ...prev, modelCount: Math.max(1, Number(e.target.value)) }))}
              style={{ width: 50, padding: '4px 6px', fontSize: 12, textAlign: 'center', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--color-border)', color: 'var(--color-text)', outline: 'none' }}
            />
          </div>
        ) : <div />}
      </div>

      {/* === TOGGLES === */}
      {weapon && defender.datasheet && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {(weaponKeywords?.rapidFire || weaponKeywords?.melta) && (
            <ToggleChip label="Demi-portée" active={halfRange} onToggle={() => setHalfRange(!halfRange)} />
          )}
          {weaponKeywords?.lance && (
            <ToggleChip label="A chargé" active={charged} onToggle={() => setCharged(!charged)} />
          )}
          {weaponKeywords?.heavy && (
            <ToggleChip label="Stationnaire" active={stationary} onToggle={() => setStationary(!stationary)} />
          )}
          <ToggleChip label="Couvert" active={inCover} onToggle={() => setInCover(!inCover)} />
          <span style={{ width: 1, height: 20, background: 'var(--color-border)', margin: '0 2px' }} />
          <ToggleChip label="RR 1s touche" active={rerollOnesHit} onToggle={() => setRerollOnesHit(!rerollOnesHit)} />
          <ToggleChip label="RR 1s bless." active={rerollOnesWound} onToggle={() => setRerollOnesWound(!rerollOnesWound)} />
          <ToggleChip label="+1 touche" active={plusOneToHit} onToggle={() => setPlusOneToHit(!plusOneToHit)} />
          <ToggleChip label="+1 bless." active={plusOneToWound} onToggle={() => setPlusOneToWound(!plusOneToWound)} />
        </div>
      )}

      {/* === STRATAGEMS === */}
      {(filteredAttackerStrats.length > 0 || filteredDefenderStrats.length > 0) && weapon && defender.datasheet && (
        <div>
          <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)', letterSpacing: 1, marginBottom: 6 }}>STRATAGÈMES</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {filteredAttackerStrats.map((strat) => {
              const isActive = activeAttackerStrats.has(strat.id)
              const parsed = !!parseStratagemEffect(strat)
              return (
                <StratagemToggle
                  key={strat.id}
                  name={strat.name}
                  cpCost={strat.cpCost}
                  isActive={isActive}
                  parsed={parsed}
                  variant="attacker"
                  onToggle={() => {
                    const next = new Set(activeAttackerStrats)
                    isActive ? next.delete(strat.id) : next.add(strat.id)
                    setActiveAttackerStrats(next)
                  }}
                />
              )
            })}
            {filteredDefenderStrats.map((strat) => {
              const isActive = activeDefenderStrats.has(strat.id)
              const parsed = !!parseStratagemEffect(strat)
              return (
                <StratagemToggle
                  key={`def-${strat.id}`}
                  name={strat.name}
                  cpCost={strat.cpCost}
                  isActive={isActive}
                  parsed={parsed}
                  variant="defender"
                  onToggle={() => {
                    const next = new Set(activeDefenderStrats)
                    isActive ? next.delete(strat.id) : next.add(strat.id)
                    setActiveDefenderStrats(next)
                  }}
                />
              )
            })}
          </div>
        </div>
      )}

      {/* === RESULTS — Pipeline horizontal === */}
      {result && (() => {
        const hitPct = result.attacksTotal > 0 ? Math.round((result.hitsExpected / result.attacksTotal) * 100) : 0
        const woundPct = result.hitsExpected > 0 ? Math.round((result.woundsExpected / result.hitsExpected) * 100) : 0
        const savePct = result.woundsExpected > 0 ? Math.round((result.unsavedWounds / result.woundsExpected) * 100) : 0
        const killPct = defender.modelCount > 0 ? Math.round((result.estimatedKills / defender.modelCount) * 100) : 0
        const finalDmg = result.steps.fnpThreshold ? result.damageAfterFnp : result.damageTotal

        const stepStyle: React.CSSProperties = {
          flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minWidth: 0,
        }
        const labelStyle: React.CSSProperties = {
          fontSize: 8, fontFamily: 'var(--font-mono)', letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: 6,
        }
        const valueStyle = (color: string): React.CSSProperties => ({
          fontSize: 28, fontWeight: 700, color, lineHeight: 1, marginBottom: 4,
        })
        const detailStyle: React.CSSProperties = {
          fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)', marginBottom: 6,
        }
        const barBg: React.CSSProperties = {
          height: 3, background: 'rgba(255,255,255,0.08)', overflow: 'hidden', marginTop: 'auto',
        }
        const arrowStyle: React.CSSProperties = {
          display: 'flex', alignItems: 'center', color: 'var(--color-text-muted)', fontSize: 8, padding: '0 2px', opacity: 0.5,
        }
        const separatorStyle: React.CSSProperties = {
          width: 1, background: 'var(--color-border)', alignSelf: 'stretch',
        }

        return (
          <div>
            <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--color-accent)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 }}>
              {'\u25b8'} Analyse probabiliste — Valeurs attendues
            </div>
            <div style={{ display: 'flex', background: 'var(--color-surface)', border: '1px solid var(--color-border)', alignItems: 'stretch' }}>
              {/* Attaques */}
              <StepExplainer lines={explanations?.attacks.lines ?? []} color="var(--color-text-muted)">
                <div style={stepStyle}>
                  <div style={labelStyle}>Attaques</div>
                  <div style={valueStyle('var(--color-text)')}>{round(result.attacksTotal)}</div>
                  <div style={detailStyle}>{modelCount} moy.</div>
                  <div style={barBg}>
                    <div style={{ height: '100%', width: '100%', background: 'var(--color-text-muted)' }} />
                  </div>
                </div>
              </StepExplainer>

              <div style={separatorStyle} />
              <div style={arrowStyle}>{'\u25b8'}</div>

              {/* Touches */}
              <StepExplainer lines={explanations?.hits.lines ?? []} color="#22d3ee">
                <div style={stepStyle}>
                  <div style={labelStyle}>Touches</div>
                  <div style={valueStyle('#22d3ee')}>{round(result.hitsExpected)}</div>
                  <div style={detailStyle}>{result.steps.hitThreshold > 0 ? `${result.steps.hitThreshold}+` : 'auto'} · {hitPct}%</div>
                  <div style={barBg}>
                    <div style={{ height: '100%', width: `${hitPct}%`, background: '#22d3ee', transition: 'width 0.3s' }} />
                  </div>
                </div>
              </StepExplainer>

              <div style={separatorStyle} />
              <div style={arrowStyle}>{'\u25b8'}</div>

              {/* Blessures */}
              <StepExplainer lines={explanations?.wounds.lines ?? []} color="#fbbf24">
                <div style={stepStyle}>
                  <div style={labelStyle}>Blessures</div>
                  <div style={valueStyle('#fbbf24')}>{round(result.woundsExpected)}</div>
                  <div style={detailStyle}>{result.steps.woundThreshold}+ · {woundPct}%</div>
                  <div style={barBg}>
                    <div style={{ height: '100%', width: `${woundPct}%`, background: '#fbbf24', transition: 'width 0.3s' }} />
                  </div>
                </div>
              </StepExplainer>

              <div style={separatorStyle} />
              <div style={arrowStyle}>{'\u25b8'}</div>

              {/* Non sauvées */}
              <StepExplainer lines={explanations?.saves.lines ?? []} color="#f472b6">
                <div style={stepStyle}>
                  <div style={labelStyle}>Non sauvées</div>
                  <div style={valueStyle('#f472b6')}>{round(result.unsavedWounds)}</div>
                  <div style={detailStyle}>{result.steps.usedInvuln ? 'inv' : 'sv'}{result.steps.saveThreshold}+ · {savePct}%</div>
                  <div style={barBg}>
                    <div style={{ height: '100%', width: `${savePct}%`, background: '#f472b6', transition: 'width 0.3s' }} />
                  </div>
                </div>
              </StepExplainer>

              <div style={separatorStyle} />
              <div style={arrowStyle}>{'\u25b8'}</div>

              {/* Dégâts */}
              <StepExplainer lines={explanations?.damage.lines ?? []} color="#f472b6">
                <div style={stepStyle}>
                  <div style={labelStyle}>Dégâts</div>
                  <div style={valueStyle('#f472b6')}>{round(finalDmg)}</div>
                  <div style={detailStyle}>
                    × {result.steps.avgDamagePerWound} dmg
                    {result.steps.fnpThreshold ? ` · FnP ${result.steps.fnpThreshold}+` : ''}
                  </div>
                  <div style={barBg}>
                    <div style={{ height: '100%', width: '100%', background: '#f472b6', transition: 'width 0.3s' }} />
                  </div>
                </div>
              </StepExplainer>

              {/* = separator */}
              <div style={{ display: 'flex', alignItems: 'center', padding: '0 8px', fontSize: 18, color: 'var(--color-text-muted)', fontWeight: 300 }}>=</div>

              {/* Modèles éliminés */}
              <div style={{
                padding: '12px 14px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
                borderLeft: '1px solid var(--color-border)', minWidth: 130,
              }}>
                <div style={{ fontSize: 8, fontFamily: 'var(--font-mono)', letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--color-error, #ef4444)', marginBottom: 6 }}>
                  ≈ Modèles éliminés
                </div>
                <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--color-error, #ef4444)', lineHeight: 1 }}>
                  {round(result.estimatedKills)}
                  <span style={{ fontSize: 14, fontWeight: 400, color: 'var(--color-text-muted)' }}>/{defender.modelCount}</span>
                </div>
                <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)', marginTop: 4 }}>
                  {killPct}% de l'unité
                </div>
              </div>
            </div>

            {result.mortalWounds > 0 && (
              <div style={{ fontSize: 10, color: 'var(--color-warning, #f59e0b)', marginTop: 6, fontFamily: 'var(--font-mono)' }}>
                dont {round(result.mortalWoundCount)} MW = {round(result.mortalWounds)} degats
              </div>
            )}
          </div>
        )
      })()}

      {/* Hints */}
      {!weapon && (
        <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--color-text-muted)', padding: 12 }}>
          Sélectionne une arme pour lancer la simulation
        </div>
      )}
      {weapon && !defender.datasheet && (
        <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--color-text-muted)', padding: 12 }}>
          Sélectionne une cible pour voir les résultats
        </div>
      )}

      {/* Weapon picker modal */}
      {showWeaponPicker && (
        <WeaponPickerModal
          weapons={attackerDatasheet.weapons}
          selectedWeapon={weapon}
          onSelect={(w) => setWeapon(w)}
          onClose={() => setShowWeaponPicker(false)}
        />
      )}

      {/* Enhancement picker modal */}
      {showEnhancementPicker && (
        <EnhancementPickerModal
          enhancements={attackerEnhancements}
          selectedEnhancement={attackerEnhancement}
          onSelect={(e) => { setAttackerEnhancement(e); setShowEnhancementPicker(false) }}
          onClose={() => setShowEnhancementPicker(false)}
        />
      )}

      {/* Defender modals */}
      {showDefFactionPicker && (
        <FactionPickerModal
          factions={factions}
          detachments={defPickerDetachments}
          onFactionChosen={(slug) => {
            setPendingDefFactionSlug(slug)
            loadFaction(slug)
          }}
          onSelect={(slug, det) => {
            setDefender({ ...emptySide, factionSlug: slug, detachment: det })
            setActiveDefenderStrats(new Set())
            setPendingDefFactionSlug(null)
            setShowDefFactionPicker(false)
          }}
          onClose={() => { setShowDefFactionPicker(false); setPendingDefFactionSlug(null) }}
        />
      )}
      {showDefUnitSearch && defenderFaction && (
        <UnitSearchModal
          datasheets={defenderFaction.datasheets}
          onSelect={(ds) => {
            setDefender((prev) => ({
              ...prev,
              datasheet: ds,
              weapon: ds.weapons[0] ?? null,
              enhancement: null,
              modelCount: parseInt(String(ds.pointOptions[0]?.models), 10) || 5,
            }))
            setShowDefUnitSearch(false)
          }}
          onClose={() => setShowDefUnitSearch(false)}
        />
      )}
      {showDefWeaponPicker && defender.datasheet && (
        <WeaponPickerModal
          weapons={defender.datasheet.weapons}
          selectedWeapon={defender.weapon}
          onSelect={(w) => setDefender((prev) => ({ ...prev, weapon: w }))}
          onClose={() => setShowDefWeaponPicker(false)}
        />
      )}
      {showDefEnhancementPicker && (
        <EnhancementPickerModal
          enhancements={defenderEnhancements}
          selectedEnhancement={defender.enhancement}
          onSelect={(e) => { setDefender((prev) => ({ ...prev, enhancement: e })); setShowDefEnhancementPicker(false) }}
          onClose={() => setShowDefEnhancementPicker(false)}
        />
      )}
    </div>
  )
}

function ToggleChip({ label, active, onToggle }: { label: string; active: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      style={{
        padding: '4px 10px',
        fontSize: 10,
        fontFamily: 'var(--font-mono)',
        letterSpacing: 0.5,
        background: active ? 'var(--color-accent)' : 'var(--color-surface)',
        color: active ? '#fff' : 'var(--color-text-muted)',
        border: `1px solid ${active ? 'var(--color-accent)' : 'var(--color-border)'}`,
        cursor: 'pointer',
      }}
    >
      {label}
    </button>
  )
}

function StratagemToggle({ name, cpCost, isActive, parsed, variant, onToggle }: {
  name: string
  cpCost: number
  isActive: boolean
  parsed: boolean
  variant: 'attacker' | 'defender'
  onToggle: () => void
}) {
  const activeColor = variant === 'attacker' ? 'var(--color-accent)' : 'var(--color-error, #ef4444)'
  return (
    <button
      onClick={onToggle}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '6px 10px',
        fontSize: 10,
        background: isActive ? activeColor : 'var(--color-surface)',
        color: isActive ? '#fff' : variant === 'defender' ? 'var(--color-text-muted)' : 'var(--color-text)',
        opacity: parsed ? 1 : 0.6,
        border: `1px solid ${isActive ? activeColor : 'var(--color-border)'}`,
        cursor: 'pointer',
      }}
    >
      <span>{variant === 'defender' ? 'Def: ' : ''}{name} {!parsed && '(lecture seule)'}</span>
      <span style={{ opacity: 0.7 }}>{cpCost} CP</span>
    </button>
  )
}

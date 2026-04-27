import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router'
import { useGameDataStore } from '@/stores/gameDataStore'
import { useGameData } from '@/hooks/useGameData'
import { parseStratagemEffect } from '@/utils/stratagemEffectParser'
import { isCharacter, canEquipEnhancement } from '@/utils/enhancementUtils'
import { FactionPickerModal } from '@/components/domain/Simulator/FactionPickerModal'
import { UnitSearchModal } from '@/components/domain/Simulator/UnitSearchModal'
import { WeaponPickerModal } from '@/components/domain/Simulator/WeaponPickerModal'
import { EnhancementPickerModal } from '@/components/domain/Simulator/EnhancementPickerModal'
import { HudTopBar, MTopBar, HudPill } from '@/components/ui/Hud'
import { T } from '@/components/ui/TranslatableText'
import type { Weapon, Datasheet, Detachment, Enhancement } from '@/types/gameData.types'
import { getKeywordDescription } from '@/utils/keywordDescriptions'
import { StepExplainer } from '@/components/domain/Simulator/StepExplainer'
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

interface SimulatorPageProps {
  /** When provided, the component is in "embedded" mode (e.g. inside a modal) */
  onClose?: () => void
  /** Pre-fill attacker faction */
  initialAttackerFaction?: string
  /** Pre-fill attacker datasheet */
  initialAttackerDs?: string
  /** Pre-fill defender faction */
  initialDefenderFaction?: string
  /** Pre-fill defender datasheet */
  initialDefenderDs?: string
  /** Filter attacker weapons to only these keys (format: "ranged:Name" / "melee:Name") */
  initialAttackerWeapons?: string[]
}

export function SimulatorPage({
  onClose,
  initialAttackerFaction,
  initialAttackerDs,
  initialDefenderFaction,
  initialDefenderDs,
  initialAttackerWeapons,
}: SimulatorPageProps = {}) {
  const { factionId: routeFactionId, datasheetId: routeDatasheetId } = useParams<{ factionId?: string; datasheetId?: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const { factionIndex } = useGameData()
  const loadedFactions = useGameDataStore((s) => s.loadedFactions)
  const loadFaction = useGameDataStore((s) => s.loadFaction)

  // Props take priority over URL params / nav state
  const factionId = initialAttackerFaction ?? routeFactionId
  const datasheetId = initialAttackerDs ?? routeDatasheetId

  const navState = location.state as { defenderFactionSlug?: string; defenderDatasheetId?: string } | null
  const defFactionSlug = initialDefenderFaction ?? navState?.defenderFactionSlug ?? null
  const defDatasheetId = initialDefenderDs ?? navState?.defenderDatasheetId ?? null

  const [attacker, setAttacker] = useState<SideState>({ ...emptySide, factionSlug: factionId ?? null })
  const [defender, setDefender] = useState<SideState>({ ...emptySide, factionSlug: defFactionSlug })

  // Toggles
  const [halfRange, setHalfRange] = useState(false)
  const [charged, setCharged] = useState(false)
  const [stationary, setStationary] = useState(true)
  const [inCover, setInCover] = useState(false)

  // Stratagems
  const [activeAttackerStrats, setActiveAttackerStrats] = useState<Set<string>>(new Set())
  const [activeDefenderStrats, setActiveDefenderStrats] = useState<Set<string>>(new Set())

  // Modals
  const [showAtkFactionPicker, setShowAtkFactionPicker] = useState(false)
  const [showAtkUnitSearch, setShowAtkUnitSearch] = useState(false)
  const [showAtkWeaponPicker, setShowAtkWeaponPicker] = useState(false)
  const [showAtkEnhancementPicker, setShowAtkEnhancementPicker] = useState(false)
  const [pendingAtkFactionSlug, setPendingAtkFactionSlug] = useState<string | null>(null)

  const [showDefFactionPicker, setShowDefFactionPicker] = useState(false)
  const [showDefUnitSearch, setShowDefUnitSearch] = useState(false)
  const [showDefWeaponPicker, setShowDefWeaponPicker] = useState(false)
  const [showDefEnhancementPicker, setShowDefEnhancementPicker] = useState(false)
  const [pendingDefFactionSlug, setPendingDefFactionSlug] = useState<string | null>(null)

  const factions = factionIndex?.factions ?? []

  // Load factions when selected
  useEffect(() => {
    if (attacker.factionSlug) loadFaction(attacker.factionSlug)
  }, [attacker.factionSlug, loadFaction])

  useEffect(() => {
    if (defender.factionSlug) loadFaction(defender.factionSlug)
  }, [defender.factionSlug, loadFaction])

  // Handle URL params (coming from a datasheet page)
  const isMeleeW = (w: { type: string; range: string }) => w.type === 'Melee' || w.range === 'Melee'
  const toWeaponKey = (w: { type: string; range: string; name: string }) => `${isMeleeW(w) ? 'melee' : 'ranged'}:${w.name}`

  useEffect(() => {
    if (factionId && datasheetId && loadedFactions[factionId]) {
      const faction = loadedFactions[factionId]
      const ds = faction.datasheets.find((d) => d.id === datasheetId)
      if (ds) {
        const det = faction.detachments?.[0] ?? null
        const filteredWeapons = initialAttackerWeapons?.length
          ? ds.weapons.filter((w) => initialAttackerWeapons.includes(toWeaponKey(w)))
          : ds.weapons
        setAttacker({
          factionSlug: factionId,
          detachment: det,
          datasheet: ds,
          weapon: filteredWeapons[0] ?? ds.weapons[0] ?? null,
          enhancement: null,
          modelCount: parseInt(String(ds.pointOptions[0]?.models), 10) || 5,
        })
      }
    }
  }, [factionId, datasheetId, loadedFactions])

  // Handle pre-filled defender (from game mode or props)
  useEffect(() => {
    if (defFactionSlug) loadFaction(defFactionSlug)
  }, [defFactionSlug, loadFaction])

  useEffect(() => {
    if (!defFactionSlug || !defDatasheetId) return
    const defFaction = loadedFactions[defFactionSlug]
    if (!defFaction) return
    const ds = defFaction.datasheets.find((d) => d.id === defDatasheetId)
    if (!ds || defender.datasheet) return
    const det = defFaction.detachments?.[0] ?? null
    setDefender({
      factionSlug: defFactionSlug,
      detachment: det,
      datasheet: ds,
      weapon: null,
      enhancement: null,
      modelCount: parseInt(String(ds.pointOptions[0]?.models), 10) || 5,
    })
  }, [defFactionSlug, defDatasheetId, loadedFactions])

  // Derived data
  const attackerFaction = attacker.factionSlug ? loadedFactions[attacker.factionSlug] : null
  const defenderFaction = defender.factionSlug ? loadedFactions[defender.factionSlug] : null

  const attackerDetachments = attackerFaction?.detachments ?? []
  const defenderDetachments = defenderFaction?.detachments ?? []

  const attackerStratagems = attacker.detachment?.stratagems ?? []
  const defenderStratagems = defender.detachment?.stratagems ?? []

  const pendingAtkFaction = pendingAtkFactionSlug ? loadedFactions[pendingAtkFactionSlug] : null
  const atkPickerDetachments = pendingAtkFaction?.detachments ?? []
  const pendingDefFaction = pendingDefFactionSlug ? loadedFactions[pendingDefFactionSlug] : null
  const defPickerDetachments = pendingDefFaction?.detachments ?? []

  // Enhancements
  const attackerEnhancements = useMemo(() => {
    if (!attacker.detachment || !attacker.datasheet || !isCharacter(attacker.datasheet)) return []
    return (attacker.detachment.enhancements ?? []).filter((e) => canEquipEnhancement(e, attacker.datasheet!))
  }, [attacker.detachment, attacker.datasheet])

  const defenderEnhancements = useMemo(() => {
    if (!defender.detachment || !defender.datasheet || !isCharacter(defender.datasheet)) return []
    return (defender.detachment.enhancements ?? []).filter((e) => canEquipEnhancement(e, defender.datasheet!))
  }, [defender.detachment, defender.datasheet])

  // --- Simulation hook (single source of truth for all combat logic) ---
  const {
    result, damageDelta,
    weaponKeywords, activeKeywords,
    targetedDefenderKeywords, explanations,
    filteredAttackerStrats, filteredDefenderStrats,
  } = useSimulation({
    weapon: attacker.weapon,
    attackerDatasheet: attacker.datasheet,
    attackerCount: attacker.modelCount,
    attackerEnhancement: attacker.enhancement,
    defenderDatasheet: defender.datasheet,
    defenderCount: defender.modelCount,
    defenderEnhancement: defender.enhancement,
    attackerStratagems,
    defenderStratagems,
    activeAttackerStrats,
    activeDefenderStrats,
    halfRange, charged, stationary, inCover,
  })

  const attackerProfile = attacker.datasheet?.profiles[0]
  const defenderProfile = defender.datasheet?.profiles[0]

  const embedded = !!onClose

  return (
    <>
      {/* Desktop HUD top bar (standalone only) */}
      {!embedded && (
        <div className="hidden lg:block">
          <HudTopBar title="Simulateur de Combat" sub="Tactique" />
        </div>
      )}
      <div
        className={embedded
          ? ''
          : '-mx-4 px-1.5 pb-24 lg:mx-auto lg:px-6 lg:py-0 lg:pb-8 lg:max-w-5xl lg:min-h-[calc(100vh-60px)] lg:flex lg:flex-col lg:justify-center'
        }
      >
        {/* Embedded header */}
        {embedded && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', letterSpacing: 2, color: 'var(--color-accent)', textTransform: 'uppercase' }}>
              {'\u25b8'} Simulateur de Combat
            </div>
            <button
              style={{ background: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-accent)', padding: '4px 10px', fontFamily: 'var(--font-mono)', fontSize: 9, cursor: 'pointer' }}
              onClick={onClose}
            >
              {'\u2715'} FERMER
            </button>
          </div>
        )}
        {/* Mobile header (standalone only) */}
        {!embedded && (
          <div className="lg:hidden" style={{ marginBottom: 8 }}>
            <MTopBar
              title="Simulateur"
              sub="Tactique"
              actions={
                <button
                  style={{ background: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-accent)', padding: '4px 8px', fontFamily: 'var(--font-mono)', fontSize: 9, cursor: 'pointer' }}
                  onClick={() => navigate(-1)}
                >
                  {'\u2190'} RETOUR
                </button>
              }
            />
          </div>
        )}

        <div className={`flex flex-col ${embedded ? 'gap-2' : 'gap-3 lg:gap-4'}`}>

          {/* === ATTACKER & DEFENDER COLUMNS === */}
          <div className={`flex flex-col gap-3 lg:grid lg:grid-cols-2 ${embedded ? 'lg:gap-3' : 'lg:gap-4'}`} style={{ alignItems: 'start' }}>

            {/* ===== ATTACKER COLUMN ===== */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%' }}>
              <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--color-accent)', letterSpacing: 1.5, textTransform: 'uppercase' }}>
                {'\u25b8'} Attaquant
              </div>

              {/* Attacker header */}
              {!attacker.factionSlug ? (
                <button
                  onClick={() => setShowAtkFactionPicker(true)}
                  style={{
                    width: '100%', minHeight: embedded ? 60 : 100, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6,
                    background: 'var(--color-surface)', border: '2px dashed var(--color-border)', color: 'var(--color-text-muted)', cursor: 'pointer',
                  }}
                >
                  <span style={{ fontSize: embedded ? 16 : 20 }}>{'\u2694'}</span>
                  <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', letterSpacing: 1 }}>CHOISIR UNE FACTION</span>
                </button>
              ) : (
                <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', padding: '8px 10px' }}>
                  {!attacker.datasheet ? (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)' }}>
                          {attackerFaction?.name ? <T text={attackerFaction.name} category="faction" /> : '...'}
                        </div>
                        <button
                          onClick={() => { setAttacker({ ...emptySide }); setActiveAttackerStrats(new Set()) }}
                          style={{ background: 'transparent', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: 10, fontFamily: 'var(--font-mono)' }}
                        >
                          Changer
                        </button>
                      </div>
                      {attackerDetachments.length > 0 && (
                        <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)', letterSpacing: 1, flexShrink: 0 }}>DET.</span>
                          <select
                            value={attacker.detachment?.id ?? ''}
                            onChange={(e) => {
                              const det = attackerDetachments.find((d) => d.id === e.target.value) ?? null
                              setAttacker((prev) => ({ ...prev, detachment: det, enhancement: null }))
                              setActiveAttackerStrats(new Set())
                            }}
                            style={{
                              flex: 1, padding: '4px 8px', fontSize: 11, fontFamily: 'var(--font-mono)',
                              background: 'var(--color-surface)', border: '1px solid var(--color-border)',
                              color: 'var(--color-text)', outline: 'none', cursor: 'pointer', colorScheme: 'dark',
                            }}
                          >
                            {attackerDetachments.map((det) => (
                              <option key={det.id} value={det.id} style={{ background: 'var(--color-surface)', color: 'var(--color-text)' }}>{det.name}</option>
                            ))}
                          </select>
                        </div>
                      )}
                      <button
                        onClick={() => setShowAtkUnitSearch(true)}
                        style={{
                          width: '100%', marginTop: 6, padding: '10px 10px', background: 'transparent',
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
                          <T text={attacker.datasheet.name} category="unit" />
                        </div>
                        {attacker.datasheet.pointOptions[0] && (
                          <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--color-accent)', fontWeight: 600 }}>
                            {attacker.datasheet.pointOptions[0].cost} pts
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ fontSize: 10, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                          {attackerFaction?.name ? <T text={attackerFaction.name} category="faction" /> : '...'}
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={() => setShowAtkUnitSearch(true)} style={{ background: 'transparent', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: 10, fontFamily: 'var(--font-mono)' }}>Unité</button>
                          <button onClick={() => { setAttacker({ ...emptySide }); setActiveAttackerStrats(new Set()) }} style={{ background: 'transparent', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: 10, fontFamily: 'var(--font-mono)' }}>Faction</button>
                        </div>
                      </div>
                      {attackerDetachments.length > 0 && (
                        <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)', letterSpacing: 1, flexShrink: 0 }}>DET.</span>
                          <select
                            value={attacker.detachment?.id ?? ''}
                            onChange={(e) => {
                              const det = attackerDetachments.find((d) => d.id === e.target.value) ?? null
                              setAttacker((prev) => ({ ...prev, detachment: det, enhancement: null }))
                              setActiveAttackerStrats(new Set())
                            }}
                            style={{
                              flex: 1, padding: '4px 8px', fontSize: 11, fontFamily: 'var(--font-mono)',
                              background: 'var(--color-surface)', border: '1px solid var(--color-border)',
                              color: 'var(--color-text)', outline: 'none', cursor: 'pointer', colorScheme: 'dark',
                            }}
                          >
                            {attackerDetachments.map((det) => (
                              <option key={det.id} value={det.id} style={{ background: 'var(--color-surface)', color: 'var(--color-text)' }}>{det.name}</option>
                            ))}
                          </select>
                        </div>
                      )}
                      {attackerProfile && (
                        <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
                          {(['M', 'T', 'Sv', 'W', 'Ld', 'OC'] as const).map((stat) => {
                            const val = attackerProfile[stat]
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
                    </>
                  )}
                </div>
              )}

              {/* Attacker weapon */}
              {attacker.datasheet && (
                <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', padding: '6px 10px' }}>
                  <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)', letterSpacing: 1, marginBottom: 6 }}>ARME</div>
                  <button
                    onClick={() => setShowAtkWeaponPicker(true)}
                    style={{
                      width: '100%', textAlign: 'left', padding: '8px 10px', background: 'rgba(255,255,255,0.05)',
                      border: `1px solid ${attacker.weapon ? 'var(--color-accent)' : 'var(--color-border)'}`,
                      color: 'var(--color-text)', cursor: 'pointer', fontSize: 12,
                    }}
                  >
                    <div style={{ fontWeight: 600 }}>{attacker.weapon ? <T text={attacker.weapon.name} category="weapon" /> : 'Choisir une arme'}</div>
                    {attacker.weapon && (
                      <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginTop: 2, fontFamily: 'var(--font-mono)' }}>
                        {attacker.weapon.range !== 'Melee' && `${attacker.weapon.range} `}A:{attacker.weapon.A} {attacker.weapon.type === 'Melee' || attacker.weapon.range === 'Melee' ? 'CC' : 'CT'}:{attacker.weapon.BS_WS} S:{attacker.weapon.S} AP:{attacker.weapon.AP} D:{attacker.weapon.D}
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
              )}

              {/* Attacker enhancement */}
              {attackerEnhancements.length > 0 && (
                <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', padding: '6px 10px' }}>
                  <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)', letterSpacing: 1, marginBottom: 6 }}>AMÉLIORATION</div>
                  <button
                    onClick={() => setShowAtkEnhancementPicker(true)}
                    style={{
                      width: '100%', textAlign: 'left', padding: '8px 10px', background: 'rgba(255,255,255,0.05)',
                      border: `1px solid ${attacker.enhancement ? 'var(--color-accent)' : 'var(--color-border)'}`,
                      color: 'var(--color-text)', cursor: 'pointer', fontSize: 12,
                    }}
                  >
                    {attacker.enhancement ? (
                      <div>
                        <span style={{ fontWeight: 600 }}><T text={attacker.enhancement.name} category="enhancement" /></span>
                        <span style={{ color: 'var(--color-accent)', marginLeft: 6, fontFamily: 'var(--font-mono)', fontSize: 10 }}>{attacker.enhancement.cost} pts</span>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--color-text-muted)' }}>Aucune</span>
                    )}
                  </button>
                </div>
              )}

              {/* Attacker model count */}
              {attacker.datasheet && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--color-surface)', border: '1px solid var(--color-border)', padding: '8px 10px' }}>
                  <span style={{ fontSize: 10, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>MODÈLES</span>
                  <input
                    type="number" min={1} max={30} value={attacker.modelCount}
                    onChange={(e) => setAttacker((prev) => ({ ...prev, modelCount: Math.max(1, Number(e.target.value)) }))}
                    style={{ width: 50, padding: '4px 6px', fontSize: 12, textAlign: 'center', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--color-border)', color: 'var(--color-text)', outline: 'none' }}
                  />
                </div>
              )}
            </div>

            {/* ===== DEFENDER COLUMN ===== */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%' }}>
              <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--color-error, #ef4444)', letterSpacing: 1.5, textTransform: 'uppercase' }}>
                {'\u25b8'} Cible
              </div>

              {/* Defender header */}
              {!defender.factionSlug ? (
                <button
                  onClick={() => setShowDefFactionPicker(true)}
                  style={{
                    width: '100%', minHeight: embedded ? 60 : 100, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6,
                    background: 'var(--color-surface)', border: '2px dashed var(--color-border)', color: 'var(--color-text-muted)', cursor: 'pointer',
                  }}
                >
                  <span style={{ fontSize: embedded ? 16 : 20 }}>{'\uD83D\uDEE1'}</span>
                  <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', letterSpacing: 1 }}>CHOISIR UNE FACTION</span>
                </button>
              ) : (
                <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', padding: '8px 10px' }}>
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
                      {defenderDetachments.length > 0 && (
                        <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)', letterSpacing: 1, flexShrink: 0 }}>DET.</span>
                          <select
                            value={defender.detachment?.id ?? ''}
                            onChange={(e) => {
                              const det = defenderDetachments.find((d) => d.id === e.target.value) ?? null
                              setDefender((prev) => ({ ...prev, detachment: det, enhancement: null }))
                              setActiveDefenderStrats(new Set())
                            }}
                            style={{
                              flex: 1, padding: '4px 8px', fontSize: 11, fontFamily: 'var(--font-mono)',
                              background: 'var(--color-surface)', border: '1px solid var(--color-border)',
                              color: 'var(--color-text)', outline: 'none', cursor: 'pointer', colorScheme: 'dark',
                            }}
                          >
                            {defenderDetachments.map((det) => (
                              <option key={det.id} value={det.id} style={{ background: 'var(--color-surface)', color: 'var(--color-text)' }}>{det.name}</option>
                            ))}
                          </select>
                        </div>
                      )}
                      <button
                        onClick={() => setShowDefUnitSearch(true)}
                        style={{
                          width: '100%', marginTop: 6, padding: '10px 10px', background: 'transparent',
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
                      {defenderDetachments.length > 0 && (
                        <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)', letterSpacing: 1, flexShrink: 0 }}>DET.</span>
                          <select
                            value={defender.detachment?.id ?? ''}
                            onChange={(e) => {
                              const det = defenderDetachments.find((d) => d.id === e.target.value) ?? null
                              setDefender((prev) => ({ ...prev, detachment: det, enhancement: null }))
                              setActiveDefenderStrats(new Set())
                            }}
                            style={{
                              flex: 1, padding: '4px 8px', fontSize: 11, fontFamily: 'var(--font-mono)',
                              background: 'var(--color-surface)', border: '1px solid var(--color-border)',
                              color: 'var(--color-text)', outline: 'none', cursor: 'pointer', colorScheme: 'dark',
                            }}
                          >
                            {defenderDetachments.map((det) => (
                              <option key={det.id} value={det.id} style={{ background: 'var(--color-surface)', color: 'var(--color-text)' }}>{det.name}</option>
                            ))}
                          </select>
                        </div>
                      )}
                      {defenderProfile && (
                        <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
                          {(['M', 'T', 'Sv', 'W', 'Ld', 'OC'] as const).map((stat) => {
                            const val = defenderProfile[stat]
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

              {/* Defender weapon */}
              {defender.datasheet && (
                <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', padding: '6px 10px' }}>
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
              )}

              {/* Defender enhancement */}
              {defender.datasheet && defenderEnhancements.length > 0 && (
                <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', padding: '6px 10px' }}>
                  <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)', letterSpacing: 1, marginBottom: 6 }}>AMÉLIORATION</div>
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
              )}

              {/* Defender model count */}
              {defender.datasheet && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--color-surface)', border: '1px solid var(--color-border)', padding: '8px 10px' }}>
                  <span style={{ fontSize: 10, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>MODÈLES</span>
                  <input
                    type="number" min={1} max={30} value={defender.modelCount}
                    onChange={(e) => setDefender((prev) => ({ ...prev, modelCount: Math.max(1, Number(e.target.value)) }))}
                    style={{ width: 50, padding: '4px 6px', fontSize: 12, textAlign: 'center', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--color-border)', color: 'var(--color-text)', outline: 'none' }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Toggles */}
          {attacker.weapon && defender.datasheet && (
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
            </div>
          )}

          {/* Stratagems */}
          {(filteredAttackerStrats.length > 0 || filteredDefenderStrats.length > 0) && attacker.weapon && defender.datasheet && (
            <div>
              <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)', letterSpacing: 1, marginBottom: 6 }}>STRATAGÈMES</div>
              <div className="flex flex-col gap-1.5 lg:grid lg:grid-cols-2 lg:gap-1.5">
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

          {/* Results — Pipeline horizontal */}
          {result && (() => {
            const hitPct = result.attacksTotal > 0 ? Math.round((result.hitsExpected / result.attacksTotal) * 100) : 0
            const woundPct = result.hitsExpected > 0 ? Math.round((result.woundsExpected / result.hitsExpected) * 100) : 0
            const savePct = result.woundsExpected > 0 ? Math.round((result.unsavedWounds / result.woundsExpected) * 100) : 0
            const killPct = defender.modelCount > 0 ? Math.round((result.estimatedKills / defender.modelCount) * 100) : 0
            const finalDmg = result.steps.fnpThreshold ? result.damageAfterFnp : result.damageTotal

            const stepStyle: React.CSSProperties = {
              flex: 1, padding: embedded ? '8px 6px' : '12px 10px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minWidth: 0,
            }
            const labelStyle: React.CSSProperties = {
              fontSize: embedded ? 7 : 8, fontFamily: 'var(--font-mono)', letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: embedded ? 3 : 6,
            }
            const valueStyle = (color: string): React.CSSProperties => ({
              fontSize: embedded ? 20 : 28, fontWeight: 700, color, lineHeight: 1, marginBottom: embedded ? 2 : 4,
            })
            const detailStyle: React.CSSProperties = {
              fontSize: embedded ? 8 : 9, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)', marginBottom: embedded ? 3 : 6,
            }
            const barBg: React.CSSProperties = {
              height: embedded ? 2 : 3, background: 'rgba(255,255,255,0.08)', overflow: 'hidden', marginTop: 'auto',
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

                {/* Mobile: vertical stack */}
                <div className="lg:hidden" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', padding: '8px 10px' }}>
                  <PipelineStep label="Attaques" value={round(result.attacksTotal)} detail={`${attacker.modelCount} moy.`} color="var(--color-text)" pct={100} explanation={explanations?.attacks.lines} />
                  <PipelineStep label="Touches" value={round(result.hitsExpected)} detail={`${result.steps.hitThreshold > 0 ? `${result.steps.hitThreshold}+` : 'auto'} · ${hitPct}%`} color="#22d3ee" pct={hitPct} explanation={explanations?.hits.lines} />
                  <PipelineStep label="Blessures" value={round(result.woundsExpected)} detail={`${result.steps.woundThreshold}+ · ${woundPct}%`} color="#fbbf24" pct={woundPct} explanation={explanations?.wounds.lines} />
                  <PipelineStep label="Non sauvées" value={round(result.unsavedWounds)} detail={`${result.steps.usedInvuln ? 'inv' : 'sv'}${result.steps.saveThreshold}+ · ${savePct}%`} color="#f472b6" pct={savePct} explanation={explanations?.saves.lines} />
                  <PipelineStep label="Dégâts" value={round(finalDmg)} detail={`× ${result.steps.avgDamagePerWound} dmg${result.steps.fnpThreshold ? ` · FnP ${result.steps.fnpThreshold}+` : ''}`} color="#f472b6" pct={100} explanation={explanations?.damage.lines} />
                  <div style={{ marginTop: 12, padding: '12px 0', borderTop: '1px solid var(--color-border)', textAlign: 'center' }}>
                    <div style={{ fontSize: 8, fontFamily: 'var(--font-mono)', letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--color-error, #ef4444)', marginBottom: 4 }}>≈ Modèles éliminés</div>
                    <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--color-error, #ef4444)', lineHeight: 1 }}>
                      {round(result.estimatedKills)}<span style={{ fontSize: 14, fontWeight: 400, color: 'var(--color-text-muted)' }}>/{defender.modelCount}</span>
                    </div>
                    <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)', marginTop: 4 }}>{killPct}% de l'unité</div>
                  </div>
                  {result.mortalWounds > 0 && (
                    <div style={{ fontSize: 10, color: 'var(--color-warning, #f59e0b)', marginTop: 6, fontFamily: 'var(--font-mono)' }}>
                      dont {round(result.mortalWoundCount)} MW = {round(result.mortalWounds)} degats
                    </div>
                  )}
                </div>

                {/* Desktop: horizontal pipeline */}
                <div className="hidden lg:block">
                  <div style={{ display: 'flex', background: 'var(--color-surface)', border: '1px solid var(--color-border)', alignItems: 'stretch' }}>
                    <StepExplainer lines={explanations?.attacks.lines ?? []} color="var(--color-text-muted)">
                      <div style={stepStyle}>
                        <div style={labelStyle}>Attaques</div>
                        <div style={valueStyle('var(--color-text)')}>{round(result.attacksTotal)}</div>
                        <div style={detailStyle}>{attacker.modelCount} moy.</div>
                        <div style={barBg}>
                          <div style={{ height: '100%', width: '100%', background: 'var(--color-text-muted)' }} />
                        </div>
                      </div>
                    </StepExplainer>

                    <div style={separatorStyle} />
                    <div style={arrowStyle}>{'\u25b8'}</div>

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

                    <div style={{ display: 'flex', alignItems: 'center', padding: '0 8px', fontSize: 18, color: 'var(--color-text-muted)', fontWeight: 300 }}>=</div>

                    <div style={{
                      padding: embedded ? '8px 10px' : '12px 14px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
                      borderLeft: '1px solid var(--color-border)', minWidth: embedded ? 100 : 130,
                    }}>
                      <div style={{ fontSize: embedded ? 7 : 8, fontFamily: 'var(--font-mono)', letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--color-error, #ef4444)', marginBottom: embedded ? 3 : 6 }}>
                        ≈ Modèles éliminés
                      </div>
                      <div style={{ fontSize: embedded ? 24 : 32, fontWeight: 700, color: 'var(--color-error, #ef4444)', lineHeight: 1 }}>
                        {round(result.estimatedKills)}
                        <span style={{ fontSize: embedded ? 11 : 14, fontWeight: 400, color: 'var(--color-text-muted)' }}>/{defender.modelCount}</span>
                      </div>
                      <div style={{ fontSize: embedded ? 8 : 9, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)', marginTop: 4 }}>
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

                {damageDelta !== null && damageDelta !== 0 && (
                  <p className="text-xs mt-2 font-medium" style={{ color: damageDelta > 0 ? 'var(--color-success, #22c55e)' : 'var(--color-error, #ef4444)', fontFamily: 'var(--font-mono)' }}>
                    {damageDelta > 0 ? '+' : ''}{round(damageDelta)} dégâts avec stratagèmes
                  </p>
                )}
              </div>
            )
          })()}

          {/* Hints */}
          {attacker.datasheet && !attacker.weapon && (
            <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--color-text-muted)', padding: embedded ? 6 : 12 }}>
              Sélectionne une arme pour lancer la simulation
            </div>
          )}
          {attacker.weapon && !defender.datasheet && (
            <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--color-text-muted)', padding: embedded ? 6 : 12 }}>
              Sélectionne une cible pour voir les résultats
            </div>
          )}
          {!attacker.factionSlug && !defender.factionSlug && (
            <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--color-text-muted)', padding: embedded ? 8 : 20 }}>
              Choisis un attaquant et une cible pour simuler un combat
            </div>
          )}
        </div>
      </div>

      {/* Attacker modals */}
      {showAtkFactionPicker && (
        <FactionPickerModal
          factions={factions}
          detachments={atkPickerDetachments}
          onFactionChosen={(slug) => {
            setPendingAtkFactionSlug(slug)
            loadFaction(slug)
          }}
          onSelect={(slug, det) => {
            setAttacker({ ...emptySide, factionSlug: slug, detachment: det })
            setActiveAttackerStrats(new Set())
            setPendingAtkFactionSlug(null)
            setShowAtkFactionPicker(false)
          }}
          onClose={() => { setShowAtkFactionPicker(false); setPendingAtkFactionSlug(null) }}
        />
      )}
      {showAtkUnitSearch && attackerFaction && (
        <UnitSearchModal
          datasheets={attackerFaction.datasheets}
          onSelect={(ds) => {
            setAttacker((prev) => ({
              ...prev,
              datasheet: ds,
              weapon: ds.weapons[0] ?? null,
              enhancement: null,
              modelCount: parseInt(String(ds.pointOptions[0]?.models), 10) || 5,
            }))
            setShowAtkUnitSearch(false)
          }}
          onClose={() => setShowAtkUnitSearch(false)}
        />
      )}
      {showAtkWeaponPicker && attacker.datasheet && (
        <WeaponPickerModal
          weapons={initialAttackerWeapons?.length
            ? attacker.datasheet.weapons.filter((w) => initialAttackerWeapons.includes(toWeaponKey(w)))
            : attacker.datasheet.weapons
          }
          selectedWeapon={attacker.weapon}
          onSelect={(w) => setAttacker((prev) => ({ ...prev, weapon: w }))}
          onClose={() => setShowAtkWeaponPicker(false)}
        />
      )}
      {showAtkEnhancementPicker && (
        <EnhancementPickerModal
          enhancements={attackerEnhancements}
          selectedEnhancement={attacker.enhancement}
          onSelect={(e) => { setAttacker((prev) => ({ ...prev, enhancement: e })); setShowAtkEnhancementPicker(false) }}
          onClose={() => setShowAtkEnhancementPicker(false)}
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
    </>
  )
}

function PipelineStep({ label, value, detail, color, pct, explanation }: { label: string; value: string; detail: string; color: string; pct: number; explanation?: string[] }) {
  const content = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
      <div style={{ width: 60, fontSize: 8, fontFamily: 'var(--font-mono)', letterSpacing: 1, textTransform: 'uppercase', color: 'var(--color-text-muted)', flexShrink: 0 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color, lineHeight: 1, width: 50, flexShrink: 0 }}>{value}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)', marginBottom: 3 }}>{detail}</div>
        <div style={{ height: 3, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: color, transition: 'width 0.3s' }} />
        </div>
      </div>
    </div>
  )
  if (!explanation || explanation.length === 0) return content
  return <StepExplainer lines={explanation} color={color}>{content}</StepExplainer>
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

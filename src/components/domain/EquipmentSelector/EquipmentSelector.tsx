import { useRef, useState, useEffect } from 'react'
import type { Datasheet, Weapon } from '@/types/gameData.types'
import { useCustomImage } from '@/hooks/useCustomImage'
import { HudBtn, MSection } from '@/components/ui/Hud'
import { T } from '@/components/ui/TranslatableText'
import { THtml } from '@/components/ui/TranslatableText'

interface EquipmentSelectorProps {
  datasheet: Datasheet
  initialPointOptionIndex?: number
  initialWeapons?: string[]
  initialNotes?: string
  onConfirm: (pointOptionIndex: number, weapons: string[], notes: string) => void
  onCancel: () => void
  confirmLabel?: string
  ownedCount?: number
}

function isMelee(w: Weapon): boolean {
  return w.type === 'Melee' || w.range === 'Melee'
}

function weaponKey(w: Weapon): string {
  return `${isMelee(w) ? 'melee' : 'ranged'}:${w.name}`
}

function useIsDesktop(breakpoint = 1024) {
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth >= breakpoint : false,
  )
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mql = window.matchMedia(`(min-width: ${breakpoint}px)`)
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [breakpoint])
  return isDesktop
}


export function EquipmentSelector({
  datasheet,
  initialPointOptionIndex = 0,
  initialWeapons,
  initialNotes = '',
  onConfirm,
  onCancel,
  confirmLabel = 'Confirmer',
  ownedCount,
}: EquipmentSelectorProps) {
  const isDesktop = useIsDesktop()
  const [pointOptionIndex, setPointOptionIndex] = useState(initialPointOptionIndex)
  const [selectedWeapons, setSelectedWeapons] = useState<string[]>(() => {
    if (initialWeapons && initialWeapons.length > 0) return initialWeapons
    return datasheet.weapons.map((w) => weaponKey(w))
  })
  const [notes, setNotes] = useState(initialNotes)
  const [showInfo, setShowInfo] = useState(false)
  const { customImageUrl, save: saveImage } = useCustomImage(datasheet.id)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageUrl = customImageUrl || datasheet.imageUrl

  const meleeWeapons = datasheet.weapons.filter((w) => isMelee(w))
  const rangedWeapons = datasheet.weapons.filter((w) => !isMelee(w))

  const toggleWeapon = (key: string) => {
    setSelectedWeapons((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    )
  }

  const cost = datasheet.pointOptions[pointOptionIndex]?.cost ?? datasheet.pointOptions[0]?.cost ?? 0

  // Hidden file input for photo
  const fileInput = (
    <input
      ref={fileInputRef}
      type="file"
      accept="image/*"
      className="hidden"
      onChange={(e) => {
        const file = e.target.files?.[0]
        if (file) saveImage(file)
        e.target.value = ''
      }}
    />
  )

  // ============================================================
  // DESKTOP — centered codex-style modal
  // ============================================================
  if (isDesktop) {
    const thStyle: React.CSSProperties = {
      textAlign: 'center',
      padding: '6px 8px',
      fontSize: 11,
      fontFamily: 'var(--font-mono)',
      letterSpacing: 0.5,
      color: 'var(--color-text-muted)',
      borderBottom: '1px solid var(--color-border)',
    }
    const tdStyle: React.CSSProperties = {
      textAlign: 'center',
      padding: '7px 8px',
      fontSize: 12,
      color: 'var(--color-text)',
      borderBottom: '1px solid var(--color-border)',
    }
    const tdNameStyle: React.CSSProperties = {
      ...tdStyle,
      textAlign: 'left',
      fontWeight: 600,
      fontSize: 12,
    }
    const checkTdStyle: React.CSSProperties = {
      ...tdStyle,
      width: 32,
      textAlign: 'center',
    }

    return (
      <div
        data-scroll-lock
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 65,
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        onClick={onCancel}
      >
        <div
          style={{
            background: 'var(--color-bg)',
            border: '1px solid var(--color-border)',
            width: '90%',
            maxWidth: 820,
            maxHeight: '88vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {fileInput}

          {/* === HEADER: image + info === */}
          <div style={{
            display: 'flex',
            gap: 20,
            padding: '20px 24px 16px',
            borderBottom: '1px solid var(--color-border)',
            flexShrink: 0,
          }}>
            {/* Unit image */}
            <div
              style={{
                width: 140,
                height: 180,
                flexShrink: 0,
                background: 'var(--color-surface)',
                overflow: 'hidden',
                position: 'relative',
                cursor: 'pointer',
              }}
              onClick={() => fileInputRef.current?.click()}
              title="Changer la photo"
            >
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={datasheet.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }}
                />
              ) : (
                <div style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-text-muted)',
                  fontSize: 11,
                  fontFamily: 'var(--font-mono)',
                }}>
                  PHOTO
                </div>
              )}
              {/* Corner brackets */}
              <div style={{ position: 'absolute', top: 4, right: 4, width: 8, height: 8, borderTop: '1px solid var(--color-accent)', borderRight: '1px solid var(--color-accent)' }} />
              <div style={{ position: 'absolute', bottom: 4, left: 4, width: 8, height: 8, borderBottom: '1px solid var(--color-accent)', borderLeft: '1px solid var(--color-accent)' }} />
            </div>

            {/* Unit info */}
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                {/* Breadcrumb */}
                <div style={{
                  fontSize: 9,
                  fontFamily: 'var(--font-mono)',
                  letterSpacing: 2,
                  color: 'var(--color-accent)',
                  textTransform: 'uppercase',
                  marginBottom: 4,
                }}>
                  &#9656; {datasheet.role || 'UNITE'}
                </div>

                {/* Name */}
                <h2 style={{ fontSize: 22, fontWeight: 600, color: 'var(--color-text)', margin: 0, lineHeight: 1.2 }}>
                  <T text={datasheet.name} category="unit" />
                </h2>

                {/* Points */}
                <div style={{ fontSize: 18, fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--color-accent)', marginTop: 6 }}>
                  {cost} <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>pts</span>
                </div>

                {/* Collection info */}
                {ownedCount !== undefined && (
                  <div style={{
                    fontSize: 10,
                    fontFamily: 'var(--font-mono)',
                    letterSpacing: 0.5,
                    marginTop: 8,
                    color: ownedCount > 0 ? 'var(--color-success)' : 'var(--color-text-muted)',
                  }}>
                    {ownedCount > 0 ? `COLLECTION : ${ownedCount} possede(s)` : 'NON POSSEDE'}
                  </div>
                )}
              </div>

              {/* Profile stats table */}
              {datasheet.profiles.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th style={{ ...thStyle, textAlign: 'left' }}>Profil</th>
                        <th style={thStyle}>M</th>
                        <th style={thStyle}>T</th>
                        <th style={thStyle}>SV</th>
                        <th style={thStyle}>W</th>
                        <th style={thStyle}>LD</th>
                        <th style={thStyle}>OC</th>
                      </tr>
                    </thead>
                    <tbody>
                      {datasheet.profiles.map((p, i) => (
                        <tr key={i}>
                          <td style={{ ...tdStyle, textAlign: 'left', fontWeight: 600, fontSize: 11 }}>
                            <T text={p.name} category="unit" />
                          </td>
                          <td style={tdStyle}>{p.M}</td>
                          <td style={tdStyle}>{p.T}</td>
                          <td style={tdStyle}>{p.Sv}</td>
                          <td style={tdStyle}>{p.W}</td>
                          <td style={tdStyle}>{p.Ld}</td>
                          <td style={tdStyle}>{p.OC}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* === SCROLLABLE BODY === */}
          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '16px 24px 20px' }}>
            {/* Point options / Composition */}
            {datasheet.pointOptions.length > 1 && (
              <div style={{ marginBottom: 20 }}>
                <MSection>Composition</MSection>
                <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                  {datasheet.pointOptions.map((opt, i) => (
                    <button
                      key={i}
                      style={{
                        padding: '8px 16px',
                        fontSize: 12,
                        fontFamily: 'var(--font-mono)',
                        border: pointOptionIndex === i
                          ? '1px solid var(--color-accent)'
                          : '1px solid var(--color-border)',
                        background: pointOptionIndex === i
                          ? 'var(--color-surface)'
                          : 'transparent',
                        color: pointOptionIndex === i
                          ? 'var(--color-accent)'
                          : 'var(--color-text-muted)',
                        cursor: 'pointer',
                        transition: 'border-color 0.15s',
                      }}
                      onClick={() => setPointOptionIndex(i)}
                    >
                      {opt.models} — <strong>{opt.cost} pts</strong>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Ranged weapons table */}
            {rangedWeapons.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <MSection>Armes de tir</MSection>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 8 }}>
                  <thead>
                    <tr>
                      <th style={{ ...thStyle, width: 32, textAlign: 'center' }}></th>
                      <th style={{ ...thStyle, textAlign: 'left' }}>Arme</th>
                      <th style={thStyle}>Portee</th>
                      <th style={thStyle}>A</th>
                      <th style={thStyle}>CT</th>
                      <th style={thStyle}>F</th>
                      <th style={thStyle}>PA</th>
                      <th style={thStyle}>D</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rangedWeapons.map((w) => {
                      const key = weaponKey(w)
                      const selected = selectedWeapons.includes(key)
                      return (
                        <tr
                          key={key}
                          style={{
                            cursor: 'pointer',
                            opacity: selected ? 1 : 0.4,
                            transition: 'opacity 0.15s',
                          }}
                          onClick={() => toggleWeapon(key)}
                        >
                          <td style={checkTdStyle}>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: 16,
                              height: 16,
                              border: selected
                                ? '1px solid var(--color-accent)'
                                : '1px solid var(--color-border)',
                              background: selected ? 'var(--color-accent)' : 'transparent',
                              fontSize: 10,
                              color: selected ? '#000' : 'transparent',
                            }}>
                              {selected ? '\u2713' : ''}
                            </span>
                          </td>
                          <td style={tdNameStyle}>
                            <T text={w.name} category="weapon" />
                            {w.abilities && (
                              <span style={{
                                display: 'block',
                                fontSize: 9,
                                color: 'var(--color-text-muted)',
                                fontWeight: 400,
                                fontFamily: 'var(--font-mono)',
                                marginTop: 1,
                              }}>
                                {w.abilities}
                              </span>
                            )}
                          </td>
                          <td style={tdStyle}>{w.range}</td>
                          <td style={tdStyle}>{w.A}</td>
                          <td style={tdStyle}>{w.BS_WS}</td>
                          <td style={tdStyle}>{w.S}</td>
                          <td style={tdStyle}>{w.AP}</td>
                          <td style={tdStyle}>{w.D}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Melee weapons table */}
            {meleeWeapons.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <MSection>Armes de melee</MSection>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 8 }}>
                  <thead>
                    <tr>
                      <th style={{ ...thStyle, width: 32, textAlign: 'center' }}></th>
                      <th style={{ ...thStyle, textAlign: 'left' }}>Arme</th>
                      <th style={thStyle}>A</th>
                      <th style={thStyle}>CC</th>
                      <th style={thStyle}>F</th>
                      <th style={thStyle}>PA</th>
                      <th style={thStyle}>D</th>
                    </tr>
                  </thead>
                  <tbody>
                    {meleeWeapons.map((w) => {
                      const key = weaponKey(w)
                      const selected = selectedWeapons.includes(key)
                      return (
                        <tr
                          key={key}
                          style={{
                            cursor: 'pointer',
                            opacity: selected ? 1 : 0.4,
                            transition: 'opacity 0.15s',
                          }}
                          onClick={() => toggleWeapon(key)}
                        >
                          <td style={checkTdStyle}>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: 16,
                              height: 16,
                              border: selected
                                ? '1px solid var(--color-accent)'
                                : '1px solid var(--color-border)',
                              background: selected ? 'var(--color-accent)' : 'transparent',
                              fontSize: 10,
                              color: selected ? '#000' : 'transparent',
                            }}>
                              {selected ? '\u2713' : ''}
                            </span>
                          </td>
                          <td style={tdNameStyle}>
                            <T text={w.name} category="weapon" />
                            {w.abilities && (
                              <span style={{
                                display: 'block',
                                fontSize: 9,
                                color: 'var(--color-text-muted)',
                                fontWeight: 400,
                                fontFamily: 'var(--font-mono)',
                                marginTop: 1,
                              }}>
                                {w.abilities}
                              </span>
                            )}
                          </td>
                          <td style={tdStyle}>{w.A}</td>
                          <td style={tdStyle}>{w.BS_WS}</td>
                          <td style={tdStyle}>{w.S}</td>
                          <td style={tdStyle}>{w.AP}</td>
                          <td style={tdStyle}>{w.D}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Notes */}
            <div style={{ marginBottom: 20 }}>
              <MSection>Notes</MSection>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Ex: Kitbash, proxy, variante..."
                style={{
                  width: '100%',
                  marginTop: 8,
                  padding: '10px 12px',
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text)',
                  fontSize: 12,
                  fontFamily: 'var(--font-mono)',
                  resize: 'vertical',
                  outline: 'none',
                }}
              />
            </div>

            {/* +INFO expandable section */}
            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 12 }}>
              <button
                onClick={() => setShowInfo(!showInfo)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: 0,
                  width: '100%',
                }}
              >
                <span style={{
                  fontSize: 10,
                  fontFamily: 'var(--font-mono)',
                  letterSpacing: 1.5,
                  color: 'var(--color-accent)',
                  fontWeight: 600,
                }}>
                  {showInfo ? '- INFO' : '+ INFO'}
                </span>
                <span style={{
                  flex: 1,
                  height: 1,
                  background: 'var(--color-border)',
                }} />
              </button>

              {showInfo && (
                <div style={{ marginTop: 16 }}>
                  {/* Abilities */}
                  {datasheet.abilities.length > 0 && (
                    <div style={{ marginBottom: 16 }}>
                      <MSection>Capacites</MSection>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
                        {datasheet.abilities.map((a, i) => (
                          <div key={`${a.id}-${i}`}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-accent)' }}>
                              <T text={a.name} category="ability" />
                            </div>
                            <THtml
                              html={a.description}
                              category="ability"
                              style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2, lineHeight: 1.5 }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Keywords */}
                  {datasheet.keywords.length > 0 && (
                    <div style={{ marginBottom: 16 }}>
                      <MSection>Mots-cles</MSection>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                        {datasheet.keywords.map((k, i) => (
                          <span
                            key={i}
                            style={{
                              fontSize: 10,
                              fontFamily: 'var(--font-mono)',
                              letterSpacing: 0.5,
                              padding: '3px 8px',
                              background: k.isFactionKeyword ? 'var(--color-accent)' : 'var(--color-surface)',
                              color: k.isFactionKeyword ? '#000' : 'var(--color-text)',
                              border: k.isFactionKeyword ? 'none' : '1px solid var(--color-border)',
                            }}
                          >
                            <T text={k.keyword} category="keyword" />
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Unit Composition */}
                  {datasheet.unitComposition && (
                    <div style={{ marginBottom: 16 }}>
                      <MSection>Composition</MSection>
                      <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 8, lineHeight: 1.5 }}>
                        <T text={datasheet.unitComposition} category="other" />
                      </p>
                    </div>
                  )}

                  {/* Loadout */}
                  {datasheet.loadout && (
                    <div style={{ marginBottom: 16 }}>
                      <MSection>Equipement</MSection>
                      <THtml
                        html={datasheet.loadout}
                        category="other"
                        style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 8, lineHeight: 1.5 }}
                      />
                    </div>
                  )}

                  {/* Leader */}
                  {datasheet.leader && (
                    <div style={{ marginBottom: 16 }}>
                      <MSection>Leader</MSection>
                      <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 8, lineHeight: 1.5 }}>
                        <T text={datasheet.leader} category="other" />
                      </p>
                    </div>
                  )}

                  {/* Transport */}
                  {datasheet.transport && (
                    <div style={{ marginBottom: 16 }}>
                      <MSection>Transport</MSection>
                      <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 8, lineHeight: 1.5 }}>
                        <T text={datasheet.transport} category="other" />
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* === FOOTER === */}
          <div style={{
            padding: '12px 24px',
            borderTop: '1px solid var(--color-border)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 10,
            flexShrink: 0,
          }}>
            <HudBtn variant="ghost" onClick={onCancel}>Annuler</HudBtn>
            <HudBtn variant="primary" onClick={() => onConfirm(pointOptionIndex, selectedWeapons, notes)}>
              {confirmLabel}
            </HudBtn>
          </div>
        </div>
      </div>
    )
  }

  // ============================================================
  // MOBILE — HUD-style bottom sheet
  // ============================================================
  const mThStyle: React.CSSProperties = {
    textAlign: 'center',
    padding: '5px 4px',
    fontSize: 9,
    fontFamily: 'var(--font-mono)',
    letterSpacing: 0.5,
    color: 'var(--color-text-muted)',
    borderBottom: '1px solid var(--color-border)',
  }
  const mTdStyle: React.CSSProperties = {
    textAlign: 'center',
    padding: '6px 4px',
    fontSize: 11,
    color: 'var(--color-text)',
    borderBottom: '1px solid var(--color-border)',
  }
  const mTdNameStyle: React.CSSProperties = {
    ...mTdStyle,
    textAlign: 'left',
    fontWeight: 600,
    fontSize: 11,
  }
  const mCheckTdStyle: React.CSSProperties = {
    ...mTdStyle,
    width: 28,
    textAlign: 'center',
  }

  return (
    <div
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        top: 0,
        bottom: 'calc(60px + env(safe-area-inset-bottom, 0px))',
        backgroundColor: 'rgba(0,0,0,0.5)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 60,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
      }}
      onClick={onCancel}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 480,
          maxHeight: '90%',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--color-bg)',
          borderTop: '1px solid var(--color-border)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {fileInput}

        {/* === HEADER: image + info === */}
        <div style={{
          display: 'flex',
          gap: 12,
          padding: '14px 16px 12px',
          borderBottom: '1px solid var(--color-border)',
          flexShrink: 0,
        }}>
          {/* Unit image */}
          <div
            style={{
              width: 72,
              height: 90,
              flexShrink: 0,
              background: 'var(--color-surface)',
              overflow: 'hidden',
              position: 'relative',
              cursor: 'pointer',
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={datasheet.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }}
              />
            ) : (
              <div style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-text-muted)',
                fontSize: 9,
                fontFamily: 'var(--font-mono)',
              }}>
                PHOTO
              </div>
            )}
            <div style={{ position: 'absolute', top: 3, right: 3, width: 6, height: 6, borderTop: '1px solid var(--color-accent)', borderRight: '1px solid var(--color-accent)' }} />
            <div style={{ position: 'absolute', bottom: 3, left: 3, width: 6, height: 6, borderBottom: '1px solid var(--color-accent)', borderLeft: '1px solid var(--color-accent)' }} />
          </div>

          {/* Unit info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 8,
              fontFamily: 'var(--font-mono)',
              letterSpacing: 2,
              color: 'var(--color-accent)',
              textTransform: 'uppercase',
              marginBottom: 2,
            }}>
              &#9656; {datasheet.role || 'UNITE'}
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-text)', margin: 0, lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              <T text={datasheet.name} category="unit" />
            </h3>
            <div style={{ fontSize: 16, fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--color-accent)', marginTop: 4 }}>
              {cost} <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>pts</span>
            </div>
            {ownedCount !== undefined && (
              <div style={{
                fontSize: 9,
                fontFamily: 'var(--font-mono)',
                letterSpacing: 0.5,
                marginTop: 4,
                color: ownedCount > 0 ? 'var(--color-success)' : 'var(--color-text-muted)',
              }}>
                {ownedCount > 0 ? `COLLECTION : ${ownedCount}` : 'NON POSSEDE'}
              </div>
            )}
            {/* Profile stats inline */}
            {datasheet.profiles.length > 0 && (
              <div style={{
                fontSize: 9,
                fontFamily: 'var(--font-mono)',
                color: 'var(--color-text-muted)',
                letterSpacing: 0.3,
                marginTop: 4,
              }}>
                {datasheet.profiles.map((p, i) => (
                  <span key={i}>
                    {i > 0 && ' | '}
                    M{p.M} T{p.T} SV{p.Sv} W{p.W} LD{p.Ld} OC{p.OC}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* === SCROLLABLE BODY === */}
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '12px 16px 16px' }}>
          {/* Point options / Composition */}
          {datasheet.pointOptions.length > 1 && (
            <div style={{ marginBottom: 16 }}>
              <MSection>Composition</MSection>
              <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                {datasheet.pointOptions.map((opt, i) => (
                  <button
                    key={i}
                    style={{
                      padding: '6px 12px',
                      fontSize: 11,
                      fontFamily: 'var(--font-mono)',
                      border: pointOptionIndex === i
                        ? '1px solid var(--color-accent)'
                        : '1px solid var(--color-border)',
                      background: pointOptionIndex === i
                        ? 'var(--color-surface)'
                        : 'transparent',
                      color: pointOptionIndex === i
                        ? 'var(--color-accent)'
                        : 'var(--color-text-muted)',
                      cursor: 'pointer',
                    }}
                    onClick={() => setPointOptionIndex(i)}
                  >
                    {opt.models} — <strong>{opt.cost} pts</strong>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Ranged weapons table */}
          {rangedWeapons.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <MSection>Armes de tir</MSection>
              <div style={{ overflowX: 'auto', marginTop: 6 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 360 }}>
                  <thead>
                    <tr>
                      <th style={{ ...mThStyle, width: 28, textAlign: 'center' }}></th>
                      <th style={{ ...mThStyle, textAlign: 'left' }}>Arme</th>
                      <th style={mThStyle}>Portee</th>
                      <th style={mThStyle}>A</th>
                      <th style={mThStyle}>CT</th>
                      <th style={mThStyle}>F</th>
                      <th style={mThStyle}>PA</th>
                      <th style={mThStyle}>D</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rangedWeapons.map((w) => {
                      const key = weaponKey(w)
                      const selected = selectedWeapons.includes(key)
                      return (
                        <tr
                          key={key}
                          style={{ cursor: 'pointer', opacity: selected ? 1 : 0.4, transition: 'opacity 0.15s' }}
                          onClick={() => toggleWeapon(key)}
                        >
                          <td style={mCheckTdStyle}>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: 14,
                              height: 14,
                              border: selected ? '1px solid var(--color-accent)' : '1px solid var(--color-border)',
                              background: selected ? 'var(--color-accent)' : 'transparent',
                              fontSize: 9,
                              color: selected ? '#000' : 'transparent',
                            }}>
                              {selected ? '\u2713' : ''}
                            </span>
                          </td>
                          <td style={mTdNameStyle}>
                            <T text={w.name} category="weapon" />
                            {w.abilities && (
                              <span style={{ display: 'block', fontSize: 8, color: 'var(--color-text-muted)', fontWeight: 400, fontFamily: 'var(--font-mono)', marginTop: 1 }}>
                                {w.abilities}
                              </span>
                            )}
                          </td>
                          <td style={mTdStyle}>{w.range}</td>
                          <td style={mTdStyle}>{w.A}</td>
                          <td style={mTdStyle}>{w.BS_WS}</td>
                          <td style={mTdStyle}>{w.S}</td>
                          <td style={mTdStyle}>{w.AP}</td>
                          <td style={mTdStyle}>{w.D}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Melee weapons table */}
          {meleeWeapons.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <MSection>Armes de melee</MSection>
              <div style={{ overflowX: 'auto', marginTop: 6 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 320 }}>
                  <thead>
                    <tr>
                      <th style={{ ...mThStyle, width: 28, textAlign: 'center' }}></th>
                      <th style={{ ...mThStyle, textAlign: 'left' }}>Arme</th>
                      <th style={mThStyle}>A</th>
                      <th style={mThStyle}>CC</th>
                      <th style={mThStyle}>F</th>
                      <th style={mThStyle}>PA</th>
                      <th style={mThStyle}>D</th>
                    </tr>
                  </thead>
                  <tbody>
                    {meleeWeapons.map((w) => {
                      const key = weaponKey(w)
                      const selected = selectedWeapons.includes(key)
                      return (
                        <tr
                          key={key}
                          style={{ cursor: 'pointer', opacity: selected ? 1 : 0.4, transition: 'opacity 0.15s' }}
                          onClick={() => toggleWeapon(key)}
                        >
                          <td style={mCheckTdStyle}>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: 14,
                              height: 14,
                              border: selected ? '1px solid var(--color-accent)' : '1px solid var(--color-border)',
                              background: selected ? 'var(--color-accent)' : 'transparent',
                              fontSize: 9,
                              color: selected ? '#000' : 'transparent',
                            }}>
                              {selected ? '\u2713' : ''}
                            </span>
                          </td>
                          <td style={mTdNameStyle}>
                            <T text={w.name} category="weapon" />
                            {w.abilities && (
                              <span style={{ display: 'block', fontSize: 8, color: 'var(--color-text-muted)', fontWeight: 400, fontFamily: 'var(--font-mono)', marginTop: 1 }}>
                                {w.abilities}
                              </span>
                            )}
                          </td>
                          <td style={mTdStyle}>{w.A}</td>
                          <td style={mTdStyle}>{w.BS_WS}</td>
                          <td style={mTdStyle}>{w.S}</td>
                          <td style={mTdStyle}>{w.AP}</td>
                          <td style={mTdStyle}>{w.D}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Notes */}
          <div style={{ marginBottom: 16 }}>
            <MSection>Notes</MSection>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Ex: Kitbash, proxy, variante..."
              style={{
                width: '100%',
                marginTop: 6,
                padding: '8px 10px',
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text)',
                fontSize: 11,
                fontFamily: 'var(--font-mono)',
                resize: 'vertical',
                outline: 'none',
              }}
            />
          </div>

          {/* +INFO expandable section */}
          <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 10 }}>
            <button
              onClick={() => setShowInfo(!showInfo)}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: 0,
                width: '100%',
              }}
            >
              <span style={{
                fontSize: 9,
                fontFamily: 'var(--font-mono)',
                letterSpacing: 1.5,
                color: 'var(--color-accent)',
                fontWeight: 600,
              }}>
                {showInfo ? '- INFO' : '+ INFO'}
              </span>
              <span style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
            </button>

            {showInfo && (
              <div style={{ marginTop: 12 }}>
                {datasheet.abilities.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <MSection>Capacites</MSection>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 6 }}>
                      {datasheet.abilities.map((a, i) => (
                        <div key={`${a.id}-${i}`}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-accent)' }}>
                            <T text={a.name} category="ability" />
                          </div>
                          <THtml
                            html={a.description}
                            category="ability"
                            style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2, lineHeight: 1.5 }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {datasheet.keywords.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <MSection>Mots-cles</MSection>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
                      {datasheet.keywords.map((k, i) => (
                        <span
                          key={i}
                          style={{
                            fontSize: 9,
                            fontFamily: 'var(--font-mono)',
                            letterSpacing: 0.5,
                            padding: '2px 6px',
                            background: k.isFactionKeyword ? 'var(--color-accent)' : 'var(--color-surface)',
                            color: k.isFactionKeyword ? '#000' : 'var(--color-text)',
                            border: k.isFactionKeyword ? 'none' : '1px solid var(--color-border)',
                          }}
                        >
                          <T text={k.keyword} category="keyword" />
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {datasheet.unitComposition && (
                  <div style={{ marginBottom: 12 }}>
                    <MSection>Composition</MSection>
                    <p style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 6, lineHeight: 1.5 }}>
                      <T text={datasheet.unitComposition} category="other" />
                    </p>
                  </div>
                )}

                {datasheet.loadout && (
                  <div style={{ marginBottom: 12 }}>
                    <MSection>Equipement</MSection>
                    <THtml
                      html={datasheet.loadout}
                      category="other"
                      style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 6, lineHeight: 1.5 }}
                    />
                  </div>
                )}

                {datasheet.leader && (
                  <div style={{ marginBottom: 12 }}>
                    <MSection>Leader</MSection>
                    <p style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 6, lineHeight: 1.5 }}>
                      <T text={datasheet.leader} category="other" />
                    </p>
                  </div>
                )}

                {datasheet.transport && (
                  <div style={{ marginBottom: 12 }}>
                    <MSection>Transport</MSection>
                    <p style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 6, lineHeight: 1.5 }}>
                      <T text={datasheet.transport} category="other" />
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* === FOOTER === */}
        <div style={{
          padding: '10px 16px',
          borderTop: '1px solid var(--color-border)',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 8,
          flexShrink: 0,
        }}>
          <HudBtn variant="ghost" onClick={onCancel}>Annuler</HudBtn>
          <HudBtn variant="primary" onClick={() => onConfirm(pointOptionIndex, selectedWeapons, notes)}>
            {confirmLabel}
          </HudBtn>
        </div>
      </div>
    </div>
  )
}

import { useState, useEffect, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { useListsStore } from '@/stores/listsStore'
import { useGameDataStore } from '@/stores/gameDataStore'
import { useGameData } from '@/hooks/useGameData'
import { useAuthStore } from '@/stores/authStore'
import { useFactionTheme } from '@/hooks/useFactionTheme'
import { ListsSidebar } from './ListsSidebar'
import { HudTopBar, HudBtn, MSection } from '@/components/ui/Hud'
import { StratagemCard } from './ListRightPanel'
import { FactionPicker } from '@/components/domain/FactionPicker'
import type { PointsLimit } from '@/types/armyList.types'
import type { Detachment } from '@/types/gameData.types'

const pointsOptions: PointsLimit[] = [1000, 2000, 3000]

export function ListsDesktopLayout({
  center,
  right,
}: {
  center: ReactNode
  right?: ReactNode
}) {
  const navigate = useNavigate()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const syncing = useListsStore((s) => s.syncing)
  const allLists = useListsStore((s) => s.getAllLists)()
  const createList = useListsStore((s) => s.createList)
  const loadedFactions = useGameDataStore((s) => s.loadedFactions)
  const loadFaction = useGameDataStore((s) => s.loadFaction)
  const { factionIndex } = useGameData()

  const syncedCount = allLists.filter((l) => l.remoteId).length

  // Keep default blue theme on desktop lists — no faction color switching
  useFactionTheme(null)

  // Load factions for all lists
  useEffect(() => {
    const ids = new Set(allLists.map((l) => l.factionId))
    ids.forEach((id) => loadFaction(id))
  }, [allLists.length, loadFaction])

  // Create list form state
  const [showForm, setShowForm] = useState(false)

  const handleListSelect = (listId: string) => {
    setShowForm(false)
    navigate(`/lists/${listId}`)
  }
  const [name, setName] = useState('')
  const [selectedFaction, setSelectedFaction] = useState<string | null>(null)
  const [selectedDetachment, setSelectedDetachment] = useState<Detachment | null>(null)
  const [detachment, setDetachment] = useState('')
  const [pointsLimit, setPointsLimit] = useState<PointsLimit>(2000)
  const [showDetachmentDropdown, setShowDetachmentDropdown] = useState(false)

  const factionDetachments = selectedFaction
    ? loadedFactions[selectedFaction]?.detachments ?? []
    : []

  const handleSelectFaction = (slug: string | null) => {
    setSelectedFaction(slug)
    setSelectedDetachment(null)
    setDetachment('')
    setShowDetachmentDropdown(false)
    if (slug) loadFaction(slug)
  }

  const handleCreate = () => {
    if (!name.trim() || !selectedFaction) return
    const detName = selectedDetachment?.name || detachment.trim() || 'Standard'
    const detId = selectedDetachment?.id
    const id = createList(name.trim(), selectedFaction, detName, pointsLimit, detId)
    setShowForm(false)
    setName('')
    setSelectedFaction(null)
    setSelectedDetachment(null)
    setDetachment('')
    setPointsLimit(2000)
    navigate(`/lists/${id}`)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      {/* Top bar */}
      <HudTopBar
        title="Mes Listes d'armee"
        sub={`${allLists.length} listes${isAuthenticated ? ` \u00b7 ${syncedCount} synchronisees` : ''}`}
        actions={
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {isAuthenticated && syncing && (
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-accent)', letterSpacing: 1 }}>SYNC...</span>
            )}
            <HudBtn
              variant="ghost"
              onClick={() => {}}
            >
              <span
                onMouseEnter={(e) => {
                  const tip = e.currentTarget.querySelector('.btn-tooltip') as HTMLElement
                  if (tip) tip.style.display = 'block'
                }}
                onMouseLeave={(e) => {
                  const tip = e.currentTarget.querySelector('.btn-tooltip') as HTMLElement
                  if (tip) tip.style.display = 'none'
                }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 4, position: 'relative' }}
              >
                &#8615; IMPORTER
                <span
                  className="btn-tooltip"
                  style={{
                    display: 'none',
                    position: 'absolute',
                    top: '110%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    padding: '4px 8px',
                    fontSize: 9,
                    fontFamily: 'var(--font-mono)',
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text-muted)',
                    whiteSpace: 'nowrap',
                    zIndex: 10,
                  }}
                >
                  En cours d'implementation
                </span>
              </span>
            </HudBtn>
            <HudBtn
              variant="ghost"
              onClick={() => {}}
            >
              <span
                onMouseEnter={(e) => {
                  const tip = e.currentTarget.querySelector('.btn-tooltip') as HTMLElement
                  if (tip) tip.style.display = 'block'
                }}
                onMouseLeave={(e) => {
                  const tip = e.currentTarget.querySelector('.btn-tooltip') as HTMLElement
                  if (tip) tip.style.display = 'none'
                }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 4, position: 'relative' }}
              >
                &#8613; EXPORTER
                <span
                  className="btn-tooltip"
                  style={{
                    display: 'none',
                    position: 'absolute',
                    top: '110%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    padding: '4px 8px',
                    fontSize: 9,
                    fontFamily: 'var(--font-mono)',
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text-muted)',
                    whiteSpace: 'nowrap',
                    zIndex: 10,
                  }}
                >
                  En cours d'implementation
                </span>
              </span>
            </HudBtn>
          </div>
        }
      />

      {/* 3-column body */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        {/* Left sidebar */}
        <ListsSidebar onCreateClick={() => setShowForm(true)} onListSelect={handleListSelect} />

        {/* Center + Right */}
        <div style={{ flex: 1, minWidth: 0, minHeight: 0, display: 'flex', overflow: 'hidden' }}>
          {/* Center content */}
          <div style={{ flex: 1, minWidth: 0, overflow: 'auto' }}>
            {showForm ? (
              <div style={{ padding: '20px 28px 28px' }}>
                {/* Header — mirrors ListDetailCenter */}
                <div style={{ marginBottom: 20 }}>
                  <div
                    style={{
                      fontSize: 9,
                      fontFamily: 'var(--font-mono)',
                      letterSpacing: 2,
                      color: 'var(--color-accent)',
                      textTransform: 'uppercase',
                      marginBottom: 6,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      minHeight: 20,
                    }}
                  >
                    <span>{selectedFaction ? `▶ ${selectedFaction}` : '▶ NOUVELLE LISTE'}</span>
                    {selectedFaction && factionDetachments.length > 0 && (
                      <span style={{ position: 'relative' }}>
                        <span style={{ color: 'var(--color-text-muted)' }}> · </span>
                        <button
                          onClick={() => setShowDetachmentDropdown(!showDetachmentDropdown)}
                          style={{
                            background: 'var(--color-surface)',
                            border: '1px solid var(--color-border)',
                            color: selectedDetachment ? 'var(--color-accent)' : 'var(--color-text-muted)',
                            cursor: 'pointer',
                            fontSize: 9,
                            fontFamily: 'var(--font-mono)',
                            letterSpacing: 2,
                            textTransform: 'uppercase',
                            padding: '3px 8px',
                            transition: 'border-color 0.15s',
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--color-accent)'}
                          onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--color-border)'}
                        >
                          {selectedDetachment?.name ?? 'detachement ▾'}
                        </button>
                        {showDetachmentDropdown && (
                          <>
                            <div
                              style={{ position: 'fixed', inset: 0, zIndex: 49 }}
                              onClick={() => setShowDetachmentDropdown(false)}
                            />
                            <div
                              style={{
                                position: 'absolute',
                                top: '100%',
                                left: 0,
                                marginTop: 4,
                                zIndex: 50,
                                background: 'var(--color-surface)',
                                border: '1px solid var(--color-border)',
                                minWidth: 200,
                                maxHeight: 240,
                                overflowY: 'auto',
                                boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                              }}
                            >
                              {factionDetachments.map((det) => (
                                <button
                                  key={det.id}
                                  onClick={() => {
                                    setSelectedDetachment(det)
                                    setDetachment(det.name)
                                    setShowDetachmentDropdown(false)
                                  }}
                                  style={{
                                    display: 'block',
                                    width: '100%',
                                    padding: '8px 12px',
                                    background: selectedDetachment?.id === det.id ? 'var(--color-bg)' : 'transparent',
                                    border: 'none',
                                    borderBottom: '1px solid var(--color-border)',
                                    color: selectedDetachment?.id === det.id ? 'var(--color-accent)' : 'var(--color-text)',
                                    cursor: 'pointer',
                                    fontSize: 11,
                                    fontFamily: 'var(--font-mono)',
                                    textAlign: 'left',
                                    letterSpacing: 0.5,
                                  }}
                                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-bg)'}
                                  onMouseLeave={(e) => e.currentTarget.style.background = selectedDetachment?.id === det.id ? 'var(--color-bg)' : 'transparent'}
                                >
                                  {det.name}
                                </button>
                              ))}
                            </div>
                          </>
                        )}
                      </span>
                    )}
                  </div>

                  <h1 style={{ fontSize: 28, fontWeight: 600, color: 'var(--color-text)', margin: 0, lineHeight: 1.1 }}>
                    {name.trim() || 'Nouvelle Liste'}
                  </h1>

                  <div
                    style={{
                      fontSize: 10,
                      fontFamily: 'var(--font-mono)',
                      letterSpacing: 1,
                      color: 'var(--color-text-muted)',
                      textTransform: 'uppercase',
                      marginTop: 6,
                    }}
                  >
                    {pointsLimit} pts · creation en cours
                  </div>
                </div>

                {/* Name input */}
                <div style={{ marginBottom: 16 }}>
                  <p style={{ fontSize: 10, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: 1, marginBottom: 6 }}>NOM DE LA LISTE</p>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nom de la liste"
                    autoFocus
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      background: 'var(--color-bg)',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-text)',
                      fontSize: 14,
                      outline: 'none',
                      fontFamily: 'var(--font-sans)',
                    }}
                  />
                </div>

                {/* Points limit */}
                <div style={{ marginBottom: 16 }}>
                  <p style={{ fontSize: 10, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: 1, marginBottom: 6 }}>LIMITE DE POINTS</p>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {pointsOptions.map((pts) => {
                      const metal = pts === 1000 ? 'bronze' : pts === 2000 ? 'silver' : 'gold'
                      return (
                        <button key={pts} className={`btn-points btn-points--${metal} ${pointsLimit === pts ? 'btn-points--selected' : ''}`} onClick={() => setPointsLimit(pts)}>
                          {pts}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Faction picker */}
                {factionIndex && (
                  <div style={{ marginBottom: 20 }}>
                    <p style={{ fontSize: 10, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: 1, marginBottom: 6 }}>FACTION</p>
                    <FactionPicker
                      factions={factionIndex.factions}
                      onSelect={handleSelectFaction}
                      selectedSlug={selectedFaction}
                      collapseOnSelect={false}
                    />
                  </div>
                )}

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <span title={!name.trim() ? 'Donne un nom à ta liste' : !selectedFaction ? 'Choisis une faction' : undefined}>
                    <HudBtn variant="primary" onClick={handleCreate} disabled={!name.trim() || !selectedFaction}>Créer</HudBtn>
                  </span>
                  <HudBtn variant="ghost" onClick={() => setShowForm(false)}>Annuler</HudBtn>
                </div>
              </div>
            ) : center}
          </div>

          {/* Right panel — always rendered */}
          {showForm ? (
            <div
              style={{
                width: 280,
                flexShrink: 0,
                borderLeft: '1px solid var(--color-border)',
                background: 'var(--color-bg-elevated)',
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                overflow: 'hidden',
              }}
            >
              {/* Stratagems — real data when detachment selected, placeholder otherwise */}
              <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '12px 16px 12px 14px' }}>
                <MSection>Stratagemes{selectedDetachment?.stratagems?.length ? ` (${selectedDetachment.stratagems.length})` : ''}</MSection>
                {selectedDetachment?.stratagems?.length ? (
                  <div style={{ marginTop: 8 }}>
                    {selectedDetachment.stratagems.map((s) => (
                      <StratagemCard key={s.id} stratagem={s} />
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: '20px 0', textAlign: 'center', fontSize: 11, color: 'var(--color-text-muted)' }}>
                    {selectedFaction ? 'Choisissez un detachement' : 'Choisissez une faction'}
                  </div>
                )}
              </div>

              {/* Empty analysis placeholder */}
              <div style={{ flexShrink: 0, padding: '12px 16px 12px 14px', borderTop: '1px solid var(--color-border)' }}>
                <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', letterSpacing: 2, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>
                  ▸ Analyse
                </div>
                <div
                  style={{
                    border: '1px solid var(--color-border)',
                    background: 'var(--color-surface)',
                  }}
                >
                  {['Total modeles', 'Portee moyenne', 'Capacite objectifs', 'Wounds total', 'Peints pour jouer'].map((label) => (
                    <div
                      key={label}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px 12px',
                        borderBottom: '1px solid var(--color-border)',
                      }}
                    >
                      <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{label}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}>—</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : right}
        </div>
      </div>
    </div>
  )
}

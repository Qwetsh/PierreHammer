import { useState, useRef, useCallback, useEffect } from 'react'
import type { Datasheet, Enhancement } from '@/types/gameData.types'
import { Button } from '@/components/ui/Button'
import { useCustomImage } from '@/hooks/useCustomImage'
import { T } from '@/components/ui/TranslatableText'
import { THtml } from '@/components/ui/TranslatableText'

function useLongPress(callback: () => void, ms = 500) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const start = useCallback(() => {
    timerRef.current = setTimeout(callback, ms)
  }, [callback, ms])

  const clear = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  return {
    onPointerDown: start,
    onPointerUp: clear,
    onPointerLeave: clear,
    onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
  }
}

interface EnhancementGroup {
  detachmentName: string
  enhancements: Enhancement[]
}

interface UnitSheetProps {
  datasheet: Datasheet
  ownedCount?: number
  enhancementGroups?: EnhancementGroup[]
  onAddToCollection?: () => void
  onUpdateQuantity?: (quantity: number) => void
  onAddToList?: () => void
  onSimulate?: () => void
}

function isEpicHero(datasheet: Datasheet): boolean {
  return datasheet.keywords.some((k) => k.keyword.toUpperCase() === 'EPIC HERO')
}

function SectionTitle({ children }: { children: string }) {
  return (
    <h2
      className="font-semibold mt-6 mb-2 pb-1 border-b"
      style={{ fontSize: 'var(--text-lg)', color: 'var(--color-text)', borderColor: 'var(--color-surface)' }}
    >
      {children}
    </h2>
  )
}

function useIsMobile(breakpoint = 1024) {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < breakpoint : true,
  )
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mql = window.matchMedia(`(max-width: ${breakpoint - 1}px)`)
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [breakpoint])
  return isMobile
}

function MobileAccordion({
  header,
  children,
  defaultOpen,
}: {
  header: React.ReactNode
  children: React.ReactNode
  defaultOpen: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div>
      <button
        className="w-full flex items-center justify-between border-none cursor-pointer py-1 px-0"
        style={{ backgroundColor: 'transparent' }}
        onClick={() => setOpen(!open)}
      >
        <div className="flex-1 text-left">{header}</div>
        <span
          className="text-xs shrink-0 ml-2 transition-transform"
          style={{
            color: 'var(--color-text-muted)',
            transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
          }}
        >
          ▶
        </span>
      </button>
      {open && children}
    </div>
  )
}

export function UnitSheet({ datasheet, ownedCount = 0, enhancementGroups, onAddToCollection, onUpdateQuantity, onAddToList, onSimulate }: UnitSheetProps) {
  const isMobile = useIsMobile()
  const isMelee = (w: { type: string; range: string }) => w.type === 'Melee' || w.range === 'Melee'
  const meleeWeapons = datasheet.weapons.filter((w) => isMelee(w))
  const rangedWeapons = datasheet.weapons.filter((w) => !isMelee(w))
  const { customImageUrl, save: saveCustomImage, remove: removeCustomImage } = useCustomImage(datasheet.id)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [imgError, setImgError] = useState(false)
  const [showPhotoMenu, setShowPhotoMenu] = useState(false)
  const imageUrl = customImageUrl || datasheet.imageUrl
  const hasImage = imageUrl && !imgError
  const longPressHandlers = useLongPress(() => setShowPhotoMenu(true))

  return (
    <div className="pb-8">
      {/* Section 1 — Header with background image (long-press for photo menu) */}
      <div className="unit-sheet__header mb-4 relative" {...longPressHandlers} style={{ touchAction: 'pan-y' }}>
        {hasImage && (
          <div className="unit-sheet__header-bg">
            <img
              src={imageUrl}
              alt=""
              className="unit-sheet__header-bg-img"
              onError={() => setImgError(true)}
            />
            <div className="unit-sheet__header-overlay" />
          </div>
        )}
        <div className="unit-sheet__header-content">
          <div className="flex items-start gap-2">
            <h1 className="font-bold flex-1" style={{ fontSize: 'var(--text-2xl)' }}>
              <T text={datasheet.name} category="unit" />
            </h1>
            {isEpicHero(datasheet) && (
              <span
                className="text-xs px-2 py-1 rounded shrink-0"
                style={{ backgroundColor: 'var(--color-card-epic)', color: '#fff' }}
              >
                <T text="Epic Hero" category="keyword" />
              </span>
            )}
          </div>
          {datasheet.pointOptions.length > 0 && (
            <p style={{ color: 'var(--color-accent)' }}>
              {datasheet.pointOptions.map((p) => `${p.cost} pts (${p.models})`).join(' / ')}
            </p>
          )}
          <div className="flex items-center gap-3 mt-1">
            <p
              className="text-sm"
              style={{ color: ownedCount > 0 ? 'var(--color-success)' : 'var(--color-text-muted)' }}
            >
              {ownedCount > 0 ? `Possédé: ${ownedCount}` : 'Non possédé'}
            </p>
            {/* Desktop photo button (visible on lg+) */}
            {!isMobile && (
              <button
                className="text-xs px-2 py-1 rounded border-none cursor-pointer"
                style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: 'var(--color-text)' }}
                onClick={(e) => { e.stopPropagation(); setShowPhotoMenu(true) }}
              >
                {customImageUrl ? 'Changer la photo' : 'Ajouter une photo'}
              </button>
            )}
          </div>
        </div>

        {/* Photo menu (long-press on mobile, button on desktop) */}
        {showPhotoMenu && (
          <div
            className="absolute inset-0 z-20 flex items-center justify-center"
            style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
            onClick={() => setShowPhotoMenu(false)}
          >
            <div
              className="flex flex-col gap-1 rounded-xl p-2"
              style={{ backgroundColor: 'var(--color-surface)', minWidth: '180px' }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="text-left text-sm px-3 py-2 rounded-lg border-none cursor-pointer"
                style={{ backgroundColor: 'transparent', color: 'var(--color-text)' }}
                onClick={() => { fileInputRef.current?.click(); setShowPhotoMenu(false) }}
              >
                {customImageUrl ? 'Changer la photo' : 'Ajouter une photo'}
              </button>
              {customImageUrl && (
                <button
                  className="text-left text-sm px-3 py-2 rounded-lg border-none cursor-pointer"
                  style={{ backgroundColor: 'transparent', color: 'var(--color-error, #ef4444)' }}
                  onClick={() => { removeCustomImage(); setShowPhotoMenu(false) }}
                >
                  Supprimer la photo
                </button>
              )}
              <button
                className="text-left text-sm px-3 py-2 rounded-lg border-none cursor-pointer"
                style={{ backgroundColor: 'transparent', color: 'var(--color-text-muted)' }}
                onClick={() => setShowPhotoMenu(false)}
              >
                Annuler
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Photo custom */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) saveCustomImage(file)
          e.target.value = ''
        }}
      />

      {/* Section 2 — Actions */}
      <div className="flex items-center gap-3 mb-2 flex-wrap">
        {ownedCount === 0 ? (
          <Button variant="primary" size="sm" onClick={onAddToCollection}>
            Ajouter à ma collection
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onUpdateQuantity?.(ownedCount - 1)}
              aria-label="Diminuer la quantité"
            >
              −
            </Button>
            <span className="text-sm font-medium min-w-[2ch] text-center" style={{ color: 'var(--color-text)' }}>
              {ownedCount}
            </span>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onUpdateQuantity?.(ownedCount + 1)}
              aria-label="Augmenter la quantité"
            >
              +
            </Button>
          </div>
        )}
        <Button variant="secondary" size="sm" disabled={!onAddToList} onClick={onAddToList}>
          Ajouter à une liste
        </Button>
        {onSimulate && (
          <Button variant="ghost" size="sm" onClick={onSimulate}>
            Simuler
          </Button>
        )}
      </div>

      {/* Section 3 — Profil */}
      {datasheet.profiles.length > 0 && (
        <>
          <SectionTitle>Profil</SectionTitle>
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ color: 'var(--color-text)' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-surface)' }}>
                  <th className="text-left py-1 pr-2">Nom</th>
                  <th className="text-center px-2">M</th>
                  <th className="text-center px-2">T</th>
                  <th className="text-center px-2">SV</th>
                  <th className="text-center px-2">W</th>
                  <th className="text-center px-2">LD</th>
                  <th className="text-center px-2">OC</th>
                </tr>
              </thead>
              <tbody>
                {datasheet.profiles.map((p, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--color-surface)' }}>
                    <td className="py-1 pr-2 font-medium"><T text={p.name} category="unit" /></td>
                    <td className="text-center px-2">{p.M}</td>
                    <td className="text-center px-2">{p.T}</td>
                    <td className="text-center px-2">{p.Sv}</td>
                    <td className="text-center px-2">{p.W}</td>
                    <td className="text-center px-2">{p.Ld}</td>
                    <td className="text-center px-2">{p.OC}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Section 4 — Armes de tir */}
      {rangedWeapons.length > 0 && (
        <>
          <SectionTitle>Armes de tir</SectionTitle>
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ color: 'var(--color-text)' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-surface)' }}>
                  <th className="text-left py-1 pr-2">Arme</th>
                  <th className="text-center px-1">Portée</th>
                  <th className="text-center px-1">A</th>
                  <th className="text-center px-1">CT</th>
                  <th className="text-center px-1">F</th>
                  <th className="text-center px-1">PA</th>
                  <th className="text-center px-1">D</th>
                </tr>
              </thead>
              <tbody>
                {rangedWeapons.map((w, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--color-surface)' }}>
                    <td className="py-1 pr-2 font-medium"><T text={w.name} category="weapon" /></td>
                    <td className="text-center px-1">{w.range}</td>
                    <td className="text-center px-1">{w.A}</td>
                    <td className="text-center px-1">{w.BS_WS}</td>
                    <td className="text-center px-1">{w.S}</td>
                    <td className="text-center px-1">{w.AP}</td>
                    <td className="text-center px-1">{w.D}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Section 5 — Armes de mêlée */}
      {meleeWeapons.length > 0 && (
        <>
          <SectionTitle>Armes de mêlée</SectionTitle>
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ color: 'var(--color-text)' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-surface)' }}>
                  <th className="text-left py-1 pr-2">Arme</th>
                  <th className="text-center px-1">A</th>
                  <th className="text-center px-1">CC</th>
                  <th className="text-center px-1">F</th>
                  <th className="text-center px-1">PA</th>
                  <th className="text-center px-1">D</th>
                </tr>
              </thead>
              <tbody>
                {meleeWeapons.map((w, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--color-surface)' }}>
                    <td className="py-1 pr-2 font-medium"><T text={w.name} category="weapon" /></td>
                    <td className="text-center px-1">{w.A}</td>
                    <td className="text-center px-1">{w.BS_WS}</td>
                    <td className="text-center px-1">{w.S}</td>
                    <td className="text-center px-1">{w.AP}</td>
                    <td className="text-center px-1">{w.D}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Section 6 — Capacités */}
      {datasheet.abilities.length > 0 && (
        <>
          <SectionTitle>Capacités</SectionTitle>
          <div className="flex flex-col gap-3">
            {datasheet.abilities.map((a, i) =>
              isMobile ? (
                <MobileAccordion
                  key={`${a.id}-${i}`}
                  defaultOpen={false}
                  header={
                    <h3 className="font-semibold text-sm" style={{ color: 'var(--color-accent)' }}>
                      <T text={a.name} category="ability" />
                    </h3>
                  }
                >
                  <THtml
                    html={a.description}
                    category="ability"
                    className="text-sm mt-0.5"
                    style={{ color: 'var(--color-text-muted)' }}
                  />
                </MobileAccordion>
              ) : (
                <div key={`${a.id}-${i}`}>
                  <h3 className="font-semibold text-sm" style={{ color: 'var(--color-accent)' }}>
                    <T text={a.name} category="ability" />
                  </h3>
                  <THtml
                    html={a.description}
                    category="ability"
                    className="text-sm mt-0.5"
                    style={{ color: 'var(--color-text-muted)' }}
                  />
                </div>
              ),
            )}
          </div>
        </>
      )}

      {/* Section 6b — Améliorations disponibles */}
      {enhancementGroups && enhancementGroups.length > 0 && (
        <>
          <SectionTitle>Améliorations disponibles</SectionTitle>
          <div className="flex flex-col gap-4">
            {enhancementGroups.map((group) => (
              <div key={group.detachmentName}>
                <p
                  className="text-xs font-medium mb-2"
                  style={{ color: 'var(--color-accent)' }}
                >
                  <T text={group.detachmentName} category="detachment" />
                </p>
                <div className="flex flex-col gap-1.5">
                  {group.enhancements.map((enh) => (
                    <div
                      key={enh.id}
                      className="rounded-lg px-3 py-2"
                      style={{ backgroundColor: 'var(--color-surface)' }}
                    >
                      {isMobile ? (
                        <MobileAccordion
                          defaultOpen={false}
                          header={
                            <div className="flex items-center justify-between w-full pr-1">
                              <span className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                                <T text={enh.name} category="enhancement" />
                              </span>
                              <span className="text-sm font-semibold shrink-0 ml-3" style={{ color: 'var(--color-accent)' }}>
                                {enh.cost} pts
                              </span>
                            </div>
                          }
                        >
                          {enh.legend && (
                            <p className="text-xs italic mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                              <T text={enh.legend} category="enhancement" />
                            </p>
                          )}
                          <THtml
                            html={enh.description}
                            category="enhancement"
                            className="text-xs mt-1"
                            style={{ color: 'var(--color-text-muted)' }}
                          />
                        </MobileAccordion>
                      ) : (
                        <>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                              <T text={enh.name} category="enhancement" />
                            </span>
                            <span className="text-sm font-semibold shrink-0 ml-3" style={{ color: 'var(--color-accent)' }}>
                              {enh.cost} pts
                            </span>
                          </div>
                          {enh.legend && (
                            <p className="text-xs italic mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                              <T text={enh.legend} category="enhancement" />
                            </p>
                          )}
                          <THtml
                            html={enh.description}
                            category="enhancement"
                            className="text-xs mt-1"
                            style={{ color: 'var(--color-text-muted)' }}
                          />
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Section 7 — Mots-clés */}
      {datasheet.keywords.length > 0 && (
        <>
          <SectionTitle>Mots-clés</SectionTitle>
          <div className="flex flex-wrap gap-2">
            {datasheet.keywords.map((k, i) => (
              <span
                key={i}
                className="text-xs px-2 py-1 rounded"
                style={{
                  backgroundColor: k.isFactionKeyword ? 'var(--color-primary)' : 'var(--color-surface)',
                  color: k.isFactionKeyword ? '#ffffff' : 'var(--color-text)',
                }}
              >
                <T text={k.keyword} category="keyword" />
              </span>
            ))}
          </div>
        </>
      )}

      {/* Section 8 — Options / Composition */}
      {datasheet.unitComposition && (
        <>
          <SectionTitle>Composition</SectionTitle>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            <T text={datasheet.unitComposition} category="other" />
          </p>
        </>
      )}

      {datasheet.loadout && (
        <>
          <SectionTitle>Équipement</SectionTitle>
          <THtml
            html={datasheet.loadout}
            category="other"
            className="text-sm"
            style={{ color: 'var(--color-text-muted)' }}
          />
        </>
      )}
    </div>
  )
}

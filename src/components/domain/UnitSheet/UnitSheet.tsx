import { useState, useRef, useCallback } from 'react'
import type { Datasheet } from '@/types/gameData.types'
import { Button } from '@/components/ui/Button'
import { sanitizeHtml } from '@/utils/sanitizeHtml'
import { useCustomImage } from '@/hooks/useCustomImage'

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

interface UnitSheetProps {
  datasheet: Datasheet
  ownedCount?: number
  onAddToCollection?: () => void
  onUpdateQuantity?: (quantity: number) => void
  onAddToList?: () => void
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

export function UnitSheet({ datasheet, ownedCount = 0, onAddToCollection, onUpdateQuantity, onAddToList }: UnitSheetProps) {
  const rangedWeapons = datasheet.weapons.filter((w) => w.type === 'Ranged' || (w.range && w.range !== 'Melee'))
  const meleeWeapons = datasheet.weapons.filter((w) => w.type === 'Melee' || w.range === 'Melee')
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
              {datasheet.name}
            </h1>
            {isEpicHero(datasheet) && (
              <span
                className="text-xs px-2 py-1 rounded shrink-0"
                style={{ backgroundColor: 'var(--color-card-epic)', color: '#fff' }}
              >
                Epic Hero
              </span>
            )}
          </div>
          {datasheet.pointOptions.length > 0 && (
            <p style={{ color: 'var(--color-accent)' }}>
              {datasheet.pointOptions.map((p) => `${p.cost} pts (${p.models})`).join(' / ')}
            </p>
          )}
          <p
            className="text-sm mt-1"
            style={{ color: ownedCount > 0 ? 'var(--color-success)' : 'var(--color-text-muted)' }}
          >
            {ownedCount > 0 ? `Possédé: ${ownedCount}` : 'Non possédé'}
          </p>
        </div>

        {/* Photo menu (long-press) */}
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
                    <td className="py-1 pr-2 font-medium">{p.name}</td>
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
                    <td className="py-1 pr-2 font-medium">{w.name}</td>
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
                    <td className="py-1 pr-2 font-medium">{w.name}</td>
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
            {datasheet.abilities.map((a, i) => (
              <div key={`${a.id}-${i}`}>
                <h3 className="font-semibold text-sm" style={{ color: 'var(--color-accent)' }}>
                  {a.name}
                </h3>
                <p
                  className="text-sm mt-0.5"
                  style={{ color: 'var(--color-text-muted)' }}
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(a.description) }}
                />
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
                {k.keyword}
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
            {datasheet.unitComposition}
          </p>
        </>
      )}

      {datasheet.loadout && (
        <>
          <SectionTitle>Équipement</SectionTitle>
          <p
            className="text-sm"
            style={{ color: 'var(--color-text-muted)' }}
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(datasheet.loadout) }}
          />
        </>
      )}
    </div>
  )
}

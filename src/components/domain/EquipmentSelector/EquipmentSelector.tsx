import { useRef, useState } from 'react'
import type { Datasheet, Weapon } from '@/types/gameData.types'
import { useCustomImage } from '@/hooks/useCustomImage'
import { Button } from '@/components/ui/Button'
import { T } from '@/components/ui/TranslatableText'

interface EquipmentSelectorProps {
  datasheet: Datasheet
  initialPointOptionIndex?: number
  initialWeapons?: string[]
  initialNotes?: string
  onConfirm: (pointOptionIndex: number, weapons: string[], notes: string) => void
  onCancel: () => void
  confirmLabel?: string
}

function isMelee(w: Weapon): boolean {
  return w.type === 'Melee' || w.range === 'Melee'
}

function weaponKey(w: Weapon): string {
  return `${isMelee(w) ? 'melee' : 'ranged'}:${w.name}`
}

const statBadgeStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '2px',
  padding: '1px 5px',
  borderRadius: '4px',
  fontSize: '10px',
  lineHeight: '16px',
  backgroundColor: 'rgba(255,255,255,0.06)',
}

function WeaponStats({ w, showRange }: { w: Weapon; showRange?: boolean }) {
  return (
    <span className="flex items-center gap-1 shrink-0">
      {showRange && (
        <span style={{ ...statBadgeStyle, color: 'var(--color-accent)' }}>
          {w.range}
        </span>
      )}
      <span style={statBadgeStyle}>
        <span style={{ color: 'var(--color-text-muted)' }}>F</span>
        <span style={{ color: 'var(--color-text)' }}>{w.S}</span>
      </span>
      <span style={statBadgeStyle}>
        <span style={{ color: 'var(--color-text-muted)' }}>PA</span>
        <span style={{ color: 'var(--color-text)' }}>{w.AP}</span>
      </span>
      <span style={statBadgeStyle}>
        <span style={{ color: 'var(--color-text-muted)' }}>D</span>
        <span style={{ color: 'var(--color-text)' }}>{w.D}</span>
      </span>
    </span>
  )
}

export function EquipmentSelector({
  datasheet,
  initialPointOptionIndex = 0,
  initialWeapons,
  initialNotes = '',
  onConfirm,
  onCancel,
  confirmLabel = 'Confirmer',
}: EquipmentSelectorProps) {
  const [pointOptionIndex, setPointOptionIndex] = useState(initialPointOptionIndex)
  const [selectedWeapons, setSelectedWeapons] = useState<string[]>(() => {
    if (initialWeapons && initialWeapons.length > 0) return initialWeapons
    return datasheet.weapons.map((w) => weaponKey(w))
  })
  const [notes, setNotes] = useState(initialNotes)
  const { customImageUrl, save: saveImage } = useCustomImage(datasheet.id)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageUrl = customImageUrl || datasheet.imageUrl

  // Exclusive filters: melee first, then everything else is ranged
  const meleeWeapons = datasheet.weapons.filter((w) => isMelee(w))
  const rangedWeapons = datasheet.weapons.filter((w) => !isMelee(w))

  const toggleWeapon = (key: string) => {
    setSelectedWeapons((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    )
  }

  const cost = datasheet.pointOptions[pointOptionIndex]?.cost ?? datasheet.pointOptions[0]?.cost ?? 0

  return (
    <div
      className="fixed left-0 right-0 top-0 flex items-end justify-center"
      style={{
        backgroundColor: 'rgba(0,0,0,0.6)',
        zIndex: 60,
        bottom: 'calc(60px + env(safe-area-inset-bottom, 0px))',
      }}
      onClick={onCancel}
    >
      <div
        className="w-full max-w-lg rounded-t-2xl"
        style={{ backgroundColor: 'var(--color-surface)', maxHeight: '80%', display: 'flex', flexDirection: 'column' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ backgroundColor: 'var(--color-text-muted)', opacity: 0.4 }} />
        </div>

        {/* Unit image + header */}
        <div className="flex items-center gap-3 px-4 pb-3">
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
          <div
            className="shrink-0 rounded-lg overflow-hidden cursor-pointer"
            style={{
              width: '64px',
              height: '64px',
              backgroundColor: 'var(--color-bg)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
            onClick={() => fileInputRef.current?.click()}
            title="Changer la photo"
          >
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={datasheet.name}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center text-xs"
                style={{ color: 'var(--color-text-muted)' }}
              >
                Photo
              </div>
            )}
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold truncate" style={{ color: 'var(--color-text)', fontSize: 'var(--text-lg)' }}>
              <T text={datasheet.name} category="unit" />
            </h3>
            <p className="text-sm" style={{ color: 'var(--color-accent)' }}>
              {cost} pts
            </p>
          </div>
        </div>

        {/* Scrollable content */}
        <div
          className="px-4 overflow-y-auto scrollbar-thin"
          style={{ flex: '1 1 auto', minHeight: 0, WebkitOverflowScrolling: 'touch' }}
        >
          {/* Point options */}
          {datasheet.pointOptions.length > 1 && (
            <div className="mb-4">
              <p className="text-xs font-medium mb-2" style={{ color: 'var(--color-text-muted)' }}>
                Composition
              </p>
              <div className="flex flex-col gap-1.5">
                {datasheet.pointOptions.map((opt, i) => (
                  <button
                    key={i}
                    className="flex items-center justify-between rounded-lg px-3 py-2 text-sm border-none cursor-pointer min-h-[44px]"
                    style={{
                      backgroundColor: pointOptionIndex === i ? 'var(--color-primary)' : 'var(--color-bg)',
                      color: pointOptionIndex === i ? '#ffffff' : 'var(--color-text)',
                    }}
                    onClick={() => setPointOptionIndex(i)}
                  >
                    <span>{opt.models}</span>
                    <span className="font-semibold">{opt.cost} pts</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Ranged weapons */}
          {rangedWeapons.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-medium mb-2" style={{ color: 'var(--color-text-muted)' }}>
                Armes de tir
              </p>
              <div className="flex flex-col gap-1">
                {rangedWeapons.map((w) => {
                  const key = weaponKey(w)
                  return (
                    <label
                      key={key}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 cursor-pointer min-h-[40px]"
                      style={{ backgroundColor: 'var(--color-bg)' }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedWeapons.includes(key)}
                        onChange={() => toggleWeapon(key)}
                        className="accent-[var(--color-primary)]"
                      />
                      <span className="text-sm flex-1" style={{ color: 'var(--color-text)' }}>
                        <T text={w.name} category="weapon" />
                      </span>
                      <WeaponStats w={w} showRange />
                    </label>
                  )
                })}
              </div>
            </div>
          )}

          {/* Melee weapons */}
          {meleeWeapons.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-medium mb-2" style={{ color: 'var(--color-text-muted)' }}>
                Armes de mêlée
              </p>
              <div className="flex flex-col gap-1">
                {meleeWeapons.map((w) => {
                  const key = weaponKey(w)
                  return (
                    <label
                      key={key}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 cursor-pointer min-h-[40px]"
                      style={{ backgroundColor: 'var(--color-bg)' }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedWeapons.includes(key)}
                        onChange={() => toggleWeapon(key)}
                        className="accent-[var(--color-primary)]"
                      />
                      <span className="text-sm flex-1" style={{ color: 'var(--color-text)' }}>
                        <T text={w.name} category="weapon" />
                      </span>
                      <WeaponStats w={w} />
                    </label>
                  )
                })}
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="mb-2">
            <p className="text-xs font-medium mb-2" style={{ color: 'var(--color-text-muted)' }}>
              Notes (optionnel)
            </p>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Ex: Kitbash, proxy, variante..."
              className="w-full rounded-lg px-3 py-2 text-sm border-none outline-none resize-none"
              style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}
            />
          </div>
        </div>

        {/* Footer */}
        <div
          className="flex gap-3 px-4 py-3 shrink-0"
          style={{ borderTop: '1px solid var(--color-bg)' }}
        >
          <Button variant="primary" onClick={() => onConfirm(pointOptionIndex, selectedWeapons, notes)}>
            {confirmLabel}
          </Button>
          <Button variant="ghost" onClick={onCancel}>
            Annuler
          </Button>
        </div>
      </div>
    </div>
  )
}

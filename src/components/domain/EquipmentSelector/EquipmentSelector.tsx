import { useState } from 'react'
import type { Datasheet } from '@/types/gameData.types'
import { Button } from '@/components/ui/Button'

interface EquipmentSelectorProps {
  datasheet: Datasheet
  initialPointOptionIndex?: number
  initialWeapons?: string[]
  initialNotes?: string
  onConfirm: (pointOptionIndex: number, weapons: string[], notes: string) => void
  onCancel: () => void
  confirmLabel?: string
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
  const [selectedWeapons, setSelectedWeapons] = useState<string[]>(
    initialWeapons ?? datasheet.weapons.map((w) => w.name),
  )
  const [notes, setNotes] = useState(initialNotes)

  const rangedWeapons = datasheet.weapons.filter((w) => w.type === 'Ranged' || (w.range && w.range !== 'Melee'))
  const meleeWeapons = datasheet.weapons.filter((w) => w.type === 'Melee' || w.range === 'Melee')

  const toggleWeapon = (name: string) => {
    setSelectedWeapons((prev) =>
      prev.includes(name) ? prev.filter((w) => w !== name) : [...prev, name],
    )
  }

  const cost = datasheet.pointOptions[pointOptionIndex]?.cost ?? datasheet.pointOptions[0]?.cost ?? 0

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
      onClick={onCancel}
    >
      <div
        className="w-full max-w-lg rounded-t-xl p-4 max-h-[80vh] overflow-y-auto"
        style={{ backgroundColor: 'var(--color-surface)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-semibold mb-1" style={{ color: 'var(--color-text)', fontSize: 'var(--text-lg)' }}>
          {datasheet.name}
        </h3>
        <p className="text-sm mb-4" style={{ color: 'var(--color-accent)' }}>
          {cost} pts
        </p>

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
              {rangedWeapons.map((w) => (
                <label
                  key={w.name}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 cursor-pointer min-h-[40px]"
                  style={{ backgroundColor: 'var(--color-bg)' }}
                >
                  <input
                    type="checkbox"
                    checked={selectedWeapons.includes(w.name)}
                    onChange={() => toggleWeapon(w.name)}
                    className="accent-[var(--color-primary)]"
                  />
                  <span className="text-sm flex-1" style={{ color: 'var(--color-text)' }}>
                    {w.name}
                  </span>
                  <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    {w.range} | F{w.S} PA{w.AP} D{w.D}
                  </span>
                </label>
              ))}
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
              {meleeWeapons.map((w) => (
                <label
                  key={w.name}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 cursor-pointer min-h-[40px]"
                  style={{ backgroundColor: 'var(--color-bg)' }}
                >
                  <input
                    type="checkbox"
                    checked={selectedWeapons.includes(w.name)}
                    onChange={() => toggleWeapon(w.name)}
                    className="accent-[var(--color-primary)]"
                  />
                  <span className="text-sm flex-1" style={{ color: 'var(--color-text)' }}>
                    {w.name}
                  </span>
                  <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    F{w.S} PA{w.AP} D{w.D}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        <div className="mb-4">
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

        {/* Actions */}
        <div className="flex gap-2">
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

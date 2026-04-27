import { useState } from 'react'
import type { Weapon } from '@/types/gameData.types'
import { T } from '@/components/ui/TranslatableText'

interface WeaponPickerModalProps {
  weapons: Weapon[]
  selectedWeapon?: Weapon | null
  selectedWeapons?: Weapon[]
  multiSelect?: boolean
  onSelect: (weapon: Weapon) => void
  onMultiSelect?: (weapons: Weapon[]) => void
  onClose: () => void
}

export function WeaponPickerModal({ weapons, selectedWeapon, selectedWeapons = [], multiSelect = false, onSelect, onMultiSelect, onClose }: WeaponPickerModalProps) {
  const [picked, setPicked] = useState<Weapon[]>(selectedWeapons)

  const ranged = weapons.filter((w) => w.type !== 'Melee' && w.range !== 'Melee')
  const melee = weapons.filter((w) => w.type === 'Melee' || w.range === 'Melee')

  const isWeaponSelected = (w: Weapon) => {
    if (multiSelect) return picked.some((p) => p.name === w.name && p.type === w.type)
    return selectedWeapon?.name === w.name && selectedWeapon?.type === w.type
  }

  const toggleWeapon = (w: Weapon) => {
    if (!multiSelect) {
      onSelect(w)
      onClose()
      return
    }
    setPicked((prev) => {
      const exists = prev.findIndex((p) => p.name === w.name && p.type === w.type)
      if (exists >= 0) return prev.filter((_, i) => i !== exists)
      return [...prev, w]
    })
  }

  const renderWeapon = (w: Weapon, i: number) => {
    const selected = isWeaponSelected(w)
    return (
      <button
        key={`${w.name}-${i}`}
        className="w-full text-left rounded-lg p-3 mb-1 border-none cursor-pointer transition-colors"
        style={{
          backgroundColor: selected ? 'var(--color-accent)' : 'var(--color-surface)',
          color: selected ? '#fff' : 'var(--color-text)',
        }}
        onClick={() => toggleWeapon(w)}
      >
        <div className="flex items-center justify-between">
          <span className="font-medium text-sm"><T text={w.name} category="weapon" /></span>
          {w.range !== 'Melee' && (
            <span className="text-xs" style={{ opacity: 0.7 }}>{w.range}</span>
          )}
        </div>
        <div className="flex gap-3 mt-1">
          <Stat label="A" value={w.A} />
          <Stat label="BS/WS" value={w.BS_WS} />
          <Stat label="S" value={w.S} />
          <Stat label="AP" value={w.AP} />
          <Stat label="D" value={w.D} />
        </div>
        {w.abilities && (
          <p className="text-[10px] mt-1" style={{ opacity: 0.6 }}>{w.abilities}</p>
        )}
      </button>
    )
  }

  return (
    <div data-scroll-lock className="fixed inset-0 z-[80] flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }} onClick={onClose}>
      <div
        className="w-full max-w-md rounded-xl p-5 max-h-[80vh] lg:max-w-lg lg:p-6 overflow-y-auto"
        style={{ backgroundColor: 'var(--color-bg)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-bold text-base mb-3" style={{ color: 'var(--color-text)' }}>
          {multiSelect ? 'Choisir les armes (multi)' : 'Choisir une arme'}
        </h3>
        {multiSelect && (
          <p className="text-xs mb-3" style={{ color: 'var(--color-text-muted)' }}>
            {picked.length} arme{picked.length !== 1 ? 's' : ''} — modèles répartis équitablement
          </p>
        )}

        {ranged.length > 0 && (
          <>
            <p className="text-xs font-medium mb-2" style={{ color: 'var(--color-text-muted)' }}>Distance</p>
            {ranged.map(renderWeapon)}
          </>
        )}

        {melee.length > 0 && (
          <>
            <p className="text-xs font-medium mb-2 mt-3" style={{ color: 'var(--color-text-muted)' }}>Mêlée</p>
            {melee.map(renderWeapon)}
          </>
        )}

        {multiSelect ? (
          <div className="flex gap-2 mt-3">
            <button
              className="flex-1 text-center text-xs py-2 border-none cursor-pointer"
              style={{ background: 'var(--color-accent)', color: '#fff' }}
              onClick={() => { onMultiSelect?.(picked); onClose() }}
            >
              Valider ({picked.length})
            </button>
            <button
              className="flex-1 text-center text-xs py-2 bg-transparent border-none cursor-pointer"
              style={{ color: 'var(--color-text-muted)' }}
              onClick={onClose}
            >
              Annuler
            </button>
          </div>
        ) : (
          <button
            className="mt-3 w-full text-center text-xs bg-transparent border-none cursor-pointer"
            style={{ color: 'var(--color-text-muted)' }}
            onClick={onClose}
          >
            Annuler
          </button>
        )}
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <span className="text-xs">
      <span style={{ opacity: 0.5 }}>{label}:</span>{value}
    </span>
  )
}

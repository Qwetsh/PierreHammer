import type { Weapon } from '@/types/gameData.types'

interface WeaponPickerModalProps {
  weapons: Weapon[]
  selectedWeapon: Weapon | null
  onSelect: (weapon: Weapon) => void
  onClose: () => void
}

export function WeaponPickerModal({ weapons, selectedWeapon, onSelect, onClose }: WeaponPickerModalProps) {
  const ranged = weapons.filter((w) => w.type !== 'Melee' && w.range !== 'Melee')
  const melee = weapons.filter((w) => w.type === 'Melee' || w.range === 'Melee')

  const renderWeapon = (w: Weapon, i: number) => {
    const isSelected = selectedWeapon?.name === w.name && selectedWeapon?.type === w.type
    return (
      <button
        key={`${w.name}-${i}`}
        className="w-full text-left rounded-lg p-3 mb-1 border-none cursor-pointer transition-colors"
        style={{
          backgroundColor: isSelected ? 'var(--color-accent)' : 'var(--color-surface)',
          color: isSelected ? '#fff' : 'var(--color-text)',
        }}
        onClick={() => { onSelect(w); onClose() }}
      >
        <div className="flex items-center justify-between">
          <span className="font-medium text-sm">{w.name}</span>
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
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }} onClick={onClose}>
      <div
        className="w-full max-w-md rounded-xl p-5 max-h-[80vh] lg:max-w-lg lg:p-6 overflow-y-auto"
        style={{ backgroundColor: 'var(--color-bg)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-bold text-base mb-3" style={{ color: 'var(--color-text)' }}>Choisir une arme</h3>

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

        <button
          className="mt-3 w-full text-center text-xs bg-transparent border-none cursor-pointer"
          style={{ color: 'var(--color-text-muted)' }}
          onClick={onClose}
        >
          Annuler
        </button>
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

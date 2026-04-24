import { useMemo, useState } from 'react'
import type { Datasheet } from '@/types/gameData.types'
import { T } from '@/components/ui/TranslatableText'

interface UnitSearchModalProps {
  datasheets: Datasheet[]
  onSelect: (datasheet: Datasheet) => void
  onClose: () => void
}

export function UnitSearchModal({ datasheets, onSelect, onClose }: UnitSearchModalProps) {
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    const list = q ? datasheets.filter((d) => d.name.toLowerCase().includes(q)) : datasheets
    return list.slice(0, 40)
  }, [datasheets, search])

  return (
    <div data-scroll-lock className="fixed inset-0 z-[80] flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }} onClick={onClose}>
      <div
        className="w-full max-w-md rounded-xl p-5 max-h-[80vh] lg:max-w-lg lg:p-6 flex flex-col"
        style={{ backgroundColor: 'var(--color-bg)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-bold text-base mb-3" style={{ color: 'var(--color-text)' }}>Choisir une unité</h3>

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher une unité..."
          className="w-full rounded-lg px-3 py-2 text-sm mb-3 border-none outline-none"
          style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
          autoFocus
        />

        <div className="overflow-y-auto flex-1 -mx-1">
          {filtered.map((ds) => (
            <button
              key={ds.id}
              className="flex items-center gap-3 w-full text-left rounded-lg px-3 py-2.5 mb-1 border-none cursor-pointer transition-colors"
              style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
              onClick={() => onSelect(ds)}
            >
              {ds.imageUrl ? (
                <img
                  src={ds.imageUrl}
                  alt={ds.name}
                  className="w-10 h-10 rounded object-cover shrink-0"
                  style={{ backgroundColor: 'var(--color-bg)' }}
                />
              ) : (
                <div
                  className="w-10 h-10 rounded flex items-center justify-center text-xs shrink-0"
                  style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text-muted)' }}
                >
                  ?
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-medium truncate"><T text={ds.name} category="unit" /></p>
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  {ds.profiles[0] && `T:${ds.profiles[0].T} Sv:${ds.profiles[0].Sv} W:${ds.profiles[0].W}`}
                </p>
              </div>
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="text-sm text-center py-4" style={{ color: 'var(--color-text-muted)' }}>Aucune unité trouvée</p>
          )}
        </div>

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

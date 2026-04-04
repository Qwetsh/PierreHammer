import { useNavigate } from 'react-router'
import { useComparatorStore } from '@/stores/comparatorStore'
import { useGameDataStore } from '@/stores/gameDataStore'
import { Button } from '@/components/ui/Button'
import type { Datasheet } from '@/types/gameData.types'

const statLabels = ['M', 'T', 'Sv', 'W', 'Ld', 'OC'] as const

function StatCell({ value, best }: { value: string; best: boolean }) {
  return (
    <td
      className="text-center px-2 py-1 text-sm font-medium"
      style={{ color: best ? 'var(--color-success)' : 'var(--color-text)' }}
    >
      {value}
    </td>
  )
}

export function ComparatorPage() {
  const navigate = useNavigate()
  const { selectedIds, factionSlug, clear, removeUnit } = useComparatorStore()
  const loadedFactions = useGameDataStore((s) => s.loadedFactions)

  const faction = factionSlug ? loadedFactions[factionSlug] : undefined
  const datasheets: Datasheet[] = selectedIds
    .map((id) => faction?.datasheets.find((ds) => ds.id === id))
    .filter((ds): ds is Datasheet => !!ds)

  if (datasheets.length === 0) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4" style={{ fontSize: 'var(--text-2xl)' }}>Comparateur</h1>
        <p className="text-sm mb-4" style={{ color: 'var(--color-text-muted)' }}>
          Aucune unité sélectionnée. Retourne au catalogue et active le mode comparaison pour sélectionner des unités.
        </p>
        <Button variant="primary" size="sm" onClick={() => navigate('/catalog')}>
          Aller au catalogue
        </Button>
      </div>
    )
  }

  const bestStat = (stat: typeof statLabels[number]): string => {
    const values = datasheets.map((ds) => {
      const p = ds.profiles[0]
      return p ? p[stat] : ''
    })
    const nums = values.map((v) => parseInt(v.replace(/[^0-9]/g, ''), 10) || 0)
    // For T, W, OC higher is better. For Sv, Ld lower is better. For M higher is better.
    const lowerIsBetter = stat === 'Sv' || stat === 'Ld'
    const best = lowerIsBetter ? Math.min(...nums.filter((n) => n > 0)) : Math.max(...nums)
    const bestIdx = nums.indexOf(best)
    return values[bestIdx] ?? ''
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold" style={{ fontSize: 'var(--text-2xl)' }}>Comparateur</h1>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => { clear(); navigate(-1) }}>
            Fermer
          </Button>
        </div>
      </div>

      {/* Unit headers */}
      <div className="grid gap-3 mb-4" style={{ gridTemplateColumns: `repeat(${datasheets.length}, 1fr)` }}>
        {datasheets.map((ds) => (
          <div
            key={ds.id}
            className="rounded-lg p-3 text-center"
            style={{ backgroundColor: 'var(--color-surface)' }}
          >
            <p className="font-semibold text-sm mb-1" style={{ color: 'var(--color-text)' }}>{ds.name}</p>
            <p className="text-xs" style={{ color: 'var(--color-accent)' }}>
              {ds.pointOptions[0]?.cost ?? '?'} pts
            </p>
            <button
              className="text-xs mt-2 cursor-pointer bg-transparent border-none"
              style={{ color: 'var(--color-text-muted)' }}
              onClick={() => removeUnit(ds.id)}
            >
              Retirer
            </button>
          </div>
        ))}
      </div>

      {/* Profiles comparison */}
      <h2 className="font-semibold mb-2" style={{ fontSize: 'var(--text-lg)', color: 'var(--color-text)' }}>
        Profil
      </h2>
      <div className="overflow-x-auto mb-4">
        <table className="w-full text-sm" style={{ color: 'var(--color-text)' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--color-surface)' }}>
              <th className="text-left py-1 pr-2">Stat</th>
              {datasheets.map((ds) => (
                <th key={ds.id} className="text-center px-2 py-1">{ds.name.split(' ').slice(0, 2).join(' ')}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {statLabels.map((stat) => {
              const bestVal = bestStat(stat)
              return (
                <tr key={stat} style={{ borderBottom: '1px solid var(--color-surface)' }}>
                  <td className="py-1 pr-2 font-medium text-sm" style={{ color: 'var(--color-text-muted)' }}>{stat}</td>
                  {datasheets.map((ds) => {
                    const val = ds.profiles[0]?.[stat] ?? '-'
                    return <StatCell key={ds.id} value={val} best={val === bestVal && datasheets.length > 1} />
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Weapons comparison */}
      <h2 className="font-semibold mb-2" style={{ fontSize: 'var(--text-lg)', color: 'var(--color-text)' }}>
        Armes
      </h2>
      <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${datasheets.length}, 1fr)` }}>
        {datasheets.map((ds) => (
          <div key={ds.id} className="flex flex-col gap-1">
            {ds.weapons.map((w, i) => (
              <div
                key={i}
                className="rounded px-2 py-1.5 text-xs"
                style={{ backgroundColor: 'var(--color-surface)' }}
              >
                <p className="font-medium" style={{ color: 'var(--color-text)' }}>{w.name}</p>
                <p style={{ color: 'var(--color-text-muted)' }}>
                  {w.range !== 'Melee' ? `${w.range} ` : ''}A{w.A} F{w.S} PA{w.AP} D{w.D}
                </p>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Abilities comparison */}
      <h2 className="font-semibold mt-4 mb-2" style={{ fontSize: 'var(--text-lg)', color: 'var(--color-text)' }}>
        Capacités
      </h2>
      <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${datasheets.length}, 1fr)` }}>
        {datasheets.map((ds) => (
          <div key={ds.id} className="flex flex-col gap-1">
            {ds.abilities.map((a) => (
              <div
                key={a.id}
                className="rounded px-2 py-1.5 text-xs"
                style={{ backgroundColor: 'var(--color-surface)' }}
              >
                <p className="font-medium" style={{ color: 'var(--color-accent)' }}>{a.name}</p>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

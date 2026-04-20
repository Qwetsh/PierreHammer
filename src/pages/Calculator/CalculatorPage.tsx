import { useState } from 'react'
import {
  calcDiceSuccesses,
  calcAverageDice,
  calcChargeSuccess,
  calc2D6Distribution,
  type RerollMode,
} from '@/utils/diceCalculator'

type Tab = 'dice' | 'average' | 'charge'

const tabs: { id: Tab; label: string }[] = [
  { id: 'dice', label: 'Dés' },
  { id: 'average', label: 'Moyenne' },
  { id: 'charge', label: 'Charge' },
]

function NumberInput({
  label,
  value,
  onChange,
  min = 0,
  max = 999,
  step = 1,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
  step?: number
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
        {label}
      </label>
      <div className="flex items-center gap-2">
        <button
          className="flex items-center justify-center rounded-lg border-none cursor-pointer font-bold text-lg"
          style={{
            width: '40px',
            height: '40px',
            backgroundColor: 'var(--color-surface)',
            color: 'var(--color-text)',
          }}
          onClick={() => onChange(Math.max(min, value - step))}
        >
          −
        </button>
        <input
          type="number"
          inputMode="numeric"
          value={value}
          onChange={(e) => {
            const v = parseInt(e.target.value, 10)
            if (!isNaN(v)) onChange(Math.min(max, Math.max(min, v)))
          }}
          className="text-center rounded-lg border-none font-semibold"
          style={{
            width: '64px',
            height: '40px',
            backgroundColor: 'var(--color-surface)',
            color: 'var(--color-text)',
            fontSize: 'var(--text-lg)',
          }}
        />
        <button
          className="flex items-center justify-center rounded-lg border-none cursor-pointer font-bold text-lg"
          style={{
            width: '40px',
            height: '40px',
            backgroundColor: 'var(--color-surface)',
            color: 'var(--color-text)',
          }}
          onClick={() => onChange(Math.min(max, value + step))}
        >
          +
        </button>
      </div>
    </div>
  )
}

function ResultBox({ label, value, unit }: { label: string; value: string | number; unit?: string }) {
  return (
    <div
      className="rounded-xl p-4 text-center"
      style={{ backgroundColor: 'var(--color-surface)' }}
    >
      <p className="text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>
        {label}
      </p>
      <p className="text-3xl font-bold" style={{ color: 'var(--color-accent)' }}>
        {value}
        {unit && <span className="text-lg font-normal ml-1">{unit}</span>}
      </p>
    </div>
  )
}

function RerollSelect({ value, onChange }: { value: RerollMode; onChange: (v: RerollMode) => void }) {
  const options: { value: RerollMode; label: string }[] = [
    { value: 'none', label: 'Aucune' },
    { value: 'ones', label: 'Relance les 1' },
    { value: 'all-failures', label: 'Relance les échecs' },
  ]

  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
        Relance
      </label>
      <div className="flex gap-1">
        {options.map((opt) => (
          <button
            key={opt.value}
            className="flex-1 rounded-lg border-none cursor-pointer text-xs font-medium py-2 px-1"
            style={{
              backgroundColor: value === opt.value ? 'var(--color-accent)' : 'var(--color-surface)',
              color: value === opt.value ? '#ffffff' : 'var(--color-text-muted)',
            }}
            onClick={() => onChange(opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function ThresholdSelect({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
        Seuil de réussite
      </label>
      <div className="flex gap-1">
        {[2, 3, 4, 5, 6].map((t) => (
          <button
            key={t}
            className="flex-1 rounded-lg border-none cursor-pointer font-semibold py-2"
            style={{
              backgroundColor: value === t ? 'var(--color-accent)' : 'var(--color-surface)',
              color: value === t ? '#ffffff' : 'var(--color-text)',
              fontSize: 'var(--text-base)',
            }}
            onClick={() => onChange(t)}
          >
            {t}+
          </button>
        ))}
      </div>
    </div>
  )
}

function DiceTab() {
  const [numDice, setNumDice] = useState(10)
  const [threshold, setThreshold] = useState(3)
  const [reroll, setReroll] = useState<RerollMode>('none')
  const [modifier, setModifier] = useState(0)

  const result = calcDiceSuccesses(numDice, threshold, reroll, modifier)

  return (
    <div className="flex flex-col gap-4">
      <NumberInput label="Nombre de dés" value={numDice} onChange={setNumDice} min={1} max={200} />
      <ThresholdSelect value={threshold} onChange={setThreshold} />
      <RerollSelect value={reroll} onChange={setReroll} />
      <NumberInput label="Modificateur" value={modifier} onChange={setModifier} min={-3} max={3} />

      <ResultBox label="Réussites attendues" value={result} />

      <div
        className="rounded-lg p-3 text-xs"
        style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text-muted)' }}
      >
        <p>
          {numDice} dés sur {threshold}+
          {modifier !== 0 && ` (modifié: ${threshold - modifier}+)`}
          {reroll !== 'none' && ` avec ${reroll === 'ones' ? 'relance des 1' : 'relance des échecs'}`}
        </p>
      </div>
    </div>
  )
}

function AverageTab() {
  const [numDice, setNumDice] = useState(5)
  const [sides, setSides] = useState(6)
  const [flatBonus, setFlatBonus] = useState(0)

  const result = calcAverageDice(numDice, sides, flatBonus)

  return (
    <div className="flex flex-col gap-4">
      <NumberInput label="Nombre de dés" value={numDice} onChange={setNumDice} min={1} max={100} />

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
          Type de dé
        </label>
        <div className="flex gap-1">
          {[3, 6].map((s) => (
            <button
              key={s}
              className="flex-1 rounded-lg border-none cursor-pointer font-semibold py-2"
              style={{
                backgroundColor: sides === s ? 'var(--color-accent)' : 'var(--color-surface)',
                color: sides === s ? '#ffffff' : 'var(--color-text)',
                fontSize: 'var(--text-base)',
              }}
              onClick={() => setSides(s)}
            >
              D{s}
            </button>
          ))}
        </div>
      </div>

      <NumberInput label="Bonus fixe (+)" value={flatBonus} onChange={setFlatBonus} min={0} max={50} />

      <ResultBox
        label={`Moyenne de ${numDice}D${sides}${flatBonus > 0 ? `+${flatBonus}` : ''}`}
        value={result}
      />

      <div
        className="rounded-lg p-3 text-xs"
        style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text-muted)' }}
      >
        <p>
          Moyenne par D{sides} = {(sides + 1) / 2}
          {flatBonus > 0 && ` | Bonus fixe: +${flatBonus}`}
        </p>
        <p className="mt-1">
          Min: {numDice + flatBonus} | Max: {numDice * sides + flatBonus}
        </p>
      </div>
    </div>
  )
}

function ChargeTab() {
  const [distance, setDistance] = useState(9)
  const [bonus, setBonus] = useState(0)
  const [reroll, setReroll] = useState(false)

  const result = calcChargeSuccess(distance, bonus, reroll)
  const distribution = calc2D6Distribution()

  const effectiveTarget = distance - bonus

  return (
    <div className="flex flex-col gap-4">
      <NumberInput label="Distance (pouces)" value={distance} onChange={setDistance} min={1} max={24} />
      <NumberInput label="Bonus à la charge" value={bonus} onChange={setBonus} min={0} max={6} />

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
          Relance de charge
        </label>
        <div className="flex gap-1">
          {[false, true].map((v) => (
            <button
              key={String(v)}
              className="flex-1 rounded-lg border-none cursor-pointer text-sm font-medium py-2"
              style={{
                backgroundColor: reroll === v ? 'var(--color-accent)' : 'var(--color-surface)',
                color: reroll === v ? '#ffffff' : 'var(--color-text-muted)',
              }}
              onClick={() => setReroll(v)}
            >
              {v ? 'Oui' : 'Non'}
            </button>
          ))}
        </div>
      </div>

      <ResultBox label="Chance de réussite" value={result} unit="%" />

      {/* Distribution table */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: 'var(--color-surface)' }}>
        <p
          className="text-xs font-medium px-3 pt-3 pb-1"
          style={{ color: 'var(--color-text-muted)' }}
        >
          Distribution 2D6
        </p>
        <table className="w-full text-xs" style={{ color: 'var(--color-text)' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--color-bg)' }}>
              <th className="text-left px-3 py-1.5">Résultat</th>
              <th className="text-right px-3 py-1.5">Proba</th>
              <th className="text-right px-3 py-1.5">Cumul ≥</th>
            </tr>
          </thead>
          <tbody>
            {distribution.map((row) => {
              const isTarget = row.value === effectiveTarget
              const isSuccess = row.value >= effectiveTarget
              return (
                <tr
                  key={row.value}
                  style={{
                    borderBottom: '1px solid var(--color-bg)',
                    backgroundColor: isTarget
                      ? 'color-mix(in srgb, var(--color-accent) 20%, transparent)'
                      : undefined,
                  }}
                >
                  <td
                    className="px-3 py-1.5 font-medium"
                    style={{
                      color: isSuccess ? 'var(--color-success)' : 'var(--color-text-muted)',
                    }}
                  >
                    {row.value}
                    {isTarget && ' ←'}
                  </td>
                  <td className="text-right px-3 py-1.5">{row.probability}%</td>
                  <td
                    className="text-right px-3 py-1.5 font-medium"
                    style={{
                      color: isSuccess ? 'var(--color-success)' : 'var(--color-text-muted)',
                    }}
                  >
                    {/* Cumulative >= this value = 100 - cumulative of (value-1) */}
                    {row.value === 2
                      ? '100'
                      : Math.round(
                          (100 - (distribution.find((d) => d.value === row.value - 1)?.cumulative ?? 0)) * 100,
                        ) / 100}
                    %
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function CalculatorPage() {
  const [activeTab, setActiveTab] = useState<Tab>('dice')

  return (
    <div>
      <h1
        className="text-2xl font-bold mb-4"
        style={{ fontSize: 'var(--text-2xl)', color: 'var(--color-text)' }}
      >
        Calculateur
      </h1>

      {/* Tab bar */}
      <div
        className="flex rounded-xl p-1 mb-4"
        style={{ backgroundColor: 'var(--color-surface)' }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className="flex-1 rounded-lg border-none cursor-pointer font-semibold py-2 text-sm"
            style={{
              backgroundColor: activeTab === tab.id ? 'var(--color-accent)' : 'transparent',
              color: activeTab === tab.id ? '#ffffff' : 'var(--color-text-muted)',
              transition: 'all 0.2s ease',
            }}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'dice' && <DiceTab />}
      {activeTab === 'average' && <AverageTab />}
      {activeTab === 'charge' && <ChargeTab />}
    </div>
  )
}

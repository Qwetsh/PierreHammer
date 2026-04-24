import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import {
  calcDiceSuccesses,
  calcAverageDice,
  calcChargeSuccess,
  calc2D6Distribution,
  type RerollMode,
} from '@/utils/diceCalculator'

type Tab = 'dice' | 'average' | 'charge'

const tabs: { id: Tab; label: string }[] = [
  { id: 'dice', label: 'Des' },
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
            width: '36px',
            height: '36px',
            backgroundColor: 'var(--color-surface)',
            color: 'var(--color-text)',
          }}
          onClick={() => onChange(Math.max(min, value - step))}
        >
          -
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
            width: '56px',
            height: '36px',
            backgroundColor: 'var(--color-surface)',
            color: 'var(--color-text)',
            fontSize: 'var(--text-base)',
          }}
        />
        <button
          className="flex items-center justify-center rounded-lg border-none cursor-pointer font-bold text-lg"
          style={{
            width: '36px',
            height: '36px',
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
      className="rounded-xl p-3 text-center"
      style={{ backgroundColor: 'var(--color-surface)' }}
    >
      <p className="text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>
        {label}
      </p>
      <p className="text-2xl font-bold" style={{ color: 'var(--color-accent)' }}>
        {value}
        {unit && <span className="text-sm font-normal ml-1">{unit}</span>}
      </p>
    </div>
  )
}

function RerollSelect({ value, onChange }: { value: RerollMode; onChange: (v: RerollMode) => void }) {
  const options: { value: RerollMode; label: string }[] = [
    { value: 'none', label: 'Aucune' },
    { value: 'ones', label: 'Relance 1' },
    { value: 'all-failures', label: 'Tous' },
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
        Seuil
      </label>
      <div className="flex gap-1">
        {[2, 3, 4, 5, 6].map((t) => (
          <button
            key={t}
            className="flex-1 rounded-lg border-none cursor-pointer font-semibold py-2"
            style={{
              backgroundColor: value === t ? 'var(--color-accent)' : 'var(--color-surface)',
              color: value === t ? '#ffffff' : 'var(--color-text)',
              fontSize: 'var(--text-sm)',
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
    <div className="flex flex-col gap-3">
      <NumberInput label="Nombre de des" value={numDice} onChange={setNumDice} min={1} max={200} />
      <ThresholdSelect value={threshold} onChange={setThreshold} />
      <RerollSelect value={reroll} onChange={setReroll} />
      <NumberInput label="Modificateur" value={modifier} onChange={setModifier} min={-3} max={3} />
      <ResultBox label="Reussites attendues" value={result} />
    </div>
  )
}

function AverageTab() {
  const [numDice, setNumDice] = useState(5)
  const [sides, setSides] = useState(6)
  const [flatBonus, setFlatBonus] = useState(0)

  const result = calcAverageDice(numDice, sides, flatBonus)

  return (
    <div className="flex flex-col gap-3">
      <NumberInput label="Nombre de des" value={numDice} onChange={setNumDice} min={1} max={100} />

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
          Type de de
        </label>
        <div className="flex gap-1">
          {[3, 6].map((s) => (
            <button
              key={s}
              className="flex-1 rounded-lg border-none cursor-pointer font-semibold py-2"
              style={{
                backgroundColor: sides === s ? 'var(--color-accent)' : 'var(--color-surface)',
                color: sides === s ? '#ffffff' : 'var(--color-text)',
                fontSize: 'var(--text-sm)',
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
    <div className="flex flex-col gap-3">
      <NumberInput label="Distance (pouces)" value={distance} onChange={setDistance} min={1} max={24} />
      <NumberInput label="Bonus a la charge" value={bonus} onChange={setBonus} min={0} max={6} />

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
          Relance de charge
        </label>
        <div className="flex gap-1">
          {[false, true].map((v) => (
            <button
              key={String(v)}
              className="flex-1 rounded-lg border-none cursor-pointer text-xs font-medium py-2"
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

      <ResultBox label="Chance de reussite" value={result} unit="%" />

      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: 'var(--color-surface)' }}>
        <p className="text-xs font-medium px-3 pt-2 pb-1" style={{ color: 'var(--color-text-muted)' }}>
          Distribution 2D6
        </p>
        <table className="w-full text-xs" style={{ color: 'var(--color-text)' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--color-bg)' }}>
              <th className="text-left px-3 py-1">Res.</th>
              <th className="text-right px-3 py-1">Proba</th>
              <th className="text-right px-3 py-1">Cumul</th>
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
                    className="px-3 py-1 font-medium"
                    style={{ color: isSuccess ? 'var(--color-success)' : 'var(--color-text-muted)' }}
                  >
                    {row.value}{isTarget && ' <'}
                  </td>
                  <td className="text-right px-3 py-1">{row.probability}%</td>
                  <td
                    className="text-right px-3 py-1 font-medium"
                    style={{ color: isSuccess ? 'var(--color-success)' : 'var(--color-text-muted)' }}
                  >
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

export function CalculatorModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<Tab>('dice')

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            data-scroll-lock
            className="fixed inset-0 z-[60]"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
            onClick={onClose}
          />

          {/* Modal panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed z-[61] overflow-y-auto"
            style={{
              top: 0,
              right: 0,
              bottom: 0,
              width: '340px',
              maxWidth: '90vw',
              backgroundColor: 'var(--color-bg)',
              borderLeft: '1px solid var(--color-border)',
              boxShadow: '-8px 0 30px rgba(0, 0, 0, 0.4)',
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-4 py-3 sticky top-0 z-10"
              style={{
                backgroundColor: 'var(--color-bg)',
                borderBottom: '1px solid var(--color-border)',
              }}
            >
              <h2
                className="text-base font-bold m-0"
                style={{ color: 'var(--color-text)', fontFamily: 'var(--font-display)' }}
              >
                Calculateur
              </h2>
              <button
                onClick={onClose}
                className="flex items-center justify-center border-none cursor-pointer rounded-lg"
                style={{
                  width: '32px',
                  height: '32px',
                  backgroundColor: 'var(--color-surface)',
                  color: 'var(--color-text-muted)',
                  fontSize: '18px',
                }}
              >
                X
              </button>
            </div>

            {/* Content */}
            <div className="p-4">
              {/* Tab bar */}
              <div
                className="flex rounded-xl p-1 mb-4"
                style={{ backgroundColor: 'var(--color-surface)' }}
              >
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    className="flex-1 rounded-lg border-none cursor-pointer font-semibold py-2 text-xs"
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
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

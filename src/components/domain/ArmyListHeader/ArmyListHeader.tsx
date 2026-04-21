import { useState } from 'react'
import { PointsCounter } from '@/components/domain/PointsCounter'
import type { ValidationResult } from '@/features/army-list/utils/validateArmyList'

interface ArmyListHeaderProps {
  name: string
  factionId: string
  detachment: string
  currentPoints: number
  pointsLimit: number
  squadCount: number
  validation?: ValidationResult
  onBack: () => void
  onEdit: () => void
}

export function ArmyListHeader({
  name,
  factionId,
  detachment,
  currentPoints,
  pointsLimit,
  squadCount,
  validation,
  onBack,
  onEdit,
}: ArmyListHeaderProps) {
  const [showViolations, setShowViolations] = useState(false)
  const isValid = !validation || validation.valid

  return (
    <div
      className="sticky top-0 z-10 px-4 pb-2"
      style={{
        backgroundColor: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-bg)',
      }}
    >
      {/* Top row: back + name + edit */}
      <div className="flex items-center gap-2" style={{ minHeight: '40px', padding: '6px 0' }}>
        <button
          className="text-sm border-none bg-transparent cursor-pointer shrink-0"
          style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-body)' }}
          onClick={onBack}
        >
          ←
        </button>

        <h1
          className="flex-1 font-bold truncate"
          style={{ color: 'var(--color-text)', fontSize: 'var(--text-lg)', fontFamily: 'var(--font-display)', margin: 0 }}
        >
          {name}
        </h1>

        <button
          className="text-xs border-none bg-transparent cursor-pointer shrink-0"
          style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-body)' }}
          onClick={onEdit}
        >
          Modifier
        </button>
      </div>

      {/* Info row: faction · detachment | validity dot | points */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs truncate" style={{ color: 'var(--color-text-muted)' }}>
            {factionId} · {detachment}
          </span>
          <button
            className="shrink-0 border-none bg-transparent cursor-pointer p-0 flex items-center"
            style={{ lineHeight: 0 }}
            onClick={() => !isValid && setShowViolations((v) => !v)}
            title={isValid ? 'Liste valide' : 'Voir les erreurs'}
          >
            <span
              style={{
                display: 'inline-block',
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: isValid ? 'var(--color-success)' : 'var(--color-error)',
                boxShadow: `0 0 6px ${isValid ? 'var(--color-success)' : 'var(--color-error)'}`,
              }}
            />
          </button>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            {squadCount} esc.
          </span>
          <PointsCounter current={currentPoints} limit={pointsLimit} />
        </div>
      </div>

      {/* Violations (toggle) */}
      {showViolations && validation && !validation.valid && (
        <div className="pt-2 flex flex-col gap-1">
          {validation.violations.map((v, i) => (
            <div
              key={i}
              className="text-xs px-2 py-1 rounded"
              style={{
                backgroundColor: v.severity === 'error' ? 'rgba(244,67,54,0.15)' : 'rgba(255,152,0,0.15)',
                color: v.severity === 'error' ? 'var(--color-error)' : 'var(--color-warning)',
              }}
            >
              {v.message}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

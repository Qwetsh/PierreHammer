import { PointsCounter } from '@/components/domain/PointsCounter'
import type { ValidationResult } from '@/features/army-list/utils/validateArmyList'

interface ArmyListHeaderProps {
  name: string
  factionId: string
  detachment: string
  currentPoints: number
  pointsLimit: number
  validation?: ValidationResult
}

export function ArmyListHeader({ name, factionId, detachment, currentPoints, pointsLimit, validation }: ArmyListHeaderProps) {
  return (
    <div
      className="sticky top-0 z-10 px-4"
      style={{
        backgroundColor: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-bg)',
      }}
    >
      <div className="flex items-center justify-between gap-2" style={{ minHeight: '48px', padding: '8px 0' }}>
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm truncate" style={{ color: 'var(--color-text)' }}>
              {name}
            </span>
            {validation && (
              <span
                className="text-xs px-1.5 py-0.5 rounded font-medium shrink-0"
                style={{
                  backgroundColor: validation.valid ? 'var(--color-success)' : 'var(--color-error)',
                  color: '#ffffff',
                  fontSize: '0.6rem',
                }}
              >
                {validation.valid ? 'Valide' : 'Invalide'}
              </span>
            )}
          </div>
          <span className="text-xs truncate" style={{ color: 'var(--color-text-muted)' }}>
            {factionId} · {detachment}
          </span>
        </div>
        <PointsCounter current={currentPoints} limit={pointsLimit} />
      </div>
      {validation && !validation.valid && (
        <div className="pb-2 flex flex-col gap-1">
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

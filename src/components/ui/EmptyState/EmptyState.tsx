import type { ReactNode } from 'react'
import { Button } from '@/components/ui/Button'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
}

export function EmptyState({ icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12 px-6 text-center">
      {icon && (
        <div style={{ color: 'var(--color-text-muted)', fontSize: '3rem' }}>
          {icon}
        </div>
      )}
      <h2 className="font-semibold" style={{ color: 'var(--color-text)', fontSize: 'var(--text-xl)' }}>
        {title}
      </h2>
      <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-base)', maxWidth: '320px' }}>
        {description}
      </p>
      {actionLabel && onAction && (
        <Button variant="primary" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  )
}

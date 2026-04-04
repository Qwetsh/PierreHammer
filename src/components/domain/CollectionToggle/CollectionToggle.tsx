export type CollectionView = 'owned' | 'all'

interface CollectionToggleProps {
  value: CollectionView
  onChange: (value: CollectionView) => void
}

export function CollectionToggle({ value, onChange }: CollectionToggleProps) {
  return (
    <div
      className="inline-flex rounded-lg overflow-hidden"
      role="radiogroup"
      aria-label="Vue de la collection"
      style={{ border: '1px solid var(--color-surface)' }}
    >
      <button
        role="radio"
        aria-checked={value === 'owned'}
        onClick={() => onChange('owned')}
        className="px-4 py-2 text-sm font-medium min-h-[44px] cursor-pointer border-none"
        style={{
          backgroundColor: value === 'owned' ? 'var(--color-primary)' : 'var(--color-surface)',
          color: value === 'owned' ? '#ffffff' : 'var(--color-text)',
        }}
      >
        Ma collection
      </button>
      <button
        role="radio"
        aria-checked={value === 'all'}
        onClick={() => onChange('all')}
        className="px-4 py-2 text-sm font-medium min-h-[44px] cursor-pointer border-none"
        style={{
          backgroundColor: value === 'all' ? 'var(--color-primary)' : 'var(--color-surface)',
          color: value === 'all' ? '#ffffff' : 'var(--color-text)',
        }}
      >
        Tout
      </button>
    </div>
  )
}

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function SearchBar({ value, onChange, placeholder = 'Rechercher...' }: SearchBarProps) {
  return (
    <div
      className="flex items-center gap-2 rounded-lg px-3 py-2"
      style={{ backgroundColor: 'var(--color-surface)' }}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ color: 'var(--color-text-muted)', flexShrink: 0 }}
      >
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 bg-transparent outline-none min-h-[44px]"
        style={{ color: 'var(--color-text)' }}
        aria-label={placeholder}
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="flex items-center justify-center min-h-[44px] min-w-[44px] cursor-pointer bg-transparent border-none"
          style={{ color: 'var(--color-text-muted)' }}
          aria-label="Effacer la recherche"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}
    </div>
  )
}

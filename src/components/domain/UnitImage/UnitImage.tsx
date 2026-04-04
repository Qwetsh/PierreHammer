import { useState, useCallback } from 'react'

interface UnitImageProps {
  src?: string
  alt: string
  size?: 'sm' | 'md' | 'lg'
}

const sizeStyles: Record<string, { width: string; height: string }> = {
  sm: { width: '48px', height: '48px' },
  md: { width: '80px', height: '80px' },
  lg: { width: '120px', height: '120px' },
}

export function UnitImage({ src, alt, size = 'sm' }: UnitImageProps) {
  const [hasError, setHasError] = useState(false)
  const dimensions = sizeStyles[size]

  const handleError = useCallback(() => {
    setHasError(true)
  }, [])

  if (!src || hasError) {
    return (
      <div
        className="flex items-center justify-center rounded"
        style={{
          ...dimensions,
          backgroundColor: 'var(--color-surface)',
          color: 'var(--color-text-muted)',
          fontSize: size === 'sm' ? '0.6rem' : '0.75rem',
        }}
        role="img"
        aria-label={alt}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <path d="M21 15l-5-5L5 21" />
        </svg>
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={handleError}
      className="rounded object-cover"
      style={dimensions}
    />
  )
}

import { useState, useRef, useEffect } from 'react'
import { useTranslationStore } from '@/stores/translationStore'
import type { TranslationCategory } from '@/types/translation.types'

interface TranslatableTextProps {
  /** The original English text (used as key and fallback) */
  text: string
  /** Translation category for scoped lookup and storage */
  category: TranslationCategory
  /** Optional className to apply to the wrapper span */
  className?: string
  /** Optional inline style */
  style?: React.CSSProperties
}

/**
 * Displays translated text with inline editing support.
 *
 * - Always shows the translated version if available, otherwise the English original.
 * - When editMode is active (desktop only), shows a subtle indicator.
 * - Click to edit: opens an inline input to set/update the translation.
 * - The English key is never modified — only the display text changes.
 *
 * Usage:
 *   <T text="Bolt Rifle" category="weapon" className="font-bold" />
 */
export function T({ text, category, className, style }: TranslatableTextProps) {
  const t = useTranslationStore((s) => s.t)
  const editMode = useTranslationStore((s) => s.editMode)
  const setTranslation = useTranslationStore((s) => s.setTranslation)
  const removeTranslation = useTranslationStore((s) => s.removeTranslation)

  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const translated = t(text, category)
  const isTranslated = translated !== text

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editing])

  const handleStartEdit = () => {
    if (!editMode) return
    setDraft(isTranslated ? translated : '')
    setEditing(true)
  }

  const handleSave = async () => {
    const trimmed = draft.trim()
    if (trimmed && trimmed !== text) {
      await setTranslation(category, text, trimmed)
    } else if (!trimmed && isTranslated) {
      // Empty input = revert to English
      await removeTranslation(category, text)
    }
    setEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave()
    if (e.key === 'Escape') setEditing(false)
  }

  // Editing mode: inline input
  if (editing) {
    return (
      <span className={className} style={{ ...style, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
        <input
          ref={inputRef}
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          placeholder={text}
          className="border-none outline-none rounded px-1 py-0.5 text-inherit"
          style={{
            backgroundColor: 'rgba(255,255,255,0.1)',
            color: 'inherit',
            font: 'inherit',
            minWidth: '60px',
            width: `${Math.max(draft.length, text.length) + 2}ch`,
          }}
        />
      </span>
    )
  }

  // Edit mode active but not editing this item: show indicator
  if (editMode) {
    return (
      <span
        className={className}
        style={{
          ...style,
          cursor: 'pointer',
          borderBottom: isTranslated
            ? '1px dashed rgba(80, 200, 120, 0.4)'
            : '1px dashed rgba(255, 180, 50, 0.5)',
        }}
        onClick={handleStartEdit}
        title={isTranslated ? `EN: ${text} → FR: ${translated}` : `Non traduit: ${text} (cliquer pour traduire)`}
      >
        {translated}
      </span>
    )
  }

  // Normal display: just show translated text
  return (
    <span className={className} style={style}>
      {translated}
    </span>
  )
}

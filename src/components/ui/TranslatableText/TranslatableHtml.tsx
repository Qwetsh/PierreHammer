import { useState, useRef, useEffect } from 'react'
import { useTranslationStore } from '@/stores/translationStore'
import { sanitizeHtml } from '@/utils/sanitizeHtml'
import type { TranslationCategory } from '@/types/translation.types'

interface TranslatableHtmlProps {
  /** The original English HTML content (used as key and fallback) */
  html: string
  /** Translation category for scoped lookup and storage */
  category: TranslationCategory
  /** Optional className for the wrapper element */
  className?: string
  /** Optional inline style */
  style?: React.CSSProperties
}

/**
 * Strips HTML tags from a string (for display in textarea).
 */
function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

/**
 * Generates a short stable key from the HTML content.
 * Uses the first 80 chars of stripped text as the translation key,
 * so we don't store massive HTML blobs as keys.
 */
function makeKey(html: string): string {
  return stripHtml(html).slice(0, 80)
}

/**
 * Displays translated HTML content with modal editing support.
 *
 * - The original English HTML is NEVER modified — combat parsers still read it.
 * - Translation is stored against a short text key derived from the original.
 * - In edit mode, clicking opens a textarea modal for entering the French translation.
 * - The translated text is rendered as sanitized HTML.
 */
export function THtml({ html, category, className, style }: TranslatableHtmlProps) {
  const t = useTranslationStore((s) => s.t)
  const editMode = useTranslationStore((s) => s.editMode)
  const setTranslation = useTranslationStore((s) => s.setTranslation)
  const removeTranslation = useTranslationStore((s) => s.removeTranslation)

  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const key = makeKey(html)
  const translated = t(key, category)
  const isTranslated = translated !== key

  // The display HTML: either the translated plain text or the original HTML
  const displayHtml = isTranslated ? translated : html

  useEffect(() => {
    if (editing && textareaRef.current) {
      textareaRef.current.focus()
      textareaRef.current.select()
    }
  }, [editing])

  const handleStartEdit = () => {
    if (!editMode) return
    setDraft(isTranslated ? translated : stripHtml(html))
    setEditing(true)
  }

  const handleSave = async () => {
    const trimmed = draft.trim()
    if (trimmed && trimmed !== key && trimmed !== stripHtml(html)) {
      await setTranslation(category, key, trimmed)
    } else if (!trimmed && isTranslated) {
      await removeTranslation(category, key)
    }
    setEditing(false)
  }

  // Editing modal
  if (editing) {
    return (
      <>
        <p
          className={className}
          style={{ ...style, opacity: 0.5 }}
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) }}
        />
        <div
          data-scroll-lock
          className="fixed inset-0 z-[90] flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
          onClick={() => setEditing(false)}
        >
          <div
            className="w-full max-w-lg rounded-xl p-5"
            style={{ backgroundColor: 'var(--color-bg)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-bold text-sm mb-2" style={{ color: 'var(--color-text)' }}>
              Traduire le texte
            </h3>
            <p className="text-xs mb-3" style={{ color: 'var(--color-text-muted)' }}>
              Original : {stripHtml(html).slice(0, 120)}...
            </p>
            <textarea
              ref={textareaRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={5}
              className="w-full rounded-lg px-3 py-2 text-sm border-none outline-none resize-y"
              style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
              placeholder="Traduction française..."
            />
            <div className="flex gap-2 mt-3">
              <button
                className="px-4 py-2 rounded-lg text-sm font-medium border-none cursor-pointer"
                style={{ backgroundColor: 'var(--color-accent)', color: '#fff' }}
                onClick={handleSave}
              >
                Enregistrer
              </button>
              <button
                className="px-4 py-2 rounded-lg text-sm font-medium border-none cursor-pointer"
                style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text-muted)' }}
                onClick={() => setEditing(false)}
              >
                Annuler
              </button>
              {isTranslated && (
                <button
                  className="px-4 py-2 rounded-lg text-sm font-medium border-none cursor-pointer ml-auto"
                  style={{ backgroundColor: 'transparent', color: 'var(--color-error, #ef4444)' }}
                  onClick={async () => {
                    await removeTranslation(category, key)
                    setEditing(false)
                  }}
                >
                  Supprimer
                </button>
              )}
            </div>
          </div>
        </div>
      </>
    )
  }

  // Edit mode active: show clickable indicator
  if (editMode) {
    return (
      <p
        className={className}
        style={{
          ...style,
          cursor: 'pointer',
          borderBottom: isTranslated
            ? '1px dashed rgba(80, 200, 120, 0.4)'
            : '1px dashed rgba(255, 180, 50, 0.5)',
        }}
        onClick={handleStartEdit}
        title={isTranslated ? 'Traduction existante (cliquer pour modifier)' : 'Non traduit (cliquer pour traduire)'}
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(displayHtml) }}
      />
    )
  }

  // Normal display
  return (
    <p
      className={className}
      style={style}
      dangerouslySetInnerHTML={{ __html: sanitizeHtml(displayHtml) }}
    />
  )
}

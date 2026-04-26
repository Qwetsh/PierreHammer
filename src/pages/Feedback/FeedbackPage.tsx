import { useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { submitFeedback } from '@/services/feedbackService'
import { HudTopBar, MTopBar, HudBtn } from '@/components/ui/Hud'

const KOFI_URL = 'https://ko-fi.com/charlesthomas97312'
const SPONSOR_URL = 'https://github.com/sponsors/qwetsh'

function useIsDesktop(breakpoint = 1024) {
  const [v, setV] = useState(() => typeof window !== 'undefined' ? window.innerWidth >= breakpoint : false)
  useState(() => {
    const mql = window.matchMedia(`(min-width: ${breakpoint}px)`)
    const h = (e: MediaQueryListEvent) => setV(e.matches)
    mql.addEventListener('change', h)
    return () => mql.removeEventListener('change', h)
  })
  return v
}

export function FeedbackPage() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const isDesktop = useIsDesktop()

  const [type, setType] = useState<'bug' | 'suggestion'>('suggestion')
  const [message, setMessage] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showKofi, setShowKofi] = useState(false)

  const handleSubmit = async () => {
    if (!message.trim()) return
    setSending(true)
    setError(null)
    try {
      await submitFeedback({ type, message: message.trim(), contactEmail: contactEmail.trim() || undefined })
      setSent(true)
      setMessage('')
      setContactEmail('')
    } catch (e) {
      setError('Erreur lors de l\'envoi. Reessaye plus tard.')
      console.error(e)
    } finally {
      setSending(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    fontSize: 13,
    fontFamily: 'var(--font-mono)',
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    color: 'var(--color-text)',
    outline: 'none',
    colorScheme: 'dark',
  }

  const labelStyle: React.CSSProperties = {
    fontSize: 9,
    fontFamily: 'var(--font-mono)',
    letterSpacing: 1,
    color: 'var(--color-text-muted)',
    textTransform: 'uppercase',
    marginBottom: 6,
    display: 'block',
  }

  return (
    <>
      {isDesktop ? (
        <HudTopBar title="Feedback & Soutien" sub="Communaute" />
      ) : (
        <MTopBar title="Feedback & Soutien" sub="Communaute" />
      )}

      <div style={{
        maxWidth: 640,
        margin: '0 auto',
        padding: isDesktop ? '24px 0' : '16px 0',
      }}>
        {/* === DONATION SECTION === */}
        <div style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderLeft: '3px solid var(--color-accent)',
          padding: isDesktop ? '20px 24px' : '16px',
          marginBottom: 20,
        }}>
          <div style={{
            fontSize: 9,
            fontFamily: 'var(--font-mono)',
            letterSpacing: 2,
            color: 'var(--color-accent)',
            textTransform: 'uppercase',
            marginBottom: 10,
          }}>
            Soutenir PierreHammer
          </div>
          <p style={{ fontSize: 13, color: 'var(--color-text)', lineHeight: 1.6, margin: '0 0 8px' }}>
            PierreHammer est un projet gratuit et open-source, developpe sur mon temps libre.
          </p>
          <p style={{ fontSize: 13, color: 'var(--color-text)', lineHeight: 1.6, margin: '0 0 8px' }}>
            Entre l'hebergement, la base de donnees et les differents services, cette app et mes autres projets me coutent environ <strong style={{ color: 'var(--color-accent)' }}>100{'\u00a0'}EUR/mois</strong> de ma poche.
          </p>
          <p style={{ fontSize: 13, color: 'var(--color-text)', lineHeight: 1.6, margin: '0 0 16px' }}>
            Si l'app te plait et que tu veux m'aider a la maintenir en ligne, un petit don fait une vraie difference !
          </p>
          <button
            onClick={() => setShowKofi(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 20px',
              background: 'var(--color-accent)',
              color: '#000',
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: 0.5,
              border: 'none',
              cursor: 'pointer',
            }}
          >
            {'\u2665'} Faire un don sur Ko-fi
          </button>
          <div style={{ marginTop: 10 }}>
            <a
              href={SPONSOR_URL}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: 10,
                fontFamily: 'var(--font-mono)',
                color: 'var(--color-text-muted)',
                textDecoration: 'underline',
              }}
            >
              Aussi disponible sur GitHub Sponsors
            </a>
          </div>
        </div>

        {/* === FEEDBACK SECTION === */}
        <div style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          padding: isDesktop ? '20px 24px' : '16px',
        }}>
          <div style={{
            fontSize: 9,
            fontFamily: 'var(--font-mono)',
            letterSpacing: 2,
            color: 'var(--color-accent)',
            textTransform: 'uppercase',
            marginBottom: 14,
          }}>
            Signaler un bug ou proposer une idee
          </div>

          {!isAuthenticated ? (
            <p style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
              Connecte-toi pour envoyer un retour.
            </p>
          ) : sent ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>{'\u2713'}</div>
              <p style={{ fontSize: 13, color: 'var(--color-text)', marginBottom: 12 }}>
                Merci pour ton retour ! Je le lirai attentivement.
              </p>
              <HudBtn variant="ghost" onClick={() => setSent(false)}>Envoyer un autre retour</HudBtn>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Type selector */}
              <div>
                <span style={labelStyle}>Type</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => setType('bug')}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      fontSize: 11,
                      fontFamily: 'var(--font-mono)',
                      letterSpacing: 0.5,
                      border: '1px solid var(--color-border)',
                      cursor: 'pointer',
                      background: type === 'bug' ? 'var(--color-error, #ef4444)' : 'transparent',
                      color: type === 'bug' ? '#fff' : 'var(--color-text-muted)',
                    }}
                  >
                    {'\uD83D\uDC1B'} Bug
                  </button>
                  <button
                    onClick={() => setType('suggestion')}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      fontSize: 11,
                      fontFamily: 'var(--font-mono)',
                      letterSpacing: 0.5,
                      border: '1px solid var(--color-border)',
                      cursor: 'pointer',
                      background: type === 'suggestion' ? 'var(--color-accent)' : 'transparent',
                      color: type === 'suggestion' ? '#000' : 'var(--color-text-muted)',
                    }}
                  >
                    {'\uD83D\uDCA1'} Suggestion
                  </button>
                </div>
              </div>

              {/* Message */}
              <div>
                <span style={labelStyle}>Message</span>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={type === 'bug' ? 'Decris le bug rencontre...' : 'Decris ton idee ou suggestion...'}
                  rows={5}
                  style={{ ...inputStyle, resize: 'vertical', minHeight: 100 }}
                />
              </div>

              {/* Contact email — only for anonymous users */}
              {!isAuthenticated && (
                <div>
                  <span style={labelStyle}>Email de contact (optionnel)</span>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="Pour que je puisse te repondre"
                    style={inputStyle}
                  />
                </div>
              )}

              {error && (
                <p style={{ fontSize: 11, color: 'var(--color-error, #ef4444)', margin: 0 }}>{error}</p>
              )}

              <HudBtn
                variant="primary"
                onClick={handleSubmit}
                disabled={!message.trim() || sending}
              >
                {sending ? 'Envoi...' : 'Envoyer'}
              </HudBtn>
            </div>
          )}
        </div>
      </div>

      {/* Ko-fi modal */}
      {showKofi && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 70,
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={() => setShowKofi(false)}
        >
          <div
            style={{
              background: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              width: isDesktop ? '480px' : '95%',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 16px',
              borderBottom: '1px solid var(--color-border)',
            }}>
              <span style={{
                fontSize: 10,
                fontFamily: 'var(--font-mono)',
                letterSpacing: 1,
                color: 'var(--color-accent)',
                textTransform: 'uppercase',
              }}>
                Soutenir PierreHammer
              </span>
              <button
                onClick={() => setShowKofi(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-text-muted)',
                  fontSize: 18,
                  cursor: 'pointer',
                  padding: '4px 8px',
                }}
              >
                {'\u2715'}
              </button>
            </div>
            <iframe
              src={`${KOFI_URL}?hidefeed=true&widget=true&embed=true`}
              style={{
                border: 'none',
                width: '100%',
                height: isDesktop ? '680px' : '600px',
                background: '#fff',
              }}
              title="Ko-fi"
            />
          </div>
        </div>
      )}
    </>
  )
}

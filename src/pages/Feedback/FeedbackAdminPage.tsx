import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { useAuthStore } from '@/stores/authStore'
import { fetchAllFeedbacks, updateFeedbackStatus, type Feedback } from '@/services/feedbackService'
import { HudTopBar, MTopBar, HudBtn } from '@/components/ui/Hud'

const ADMIN_EMAIL = 'tomicharles@gmail.com'

const statusColors: Record<Feedback['status'], string> = {
  new: 'var(--color-accent)',
  read: 'var(--color-warning, #f59e0b)',
  done: 'var(--color-success, #22c55e)',
  dismissed: 'var(--color-text-muted)',
}

const statusLabels: Record<Feedback['status'], string> = {
  new: 'NOUVEAU',
  read: 'LU',
  done: 'TRAITE',
  dismissed: 'ECARTE',
}

const allStatuses: Feedback['status'][] = ['new', 'read', 'done', 'dismissed']

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

export function FeedbackAdminPage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const isDesktop = useIsDesktop()

  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<Feedback['status'] | 'all'>('all')

  const isAdmin = user?.email === ADMIN_EMAIL

  useEffect(() => {
    if (!isAdmin) return
    setLoading(true)
    fetchAllFeedbacks()
      .then(setFeedbacks)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [isAdmin])

  if (!isAdmin) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-text-muted)' }}>
        Acces refuse.
        <br />
        <HudBtn variant="ghost" onClick={() => navigate('/profile')} style={{ marginTop: 16 }}>Retour</HudBtn>
      </div>
    )
  }

  const filtered = filterStatus === 'all' ? feedbacks : feedbacks.filter((f) => f.status === filterStatus)

  const counts = feedbacks.reduce((acc, f) => {
    acc[f.status] = (acc[f.status] ?? 0) + 1
    return acc
  }, {} as Record<string, number>)

  const handleStatusChange = async (id: string, status: Feedback['status']) => {
    await updateFeedbackStatus(id, status)
    setFeedbacks((prev) => prev.map((f) => f.id === id ? { ...f, status } : f))
  }

  return (
    <>
      {isDesktop ? (
        <HudTopBar title="Admin Feedbacks" sub="Dev" />
      ) : (
        <MTopBar title="Admin Feedbacks" sub="Dev" />
      )}

      <div style={{ maxWidth: 800, margin: '0 auto', padding: isDesktop ? '20px 0' : '12px 0' }}>
        {/* Stats */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          <button
            onClick={() => setFilterStatus('all')}
            style={{
              padding: '6px 12px',
              fontSize: 10,
              fontFamily: 'var(--font-mono)',
              letterSpacing: 0.5,
              border: '1px solid var(--color-border)',
              cursor: 'pointer',
              background: filterStatus === 'all' ? 'var(--color-accent)' : 'transparent',
              color: filterStatus === 'all' ? '#000' : 'var(--color-text-muted)',
            }}
          >
            TOUS ({feedbacks.length})
          </button>
          {allStatuses.map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              style={{
                padding: '6px 12px',
                fontSize: 10,
                fontFamily: 'var(--font-mono)',
                letterSpacing: 0.5,
                border: `1px solid ${statusColors[s]}`,
                cursor: 'pointer',
                background: filterStatus === s ? statusColors[s] : 'transparent',
                color: filterStatus === s ? '#000' : statusColors[s],
              }}
            >
              {statusLabels[s]} ({counts[s] ?? 0})
            </button>
          ))}
        </div>

        {loading ? (
          <p style={{ color: 'var(--color-text-muted)', fontSize: 12 }}>Chargement...</p>
        ) : filtered.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)', fontSize: 12 }}>Aucun feedback.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filtered.map((fb) => (
              <div
                key={fb.id}
                style={{
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderLeft: `3px solid ${fb.type === 'bug' ? 'var(--color-error, #ef4444)' : 'var(--color-accent)'}`,
                  padding: '12px 16px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{
                      fontSize: 9,
                      fontFamily: 'var(--font-mono)',
                      letterSpacing: 1,
                      padding: '2px 6px',
                      background: fb.type === 'bug' ? 'var(--color-error, #ef4444)' : 'var(--color-accent)',
                      color: '#000',
                      fontWeight: 600,
                    }}>
                      {fb.type === 'bug' ? 'BUG' : 'SUGGESTION'}
                    </span>
                    <span style={{
                      fontSize: 9,
                      fontFamily: 'var(--font-mono)',
                      letterSpacing: 1,
                      color: statusColors[fb.status],
                    }}>
                      {statusLabels[fb.status]}
                    </span>
                  </div>
                  <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}>
                    {new Date(fb.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <p style={{ fontSize: 13, color: 'var(--color-text)', lineHeight: 1.5, margin: '0 0 8px', whiteSpace: 'pre-wrap' }}>
                  {fb.message}
                </p>

                {(fb.user_email || fb.user_name) && (
                  <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)', marginBottom: 4 }}>
                    {fb.user_name && <span style={{ color: 'var(--color-text)' }}>{fb.user_name}</span>}
                    {fb.user_name && fb.user_email && ' — '}
                    {fb.user_email}
                  </div>
                )}
                {fb.contact_email && (
                  <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)', marginBottom: 8 }}>
                    Contact : {fb.contact_email}
                  </div>
                )}

                {/* Status actions */}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {allStatuses.filter((s) => s !== fb.status).map((s) => (
                    <button
                      key={s}
                      onClick={() => handleStatusChange(fb.id, s)}
                      style={{
                        padding: '3px 8px',
                        fontSize: 9,
                        fontFamily: 'var(--font-mono)',
                        letterSpacing: 0.5,
                        border: `1px solid ${statusColors[s]}`,
                        background: 'transparent',
                        color: statusColors[s],
                        cursor: 'pointer',
                      }}
                    >
                      {statusLabels[s]}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

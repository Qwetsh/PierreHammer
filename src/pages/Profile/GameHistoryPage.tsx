import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { useAuthStore } from '@/stores/authStore'
import { getSummariesForUser, type GameSummary } from '@/services/gameSummaryService'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'

export function GameHistoryPage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const [summaries, setSummaries] = useState<GameSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setLoading(false)
      return
    }
    getSummariesForUser(user.id).then((data) => {
      setSummaries(data)
      setLoading(false)
    })
  }, [isAuthenticated, user])

  if (!isAuthenticated) {
    return (
      <div className="p-4">
        <Button variant="ghost" onClick={() => navigate(-1)}>← Retour</Button>
        <EmptyState
          title="Connexion requise"
          description="Connecte-toi pour voir ton historique de parties."
          actionLabel="Aller au profil"
          onAction={() => navigate('/profile')}
        />
      </div>
    )
  }

  if (loading) {
    return (
      <div className="p-4">
        <Button variant="ghost" onClick={() => navigate(-1)}>← Retour</Button>
        <p className="text-sm mt-4" style={{ color: 'var(--color-text-muted)' }}>Chargement...</p>
      </div>
    )
  }

  const selected = summaries.find((s) => s.id === selectedId)

  return (
    <div className="p-4">
      <div className="flex items-center gap-3 mb-4">
        <Button variant="ghost" onClick={() => selectedId ? setSelectedId(null) : navigate(-1)}>
          ← Retour
        </Button>
        <h1 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>
          {selectedId ? 'Détail' : 'Historique des parties'}
        </h1>
      </div>

      {summaries.length === 0 && (
        <EmptyState
          title="Aucune partie"
          description="Tu n'as pas encore terminé de partie. Lance une session de jeu pour commencer !"
          actionLabel="Mes listes"
          onAction={() => navigate('/lists')}
        />
      )}

      {!selectedId && summaries.length > 0 && (
        <div className="flex flex-col gap-2">
          {summaries.map((s) => {
            const isPlayer1 = s.player1_id === user?.id
            const myFaction = isPlayer1 ? s.player1_faction : s.player2_faction
            const oppFaction = isPlayer1 ? s.player2_faction : s.player1_faction
            const myDestroyed = isPlayer1 ? s.player2_units_destroyed : s.player1_units_destroyed
            const oppDestroyed = isPlayer1 ? s.player1_units_destroyed : s.player2_units_destroyed
            const date = new Date(s.created_at)

            return (
              <button
                key={s.id}
                className="rounded-lg p-3 text-left border-none cursor-pointer"
                style={{ backgroundColor: 'var(--color-surface)' }}
                onClick={() => setSelectedId(s.id)}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                    {myFaction} vs {oppFaction}
                  </span>
                  <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    {date.toLocaleDateString('fr-FR')}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  <span>{s.duration_minutes} min</span>
                  <span>{myDestroyed} unités détruites</span>
                  <span>{oppDestroyed} unités perdues</span>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {selected && user && (
        <SummaryDetail summary={selected} userId={user.id} />
      )}
    </div>
  )
}

function SummaryDetail({ summary: s, userId }: { summary: GameSummary; userId: string }) {
  const isPlayer1 = s.player1_id === userId
  const myFaction = isPlayer1 ? s.player1_faction : s.player2_faction
  const myDetachment = isPlayer1 ? s.player1_detachment : s.player2_detachment
  const oppFaction = isPlayer1 ? s.player2_faction : s.player1_faction
  const oppDetachment = isPlayer1 ? s.player2_detachment : s.player1_detachment
  const myModels = isPlayer1 ? s.player2_models_destroyed : s.player1_models_destroyed
  const oppModels = isPlayer1 ? s.player1_models_destroyed : s.player2_models_destroyed
  const myUnits = isPlayer1 ? s.player2_units_destroyed : s.player1_units_destroyed
  const oppUnits = isPlayer1 ? s.player1_units_destroyed : s.player2_units_destroyed

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--color-surface)' }}>
        <h3 className="font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
          {myFaction} ({myDetachment}) vs {oppFaction} ({oppDetachment})
        </h3>
        <p className="text-xs mb-3" style={{ color: 'var(--color-text-muted)' }}>
          {new Date(s.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
          {' — '}{s.duration_minutes} minutes
        </p>

        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Unités détruites" value={myUnits} color="var(--color-success, #22c55e)" />
          <StatCard label="Unités perdues" value={oppUnits} color="var(--color-error, #ef4444)" />
          <StatCard label="Modèles tués" value={myModels} color="var(--color-success, #22c55e)" />
          <StatCard label="Modèles perdus" value={oppModels} color="var(--color-error, #ef4444)" />
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-lg p-3 text-center" style={{ backgroundColor: 'var(--color-bg)' }}>
      <p className="text-2xl font-bold" style={{ color }}>{value}</p>
      <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{label}</p>
    </div>
  )
}

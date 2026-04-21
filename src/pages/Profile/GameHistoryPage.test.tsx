import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { useAuthStore } from '@/stores/authStore'

const mockGetSummaries = vi.fn()

vi.mock('@/services/gameSummaryService', () => ({
  getSummariesForUser: (...args: unknown[]) => mockGetSummaries(...args),
}))

import { GameHistoryPage } from './GameHistoryPage'

function renderPage() {
  return render(
    <MemoryRouter>
      <GameHistoryPage />
    </MemoryRouter>,
  )
}

describe('GameHistoryPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetSummaries.mockResolvedValue([])
  })

  it('shows login required when not authenticated', () => {
    useAuthStore.setState({ user: null, isAuthenticated: false, loading: false })
    renderPage()
    expect(screen.getByText('Connexion requise')).toBeInTheDocument()
  })

  it('shows empty state when no summaries', async () => {
    useAuthStore.setState({ user: { id: 'u1', email: 'test@test.com' } as never, isAuthenticated: true, loading: false })
    mockGetSummaries.mockResolvedValue([])
    renderPage()
    await waitFor(() => {
      expect(screen.getByText('Aucune partie')).toBeInTheDocument()
    })
  })

  it('shows summaries list', async () => {
    useAuthStore.setState({ user: { id: 'u1', email: 'test@test.com' } as never, isAuthenticated: true, loading: false })
    mockGetSummaries.mockResolvedValue([
      {
        id: 'sum1',
        session_id: 'sess1',
        player1_id: 'u1',
        player2_id: 'u2',
        player1_faction: 'Space Marines',
        player2_faction: 'Orks',
        player1_detachment: 'Gladius',
        player2_detachment: 'Waaagh',
        duration_minutes: 90,
        player1_units_destroyed: 2,
        player2_units_destroyed: 3,
        player1_models_destroyed: 10,
        player2_models_destroyed: 15,
        created_at: '2026-04-20T10:00:00Z',
      },
    ])
    renderPage()
    await waitFor(() => {
      expect(screen.getByText(/Space Marines vs Orks/)).toBeInTheDocument()
      expect(screen.getByText(/90 min/)).toBeInTheDocument()
    })
  })

  it('shows loading state', () => {
    useAuthStore.setState({ user: { id: 'u1', email: 'test@test.com' } as never, isAuthenticated: true, loading: false })
    mockGetSummaries.mockReturnValue(new Promise(() => {})) // never resolves
    renderPage()
    expect(screen.getByText('Chargement...')).toBeInTheDocument()
  })
})

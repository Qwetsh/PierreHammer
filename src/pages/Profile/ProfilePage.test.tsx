import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { useAuthStore } from '@/stores/authStore'

// Mock supabase — default to configured
let mockIsConfigured = true
vi.mock('@/lib/supabase', () => ({
  get isSupabaseConfigured() { return mockIsConfigured },
  supabase: null,
}))

vi.mock('@/hooks/useExportImport', () => ({
  useExportImport: () => ({ exportData: vi.fn(), importData: vi.fn() }),
}))

vi.mock('@/components/ui/Toast', () => ({
  useToast: () => ({ showToast: vi.fn() }),
  ToastProvider: ({ children }: { children: React.ReactNode }) => children,
}))

vi.mock('@/stores/collectionStore', () => ({
  useCollectionStore: (sel: (s: { items: Record<string, unknown> }) => unknown) => sel({ items: {} }),
}))

vi.mock('@/stores/listsStore', () => ({
  useListsStore: (sel: (s: { lists: Record<string, unknown> }) => unknown) => sel({ lists: {} }),
}))

vi.mock('@/stores/preferencesStore', () => ({
  usePreferencesStore: (sel: (s: { colorVisionMode: string; setColorVisionMode: () => void }) => unknown) =>
    sel({ colorVisionMode: 'normal', setColorVisionMode: vi.fn() }),
}))

// Import after mocks
import { ProfilePage } from './ProfilePage'

describe('ProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsConfigured = true
  })

  it('shows login form when not authenticated and supabase is configured', () => {
    useAuthStore.setState({
      user: null,
      loading: false,
      isAuthenticated: false,
    })

    render(<MemoryRouter><ProfilePage /></MemoryRouter>)

    expect(screen.getByRole('heading', { name: 'Se connecter' })).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Mot de passe')).toBeInTheDocument()
  })

  it('shows user email and logout when authenticated', () => {
    useAuthStore.setState({
      user: { id: 'u1', email: 'pierre@test.com' } as never,
      loading: false,
      isAuthenticated: true,
    })

    render(<MemoryRouter><ProfilePage /></MemoryRouter>)

    expect(screen.getByText('pierre@test.com')).toBeInTheDocument()
    expect(screen.getByText('Se déconnecter')).toBeInTheDocument()
  })

  it('does not show auth section when supabase is not configured', () => {
    mockIsConfigured = false
    useAuthStore.setState({
      user: null,
      loading: false,
      isAuthenticated: false,
    })

    render(<MemoryRouter><ProfilePage /></MemoryRouter>)

    expect(screen.queryByLabelText('Email')).not.toBeInTheDocument()
    expect(screen.getByText('Profil')).toBeInTheDocument()
  })

  it('always shows export/import and about sections', () => {
    useAuthStore.setState({
      user: null,
      loading: false,
      isAuthenticated: false,
    })

    render(<MemoryRouter><ProfilePage /></MemoryRouter>)

    expect(screen.getByText('Sauvegarde')).toBeInTheDocument()
    expect(screen.getByText('Exporter mes données')).toBeInTheDocument()
    expect(screen.getByText('À propos')).toBeInTheDocument()
  })
})

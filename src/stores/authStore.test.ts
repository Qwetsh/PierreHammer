import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAuthStore } from './authStore'

// Mock supabase module
const mockGetSession = vi.fn()
const mockOnAuthStateChange = vi.fn()
const mockSignUp = vi.fn()
const mockSignInWithPassword = vi.fn()
const mockSignOut = vi.fn()

vi.mock('@/lib/supabase', () => ({
  isSupabaseConfigured: true,
  supabase: {
    auth: {
      getSession: () => mockGetSession(),
      onAuthStateChange: (cb: unknown) => mockOnAuthStateChange(cb),
      signUp: (params: unknown) => mockSignUp(params),
      signInWithPassword: (params: unknown) => mockSignInWithPassword(params),
      signOut: () => mockSignOut(),
    },
  },
}))

const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  aud: 'authenticated',
  role: 'authenticated',
  app_metadata: {},
  user_metadata: {},
  created_at: '2026-01-01',
}

describe('authStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore.setState({ user: null, loading: true, isAuthenticated: false })
  })

  it('has correct initial state', () => {
    const state = useAuthStore.getState()
    expect(state.user).toBeNull()
    expect(state.loading).toBe(true)
    expect(state.isAuthenticated).toBe(false)
  })

  it('initialize sets loading false and subscribes to auth changes', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } })
    mockOnAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } })

    useAuthStore.getState().initialize()

    await vi.waitFor(() => {
      expect(useAuthStore.getState().loading).toBe(false)
    })
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
    expect(mockOnAuthStateChange).toHaveBeenCalled()
  })

  it('initialize sets user when session exists', async () => {
    mockGetSession.mockResolvedValue({ data: { session: { user: mockUser } } })
    mockOnAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } })

    useAuthStore.getState().initialize()

    await vi.waitFor(() => {
      expect(useAuthStore.getState().isAuthenticated).toBe(true)
    })
    expect(useAuthStore.getState().user?.id).toBe('user-123')
  })

  it('signUp sets user on success', async () => {
    mockSignUp.mockResolvedValue({ data: { user: mockUser }, error: null })

    const { error } = await useAuthStore.getState().signUp('test@example.com', 'password123')

    expect(error).toBeNull()
    expect(useAuthStore.getState().user?.id).toBe('user-123')
    expect(useAuthStore.getState().isAuthenticated).toBe(true)
  })

  it('signUp returns error on failure', async () => {
    const authError = { message: 'Email already registered', status: 400 }
    mockSignUp.mockResolvedValue({ data: { user: null }, error: authError })

    const { error } = await useAuthStore.getState().signUp('test@example.com', 'password123')

    expect(error).toEqual(authError)
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
  })

  it('signIn sets user on success', async () => {
    mockSignInWithPassword.mockResolvedValue({ data: { user: mockUser }, error: null })

    const { error } = await useAuthStore.getState().signIn('test@example.com', 'password123')

    expect(error).toBeNull()
    expect(useAuthStore.getState().user?.id).toBe('user-123')
    expect(useAuthStore.getState().isAuthenticated).toBe(true)
  })

  it('signIn returns error on failure', async () => {
    const authError = { message: 'Invalid credentials', status: 401 }
    mockSignInWithPassword.mockResolvedValue({ data: { user: null }, error: authError })

    const { error } = await useAuthStore.getState().signIn('test@example.com', 'wrong')

    expect(error).toEqual(authError)
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
  })

  it('signOut clears user state', async () => {
    useAuthStore.setState({ user: mockUser as never, isAuthenticated: true })
    mockSignOut.mockResolvedValue({ error: null })

    await useAuthStore.getState().signOut()

    expect(useAuthStore.getState().user).toBeNull()
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
  })
})

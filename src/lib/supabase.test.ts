import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('supabase client', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('exports isSupabaseConfigured as false when env vars are missing', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', '')
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', '')
    const mod = await import('./supabase')
    expect(mod.isSupabaseConfigured).toBe(false)
    expect(mod.supabase).toBeNull()
    vi.unstubAllEnvs()
  })

  it('exports isSupabaseConfigured as true when env vars are set', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co')
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-anon-key')
    const mod = await import('./supabase')
    expect(mod.isSupabaseConfigured).toBe(true)
    expect(mod.supabase).not.toBeNull()
    vi.unstubAllEnvs()
  })
})

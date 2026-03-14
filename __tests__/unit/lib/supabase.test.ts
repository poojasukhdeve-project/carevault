// Test supabase.ts module initialization under different env configurations

describe('supabase module', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...originalEnv }
  })

  afterAll(() => {
    process.env = originalEnv
  })

  test('exports null supabase client when env vars are missing', async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    const { supabase, isSupabaseConfigured } = await import('@/lib/supabase')
    expect(supabase).toBeNull()
    expect(isSupabaseConfigured).toBe(false)
  })

  test('exports null supabase client when URL is empty string', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = ''
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'some-long-key-that-is-over-20-chars'

    const { supabase, isSupabaseConfigured } = await import('@/lib/supabase')
    expect(supabase).toBeNull()
    expect(isSupabaseConfigured).toBe(false)
  })

  test('exports null when URL is not a supabase.co domain', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.com'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'some-long-key-that-is-over-20-chars'

    const { isSupabaseConfigured } = await import('@/lib/supabase')
    expect(isSupabaseConfigured).toBe(false)
  })

  test('exports null when anon key is too short', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'short'

    const { isSupabaseConfigured } = await import('@/lib/supabase')
    expect(isSupabaseConfigured).toBe(false)
  })

  test('exports null when URL is malformed', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'not-a-url'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'some-long-key-that-is-over-20-chars'

    const { isSupabaseConfigured } = await import('@/lib/supabase')
    expect(isSupabaseConfigured).toBe(false)
  })

  test('creates client when env vars are valid', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test-key-long-enough'

    const { supabase, isSupabaseConfigured } = await import('@/lib/supabase')
    expect(isSupabaseConfigured).toBe(true)
    expect(supabase).not.toBeNull()
  })
})

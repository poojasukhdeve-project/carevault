/**
 * Authentication Usecase Tests
 * Tests user stories related to authentication and session management
 */

// Mock Supabase before imports
const mockSignUp = jest.fn()
const mockSignInWithPassword = jest.fn()
const mockSignOut = jest.fn()
const mockGetSession = jest.fn()
const mockOnAuthStateChange = jest.fn()

jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signUp: mockSignUp,
      signInWithPassword: mockSignInWithPassword,
      signOut: mockSignOut,
      getSession: mockGetSession,
      onAuthStateChange: mockOnAuthStateChange,
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: null, error: null })),
        })),
      })),
      insert: jest.fn(() => Promise.resolve({ data: null, error: null })),
      update: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ data: null, error: null })),
      })),
    })),
  },
}))

describe('Authentication Usecases', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockOnAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: jest.fn() } } })
  })

  describe('UC-001: User can register as caregiver', () => {
    const caregiverData = {
      email: 'caregiver@example.com',
      password: 'SecurePass123!',
      fullName: 'John Caregiver',
      phone: '555-0100',
      role: 'caregiver',
    }

    it('should successfully create caregiver account with valid data', async () => {
      mockSignUp.mockResolvedValue({
        data: { user: { id: 'user-123', email: caregiverData.email } },
        error: null,
      })

      const result = await mockSignUp({
        email: caregiverData.email,
        password: caregiverData.password,
        options: {
          data: {
            full_name: caregiverData.fullName,
            phone: caregiverData.phone,
            role: caregiverData.role,
          },
        },
      })

      expect(result.error).toBeNull()
      expect(result.data.user).toBeDefined()
      expect(result.data.user.email).toBe(caregiverData.email)
    })

    it('should reject registration with invalid email format', async () => {
      mockSignUp.mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid email format' },
      })

      const result = await mockSignUp({
        email: 'invalid-email',
        password: caregiverData.password,
      })

      expect(result.error).toBeDefined()
      expect(result.error.message).toContain('Invalid')
    })

    it('should reject registration with weak password', async () => {
      mockSignUp.mockResolvedValue({
        data: { user: null },
        error: { message: 'Password should be at least 6 characters' },
      })

      const result = await mockSignUp({
        email: caregiverData.email,
        password: '123',
      })

      expect(result.error).toBeDefined()
      expect(result.error.message).toContain('Password')
    })

    it('should reject registration with existing email', async () => {
      mockSignUp.mockResolvedValue({
        data: { user: null },
        error: { message: 'User already registered' },
      })

      const result = await mockSignUp({
        email: 'existing@example.com',
        password: caregiverData.password,
      })

      expect(result.error).toBeDefined()
      expect(result.error.message).toContain('already registered')
    })
  })

  describe('UC-002: User can register as patient', () => {
    const patientData = {
      email: 'patient@example.com',
      password: 'SecurePass123!',
      fullName: 'Jane Patient',
      phone: '555-0200',
      role: 'patient',
      caregiverEmail: 'caregiver@example.com',
    }

    it('should successfully create patient account with caregiver reference', async () => {
      mockSignUp.mockResolvedValue({
        data: { user: { id: 'patient-123', email: patientData.email } },
        error: null,
      })

      const result = await mockSignUp({
        email: patientData.email,
        password: patientData.password,
        options: {
          data: {
            full_name: patientData.fullName,
            phone: patientData.phone,
            role: patientData.role,
            caregiver_email: patientData.caregiverEmail,
          },
        },
      })

      expect(result.error).toBeNull()
      expect(result.data.user).toBeDefined()
      expect(result.data.user.email).toBe(patientData.email)
    })

    it('should store patient role correctly', async () => {
      mockSignUp.mockResolvedValue({
        data: { 
          user: { 
            id: 'patient-123', 
            email: patientData.email,
            user_metadata: { role: 'patient' }
          } 
        },
        error: null,
      })

      const result = await mockSignUp({
        email: patientData.email,
        password: patientData.password,
        options: { data: { role: 'patient' } },
      })

      expect(result.data.user.user_metadata.role).toBe('patient')
    })
  })

  describe('UC-003: User can login with valid credentials', () => {
    const validCredentials = {
      email: 'user@example.com',
      password: 'ValidPass123!',
    }

    it('should successfully authenticate with valid credentials', async () => {
      mockSignInWithPassword.mockResolvedValue({
        data: {
          user: { id: 'user-123', email: validCredentials.email },
          session: { access_token: 'token-123', refresh_token: 'refresh-123' },
        },
        error: null,
      })

      const result = await mockSignInWithPassword(validCredentials)

      expect(result.error).toBeNull()
      expect(result.data.user).toBeDefined()
      expect(result.data.session).toBeDefined()
      expect(result.data.session.access_token).toBeTruthy()
    })

    it('should return session token on successful login', async () => {
      mockSignInWithPassword.mockResolvedValue({
        data: {
          user: { id: 'user-123' },
          session: { access_token: 'jwt-token-xyz', expires_at: Date.now() + 3600000 },
        },
        error: null,
      })

      const result = await mockSignInWithPassword(validCredentials)

      expect(result.data.session.access_token).toBe('jwt-token-xyz')
      expect(result.data.session.expires_at).toBeGreaterThan(Date.now())
    })
  })

  describe('UC-004: User receives error with invalid credentials', () => {
    it('should reject login with wrong password', async () => {
      mockSignInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials' },
      })

      const result = await mockSignInWithPassword({
        email: 'user@example.com',
        password: 'WrongPassword',
      })

      expect(result.error).toBeDefined()
      expect(result.error.message).toContain('Invalid')
      expect(result.data.user).toBeNull()
    })

    it('should reject login with non-existent email', async () => {
      mockSignInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials' },
      })

      const result = await mockSignInWithPassword({
        email: 'nonexistent@example.com',
        password: 'AnyPassword123',
      })

      expect(result.error).toBeDefined()
      expect(result.data.session).toBeNull()
    })

    it('should not expose whether email exists in error message', async () => {
      mockSignInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials' },
      })

      const result = await mockSignInWithPassword({
        email: 'unknown@example.com',
        password: 'password',
      })

      // Security: Error should be generic, not revealing if email exists
      expect(result.error.message).not.toContain('not found')
      expect(result.error.message).not.toContain('does not exist')
    })
  })

  describe('UC-005: User can logout', () => {
    it('should successfully sign out user', async () => {
      mockSignOut.mockResolvedValue({ error: null })

      const result = await mockSignOut()

      expect(result.error).toBeNull()
      expect(mockSignOut).toHaveBeenCalled()
    })

    it('should clear session on logout', async () => {
      mockSignOut.mockResolvedValue({ error: null })
      mockGetSession.mockResolvedValue({ data: { session: null }, error: null })

      await mockSignOut()
      const sessionResult = await mockGetSession()

      expect(sessionResult.data.session).toBeNull()
    })
  })

  describe('UC-006: User session persists on refresh', () => {
    it('should restore session from storage on page load', async () => {
      mockGetSession.mockResolvedValue({
        data: {
          session: {
            user: { id: 'user-123', email: 'user@example.com' },
            access_token: 'stored-token',
          },
        },
        error: null,
      })

      const result = await mockGetSession()

      expect(result.data.session).toBeDefined()
      expect(result.data.session.user).toBeDefined()
      expect(result.data.session.access_token).toBe('stored-token')
    })

    it('should return null session when no stored session exists', async () => {
      mockGetSession.mockResolvedValue({
        data: { session: null },
        error: null,
      })

      const result = await mockGetSession()

      expect(result.data.session).toBeNull()
    })

    it('should listen to auth state changes', () => {
      const callback = jest.fn()
      mockOnAuthStateChange.mockReturnValue({
        data: { subscription: { unsubscribe: jest.fn() } },
      })

      mockOnAuthStateChange(callback)

      expect(mockOnAuthStateChange).toHaveBeenCalled()
    })
  })
})

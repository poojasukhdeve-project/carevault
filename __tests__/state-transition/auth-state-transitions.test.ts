/**
 * Authentication State Transition Tests
 * Tests state machine transitions for authentication flow
 */

type AuthState = 'unauthenticated' | 'loading' | 'authenticated' | 'logging_out' | 'error'

interface AuthStateMachine {
  currentState: AuthState
  error: string | null
  user: { id: string; email: string } | null
}

type AuthEvent =
  | { type: 'LOGIN_SUBMIT'; email: string; password: string }
  | { type: 'LOGIN_SUCCESS'; user: { id: string; email: string } }
  | { type: 'LOGIN_FAILURE'; error: string }
  | { type: 'LOGOUT' }
  | { type: 'LOGOUT_COMPLETE' }
  | { type: 'SESSION_EXPIRED' }
  | { type: 'SESSION_RESTORED'; user: { id: string; email: string } }

function authReducer(state: AuthStateMachine, event: AuthEvent): AuthStateMachine {
  switch (state.currentState) {
    case 'unauthenticated':
      if (event.type === 'LOGIN_SUBMIT') {
        return { ...state, currentState: 'loading', error: null }
      }
      if (event.type === 'SESSION_RESTORED') {
        return { ...state, currentState: 'authenticated', user: event.user }
      }
      return state

    case 'loading':
      if (event.type === 'LOGIN_SUCCESS') {
        return { ...state, currentState: 'authenticated', user: event.user, error: null }
      }
      if (event.type === 'LOGIN_FAILURE') {
        return { ...state, currentState: 'error', error: event.error }
      }
      return state

    case 'authenticated':
      if (event.type === 'LOGOUT') {
        return { ...state, currentState: 'logging_out' }
      }
      if (event.type === 'SESSION_EXPIRED') {
        return { ...state, currentState: 'unauthenticated', user: null }
      }
      return state

    case 'logging_out':
      if (event.type === 'LOGOUT_COMPLETE') {
        return { ...state, currentState: 'unauthenticated', user: null }
      }
      return state

    case 'error':
      if (event.type === 'LOGIN_SUBMIT') {
        return { ...state, currentState: 'loading', error: null }
      }
      return state

    default:
      return state
  }
}

describe('Authentication State Machine', () => {
  const initialState: AuthStateMachine = {
    currentState: 'unauthenticated',
    error: null,
    user: null,
  }

  const testUser = { id: 'user-123', email: 'test@example.com' }

  describe('Valid State Transitions', () => {
    describe('Transition: Unauthenticated → Loading', () => {
      it('should transition to Loading when login is submitted', () => {
        const newState = authReducer(initialState, {
          type: 'LOGIN_SUBMIT',
          email: 'test@example.com',
          password: 'password123',
        })

        expect(newState.currentState).toBe('loading')
        expect(newState.error).toBeNull()
      })

      it('should clear any previous error when transitioning to Loading', () => {
        const stateWithError: AuthStateMachine = {
          currentState: 'unauthenticated',
          error: 'Previous error',
          user: null,
        }

        const newState = authReducer(stateWithError, {
          type: 'LOGIN_SUBMIT',
          email: 'test@example.com',
          password: 'password',
        })

        expect(newState.error).toBeNull()
      })
    })

    describe('Transition: Loading → Authenticated', () => {
      it('should transition to Authenticated on successful login', () => {
        const loadingState: AuthStateMachine = {
          currentState: 'loading',
          error: null,
          user: null,
        }

        const newState = authReducer(loadingState, {
          type: 'LOGIN_SUCCESS',
          user: testUser,
        })

        expect(newState.currentState).toBe('authenticated')
        expect(newState.user).toEqual(testUser)
      })

      it('should store user information on successful login', () => {
        const loadingState: AuthStateMachine = {
          currentState: 'loading',
          error: null,
          user: null,
        }

        const newState = authReducer(loadingState, {
          type: 'LOGIN_SUCCESS',
          user: testUser,
        })

        expect(newState.user?.id).toBe('user-123')
        expect(newState.user?.email).toBe('test@example.com')
      })
    })

    describe('Transition: Loading → Error', () => {
      it('should transition to Error on login failure', () => {
        const loadingState: AuthStateMachine = {
          currentState: 'loading',
          error: null,
          user: null,
        }

        const newState = authReducer(loadingState, {
          type: 'LOGIN_FAILURE',
          error: 'Invalid credentials',
        })

        expect(newState.currentState).toBe('error')
        expect(newState.error).toBe('Invalid credentials')
      })

      it('should preserve null user on failure', () => {
        const loadingState: AuthStateMachine = {
          currentState: 'loading',
          error: null,
          user: null,
        }

        const newState = authReducer(loadingState, {
          type: 'LOGIN_FAILURE',
          error: 'Invalid credentials',
        })

        expect(newState.user).toBeNull()
      })
    })

    describe('Transition: Error → Loading (Retry)', () => {
      it('should allow retry from Error state', () => {
        const errorState: AuthStateMachine = {
          currentState: 'error',
          error: 'Previous error',
          user: null,
        }

        const newState = authReducer(errorState, {
          type: 'LOGIN_SUBMIT',
          email: 'test@example.com',
          password: 'newpassword',
        })

        expect(newState.currentState).toBe('loading')
        expect(newState.error).toBeNull()
      })
    })

    describe('Transition: Authenticated → Logging Out', () => {
      it('should transition to Logging Out when logout initiated', () => {
        const authenticatedState: AuthStateMachine = {
          currentState: 'authenticated',
          error: null,
          user: testUser,
        }

        const newState = authReducer(authenticatedState, { type: 'LOGOUT' })

        expect(newState.currentState).toBe('logging_out')
      })

      it('should preserve user during logout process', () => {
        const authenticatedState: AuthStateMachine = {
          currentState: 'authenticated',
          error: null,
          user: testUser,
        }

        const newState = authReducer(authenticatedState, { type: 'LOGOUT' })

        expect(newState.user).toEqual(testUser)
      })
    })

    describe('Transition: Logging Out → Unauthenticated', () => {
      it('should transition to Unauthenticated when logout completes', () => {
        const loggingOutState: AuthStateMachine = {
          currentState: 'logging_out',
          error: null,
          user: testUser,
        }

        const newState = authReducer(loggingOutState, { type: 'LOGOUT_COMPLETE' })

        expect(newState.currentState).toBe('unauthenticated')
        expect(newState.user).toBeNull()
      })
    })

    describe('Transition: Authenticated → Unauthenticated (Session Expired)', () => {
      it('should transition to Unauthenticated when session expires', () => {
        const authenticatedState: AuthStateMachine = {
          currentState: 'authenticated',
          error: null,
          user: testUser,
        }

        const newState = authReducer(authenticatedState, { type: 'SESSION_EXPIRED' })

        expect(newState.currentState).toBe('unauthenticated')
        expect(newState.user).toBeNull()
      })
    })

    describe('Transition: Unauthenticated → Authenticated (Session Restored)', () => {
      it('should transition directly to Authenticated when session is restored', () => {
        const newState = authReducer(initialState, {
          type: 'SESSION_RESTORED',
          user: testUser,
        })

        expect(newState.currentState).toBe('authenticated')
        expect(newState.user).toEqual(testUser)
      })
    })
  })

  describe('Invalid State Transitions (Guards)', () => {
    it('should not allow direct Unauthenticated → Authenticated without session', () => {
      const newState = authReducer(initialState, {
        type: 'LOGIN_SUCCESS',
        user: testUser,
      })

      // Should remain in unauthenticated state
      expect(newState.currentState).toBe('unauthenticated')
    })

    it('should not allow logout when not authenticated', () => {
      const newState = authReducer(initialState, { type: 'LOGOUT' })

      expect(newState.currentState).toBe('unauthenticated')
    })

    it('should not allow login while already authenticated', () => {
      const authenticatedState: AuthStateMachine = {
        currentState: 'authenticated',
        error: null,
        user: testUser,
      }

      const newState = authReducer(authenticatedState, {
        type: 'LOGIN_SUBMIT',
        email: 'other@example.com',
        password: 'password',
      })

      expect(newState.currentState).toBe('authenticated')
      expect(newState.user).toEqual(testUser)
    })

    it('should not allow session restore while authenticated', () => {
      const authenticatedState: AuthStateMachine = {
        currentState: 'authenticated',
        error: null,
        user: testUser,
      }

      const differentUser = { id: 'user-456', email: 'other@example.com' }
      const newState = authReducer(authenticatedState, {
        type: 'SESSION_RESTORED',
        user: differentUser,
      })

      expect(newState.user).toEqual(testUser)
    })
  })

  describe('Complete Auth Flow Sequences', () => {
    it('should complete successful login flow', () => {
      let state = initialState

      // Step 1: Submit login
      state = authReducer(state, {
        type: 'LOGIN_SUBMIT',
        email: 'test@example.com',
        password: 'password123',
      })
      expect(state.currentState).toBe('loading')

      // Step 2: Login succeeds
      state = authReducer(state, {
        type: 'LOGIN_SUCCESS',
        user: testUser,
      })
      expect(state.currentState).toBe('authenticated')
      expect(state.user).toEqual(testUser)
    })

    it('should complete failed login then retry flow', () => {
      let state = initialState

      // Step 1: Submit login
      state = authReducer(state, {
        type: 'LOGIN_SUBMIT',
        email: 'test@example.com',
        password: 'wrongpassword',
      })

      // Step 2: Login fails
      state = authReducer(state, {
        type: 'LOGIN_FAILURE',
        error: 'Invalid credentials',
      })
      expect(state.currentState).toBe('error')

      // Step 3: Retry login
      state = authReducer(state, {
        type: 'LOGIN_SUBMIT',
        email: 'test@example.com',
        password: 'correctpassword',
      })
      expect(state.currentState).toBe('loading')

      // Step 4: Login succeeds
      state = authReducer(state, {
        type: 'LOGIN_SUCCESS',
        user: testUser,
      })
      expect(state.currentState).toBe('authenticated')
    })

    it('should complete logout flow', () => {
      let state: AuthStateMachine = {
        currentState: 'authenticated',
        error: null,
        user: testUser,
      }

      // Step 1: Initiate logout
      state = authReducer(state, { type: 'LOGOUT' })
      expect(state.currentState).toBe('logging_out')

      // Step 2: Logout completes
      state = authReducer(state, { type: 'LOGOUT_COMPLETE' })
      expect(state.currentState).toBe('unauthenticated')
      expect(state.user).toBeNull()
    })
  })
})

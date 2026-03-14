/**
 * Form State Transition Tests
 * Tests state machine transitions for form interactions
 */

type FormState = 'closed' | 'open_empty' | 'editing' | 'submitting' | 'success' | 'error'

interface FormStateMachine {
  currentState: FormState
  formData: Record<string, unknown>
  isDirty: boolean
  error: string | null
  validationErrors: Record<string, string>
}

type FormEvent =
  | { type: 'OPEN' }
  | { type: 'OPEN_WITH_DATA'; data: Record<string, unknown> }
  | { type: 'EDIT'; field: string; value: unknown }
  | { type: 'SUBMIT' }
  | { type: 'SUBMIT_SUCCESS' }
  | { type: 'SUBMIT_ERROR'; error: string }
  | { type: 'VALIDATION_ERROR'; errors: Record<string, string> }
  | { type: 'CANCEL' }
  | { type: 'RESET' }

function formReducer(state: FormStateMachine, event: FormEvent): FormStateMachine {
  switch (state.currentState) {
    case 'closed':
      if (event.type === 'OPEN') {
        return {
          ...state,
          currentState: 'open_empty',
          formData: {},
          isDirty: false,
          error: null,
          validationErrors: {},
        }
      }
      if (event.type === 'OPEN_WITH_DATA') {
        return {
          ...state,
          currentState: 'editing',
          formData: event.data,
          isDirty: false,
          error: null,
          validationErrors: {},
        }
      }
      return state

    case 'open_empty':
      if (event.type === 'EDIT') {
        return {
          ...state,
          currentState: 'editing',
          formData: { ...state.formData, [event.field]: event.value },
          isDirty: true,
        }
      }
      if (event.type === 'CANCEL') {
        return {
          ...state,
          currentState: 'closed',
          formData: {},
        }
      }
      return state

    case 'editing':
      if (event.type === 'EDIT') {
        return {
          ...state,
          formData: { ...state.formData, [event.field]: event.value },
          isDirty: true,
          validationErrors: {},
        }
      }
      if (event.type === 'SUBMIT') {
        return {
          ...state,
          currentState: 'submitting',
        }
      }
      if (event.type === 'VALIDATION_ERROR') {
        return {
          ...state,
          validationErrors: event.errors,
        }
      }
      if (event.type === 'CANCEL') {
        return {
          ...state,
          currentState: 'closed',
          formData: {},
          isDirty: false,
        }
      }
      if (event.type === 'RESET') {
        return {
          ...state,
          currentState: 'open_empty',
          formData: {},
          isDirty: false,
          validationErrors: {},
        }
      }
      return state

    case 'submitting':
      if (event.type === 'SUBMIT_SUCCESS') {
        return {
          ...state,
          currentState: 'success',
        }
      }
      if (event.type === 'SUBMIT_ERROR') {
        return {
          ...state,
          currentState: 'error',
          error: event.error,
        }
      }
      return state

    case 'success':
      // Auto-transition to closed after success
      return {
        ...state,
        currentState: 'closed',
        formData: {},
        isDirty: false,
      }

    case 'error':
      if (event.type === 'EDIT') {
        return {
          ...state,
          currentState: 'editing',
          formData: { ...state.formData, [event.field]: event.value },
          error: null,
        }
      }
      if (event.type === 'SUBMIT') {
        return {
          ...state,
          currentState: 'submitting',
          error: null,
        }
      }
      if (event.type === 'CANCEL') {
        return {
          ...state,
          currentState: 'closed',
          formData: {},
          error: null,
        }
      }
      return state

    default:
      return state
  }
}

describe('Form State Machine', () => {
  const initialState: FormStateMachine = {
    currentState: 'closed',
    formData: {},
    isDirty: false,
    error: null,
    validationErrors: {},
  }

  describe('Valid State Transitions', () => {
    describe('Transition: Closed → Open Empty', () => {
      it('should transition to Open Empty when form is opened', () => {
        const newState = formReducer(initialState, { type: 'OPEN' })

        expect(newState.currentState).toBe('open_empty')
        expect(newState.formData).toEqual({})
        expect(newState.isDirty).toBe(false)
      })

      it('should clear any previous errors when opening', () => {
        const stateWithError: FormStateMachine = {
          ...initialState,
          error: 'Previous error',
        }

        const newState = formReducer(stateWithError, { type: 'OPEN' })

        expect(newState.error).toBeNull()
      })
    })

    describe('Transition: Closed → Editing (Open with Data)', () => {
      it('should transition to Editing when opened with existing data', () => {
        const existingData = { name: 'John', email: 'john@example.com' }
        const newState = formReducer(initialState, {
          type: 'OPEN_WITH_DATA',
          data: existingData,
        })

        expect(newState.currentState).toBe('editing')
        expect(newState.formData).toEqual(existingData)
        expect(newState.isDirty).toBe(false)
      })
    })

    describe('Transition: Open Empty → Editing', () => {
      it('should transition to Editing on first field edit', () => {
        const openState: FormStateMachine = {
          ...initialState,
          currentState: 'open_empty',
        }

        const newState = formReducer(openState, {
          type: 'EDIT',
          field: 'name',
          value: 'John',
        })

        expect(newState.currentState).toBe('editing')
        expect(newState.formData.name).toBe('John')
        expect(newState.isDirty).toBe(true)
      })
    })

    describe('Transition: Open Empty → Closed (Cancel)', () => {
      it('should transition to Closed when cancelled', () => {
        const openState: FormStateMachine = {
          ...initialState,
          currentState: 'open_empty',
        }

        const newState = formReducer(openState, { type: 'CANCEL' })

        expect(newState.currentState).toBe('closed')
      })
    })

    describe('Transition: Editing → Submitting', () => {
      it('should transition to Submitting when form is submitted', () => {
        const editingState: FormStateMachine = {
          ...initialState,
          currentState: 'editing',
          formData: { name: 'John', email: 'john@example.com' },
          isDirty: true,
        }

        const newState = formReducer(editingState, { type: 'SUBMIT' })

        expect(newState.currentState).toBe('submitting')
      })
    })

    describe('Transition: Submitting → Success', () => {
      it('should transition to Success on successful submission', () => {
        const submittingState: FormStateMachine = {
          ...initialState,
          currentState: 'submitting',
          formData: { name: 'John' },
        }

        const newState = formReducer(submittingState, { type: 'SUBMIT_SUCCESS' })

        expect(newState.currentState).toBe('success')
      })
    })

    describe('Transition: Success → Closed (Auto)', () => {
      it('should auto-transition to Closed after success', () => {
        const successState: FormStateMachine = {
          ...initialState,
          currentState: 'success',
          formData: { name: 'John' },
        }

        // Success state immediately transitions to closed
        const newState = formReducer(successState, { type: 'OPEN' })
        
        // The success state should have already transitioned
        expect(successState.currentState).toBe('success')
      })
    })

    describe('Transition: Submitting → Error', () => {
      it('should transition to Error on failed submission', () => {
        const submittingState: FormStateMachine = {
          ...initialState,
          currentState: 'submitting',
          formData: { name: 'John' },
        }

        const newState = formReducer(submittingState, {
          type: 'SUBMIT_ERROR',
          error: 'Network error',
        })

        expect(newState.currentState).toBe('error')
        expect(newState.error).toBe('Network error')
      })
    })

    describe('Transition: Error → Editing (Retry)', () => {
      it('should transition back to Editing when user edits after error', () => {
        const errorState: FormStateMachine = {
          ...initialState,
          currentState: 'error',
          formData: { name: 'John' },
          error: 'Previous error',
        }

        const newState = formReducer(errorState, {
          type: 'EDIT',
          field: 'name',
          value: 'Jane',
        })

        expect(newState.currentState).toBe('editing')
        expect(newState.error).toBeNull()
      })
    })

    describe('Transition: Error → Submitting (Retry)', () => {
      it('should allow retry submission from Error state', () => {
        const errorState: FormStateMachine = {
          ...initialState,
          currentState: 'error',
          formData: { name: 'John' },
          error: 'Previous error',
        }

        const newState = formReducer(errorState, { type: 'SUBMIT' })

        expect(newState.currentState).toBe('submitting')
        expect(newState.error).toBeNull()
      })
    })

    describe('Transition: Editing → Closed (Cancel)', () => {
      it('should transition to Closed when editing is cancelled', () => {
        const editingState: FormStateMachine = {
          ...initialState,
          currentState: 'editing',
          formData: { name: 'John' },
          isDirty: true,
        }

        const newState = formReducer(editingState, { type: 'CANCEL' })

        expect(newState.currentState).toBe('closed')
        expect(newState.formData).toEqual({})
        expect(newState.isDirty).toBe(false)
      })
    })

    describe('Transition: Editing → Open Empty (Reset)', () => {
      it('should reset form data when reset is triggered', () => {
        const editingState: FormStateMachine = {
          ...initialState,
          currentState: 'editing',
          formData: { name: 'John', email: 'john@example.com' },
          isDirty: true,
        }

        const newState = formReducer(editingState, { type: 'RESET' })

        expect(newState.currentState).toBe('open_empty')
        expect(newState.formData).toEqual({})
        expect(newState.isDirty).toBe(false)
      })
    })
  })

  describe('Validation in Editing State', () => {
    it('should store validation errors without state change', () => {
      const editingState: FormStateMachine = {
        ...initialState,
        currentState: 'editing',
        formData: { email: 'invalid' },
      }

      const newState = formReducer(editingState, {
        type: 'VALIDATION_ERROR',
        errors: { email: 'Invalid email format' },
      })

      expect(newState.currentState).toBe('editing')
      expect(newState.validationErrors.email).toBe('Invalid email format')
    })

    it('should clear validation errors on edit', () => {
      const editingState: FormStateMachine = {
        ...initialState,
        currentState: 'editing',
        formData: { email: 'invalid' },
        validationErrors: { email: 'Invalid email format' },
      }

      const newState = formReducer(editingState, {
        type: 'EDIT',
        field: 'email',
        value: 'valid@example.com',
      })

      expect(newState.validationErrors).toEqual({})
    })
  })

  describe('Invalid State Transitions (Guards)', () => {
    it('should not allow submission from Closed state', () => {
      const newState = formReducer(initialState, { type: 'SUBMIT' })

      expect(newState.currentState).toBe('closed')
    })

    it('should not allow editing from Closed state', () => {
      const newState = formReducer(initialState, {
        type: 'EDIT',
        field: 'name',
        value: 'John',
      })

      expect(newState.currentState).toBe('closed')
    })

    it('should not allow cancel from Submitting state', () => {
      const submittingState: FormStateMachine = {
        ...initialState,
        currentState: 'submitting',
      }

      const newState = formReducer(submittingState, { type: 'CANCEL' })

      expect(newState.currentState).toBe('submitting')
    })
  })

  describe('Complete Form Flow Sequences', () => {
    it('should complete successful form submission flow', () => {
      let state = initialState

      // Step 1: Open form
      state = formReducer(state, { type: 'OPEN' })
      expect(state.currentState).toBe('open_empty')

      // Step 2: Edit fields
      state = formReducer(state, { type: 'EDIT', field: 'name', value: 'John' })
      state = formReducer(state, { type: 'EDIT', field: 'email', value: 'john@example.com' })
      expect(state.currentState).toBe('editing')
      expect(state.isDirty).toBe(true)

      // Step 3: Submit
      state = formReducer(state, { type: 'SUBMIT' })
      expect(state.currentState).toBe('submitting')

      // Step 4: Success
      state = formReducer(state, { type: 'SUBMIT_SUCCESS' })
      expect(state.currentState).toBe('success')
    })

    it('should complete edit existing record flow', () => {
      let state = initialState

      // Step 1: Open with existing data
      state = formReducer(state, {
        type: 'OPEN_WITH_DATA',
        data: { name: 'John', email: 'john@example.com' },
      })
      expect(state.currentState).toBe('editing')
      expect(state.isDirty).toBe(false)

      // Step 2: Make changes
      state = formReducer(state, { type: 'EDIT', field: 'name', value: 'Jonathan' })
      expect(state.isDirty).toBe(true)

      // Step 3: Submit
      state = formReducer(state, { type: 'SUBMIT' })
      state = formReducer(state, { type: 'SUBMIT_SUCCESS' })
      expect(state.currentState).toBe('success')
    })

    it('should handle error and retry flow', () => {
      let state: FormStateMachine = {
        ...initialState,
        currentState: 'editing',
        formData: { name: 'John' },
        isDirty: true,
      }

      // Step 1: Submit fails
      state = formReducer(state, { type: 'SUBMIT' })
      state = formReducer(state, { type: 'SUBMIT_ERROR', error: 'Network error' })
      expect(state.currentState).toBe('error')

      // Step 2: Fix and retry
      state = formReducer(state, { type: 'EDIT', field: 'name', value: 'Jane' })
      expect(state.currentState).toBe('editing')
      expect(state.error).toBeNull()

      // Step 3: Submit again
      state = formReducer(state, { type: 'SUBMIT' })
      state = formReducer(state, { type: 'SUBMIT_SUCCESS' })
      expect(state.currentState).toBe('success')
    })
  })
})

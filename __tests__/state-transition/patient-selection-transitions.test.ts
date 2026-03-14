/**
 * Patient Selection State Transition Tests
 * Tests state machine transitions for patient selection flow
 */

type PatientSelectionState = 'no_selection' | 'loading' | 'selected' | 'switching' | 'error'

interface PatientData {
  id: string
  name: string
  medications: unknown[]
  appointments: unknown[]
  documents: unknown[]
  contacts: unknown[]
}

interface PatientSelectionStateMachine {
  currentState: PatientSelectionState
  selectedPatientId: string | null
  patientData: PatientData | null
  error: string | null
  isLoadingData: boolean
}

type PatientSelectionEvent =
  | { type: 'SELECT_PATIENT'; patientId: string }
  | { type: 'DATA_LOADED'; data: PatientData }
  | { type: 'DATA_LOAD_ERROR'; error: string }
  | { type: 'DESELECT' }
  | { type: 'REFRESH_DATA' }

function patientSelectionReducer(
  state: PatientSelectionStateMachine,
  event: PatientSelectionEvent
): PatientSelectionStateMachine {
  switch (state.currentState) {
    case 'no_selection':
      if (event.type === 'SELECT_PATIENT') {
        return {
          ...state,
          currentState: 'loading',
          selectedPatientId: event.patientId,
          isLoadingData: true,
        }
      }
      return state

    case 'loading':
      if (event.type === 'DATA_LOADED') {
        return {
          ...state,
          currentState: 'selected',
          patientData: event.data,
          isLoadingData: false,
        }
      }
      if (event.type === 'DATA_LOAD_ERROR') {
        return {
          ...state,
          currentState: 'error',
          error: event.error,
          isLoadingData: false,
        }
      }
      return state

    case 'selected':
      if (event.type === 'SELECT_PATIENT' && event.patientId !== state.selectedPatientId) {
        return {
          ...state,
          currentState: 'switching',
          selectedPatientId: event.patientId,
          isLoadingData: true,
        }
      }
      if (event.type === 'DESELECT') {
        return {
          ...state,
          currentState: 'no_selection',
          selectedPatientId: null,
          patientData: null,
        }
      }
      if (event.type === 'REFRESH_DATA') {
        return {
          ...state,
          isLoadingData: true,
        }
      }
      return state

    case 'switching':
      if (event.type === 'DATA_LOADED') {
        return {
          ...state,
          currentState: 'selected',
          patientData: event.data,
          isLoadingData: false,
        }
      }
      if (event.type === 'DATA_LOAD_ERROR') {
        return {
          ...state,
          currentState: 'error',
          error: event.error,
          isLoadingData: false,
        }
      }
      return state

    case 'error':
      if (event.type === 'SELECT_PATIENT') {
        return {
          ...state,
          currentState: 'loading',
          selectedPatientId: event.patientId,
          error: null,
          isLoadingData: true,
        }
      }
      if (event.type === 'DESELECT') {
        return {
          ...state,
          currentState: 'no_selection',
          selectedPatientId: null,
          patientData: null,
          error: null,
        }
      }
      return state

    default:
      return state
  }
}

describe('Patient Selection State Machine', () => {
  const initialState: PatientSelectionStateMachine = {
    currentState: 'no_selection',
    selectedPatientId: null,
    patientData: null,
    error: null,
    isLoadingData: false,
  }

  const samplePatientData: PatientData = {
    id: 'patient-001',
    name: 'John Doe',
    medications: [{ id: 'med-1', name: 'Donepezil' }],
    appointments: [{ id: 'apt-1', title: 'Checkup' }],
    documents: [{ id: 'doc-1', name: 'Lab Results' }],
    contacts: [{ id: 'contact-1', name: 'Jane Doe' }],
  }

  describe('Valid State Transitions', () => {
    describe('Transition: No Selection → Loading', () => {
      it('should transition to Loading when patient is selected', () => {
        const newState = patientSelectionReducer(initialState, {
          type: 'SELECT_PATIENT',
          patientId: 'patient-001',
        })

        expect(newState.currentState).toBe('loading')
        expect(newState.selectedPatientId).toBe('patient-001')
        expect(newState.isLoadingData).toBe(true)
      })
    })

    describe('Transition: Loading → Selected', () => {
      it('should transition to Selected when data is loaded', () => {
        const loadingState: PatientSelectionStateMachine = {
          ...initialState,
          currentState: 'loading',
          selectedPatientId: 'patient-001',
          isLoadingData: true,
        }

        const newState = patientSelectionReducer(loadingState, {
          type: 'DATA_LOADED',
          data: samplePatientData,
        })

        expect(newState.currentState).toBe('selected')
        expect(newState.patientData).toEqual(samplePatientData)
        expect(newState.isLoadingData).toBe(false)
      })
    })

    describe('Transition: Loading → Error', () => {
      it('should transition to Error when data load fails', () => {
        const loadingState: PatientSelectionStateMachine = {
          ...initialState,
          currentState: 'loading',
          selectedPatientId: 'patient-001',
          isLoadingData: true,
        }

        const newState = patientSelectionReducer(loadingState, {
          type: 'DATA_LOAD_ERROR',
          error: 'Failed to load patient data',
        })

        expect(newState.currentState).toBe('error')
        expect(newState.error).toBe('Failed to load patient data')
        expect(newState.isLoadingData).toBe(false)
      })
    })

    describe('Transition: Selected → Switching', () => {
      it('should transition to Switching when different patient selected', () => {
        const selectedState: PatientSelectionStateMachine = {
          ...initialState,
          currentState: 'selected',
          selectedPatientId: 'patient-001',
          patientData: samplePatientData,
        }

        const newState = patientSelectionReducer(selectedState, {
          type: 'SELECT_PATIENT',
          patientId: 'patient-002',
        })

        expect(newState.currentState).toBe('switching')
        expect(newState.selectedPatientId).toBe('patient-002')
        expect(newState.isLoadingData).toBe(true)
      })

      it('should NOT transition when same patient selected', () => {
        const selectedState: PatientSelectionStateMachine = {
          ...initialState,
          currentState: 'selected',
          selectedPatientId: 'patient-001',
          patientData: samplePatientData,
        }

        const newState = patientSelectionReducer(selectedState, {
          type: 'SELECT_PATIENT',
          patientId: 'patient-001',
        })

        expect(newState.currentState).toBe('selected')
      })
    })

    describe('Transition: Switching → Selected', () => {
      it('should transition to Selected when new patient data loads', () => {
        const switchingState: PatientSelectionStateMachine = {
          ...initialState,
          currentState: 'switching',
          selectedPatientId: 'patient-002',
          patientData: samplePatientData,
          isLoadingData: true,
        }

        const newPatientData = { ...samplePatientData, id: 'patient-002', name: 'Jane Smith' }
        const newState = patientSelectionReducer(switchingState, {
          type: 'DATA_LOADED',
          data: newPatientData,
        })

        expect(newState.currentState).toBe('selected')
        expect(newState.patientData?.id).toBe('patient-002')
      })
    })

    describe('Transition: Selected → No Selection', () => {
      it('should transition to No Selection when deselected', () => {
        const selectedState: PatientSelectionStateMachine = {
          ...initialState,
          currentState: 'selected',
          selectedPatientId: 'patient-001',
          patientData: samplePatientData,
        }

        const newState = patientSelectionReducer(selectedState, { type: 'DESELECT' })

        expect(newState.currentState).toBe('no_selection')
        expect(newState.selectedPatientId).toBeNull()
        expect(newState.patientData).toBeNull()
      })
    })

    describe('Transition: Error → Loading (Retry)', () => {
      it('should allow retry from Error state', () => {
        const errorState: PatientSelectionStateMachine = {
          ...initialState,
          currentState: 'error',
          selectedPatientId: 'patient-001',
          error: 'Previous error',
        }

        const newState = patientSelectionReducer(errorState, {
          type: 'SELECT_PATIENT',
          patientId: 'patient-001',
        })

        expect(newState.currentState).toBe('loading')
        expect(newState.error).toBeNull()
      })
    })

    describe('Transition: Error → No Selection', () => {
      it('should allow deselect from Error state', () => {
        const errorState: PatientSelectionStateMachine = {
          ...initialState,
          currentState: 'error',
          selectedPatientId: 'patient-001',
          error: 'Load failed',
        }

        const newState = patientSelectionReducer(errorState, { type: 'DESELECT' })

        expect(newState.currentState).toBe('no_selection')
        expect(newState.error).toBeNull()
      })
    })
  })

  describe('Data Refresh in Selected State', () => {
    it('should set loading flag when refreshing', () => {
      const selectedState: PatientSelectionStateMachine = {
        ...initialState,
        currentState: 'selected',
        selectedPatientId: 'patient-001',
        patientData: samplePatientData,
      }

      const newState = patientSelectionReducer(selectedState, { type: 'REFRESH_DATA' })

      expect(newState.currentState).toBe('selected')
      expect(newState.isLoadingData).toBe(true)
    })
  })

  describe('Invalid State Transitions (Guards)', () => {
    it('should not allow data load in No Selection state', () => {
      const newState = patientSelectionReducer(initialState, {
        type: 'DATA_LOADED',
        data: samplePatientData,
      })

      expect(newState.currentState).toBe('no_selection')
    })

    it('should not allow deselect in No Selection state', () => {
      const newState = patientSelectionReducer(initialState, { type: 'DESELECT' })

      expect(newState.currentState).toBe('no_selection')
    })
  })

  describe('Complete Selection Flow Sequences', () => {
    it('should complete successful patient selection flow', () => {
      let state = initialState

      // Step 1: Select patient
      state = patientSelectionReducer(state, {
        type: 'SELECT_PATIENT',
        patientId: 'patient-001',
      })
      expect(state.currentState).toBe('loading')

      // Step 2: Data loads
      state = patientSelectionReducer(state, {
        type: 'DATA_LOADED',
        data: samplePatientData,
      })
      expect(state.currentState).toBe('selected')
      expect(state.patientData).toEqual(samplePatientData)
    })

    it('should complete patient switch flow', () => {
      let state: PatientSelectionStateMachine = {
        ...initialState,
        currentState: 'selected',
        selectedPatientId: 'patient-001',
        patientData: samplePatientData,
      }

      // Step 1: Select different patient
      state = patientSelectionReducer(state, {
        type: 'SELECT_PATIENT',
        patientId: 'patient-002',
      })
      expect(state.currentState).toBe('switching')

      // Step 2: New data loads
      const newData = { ...samplePatientData, id: 'patient-002' }
      state = patientSelectionReducer(state, {
        type: 'DATA_LOADED',
        data: newData,
      })
      expect(state.currentState).toBe('selected')
      expect(state.patientData?.id).toBe('patient-002')
    })

    it('should handle error and recovery flow', () => {
      let state = initialState

      // Step 1: Select patient
      state = patientSelectionReducer(state, {
        type: 'SELECT_PATIENT',
        patientId: 'patient-001',
      })

      // Step 2: Error occurs
      state = patientSelectionReducer(state, {
        type: 'DATA_LOAD_ERROR',
        error: 'Network error',
      })
      expect(state.currentState).toBe('error')

      // Step 3: Retry
      state = patientSelectionReducer(state, {
        type: 'SELECT_PATIENT',
        patientId: 'patient-001',
      })
      expect(state.currentState).toBe('loading')

      // Step 4: Success
      state = patientSelectionReducer(state, {
        type: 'DATA_LOADED',
        data: samplePatientData,
      })
      expect(state.currentState).toBe('selected')
    })
  })
})

/**
 * Data Loading State Transition Tests
 * Tests state machine transitions for async data loading operations
 */

type DataLoadingState = 'idle' | 'loading' | 'loaded' | 'error' | 'retrying' | 'refreshing'

interface DataLoadingStateMachine<T> {
  currentState: DataLoadingState
  data: T | null
  error: string | null
  retryCount: number
  lastUpdated: number | null
}

type DataLoadingEvent<T> =
  | { type: 'FETCH' }
  | { type: 'FETCH_SUCCESS'; data: T; timestamp: number }
  | { type: 'FETCH_ERROR'; error: string }
  | { type: 'RETRY' }
  | { type: 'REFRESH' }
  | { type: 'RESET' }
  | { type: 'INVALIDATE' }

function dataLoadingReducer<T>(
  state: DataLoadingStateMachine<T>,
  event: DataLoadingEvent<T>
): DataLoadingStateMachine<T> {
  switch (state.currentState) {
    case 'idle':
      if (event.type === 'FETCH') {
        return {
          ...state,
          currentState: 'loading',
          error: null,
        }
      }
      return state

    case 'loading':
      if (event.type === 'FETCH_SUCCESS') {
        return {
          ...state,
          currentState: 'loaded',
          data: event.data,
          lastUpdated: event.timestamp,
          error: null,
          retryCount: 0,
        }
      }
      if (event.type === 'FETCH_ERROR') {
        return {
          ...state,
          currentState: 'error',
          error: event.error,
        }
      }
      return state

    case 'loaded':
      if (event.type === 'REFRESH') {
        return {
          ...state,
          currentState: 'refreshing',
        }
      }
      if (event.type === 'INVALIDATE') {
        return {
          ...state,
          currentState: 'idle',
          data: null,
          lastUpdated: null,
        }
      }
      if (event.type === 'RESET') {
        return {
          currentState: 'idle',
          data: null,
          error: null,
          retryCount: 0,
          lastUpdated: null,
        }
      }
      return state

    case 'error':
      if (event.type === 'RETRY') {
        return {
          ...state,
          currentState: 'retrying',
          retryCount: state.retryCount + 1,
        }
      }
      if (event.type === 'RESET') {
        return {
          currentState: 'idle',
          data: null,
          error: null,
          retryCount: 0,
          lastUpdated: null,
        }
      }
      return state

    case 'retrying':
      if (event.type === 'FETCH_SUCCESS') {
        return {
          ...state,
          currentState: 'loaded',
          data: event.data,
          lastUpdated: event.timestamp,
          error: null,
        }
      }
      if (event.type === 'FETCH_ERROR') {
        return {
          ...state,
          currentState: 'error',
          error: event.error,
        }
      }
      return state

    case 'refreshing':
      if (event.type === 'FETCH_SUCCESS') {
        return {
          ...state,
          currentState: 'loaded',
          data: event.data,
          lastUpdated: event.timestamp,
        }
      }
      if (event.type === 'FETCH_ERROR') {
        // On refresh error, keep existing data but show error
        return {
          ...state,
          currentState: 'loaded',
          error: event.error,
        }
      }
      return state

    default:
      return state
  }
}

describe('Data Loading State Machine', () => {
  interface TestData {
    items: string[]
    total: number
  }

  const initialState: DataLoadingStateMachine<TestData> = {
    currentState: 'idle',
    data: null,
    error: null,
    retryCount: 0,
    lastUpdated: null,
  }

  const sampleData: TestData = {
    items: ['item1', 'item2', 'item3'],
    total: 3,
  }

  describe('Valid State Transitions', () => {
    describe('Transition: Idle → Loading', () => {
      it('should transition to Loading when fetch is initiated', () => {
        const newState = dataLoadingReducer(initialState, { type: 'FETCH' })

        expect(newState.currentState).toBe('loading')
        expect(newState.error).toBeNull()
      })
    })

    describe('Transition: Loading → Loaded', () => {
      it('should transition to Loaded on successful fetch', () => {
        const loadingState: DataLoadingStateMachine<TestData> = {
          ...initialState,
          currentState: 'loading',
        }

        const timestamp = Date.now()
        const newState = dataLoadingReducer(loadingState, {
          type: 'FETCH_SUCCESS',
          data: sampleData,
          timestamp,
        })

        expect(newState.currentState).toBe('loaded')
        expect(newState.data).toEqual(sampleData)
        expect(newState.lastUpdated).toBe(timestamp)
        expect(newState.retryCount).toBe(0)
      })
    })

    describe('Transition: Loading → Error', () => {
      it('should transition to Error on fetch failure', () => {
        const loadingState: DataLoadingStateMachine<TestData> = {
          ...initialState,
          currentState: 'loading',
        }

        const newState = dataLoadingReducer(loadingState, {
          type: 'FETCH_ERROR',
          error: 'Network error',
        })

        expect(newState.currentState).toBe('error')
        expect(newState.error).toBe('Network error')
      })
    })

    describe('Transition: Error → Retrying', () => {
      it('should transition to Retrying when retry is triggered', () => {
        const errorState: DataLoadingStateMachine<TestData> = {
          ...initialState,
          currentState: 'error',
          error: 'Previous error',
          retryCount: 0,
        }

        const newState = dataLoadingReducer(errorState, { type: 'RETRY' })

        expect(newState.currentState).toBe('retrying')
        expect(newState.retryCount).toBe(1)
      })

      it('should increment retry count on each retry', () => {
        let state: DataLoadingStateMachine<TestData> = {
          ...initialState,
          currentState: 'error',
          error: 'Error',
          retryCount: 2,
        }

        state = dataLoadingReducer(state, { type: 'RETRY' })
        expect(state.retryCount).toBe(3)
      })
    })

    describe('Transition: Retrying → Loaded', () => {
      it('should transition to Loaded on successful retry', () => {
        const retryingState: DataLoadingStateMachine<TestData> = {
          ...initialState,
          currentState: 'retrying',
          retryCount: 2,
        }

        const newState = dataLoadingReducer(retryingState, {
          type: 'FETCH_SUCCESS',
          data: sampleData,
          timestamp: Date.now(),
        })

        expect(newState.currentState).toBe('loaded')
        expect(newState.data).toEqual(sampleData)
      })
    })

    describe('Transition: Retrying → Error', () => {
      it('should transition back to Error on failed retry', () => {
        const retryingState: DataLoadingStateMachine<TestData> = {
          ...initialState,
          currentState: 'retrying',
          retryCount: 2,
        }

        const newState = dataLoadingReducer(retryingState, {
          type: 'FETCH_ERROR',
          error: 'Still failing',
        })

        expect(newState.currentState).toBe('error')
        expect(newState.error).toBe('Still failing')
        expect(newState.retryCount).toBe(2) // Count preserved
      })
    })

    describe('Transition: Loaded → Refreshing', () => {
      it('should transition to Refreshing when refresh is triggered', () => {
        const loadedState: DataLoadingStateMachine<TestData> = {
          ...initialState,
          currentState: 'loaded',
          data: sampleData,
          lastUpdated: Date.now() - 60000,
        }

        const newState = dataLoadingReducer(loadedState, { type: 'REFRESH' })

        expect(newState.currentState).toBe('refreshing')
        expect(newState.data).toEqual(sampleData) // Keep existing data
      })
    })

    describe('Transition: Refreshing → Loaded (Success)', () => {
      it('should update data on successful refresh', () => {
        const refreshingState: DataLoadingStateMachine<TestData> = {
          ...initialState,
          currentState: 'refreshing',
          data: sampleData,
        }

        const newData: TestData = { items: ['new1', 'new2'], total: 2 }
        const newState = dataLoadingReducer(refreshingState, {
          type: 'FETCH_SUCCESS',
          data: newData,
          timestamp: Date.now(),
        })

        expect(newState.currentState).toBe('loaded')
        expect(newState.data).toEqual(newData)
      })
    })

    describe('Transition: Refreshing → Loaded (Error with stale data)', () => {
      it('should keep existing data on refresh error', () => {
        const refreshingState: DataLoadingStateMachine<TestData> = {
          ...initialState,
          currentState: 'refreshing',
          data: sampleData,
        }

        const newState = dataLoadingReducer(refreshingState, {
          type: 'FETCH_ERROR',
          error: 'Refresh failed',
        })

        expect(newState.currentState).toBe('loaded')
        expect(newState.data).toEqual(sampleData) // Keep existing data
        expect(newState.error).toBe('Refresh failed') // But show error
      })
    })

    describe('Transition: Loaded → Idle (Invalidate)', () => {
      it('should clear data and return to Idle on invalidate', () => {
        const loadedState: DataLoadingStateMachine<TestData> = {
          ...initialState,
          currentState: 'loaded',
          data: sampleData,
          lastUpdated: Date.now(),
        }

        const newState = dataLoadingReducer(loadedState, { type: 'INVALIDATE' })

        expect(newState.currentState).toBe('idle')
        expect(newState.data).toBeNull()
        expect(newState.lastUpdated).toBeNull()
      })
    })

    describe('Reset from any state', () => {
      it('should reset from Loaded state', () => {
        const loadedState: DataLoadingStateMachine<TestData> = {
          ...initialState,
          currentState: 'loaded',
          data: sampleData,
        }

        const newState = dataLoadingReducer(loadedState, { type: 'RESET' })

        expect(newState.currentState).toBe('idle')
        expect(newState.data).toBeNull()
        expect(newState.retryCount).toBe(0)
      })

      it('should reset from Error state', () => {
        const errorState: DataLoadingStateMachine<TestData> = {
          ...initialState,
          currentState: 'error',
          error: 'Some error',
          retryCount: 3,
        }

        const newState = dataLoadingReducer(errorState, { type: 'RESET' })

        expect(newState.currentState).toBe('idle')
        expect(newState.error).toBeNull()
        expect(newState.retryCount).toBe(0)
      })
    })
  })

  describe('Invalid State Transitions (Guards)', () => {
    it('should not allow fetch from Loading state', () => {
      const loadingState: DataLoadingStateMachine<TestData> = {
        ...initialState,
        currentState: 'loading',
      }

      const newState = dataLoadingReducer(loadingState, { type: 'FETCH' })

      expect(newState.currentState).toBe('loading')
    })

    it('should not allow retry from Idle state', () => {
      const newState = dataLoadingReducer(initialState, { type: 'RETRY' })

      expect(newState.currentState).toBe('idle')
    })

    it('should not allow refresh from Idle state', () => {
      const newState = dataLoadingReducer(initialState, { type: 'REFRESH' })

      expect(newState.currentState).toBe('idle')
    })

    it('should not allow invalidate from Loading state', () => {
      const loadingState: DataLoadingStateMachine<TestData> = {
        ...initialState,
        currentState: 'loading',
      }

      const newState = dataLoadingReducer(loadingState, { type: 'INVALIDATE' })

      expect(newState.currentState).toBe('loading')
    })
  })

  describe('Complete Loading Flow Sequences', () => {
    it('should complete successful fetch flow', () => {
      let state = initialState

      // Step 1: Initiate fetch
      state = dataLoadingReducer(state, { type: 'FETCH' })
      expect(state.currentState).toBe('loading')

      // Step 2: Fetch succeeds
      state = dataLoadingReducer(state, {
        type: 'FETCH_SUCCESS',
        data: sampleData,
        timestamp: Date.now(),
      })
      expect(state.currentState).toBe('loaded')
      expect(state.data).toEqual(sampleData)
    })

    it('should complete retry flow after error', () => {
      let state = initialState

      // Step 1: Fetch
      state = dataLoadingReducer(state, { type: 'FETCH' })

      // Step 2: Error
      state = dataLoadingReducer(state, { type: 'FETCH_ERROR', error: 'Failed' })
      expect(state.currentState).toBe('error')

      // Step 3: Retry
      state = dataLoadingReducer(state, { type: 'RETRY' })
      expect(state.currentState).toBe('retrying')
      expect(state.retryCount).toBe(1)

      // Step 4: Success
      state = dataLoadingReducer(state, {
        type: 'FETCH_SUCCESS',
        data: sampleData,
        timestamp: Date.now(),
      })
      expect(state.currentState).toBe('loaded')
    })

    it('should complete refresh flow', () => {
      let state: DataLoadingStateMachine<TestData> = {
        ...initialState,
        currentState: 'loaded',
        data: sampleData,
        lastUpdated: Date.now() - 60000,
      }

      // Step 1: Refresh
      state = dataLoadingReducer(state, { type: 'REFRESH' })
      expect(state.currentState).toBe('refreshing')

      // Step 2: New data
      const newData: TestData = { items: ['updated'], total: 1 }
      state = dataLoadingReducer(state, {
        type: 'FETCH_SUCCESS',
        data: newData,
        timestamp: Date.now(),
      })
      expect(state.currentState).toBe('loaded')
      expect(state.data).toEqual(newData)
    })

    it('should handle multiple retry attempts', () => {
      let state = initialState

      state = dataLoadingReducer(state, { type: 'FETCH' })
      state = dataLoadingReducer(state, { type: 'FETCH_ERROR', error: 'Error 1' })

      // First retry - fails
      state = dataLoadingReducer(state, { type: 'RETRY' })
      expect(state.retryCount).toBe(1)
      state = dataLoadingReducer(state, { type: 'FETCH_ERROR', error: 'Error 2' })

      // Second retry - fails
      state = dataLoadingReducer(state, { type: 'RETRY' })
      expect(state.retryCount).toBe(2)
      state = dataLoadingReducer(state, { type: 'FETCH_ERROR', error: 'Error 3' })

      // Third retry - succeeds
      state = dataLoadingReducer(state, { type: 'RETRY' })
      expect(state.retryCount).toBe(3)
      state = dataLoadingReducer(state, {
        type: 'FETCH_SUCCESS',
        data: sampleData,
        timestamp: Date.now(),
      })

      expect(state.currentState).toBe('loaded')
      expect(state.data).toEqual(sampleData)
    })
  })
})

import { renderHook } from '@testing-library/react'
import { usePermissions } from '@/hooks/usePermissions'

// Mock AuthContext
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}))

import { useAuth } from '@/contexts/AuthContext'

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>

describe('usePermissions', () => {
  test('caregiver has all permissions and correct flags', () => {
    mockUseAuth.mockReturnValue({
      userRole: 'caregiver',
      user: null,
      userProfile: null,
      loading: false,
      setUserRole: jest.fn(),
    })

    const { result } = renderHook(() => usePermissions())

    expect(result.current.userRole).toBe('caregiver')
    expect(result.current.isCaregiver).toBe(true)
    expect(result.current.isPatient).toBe(false)
    expect(result.current.hasPermission('canEditPatientInfo')).toBe(true)
    expect(result.current.hasPermission('canManageMedications')).toBe(true)
    expect(result.current.hasPermission('canDeleteDocuments')).toBe(true)
  })

  test('patient has limited permissions and correct flags', () => {
    mockUseAuth.mockReturnValue({
      userRole: 'patient',
      user: null,
      userProfile: null,
      loading: false,
      setUserRole: jest.fn(),
    })

    const { result } = renderHook(() => usePermissions())

    expect(result.current.userRole).toBe('patient')
    expect(result.current.isCaregiver).toBe(false)
    expect(result.current.isPatient).toBe(true)
    expect(result.current.hasPermission('canViewPatientInfo')).toBe(true)
    expect(result.current.hasPermission('canEditPatientInfo')).toBe(false)
    expect(result.current.hasPermission('canManageMedications')).toBe(false)
  })

  test('null role has no permissions', () => {
    mockUseAuth.mockReturnValue({
      userRole: null,
      user: null,
      userProfile: null,
      loading: false,
      setUserRole: jest.fn(),
    })

    const { result } = renderHook(() => usePermissions())

    expect(result.current.userRole).toBeNull()
    expect(result.current.isCaregiver).toBe(false)
    expect(result.current.isPatient).toBe(false)
    expect(result.current.hasPermission('canViewPatientInfo')).toBe(false)
  })
})

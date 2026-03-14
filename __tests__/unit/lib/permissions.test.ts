import {
  hasPermission,
  getRolePermissions,
  isCaregiver,
  isPatient,
  ROLE_PERMISSIONS,
  type RolePermissions,
} from '@/lib/permissions'

describe('hasPermission', () => {
  const allPermissions = Object.keys(ROLE_PERMISSIONS.caregiver) as (keyof RolePermissions)[]

  test('returns false when role is null', () => {
    allPermissions.forEach((perm) => {
      expect(hasPermission(null, perm)).toBe(false)
    })
  })

  test('returns false when role is undefined', () => {
    allPermissions.forEach((perm) => {
      expect(hasPermission(undefined, perm)).toBe(false)
    })
  })

  test('caregiver has all permissions', () => {
    allPermissions.forEach((perm) => {
      expect(hasPermission('caregiver', perm)).toBe(true)
    })
  })

  test('patient has view and export permissions only', () => {
    const patientTruePermissions: (keyof RolePermissions)[] = [
      'canViewPatientInfo',
      'canViewEmergencySummary',
      'canExportEmergencySummary',
    ]

    allPermissions.forEach((perm) => {
      if (patientTruePermissions.includes(perm)) {
        expect(hasPermission('patient', perm)).toBe(true)
      } else {
        expect(hasPermission('patient', perm)).toBe(false)
      }
    })
  })
})

describe('getRolePermissions', () => {
  test('returns all true for caregiver', () => {
    const perms = getRolePermissions('caregiver')
    Object.values(perms).forEach((val) => {
      expect(val).toBe(true)
    })
  })

  test('returns correct permissions for patient', () => {
    const perms = getRolePermissions('patient')
    expect(perms.canViewPatientInfo).toBe(true)
    expect(perms.canEditPatientInfo).toBe(false)
    expect(perms.canManageMedications).toBe(false)
    expect(perms.canViewEmergencySummary).toBe(true)
    expect(perms.canExportEmergencySummary).toBe(true)
  })

  test('returns the exact ROLE_PERMISSIONS object', () => {
    expect(getRolePermissions('caregiver')).toEqual(ROLE_PERMISSIONS.caregiver)
    expect(getRolePermissions('patient')).toEqual(ROLE_PERMISSIONS.patient)
  })
})

describe('isCaregiver', () => {
  test('returns true for caregiver', () => {
    expect(isCaregiver('caregiver')).toBe(true)
  })

  test('returns false for patient', () => {
    expect(isCaregiver('patient')).toBe(false)
  })

  test('returns false for null', () => {
    expect(isCaregiver(null)).toBe(false)
  })

  test('returns false for undefined', () => {
    expect(isCaregiver(undefined)).toBe(false)
  })
})

describe('isPatient', () => {
  test('returns true for patient', () => {
    expect(isPatient('patient')).toBe(true)
  })

  test('returns false for caregiver', () => {
    expect(isPatient('caregiver')).toBe(false)
  })

  test('returns false for null', () => {
    expect(isPatient(null)).toBe(false)
  })

  test('returns false for undefined', () => {
    expect(isPatient(undefined)).toBe(false)
  })
})

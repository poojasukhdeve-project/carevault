import {
  hasPermission,
  ROLE_PERMISSIONS,
  type UserRole,
  type RolePermissions,
} from '@/lib/permissions'

// Full combination matrix: 4 roles x 13 permissions = 52 test cases

const allPermissions = Object.keys(ROLE_PERMISSIONS.caregiver) as (keyof RolePermissions)[]

const roles: (UserRole | null | undefined)[] = ['caregiver', 'patient', null, undefined]

// Build the complete combination matrix
const combinations: [UserRole | null | undefined, keyof RolePermissions, boolean][] = []

for (const role of roles) {
  for (const perm of allPermissions) {
    let expected: boolean
    if (role === null || role === undefined) {
      expected = false
    } else {
      expected = ROLE_PERMISSIONS[role][perm]
    }
    combinations.push([role, perm, expected])
  }
}

describe('Permission Combination Matrix', () => {
  test.each(combinations)(
    'hasPermission(%s, %s) === %s',
    (role, permission, expected) => {
      expect(hasPermission(role, permission)).toBe(expected)
    }
  )
})

// Verify exact counts of true permissions per role
describe('Permission Count Verification', () => {
  test('caregiver has 13 true permissions (all)', () => {
    const trueCount = allPermissions.filter((p) => hasPermission('caregiver', p)).length
    expect(trueCount).toBe(13)
  })

  test('patient has exactly 3 true permissions', () => {
    const truePerms = allPermissions.filter((p) => hasPermission('patient', p))
    expect(truePerms).toEqual([
      'canViewPatientInfo',
      'canViewEmergencySummary',
      'canExportEmergencySummary',
    ])
    expect(truePerms.length).toBe(3)
  })

  test('null role has 0 true permissions', () => {
    const trueCount = allPermissions.filter((p) => hasPermission(null, p)).length
    expect(trueCount).toBe(0)
  })

  test('undefined role has 0 true permissions', () => {
    const trueCount = allPermissions.filter((p) => hasPermission(undefined, p)).length
    expect(trueCount).toBe(0)
  })
})

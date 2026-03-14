export type UserRole = 'patient' | 'caregiver'

export interface RolePermissions {
  canViewPatientInfo: boolean
  canEditPatientInfo: boolean
  canManageMedications: boolean
  canAddCareLogs: boolean
  canEditCareLogs: boolean
  canDeleteCareLogs: boolean
  canManageAppointments: boolean
  canUploadDocuments: boolean
  canDeleteDocuments: boolean
  canViewEmergencySummary: boolean
  canExportEmergencySummary: boolean
  canManageContacts: boolean
  canManageFinancials: boolean
}

// Role definitions based on system architecture
export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  patient: {
    canViewPatientInfo: true,
    canEditPatientInfo: false,       // Read-only
    canManageMedications: false,      // Read-only
    canAddCareLogs: false,            // Read-only
    canEditCareLogs: false,           // Read-only
    canDeleteCareLogs: false,         // Read-only
    canManageAppointments: false,     // Read-only
    canUploadDocuments: false,        // Read-only
    canDeleteDocuments: false,        // Read-only
    canViewEmergencySummary: true,
    canExportEmergencySummary: true,  // Can export their own summary
    canManageContacts: false,         // Read-only
    canManageFinancials: false        // Read-only
  },
  caregiver: {
    canViewPatientInfo: true,
    canEditPatientInfo: true,         // Full access
    canManageMedications: true,       // Full access
    canAddCareLogs: true,             // Full access
    canEditCareLogs: true,            // Full access
    canDeleteCareLogs: true,          // Full access
    canManageAppointments: true,      // Full access
    canUploadDocuments: true,         // Full access
    canDeleteDocuments: true,         // Full access
    canViewEmergencySummary: true,
    canExportEmergencySummary: true,
    canManageContacts: true,          // Full access
    canManageFinancials: true         // Full access
  }
}

/**
 * Check if a user has a specific permission
 */
export function hasPermission(
  role: UserRole | null | undefined, 
  permission: keyof RolePermissions
): boolean {
  if (!role) return false
  return ROLE_PERMISSIONS[role][permission]
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: UserRole): RolePermissions {
  return ROLE_PERMISSIONS[role]
}

/**
 * Check if user is a caregiver
 */
export function isCaregiver(role: UserRole | null | undefined): boolean {
  return role === 'caregiver'
}

/**
 * Check if user is a patient
 */
export function isPatient(role: UserRole | null | undefined): boolean {
  return role === 'patient'
}

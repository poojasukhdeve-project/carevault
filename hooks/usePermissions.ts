import { useAuth } from '@/contexts/AuthContext'
import { hasPermission } from '@/lib/permissions'
import type { RolePermissions } from '@/lib/permissions'

/**
 * Hook to check user permissions
 */
export function usePermissions() {
  const { userRole } = useAuth()

  const checkPermission = (permission: keyof RolePermissions): boolean => {
    return hasPermission(userRole, permission)
  }

  return {
    userRole,
    hasPermission: checkPermission,
    isCaregiver: userRole === 'caregiver',
    isPatient: userRole === 'patient'
  }
}

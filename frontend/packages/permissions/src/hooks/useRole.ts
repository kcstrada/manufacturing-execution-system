import { useMemo } from 'react'
import { usePermissionContext } from '../contexts/PermissionContext'
import { UseRoleOptions } from '../types/permissions.types'

export const useRole = (options: UseRoleOptions = {}): boolean => {
  const { role, roles, requireAll = false } = options
  const { hasRole, hasAnyRole, hasAllRoles } = usePermissionContext()

  const hasRequiredRole = useMemo(() => {
    if (role) {
      return hasRole(role)
    }

    if (roles && roles.length > 0) {
      return requireAll ? hasAllRoles(roles) : hasAnyRole(roles)
    }

    return false
  }, [role, roles, requireAll, hasRole, hasAnyRole, hasAllRoles])

  return hasRequiredRole
}

export const useHasRole = (role: string): boolean => {
  const { hasRole } = usePermissionContext()
  return hasRole(role)
}

export const useHasAnyRole = (roles: string[]): boolean => {
  const { hasAnyRole } = usePermissionContext()
  return hasAnyRole(roles)
}

export const useHasAllRoles = (roles: string[]): boolean => {
  const { hasAllRoles } = usePermissionContext()
  return hasAllRoles(roles)
}
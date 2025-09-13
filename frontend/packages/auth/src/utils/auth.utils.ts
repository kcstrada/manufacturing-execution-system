import { User } from '../types/auth.types'

/**
 * Check if a user has a specific role
 */
export const userHasRole = (user: User | null, role: string): boolean => {
  return user?.roles?.includes(role) || false
}

/**
 * Check if a user has any of the specified roles
 */
export const userHasAnyRole = (user: User | null, roles: string[]): boolean => {
  if (!user || !user.roles) return false
  return roles.some(role => user.roles.includes(role))
}

/**
 * Check if a user has all of the specified roles
 */
export const userHasAllRoles = (user: User | null, roles: string[]): boolean => {
  if (!user || !user.roles) return false
  return roles.every(role => user.roles.includes(role))
}

/**
 * Check if a user has a specific permission
 */
export const userHasPermission = (user: User | null, permission: string): boolean => {
  return user?.permissions?.includes(permission) || false
}

/**
 * Check if a user has any of the specified permissions
 */
export const userHasAnyPermission = (user: User | null, permissions: string[]): boolean => {
  if (!user || !user.permissions) return false
  return permissions.some(permission => user.permissions.includes(permission))
}

/**
 * Check if a user has all of the specified permissions
 */
export const userHasAllPermissions = (user: User | null, permissions: string[]): boolean => {
  if (!user || !user.permissions) return false
  return permissions.every(permission => user.permissions.includes(permission))
}

/**
 * Get display name for a user
 */
export const getUserDisplayName = (user: User | null): string => {
  if (!user) return 'Unknown User'
  
  if (user.firstName && user.lastName) {
    return `${user.firstName} ${user.lastName}`
  }
  
  return user.username || user.email || 'Unknown User'
}

/**
 * Get user initials for avatar
 */
export const getUserInitials = (user: User | null): string => {
  if (!user) return '??'
  
  if (user.firstName && user.lastName) {
    return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
  }
  
  if (user.username) {
    return user.username.substring(0, 2).toUpperCase()
  }
  
  if (user.email) {
    return user.email.substring(0, 2).toUpperCase()
  }
  
  return '??'
}

/**
 * Role hierarchy definitions for manufacturing system
 */
export const ROLE_HIERARCHY = {
  SUPER_ADMIN: ['super_admin'],
  ADMIN: ['admin', 'manager', 'operator', 'viewer'],
  MANAGER: ['manager', 'operator', 'viewer'],
  OPERATOR: ['operator', 'viewer'],
  VIEWER: ['viewer'],
}

/**
 * Check if a user has a role based on hierarchy
 */
export const userHasRoleWithHierarchy = (
  user: User | null,
  requiredRole: string
): boolean => {
  if (!user || !user.roles) return false
  
  // Check direct role
  if (user.roles.includes(requiredRole)) return true
  
  // Check if user has a higher role in hierarchy
  for (const [higherRole, includedRoles] of Object.entries(ROLE_HIERARCHY)) {
    if (user.roles.includes(higherRole.toLowerCase()) && 
        includedRoles.includes(requiredRole)) {
      return true
    }
  }
  
  return false
}

/**
 * Manufacturing-specific role checks
 */
export const isProductionManager = (user: User | null): boolean => {
  return userHasAnyRole(user, ['production_manager', 'manager', 'admin', 'super_admin'])
}

export const isQualityInspector = (user: User | null): boolean => {
  return userHasAnyRole(user, ['quality_inspector', 'quality_manager', 'admin', 'super_admin'])
}

export const isMaintenanceTechnician = (user: User | null): boolean => {
  return userHasAnyRole(user, ['maintenance_tech', 'maintenance_manager', 'admin', 'super_admin'])
}

export const isOperator = (user: User | null): boolean => {
  return userHasAnyRole(user, ['operator', 'senior_operator', 'manager', 'admin', 'super_admin'])
}

export const isAdmin = (user: User | null): boolean => {
  return userHasAnyRole(user, ['admin', 'super_admin'])
}

/**
 * Format role name for display
 */
export const formatRoleName = (role: string): string => {
  return role
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Get role badge color based on role type
 */
export const getRoleBadgeColor = (role: string): string => {
  const roleColors: Record<string, string> = {
    super_admin: 'badge-error',
    admin: 'badge-warning',
    manager: 'badge-info',
    production_manager: 'badge-primary',
    quality_inspector: 'badge-secondary',
    quality_manager: 'badge-secondary',
    maintenance_tech: 'badge-accent',
    maintenance_manager: 'badge-accent',
    operator: 'badge-success',
    senior_operator: 'badge-success',
    viewer: 'badge-ghost',
  }
  
  return roleColors[role.toLowerCase()] || 'badge-neutral'
}
export interface PermissionCheckRequest {
  user: string
  relation: string
  object: string
}

export interface PermissionContext {
  checkPermission: (relation: string, object: string) => Promise<boolean>
  checkMultiplePermissions: (checks: Omit<PermissionCheckRequest, 'user'>[]) => Promise<boolean[]>
  hasRole: (role: string) => boolean
  hasAnyRole: (roles: string[]) => boolean
  hasAllRoles: (roles: string[]) => boolean
  isLoading: boolean
  error: Error | null
}

export type PermissionRelation = 
  | 'viewer'
  | 'editor'
  | 'creator'
  | 'assigned'
  | 'owner'
  | 'executive'
  | 'sales'
  | 'worker'

export type PermissionObject = 
  | `organization:${string}`
  | `order:${string}`
  | `task:${string}`
  | `product:${string}`
  | `inventory:${string}`
  | `equipment:${string}`
  | `report:${string}`

export interface PermissionGateProps {
  children: React.ReactNode
  relation?: PermissionRelation
  object?: PermissionObject
  role?: string
  roles?: string[]
  requireAll?: boolean
  fallback?: React.ReactNode
  loading?: React.ReactNode
}

export interface UsePermissionOptions {
  relation: PermissionRelation
  object: PermissionObject
  skip?: boolean
  onSuccess?: () => void
  onError?: (error: Error) => void
}

export interface UseRoleOptions {
  role?: string
  roles?: string[]
  requireAll?: boolean
}
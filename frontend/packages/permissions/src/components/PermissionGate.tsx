import React from 'react'
import { usePermission } from '../hooks/usePermission'
import { useRole } from '../hooks/useRole'
import { PermissionGateProps } from '../types/permissions.types'

export const PermissionGate: React.FC<PermissionGateProps> = ({
  children,
  relation,
  object,
  role,
  roles,
  requireAll = false,
  fallback = null,
  loading = null,
}) => {
  const permissionCheck = usePermission({
    relation: relation!,
    object: object!,
    skip: !relation || !object,
  })

  const hasRequiredRole = useRole({
    role,
    roles,
    requireAll,
  })

  const isPermissionBased = relation && object
  const isRoleBased = role || (roles && roles.length > 0)

  if (isPermissionBased && permissionCheck.isLoading) {
    return <>{loading}</>
  }

  let hasAccess = true

  if (isPermissionBased) {
    hasAccess = hasAccess && (permissionCheck.hasPermission === true)
  }

  if (isRoleBased) {
    hasAccess = hasAccess && hasRequiredRole
  }

  if (hasAccess) {
    return <>{children}</>
  }

  return <>{fallback}</>
}

export const CanView: React.FC<{
  object: string
  children: React.ReactNode
  fallback?: React.ReactNode
  loading?: React.ReactNode
}> = ({ object, children, fallback, loading }) => (
  <PermissionGate
    relation="viewer"
    object={object as any}
    fallback={fallback}
    loading={loading}
  >
    {children}
  </PermissionGate>
)

export const CanEdit: React.FC<{
  object: string
  children: React.ReactNode
  fallback?: React.ReactNode
  loading?: React.ReactNode
}> = ({ object, children, fallback, loading }) => (
  <PermissionGate
    relation="editor"
    object={object as any}
    fallback={fallback}
    loading={loading}
  >
    {children}
  </PermissionGate>
)

export const RequireRole: React.FC<{
  role?: string
  roles?: string[]
  requireAll?: boolean
  children: React.ReactNode
  fallback?: React.ReactNode
}> = ({ role, roles, requireAll, children, fallback }) => (
  <PermissionGate
    role={role}
    roles={roles}
    requireAll={requireAll}
    fallback={fallback}
  >
    {children}
  </PermissionGate>
)
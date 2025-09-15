import React, { useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'

export interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRoles?: string[]
  requiredPermissions?: string[]
  requireAll?: boolean // If true, user must have ALL roles/permissions. If false, ANY role/permission is sufficient
  fallback?: React.ReactNode
  redirectTo?: string
  onUnauthorized?: () => void
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRoles = [],
  requiredPermissions = [],
  requireAll = false,
  fallback,
  redirectTo,
  onUnauthorized,
}) => {
  const { isAuthenticated, isLoading, hasRole, hasPermission, hasAnyRole, hasAllRoles, login } = useAuth()

  // Trigger login if not authenticated (but not if we're processing an auth callback)
  useEffect(() => {
    const hasAuthCode = window.location.hash.includes('code=') || window.location.search.includes('code=')
    const hasError = window.location.hash.includes('error=') || window.location.search.includes('error=')

    // Don't trigger login if we're processing an auth response
    if (!isLoading && !isAuthenticated && !hasAuthCode && !hasError) {
      login()
    }
  }, [isLoading, isAuthenticated, login])

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    )
  }

  // Check authentication
  if (!isAuthenticated) {
    // Will trigger login via useEffect
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    )
  }

  // Check roles
  if (requiredRoles.length > 0) {
    const hasRequiredRoles = requireAll 
      ? hasAllRoles(requiredRoles)
      : hasAnyRole(requiredRoles)

    if (!hasRequiredRoles) {
      if (onUnauthorized) {
        onUnauthorized()
      }
      return <>{fallback || <UnauthorizedMessage />}</>
    }
  }

  // Check permissions
  if (requiredPermissions.length > 0) {
    const hasRequiredPermissions = requireAll
      ? requiredPermissions.every(permission => hasPermission(permission))
      : requiredPermissions.some(permission => hasPermission(permission))

    if (!hasRequiredPermissions) {
      if (onUnauthorized) {
        onUnauthorized()
      }
      return <>{fallback || <UnauthorizedMessage />}</>
    }
  }

  // User is authorized
  return <>{children}</>
}

const UnauthorizedMessage: React.FC = () => (
  <div className="flex flex-col items-center justify-center min-h-screen">
    <div className="text-center">
      <h1 className="text-4xl font-bold text-error mb-4">401</h1>
      <h2 className="text-2xl font-semibold mb-2">Unauthorized Access</h2>
      <p className="text-gray-600 mb-8">
        You don't have permission to access this resource.
      </p>
      <button
        onClick={() => window.history.back()}
        className="btn btn-primary"
      >
        Go Back
      </button>
    </div>
  </div>
)
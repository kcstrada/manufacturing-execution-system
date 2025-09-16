'use client'

import { StoreProvider } from '@mes/store'
import { IntegratedQueryProvider } from '@mes/query'
import { AuthProvider, ProtectedRoute, useAuth } from '@mes/auth'
import { ReactNode, useCallback } from 'react'

interface ProvidersProps {
  children: ReactNode
}

const keycloakConfig = {
  url: process.env.NEXT_PUBLIC_KEYCLOAK_URL || 'http://localhost:8080',
  realm: process.env.NEXT_PUBLIC_KEYCLOAK_REALM || 'mes',
  clientId: process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID || 'admin-portal',
}

// Access Denied component that can use auth context
function AccessDeniedContent() {
  const { user } = useAuth()

  const handleSwitchAccount = useCallback(() => {
    // Direct Keycloak logout with post_logout_redirect_uri
    const logoutUrl = `${keycloakConfig.url}/realms/${keycloakConfig.realm}/protocol/openid-connect/logout?client_id=${keycloakConfig.clientId}&post_logout_redirect_uri=${encodeURIComponent(window.location.origin)}`
    window.location.href = logoutUrl
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-white/20">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-white text-center mb-2">
            Access Restricted
          </h1>

          <p className="text-gray-300 text-center mb-6">
            This area requires elevated privileges
          </p>

          {/* Debug info */}
          {user && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mb-4">
              <p className="text-xs text-yellow-300 mb-1">Current User: {user.username || user.email}</p>
              <p className="text-xs text-yellow-300">Your Roles: {user.roles?.join(', ') || 'No roles found'}</p>
            </div>
          )}

          <div className="bg-black/30 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <svg className="w-5 h-5 text-yellow-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 2a8 8 0 100 16 8 8 0 000-16zM8 7a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1zm4 0a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div className="flex-1">
                <p className="text-sm text-gray-200 font-medium">Required Roles:</p>
                <div className="mt-1 flex flex-wrap gap-2">
                  <span className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full">admin</span>
                  <span className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-full">super_admin</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleSwitchAccount}
              className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-blue-700 transition-all duration-200 flex items-center justify-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              <span>Sign in with different account</span>
            </button>

            <button
              onClick={() => window.location.href = '/'}
              className="w-full py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-all duration-200"
            >
              Return to Dashboard
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-white/10">
            <p className="text-xs text-gray-400 text-center">
              If you believe you should have access, please contact your system administrator
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export function Providers({ children }: ProvidersProps) {
  return (
    <StoreProvider>
      <IntegratedQueryProvider>
        <AuthProvider
          keycloakConfig={keycloakConfig}
          onAuthSuccess={(user) => {
            console.log('Authentication successful:', user)
            console.log('User roles:', user.roles)
            // Verify user has admin or super_admin role
            if (!user.roles?.includes('admin') && !user.roles?.includes('super_admin')) {
              console.error('User does not have admin or super_admin role. Current roles:', user.roles)
            }
          }}
          onAuthError={(error) => {
            console.error('Authentication error:', error)
          }}
        >
          <ProtectedRoute
            requiredRoles={['admin', 'super_admin']}
            fallback={<AccessDeniedContent />}
          >
            {children}
          </ProtectedRoute>
        </AuthProvider>
      </IntegratedQueryProvider>
    </StoreProvider>
  )
}
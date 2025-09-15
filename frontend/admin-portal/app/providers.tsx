'use client'

import { StoreProvider } from '@mes/store'
import { IntegratedQueryProvider } from '@mes/query'
import { AuthProvider, ProtectedRoute } from '@mes/auth'
import { ReactNode } from 'react'
import { useRouter } from 'next/navigation'

interface ProvidersProps {
  children: ReactNode
}

const keycloakConfig = {
  url: process.env.NEXT_PUBLIC_KEYCLOAK_URL || 'http://localhost:8080',
  realm: process.env.NEXT_PUBLIC_KEYCLOAK_REALM || 'MES',
  clientId: process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID || 'admin-portal',
}

export function Providers({ children }: ProvidersProps) {
  return (
    <StoreProvider>
      <IntegratedQueryProvider>
        <AuthProvider
          keycloakConfig={keycloakConfig}
          onAuthSuccess={(user) => {
            console.log('Authentication successful:', user)
            // Verify user has admin role
            if (!user.roles?.includes('admin')) {
              console.error('User does not have admin role')
            }
          }}
          onAuthError={(error) => {
            console.error('Authentication error:', error)
          }}
        >
          <ProtectedRoute
            requiredRoles={['admin']}
            fallback={
              <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
                <div className="text-center p-8 bg-white rounded-lg shadow-lg">
                  <h1 className="text-3xl font-bold text-red-600 mb-4">Access Denied</h1>
                  <p className="text-gray-700 mb-6">
                    You need admin role to access the Admin Portal.
                  </p>
                  <p className="text-sm text-gray-500">
                    Please contact your system administrator for access.
                  </p>
                </div>
              </div>
            }
          >
            {children}
          </ProtectedRoute>
        </AuthProvider>
      </IntegratedQueryProvider>
    </StoreProvider>
  )
}
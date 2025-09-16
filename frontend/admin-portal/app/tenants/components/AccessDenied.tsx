'use client'

import { ShieldOff, LogIn, Home, AlertTriangle } from 'lucide-react'

interface AccessDeniedProps {
  onLogin?: () => void
  message?: string
}

export function AccessDenied({ message }: AccessDeniedProps) {
  const handleSwitchAccount = () => {
    // Direct Keycloak logout with redirect back to login
    const keycloakUrl = process.env.NEXT_PUBLIC_KEYCLOAK_URL || 'http://localhost:8080'
    const realm = process.env.NEXT_PUBLIC_KEYCLOAK_REALM || 'mes'
    const clientId = process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID || 'admin-portal'
    const logoutUrl = `${keycloakUrl}/realms/${realm}/protocol/openid-connect/logout?client_id=${clientId}&post_logout_redirect_uri=${encodeURIComponent(window.location.origin)}`
    window.location.href = logoutUrl
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-white/20">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center">
                <ShieldOff className="w-10 h-10 text-red-500" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-white text-center mb-2">
            Tenant Management Restricted
          </h1>

          <p className="text-gray-300 text-center mb-6">
            {message || 'This area is restricted to system administrators only'}
          </p>

          <div className="bg-black/30 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-gray-200 font-medium mb-2">Required Permissions:</p>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                    <span className="text-xs text-gray-300">Role: <span className="text-purple-300 font-mono">super_admin</span></span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <span className="text-xs text-gray-300">Access: System Administration</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="text-xs text-gray-300">Scope: Tenant Management</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleSwitchAccount}
              className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-blue-700 transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg"
            >
              <LogIn className="w-5 h-5" />
              <span>Sign in with Different Account</span>
            </button>

            <a
              href="/"
              className="w-full py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2 block"
            >
              <Home className="w-5 h-5" />
              <span>Return to Dashboard</span>
            </a>
          </div>

          <div className="mt-6 pt-6 border-t border-white/10">
            <p className="text-xs text-gray-400 text-center">
              If you believe you should have access, please contact your system administrator.
              The current user must have the <span className="text-purple-300 font-mono">super_admin</span> role
              assigned in Keycloak.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
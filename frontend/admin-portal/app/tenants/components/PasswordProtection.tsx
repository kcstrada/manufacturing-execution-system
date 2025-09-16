'use client'

import { useState } from 'react'
import { Lock, Eye, EyeOff, Shield } from 'lucide-react'

interface PasswordProtectionProps {
  onAuthenticated: () => void
}

export function PasswordProtection({ onAuthenticated }: PasswordProtectionProps) {
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [attempts, setAttempts] = useState(0)

  // Only super_admin can access this page
  const SUPER_ADMIN_PASSWORD = 'SuperAdmin@2024' // In production, validate against backend

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (attempts >= 5) {
      setError('Too many failed attempts. Please contact system administrator.')
      return
    }

    if (password === SUPER_ADMIN_PASSWORD) {
      // Store authentication with super_admin role
      sessionStorage.setItem('tenant-admin-auth', 'true')
      sessionStorage.setItem('tenant-auth-time', Date.now().toString())
      sessionStorage.setItem('tenant-auth-role', 'super_admin')
      onAuthenticated()
    } else {
      setAttempts(prev => prev + 1)
      setError(`Access denied. Only super_admin role can access this page. ${5 - attempts} attempts remaining.`)
      setPassword('')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-unimore-primary/5 to-unimore-primary/10 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-unimore-primary/10 rounded-full flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-unimore-primary" />
          </div>
          <h1 className="text-2xl font-bold text-unimore-navy">Tenant Management</h1>
          <p className="text-unimore-gray mt-2 text-center">
            This area is restricted to <span className="font-semibold">super_admin</span> role only
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-unimore-gray-dark mb-2">
              Super Admin Password
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                <Lock className="w-5 h-5 text-unimore-gray" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setError('')
                }}
                className={`w-full pl-10 pr-10 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-unimore-primary ${
                  error ? 'border-red-500' : 'border-unimore-gray-light'
                }`}
                placeholder="Enter password"
                disabled={attempts >= 5}
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-unimore-gray hover:text-unimore-navy"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            {error && (
              <p className="mt-2 text-sm text-red-500">{error}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={!password || attempts >= 5}
            className="w-full py-3 bg-unimore-primary text-white rounded-lg hover:bg-unimore-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            Access Tenant Management
          </button>
        </form>

        <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <div className="flex gap-2">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm text-yellow-800 font-medium">Security Notice</p>
              <p className="text-xs text-yellow-700 mt-1">
                This area contains sensitive tenant configuration. All access attempts are logged and monitored.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
'use client'

import { useState } from 'react'
import { X, Loader2, UserPlus, ShieldCheck, Check, AlertCircle } from 'lucide-react'

interface UserCreationModalProps {
  isOpen: boolean
  onClose: () => void
  tenantId: string
  tenantName: string
  onSuccess?: () => void
}

export function UserCreationModal({ isOpen, onClose, tenantId, tenantName, onSuccess }: UserCreationModalProps) {
  const [selectedRole, setSelectedRole] = useState<'super_admin' | 'executive' | 'admin' | 'worker' | 'sales'>('worker')
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    password: '',
  })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    message: string
    credentials?: {
      username: string
      password: string
    }
  } | null>(null)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setResult(null)

    try {
      const endpoint = selectedRole === 'super_admin' || selectedRole === 'admin' || selectedRole === 'executive'
        ? `http://localhost:3000/api/v1/tenants/${tenantId}/users/create-admin`
        : `http://localhost:3000/api/v1/tenants/${tenantId}/users/create`

      const rolePrefix = selectedRole === 'executive' ? 'exec' : selectedRole === 'super_admin' ? 'super' : selectedRole
      const defaultPassword = selectedRole === 'super_admin' || selectedRole === 'admin' || selectedRole === 'executive' ? 'Admin@123' : 'User@123'

      const body = {
        username: formData.username || `${rolePrefix}_${tenantId}`,
        email: formData.email || `${rolePrefix}@${tenantId}.local`,
        firstName: formData.firstName || selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1),
        lastName: formData.lastName || tenantName,
        password: formData.password || defaultPassword,
        role: selectedRole
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      const data = await response.json()

      if (data.success) {
        const rolePrefix = selectedRole === 'executive' ? 'exec' : selectedRole
        const username = data.user?.username || formData.username ||
          `${rolePrefix}_${tenantId}_${Date.now()}`
        const password = formData.password ||
          (selectedRole === 'admin' || selectedRole === 'executive' ? 'Admin@123' : 'User@123')

        setResult({
          success: true,
          message: `${selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)} user created successfully!`,
          credentials: { username, password }
        })

        // Call onSuccess callback to refresh tenant data
        if (onSuccess) {
          onSuccess()
        }
      } else {
        setResult({
          success: false,
          message: data.message || 'Failed to create user'
        })
      }
    } catch (error) {
      setResult({
        success: false,
        message: 'Network error. Please check your connection.'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setFormData({ username: '', email: '', firstName: '', lastName: '', password: '' })
    setResult(null)
    setSelectedRole('worker')
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Create User for {tenantName}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {!result ? (
          <form onSubmit={handleSubmit} className="p-6">
            {/* Role Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                User Role
              </label>
              <div className="space-y-2">
                {/* Super Admin - Full width for emphasis */}
                <button
                  type="button"
                  onClick={() => setSelectedRole('super_admin')}
                  className={`w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border-2 transition-all text-sm ${
                    selectedRole === 'super_admin'
                      ? 'border-red-500 bg-red-50 text-red-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span className="font-medium">Super Admin</span>
                </button>

                {/* Other roles in grid */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedRole('executive')}
                    className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border-2 transition-all text-sm ${
                      selectedRole === 'executive'
                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span className="font-medium">Executive</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedRole('admin')}
                    className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border-2 transition-all text-sm ${
                      selectedRole === 'admin'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span className="font-medium">Admin</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedRole('worker')}
                    className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border-2 transition-all text-sm ${
                      selectedRole === 'worker'
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <UserPlus className="w-4 h-4" />
                    <span className="font-medium">Worker</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedRole('sales')}
                    className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border-2 transition-all text-sm ${
                      selectedRole === 'sales'
                        ? 'border-orange-500 bg-orange-50 text-orange-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <UserPlus className="w-4 h-4" />
                    <span className="font-medium">Sales</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username <span className="text-gray-400 text-xs">(default: {selectedRole === 'executive' ? 'exec' : selectedRole}_{tenantId})</span>
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                  placeholder={`${selectedRole === 'executive' ? 'exec' : selectedRole}_${tenantId}`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-gray-400 text-xs">(default: {selectedRole === 'executive' ? 'exec' : selectedRole}@{tenantId}.local)</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                  placeholder={`${selectedRole === 'executive' ? 'exec' : selectedRole}@${tenantId}.local`}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                    placeholder={selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                    placeholder={tenantName}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password <span className="text-gray-400 text-xs">(default: {selectedRole === 'admin' || selectedRole === 'executive' ? 'Admin@123' : 'User@123'})</span>
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                  placeholder={selectedRole === 'admin' || selectedRole === 'executive' ? 'Admin@123' : 'User@123'}
                />
                <p className="text-xs text-gray-500 mt-1">
                  User will be prompted to change password on first login
                </p>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-6 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating User...
                </>
              ) : (
                <>
                  {selectedRole === 'admin' || selectedRole === 'executive' ? <ShieldCheck className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                  Create {selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)} User
                </>
              )}
            </button>
          </form>
        ) : (
          <div className="p-6">
            {result.success ? (
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {result.message}
                </h3>
                {result.credentials && (
                  <div className="bg-gray-50 rounded-lg p-4 mt-4 text-left">
                    <h4 className="font-medium text-gray-900 mb-2">Login Credentials</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Username:</span>
                        <span className="font-mono font-medium">{result.credentials.username}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Password:</span>
                        <span className="font-mono font-medium">{result.credentials.password}</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-3">
                      The user will be prompted to change their password on first login
                    </p>
                  </div>
                )}
                <button
                  onClick={handleClose}
                  className="mt-6 px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Done
                </button>
              </div>
            ) : (
              <div className="text-center">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Creation Failed
                </h3>
                <p className="text-gray-600 mb-6">{result.message}</p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => setResult(null)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={handleClose}
                    className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, LogOut, Loader2 } from 'lucide-react'
import { AccessDenied } from './components/AccessDenied'
import { TenantList } from './components/TenantList'
import { TenantForm } from './components/TenantForm'
import { UserCreationModal } from './components/UserCreationModal'
import { UserListModal } from './components/UserListModal'
import { useTenants } from './hooks/useTenants'
import { useAuth } from '@mes/auth'

export default function TenantsPage() {
  const [showForm, setShowForm] = useState(false)
  const [selectedTenant, setSelectedTenant] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showUserModal, setShowUserModal] = useState(false)
  const [userModalTenant, setUserModalTenant] = useState<{ id: string; name: string } | null>(null)
  const [showUserListModal, setShowUserListModal] = useState(false)
  const [userListTenant, setUserListTenant] = useState<{ id: string; name: string } | null>(null)

  const { tenants, loading: tenantsLoading, error, createTenant, updateTenant, deleteTenant, refreshTenants } = useTenants()
  const { user, isLoading: authLoading, isAuthenticated, hasRole } = useAuth()
  const isSuperAdmin = hasRole('super_admin')

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-gray-600" />
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    )
  }

  // Check if user is authenticated and has super_admin role
  if (!isAuthenticated || !isSuperAdmin) {
    console.log('Access denied - isAuthenticated:', isAuthenticated, 'isSuperAdmin:', isSuperAdmin)
    console.log('User roles:', user?.roles)
    return <AccessDenied />
  }

  const handleSave = async (data: any) => {
    if (selectedTenant) {
      await updateTenant(selectedTenant.id, data)
    } else {
      await createTenant(data)
    }
    setShowForm(false)
    setSelectedTenant(null)
  }

  const handleEdit = (tenant: any) => {
    setSelectedTenant(tenant)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Delete this tenant?')) {
      await deleteTenant(id)
    }
  }

  const handleCreateAdmin = async (tenantId: string) => {
    const tenant = tenants.find(t => t.id === tenantId || t.slug === tenantId)
    if (tenant) {
      setUserModalTenant({ id: tenantId, name: tenant.name })
      setShowUserModal(true)
    }
  }

  const handleCreateUser = async (tenantId: string) => {
    const tenant = tenants.find(t => t.id === tenantId || t.slug === tenantId)
    if (tenant) {
      setUserModalTenant({ id: tenantId, name: tenant.name })
      setShowUserModal(true)
    }
  }

  const handleViewUsers = async (tenantId: string) => {
    const tenant = tenants.find(t => t.id === tenantId || t.slug === tenantId)
    if (tenant) {
      setUserListTenant({ id: tenantId, name: tenant.name })
      setShowUserListModal(true)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Tenants</h1>
              <p className="text-sm text-gray-600 mt-1">
                Logged in as: <span className="font-medium">{user?.username || user?.email}</span>
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setSelectedTenant(null)
                  setShowForm(true)
                }}
                className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Tenant
              </button>
              <button
                onClick={() => {
                  // Direct Keycloak logout with redirect
                  const keycloakUrl = process.env.NEXT_PUBLIC_KEYCLOAK_URL || 'http://localhost:8080'
                  const realm = process.env.NEXT_PUBLIC_KEYCLOAK_REALM || 'mes'
                  const redirectUri = encodeURIComponent(window.location.origin)
                  window.location.href = `${keycloakUrl}/realms/${realm}/protocol/openid-connect/logout?post_logout_redirect_uri=${redirectUri}&client_id=admin-portal`
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search tenants..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            />
          </div>
        </div>

        {/* Content */}
        {tenantsLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg">
            {error}
          </div>
        ) : (
          <TenantList
            tenants={tenants}
            searchQuery={searchQuery}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onCreateAdmin={handleCreateAdmin}
            onCreateUser={handleCreateUser}
            onViewUsers={handleViewUsers}
          />
        )}

        {/* Form Modal */}
        {showForm && (
          <TenantForm
            tenant={selectedTenant}
            onClose={() => {
              setShowForm(false)
              setSelectedTenant(null)
            }}
            onSave={handleSave}
          />
        )}

        {/* User Creation Modal */}
        {showUserModal && userModalTenant && (
          <UserCreationModal
            isOpen={showUserModal}
            onClose={() => {
              setShowUserModal(false)
              setUserModalTenant(null)
            }}
            tenantId={userModalTenant.id}
            tenantName={userModalTenant.name}
            onSuccess={refreshTenants}
          />
        )}

        {/* User List Modal */}
        {showUserListModal && userListTenant && (
          <UserListModal
            isOpen={showUserListModal}
            onClose={() => {
              setShowUserListModal(false)
              setUserListTenant(null)
            }}
            tenantId={userListTenant.id}
            tenantName={userListTenant.name}
          />
        )}
      </div>
    </div>
  )
}
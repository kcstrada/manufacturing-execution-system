'use client'

import { Edit2, Trash2, UserPlus, ShieldCheck, Users } from 'lucide-react'

interface TenantListProps {
  tenants: any[]
  searchQuery: string
  onEdit: (tenant: any) => void
  onDelete: (id: string) => void
  onCreateAdmin: (tenantId: string) => void
  onCreateUser: (tenantId: string) => void
  onViewUsers: (tenantId: string) => void
}

export function TenantList({ tenants, searchQuery, onEdit, onDelete, onCreateAdmin, onCreateUser, onViewUsers }: TenantListProps) {
  const filteredTenants = tenants.filter(tenant =>
    tenant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tenant.slug.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (filteredTenants.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No tenants found
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left px-6 py-3 text-sm font-medium text-gray-700">Name</th>
            <th className="text-left px-6 py-3 text-sm font-medium text-gray-700">Domain</th>
            <th className="text-left px-6 py-3 text-sm font-medium text-gray-700">Plan</th>
            <th className="text-left px-6 py-3 text-sm font-medium text-gray-700">Status</th>
            <th className="text-left px-6 py-3 text-sm font-medium text-gray-700">Users</th>
            <th className="px-6 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {filteredTenants.map((tenant) => (
            <tr key={tenant.id} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="px-6 py-4">
                <div>
                  <div className="text-sm font-medium text-gray-900">{tenant.name}</div>
                  <div className="text-xs text-gray-500">{tenant.slug}</div>
                </div>
              </td>
              <td className="px-6 py-4">
                <span className="text-sm text-gray-600">
                  {tenant.customDomain || tenant.subdomain || '-'}
                </span>
              </td>
              <td className="px-6 py-4">
                <span className={`inline-block px-2 py-1 text-xs rounded-md ${
                  tenant.billing?.plan === 'enterprise' ? 'bg-purple-100 text-purple-700' :
                  tenant.billing?.plan === 'professional' ? 'bg-blue-100 text-blue-700' :
                  tenant.billing?.plan === 'starter' ? 'bg-green-100 text-green-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {tenant.billing?.plan || 'free'}
                </span>
              </td>
              <td className="px-6 py-4">
                <span className={`inline-flex items-center gap-1 text-sm ${
                  tenant.isActive ? 'text-green-600' : 'text-gray-400'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${
                    tenant.isActive ? 'bg-green-500' : 'bg-gray-400'
                  }`} />
                  {tenant.isActive ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td className="px-6 py-4">
                <span className="text-sm text-gray-600">{tenant.userCount || 0}</span>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onViewUsers(tenant.id || tenant.slug)}
                    className="p-1 text-gray-400 hover:text-purple-600 transition-colors"
                    title="View Users"
                  >
                    <Users className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onCreateAdmin(tenant.id || tenant.slug)}
                    className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                    title="Create Admin User"
                  >
                    <ShieldCheck className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onCreateUser(tenant.id || tenant.slug)}
                    className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                    title="Create Regular User"
                  >
                    <UserPlus className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onEdit(tenant)}
                    className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                    title="Edit Tenant"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDelete(tenant.id)}
                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                    title="Delete Tenant"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
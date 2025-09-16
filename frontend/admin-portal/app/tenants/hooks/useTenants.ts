'use client'

import { useState, useEffect } from 'react'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1'

export function useTenants() {
  const [tenants, setTenants] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Mock data for development
  const mockTenants = [
    {
      id: '1',
      slug: 'default',
      name: 'Default Manufacturing Corp',
      description: 'Default tenant for initial system setup',
      subdomain: null,
      customDomain: null,
      isActive: true,
      settings: {
        theme: 'light',
        locale: 'en',
        timezone: 'America/New_York',
        dateFormat: 'MM/DD/YYYY',
        currency: 'USD',
        features: [
          'production_management',
          'quality_control',
          'inventory_tracking',
          'worker_management',
          'basic_reporting'
        ],
        limits: {
          maxUsers: 50,
          maxOrders: 10000,
          maxStorage: 10737418240
        }
      },
      billing: {
        plan: 'professional',
        status: 'active',
        billingEmail: 'billing@default.local'
      },
      userCount: 9,
      orderCount: 1250,
      storageUsed: 2147483648,
      lastActivityAt: new Date().toISOString(),
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: new Date().toISOString()
    },
    {
      id: '2',
      slug: 'acme-corp',
      name: 'ACME Manufacturing Inc',
      description: 'Enterprise manufacturing company with advanced features',
      subdomain: 'acme',
      customDomain: 'acme-corp.com',
      isActive: true,
      settings: {
        theme: 'dark',
        locale: 'en',
        timezone: 'America/Chicago',
        dateFormat: 'DD/MM/YYYY',
        currency: 'USD',
        features: [
          'production_management',
          'quality_control',
          'inventory_tracking',
          'worker_management',
          'advanced_reporting',
          'predictive_maintenance',
          'ai_optimization',
          'supply_chain_integration'
        ],
        limits: {
          maxUsers: 200,
          maxOrders: 50000,
          maxStorage: 107374182400
        }
      },
      billing: {
        plan: 'enterprise',
        status: 'active',
        billingEmail: 'billing@acme-corp.com'
      },
      userCount: 35,
      orderCount: 8750,
      storageUsed: 21474836480,
      lastActivityAt: new Date().toISOString(),
      createdAt: '2024-02-15T00:00:00Z',
      updatedAt: new Date().toISOString()
    },
    {
      id: '3',
      slug: 'tenant2',
      name: 'Second Manufacturing Co.',
      description: 'Secondary tenant for multi-tenant testing',
      subdomain: 'tenant2',
      customDomain: null,
      isActive: true,
      settings: {
        theme: 'light',
        locale: 'en',
        timezone: 'America/Los_Angeles',
        dateFormat: 'MM/DD/YYYY',
        currency: 'USD',
        features: [
          'production_management',
          'quality_control',
          'inventory_tracking',
          'worker_management',
          'basic_reporting'
        ],
        limits: {
          maxUsers: 25,
          maxOrders: 5000,
          maxStorage: 5368709120
        }
      },
      billing: {
        plan: 'starter',
        status: 'active',
        billingEmail: 'billing@tenant2.local'
      },
      userCount: 1,
      orderCount: 150,
      storageUsed: 536870912,
      lastActivityAt: new Date().toISOString(),
      createdAt: '2024-03-01T00:00:00Z',
      updatedAt: new Date().toISOString()
    },
    {
      id: '4',
      slug: 'demo',
      name: 'Demo Manufacturing',
      description: 'Demo tenant for showcasing system capabilities',
      subdomain: 'demo',
      customDomain: null,
      isActive: false,
      settings: {
        theme: 'light',
        locale: 'en',
        timezone: 'UTC',
        dateFormat: 'YYYY-MM-DD',
        currency: 'USD',
        features: [
          'production_management',
          'quality_control',
          'inventory_tracking',
          'worker_management',
          'advanced_reporting',
          'predictive_maintenance',
          'ai_optimization'
        ],
        limits: {
          maxUsers: 10,
          maxOrders: 1000,
          maxStorage: 1073741824
        }
      },
      billing: {
        plan: 'free',
        status: 'active',
        billingEmail: 'demo@mes.local'
      },
      userCount: 2,
      orderCount: 50,
      storageUsed: 107374182,
      lastActivityAt: '2024-12-01T00:00:00Z',
      expiresAt: '2025-12-31T23:59:59Z',
      createdAt: '2024-01-15T00:00:00Z',
      updatedAt: new Date().toISOString()
    }
  ]

  const fetchTenants = async () => {
    try {
      setLoading(true)

      // Try to fetch from actual API
      try {
        const response = await fetch(`${API_BASE_URL}/tenants/all`, {
          headers: {
            'Content-Type': 'application/json',
            // Add auth token if available
            // 'Authorization': `Bearer ${getAuthToken()}`,
          },
        })

        if (response.ok) {
          const result = await response.json()
          // Handle wrapped response format
          const data = result.data || result
          setTenants(data.tenants || [])
          setLoading(false)
          return
        }
      } catch (apiError) {
        console.log('API not available, using mock data:', apiError)
      }

      // Fallback to mock data if API fails
      setTimeout(() => {
        setTenants(mockTenants)
        setLoading(false)
      }, 500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tenants')
      setLoading(false)
    }
  }

  const createTenant = async (tenantData: any) => {
    try {
      // Try actual API call first
      try {
        const response = await fetch(`${API_BASE_URL}/tenants/create`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // 'Authorization': `Bearer ${getAuthToken()}`,
          },
          body: JSON.stringify(tenantData),
        })

        if (response.ok) {
          const result = await response.json()
          // Handle wrapped response format
          const data = result.data || result
          const newTenant = data.tenant || data
          setTenants([...tenants, newTenant])
          return newTenant
        }
      } catch (apiError) {
        console.log('API error, using mock:', apiError)
      }

      // Fallback to mock implementation
      const newTenant = {
        ...tenantData,
        id: String(Date.now()),
        userCount: 0,
        orderCount: 0,
        storageUsed: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      setTenants([...tenants, newTenant])
      return newTenant
    } catch (err) {
      throw new Error('Failed to create tenant')
    }
  }

  const updateTenant = async (tenantId: string, tenantData: any) => {
    try {
      // Try actual API call first
      try {
        const response = await fetch(`${API_BASE_URL}/tenants/${tenantId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            // 'Authorization': `Bearer ${getAuthToken()}`,
          },
          body: JSON.stringify(tenantData),
        })

        if (response.ok) {
          const result = await response.json()
          // Handle wrapped response format
          const data = result.data || result
          const updatedTenant = data.tenant || data
          setTenants(tenants.map(t => t.id === tenantId ? updatedTenant : t))
          return updatedTenant
        }
      } catch (apiError) {
        console.log('API error, using mock:', apiError)
      }

      // Fallback to mock implementation
      const updatedTenant = {
        ...tenantData,
        id: tenantId,
        updatedAt: new Date().toISOString()
      }

      setTenants(tenants.map(t => t.id === tenantId ? updatedTenant : t))
      return updatedTenant
    } catch (err) {
      throw new Error('Failed to update tenant')
    }
  }

  const deleteTenant = async (tenantId: string) => {
    try {
      // Try actual API call first
      try {
        const response = await fetch(`${API_BASE_URL}/tenants/${tenantId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            // 'Authorization': `Bearer ${getAuthToken()}`,
          },
        })

        if (response.ok) {
          setTenants(tenants.filter(t => t.id !== tenantId))
          return
        }
      } catch (apiError) {
        console.log('API error, using mock:', apiError)
      }

      // Fallback to mock implementation
      setTenants(tenants.filter(t => t.id !== tenantId))
    } catch (err) {
      throw new Error('Failed to delete tenant')
    }
  }

  useEffect(() => {
    fetchTenants()
  }, [])

  return {
    tenants,
    loading,
    error,
    refreshTenants: fetchTenants,
    createTenant,
    updateTenant,
    deleteTenant
  }
}
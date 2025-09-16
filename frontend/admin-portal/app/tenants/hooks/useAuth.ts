'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface User {
  sub?: string
  email?: string
  name?: string
  preferred_username?: string
  given_name?: string
  family_name?: string
  realm_access?: {
    roles: string[]
  }
  resource_access?: {
    [key: string]: {
      roles: string[]
    }
  }
  tenant_id?: string
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      // Check if we have a token in localStorage/cookies
      const token = localStorage.getItem('access_token') ||
                    sessionStorage.getItem('access_token')

      if (!token) {
        // Try to get user info from Keycloak endpoint
        const response = await fetch('/api/auth/me', {
          credentials: 'include'
        })

        if (!response.ok) {
          throw new Error('Not authenticated')
        }

        const userData = await response.json()
        setUser(userData)
        setIsAuthenticated(true)

        // Check if user has super_admin role
        console.log('User data from /api/auth/me:', userData)
        const roles = userData.realm_access?.roles || []
        console.log('Roles from userData:', roles)
        setIsSuperAdmin(roles.includes('super_admin'))
      } else {
        // Decode token to get user info
        const payload = parseJwt(token)
        setUser(payload)
        setIsAuthenticated(true)

        // Check for super_admin role
        console.log('Token payload:', payload)
        const roles = payload.realm_access?.roles || []
        console.log('Roles from token:', roles)
        setIsSuperAdmin(roles.includes('super_admin'))
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      setIsAuthenticated(false)
      setIsSuperAdmin(false)
    } finally {
      setLoading(false)
    }
  }

  const parseJwt = (token: string) => {
    try {
      const base64Url = token.split('.')[1]
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      )
      return JSON.parse(jsonPayload)
    } catch (error) {
      console.error('Failed to parse JWT:', error)
      return null
    }
  }

  const login = () => {
    // Redirect to Keycloak login
    window.location.href = `/api/auth/login?redirect=${encodeURIComponent(window.location.pathname)}`
  }

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      })

      localStorage.removeItem('access_token')
      sessionStorage.removeItem('access_token')
      setUser(null)
      setIsAuthenticated(false)
      setIsSuperAdmin(false)

      // Redirect to home or login
      router.push('/')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  return {
    user,
    loading,
    isAuthenticated,
    isSuperAdmin,
    login,
    logout,
    checkAuth
  }
}
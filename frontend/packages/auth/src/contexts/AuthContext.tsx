import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import Keycloak from 'keycloak-js'
import { AuthContextType, AuthProviderProps, User, TokenPayload } from '../types/auth.types'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<AuthProviderProps> = ({
  children,
  keycloakConfig,
  onAuthSuccess,
  onAuthError,
  autoRefreshToken = true,
  minTokenValidity = 30,
}) => {
  const [user, setUser] = useState<User | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [token, setToken] = useState<string | null>(null)
  const keycloakRef = useRef<Keycloak | null>(null)
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const initializedRef = useRef(false)

  // Initialize Keycloak
  useEffect(() => {
    const initKeycloak = async () => {
      // Prevent double initialization
      if (initializedRef.current) return
      initializedRef.current = true

      try {
        const keycloak = new Keycloak({
          url: keycloakConfig.url,
          realm: keycloakConfig.realm,
          clientId: keycloakConfig.clientId,
        })

        keycloakRef.current = keycloak

        const authenticated = await keycloak.init({
          onLoad: 'check-sso',
          silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html',
          pkceMethod: 'S256',
          checkLoginIframe: false,
          enableLogging: true,
          responseMode: 'fragment',
        })

        setIsAuthenticated(authenticated)

        if (authenticated) {
          setToken(keycloak.token || null)
          const userData = parseUserFromToken(keycloak)
          setUser(userData)

          // Clean up the URL after successful authentication
          if (window.location.hash.includes('code=') || window.location.hash.includes('state=')) {
            window.history.replaceState(null, '', window.location.pathname)
          }

          if (onAuthSuccess) {
            onAuthSuccess(userData)
          }

          // Set up automatic token refresh
          if (autoRefreshToken) {
            setupAutoRefresh(keycloak)
          }
        }

        setIsLoading(false)
      } catch (error) {
        console.error('Keycloak initialization failed:', error)
        setIsLoading(false)
        if (onAuthError) {
          onAuthError(error as Error)
        }
      }
    }

    initKeycloak()

    // Cleanup
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current)
      }
    }
  }, [keycloakConfig, onAuthSuccess, onAuthError, autoRefreshToken])

  // Parse user from Keycloak token
  const parseUserFromToken = (keycloak: Keycloak): User => {
    const tokenParsed = keycloak.tokenParsed as TokenPayload
    const profile = keycloak.profile

    const roles: string[] = []
    
    // Get realm roles
    if (tokenParsed?.realm_access?.roles) {
      roles.push(...tokenParsed.realm_access.roles)
    }
    
    // Get client roles
    if (tokenParsed?.resource_access?.[keycloakConfig.clientId]?.roles) {
      roles.push(...tokenParsed.resource_access[keycloakConfig.clientId].roles)
    }

    return {
      id: keycloak.subject || '',
      email: tokenParsed?.email || profile?.email || '',
      firstName: tokenParsed?.given_name || profile?.firstName,
      lastName: tokenParsed?.family_name || profile?.lastName,
      username: tokenParsed?.preferred_username || profile?.username || '',
      roles: roles,
      tenantId: tokenParsed?.tenant_id,
      permissions: [], // Will be populated from OpenFGA later
    }
  }

  // Set up automatic token refresh
  const setupAutoRefresh = (keycloak: Keycloak) => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current)
    }

    refreshIntervalRef.current = setInterval(async () => {
      try {
        const refreshed = await keycloak.updateToken(minTokenValidity)
        if (refreshed) {
          setToken(keycloak.token || null)
          const userData = parseUserFromToken(keycloak)
          setUser(userData)
        }
      } catch (error) {
        console.error('Token refresh failed:', error)
        await logout()
      }
    }, (minTokenValidity - 10) * 1000) // Refresh 10 seconds before expiry
  }

  // Login function
  const login = useCallback(async () => {
    if (!keycloakRef.current) {
      throw new Error('Keycloak not initialized')
    }

    try {
      await keycloakRef.current.login()
    } catch (error) {
      console.error('Login failed:', error)
      if (onAuthError) {
        onAuthError(error as Error)
      }
      throw error
    }
  }, [onAuthError])

  // Logout function
  const logout = useCallback(async () => {
    if (!keycloakRef.current) {
      throw new Error('Keycloak not initialized')
    }

    try {
      await keycloakRef.current.logout()
      setUser(null)
      setToken(null)
      setIsAuthenticated(false)
      
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current)
      }
    } catch (error) {
      console.error('Logout failed:', error)
      throw error
    }
  }, [])

  // Refresh token function
  const refreshToken = useCallback(async (): Promise<boolean> => {
    if (!keycloakRef.current) {
      throw new Error('Keycloak not initialized')
    }

    try {
      const refreshed = await keycloakRef.current.updateToken(minTokenValidity)
      if (refreshed) {
        setToken(keycloakRef.current.token || null)
        const userData = parseUserFromToken(keycloakRef.current)
        setUser(userData)
      }
      return refreshed
    } catch (error) {
      console.error('Token refresh failed:', error)
      return false
    }
  }, [minTokenValidity])

  // Role checking functions
  const hasRole = useCallback((role: string): boolean => {
    return user?.roles?.includes(role) || false
  }, [user])

  const hasAnyRole = useCallback((roles: string[]): boolean => {
    return roles.some(role => hasRole(role))
  }, [hasRole])

  const hasAllRoles = useCallback((roles: string[]): boolean => {
    return roles.every(role => hasRole(role))
  }, [hasRole])

  // Permission checking function (placeholder for OpenFGA integration)
  const hasPermission = useCallback((permission: string): boolean => {
    return user?.permissions?.includes(permission) || false
  }, [user])

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    token,
    login,
    logout,
    refreshToken,
    hasRole,
    hasPermission,
    hasAnyRole,
    hasAllRoles,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
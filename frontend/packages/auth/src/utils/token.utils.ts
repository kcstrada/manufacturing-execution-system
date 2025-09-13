/**
 * Token utility functions for handling JWT tokens
 */

/**
 * Check if a JWT token is expired
 */
export const isTokenExpired = (token: string): boolean => {
  try {
    const payload = parseJwt(token)
    if (!payload || !payload.exp) {
      return true
    }
    
    const currentTime = Date.now() / 1000
    return payload.exp < currentTime
  } catch {
    return true
  }
}

/**
 * Get token expiration time in seconds
 */
export const getTokenExpiration = (token: string): number | null => {
  try {
    const payload = parseJwt(token)
    return payload?.exp || null
  } catch {
    return null
  }
}

/**
 * Get time until token expires in seconds
 */
export const getTokenTimeToExpiry = (token: string): number => {
  try {
    const payload = parseJwt(token)
    if (!payload || !payload.exp) {
      return 0
    }
    
    const currentTime = Date.now() / 1000
    const timeToExpiry = payload.exp - currentTime
    return Math.max(0, timeToExpiry)
  } catch {
    return 0
  }
}

/**
 * Parse a JWT token to get the payload
 */
export const parseJwt = (token: string): any => {
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

/**
 * Extract roles from a Keycloak token
 */
export const extractRolesFromToken = (token: string, clientId?: string): string[] => {
  try {
    const payload = parseJwt(token)
    const roles: string[] = []
    
    // Get realm roles
    if (payload?.realm_access?.roles) {
      roles.push(...payload.realm_access.roles)
    }
    
    // Get client roles if clientId is provided
    if (clientId && payload?.resource_access?.[clientId]?.roles) {
      roles.push(...payload.resource_access[clientId].roles)
    }
    
    // Remove duplicates
    return [...new Set(roles)]
  } catch {
    return []
  }
}

/**
 * Extract user information from a Keycloak token
 */
export const extractUserFromToken = (token: string) => {
  try {
    const payload = parseJwt(token)
    
    return {
      id: payload.sub,
      email: payload.email,
      username: payload.preferred_username,
      firstName: payload.given_name,
      lastName: payload.family_name,
      tenantId: payload.tenant_id,
    }
  } catch {
    return null
  }
}

/**
 * Store token in localStorage
 */
export const storeToken = (token: string, refreshToken?: string): void => {
  localStorage.setItem('access_token', token)
  if (refreshToken) {
    localStorage.setItem('refresh_token', refreshToken)
  }
}

/**
 * Get token from localStorage
 */
export const getStoredToken = (): string | null => {
  return localStorage.getItem('access_token')
}

/**
 * Get refresh token from localStorage
 */
export const getStoredRefreshToken = (): string | null => {
  return localStorage.getItem('refresh_token')
}

/**
 * Clear tokens from localStorage
 */
export const clearStoredTokens = (): void => {
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
}

/**
 * Check if user has valid stored token
 */
export const hasValidStoredToken = (): boolean => {
  const token = getStoredToken()
  if (!token) return false
  return !isTokenExpired(token)
}
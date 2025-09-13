import { KeycloakProfile, KeycloakTokenParsed } from 'keycloak-js'

export interface User {
  id: string
  email: string
  firstName?: string
  lastName?: string
  username: string
  roles: string[]
  tenantId?: string
  permissions?: string[]
}

export interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  token: string | null
  login: () => Promise<void>
  logout: () => Promise<void>
  refreshToken: () => Promise<boolean>
  hasRole: (role: string) => boolean
  hasPermission: (permission: string) => boolean
  hasAnyRole: (roles: string[]) => boolean
  hasAllRoles: (roles: string[]) => boolean
}

export interface AuthProviderProps {
  children: React.ReactNode
  keycloakConfig: {
    url: string
    realm: string
    clientId: string
  }
  onAuthSuccess?: (user: User) => void
  onAuthError?: (error: Error) => void
  autoRefreshToken?: boolean
  minTokenValidity?: number
}

export interface TokenPayload extends KeycloakTokenParsed {
  email?: string
  given_name?: string
  family_name?: string
  preferred_username?: string
  tenant_id?: string
  resource_access?: {
    [client: string]: {
      roles: string[]
    }
  }
  realm_access?: {
    roles: string[]
  }
}
// Contexts and Hooks
export { AuthProvider, useAuth } from './contexts/AuthContext'

// Components
export { ProtectedRoute } from './components/ProtectedRoute'
export { LoginButton } from './components/LoginButton'
export { LogoutButton } from './components/LogoutButton'
export { UserProfile, UserAvatar } from './components/UserProfile'

// Types
export type {
  User,
  AuthContextType,
  AuthProviderProps,
  TokenPayload,
} from './types/auth.types'

export type { ProtectedRouteProps } from './components/ProtectedRoute'
export type { LoginButtonProps } from './components/LoginButton'
export type { LogoutButtonProps } from './components/LogoutButton'
export type { UserProfileProps } from './components/UserProfile'

// Utilities
export {
  // User role utilities
  userHasRole,
  userHasAnyRole,
  userHasAllRoles,
  userHasPermission,
  userHasAnyPermission,
  userHasAllPermissions,
  userHasRoleWithHierarchy,
  
  // User display utilities
  getUserDisplayName,
  getUserInitials,
  formatRoleName,
  getRoleBadgeColor,
  
  // Manufacturing-specific role checks
  isProductionManager,
  isQualityInspector,
  isMaintenanceTechnician,
  isOperator,
  isAdmin,
  
  // Constants
  ROLE_HIERARCHY,
} from './utils/auth.utils'

export {
  // Token utilities
  isTokenExpired,
  getTokenExpiration,
  getTokenTimeToExpiry,
  parseJwt,
  extractRolesFromToken,
  extractUserFromToken,
  
  // Token storage
  storeToken,
  getStoredToken,
  getStoredRefreshToken,
  clearStoredTokens,
  hasValidStoredToken,
} from './utils/token.utils'
# @mes/auth - Authentication Package

Shared authentication components and utilities for the Manufacturing Execution System, built with Keycloak JS.

## Installation

```bash
npm install @mes/auth
```

## Features

- 🔐 **Keycloak Integration** - Full Keycloak JS integration with SSO support
- 🎣 **React Hooks** - `useAuth` hook for easy authentication state access
- 🛡️ **Protected Routes** - Component-based route protection with role/permission checks
- 👤 **User Components** - Ready-to-use login/logout buttons and user profile display
- 🏭 **Manufacturing Roles** - Pre-configured role checks for MES-specific roles
- 🔧 **Token Utilities** - JWT token parsing and validation helpers

## Quick Start

### 1. Wrap your app with AuthProvider

```tsx
// app/layout.tsx or _app.tsx
import { AuthProvider } from '@mes/auth'

const keycloakConfig = {
  url: process.env.NEXT_PUBLIC_KEYCLOAK_URL || 'http://localhost:8080',
  realm: process.env.NEXT_PUBLIC_KEYCLOAK_REALM || 'mes',
  clientId: process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID || 'mes-frontend',
}

export default function RootLayout({ children }) {
  return (
    <AuthProvider 
      keycloakConfig={keycloakConfig}
      onAuthSuccess={(user) => console.log('User logged in:', user)}
      onAuthError={(error) => console.error('Auth error:', error)}
      autoRefreshToken={true}
      minTokenValidity={30}
    >
      {children}
    </AuthProvider>
  )
}
```

### 2. Use authentication in components

```tsx
import { useAuth, LoginButton, LogoutButton, UserProfile } from '@mes/auth'

function Header() {
  const { isAuthenticated, user, isLoading } = useAuth()

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <header>
      {isAuthenticated ? (
        <>
          <UserProfile showAvatar showRoles />
          <LogoutButton />
        </>
      ) : (
        <LoginButton />
      )}
    </header>
  )
}
```

### 3. Protect routes with ProtectedRoute

```tsx
import { ProtectedRoute } from '@mes/auth'

function AdminPage() {
  return (
    <ProtectedRoute 
      requiredRoles={['admin', 'super_admin']}
      fallback={<div>You need admin access to view this page</div>}
    >
      <AdminDashboard />
    </ProtectedRoute>
  )
}
```

## API Reference

### Components

#### AuthProvider
Main provider component that initializes Keycloak and provides auth context.

```tsx
<AuthProvider
  keycloakConfig={{
    url: string
    realm: string
    clientId: string
  }}
  onAuthSuccess?: (user: User) => void
  onAuthError?: (error: Error) => void
  autoRefreshToken?: boolean // default: true
  minTokenValidity?: number // default: 30 (seconds)
>
```

#### ProtectedRoute
Protects content based on authentication and authorization.

```tsx
<ProtectedRoute
  requiredRoles?: string[]
  requiredPermissions?: string[]
  requireAll?: boolean // default: false
  fallback?: ReactNode
  redirectTo?: string
  onUnauthorized?: () => void
>
```

#### LoginButton / LogoutButton
Pre-styled authentication buttons.

```tsx
<LoginButton 
  variant="primary" 
  size="md"
  onLoginStart={() => {}}
  onLoginError={(error) => {}}
/>

<LogoutButton 
  confirmLogout={true}
  confirmMessage="Are you sure?"
  onLogoutComplete={() => {}}
/>
```

### Hooks

#### useAuth()
Main authentication hook providing auth state and methods.

```tsx
const {
  user,              // Current user object
  isAuthenticated,   // Authentication status
  isLoading,        // Loading state
  token,            // Access token
  login,            // Login function
  logout,           // Logout function
  refreshToken,     // Refresh token function
  hasRole,          // Check single role
  hasAnyRole,       // Check any of roles
  hasAllRoles,      // Check all roles
  hasPermission,    // Check permission
} = useAuth()
```

### Utility Functions

#### Role Checking
```tsx
import { 
  isAdmin,
  isOperator,
  isProductionManager,
  isQualityInspector,
  isMaintenanceTechnician 
} from '@mes/auth'

if (isAdmin(user)) {
  // Show admin features
}
```

#### Token Utilities
```tsx
import { 
  isTokenExpired,
  getTokenTimeToExpiry,
  parseJwt,
  extractRolesFromToken 
} from '@mes/auth'

const isExpired = isTokenExpired(token)
const timeLeft = getTokenTimeToExpiry(token)
const roles = extractRolesFromToken(token, 'mes-frontend')
```

## Manufacturing-Specific Roles

The package includes pre-configured role checks for common MES roles:

- **Super Admin** - Full system access
- **Admin** - Administrative access
- **Production Manager** - Production line management
- **Quality Inspector** - Quality control access
- **Quality Manager** - Quality management
- **Maintenance Technician** - Equipment maintenance
- **Maintenance Manager** - Maintenance management
- **Operator** - Machine operation
- **Senior Operator** - Advanced operation privileges
- **Viewer** - Read-only access

## Role Hierarchy

The package implements role hierarchy where higher roles inherit lower role permissions:

- `super_admin` → includes all roles
- `admin` → includes manager, operator, viewer
- `manager` → includes operator, viewer
- `operator` → includes viewer
- `viewer` → base level access

## Environment Variables

Configure these environment variables in your `.env.local`:

```env
NEXT_PUBLIC_KEYCLOAK_URL=http://localhost:8080
NEXT_PUBLIC_KEYCLOAK_REALM=mes
NEXT_PUBLIC_KEYCLOAK_CLIENT_ID=mes-frontend
```

## TypeScript Support

Full TypeScript support with exported types:

```tsx
import type { 
  User, 
  AuthContextType, 
  AuthProviderProps,
  ProtectedRouteProps 
} from '@mes/auth'
```

## License

MIT
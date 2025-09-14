# @mes/store

Redux Toolkit store configuration for the Manufacturing Execution System with TypeScript, RTK Query, and Redux Persist.

## Features

- 🗄️ Centralized state management with Redux Toolkit
- 🔄 RTK Query for efficient data fetching and caching
- 💾 Redux Persist for state persistence across sessions
- 🎯 Type-safe hooks and selectors with TypeScript
- 🔐 Authentication state management
- 🎨 UI state management (theme, sidebar, locale)
- 📢 Notification system
- 🧪 Comprehensive test coverage

## Installation

This package is part of the MES monorepo and is automatically available to other packages and applications within the workspace.

```json
{
  "dependencies": {
    "@mes/store": "workspace:*"
  }
}
```

## Setup

### Basic Configuration

Wrap your application with the StoreProvider:

```tsx
// app/layout.tsx or app/providers.tsx
import { StoreProvider } from '@mes/store'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <StoreProvider>
      {children}
    </StoreProvider>
  )
}
```

## Usage

### Using Typed Hooks

```tsx
import { useAppDispatch, useAppSelector, useAuth, useUI } from '@mes/store'

function MyComponent() {
  const dispatch = useAppDispatch()
  const auth = useAuth()
  const ui = useUI()

  // Access state
  console.log(auth.user, auth.isAuthenticated)
  console.log(ui.theme, ui.sidebarOpen)

  // Dispatch actions
  const handleToggleTheme = () => {
    dispatch(toggleTheme())
  }
}
```

### Authentication Management

```tsx
import { useAppDispatch, useAuth, loginAsync, logoutAsync, setUser } from '@mes/store'

function LoginComponent() {
  const dispatch = useAppDispatch()
  const { isLoading, error, user } = useAuth()

  const handleLogin = async (credentials: { email: string; password: string }) => {
    try {
      await dispatch(loginAsync(credentials)).unwrap()
      // Success - user is now authenticated
    } catch (error) {
      // Handle error
    }
  }

  const handleLogout = async () => {
    await dispatch(logoutAsync()).unwrap()
  }

  // Set user manually (e.g., after Keycloak authentication)
  const handleKeycloakAuth = (keycloakUser: any) => {
    dispatch(setUser({
      id: keycloakUser.sub,
      email: keycloakUser.email,
      firstName: keycloakUser.given_name,
      lastName: keycloakUser.family_name,
      roles: keycloakUser.realm_access?.roles || [],
      permissions: keycloakUser.resource_access?.['mes-client']?.roles || [],
    }))
  }
}
```

### UI State Management

```tsx
import { useAppDispatch, useUI, toggleSidebar, setTheme, setLocale } from '@mes/store'

function LayoutComponent() {
  const dispatch = useAppDispatch()
  const { sidebarOpen, theme, locale } = useUI()

  return (
    <div>
      <button onClick={() => dispatch(toggleSidebar())}>
        Toggle Sidebar
      </button>

      <select
        value={theme}
        onChange={(e) => dispatch(setTheme(e.target.value as 'light' | 'dark'))}
      >
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>

      <select
        value={locale}
        onChange={(e) => dispatch(setLocale(e.target.value))}
      >
        <option value="en">English</option>
        <option value="es">Spanish</option>
      </select>
    </div>
  )
}
```

### Notifications

```tsx
import { useAppDispatch, useNotifications, showSuccess, showError, removeNotification } from '@mes/store'

function NotificationExample() {
  const dispatch = useAppDispatch()
  const { notifications } = useNotifications()

  const handleSuccess = () => {
    dispatch(showSuccess('Order Created', 'Your order has been successfully created'))
  }

  const handleError = () => {
    dispatch(showError('Error', 'Failed to save changes', 10000)) // 10 second duration
  }

  const handleDismiss = (id: string) => {
    dispatch(removeNotification(id))
  }

  return (
    <div>
      {notifications.map((notification) => (
        <div key={notification.id} className={`notification-${notification.type}`}>
          <h4>{notification.title}</h4>
          {notification.message && <p>{notification.message}</p>}
          <button onClick={() => handleDismiss(notification.id)}>×</button>
        </div>
      ))}
    </div>
  )
}
```

### RTK Query - Orders API

```tsx
import {
  useGetOrdersQuery,
  useGetOrderQuery,
  useCreateOrderMutation,
  useUpdateOrderMutation
} from '@mes/store'

function OrdersComponent() {
  // Fetch orders with automatic caching
  const { data: orders, isLoading, error } = useGetOrdersQuery({
    page: 1,
    limit: 10,
    status: 'pending'
  })

  // Fetch single order
  const { data: order } = useGetOrderQuery('order-123')

  // Mutations
  const [createOrder] = useCreateOrderMutation()
  const [updateOrder] = useUpdateOrderMutation()

  const handleCreateOrder = async () => {
    try {
      const result = await createOrder({
        customerName: 'ACME Corp',
        items: [{ productId: 'prod-1', quantity: 10, unitPrice: 50 }],
        priority: 'high',
        dueDate: '2024-12-31',
      }).unwrap()
      console.log('Order created:', result)
    } catch (error) {
      console.error('Failed to create order:', error)
    }
  }

  const handleUpdateOrder = async (id: string) => {
    await updateOrder({
      id,
      updates: { status: 'in_progress' }
    }).unwrap()
  }

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error loading orders</div>

  return (
    <div>
      {orders?.data.map((order) => (
        <div key={order.id}>{order.orderNumber}</div>
      ))}
    </div>
  )
}
```

## State Structure

The Redux store manages the following state slices:

### Auth State
```typescript
interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  token: string | null
  refreshToken: string | null
}
```

### UI State
```typescript
interface UIState {
  sidebarOpen: boolean
  theme: 'light' | 'dark'
  locale: string
  isMobile: boolean
}
```

### Notifications State
```typescript
interface NotificationsState {
  notifications: Notification[]
  maxNotifications: number
}
```

## Persistence

The store uses Redux Persist to maintain state across browser sessions:

- **Persisted slices**: `auth`, `ui`
- **Non-persisted slices**: `notifications`, `api` (RTK Query cache)
- **Storage**: localStorage

## Testing

The package includes comprehensive tests for all slices:

```bash
npm test              # Run all tests
npm run test:watch    # Run tests in watch mode
npm run test:coverage # Generate coverage report
```

## Available Actions

### Auth Actions
- `setUser(user)` - Set the authenticated user
- `clearUser()` - Clear user and authentication state
- `setTokens({ token, refreshToken? })` - Set authentication tokens
- `setError(error)` - Set authentication error
- `clearError()` - Clear authentication error
- `updateUserProfile(updates)` - Update user profile fields
- `loginAsync(credentials)` - Async login thunk
- `logoutAsync()` - Async logout thunk
- `refreshTokenAsync(refreshToken)` - Async token refresh thunk

### UI Actions
- `toggleSidebar()` - Toggle sidebar open/closed
- `setSidebarOpen(isOpen)` - Set sidebar state
- `setTheme(theme)` - Set light/dark theme
- `toggleTheme()` - Toggle between themes
- `setLocale(locale)` - Set application locale
- `setIsMobile(isMobile)` - Set mobile view state

### Notification Actions
- `addNotification({ type, title, message?, duration? })` - Add notification
- `removeNotification(id)` - Remove specific notification
- `clearNotifications()` - Clear all notifications
- `setMaxNotifications(max)` - Set maximum notifications displayed
- `showSuccess(title, message?, duration?)` - Show success notification
- `showError(title, message?, duration?)` - Show error notification
- `showWarning(title, message?, duration?)` - Show warning notification
- `showInfo(title, message?, duration?)` - Show info notification

## RTK Query APIs

### Orders API
- `useGetOrdersQuery({ page?, limit?, status? })` - Fetch paginated orders
- `useGetOrderQuery(id)` - Fetch single order
- `useCreateOrderMutation()` - Create new order
- `useUpdateOrderMutation()` - Update existing order
- `useDeleteOrderMutation()` - Delete order

## Best Practices

1. **Use typed hooks**: Always use `useAppDispatch` and `useAppSelector` instead of plain hooks
2. **Handle async actions**: Use `.unwrap()` with RTK Query mutations for proper error handling
3. **Leverage RTK Query caching**: Let RTK Query manage server state instead of storing in Redux
4. **Keep slices focused**: Each slice should manage a single domain of state
5. **Test your reducers**: Write tests for all reducer logic and async thunks

## TypeScript Support

All exports are fully typed. Import types as needed:

```typescript
import type {
  RootState,
  AppDispatch,
  User,
  AuthState,
  UIState,
  Notification,
  Order
} from '@mes/store'
```

## Contributing

When adding new features:

1. Create new slices in `src/slices/`
2. Add RTK Query endpoints in `src/api/`
3. Export from `src/index.ts`
4. Write tests for all new functionality
5. Update this documentation
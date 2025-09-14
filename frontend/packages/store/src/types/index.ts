export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  roles: string[]
  permissions: string[]
  tenantId?: string
  avatar?: string
}

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  token: string | null
  refreshToken: string | null
}

export interface UIState {
  sidebarOpen: boolean
  theme: 'light' | 'dark'
  locale: string
  isMobile: boolean
}

export type NotificationType = 'success' | 'error' | 'warning' | 'info'

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message?: string
  duration?: number
  timestamp: number
}

export interface NotificationsState {
  notifications: Notification[]
  maxNotifications: number
}

export interface RootState {
  auth: AuthState
  ui: UIState
  notifications: NotificationsState
}
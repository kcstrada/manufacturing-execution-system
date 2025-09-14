export { store, persistor } from './store'
export type { RootState, AppDispatch } from './store'
export { StoreProvider } from './Provider'

export {
  useAppDispatch,
  useAppSelector,
  useAuth,
  useUI,
  useNotifications,
} from './hooks'

export {
  setUser,
  clearUser,
  setTokens,
  setError,
  clearError,
  updateUserProfile,
  loginAsync,
  logoutAsync,
  refreshTokenAsync,
} from './slices/authSlice'

export {
  toggleSidebar,
  setSidebarOpen,
  setTheme,
  toggleTheme,
  setLocale,
  setIsMobile,
} from './slices/uiSlice'

export {
  addNotification,
  removeNotification,
  clearNotifications,
  setMaxNotifications,
  showSuccess,
  showError,
  showWarning,
  showInfo,
} from './slices/notificationsSlice'

export { baseApi } from './api/baseApi'
export { ordersApi } from './api/ordersApi'
export {
  useGetOrdersQuery,
  useGetOrderQuery,
  useCreateOrderMutation,
  useUpdateOrderMutation,
  useDeleteOrderMutation,
} from './api/ordersApi'

export type {
  User,
  AuthState,
  UIState,
  Notification,
  NotificationType,
  NotificationsState,
} from './types'

export type { Order, OrderItem, PaginatedOrders } from './api/ordersApi'
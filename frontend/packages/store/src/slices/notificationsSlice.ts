import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { NotificationsState, Notification, NotificationType } from '../types'

const initialState: NotificationsState = {
  notifications: [],
  maxNotifications: 5,
}

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    addNotification: (
      state,
      action: PayloadAction<{
        type: NotificationType
        title: string
        message?: string
        duration?: number
      }>
    ) => {
      const notification: Notification = {
        id: `notification-${Date.now()}-${Math.random()}`,
        type: action.payload.type,
        title: action.payload.title,
        message: action.payload.message,
        duration: action.payload.duration || 5000,
        timestamp: Date.now(),
      }

      state.notifications.unshift(notification)

      if (state.notifications.length > state.maxNotifications) {
        state.notifications = state.notifications.slice(0, state.maxNotifications)
      }
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(
        (notification) => notification.id !== action.payload
      )
    },
    clearNotifications: (state) => {
      state.notifications = []
    },
    setMaxNotifications: (state, action: PayloadAction<number>) => {
      state.maxNotifications = action.payload
      if (state.notifications.length > action.payload) {
        state.notifications = state.notifications.slice(0, action.payload)
      }
    },
  },
})

export const {
  addNotification,
  removeNotification,
  clearNotifications,
  setMaxNotifications,
} = notificationsSlice.actions

export const showSuccess = (title: string, message?: string, duration?: number) =>
  addNotification({ type: 'success', title, message, duration })

export const showError = (title: string, message?: string, duration?: number) =>
  addNotification({ type: 'error', title, message, duration })

export const showWarning = (title: string, message?: string, duration?: number) =>
  addNotification({ type: 'warning', title, message, duration })

export const showInfo = (title: string, message?: string, duration?: number) =>
  addNotification({ type: 'info', title, message, duration })

export default notificationsSlice.reducer
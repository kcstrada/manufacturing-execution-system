import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { UIState } from '../types'

const initialState: UIState = {
  sidebarOpen: true,
  theme: 'light',
  locale: 'en',
  isMobile: false,
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload
    },
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme = action.payload
    },
    toggleTheme: (state) => {
      state.theme = state.theme === 'light' ? 'dark' : 'light'
    },
    setLocale: (state, action: PayloadAction<string>) => {
      state.locale = action.payload
    },
    setIsMobile: (state, action: PayloadAction<boolean>) => {
      state.isMobile = action.payload
      if (action.payload) {
        state.sidebarOpen = false
      }
    },
  },
})

export const {
  toggleSidebar,
  setSidebarOpen,
  setTheme,
  toggleTheme,
  setLocale,
  setIsMobile,
} = uiSlice.actions

export default uiSlice.reducer
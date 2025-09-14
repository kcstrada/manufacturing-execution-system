import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit'
import { AuthState, User } from '../types'

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  token: null,
  refreshToken: null,
}

export const loginAsync = createAsyncThunk(
  'auth/login',
  async (credentials: { email: string; password: string }) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    })

    if (!response.ok) {
      throw new Error('Login failed')
    }

    return response.json()
  }
)

export const logoutAsync = createAsyncThunk(
  'auth/logout',
  async () => {
    const response = await fetch('/api/auth/logout', {
      method: 'POST',
    })

    if (!response.ok) {
      throw new Error('Logout failed')
    }

    return null
  }
)

export const refreshTokenAsync = createAsyncThunk(
  'auth/refreshToken',
  async (refreshToken: string) => {
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })

    if (!response.ok) {
      throw new Error('Token refresh failed')
    }

    return response.json()
  }
)

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload
      state.isAuthenticated = true
      state.error = null
    },
    clearUser: (state) => {
      state.user = null
      state.isAuthenticated = false
      state.token = null
      state.refreshToken = null
      state.error = null
    },
    setTokens: (state, action: PayloadAction<{ token: string; refreshToken?: string }>) => {
      state.token = action.payload.token
      if (action.payload.refreshToken) {
        state.refreshToken = action.payload.refreshToken
      }
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload
      state.isLoading = false
    },
    clearError: (state) => {
      state.error = null
    },
    updateUserProfile: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload }
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginAsync.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(loginAsync.fulfilled, (state, action) => {
        state.isLoading = false
        state.isAuthenticated = true
        state.user = action.payload.user
        state.token = action.payload.token
        state.refreshToken = action.payload.refreshToken
        state.error = null
      })
      .addCase(loginAsync.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message || 'Login failed'
      })
      .addCase(logoutAsync.pending, (state) => {
        state.isLoading = true
      })
      .addCase(logoutAsync.fulfilled, (state) => {
        state.isLoading = false
        state.isAuthenticated = false
        state.user = null
        state.token = null
        state.refreshToken = null
        state.error = null
      })
      .addCase(logoutAsync.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message || 'Logout failed'
      })
      .addCase(refreshTokenAsync.pending, (state) => {
        state.isLoading = true
      })
      .addCase(refreshTokenAsync.fulfilled, (state, action) => {
        state.isLoading = false
        state.token = action.payload.token
        if (action.payload.refreshToken) {
          state.refreshToken = action.payload.refreshToken
        }
      })
      .addCase(refreshTokenAsync.rejected, (state) => {
        state.isLoading = false
        state.isAuthenticated = false
        state.user = null
        state.token = null
        state.refreshToken = null
      })
  },
})

export const {
  setUser,
  clearUser,
  setTokens,
  setError,
  clearError,
  updateUserProfile,
} = authSlice.actions

export default authSlice.reducer
import authReducer, {
  setUser,
  clearUser,
  setTokens,
  setError,
  clearError,
  updateUserProfile,
} from './authSlice'
import { AuthState, User } from '../types'

describe('authSlice', () => {
  const initialState: AuthState = {
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
    token: null,
    refreshToken: null,
  }

  const mockUser: User = {
    id: '123',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    roles: ['user'],
    permissions: ['read'],
    tenantId: 'tenant-1',
  }

  it('should return the initial state', () => {
    expect(authReducer(undefined, { type: 'unknown' })).toEqual(initialState)
  })

  it('should handle setUser', () => {
    const actual = authReducer(initialState, setUser(mockUser))
    expect(actual.user).toEqual(mockUser)
    expect(actual.isAuthenticated).toBe(true)
    expect(actual.error).toBe(null)
  })

  it('should handle clearUser', () => {
    const stateWithUser: AuthState = {
      ...initialState,
      user: mockUser,
      isAuthenticated: true,
      token: 'token123',
      refreshToken: 'refresh123',
    }
    const actual = authReducer(stateWithUser, clearUser())
    expect(actual.user).toBe(null)
    expect(actual.isAuthenticated).toBe(false)
    expect(actual.token).toBe(null)
    expect(actual.refreshToken).toBe(null)
  })

  it('should handle setTokens', () => {
    const actual = authReducer(
      initialState,
      setTokens({ token: 'new-token', refreshToken: 'new-refresh' })
    )
    expect(actual.token).toBe('new-token')
    expect(actual.refreshToken).toBe('new-refresh')
  })

  it('should handle setTokens without refreshToken', () => {
    const stateWithTokens: AuthState = {
      ...initialState,
      token: 'old-token',
      refreshToken: 'old-refresh',
    }
    const actual = authReducer(
      stateWithTokens,
      setTokens({ token: 'new-token' })
    )
    expect(actual.token).toBe('new-token')
    expect(actual.refreshToken).toBe('old-refresh')
  })

  it('should handle setError', () => {
    const stateWithLoading: AuthState = {
      ...initialState,
      isLoading: true,
    }
    const actual = authReducer(stateWithLoading, setError('Login failed'))
    expect(actual.error).toBe('Login failed')
    expect(actual.isLoading).toBe(false)
  })

  it('should handle clearError', () => {
    const stateWithError: AuthState = {
      ...initialState,
      error: 'Some error',
    }
    const actual = authReducer(stateWithError, clearError())
    expect(actual.error).toBe(null)
  })

  it('should handle updateUserProfile', () => {
    const stateWithUser: AuthState = {
      ...initialState,
      user: mockUser,
      isAuthenticated: true,
    }
    const updates = { firstName: 'Jane', lastName: 'Smith' }
    const actual = authReducer(stateWithUser, updateUserProfile(updates))
    expect(actual.user?.firstName).toBe('Jane')
    expect(actual.user?.lastName).toBe('Smith')
    expect(actual.user?.email).toBe(mockUser.email)
  })

  it('should not update profile when user is null', () => {
    const updates = { firstName: 'Jane' }
    const actual = authReducer(initialState, updateUserProfile(updates))
    expect(actual.user).toBe(null)
  })
})
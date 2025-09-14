import {
  useQuery,
  useMutation,
  UseQueryOptions,
  UseMutationOptions,
  QueryKey,
} from '@tanstack/react-query'
import { useCallback } from 'react'

// These will be imported from @mes/store when available
interface AuthState {
  token: string | null
  isAuthenticated: boolean
}

// Mock hook - replace with actual import from @mes/store
const useAuth = (): AuthState => {
  // This will be replaced with actual Redux hook
  return {
    token: typeof window !== 'undefined' ? localStorage.getItem('token') : null,
    isAuthenticated: true,
  }
}

/**
 * Authenticated query hook that includes auth token in requests
 */
export function useAuthenticatedQuery<
  TQueryFnData = unknown,
  TError = Error,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey
>(
  queryKey: TQueryKey,
  queryFn: (context: { token: string }) => Promise<TQueryFnData>,
  options?: Omit<
    UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
    'queryKey' | 'queryFn'
  >
) {
  const { token, isAuthenticated } = useAuth()

  const authenticatedQueryFn = useCallback(async () => {
    if (!token) {
      throw new Error('Not authenticated')
    }
    return queryFn({ token })
  }, [queryFn, token])

  return useQuery({
    queryKey,
    queryFn: authenticatedQueryFn,
    enabled: isAuthenticated && !!token && (options?.enabled ?? true),
    ...options,
  })
}

/**
 * Authenticated mutation hook that includes auth token in requests
 */
export function useAuthenticatedMutation<
  TData = unknown,
  TError = Error,
  TVariables = void,
  TContext = unknown
>(
  mutationFn: (variables: TVariables, context: { token: string }) => Promise<TData>,
  options?: UseMutationOptions<TData, TError, TVariables, TContext>
) {
  const { token } = useAuth()

  const authenticatedMutationFn = useCallback(
    async (variables: TVariables) => {
      if (!token) {
        throw new Error('Not authenticated')
      }
      return mutationFn(variables, { token })
    },
    [mutationFn, token]
  )

  return useMutation({
    mutationFn: authenticatedMutationFn,
    ...options,
  })
}

/**
 * Hook to create authenticated fetch function
 */
export function useAuthenticatedFetch() {
  const { token } = useAuth()

  return useCallback(
    async (url: string, options?: RequestInit) => {
      const headers = new Headers(options?.headers)

      if (token) {
        headers.set('Authorization', `Bearer ${token}`)
      }

      // Add tenant ID if available
      const tenantId = typeof window !== 'undefined' ? localStorage.getItem('tenantId') : null
      if (tenantId) {
        headers.set('X-Tenant-Id', tenantId)
      }

      const response = await fetch(url, {
        ...options,
        headers,
      })

      if (response.status === 401) {
        // Token might be expired, trigger refresh
        // This would dispatch a Redux action to refresh the token
        throw new Error('Unauthorized')
      }

      return response
    },
    [token]
  )
}

/**
 * Hook for queries that require specific permissions
 */
export function usePermissionQuery<
  TQueryFnData = unknown,
  TError = Error,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey
>(
  permission: string,
  queryKey: TQueryKey,
  queryFn: () => Promise<TQueryFnData>,
  options?: Omit<
    UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
    'queryKey' | 'queryFn'
  >
) {
  // This will be replaced with actual permission check from @mes/permissions
  const hasPermission = true // Mock - replace with actual permission check

  return useQuery({
    queryKey,
    queryFn,
    enabled: hasPermission && (options?.enabled ?? true),
    ...options,
  })
}

/**
 * Hook for mutations that require specific permissions
 */
export function usePermissionMutation<
  TData = unknown,
  TError = Error,
  TVariables = void,
  TContext = unknown
>(
  permission: string,
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: UseMutationOptions<TData, TError, TVariables, TContext>
) {
  // This will be replaced with actual permission check from @mes/permissions
  const hasPermission = true // Mock - replace with actual permission check

  const wrappedMutationFn = useCallback(
    async (variables: TVariables) => {
      if (!hasPermission) {
        throw new Error(`Missing permission: ${permission}`)
      }
      return mutationFn(variables)
    },
    [mutationFn, hasPermission, permission]
  )

  return useMutation({
    mutationFn: wrappedMutationFn,
    ...options,
  })
}
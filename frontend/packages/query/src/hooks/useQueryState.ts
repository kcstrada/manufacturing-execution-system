import { UseQueryResult, UseMutationResult } from '@tanstack/react-query'
import { useEffect, useCallback } from 'react'

/**
 * Custom hook for handling query loading and error states
 */
export function useQueryState<TData = unknown, TError = Error>(
  query: UseQueryResult<TData, TError>,
  options?: {
    onSuccess?: (data: TData) => void
    onError?: (error: TError) => void
    loadingMessage?: string
    errorMessage?: string
  }
) {
  const { data, error, isLoading, isError, isSuccess, refetch } = query

  useEffect(() => {
    if (isSuccess && data && options?.onSuccess) {
      options.onSuccess(data)
    }
  }, [isSuccess, data, options])

  useEffect(() => {
    if (isError && error && options?.onError) {
      options.onError(error)
    }
  }, [isError, error, options])

  const retry = useCallback(() => {
    refetch()
  }, [refetch])

  return {
    data,
    error,
    isLoading,
    isError,
    isSuccess,
    isEmpty: isSuccess && (!data || (Array.isArray(data) && data.length === 0)),
    loadingMessage: options?.loadingMessage || 'Loading...',
    errorMessage: options?.errorMessage || 'An error occurred',
    retry,
  }
}

/**
 * Custom hook for handling mutation states
 */
export function useMutationState<
  TData = unknown,
  TError = Error,
  TVariables = void,
  TContext = unknown
>(
  mutation: UseMutationResult<TData, TError, TVariables, TContext>,
  options?: {
    onSuccess?: (data: TData) => void
    onError?: (error: TError) => void
    loadingMessage?: string
    successMessage?: string
    errorMessage?: string
  }
) {
  const {
    data,
    error,
    isPending,
    isError,
    isSuccess,
    mutate,
    mutateAsync,
    reset,
  } = mutation

  useEffect(() => {
    if (isSuccess && data && options?.onSuccess) {
      options.onSuccess(data)
    }
  }, [isSuccess, data, options])

  useEffect(() => {
    if (isError && error && options?.onError) {
      options.onError(error)
    }
  }, [isError, error, options])

  return {
    data,
    error,
    isLoading: isPending,
    isError,
    isSuccess,
    loadingMessage: options?.loadingMessage || 'Processing...',
    successMessage: options?.successMessage || 'Success!',
    errorMessage: options?.errorMessage || 'Operation failed',
    execute: mutate,
    executeAsync: mutateAsync,
    reset,
  }
}

/**
 * Combined hook for multiple queries
 */
export function useCombinedQueries<T extends Record<string, UseQueryResult>>(
  queries: T
): {
  isLoading: boolean
  isError: boolean
  isSuccess: boolean
  errors: Array<Error | null>
  data: { [K in keyof T]: T[K]['data'] }
  refetchAll: () => void
} {
  const queryEntries = Object.entries(queries) as Array<[string, UseQueryResult]>

  const isLoading = queryEntries.some(([_, query]) => query.isLoading)
  const isError = queryEntries.some(([_, query]) => query.isError)
  const isSuccess = queryEntries.every(([_, query]) => query.isSuccess)

  const errors = queryEntries.map(([_, query]) => query.error as Error | null)

  const data = queryEntries.reduce((acc, [key, query]) => {
    acc[key] = query.data
    return acc
  }, {} as any)

  const refetchAll = useCallback(() => {
    queryEntries.forEach(([_, query]) => query.refetch())
  }, [queryEntries])

  return {
    isLoading,
    isError,
    isSuccess,
    errors,
    data,
    refetchAll,
  }
}

/**
 * Hook for handling paginated query states
 */
export function usePaginatedQueryState<TData = unknown, TError = Error>(
  query: UseQueryResult<{ data: TData[]; total: number; page: number; totalPages: number }, TError>,
  options?: {
    onPageChange?: (page: number) => void
    itemsPerPage?: number
  }
) {
  const state = useQueryState(query)
  const { data } = state

  const currentPage = data?.page || 1
  const totalPages = data?.totalPages || 1
  const totalItems = data?.total || 0
  const items = data?.data || []
  const itemsPerPage = options?.itemsPerPage || items.length || 10

  const hasNextPage = currentPage < totalPages
  const hasPreviousPage = currentPage > 1

  const goToPage = useCallback(
    (page: number) => {
      if (page >= 1 && page <= totalPages && options?.onPageChange) {
        options.onPageChange(page)
      }
    },
    [totalPages, options]
  )

  const nextPage = useCallback(() => {
    if (hasNextPage) goToPage(currentPage + 1)
  }, [hasNextPage, goToPage, currentPage])

  const previousPage = useCallback(() => {
    if (hasPreviousPage) goToPage(currentPage - 1)
  }, [hasPreviousPage, goToPage, currentPage])

  return {
    ...state,
    items,
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    hasNextPage,
    hasPreviousPage,
    goToPage,
    nextPage,
    previousPage,
    pageInfo: {
      from: (currentPage - 1) * itemsPerPage + 1,
      to: Math.min(currentPage * itemsPerPage, totalItems),
      total: totalItems,
    },
  }
}

/**
 * Error boundary hook for queries
 */
export function useQueryErrorHandler(
  defaultErrorHandler?: (error: Error) => void
) {
  return useCallback(
    (error: Error, query: { queryKey: readonly unknown[] }) => {
      console.error(`Query error for ${JSON.stringify(query.queryKey)}:`, error)

      if (defaultErrorHandler) {
        defaultErrorHandler(error)
      }

      // You can add global error handling here
      // For example, show a toast notification
    },
    [defaultErrorHandler]
  )
}

/**
 * Success handler hook for queries
 */
export function useQuerySuccessHandler(
  defaultSuccessHandler?: (data: unknown) => void
) {
  return useCallback(
    (data: unknown, query: { queryKey: readonly unknown[] }) => {
      console.log(`Query success for ${JSON.stringify(query.queryKey)}`)

      if (defaultSuccessHandler) {
        defaultSuccessHandler(data)
      }

      // You can add global success handling here
    },
    [defaultSuccessHandler]
  )
}
import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query'

export const createQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Stale time: 5 minutes - data is considered fresh for this duration
        staleTime: 5 * 60 * 1000,
        // Cache time: 10 minutes - data stays in cache for this duration after component unmounts
        gcTime: 10 * 60 * 1000,
        // Retry failed requests 3 times with exponential backoff
        retry: (failureCount, error: any) => {
          if (error?.status === 404 || error?.status === 401) return false
          return failureCount < 3
        },
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        // Refetch on window focus by default
        refetchOnWindowFocus: true,
        // Don't refetch on reconnect if data is still fresh
        refetchOnReconnect: 'always',
      },
      mutations: {
        // Retry mutations once on failure
        retry: 1,
        retryDelay: 1000,
      },
    },
    queryCache: new QueryCache({
      onError: (error, query) => {
        // Global error handling for queries
        console.error(`Query error for ${query.queryKey}:`, error)
      },
      onSuccess: (data, query) => {
        // Global success handling for queries
        console.log(`Query success for ${query.queryKey}`)
      },
    }),
    mutationCache: new MutationCache({
      onError: (error, variables, context, mutation) => {
        // Global error handling for mutations
        console.error(`Mutation error:`, error)
      },
      onSuccess: (data, variables, context, mutation) => {
        // Global success handling for mutations
        console.log(`Mutation success`)
      },
    }),
  })
}

// Default query client instance
export const queryClient = createQueryClient()
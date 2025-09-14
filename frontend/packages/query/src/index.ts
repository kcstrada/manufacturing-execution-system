// Query Client
export { queryClient, createQueryClient } from './queryClient'

// Providers
export { QueryProvider } from './providers/QueryProvider'
export { IntegratedQueryProvider } from './providers/IntegratedProvider'

// Order hooks
export {
  useOrders,
  useOrder,
  useCreateOrder,
  useUpdateOrder,
  useDeleteOrder,
  orderKeys,
  type Order,
  type OrderItem,
  type OrdersParams,
  type PaginatedResponse,
} from './hooks/useOrders'

// Task hooks
export {
  useTasks,
  useTask,
  useMyTasks,
  useCreateTask,
  useUpdateTask,
  useStartTask,
  useCompleteTask,
  taskKeys,
  type Task,
  type Worker,
  type TasksParams,
} from './hooks/useTasks'

// Query state hooks
export {
  useQueryState,
  useMutationState,
  useCombinedQueries,
  usePaginatedQueryState,
  useQueryErrorHandler,
  useQuerySuccessHandler,
} from './hooks/useQueryState'

// Authenticated query hooks
export {
  useAuthenticatedQuery,
  useAuthenticatedMutation,
  useAuthenticatedFetch,
  usePermissionQuery,
  usePermissionMutation,
} from './hooks/useAuthenticatedQuery'

// Utilities
export {
  QueryInvalidator,
  createQueryInvalidator,
  batchInvalidate,
  smartInvalidate,
  type InvalidationOptions,
} from './utils/invalidation'

export {
  OptimisticUpdater,
  createOptimisticUpdater,
  optimisticMutation,
  createOptimisticDelete,
  createOptimisticStatusUpdate,
  type OptimisticUpdateContext,
} from './utils/optimistic'

export {
  Prefetcher,
  createPrefetcher,
  prefetchForPage,
  prefetchInfiniteQuery,
  batchPrefetch,
  conditionalPrefetch,
} from './utils/prefetch'

// Re-export commonly used TanStack Query functions
export {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
  useIsFetching,
  useIsMutating,
  QueryClient,
  QueryClientProvider,
  dehydrate,
  hydrate,
  HydrationBoundary,
} from '@tanstack/react-query'

export type {
  UseQueryOptions,
  UseMutationOptions,
  UseInfiniteQueryOptions,
  QueryKey,
  QueryFunction,
  MutationFunction,
} from '@tanstack/react-query'
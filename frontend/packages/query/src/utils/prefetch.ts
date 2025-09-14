import { QueryClient, dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { cache } from 'react'
import { orderKeys } from '../hooks/useOrders'
import { taskKeys } from '../hooks/useTasks'

/**
 * Prefetch utility for server-side rendering
 */
export class Prefetcher {
  constructor(private queryClient: QueryClient) {}

  /**
   * Prefetch a single query
   */
  async prefetchQuery<T>(
    queryKey: readonly unknown[],
    queryFn: () => Promise<T>,
    staleTime?: number
  ) {
    return this.queryClient.prefetchQuery({
      queryKey,
      queryFn,
      staleTime: staleTime ?? 10 * 1000, // 10 seconds default
    })
  }

  /**
   * Prefetch multiple queries in parallel
   */
  async prefetchQueries(
    queries: Array<{
      queryKey: readonly unknown[]
      queryFn: () => Promise<unknown>
      staleTime?: number
    }>
  ) {
    const promises = queries.map(({ queryKey, queryFn, staleTime }) =>
      this.prefetchQuery(queryKey, queryFn, staleTime)
    )
    return Promise.all(promises)
  }

  /**
   * Prefetch orders list
   */
  async prefetchOrders(params?: { page?: number; limit?: number; status?: string }) {
    const queryKey = orderKeys.list(params)
    return this.prefetchQuery(queryKey, async () => {
      const searchParams = new URLSearchParams()
      if (params?.page) searchParams.append('page', params.page.toString())
      if (params?.limit) searchParams.append('limit', params.limit.toString())
      if (params?.status) searchParams.append('status', params.status)

      const response = await fetch(`/api/orders?${searchParams}`)
      if (!response.ok) throw new Error('Failed to fetch orders')
      return response.json()
    })
  }

  /**
   * Prefetch a specific order
   */
  async prefetchOrder(id: string) {
    const queryKey = orderKeys.detail(id)
    return this.prefetchQuery(queryKey, async () => {
      const response = await fetch(`/api/orders/${id}`)
      if (!response.ok) throw new Error('Failed to fetch order')
      return response.json()
    })
  }

  /**
   * Prefetch tasks list
   */
  async prefetchTasks(params?: {
    page?: number
    limit?: number
    status?: string
    assignedTo?: string
  }) {
    const queryKey = taskKeys.list(params)
    return this.prefetchQuery(queryKey, async () => {
      const searchParams = new URLSearchParams()
      if (params?.page) searchParams.append('page', params.page.toString())
      if (params?.limit) searchParams.append('limit', params.limit.toString())
      if (params?.status) searchParams.append('status', params.status)
      if (params?.assignedTo) searchParams.append('assignedTo', params.assignedTo)

      const response = await fetch(`/api/tasks?${searchParams}`)
      if (!response.ok) throw new Error('Failed to fetch tasks')
      return response.json()
    })
  }

  /**
   * Prefetch a specific task
   */
  async prefetchTask(id: string) {
    const queryKey = taskKeys.detail(id)
    return this.prefetchQuery(queryKey, async () => {
      const response = await fetch(`/api/tasks/${id}`)
      if (!response.ok) throw new Error('Failed to fetch task')
      return response.json()
    })
  }

  /**
   * Prefetch worker's tasks
   */
  async prefetchWorkerTasks(workerId: string) {
    const queryKey = taskKeys.myTasks(workerId)
    return this.prefetchQuery(queryKey, async () => {
      const response = await fetch(`/api/workers/${workerId}/tasks`)
      if (!response.ok) throw new Error('Failed to fetch worker tasks')
      return response.json()
    })
  }

  /**
   * Get dehydrated state for SSR
   */
  getDehydratedState() {
    return dehydrate(this.queryClient)
  }
}

/**
 * Create a prefetcher instance
 */
export const createPrefetcher = (queryClient: QueryClient) => {
  return new Prefetcher(queryClient)
}

/**
 * Next.js App Router prefetch helper
 * Use this in server components to prefetch data
 */
export const prefetchForPage = cache(async (
  pageName: 'dashboard' | 'orders' | 'tasks' | 'order-detail' | 'task-detail',
  params?: Record<string, any>
) => {
  const queryClient = new QueryClient()
  const prefetcher = new Prefetcher(queryClient)

  switch (pageName) {
    case 'dashboard':
      // Prefetch dashboard data
      await Promise.all([
        prefetcher.prefetchOrders({ limit: 5, status: 'pending' }),
        prefetcher.prefetchTasks({ limit: 5, status: 'in_progress' }),
      ])
      break

    case 'orders':
      // Prefetch orders list
      await prefetcher.prefetchOrders({
        page: params?.page || 1,
        limit: params?.limit || 20,
        status: params?.status,
      })
      break

    case 'tasks':
      // Prefetch tasks list
      await prefetcher.prefetchTasks({
        page: params?.page || 1,
        limit: params?.limit || 20,
        status: params?.status,
        assignedTo: params?.assignedTo,
      })
      break

    case 'order-detail':
      // Prefetch specific order
      if (params?.id) {
        await Promise.all([
          prefetcher.prefetchOrder(params.id),
          prefetcher.prefetchTasks({ orderId: params.id }),
        ])
      }
      break

    case 'task-detail':
      // Prefetch specific task
      if (params?.id) {
        await prefetcher.prefetchTask(params.id)
      }
      break
  }

  return dehydrate(queryClient)
})

/**
 * Prefetch helper for infinite queries
 */
export const prefetchInfiniteQuery = async (
  queryClient: QueryClient,
  queryKey: readonly unknown[],
  fetchFn: ({ pageParam }: { pageParam?: any }) => Promise<any>,
  initialPageParam?: any
) => {
  return queryClient.prefetchInfiniteQuery({
    queryKey,
    queryFn: fetchFn,
    initialPageParam: initialPageParam ?? 1,
    getNextPageParam: (lastPage) => lastPage.nextPage ?? undefined,
    pages: 1, // Only prefetch first page
  })
}

/**
 * Batch prefetch helper for related data
 */
export const batchPrefetch = async (
  queryClient: QueryClient,
  prefetchConfigs: Array<{
    queryKey: readonly unknown[]
    queryFn: () => Promise<unknown>
    staleTime?: number
  }>
) => {
  const promises = prefetchConfigs.map((config) =>
    queryClient.prefetchQuery({
      queryKey: config.queryKey,
      queryFn: config.queryFn,
      staleTime: config.staleTime ?? 10 * 1000,
    })
  )
  return Promise.all(promises)
}

/**
 * Conditional prefetch based on user permissions
 */
export const conditionalPrefetch = async (
  queryClient: QueryClient,
  conditions: Array<{
    condition: boolean
    queryKey: readonly unknown[]
    queryFn: () => Promise<unknown>
  }>
) => {
  const validPrefetches = conditions.filter((c) => c.condition)

  if (validPrefetches.length === 0) return

  const promises = validPrefetches.map((config) =>
    queryClient.prefetchQuery({
      queryKey: config.queryKey,
      queryFn: config.queryFn,
    })
  )

  return Promise.all(promises)
}
import { QueryClient } from '@tanstack/react-query'
import { orderKeys } from '../hooks/useOrders'
import { taskKeys } from '../hooks/useTasks'

export interface InvalidationOptions {
  exact?: boolean
  refetch?: boolean
}

/**
 * Utility class for managing query invalidations
 */
export class QueryInvalidator {
  constructor(private queryClient: QueryClient) {}

  /**
   * Invalidate all queries
   */
  invalidateAll(options?: InvalidationOptions) {
    return this.queryClient.invalidateQueries({
      refetchType: options?.refetch ? 'active' : 'none',
    })
  }

  /**
   * Invalidate all order-related queries
   */
  invalidateOrders(options?: InvalidationOptions) {
    return this.queryClient.invalidateQueries({
      queryKey: orderKeys.all,
      exact: options?.exact,
      refetchType: options?.refetch ? 'active' : 'none',
    })
  }

  /**
   * Invalidate specific order
   */
  invalidateOrder(id: string, options?: InvalidationOptions) {
    return this.queryClient.invalidateQueries({
      queryKey: orderKeys.detail(id),
      exact: options?.exact,
      refetchType: options?.refetch ? 'active' : 'none',
    })
  }

  /**
   * Invalidate order lists
   */
  invalidateOrderLists(options?: InvalidationOptions) {
    return this.queryClient.invalidateQueries({
      queryKey: orderKeys.lists(),
      exact: options?.exact,
      refetchType: options?.refetch ? 'active' : 'none',
    })
  }

  /**
   * Invalidate all task-related queries
   */
  invalidateTasks(options?: InvalidationOptions) {
    return this.queryClient.invalidateQueries({
      queryKey: taskKeys.all,
      exact: options?.exact,
      refetchType: options?.refetch ? 'active' : 'none',
    })
  }

  /**
   * Invalidate specific task
   */
  invalidateTask(id: string, options?: InvalidationOptions) {
    return this.queryClient.invalidateQueries({
      queryKey: taskKeys.detail(id),
      exact: options?.exact,
      refetchType: options?.refetch ? 'active' : 'none',
    })
  }

  /**
   * Invalidate task lists
   */
  invalidateTaskLists(options?: InvalidationOptions) {
    return this.queryClient.invalidateQueries({
      queryKey: taskKeys.lists(),
      exact: options?.exact,
      refetchType: options?.refetch ? 'active' : 'none',
    })
  }

  /**
   * Invalidate worker's tasks
   */
  invalidateWorkerTasks(workerId: string, options?: InvalidationOptions) {
    return this.queryClient.invalidateQueries({
      queryKey: taskKeys.myTasks(workerId),
      exact: options?.exact,
      refetchType: options?.refetch ? 'active' : 'none',
    })
  }

  /**
   * Invalidate multiple query keys
   */
  invalidateMultiple(queryKeys: readonly unknown[][], options?: InvalidationOptions) {
    return Promise.all(
      queryKeys.map((queryKey) =>
        this.queryClient.invalidateQueries({
          queryKey,
          exact: options?.exact,
          refetchType: options?.refetch ? 'active' : 'none',
        })
      )
    )
  }

  /**
   * Remove queries from cache
   */
  removeQueries(queryKey: readonly unknown[]) {
    return this.queryClient.removeQueries({ queryKey })
  }

  /**
   * Reset specific queries to their initial state
   */
  resetQueries(queryKey: readonly unknown[]) {
    return this.queryClient.resetQueries({ queryKey })
  }

  /**
   * Cancel ongoing queries
   */
  cancelQueries(queryKey: readonly unknown[]) {
    return this.queryClient.cancelQueries({ queryKey })
  }
}

/**
 * Create a query invalidator instance
 */
export const createQueryInvalidator = (queryClient: QueryClient) => {
  return new QueryInvalidator(queryClient)
}

/**
 * Batch invalidate multiple query types
 */
export const batchInvalidate = async (
  queryClient: QueryClient,
  invalidations: Array<{
    queryKey: readonly unknown[]
    exact?: boolean
  }>
) => {
  const promises = invalidations.map(({ queryKey, exact }) =>
    queryClient.invalidateQueries({
      queryKey,
      exact,
    })
  )
  return Promise.all(promises)
}

/**
 * Smart invalidation based on entity relationships
 */
export const smartInvalidate = async (
  queryClient: QueryClient,
  entityType: 'order' | 'task',
  entityId?: string,
  relatedEntities?: {
    orders?: string[]
    tasks?: string[]
    workers?: string[]
  }
) => {
  const invalidations: Array<{ queryKey: readonly unknown[] }> = []

  // Invalidate main entity
  if (entityType === 'order') {
    invalidations.push({ queryKey: orderKeys.lists() })
    if (entityId) {
      invalidations.push({ queryKey: orderKeys.detail(entityId) })
    }
  } else if (entityType === 'task') {
    invalidations.push({ queryKey: taskKeys.lists() })
    if (entityId) {
      invalidations.push({ queryKey: taskKeys.detail(entityId) })
    }
  }

  // Invalidate related entities
  if (relatedEntities?.orders) {
    relatedEntities.orders.forEach((orderId) => {
      invalidations.push({ queryKey: orderKeys.detail(orderId) })
    })
  }

  if (relatedEntities?.tasks) {
    relatedEntities.tasks.forEach((taskId) => {
      invalidations.push({ queryKey: taskKeys.detail(taskId) })
    })
  }

  if (relatedEntities?.workers) {
    relatedEntities.workers.forEach((workerId) => {
      invalidations.push({ queryKey: taskKeys.myTasks(workerId) })
    })
  }

  return batchInvalidate(queryClient, invalidations)
}
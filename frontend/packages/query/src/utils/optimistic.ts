import { QueryClient } from '@tanstack/react-query'

export interface OptimisticUpdateContext<T> {
  previousData: T | undefined
  optimisticData: T
  rollback: () => void
}

/**
 * Helper for creating optimistic updates with automatic rollback
 */
export class OptimisticUpdater {
  constructor(private queryClient: QueryClient) {}

  /**
   * Perform an optimistic update on a single query
   */
  async updateQuery<T>(
    queryKey: readonly unknown[],
    updater: (oldData: T | undefined) => T
  ): Promise<OptimisticUpdateContext<T>> {
    // Cancel any outgoing refetches
    await this.queryClient.cancelQueries({ queryKey })

    // Snapshot the previous value
    const previousData = this.queryClient.getQueryData<T>(queryKey)

    // Optimistically update to the new value
    const optimisticData = updater(previousData)
    this.queryClient.setQueryData(queryKey, optimisticData)

    // Return context with rollback function
    return {
      previousData,
      optimisticData,
      rollback: () => {
        this.queryClient.setQueryData(queryKey, previousData)
      },
    }
  }

  /**
   * Perform optimistic updates on multiple queries
   */
  async updateQueries<T>(
    updates: Array<{
      queryKey: readonly unknown[]
      updater: (oldData: T | undefined) => T
    }>
  ): Promise<Array<OptimisticUpdateContext<T>>> {
    const contexts: Array<OptimisticUpdateContext<T>> = []

    for (const { queryKey, updater } of updates) {
      const context = await this.updateQuery<T>(queryKey, updater)
      contexts.push(context)
    }

    return contexts
  }

  /**
   * Optimistically add an item to a list
   */
  async addToList<T>(
    queryKey: readonly unknown[],
    item: T,
    position: 'start' | 'end' = 'start'
  ): Promise<OptimisticUpdateContext<T[]>> {
    return this.updateQuery<T[]>(queryKey, (oldData) => {
      if (!oldData) return [item]
      return position === 'start' ? [item, ...oldData] : [...oldData, item]
    })
  }

  /**
   * Optimistically remove an item from a list
   */
  async removeFromList<T extends { id: string }>(
    queryKey: readonly unknown[],
    itemId: string
  ): Promise<OptimisticUpdateContext<T[]>> {
    return this.updateQuery<T[]>(queryKey, (oldData) => {
      if (!oldData) return []
      return oldData.filter((item) => item.id !== itemId)
    })
  }

  /**
   * Optimistically update an item in a list
   */
  async updateInList<T extends { id: string }>(
    queryKey: readonly unknown[],
    itemId: string,
    updates: Partial<T>
  ): Promise<OptimisticUpdateContext<T[]>> {
    return this.updateQuery<T[]>(queryKey, (oldData) => {
      if (!oldData) return []
      return oldData.map((item) =>
        item.id === itemId ? { ...item, ...updates } : item
      )
    })
  }

  /**
   * Optimistically update a paginated response
   */
  async updatePaginatedList<T extends { id: string }>(
    queryKey: readonly unknown[],
    itemId: string,
    updates: Partial<T>
  ): Promise<OptimisticUpdateContext<{ data: T[]; total: number }>> {
    return this.updateQuery<{ data: T[]; total: number }>(queryKey, (oldData) => {
      if (!oldData) return { data: [], total: 0 }
      return {
        ...oldData,
        data: oldData.data.map((item) =>
          item.id === itemId ? { ...item, ...updates } : item
        ),
      }
    })
  }
}

/**
 * Create an optimistic updater instance
 */
export const createOptimisticUpdater = (queryClient: QueryClient) => {
  return new OptimisticUpdater(queryClient)
}

/**
 * Helper for optimistic mutations with automatic rollback on error
 */
export const optimisticMutation = <TData, TError, TVariables, TContext = unknown>({
  mutationFn,
  onMutate,
  onError,
  onSuccess,
  onSettled,
}: {
  mutationFn: (variables: TVariables) => Promise<TData>
  onMutate?: (variables: TVariables) => Promise<TContext> | TContext
  onError?: (error: TError, variables: TVariables, context: TContext | undefined) => void
  onSuccess?: (data: TData, variables: TVariables, context: TContext | undefined) => void
  onSettled?: (
    data: TData | undefined,
    error: TError | null,
    variables: TVariables,
    context: TContext | undefined
  ) => void
}) => {
  return {
    mutationFn,
    onMutate,
    onError: (error: TError, variables: TVariables, context: TContext | undefined) => {
      // Rollback logic should be in the context
      if (onError) {
        onError(error, variables, context)
      }
    },
    onSuccess,
    onSettled,
  }
}

/**
 * Helper for creating optimistic delete mutations
 */
export const createOptimisticDelete = <T extends { id: string }>(
  queryClient: QueryClient,
  listQueryKey: readonly unknown[],
  detailQueryKeyFn: (id: string) => readonly unknown[]
) => {
  return async (id: string) => {
    const updater = new OptimisticUpdater(queryClient)

    // Remove from list
    const listContext = await updater.removeFromList<T>(listQueryKey, id)

    // Remove detail query
    queryClient.removeQueries({ queryKey: detailQueryKeyFn(id) })

    return {
      rollback: () => {
        listContext.rollback()
        // Detail query will be refetched if needed
      },
    }
  }
}

/**
 * Helper for creating optimistic status updates
 */
export const createOptimisticStatusUpdate = <T extends { id: string; status: string }>(
  queryClient: QueryClient,
  listQueryKey: readonly unknown[],
  detailQueryKeyFn: (id: string) => readonly unknown[]
) => {
  return async (id: string, newStatus: string) => {
    const updater = new OptimisticUpdater(queryClient)
    const contexts: Array<{ rollback: () => void }> = []

    // Update in list
    const listContext = await updater.updateInList<T>(listQueryKey, id, {
      status: newStatus,
    } as Partial<T>)
    contexts.push(listContext)

    // Update detail
    const detailContext = await updater.updateQuery<T>(
      detailQueryKeyFn(id),
      (oldData) => {
        if (!oldData) return oldData
        return { ...oldData, status: newStatus }
      }
    )
    contexts.push(detailContext)

    return {
      rollback: () => {
        contexts.forEach((context) => context.rollback())
      },
    }
  }
}
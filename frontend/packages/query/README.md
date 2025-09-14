# @mes/query

TanStack Query configuration and utilities for the Manufacturing Execution System with optimistic updates, prefetching, and server state management.

## Features

- 🚀 Optimized query client with smart caching and retries
- 🔄 Optimistic updates for instant UI feedback
- 📡 Prefetching utilities for SSR and improved performance
- 🎯 Type-safe hooks for all MES entities
- 🔐 Authenticated queries with permission checks
- 🛠️ Query invalidation utilities
- 📊 Paginated query state management
- 🧪 Comprehensive test coverage

## Installation

This package is part of the MES monorepo and is automatically available to other packages and applications within the workspace.

```json
{
  "dependencies": {
    "@mes/query": "workspace:*"
  }
}
```

## Setup

### Basic Configuration

Wrap your application with the IntegratedQueryProvider alongside Redux:

```tsx
// app/providers.tsx
import { StoreProvider } from '@mes/store'
import { IntegratedQueryProvider } from '@mes/query'
import { AuthProvider } from '@mes/auth'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <StoreProvider>
      <IntegratedQueryProvider>
        <AuthProvider>
          {children}
        </AuthProvider>
      </IntegratedQueryProvider>
    </StoreProvider>
  )
}
```

## Usage

### Fetching Data

```tsx
import { useOrders, useOrder } from '@mes/query'

function OrdersList() {
  const { data, isLoading, error } = useOrders({
    page: 1,
    limit: 20,
    status: 'pending'
  })

  if (isLoading) return <div>Loading orders...</div>
  if (error) return <div>Error: {error.message}</div>

  return (
    <div>
      {data?.data.map(order => (
        <OrderCard key={order.id} order={order} />
      ))}
    </div>
  )
}

function OrderDetail({ orderId }: { orderId: string }) {
  const { data: order, isLoading } = useOrder(orderId)

  if (isLoading) return <div>Loading...</div>
  if (!order) return <div>Order not found</div>

  return <div>{order.orderNumber}</div>
}
```

### Mutations with Optimistic Updates

```tsx
import { useCreateOrder, useUpdateOrder, useDeleteOrder } from '@mes/query'

function OrderActions() {
  const createOrder = useCreateOrder({
    onSuccess: (data) => {
      console.log('Order created:', data)
    },
    onError: (error) => {
      console.error('Failed to create order:', error)
    }
  })

  const updateOrder = useUpdateOrder()
  const deleteOrder = useDeleteOrder()

  const handleCreate = () => {
    createOrder.mutate({
      customerName: 'ACME Corp',
      items: [],
      priority: 'high'
    })
  }

  const handleUpdate = (orderId: string) => {
    // Optimistic update happens automatically
    updateOrder.mutate({
      id: orderId,
      status: 'completed'
    })
  }

  const handleDelete = (orderId: string) => {
    deleteOrder.mutate(orderId)
  }

  return (
    <div>
      <button onClick={handleCreate}>Create Order</button>
      {/* ... */}
    </div>
  )
}
```

### Task Management

```tsx
import { useTasks, useMyTasks, useStartTask, useCompleteTask } from '@mes/query'

function WorkerTasks({ workerId }: { workerId: string }) {
  const { data: tasks } = useMyTasks(workerId)
  const startTask = useStartTask()
  const completeTask = useCompleteTask()

  const handleStart = (taskId: string) => {
    startTask.mutate(taskId)
  }

  const handleComplete = (taskId: string, hours: number) => {
    completeTask.mutate({
      id: taskId,
      actualHours: hours,
      notes: 'Task completed successfully'
    })
  }

  return (
    <div>
      {tasks?.map(task => (
        <TaskCard
          key={task.id}
          task={task}
          onStart={() => handleStart(task.id)}
          onComplete={(hours) => handleComplete(task.id, hours)}
        />
      ))}
    </div>
  )
}
```

### Query State Management

```tsx
import { useQueryState, usePaginatedQueryState } from '@mes/query'

function OrdersWithPagination() {
  const ordersQuery = useOrders({ page: 1, limit: 10 })

  const {
    items,
    currentPage,
    totalPages,
    hasNextPage,
    hasPreviousPage,
    nextPage,
    previousPage,
    pageInfo
  } = usePaginatedQueryState(ordersQuery, {
    onPageChange: (page) => {
      // Handle page change
    }
  })

  return (
    <div>
      <div>
        Showing {pageInfo.from}-{pageInfo.to} of {pageInfo.total}
      </div>

      {items.map(order => (
        <OrderRow key={order.id} order={order} />
      ))}

      <div>
        <button onClick={previousPage} disabled={!hasPreviousPage}>
          Previous
        </button>
        <span>Page {currentPage} of {totalPages}</span>
        <button onClick={nextPage} disabled={!hasNextPage}>
          Next
        </button>
      </div>
    </div>
  )
}
```

### Query Invalidation

```tsx
import { useQueryClient, createQueryInvalidator, smartInvalidate } from '@mes/query'

function useInvalidation() {
  const queryClient = useQueryClient()
  const invalidator = createQueryInvalidator(queryClient)

  // Invalidate all orders
  const invalidateAllOrders = () => {
    invalidator.invalidateOrders({ refetch: true })
  }

  // Invalidate specific order
  const invalidateOrder = (orderId: string) => {
    invalidator.invalidateOrder(orderId)
  }

  // Smart invalidation with relationships
  const smartInvalidateOrder = (orderId: string, taskIds: string[]) => {
    smartInvalidate(queryClient, 'order', orderId, {
      tasks: taskIds
    })
  }

  return {
    invalidateAllOrders,
    invalidateOrder,
    smartInvalidateOrder
  }
}
```

### Optimistic Updates

```tsx
import { useQueryClient, createOptimisticUpdater } from '@mes/query'

function useOptimisticOperations() {
  const queryClient = useQueryClient()
  const updater = createOptimisticUpdater(queryClient)

  const optimisticallyUpdateStatus = async (orderId: string, newStatus: string) => {
    const context = await updater.updateQuery(
      orderKeys.detail(orderId),
      (oldData) => {
        if (!oldData) return oldData
        return { ...oldData, status: newStatus }
      }
    )

    try {
      // Perform actual API call
      await updateOrderStatus(orderId, newStatus)
    } catch (error) {
      // Rollback on error
      context.rollback()
      throw error
    }
  }

  return { optimisticallyUpdateStatus }
}
```

### Prefetching for SSR

```tsx
// In server components (Next.js App Router)
import { prefetchForPage } from '@mes/query'

export default async function OrdersPage({ searchParams }) {
  const dehydratedState = await prefetchForPage('orders', {
    page: searchParams.page || 1,
    status: searchParams.status
  })

  return (
    <HydrationBoundary state={dehydratedState}>
      <OrdersList />
    </HydrationBoundary>
  )
}
```

### Authenticated Queries

```tsx
import { useAuthenticatedQuery, usePermissionQuery } from '@mes/query'

function SecureData() {
  // Query that requires authentication
  const { data } = useAuthenticatedQuery(
    ['secure-data'],
    async ({ token }) => {
      const response = await fetch('/api/secure', {
        headers: { Authorization: `Bearer ${token}` }
      })
      return response.json()
    }
  )

  // Query that requires specific permission
  const { data: adminData } = usePermissionQuery(
    'admin.view',
    ['admin-data'],
    async () => {
      const response = await fetch('/api/admin')
      return response.json()
    }
  )

  return <div>{/* ... */}</div>
}
```

## Query Keys

The package provides query key factories for consistent cache management:

```typescript
// Orders
orderKeys.all         // ['orders']
orderKeys.lists()     // ['orders', 'list']
orderKeys.list(params) // ['orders', 'list', params]
orderKeys.detail(id)  // ['orders', 'detail', id]

// Tasks
taskKeys.all          // ['tasks']
taskKeys.lists()      // ['tasks', 'list']
taskKeys.list(params) // ['tasks', 'list', params]
taskKeys.detail(id)   // ['tasks', 'detail', id]
taskKeys.myTasks(workerId) // ['tasks', 'my', workerId]
```

## Configuration

### Query Client Options

```typescript
const queryClient = createQueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,    // 5 minutes
      gcTime: 10 * 60 * 1000,       // 10 minutes
      retry: 3,
      retryDelay: exponentialBackoff,
      refetchOnWindowFocus: true,
      refetchOnReconnect: 'always'
    },
    mutations: {
      retry: 1,
      retryDelay: 1000
    }
  }
})
```

## Utilities

### Invalidation Utilities
- `QueryInvalidator` - Class for managing query invalidations
- `batchInvalidate` - Invalidate multiple queries at once
- `smartInvalidate` - Intelligent invalidation based on relationships

### Optimistic Update Utilities
- `OptimisticUpdater` - Class for optimistic updates
- `optimisticMutation` - Helper for creating optimistic mutations
- `createOptimisticDelete` - Helper for optimistic deletions
- `createOptimisticStatusUpdate` - Helper for status updates

### Prefetching Utilities
- `Prefetcher` - Class for prefetching queries
- `prefetchForPage` - Prefetch data for specific pages
- `prefetchInfiniteQuery` - Prefetch infinite queries
- `batchPrefetch` - Prefetch multiple queries
- `conditionalPrefetch` - Prefetch based on conditions

### State Management Hooks
- `useQueryState` - Enhanced query state handling
- `useMutationState` - Enhanced mutation state handling
- `useCombinedQueries` - Combine multiple queries
- `usePaginatedQueryState` - Pagination state management

## Testing

The package includes comprehensive tests:

```bash
npm test              # Run all tests
npm run test:watch    # Run tests in watch mode
npm run test:coverage # Generate coverage report
```

## Best Practices

1. **Use query key factories**: Ensure consistent cache keys across your app
2. **Implement optimistic updates**: Provide instant feedback for better UX
3. **Prefetch critical data**: Improve perceived performance
4. **Handle errors gracefully**: Use error boundaries and fallbacks
5. **Invalidate smartly**: Use relationship-aware invalidation
6. **Configure retry logic**: Adjust based on endpoint reliability
7. **Use pagination hooks**: For large data sets
8. **Leverage SSR prefetching**: For better initial load times

## TypeScript Support

All exports are fully typed:

```typescript
import type {
  Order,
  OrderItem,
  Task,
  Worker,
  PaginatedResponse,
  InvalidationOptions,
  OptimisticUpdateContext
} from '@mes/query'
```

## Integration with Redux

TanStack Query works alongside Redux:
- **Redux**: Manages client state (auth, UI, notifications)
- **TanStack Query**: Manages server state (orders, tasks, etc.)

This separation of concerns provides:
- Better cache management
- Automatic background refetching
- Optimistic updates
- Request deduplication
- Intelligent prefetching

## Contributing

When adding new features:
1. Create query hooks in `src/hooks/`
2. Add query key factories
3. Implement optimistic updates where applicable
4. Add prefetch utilities for SSR
5. Write comprehensive tests
6. Update this documentation
# @mes/api

Comprehensive API client package for the Manufacturing Execution System with Axios interceptors, retry logic, and request cancellation.

## Features

- 🔄 Automatic request retry with exponential backoff
- 🚫 Request cancellation and deduplication
- 🔐 JWT token management with automatic refresh
- 🏢 Multi-tenant support
- 📊 TypeScript support with full type definitions
- 🎯 Domain-specific service classes
- 📝 Request/response interceptors
- 📤 File upload/download support
- ⚡ Request caching capabilities

## Installation

This package is part of the MES monorepo and is automatically available to other packages and applications within the workspace.

```json
{
  "dependencies": {
    "@mes/api": "workspace:*"
  }
}
```

## Setup

### Basic Configuration

```typescript
import { apiClient } from '@mes/api'

// Configure the API client
apiClient.setBaseURL(process.env.NEXT_PUBLIC_API_URL)

// Set up authentication callbacks
apiClient.setAuthCallbacks(
  () => localStorage.getItem('token'),           // Token getter
  (token) => localStorage.setItem('token', token), // Token setter
  () => {                                         // On unauthorized
    localStorage.removeItem('token')
    window.location.href = '/login'
  }
)
```

### With Retry Configuration

```typescript
import { apiClientWithRetry, RetryConfig } from '@mes/api'

const retryConfig: RetryConfig = {
  retries: 3,
  retryDelay: (retryCount) => Math.pow(2, retryCount) * 1000,
  retryCondition: (error) => {
    return !error.response || error.response.status >= 500
  },
  onRetry: (retryCount, error) => {
    console.log(`Retry attempt ${retryCount} for ${error.config?.url}`)
  }
}

apiClientWithRetry.setRetryConfig(retryConfig)
```

## Usage

### Using Service Classes

```typescript
import { orderService, taskService, workerService } from '@mes/api'

// Orders
const orders = await orderService.getAll({ page: 1, limit: 10 })
const order = await orderService.getById('order-123')
const newOrder = await orderService.create({
  customerId: 'customer-456',
  customerName: 'ACME Corp',
  items: [
    {
      productId: 'prod-789',
      quantity: 100,
      unitPrice: 10.50
    }
  ],
  priority: 'HIGH',
  dueDate: new Date('2024-12-31')
})

// Tasks
const myTasks = await taskService.getMyTasks('worker-123')
await taskService.startTask('task-456')
await taskService.completeTask('task-456', 8, 'Completed successfully')

// Workers
await workerService.clockIn({
  workerId: 'worker-123',
  shiftId: 'shift-789'
})
const productivity = await workerService.getWorkerProductivity('worker-123', 'week')
```

### Direct API Client Usage

```typescript
import { apiClient } from '@mes/api'

// GET request
const response = await apiClient.get('/custom-endpoint', {
  params: { filter: 'active' }
})

// POST request
const data = await apiClient.post('/custom-endpoint', {
  name: 'New Item',
  value: 123
})

// File upload
const formData = new FormData()
formData.append('file', file)

const uploadResult = await apiClient.upload(
  '/files/upload',
  formData,
  (progress) => console.log(`Upload progress: ${progress}%`)
)

// File download
await apiClient.download('/files/report.pdf', 'monthly-report.pdf')
```

### Request Cancellation

```typescript
import { cancelManager, ComponentRequestManager } from '@mes/api'

// Cancel a specific request
cancelManager.cancelRequest('GET-/api/orders')

// Cancel all pending requests
cancelManager.cancelAll()

// In React components
const requestManager = new ComponentRequestManager()

useEffect(() => {
  const { promise, cancel } = createCancellableRequest(
    async (signal) => {
      return await fetch('/api/data', { signal })
    }
  )

  requestManager.add(cancel)

  promise.then(handleData).catch(handleError)

  return () => requestManager.cleanup()
}, [])
```

### Error Handling

```typescript
import { ApiError } from '@mes/api'

try {
  const order = await orderService.getById('invalid-id')
} catch (error) {
  if (error instanceof ApiError) {
    console.error(`API Error: ${error.message}`)
    console.error(`Status Code: ${error.statusCode}`)
    console.error(`Details: ${JSON.stringify(error.details)}`)
  }
}
```

## API Services

### Available Services

- `orderService` - Order management
- `taskService` - Task management and assignment
- `workerService` - Worker management and time tracking
- `inventoryService` - Inventory tracking
- `productService` - Product catalog
- `equipmentService` - Equipment maintenance
- `qualityService` - Quality metrics and inspections
- `shiftService` - Shift scheduling
- `reportService` - Reporting and analytics
- `notificationService` - Notifications
- `wasteService` - Waste tracking

### Extending Services

```typescript
import { BaseService } from '@mes/api'

interface CustomEntity {
  id: string
  name: string
  value: number
}

class CustomService extends BaseService<CustomEntity> {
  constructor() {
    super('/api/custom')
  }

  async customMethod(id: string): Promise<CustomEntity> {
    const response = await apiClient.get(`${this.baseUrl}/${id}/special`)
    return response.data
  }
}

export const customService = new CustomService()
```

## Interceptors

### Request Interceptors

The API client automatically adds:
- Authorization header with JWT token
- X-Tenant-Id header for multi-tenancy
- X-Request-Id header for request tracing

### Response Interceptors

The API client automatically handles:
- 401 Unauthorized with token refresh
- Error formatting and standardization
- Retry logic for failed requests

## TypeScript Support

All API types are fully typed:

```typescript
import type {
  Order,
  Task,
  Worker,
  Product,
  OrderStatus,
  TaskStatus,
  PaginatedResponse
} from '@mes/api'

const orders: PaginatedResponse<Order> = await orderService.getAll()
const task: Task = await taskService.getById('task-123')
```

## Configuration Options

```typescript
interface ApiConfig {
  baseURL: string
  timeout?: number           // Default: 30000ms
  withCredentials?: boolean  // Default: true
  headers?: Record<string, string>
}

interface RetryConfig {
  retries?: number           // Default: 3
  retryDelay?: number | ((retryCount: number) => number)
  retryCondition?: (error: AxiosError) => boolean
  shouldResetTimeout?: boolean
  onRetry?: (retryCount: number, error: AxiosError) => void
}
```

## Testing

The package includes comprehensive tests:

```bash
npm test
```

Mock the API client in your tests:

```typescript
import { apiClient } from '@mes/api'

jest.mock('@mes/api', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn()
  }
}))
```

## Best Practices

1. **Always handle errors**: Use try-catch blocks or .catch() handlers
2. **Cancel requests in cleanup**: Prevent memory leaks in React components
3. **Use service classes**: Leverage type safety and business logic encapsulation
4. **Configure retry wisely**: Adjust retry config based on endpoint criticality
5. **Monitor request IDs**: Use X-Request-Id for debugging and tracing
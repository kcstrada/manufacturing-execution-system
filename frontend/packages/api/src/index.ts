// Client exports
export { apiClient, AxiosClient } from './client/axios.client'
export { apiClientWithRetry, AxiosClientWithRetry } from './client/axios-with-retry.client'
export type { ApiError, ApiResponse, ApiClientConfig } from './client/axios-with-retry.client'

// Configuration exports
export { defaultApiConfig, apiEndpoints } from './config/api.config'
export type { ApiConfig } from './config/api.config'

// Service exports
export { BaseService } from './services/base.service'
export { orderService, OrderService } from './services/order.service'
export { taskService, TaskService } from './services/task.service'
export { workerService, WorkerService } from './services/worker.service'

// Type exports
export * from './types/api.types'

// Utility exports
export { 
  RetryHandler, 
  createRetryHandler,
  defaultRetryConfig 
} from './utils/retry.utils'
export type { RetryConfig } from './utils/retry.utils'

export {
  CancelManager,
  cancelManager,
  ComponentRequestManager,
  createCancellableRequest
} from './utils/cancel.utils'

// Re-export commonly used Axios types
export type {
  AxiosRequestConfig,
  AxiosResponse,
  AxiosError,
  AxiosInstance,
} from 'axios'
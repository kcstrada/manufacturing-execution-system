import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios'
import { ApiConfig, defaultApiConfig } from '../config/api.config'
import { RetryConfig, RetryHandler, defaultRetryConfig } from '../utils/retry.utils'
import { CancelManager } from '../utils/cancel.utils'

export interface ApiClientConfig extends ApiConfig {
  retry?: RetryConfig
  enableCancellation?: boolean
}

export class AxiosClientWithRetry {
  private instance: AxiosInstance
  private retryHandler: RetryHandler
  private cancelManager: CancelManager
  private enableCancellation: boolean
  private refreshTokenPromise: Promise<string> | null = null
  private tokenGetter?: () => string | null
  private tokenSetter?: (token: string) => void
  private onUnauthorized?: () => void

  constructor(config: ApiClientConfig = defaultApiConfig) {
    this.instance = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout,
      withCredentials: config.withCredentials,
      headers: config.headers,
    })

    this.retryHandler = new RetryHandler(config.retry || defaultRetryConfig)
    this.cancelManager = new CancelManager()
    this.enableCancellation = config.enableCancellation ?? true

    this.setupInterceptors()
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.instance.interceptors.request.use(
      (config) => this.handleRequest(config),
      (error) => this.handleRequestError(error)
    )

    // Response interceptor
    this.instance.interceptors.response.use(
      (response) => this.handleResponse(response),
      (error) => this.handleResponseError(error)
    )
  }

  private handleRequest(config: AxiosRequestConfig): AxiosRequestConfig {
    // Add cancellation token if enabled
    if (this.enableCancellation && !config.cancelToken) {
      config = this.cancelManager.addRequest(config)
    }

    // Add auth token if available
    if (this.tokenGetter) {
      const token = this.tokenGetter()
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }

    // Add tenant header if available
    const tenantId = this.getTenantId()
    if (tenantId && config.headers) {
      config.headers['X-Tenant-Id'] = tenantId
    }

    // Add request ID for tracing
    if (config.headers) {
      config.headers['X-Request-Id'] = this.generateRequestId()
    }

    // Initialize retry count
    (config as any).__retryCount = (config as any).__retryCount || 0

    return config
  }

  private handleRequestError(error: AxiosError): Promise<AxiosError> {
    console.error('Request error:', error)
    return Promise.reject(error)
  }

  private handleResponse(response: AxiosResponse): AxiosResponse {
    // Remove from pending requests
    if (this.enableCancellation) {
      this.cancelManager.removeRequest(response.config)
    }
    return response
  }

  private async handleResponseError(error: AxiosError): Promise<any> {
    const originalRequest = error.config as AxiosRequestConfig & { 
      _retry?: boolean
      __retryCount?: number
    }

    // Remove from pending requests
    if (this.enableCancellation && originalRequest) {
      this.cancelManager.removeRequest(originalRequest)
    }

    // Don't retry cancelled requests
    if (axios.isCancel(error)) {
      return Promise.reject(error)
    }

    // Handle 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      // If we're already refreshing, wait for it
      if (this.refreshTokenPromise) {
        try {
          const token = await this.refreshTokenPromise
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`
          }
          return this.instance(originalRequest)
        } catch (refreshError) {
          this.handleAuthFailure()
          return Promise.reject(refreshError)
        }
      }

      // Start refresh process
      this.refreshTokenPromise = this.refreshToken()

      try {
        const token = await this.refreshTokenPromise
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${token}`
        }
        return this.instance(originalRequest)
      } catch (refreshError) {
        this.handleAuthFailure()
        return Promise.reject(refreshError)
      } finally {
        this.refreshTokenPromise = null
      }
    }

    // Handle retry logic
    if (originalRequest && !originalRequest._retry) {
      const retryCount = originalRequest.__retryCount || 0
      const shouldRetry = await this.retryHandler.handleRetry(error, retryCount, originalRequest)

      if (shouldRetry) {
        originalRequest.__retryCount = retryCount + 1
        return this.instance(originalRequest)
      }
    }

    return Promise.reject(error)
  }

  private async refreshToken(): Promise<string> {
    try {
      const response = await this.instance.post('/auth/refresh')
      const { token } = response.data

      if (this.tokenSetter) {
        this.tokenSetter(token)
      }

      return token
    } catch (error) {
      throw error
    }
  }

  private handleAuthFailure(): void {
    if (this.onUnauthorized) {
      this.onUnauthorized()
    }
  }

  private getTenantId(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('tenantId')
    }
    return null
  }

  private generateRequestId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  // Configuration methods
  public setAuthCallbacks(
    tokenGetter: () => string | null,
    tokenSetter: (token: string) => void,
    onUnauthorized: () => void
  ): void {
    this.tokenGetter = tokenGetter
    this.tokenSetter = tokenSetter
    this.onUnauthorized = onUnauthorized
  }

  public setRetryConfig(config: RetryConfig): void {
    this.retryHandler = new RetryHandler(config)
  }

  public cancelRequest(key: string): void {
    this.cancelManager.cancelRequest(key)
  }

  public cancelAllRequests(): void {
    this.cancelManager.cancelAll()
  }

  public getCancelManager(): CancelManager {
    return this.cancelManager
  }

  public getAxiosInstance(): AxiosInstance {
    return this.instance
  }

  // HTTP methods with automatic retry
  public async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.get<T>(url, config)
    return response.data
  }

  public async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.post<T>(url, data, config)
    return response.data
  }

  public async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.put<T>(url, data, config)
    return response.data
  }

  public async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.patch<T>(url, data, config)
    return response.data
  }

  public async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.delete<T>(url, config)
    return response.data
  }
}

// Create singleton instance with retry support
export const apiClientWithRetry = new AxiosClientWithRetry({
  ...defaultApiConfig,
  retry: defaultRetryConfig,
  enableCancellation: true,
})
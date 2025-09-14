import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios'
import { ApiConfig, defaultApiConfig } from '../config/api.config'

export interface ApiError {
  message: string
  statusCode: number
  error?: string
  details?: any
}

export interface ApiResponse<T = any> {
  data: T
  message?: string
  statusCode?: number
}

class AxiosClient {
  private instance: AxiosInstance
  private refreshTokenPromise: Promise<string> | null = null
  private tokenGetter?: () => string | null
  private tokenSetter?: (token: string) => void
  private onUnauthorized?: () => void

  constructor(config: ApiConfig = defaultApiConfig) {
    this.instance = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout,
      withCredentials: config.withCredentials,
      headers: config.headers,
    })

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

    return config
  }

  private handleRequestError(error: AxiosError): Promise<AxiosError> {
    console.error('Request error:', error)
    return Promise.reject(error)
  }

  private handleResponse(response: AxiosResponse): AxiosResponse {
    return response
  }

  private async handleResponseError(error: AxiosError): Promise<any> {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean }

    // Handle 401 Unauthorized - but not for refresh requests themselves
    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url?.includes('/auth/refresh')) {
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

    // Handle other errors
    const apiError: ApiError = {
      message: error.response?.data?.message || error.message || 'An error occurred',
      statusCode: error.response?.status || 500,
      error: error.response?.data?.error,
      details: error.response?.data?.details,
    }

    return Promise.reject(apiError)
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
    // Get tenant ID from localStorage or context
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

  public setBaseURL(url: string): void {
    this.instance.defaults.baseURL = url
  }

  public setDefaultHeaders(headers: Record<string, string>): void {
    Object.assign(this.instance.defaults.headers.common, headers)
  }

  // HTTP methods
  public async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.instance.get<T>(url, config)
    return { data: response.data, statusCode: response.status }
  }

  public async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.instance.post<T>(url, data, config)
    return { data: response.data, statusCode: response.status }
  }

  public async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.instance.put<T>(url, data, config)
    return { data: response.data, statusCode: response.status }
  }

  public async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.instance.patch<T>(url, data, config)
    return { data: response.data, statusCode: response.status }
  }

  public async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.instance.delete<T>(url, config)
    return { data: response.data, statusCode: response.status }
  }

  // File upload
  public async upload<T = any>(url: string, formData: FormData, onProgress?: (progress: number) => void): Promise<ApiResponse<T>> {
    const response = await this.instance.post<T>(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          onProgress(progress)
        }
      },
    })
    return { data: response.data, statusCode: response.status }
  }

  // File download
  public async download(url: string, filename?: string): Promise<void> {
    const response = await this.instance.get(url, {
      responseType: 'blob',
    })

    const blob = new Blob([response.data])
    const link = document.createElement('a')
    link.href = window.URL.createObjectURL(blob)
    link.download = filename || 'download'
    link.click()
    window.URL.revokeObjectURL(link.href)
  }

  // Get axios instance for advanced usage
  public getAxiosInstance(): AxiosInstance {
    return this.instance
  }
}

// Create singleton instance
export const apiClient = new AxiosClient()

// Export for testing
export { AxiosClient }
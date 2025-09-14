import { AxiosError, AxiosRequestConfig } from 'axios'

export interface RetryConfig {
  retries?: number
  retryDelay?: number | ((retryCount: number) => number)
  retryCondition?: (error: AxiosError) => boolean
  shouldResetTimeout?: boolean
  onRetry?: (retryCount: number, error: AxiosError) => void
}

export const defaultRetryConfig: RetryConfig = {
  retries: 3,
  retryDelay: (retryCount) => Math.pow(2, retryCount) * 1000, // Exponential backoff
  retryCondition: (error) => {
    // Retry on network errors or 5xx errors
    return !error.response || (error.response.status >= 500 && error.response.status < 600)
  },
  shouldResetTimeout: true,
}

export class RetryHandler {
  private config: Required<RetryConfig>

  constructor(config?: RetryConfig) {
    this.config = {
      retries: config?.retries ?? defaultRetryConfig.retries!,
      retryDelay: config?.retryDelay ?? defaultRetryConfig.retryDelay!,
      retryCondition: config?.retryCondition ?? defaultRetryConfig.retryCondition!,
      shouldResetTimeout: config?.shouldResetTimeout ?? defaultRetryConfig.shouldResetTimeout!,
      onRetry: config?.onRetry ?? (() => {}),
    }
  }

  async handleRetry(
    error: AxiosError,
    retryCount: number,
    originalRequest: AxiosRequestConfig
  ): Promise<boolean> {
    if (retryCount >= this.config.retries) {
      return false
    }

    if (!this.config.retryCondition(error)) {
      return false
    }

    const delay = typeof this.config.retryDelay === 'function'
      ? this.config.retryDelay(retryCount)
      : this.config.retryDelay

    this.config.onRetry(retryCount + 1, error)

    await this.sleep(delay)

    return true
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  getDelay(retryCount: number): number {
    return typeof this.config.retryDelay === 'function'
      ? this.config.retryDelay(retryCount)
      : this.config.retryDelay
  }
}

export const createRetryHandler = (config?: RetryConfig): RetryHandler => {
  return new RetryHandler(config)
}
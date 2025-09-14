import axios, { CancelTokenSource, AxiosRequestConfig } from 'axios'

export class CancelManager {
  private pendingRequests: Map<string, CancelTokenSource>

  constructor() {
    this.pendingRequests = new Map()
  }

  /**
   * Generate a unique key for a request
   */
  private generateRequestKey(config: AxiosRequestConfig): string {
    const { method, url, params, data } = config
    return `${method}-${url}-${JSON.stringify(params)}-${JSON.stringify(data)}`
  }

  /**
   * Add a request to the pending requests map
   */
  addRequest(config: AxiosRequestConfig): AxiosRequestConfig {
    const requestKey = this.generateRequestKey(config)

    // Cancel any existing request with the same key
    this.cancelRequest(requestKey)

    // Create new cancel token
    const source = axios.CancelToken.source()
    config.cancelToken = source.token

    // Store the cancel token source
    this.pendingRequests.set(requestKey, source)

    return config
  }

  /**
   * Remove a request from the pending requests map
   */
  removeRequest(config: AxiosRequestConfig): void {
    const requestKey = this.generateRequestKey(config)
    this.pendingRequests.delete(requestKey)
  }

  /**
   * Cancel a specific request
   */
  cancelRequest(key: string, message?: string): void {
    const source = this.pendingRequests.get(key)
    if (source) {
      source.cancel(message || 'Request cancelled')
      this.pendingRequests.delete(key)
    }
  }

  /**
   * Cancel all pending requests
   */
  cancelAll(message?: string): void {
    this.pendingRequests.forEach((source) => {
      source.cancel(message || 'All requests cancelled')
    })
    this.pendingRequests.clear()
  }

  /**
   * Cancel requests matching a pattern
   */
  cancelByPattern(pattern: RegExp, message?: string): void {
    const keysToCancel: string[] = []
    
    this.pendingRequests.forEach((_, key) => {
      if (pattern.test(key)) {
        keysToCancel.push(key)
      }
    })

    keysToCancel.forEach(key => {
      this.cancelRequest(key, message)
    })
  }

  /**
   * Get the number of pending requests
   */
  getPendingCount(): number {
    return this.pendingRequests.size
  }

  /**
   * Check if a request is pending
   */
  isPending(config: AxiosRequestConfig): boolean {
    const requestKey = this.generateRequestKey(config)
    return this.pendingRequests.has(requestKey)
  }
}

export const cancelManager = new CancelManager()

/**
 * Higher-order function to create a cancellable request
 */
export function createCancellableRequest<T>(
  requestFn: (signal: AbortSignal) => Promise<T>
): { promise: Promise<T>; cancel: () => void } {
  const controller = new AbortController()

  const promise = requestFn(controller.signal)

  return {
    promise,
    cancel: () => controller.abort(),
  }
}

/**
 * Utility to handle request cancellation in React components
 */
export class ComponentRequestManager {
  private requests: Set<() => void>

  constructor() {
    this.requests = new Set()
  }

  add(cancelFn: () => void): void {
    this.requests.add(cancelFn)
  }

  remove(cancelFn: () => void): void {
    this.requests.delete(cancelFn)
  }

  cancelAll(): void {
    this.requests.forEach(cancel => cancel())
    this.requests.clear()
  }

  cleanup(): void {
    this.cancelAll()
  }
}
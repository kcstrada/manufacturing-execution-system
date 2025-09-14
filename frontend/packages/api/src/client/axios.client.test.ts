import axios from 'axios'
import MockAdapter from 'axios-mock-adapter'
import { AxiosClient } from './axios.client'
import { defaultApiConfig } from '../config/api.config'

describe('AxiosClient', () => {
  let client: AxiosClient
  let mock: MockAdapter

  beforeEach(() => {
    client = new AxiosClient(defaultApiConfig)
    mock = new MockAdapter(client.getAxiosInstance())
  })

  afterEach(() => {
    mock.restore()
  })

  describe('HTTP Methods', () => {
    it('should make GET request', async () => {
      const data = { id: 1, name: 'Test' }
      mock.onGet('/test').reply(200, data)

      const response = await client.get('/test')
      expect(response.data).toEqual(data)
      expect(response.statusCode).toBe(200)
    })

    it('should make POST request', async () => {
      const requestData = { name: 'New Item' }
      const responseData = { id: 1, ...requestData }
      mock.onPost('/test', requestData).reply(201, responseData)

      const response = await client.post('/test', requestData)
      expect(response.data).toEqual(responseData)
      expect(response.statusCode).toBe(201)
    })

    it('should make PUT request', async () => {
      const requestData = { name: 'Updated Item' }
      const responseData = { id: 1, ...requestData }
      mock.onPut('/test/1', requestData).reply(200, responseData)

      const response = await client.put('/test/1', requestData)
      expect(response.data).toEqual(responseData)
      expect(response.statusCode).toBe(200)
    })

    it('should make PATCH request', async () => {
      const requestData = { name: 'Patched Item' }
      const responseData = { id: 1, ...requestData }
      mock.onPatch('/test/1', requestData).reply(200, responseData)

      const response = await client.patch('/test/1', requestData)
      expect(response.data).toEqual(responseData)
      expect(response.statusCode).toBe(200)
    })

    it('should make DELETE request', async () => {
      mock.onDelete('/test/1').reply(204)

      const response = await client.delete('/test/1')
      expect(response.statusCode).toBe(204)
    })
  })

  describe('Request Interceptors', () => {
    it('should add Authorization header when token is available', async () => {
      const token = 'test-token'
      client.setAuthCallbacks(
        () => token,
        () => {},
        () => {}
      )

      mock.onGet('/test').reply((config) => {
        expect(config.headers?.Authorization).toBe(`Bearer ${token}`)
        return [200, { success: true }]
      })

      await client.get('/test')
    })

    it('should add X-Tenant-Id header when tenant is available', async () => {
      const tenantId = 'tenant-123'
      localStorage.setItem('tenantId', tenantId)

      mock.onGet('/test').reply((config) => {
        expect(config.headers?.['X-Tenant-Id']).toBe(tenantId)
        return [200, { success: true }]
      })

      await client.get('/test')

      localStorage.removeItem('tenantId')
    })

    it('should add X-Request-Id header', async () => {
      mock.onGet('/test').reply((config) => {
        expect(config.headers?.['X-Request-Id']).toBeDefined()
        expect(config.headers?.['X-Request-Id']).toMatch(/^\d+-[a-z0-9]{9}$/)
        return [200, { success: true }]
      })

      await client.get('/test')
    })
  })

  describe('Response Interceptors', () => {
    it('should handle 401 error and refresh token', async () => {
      const newToken = 'new-token'
      let tokenSetterCalled = false

      client.setAuthCallbacks(
        () => 'old-token',
        (token) => {
          expect(token).toBe(newToken)
          tokenSetterCalled = true
        },
        () => {}
      )

      // First request returns 401
      mock.onGet('/test').replyOnce(401)

      // Refresh endpoint returns new token
      mock.onPost('/auth/refresh').reply(200, { token: newToken })

      // Retry original request succeeds
      mock.onGet('/test').reply(200, { success: true })

      const response = await client.get('/test')
      expect(response.data).toEqual({ success: true })
      expect(tokenSetterCalled).toBe(true)
    })

    it('should handle 401 error when refresh fails', async () => {
      let unauthorizedCalled = false

      client.setAuthCallbacks(
        () => 'old-token',
        () => {},
        () => {
          unauthorizedCalled = true
        }
      )

      // Refresh endpoint fails with 401
      mock.onPost('/auth/refresh').replyOnce(401)

      // First request returns 401, triggering refresh attempt
      mock.onGet('/test').replyOnce(401)

      try {
        await client.get('/test')
        fail('Should have thrown an error')
      } catch (error: any) {
        expect(error.statusCode).toBe(401)
      }

      // Wait a bit for async operations to complete
      await new Promise(resolve => setTimeout(resolve, 100))
      expect(unauthorizedCalled).toBe(true)
    })

    it('should format error response correctly', async () => {
      const errorResponse = {
        message: 'Validation error',
        statusCode: 400,
        error: 'Bad Request',
        details: { field: 'email' },
      }

      mock.onGet('/test').reply(400, errorResponse)

      try {
        await client.get('/test')
        fail('Should have thrown an error')
      } catch (error: any) {
        expect(error.message).toBe('Validation error')
        expect(error.statusCode).toBe(400)
        expect(error.error).toBe('Bad Request')
        expect(error.details).toEqual({ field: 'email' })
      }
    })
  })

  describe('File Operations', () => {
    it('should upload file with progress tracking', async () => {
      const formData = new FormData()
      formData.append('file', new Blob(['test']), 'test.txt')

      let progressValue = 0
      const onProgress = (progress: number) => {
        progressValue = progress
      }

      mock.onPost('/upload').reply((config) => {
        // Simulate progress
        if (config.onUploadProgress) {
          config.onUploadProgress({ loaded: 50, total: 100 } as any)
        }
        return [200, { fileId: '123' }]
      })

      const response = await client.upload('/upload', formData, onProgress)
      expect(response.data).toEqual({ fileId: '123' })
      expect(progressValue).toBe(50)
    })

    it('should download file', async () => {
      const blob = new Blob(['file content'], { type: 'text/plain' })
      mock.onGet('/download').reply(200, blob)

      // Mock document methods
      const createElementSpy = jest.spyOn(document, 'createElement')
      const clickSpy = jest.fn()
      createElementSpy.mockReturnValue({ click: clickSpy } as any)

      // Mock URL methods
      const originalCreateObjectURL = window.URL.createObjectURL
      const originalRevokeObjectURL = window.URL.revokeObjectURL
      window.URL.createObjectURL = jest.fn(() => 'blob:url')
      window.URL.revokeObjectURL = jest.fn()

      await client.download('/download', 'test.txt')

      expect(createElementSpy).toHaveBeenCalledWith('a')
      expect(clickSpy).toHaveBeenCalled()
      expect(window.URL.createObjectURL).toHaveBeenCalled()
      expect(window.URL.revokeObjectURL).toHaveBeenCalled()

      // Restore mocks
      createElementSpy.mockRestore()
      window.URL.createObjectURL = originalCreateObjectURL
      window.URL.revokeObjectURL = originalRevokeObjectURL
    })
  })

  describe('Configuration', () => {
    it('should set base URL', () => {
      const newBaseURL = 'https://api.example.com'
      client.setBaseURL(newBaseURL)
      
      expect(client.getAxiosInstance().defaults.baseURL).toBe(newBaseURL)
    })

    it('should set default headers', () => {
      const headers = {
        'X-Custom-Header': 'value',
        'X-Another-Header': 'another-value',
      }
      client.setDefaultHeaders(headers)

      const instance = client.getAxiosInstance()
      expect(instance.defaults.headers.common['X-Custom-Header']).toBe('value')
      expect(instance.defaults.headers.common['X-Another-Header']).toBe('another-value')
    })
  })
})
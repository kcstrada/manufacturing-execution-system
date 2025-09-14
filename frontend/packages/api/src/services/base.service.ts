import { apiClient, ApiResponse } from '../client/axios.client'
import { PaginatedResponse } from '../types/api.types'
import { AxiosRequestConfig } from 'axios'

export interface QueryParams {
  page?: number
  limit?: number
  sort?: string
  order?: 'asc' | 'desc'
  search?: string
  [key: string]: any
}

export abstract class BaseService<T, CreateDTO = Partial<T>, UpdateDTO = Partial<T>> {
  protected baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  protected buildQueryString(params?: QueryParams): string {
    if (!params) return ''

    const queryParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value))
      }
    })

    const queryString = queryParams.toString()
    return queryString ? `?${queryString}` : ''
  }

  async getAll(params?: QueryParams): Promise<PaginatedResponse<T>> {
    const url = `${this.baseUrl}${this.buildQueryString(params)}`
    const response = await apiClient.get<PaginatedResponse<T>>(url)
    return response.data
  }

  async getById(id: string): Promise<T> {
    const response = await apiClient.get<T>(`${this.baseUrl}/${id}`)
    return response.data
  }

  async create(data: CreateDTO): Promise<T> {
    const response = await apiClient.post<T>(this.baseUrl, data)
    return response.data
  }

  async update(id: string, data: UpdateDTO): Promise<T> {
    const response = await apiClient.patch<T>(`${this.baseUrl}/${id}`, data)
    return response.data
  }

  async delete(id: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/${id}`)
  }

  async bulkCreate(data: CreateDTO[]): Promise<T[]> {
    const response = await apiClient.post<T[]>(`${this.baseUrl}/bulk`, data)
    return response.data
  }

  async bulkUpdate(updates: Array<{ id: string; data: UpdateDTO }>): Promise<T[]> {
    const response = await apiClient.patch<T[]>(`${this.baseUrl}/bulk`, updates)
    return response.data
  }

  async bulkDelete(ids: string[]): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/bulk`, {
      data: { ids },
    } as AxiosRequestConfig)
  }
}
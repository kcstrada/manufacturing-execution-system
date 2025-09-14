import { createApi, fetchBaseQuery, retry } from '@reduxjs/toolkit/query/react'
import type { RootState } from '../store'

const baseQuery = fetchBaseQuery({
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.token

    if (token) {
      headers.set('authorization', `Bearer ${token}`)
    }

    const tenantId = localStorage.getItem('tenantId')
    if (tenantId) {
      headers.set('X-Tenant-Id', tenantId)
    }

    return headers
  },
})

const baseQueryWithRetry = retry(baseQuery, { maxRetries: 3 })

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithRetry,
  tagTypes: [
    'User',
    'Order',
    'Task',
    'Worker',
    'Product',
    'Inventory',
    'Equipment',
    'Quality',
    'Shift',
    'Report',
    'Notification',
  ],
  endpoints: () => ({}),
})

export const enhancedApi = baseApi.enhanceEndpoints({
  addTagTypes: [],
})
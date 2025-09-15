import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import {
  useOrders,
  useOrder,
  useCreateOrder,
  useUpdateOrder,
  orderKeys,
} from './useOrders'

// Mock fetch
global.fetch = jest.fn()

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('useOrders', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should fetch orders successfully', async () => {
    const mockOrders = {
      data: [
        { id: '1', orderNumber: 'ORD-001', customerName: 'Test Customer' },
      ],
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
    }

    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockOrders,
    })

    const { result } = renderHook(() => useOrders(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual(mockOrders)
    expect(fetch).toHaveBeenCalledWith('http://localhost:3000/api/orders?')
  })

  it('should handle query parameters', async () => {
    const mockOrders = { data: [], total: 0, page: 2, limit: 20, totalPages: 0 }

    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockOrders,
    })

    const { result } = renderHook(
      () => useOrders({ page: 2, limit: 20, status: 'pending' }),
      { wrapper: createWrapper() }
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(fetch).toHaveBeenCalledWith('http://localhost:3000/api/orders?page=2&limit=20&status=pending')
  })

  it('should handle fetch error by returning empty data', async () => {
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
    })

    const { result } = renderHook(() => useOrders(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    // Should return empty data instead of throwing error
    expect(result.current.data).toEqual({
      data: [],
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0
    })
    expect(result.current.isError).toBe(false)
  })
})

describe('useOrder', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should fetch a single order', async () => {
    const mockOrder = {
      id: '1',
      orderNumber: 'ORD-001',
      customerName: 'Test Customer',
    }

    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockOrder,
    })

    const { result } = renderHook(() => useOrder('1'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual(mockOrder)
    expect(fetch).toHaveBeenCalledWith('http://localhost:3000/api/orders/1')
  })

  it('should not fetch if id is not provided', () => {
    jest.clearAllMocks() // Extra clear to ensure isolation

    const { result } = renderHook(() => useOrder(''), {
      wrapper: createWrapper(),
    })

    expect(result.current.isLoading).toBe(false)
    expect(result.current.data).toBeUndefined()
    expect(fetch).not.toHaveBeenCalled()
  })
})

describe('useCreateOrder', () => {
  it('should create an order successfully', async () => {
    const newOrder = {
      customerName: 'New Customer',
      items: [],
      totalAmount: 100,
    }

    const createdOrder = {
      id: '2',
      ...newOrder,
      orderNumber: 'ORD-002',
    }

    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => createdOrder,
    })

    const { result } = renderHook(() => useCreateOrder(), {
      wrapper: createWrapper(),
    })

    result.current.mutate(newOrder)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual(createdOrder)
    expect(fetch).toHaveBeenCalledWith('http://localhost:3000/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newOrder),
    })
  })
})

describe('useUpdateOrder', () => {
  it('should update an order optimistically', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })

    const existingOrder = {
      id: '1',
      orderNumber: 'ORD-001',
      status: 'pending',
    }

    queryClient.setQueryData(orderKeys.detail('1'), existingOrder)

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )

    const updatedOrder = { ...existingOrder, status: 'completed' }

    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => updatedOrder,
    })

    const { result } = renderHook(() => useUpdateOrder(), { wrapper })

    result.current.mutate({ id: '1', status: 'completed' })

    // Wait a bit for the optimistic update to apply
    await waitFor(() => {
      const optimisticData = queryClient.getQueryData(orderKeys.detail('1'))
      expect(optimisticData).toEqual({ ...existingOrder, status: 'completed' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(fetch).toHaveBeenCalledWith('http://localhost:3000/api/orders/1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'completed' }),
    })
  })
})

describe('orderKeys', () => {
  it('should generate correct query keys', () => {
    expect(orderKeys.all).toEqual(['orders'])
    expect(orderKeys.lists()).toEqual(['orders', 'list'])
    expect(orderKeys.list({ page: 1, status: 'pending' })).toEqual([
      'orders',
      'list',
      { page: 1, status: 'pending' },
    ])
    expect(orderKeys.details()).toEqual(['orders', 'detail'])
    expect(orderKeys.detail('123')).toEqual(['orders', 'detail', '123'])
  })
})
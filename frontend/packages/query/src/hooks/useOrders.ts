import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryOptions,
  UseMutationOptions,
} from '@tanstack/react-query'

export interface Order {
  id: string
  orderNumber: string
  customerId: string
  customerName: string
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  dueDate: string
  items: OrderItem[]
  totalAmount: number
  createdAt: string
  updatedAt: string
}

export interface OrderItem {
  id: string
  productId: string
  productName: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

export interface OrdersParams {
  page?: number
  limit?: number
  status?: string
  priority?: string
  search?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// Query keys factory
export const orderKeys = {
  all: ['orders'] as const,
  lists: () => [...orderKeys.all, 'list'] as const,
  list: (params?: OrdersParams) => [...orderKeys.lists(), params] as const,
  details: () => [...orderKeys.all, 'detail'] as const,
  detail: (id: string) => [...orderKeys.details(), id] as const,
}

// API base URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'

// Fetch functions
const fetchOrders = async (params?: OrdersParams): Promise<PaginatedResponse<Order>> => {
  const searchParams = new URLSearchParams()
  if (params?.page) searchParams.append('page', params.page.toString())
  if (params?.limit) searchParams.append('limit', params.limit.toString())
  if (params?.status) searchParams.append('status', params.status)
  if (params?.priority) searchParams.append('priority', params.priority)
  if (params?.search) searchParams.append('search', params.search)

  try {
    const response = await fetch(`${API_URL}/orders?${searchParams}`)
    if (!response.ok) {
      // Return empty data for 404 (endpoint not found)
      if (response.status === 404) {
        return {
          data: [],
          total: 0,
          page: params?.page || 1,
          limit: params?.limit || 10,
          totalPages: 0
        }
      }
      throw new Error('Failed to fetch orders')
    }
    return response.json()
  } catch (error) {
    console.warn('Failed to fetch orders, returning empty data:', error)
    return {
      data: [],
      total: 0,
      page: params?.page || 1,
      limit: params?.limit || 10,
      totalPages: 0
    }
  }
}

const fetchOrder = async (id: string): Promise<Order> => {
  const response = await fetch(`${API_URL}/orders/${id}`)
  if (!response.ok) throw new Error('Failed to fetch order')
  return response.json()
}

const createOrder = async (order: Partial<Order>): Promise<Order> => {
  const response = await fetch(`${API_URL}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(order),
  })
  if (!response.ok) throw new Error('Failed to create order')
  return response.json()
}

const updateOrder = async ({ id, ...updates }: Partial<Order> & { id: string }): Promise<Order> => {
  const response = await fetch(`${API_URL}/orders/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  })
  if (!response.ok) throw new Error('Failed to update order')
  return response.json()
}

const deleteOrder = async (id: string): Promise<void> => {
  const response = await fetch(`${API_URL}/orders/${id}`, {
    method: 'DELETE',
  })
  if (!response.ok) throw new Error('Failed to delete order')
}

// Query hooks
export const useOrders = (
  params?: OrdersParams,
  options?: UseQueryOptions<PaginatedResponse<Order>, Error>
) => {
  return useQuery({
    queryKey: orderKeys.list(params),
    queryFn: () => fetchOrders(params),
    ...options,
  })
}

export const useOrder = (
  id: string,
  options?: UseQueryOptions<Order, Error>
) => {
  return useQuery({
    queryKey: orderKeys.detail(id),
    queryFn: () => fetchOrder(id),
    enabled: !!id,
    ...options,
  })
}

// Mutation hooks
export const useCreateOrder = (
  options?: UseMutationOptions<Order, Error, Partial<Order>, unknown>
) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createOrder,
    onSuccess: (data) => {
      // Invalidate and refetch orders list
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() })
      // Add the new order to the cache
      queryClient.setQueryData(orderKeys.detail(data.id), data)
    },
    ...options,
  })
}

export const useUpdateOrder = (
  options?: UseMutationOptions<Order, Error, Partial<Order> & { id: string }, { previousOrder: Order | undefined }>
) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateOrder,
    onMutate: async (updatedOrder) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: orderKeys.detail(updatedOrder.id) })

      // Snapshot the previous value
      const previousOrder = queryClient.getQueryData<Order>(orderKeys.detail(updatedOrder.id))

      // Optimistically update to the new value
      queryClient.setQueryData(orderKeys.detail(updatedOrder.id), (old: Order | undefined) => {
        if (!old) return undefined
        return { ...old, ...updatedOrder }
      })

      // Return a context object with the snapshotted value
      return { previousOrder }
    },
    onError: (err, updatedOrder, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousOrder) {
        queryClient.setQueryData(orderKeys.detail(updatedOrder.id), context.previousOrder)
      }
    },
    onSettled: (data, error, variables) => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() })
    },
    ...options,
  })
}

export const useDeleteOrder = (
  options?: UseMutationOptions<void, Error, string, unknown>
) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteOrder,
    onSuccess: (_, id) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: orderKeys.detail(id) })
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() })
    },
    ...options,
  })
}
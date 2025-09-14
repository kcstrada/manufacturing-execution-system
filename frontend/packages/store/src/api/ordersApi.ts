import { baseApi } from './baseApi'

export interface Order {
  id: string
  orderNumber: string
  customerId: string
  customerName: string
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  dueDate: string
  createdAt: string
  updatedAt: string
  items: OrderItem[]
  totalAmount: number
}

export interface OrderItem {
  id: string
  productId: string
  productName: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

export interface PaginatedOrders {
  data: Order[]
  total: number
  page: number
  limit: number
}

export const ordersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getOrders: builder.query<PaginatedOrders, { page?: number; limit?: number; status?: string }>({
      query: ({ page = 1, limit = 10, status }) => ({
        url: '/orders',
        params: { page, limit, status },
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: 'Order' as const, id })),
              { type: 'Order', id: 'LIST' },
            ]
          : [{ type: 'Order', id: 'LIST' }],
    }),
    getOrder: builder.query<Order, string>({
      query: (id) => `/orders/${id}`,
      providesTags: (result, error, id) => [{ type: 'Order', id }],
    }),
    createOrder: builder.mutation<Order, Partial<Order>>({
      query: (order) => ({
        url: '/orders',
        method: 'POST',
        body: order,
      }),
      invalidatesTags: [{ type: 'Order', id: 'LIST' }],
    }),
    updateOrder: builder.mutation<Order, { id: string; updates: Partial<Order> }>({
      query: ({ id, updates }) => ({
        url: `/orders/${id}`,
        method: 'PATCH',
        body: updates,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Order', id },
        { type: 'Order', id: 'LIST' },
      ],
    }),
    deleteOrder: builder.mutation<void, string>({
      query: (id) => ({
        url: `/orders/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Order', id },
        { type: 'Order', id: 'LIST' },
      ],
    }),
  }),
})

export const {
  useGetOrdersQuery,
  useGetOrderQuery,
  useCreateOrderMutation,
  useUpdateOrderMutation,
  useDeleteOrderMutation,
} = ordersApi
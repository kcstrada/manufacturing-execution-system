import { BaseService } from './base.service'
import { apiClient } from '../client/axios.client'
import { apiEndpoints } from '../config/api.config'
import { Order, OrderStatus } from '../types/api.types'

export interface CreateOrderDTO {
  customerId: string
  customerName: string
  items: Array<{
    productId: string
    quantity: number
    unitPrice: number
    specifications?: Record<string, any>
  }>
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  dueDate: Date
  notes?: string
}

export interface UpdateOrderDTO {
  status?: OrderStatus
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  dueDate?: Date
  notes?: string
}

export class OrderService extends BaseService<Order, CreateOrderDTO, UpdateOrderDTO> {
  constructor() {
    super(apiEndpoints.orders.base)
  }

  async getByStatus(status: OrderStatus): Promise<Order[]> {
    const response = await apiClient.get<Order[]>(apiEndpoints.orders.byStatus(status))
    return response.data
  }

  async updateWorkflow(id: string, action: 'start' | 'complete' | 'cancel' | 'hold'): Promise<Order> {
    const response = await apiClient.post<Order>(apiEndpoints.orders.workflow(id), { action })
    return response.data
  }

  async assignToProduction(id: string, productionLineId: string): Promise<Order> {
    const response = await apiClient.post<Order>(`${this.baseUrl}/${id}/assign`, {
      productionLineId,
    })
    return response.data
  }

  async getPendingOrders(): Promise<Order[]> {
    return this.getByStatus(OrderStatus.PENDING)
  }

  async getInProductionOrders(): Promise<Order[]> {
    return this.getByStatus(OrderStatus.IN_PRODUCTION)
  }

  async getCompletedOrders(dateFrom?: Date, dateTo?: Date): Promise<Order[]> {
    const params: any = { status: OrderStatus.COMPLETED }
    if (dateFrom) params.dateFrom = dateFrom.toISOString()
    if (dateTo) params.dateTo = dateTo.toISOString()

    const response = await apiClient.get<Order[]>(this.baseUrl, { params })
    return response.data
  }

  async getOrderMetrics(orderId: string): Promise<{
    progress: number
    estimatedCompletion: Date
    tasksCompleted: number
    totalTasks: number
  }> {
    const response = await apiClient.get(`${this.baseUrl}/${orderId}/metrics`)
    return response.data
  }

  async duplicateOrder(orderId: string): Promise<Order> {
    const response = await apiClient.post<Order>(`${this.baseUrl}/${orderId}/duplicate`)
    return response.data
  }
}

export const orderService = new OrderService()
import { BaseService } from './base.service'
import { apiClient } from '../client/axios.client'
import { apiEndpoints } from '../config/api.config'
import { Task, TaskStatus } from '../types/api.types'

export interface CreateTaskDTO {
  title: string
  description: string
  orderId?: string
  priority: number
  dueDate: Date
  estimatedHours: number
  skills: string[]
  dependencies?: string[]
}

export interface UpdateTaskDTO {
  title?: string
  description?: string
  status?: TaskStatus
  priority?: number
  dueDate?: Date
  estimatedHours?: number
  actualHours?: number
}

export interface AssignTaskDTO {
  workerId: string
  notes?: string
}

export interface SplitTaskDTO {
  subtasks: Array<{
    title: string
    description: string
    estimatedHours: number
    workerId?: string
  }>
}

export class TaskService extends BaseService<Task, CreateTaskDTO, UpdateTaskDTO> {
  constructor() {
    super(apiEndpoints.tasks.base)
  }

  async assignTask(taskId: string, data: AssignTaskDTO): Promise<Task> {
    const response = await apiClient.post<Task>(apiEndpoints.tasks.assign(taskId), data)
    return response.data
  }

  async unassignTask(taskId: string): Promise<Task> {
    const response = await apiClient.delete<Task>(apiEndpoints.tasks.assign(taskId))
    return response.data
  }

  async splitTask(taskId: string, data: SplitTaskDTO): Promise<Task[]> {
    const response = await apiClient.post<Task[]>(apiEndpoints.tasks.split(taskId), data)
    return response.data
  }

  async updateDependencies(taskId: string, dependencies: string[]): Promise<Task> {
    const response = await apiClient.put<Task>(apiEndpoints.tasks.dependencies(taskId), {
      dependencies,
    })
    return response.data
  }

  async startTask(taskId: string): Promise<Task> {
    const response = await apiClient.post<Task>(`${this.baseUrl}/${taskId}/start`)
    return response.data
  }

  async completeTask(taskId: string, actualHours: number, notes?: string): Promise<Task> {
    const response = await apiClient.post<Task>(`${this.baseUrl}/${taskId}/complete`, {
      actualHours,
      notes,
    })
    return response.data
  }

  async pauseTask(taskId: string, reason: string): Promise<Task> {
    const response = await apiClient.post<Task>(`${this.baseUrl}/${taskId}/pause`, {
      reason,
    })
    return response.data
  }

  async getMyTasks(workerId: string): Promise<Task[]> {
    const response = await apiClient.get<Task[]>(`${this.baseUrl}/my-tasks`, {
      params: { workerId },
    })
    return response.data
  }

  async getAvailableTasks(skills?: string[]): Promise<Task[]> {
    const response = await apiClient.get<Task[]>(`${this.baseUrl}/available`, {
      params: { skills: skills?.join(',') },
    })
    return response.data
  }

  async getTasksByOrder(orderId: string): Promise<Task[]> {
    const response = await apiClient.get<Task[]>(`${this.baseUrl}`, {
      params: { orderId },
    })
    return response.data
  }

  async getOverdueTasks(): Promise<Task[]> {
    const response = await apiClient.get<Task[]>(`${this.baseUrl}/overdue`)
    return response.data
  }

  async getTaskStatistics(taskId: string): Promise<{
    estimatedHours: number
    actualHours: number
    progress: number
    efficiency: number
  }> {
    const response = await apiClient.get(`${this.baseUrl}/${taskId}/statistics`)
    return response.data
  }
}

export const taskService = new TaskService()
import { BaseService } from './base.service'
import { apiClient } from '../client/axios.client'
import { apiEndpoints } from '../config/api.config'
import { Worker, TimeClockEntry, Skill } from '../types/api.types'

export interface CreateWorkerDTO {
  employeeId: string
  firstName: string
  lastName: string
  email: string
  phone: string
  department: string
  position: string
  skills?: Array<{
    name: string
    level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT'
  }>
}

export interface UpdateWorkerDTO {
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  department?: string
  position?: string
  isActive?: boolean
}

export interface ClockInDTO {
  workerId: string
  shiftId?: string
  location?: string
}

export interface ClockOutDTO {
  workerId: string
  breakMinutes?: number
  notes?: string
}

export class WorkerService extends BaseService<Worker, CreateWorkerDTO, UpdateWorkerDTO> {
  constructor() {
    super(apiEndpoints.workers.base)
  }

  async getWorkerSchedule(workerId: string, startDate: Date, endDate: Date): Promise<any[]> {
    const response = await apiClient.get(apiEndpoints.workers.schedule(workerId), {
      params: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
    })
    return response.data
  }

  async updateWorkerSkills(workerId: string, skills: Skill[]): Promise<Worker> {
    const response = await apiClient.put<Worker>(apiEndpoints.workers.skills(workerId), {
      skills,
    })
    return response.data
  }

  async addWorkerSkill(workerId: string, skill: Skill): Promise<Worker> {
    const response = await apiClient.post<Worker>(`${apiEndpoints.workers.skills(workerId)}/add`, skill)
    return response.data
  }

  async removeWorkerSkill(workerId: string, skillId: string): Promise<Worker> {
    const response = await apiClient.delete<Worker>(`${apiEndpoints.workers.skills(workerId)}/${skillId}`)
    return response.data
  }

  async clockIn(data: ClockInDTO): Promise<TimeClockEntry> {
    const response = await apiClient.post<TimeClockEntry>(apiEndpoints.workers.clockIn, data)
    return response.data
  }

  async clockOut(data: ClockOutDTO): Promise<TimeClockEntry> {
    const response = await apiClient.post<TimeClockEntry>(apiEndpoints.workers.clockOut, data)
    return response.data
  }

  async getCurrentShift(workerId: string): Promise<TimeClockEntry | null> {
    const response = await apiClient.get<TimeClockEntry | null>(`${this.baseUrl}/${workerId}/current-shift`)
    return response.data
  }

  async getTimeClockHistory(workerId: string, startDate: Date, endDate: Date): Promise<TimeClockEntry[]> {
    const response = await apiClient.get<TimeClockEntry[]>(`${this.baseUrl}/${workerId}/time-clock`, {
      params: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
    })
    return response.data
  }

  async getWorkerProductivity(workerId: string, period: 'day' | 'week' | 'month'): Promise<{
    productivity: number
    tasksCompleted: number
    hoursWorked: number
    efficiency: number
  }> {
    const response = await apiClient.get(`${this.baseUrl}/${workerId}/productivity`, {
      params: { period },
    })
    return response.data
  }

  async getAvailableWorkers(skills?: string[], shiftId?: string): Promise<Worker[]> {
    const response = await apiClient.get<Worker[]>(`${this.baseUrl}/available`, {
      params: {
        skills: skills?.join(','),
        shiftId,
      },
    })
    return response.data
  }

  async getWorkersByDepartment(department: string): Promise<Worker[]> {
    const response = await apiClient.get<Worker[]>(`${this.baseUrl}`, {
      params: { department },
    })
    return response.data
  }
}

export const workerService = new WorkerService()
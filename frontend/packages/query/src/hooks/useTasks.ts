import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryOptions,
  UseMutationOptions,
} from '@tanstack/react-query'

export interface Task {
  id: string
  title: string
  description?: string
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  assignedTo?: string
  assignedWorker?: Worker
  orderId?: string
  dueDate?: string
  startedAt?: string
  completedAt?: string
  estimatedHours?: number
  actualHours?: number
  createdAt: string
  updatedAt: string
}

export interface Worker {
  id: string
  firstName: string
  lastName: string
  email: string
  role: string
  shiftId?: string
}

export interface TasksParams {
  page?: number
  limit?: number
  status?: string
  assignedTo?: string
  orderId?: string
  priority?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// Query keys factory
export const taskKeys = {
  all: ['tasks'] as const,
  lists: () => [...taskKeys.all, 'list'] as const,
  list: (params?: TasksParams) => [...taskKeys.lists(), params] as const,
  details: () => [...taskKeys.all, 'detail'] as const,
  detail: (id: string) => [...taskKeys.details(), id] as const,
  myTasks: (workerId: string) => [...taskKeys.all, 'my', workerId] as const,
}

// API base URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'

// Fetch functions
const fetchTasks = async (params?: TasksParams): Promise<PaginatedResponse<Task>> => {
  const searchParams = new URLSearchParams()
  if (params?.page) searchParams.append('page', params.page.toString())
  if (params?.limit) searchParams.append('limit', params.limit.toString())
  if (params?.status) searchParams.append('status', params.status)
  if (params?.assignedTo) searchParams.append('assignedTo', params.assignedTo)
  if (params?.orderId) searchParams.append('orderId', params.orderId)
  if (params?.priority) searchParams.append('priority', params.priority)

  try {
    const response = await fetch(`${API_URL}/tasks?${searchParams}`)
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
      throw new Error('Failed to fetch tasks')
    }
    return response.json()
  } catch (error) {
    console.warn('Failed to fetch tasks, returning empty data:', error)
    return {
      data: [],
      total: 0,
      page: params?.page || 1,
      limit: params?.limit || 10,
      totalPages: 0
    }
  }
}

const fetchTask = async (id: string): Promise<Task> => {
  const response = await fetch(`${API_URL}/tasks/${id}`)
  if (!response.ok) throw new Error('Failed to fetch task')
  return response.json()
}

const fetchMyTasks = async (workerId: string): Promise<Task[]> => {
  try {
    const response = await fetch(`${API_URL}/workers/${workerId}/tasks`)
    if (!response.ok) {
      if (response.status === 404) return []
      throw new Error('Failed to fetch my tasks')
    }
    return response.json()
  } catch (error) {
    console.warn('Failed to fetch my tasks, returning empty data:', error)
    return []
  }
}

const createTask = async (task: Partial<Task>): Promise<Task> => {
  const response = await fetch(`${API_URL}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(task),
  })
  if (!response.ok) throw new Error('Failed to create task')
  return response.json()
}

const updateTask = async ({ id, ...updates }: Partial<Task> & { id: string }): Promise<Task> => {
  const response = await fetch(`${API_URL}/tasks/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  })
  if (!response.ok) throw new Error('Failed to update task')
  return response.json()
}

const startTask = async (id: string): Promise<Task> => {
  const response = await fetch(`${API_URL}/tasks/${id}/start`, {
    method: 'POST',
  })
  if (!response.ok) throw new Error('Failed to start task')
  return response.json()
}

const completeTask = async ({
  id,
  actualHours,
  notes,
}: {
  id: string
  actualHours?: number
  notes?: string
}): Promise<Task> => {
  const response = await fetch(`${API_URL}/tasks/${id}/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ actualHours, notes }),
  })
  if (!response.ok) throw new Error('Failed to complete task')
  return response.json()
}

// Query hooks
export const useTasks = (
  params?: TasksParams,
  options?: UseQueryOptions<PaginatedResponse<Task>, Error>
) => {
  return useQuery({
    queryKey: taskKeys.list(params),
    queryFn: () => fetchTasks(params),
    ...options,
  })
}

export const useTask = (
  id: string,
  options?: UseQueryOptions<Task, Error>
) => {
  return useQuery({
    queryKey: taskKeys.detail(id),
    queryFn: () => fetchTask(id),
    enabled: !!id,
    ...options,
  })
}

export const useMyTasks = (
  workerId: string,
  options?: UseQueryOptions<Task[], Error>
) => {
  return useQuery({
    queryKey: taskKeys.myTasks(workerId),
    queryFn: () => fetchMyTasks(workerId),
    enabled: !!workerId,
    ...options,
  })
}

// Mutation hooks
export const useCreateTask = (
  options?: UseMutationOptions<Task, Error, Partial<Task>>
) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createTask,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() })
      queryClient.setQueryData(taskKeys.detail(data.id), data)
    },
    ...options,
  })
}

export const useUpdateTask = (
  options?: UseMutationOptions<Task, Error, Partial<Task> & { id: string }>
) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateTask,
    onMutate: async (updatedTask) => {
      await queryClient.cancelQueries({ queryKey: taskKeys.detail(updatedTask.id) })
      const previousTask = queryClient.getQueryData(taskKeys.detail(updatedTask.id))

      queryClient.setQueryData(taskKeys.detail(updatedTask.id), (old: Task | undefined) => {
        if (!old) return undefined
        return { ...old, ...updatedTask }
      })

      return { previousTask }
    },
    onError: (err, updatedTask, context) => {
      if (context?.previousTask) {
        queryClient.setQueryData(taskKeys.detail(updatedTask.id), context.previousTask)
      }
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() })
      if (variables.assignedTo) {
        queryClient.invalidateQueries({ queryKey: taskKeys.myTasks(variables.assignedTo) })
      }
    },
    ...options,
  })
}

export const useStartTask = (
  options?: UseMutationOptions<Task, Error, string>
) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: startTask,
    onSuccess: (data) => {
      queryClient.setQueryData(taskKeys.detail(data.id), data)
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() })
      if (data.assignedTo) {
        queryClient.invalidateQueries({ queryKey: taskKeys.myTasks(data.assignedTo) })
      }
    },
    ...options,
  })
}

export const useCompleteTask = (
  options?: UseMutationOptions<Task, Error, {
    id: string
    actualHours?: number
    notes?: string
  }>
) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: completeTask,
    onSuccess: (data) => {
      queryClient.setQueryData(taskKeys.detail(data.id), data)
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() })
      if (data.assignedTo) {
        queryClient.invalidateQueries({ queryKey: taskKeys.myTasks(data.assignedTo) })
      }
    },
    ...options,
  })
}
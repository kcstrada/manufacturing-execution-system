'use client'

import { useQuery } from '@tanstack/react-query'
import { Card, Badge } from '@mes/ui'

interface WorkerStats {
  id: string
  name: string
  role: string
  shift: string
  tasksCompleted: number
  efficiency: number
  hoursWorked: number
  status: 'active' | 'break' | 'offline'
}

interface ProductivityData {
  topPerformers: WorkerStats[]
  shiftSummary: {
    shift: string
    totalWorkers: number
    activeWorkers: number
    averageEfficiency: number
    totalTasksCompleted: number
  }
}

async function fetchProductivityData(): Promise<ProductivityData> {
  // Mock data - replace with actual API call
  return {
    topPerformers: [
      {
        id: '1',
        name: 'John Smith',
        role: 'Assembly',
        shift: 'Morning',
        tasksCompleted: 45,
        efficiency: 98,
        hoursWorked: 6.5,
        status: 'active',
      },
      {
        id: '2',
        name: 'Maria Garcia',
        role: 'Quality Control',
        shift: 'Morning',
        tasksCompleted: 38,
        efficiency: 95,
        hoursWorked: 6.5,
        status: 'active',
      },
      {
        id: '3',
        name: 'David Chen',
        role: 'Packaging',
        shift: 'Morning',
        tasksCompleted: 42,
        efficiency: 94,
        hoursWorked: 6.5,
        status: 'break',
      },
      {
        id: '4',
        name: 'Sarah Johnson',
        role: 'Assembly',
        shift: 'Morning',
        tasksCompleted: 40,
        efficiency: 92,
        hoursWorked: 6.5,
        status: 'active',
      },
      {
        id: '5',
        name: 'Michael Brown',
        role: 'Maintenance',
        shift: 'Morning',
        tasksCompleted: 12,
        efficiency: 90,
        hoursWorked: 6.5,
        status: 'active',
      },
    ],
    shiftSummary: {
      shift: 'Morning Shift',
      totalWorkers: 42,
      activeWorkers: 38,
      averageEfficiency: 88.5,
      totalTasksCompleted: 523,
    },
  }
}

export function WorkerProductivity() {
  const { data, isLoading } = useQuery({
    queryKey: ['worker-productivity'],
    queryFn: fetchProductivityData,
    refetchInterval: 60000, // Refresh every minute
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success'
      case 'break':
        return 'warning'
      case 'offline':
        return 'default'
      default:
        return 'default'
    }
  }

  const getEfficiencyColor = (efficiency: number) => {
    if (efficiency >= 95) return 'text-green-600'
    if (efficiency >= 85) return 'text-blue-600'
    if (efficiency >= 75) return 'text-yellow-600'
    return 'text-red-600'
  }

  if (isLoading) {
    return (
      <Card>
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-100 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card>
      <div className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Worker Productivity</h2>

        {/* Shift Summary */}
        <div className="mb-6 p-4 bg-green-50 rounded-lg">
          <h3 className="text-sm font-medium text-green-900 mb-3">
            {data?.shiftSummary.shift}
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-green-700">Active Workers:</span>
              <span className="ml-2 font-semibold text-green-900">
                {data?.shiftSummary.activeWorkers} / {data?.shiftSummary.totalWorkers}
              </span>
            </div>
            <div>
              <span className="text-green-700">Avg Efficiency:</span>
              <span className="ml-2 font-semibold text-green-900">
                {data?.shiftSummary.averageEfficiency}%
              </span>
            </div>
            <div className="col-span-2">
              <span className="text-green-700">Total Tasks Completed:</span>
              <span className="ml-2 font-semibold text-green-900">
                {data?.shiftSummary.totalTasksCompleted}
              </span>
            </div>
          </div>
        </div>

        {/* Top Performers */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">Top Performers</h3>
          <div className="space-y-3">
            {data?.topPerformers.map((worker, index) => (
              <div key={worker.id} className="flex items-center justify-between p-3 bg-gray-50 rounded hover:bg-gray-100 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-blue-600">
                      {index + 1}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-900">
                        {worker.name}
                      </span>
                      <Badge variant={getStatusColor(worker.status)} size="sm">
                        {worker.status}
                      </Badge>
                    </div>
                    <span className="text-xs text-gray-500">{worker.role}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-lg font-semibold ${getEfficiencyColor(worker.efficiency)}`}>
                    {worker.efficiency}%
                  </div>
                  <div className="text-xs text-gray-500">
                    {worker.tasksCompleted} tasks
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  )
}
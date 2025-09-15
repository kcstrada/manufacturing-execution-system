'use client'

import { useQuery } from '@tanstack/react-query'
import { Card } from '@mes/ui'

interface Activity {
  id: string
  type: 'order' | 'task' | 'alert' | 'system'
  title: string
  description: string
  timestamp: string
  user?: string
  severity?: 'info' | 'warning' | 'error' | 'success'
}

async function fetchRecentActivities(): Promise<Activity[]> {
  // Mock data - replace with actual API call
  return [
    {
      id: '1',
      type: 'order',
      title: 'New Order Created',
      description: 'Order #ORD-2024-156 received from ACME Corp',
      timestamp: '2024-01-20T10:30:00',
      user: 'John Smith',
      severity: 'info',
    },
    {
      id: '2',
      type: 'alert',
      title: 'Low Inventory Alert',
      description: 'Circuit Boards stock below minimum threshold',
      timestamp: '2024-01-20T10:25:00',
      severity: 'warning',
    },
    {
      id: '3',
      type: 'task',
      title: 'Task Completed',
      description: 'Assembly task #TSK-456 completed ahead of schedule',
      timestamp: '2024-01-20T10:20:00',
      user: 'Maria Garcia',
      severity: 'success',
    },
    {
      id: '4',
      type: 'system',
      title: 'Equipment Maintenance',
      description: 'Packaging Unit scheduled for maintenance',
      timestamp: '2024-01-20T10:15:00',
      severity: 'warning',
    },
    {
      id: '5',
      type: 'order',
      title: 'Order Shipped',
      description: 'Order #ORD-2024-155 shipped to customer',
      timestamp: '2024-01-20T10:10:00',
      user: 'David Chen',
      severity: 'success',
    },
    {
      id: '6',
      type: 'alert',
      title: 'Production Target Met',
      description: 'Morning shift exceeded production target by 5%',
      timestamp: '2024-01-20T10:05:00',
      severity: 'success',
    },
  ]
}

export function RecentActivities() {
  const { data, isLoading } = useQuery({
    queryKey: ['recent-activities'],
    queryFn: fetchRecentActivities,
    refetchInterval: 60000, // Refresh every minute
  })

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'order':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
        )
      case 'task':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        )
      case 'alert':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        )
      case 'system':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        )
      default:
        return null
    }
  }

  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case 'success':
        return 'text-green-600 bg-green-50'
      case 'warning':
        return 'text-yellow-600 bg-yellow-50'
      case 'error':
        return 'text-red-600 bg-red-50'
      default:
        return 'text-blue-600 bg-blue-50'
    }
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`

    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`

    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  if (isLoading) {
    return (
      <Card>
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              {[...Array(6)].map((_, i) => (
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
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activities</h2>

        <div className="space-y-4">
          {data?.map((activity) => (
            <div key={activity.id} className="flex space-x-3">
              <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${getSeverityColor(activity.severity)}`}>
                {getActivityIcon(activity.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900">
                    {activity.title}
                  </p>
                  <span className="text-xs text-gray-500">
                    {formatTime(activity.timestamp)}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {activity.description}
                </p>
                {activity.user && (
                  <p className="text-xs text-gray-500 mt-1">
                    by {activity.user}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {data?.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No recent activities
          </div>
        )}
      </div>
    </Card>
  )
}
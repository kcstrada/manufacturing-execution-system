'use client'

import { useQuery } from '@tanstack/react-query'
import { Card } from '@mes/ui'

interface ProductionData {
  currentShift: {
    name: string
    efficiency: number
    unitsProduced: number
    targetUnits: number
    defectRate: number
  }
  equipment: {
    name: string
    status: 'operational' | 'maintenance' | 'idle' | 'error'
    efficiency: number
  }[]
  lines: {
    id: string
    name: string
    status: 'running' | 'stopped' | 'maintenance'
    output: number
    target: number
  }[]
}

async function fetchProductionData(): Promise<ProductionData> {
  // Mock data - replace with actual API call
  return {
    currentShift: {
      name: 'Morning Shift',
      efficiency: 92.5,
      unitsProduced: 1245,
      targetUnits: 1350,
      defectRate: 0.8,
    },
    equipment: [
      { name: 'Assembly Line 1', status: 'operational', efficiency: 95 },
      { name: 'Assembly Line 2', status: 'operational', efficiency: 89 },
      { name: 'Packaging Unit', status: 'maintenance', efficiency: 0 },
      { name: 'Quality Station', status: 'operational', efficiency: 98 },
    ],
    lines: [
      { id: '1', name: 'Line A', status: 'running', output: 450, target: 500 },
      { id: '2', name: 'Line B', status: 'running', output: 380, target: 400 },
      { id: '3', name: 'Line C', status: 'stopped', output: 0, target: 450 },
    ],
  }
}

export function ProductionMetrics() {
  const { data, isLoading } = useQuery({
    queryKey: ['production-metrics'],
    queryFn: fetchProductionData,
    refetchInterval: 60000, // Refresh every minute
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational':
      case 'running':
        return 'text-green-600 bg-green-100'
      case 'maintenance':
        return 'text-yellow-600 bg-yellow-100'
      case 'idle':
      case 'stopped':
        return 'text-gray-600 bg-gray-100'
      case 'error':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  if (isLoading) {
    return (
      <Card>
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-100 rounded"></div>
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
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Production Metrics</h2>

        {/* Current Shift Summary */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-blue-900">{data?.currentShift.name}</h3>
            <span className="text-2xl font-bold text-blue-900">
              {data?.currentShift.efficiency}%
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-blue-700">Units Produced:</span>
              <span className="ml-2 font-semibold text-blue-900">
                {data?.currentShift.unitsProduced} / {data?.currentShift.targetUnits}
              </span>
            </div>
            <div>
              <span className="text-blue-700">Defect Rate:</span>
              <span className="ml-2 font-semibold text-blue-900">
                {data?.currentShift.defectRate}%
              </span>
            </div>
          </div>
          <div className="mt-3">
            <div className="w-full bg-blue-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                style={{
                  width: `${(data?.currentShift.unitsProduced! / data?.currentShift.targetUnits!) * 100}%`
                }}
              />
            </div>
          </div>
        </div>

        {/* Production Lines */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Production Lines</h3>
          <div className="space-y-2">
            {data?.lines.map((line) => (
              <div key={line.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-medium text-gray-900">{line.name}</span>
                  <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(line.status)}`}>
                    {line.status}
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  {line.output} / {line.target} units
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Equipment Status */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">Equipment Status</h3>
          <div className="grid grid-cols-2 gap-2">
            {data?.equipment.map((eq) => (
              <div key={eq.name} className="p-2 bg-gray-50 rounded">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">{eq.name}</span>
                  <span className={`px-1.5 py-0.5 text-xs font-medium rounded ${getStatusColor(eq.status)}`}>
                    {eq.status}
                  </span>
                </div>
                {eq.status === 'operational' && (
                  <div className="mt-1">
                    <div className="w-full bg-gray-200 rounded-full h-1">
                      <div
                        className="bg-green-500 h-1 rounded-full"
                        style={{ width: `${eq.efficiency}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  )
}
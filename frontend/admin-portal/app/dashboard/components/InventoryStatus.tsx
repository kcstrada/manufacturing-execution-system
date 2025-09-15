'use client'

import { useQuery } from '@tanstack/react-query'
import { Card } from '@mes/ui'

interface InventoryItem {
  id: string
  name: string
  category: string
  currentStock: number
  minStock: number
  maxStock: number
  unit: string
  status: 'sufficient' | 'low' | 'critical' | 'overstocked'
  lastRestocked: string
}

interface InventoryData {
  items: InventoryItem[]
  summary: {
    totalItems: number
    lowStockItems: number
    criticalItems: number
    overstockedItems: number
    totalValue: number
  }
}

async function fetchInventoryData(): Promise<InventoryData> {
  // Mock data - replace with actual API call
  return {
    items: [
      {
        id: '1',
        name: 'Steel Sheets',
        category: 'Raw Materials',
        currentStock: 250,
        minStock: 100,
        maxStock: 500,
        unit: 'units',
        status: 'sufficient',
        lastRestocked: '2024-01-15',
      },
      {
        id: '2',
        name: 'Circuit Boards',
        category: 'Components',
        currentStock: 45,
        minStock: 50,
        maxStock: 200,
        unit: 'pieces',
        status: 'low',
        lastRestocked: '2024-01-10',
      },
      {
        id: '3',
        name: 'Screws M4',
        category: 'Fasteners',
        currentStock: 1200,
        minStock: 500,
        maxStock: 2000,
        unit: 'pieces',
        status: 'sufficient',
        lastRestocked: '2024-01-12',
      },
      {
        id: '4',
        name: 'Packaging Boxes',
        category: 'Packaging',
        currentStock: 15,
        minStock: 100,
        maxStock: 300,
        unit: 'units',
        status: 'critical',
        lastRestocked: '2024-01-08',
      },
      {
        id: '5',
        name: 'Labels',
        category: 'Packaging',
        currentStock: 5500,
        minStock: 1000,
        maxStock: 5000,
        unit: 'pieces',
        status: 'overstocked',
        lastRestocked: '2024-01-14',
      },
    ],
    summary: {
      totalItems: 156,
      lowStockItems: 12,
      criticalItems: 3,
      overstockedItems: 8,
      totalValue: 485000,
    },
  }
}

export function InventoryStatus() {
  const { data, isLoading } = useQuery({
    queryKey: ['inventory-status'],
    queryFn: fetchInventoryData,
    refetchInterval: 300000, // Refresh every 5 minutes
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sufficient':
        return 'text-green-700 bg-green-100'
      case 'low':
        return 'text-yellow-700 bg-yellow-100'
      case 'critical':
        return 'text-red-700 bg-red-100'
      case 'overstocked':
        return 'text-blue-700 bg-blue-100'
      default:
        return 'text-gray-700 bg-gray-100'
    }
  }

  const getStockPercentage = (current: number, max: number) => {
    return Math.min((current / max) * 100, 100)
  }

  const getStockBarColor = (status: string) => {
    switch (status) {
      case 'sufficient':
        return 'bg-green-500'
      case 'low':
        return 'bg-yellow-500'
      case 'critical':
        return 'bg-red-500'
      case 'overstocked':
        return 'bg-blue-500'
      default:
        return 'bg-gray-500'
    }
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
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Inventory Status</h2>

        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-2 mb-6">
          <div className="text-center p-2 bg-gray-50 rounded">
            <div className="text-2xl font-bold text-gray-900">{data?.summary.totalItems}</div>
            <div className="text-xs text-gray-500">Total Items</div>
          </div>
          <div className="text-center p-2 bg-yellow-50 rounded">
            <div className="text-2xl font-bold text-yellow-700">{data?.summary.lowStockItems}</div>
            <div className="text-xs text-yellow-600">Low Stock</div>
          </div>
          <div className="text-center p-2 bg-red-50 rounded">
            <div className="text-2xl font-bold text-red-700">{data?.summary.criticalItems}</div>
            <div className="text-xs text-red-600">Critical</div>
          </div>
          <div className="text-center p-2 bg-blue-50 rounded">
            <div className="text-2xl font-bold text-blue-700">{data?.summary.overstockedItems}</div>
            <div className="text-xs text-blue-600">Overstocked</div>
          </div>
        </div>

        {/* Inventory Items */}
        <div className="space-y-3">
          {data?.items.map((item) => (
            <div key={item.id} className="border border-gray-200 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-900">{item.name}</span>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded ${getStatusColor(item.status)}`}>
                      {item.status}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">{item.category}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-gray-900">
                    {item.currentStock} {item.unit}
                  </div>
                  <div className="text-xs text-gray-500">
                    Min: {item.minStock} | Max: {item.maxStock}
                  </div>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${getStockBarColor(item.status)}`}
                  style={{ width: `${getStockPercentage(item.currentStock, item.maxStock)}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* View All Link */}
        <div className="mt-4 text-center">
          <a href="/inventory" className="text-sm text-blue-600 hover:text-blue-800 font-medium">
            View All Inventory →
          </a>
        </div>
      </div>
    </Card>
  )
}
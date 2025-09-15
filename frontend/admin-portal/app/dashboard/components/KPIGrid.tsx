'use client'

import { useQuery } from '@tanstack/react-query'
import { KPICard } from './KPICard'

interface DashboardKPIs {
  totalOrders: number
  ordersChange: number
  totalRevenue: number
  revenueChange: number
  productionEfficiency: number
  efficiencyChange: number
  activeWorkers: number
  workersChange: number
}

async function fetchDashboardKPIs(): Promise<DashboardKPIs> {
  // This will be replaced with actual API call
  return {
    totalOrders: 156,
    ordersChange: 12.5,
    totalRevenue: 485000,
    revenueChange: 8.3,
    productionEfficiency: 94.2,
    efficiencyChange: 2.1,
    activeWorkers: 42,
    workersChange: -5.2,
  }
}

export function KPIGrid() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-kpis'],
    queryFn: fetchDashboardKPIs,
    refetchInterval: 30000, // Refresh every 30 seconds
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      <KPICard
        title="Total Orders"
        value={data?.totalOrders || 0}
        change={data?.ordersChange}
        changeType={data?.ordersChange && data.ordersChange > 0 ? 'increase' : 'decrease'}
        subtitle="This month"
        loading={isLoading}
        icon={
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
        }
      />

      <KPICard
        title="Total Revenue"
        value={formatCurrency(data?.totalRevenue || 0)}
        change={data?.revenueChange}
        changeType={data?.revenueChange && data.revenueChange > 0 ? 'increase' : 'decrease'}
        subtitle="This month"
        loading={isLoading}
        icon={
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        }
      />

      <KPICard
        title="Production Efficiency"
        value={`${data?.productionEfficiency || 0}%`}
        change={data?.efficiencyChange}
        changeType={data?.efficiencyChange && data.efficiencyChange > 0 ? 'increase' : 'decrease'}
        subtitle="Current shift"
        loading={isLoading}
        icon={
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        }
      />

      <KPICard
        title="Active Workers"
        value={data?.activeWorkers || 0}
        change={data?.workersChange}
        changeType={data?.workersChange && data.workersChange > 0 ? 'increase' : 'decrease'}
        subtitle="On duty now"
        loading={isLoading}
        icon={
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
        }
      />
    </div>
  )
}
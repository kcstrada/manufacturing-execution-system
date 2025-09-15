'use client'

import {
  TrendingUp,
  TrendingDown,
  Package,
  Users,
  Factory,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  MoreVertical,
  Calendar,
  Filter,
  Download
} from 'lucide-react'
import { ProductionChart } from '@/components/charts/ProductionChart'
import { QualityChart } from '@/components/charts/QualityChart'

export default function DashboardPage() {
  // Mock data for KPIs
  const kpis = [
    {
      title: 'Total Revenue',
      value: '$485,920',
      change: 12.5,
      trend: 'up',
      icon: TrendingUp,
      color: 'blue',
      subtitle: 'vs last month'
    },
    {
      title: 'Active Orders',
      value: '156',
      change: 8.3,
      trend: 'up',
      icon: Package,
      color: 'green',
      subtitle: 'in production'
    },
    {
      title: 'Production Rate',
      value: '94.2%',
      change: -2.1,
      trend: 'down',
      icon: Factory,
      color: 'orange',
      subtitle: 'efficiency'
    },
    {
      title: 'Active Workers',
      value: '42',
      change: 5.7,
      trend: 'up',
      icon: Users,
      color: 'purple',
      subtitle: 'on shift'
    }
  ]

  // Mock data for recent activities
  const activities = [
    { id: 1, type: 'order', action: 'New order #1234 received', time: '5 minutes ago', status: 'new' },
    { id: 2, type: 'production', action: 'Batch #789 completed', time: '15 minutes ago', status: 'completed' },
    { id: 3, type: 'alert', action: 'Low inventory for SKU-456', time: '1 hour ago', status: 'warning' },
    { id: 4, type: 'worker', action: 'John Smith checked in', time: '2 hours ago', status: 'info' },
    { id: 5, type: 'quality', action: 'Quality check passed for Batch #788', time: '3 hours ago', status: 'success' }
  ]

  // Mock data for production lines
  const productionLines = [
    { id: 1, name: 'Line Alpha', status: 'running', efficiency: 95, output: 1250 },
    { id: 2, name: 'Line Beta', status: 'maintenance', efficiency: 0, output: 0 },
    { id: 3, name: 'Line Gamma', status: 'running', efficiency: 88, output: 980 },
    { id: 4, name: 'Line Delta', status: 'idle', efficiency: 0, output: 0 }
  ]

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'running': return 'bg-green-500'
      case 'maintenance': return 'bg-yellow-500'
      case 'idle': return 'bg-gray-400'
      default: return 'bg-gray-400'
    }
  }

  const getActivityIcon = (type: string) => {
    switch(type) {
      case 'order': return <Package className="w-4 h-4" />
      case 'production': return <Factory className="w-4 h-4" />
      case 'alert': return <AlertTriangle className="w-4 h-4" />
      case 'worker': return <Users className="w-4 h-4" />
      case 'quality': return <CheckCircle className="w-4 h-4" />
      default: return <Activity className="w-4 h-4" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header with Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-unimore-navy font-century">
            Operations Dashboard
          </h1>
          <p className="text-unimore-navy/60 mt-1 text-sm">
            Real-time overview of your manufacturing operations
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 text-sm font-medium text-unimore-navy/70 bg-white border border-unimore-blue/20 rounded-lg hover:bg-unimore-blue/5 transition-colors flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>Today</span>
          </button>
          <button className="px-4 py-2 text-sm font-medium text-unimore-navy/70 bg-white border border-unimore-blue/20 rounded-lg hover:bg-unimore-blue/5 transition-colors flex items-center gap-2">
            <Filter className="w-4 h-4" />
            <span>Filter</span>
          </button>
          <button className="px-4 py-2 text-sm font-medium text-white bg-gradient-unimore rounded-lg hover:shadow-lg transition-all flex items-center gap-2">
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((kpi, index) => (
          <div
            key={index}
            className="bg-white rounded-xl border border-unimore-blue/10 p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`p-2.5 rounded-xl bg-gradient-to-br ${
                kpi.color === 'blue' ? 'from-unimore-blue/20 to-unimore-blue/10' :
                kpi.color === 'green' ? 'from-green-500/20 to-green-500/10' :
                kpi.color === 'orange' ? 'from-orange-500/20 to-orange-500/10' :
                'from-purple-500/20 to-purple-500/10'
              }`}>
                <kpi.icon className={`w-5 h-5 ${
                  kpi.color === 'blue' ? 'text-unimore-blue' :
                  kpi.color === 'green' ? 'text-green-600' :
                  kpi.color === 'orange' ? 'text-orange-600' :
                  'text-purple-600'
                }`} />
              </div>
              <button className="p-1 hover:bg-unimore-blue/5 rounded-lg transition-colors">
                <MoreVertical className="w-4 h-4 text-unimore-navy/40" />
              </button>
            </div>

            <div>
              <p className="text-xs font-medium text-unimore-navy/60 uppercase tracking-wider">
                {kpi.title}
              </p>
              <p className="text-2xl font-bold text-unimore-navy mt-1 font-century">
                {kpi.value}
              </p>
              <div className="flex items-center gap-2 mt-3">
                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                  kpi.trend === 'up'
                    ? 'bg-green-50 text-green-700'
                    : 'bg-red-50 text-red-700'
                }`}>
                  {kpi.trend === 'up' ? (
                    <ArrowUpRight className="w-3 h-3" />
                  ) : (
                    <ArrowDownRight className="w-3 h-3" />
                  )}
                  {Math.abs(kpi.change)}%
                </div>
                <span className="text-xs text-unimore-navy/50">
                  {kpi.subtitle}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Production Lines Status - Takes 2 columns */}
        <div className="xl:col-span-2 bg-white rounded-xl border border-unimore-blue/10 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-unimore-navy">Production Lines</h2>
            <span className="text-xs font-medium text-unimore-navy/60 uppercase tracking-wider">
              Live Status
            </span>
          </div>

          <div className="space-y-4">
            {productionLines.map((line) => (
              <div key={line.id} className="flex items-center justify-between p-4 bg-unimore-blue/5 rounded-lg hover:bg-unimore-blue/10 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(line.status)} ${
                    line.status === 'running' ? 'animate-pulse' : ''
                  }`} />
                  <div>
                    <p className="font-medium text-unimore-navy">{line.name}</p>
                    <p className="text-sm text-unimore-navy/60 capitalize">{line.status}</p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-sm font-medium text-unimore-navy">{line.efficiency}%</p>
                    <p className="text-xs text-unimore-navy/60">Efficiency</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-unimore-navy">{line.output}</p>
                    <p className="text-xs text-unimore-navy/60">Units/hr</p>
                  </div>
                  <div className="w-24">
                    <div className="h-2 bg-unimore-blue/10 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${
                          line.status === 'running' ? 'bg-gradient-to-r from-unimore-blue to-unimore-blue-light' :
                          line.status === 'maintenance' ? 'bg-yellow-500' :
                          'bg-gray-400'
                        }`}
                        style={{ width: `${line.efficiency}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-unimore-blue/10">
            <div className="text-center">
              <p className="text-2xl font-bold text-unimore-navy font-century">2,230</p>
              <p className="text-xs text-unimore-navy/60 mt-1">Total Output</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600 font-century">75%</p>
              <p className="text-xs text-unimore-navy/60 mt-1">Active Lines</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-unimore-blue font-century">91.3%</p>
              <p className="text-xs text-unimore-navy/60 mt-1">Avg Efficiency</p>
            </div>
          </div>
        </div>

        {/* Recent Activities - Takes 1 column */}
        <div className="bg-white rounded-xl border border-unimore-blue/10 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-unimore-navy">Recent Activity</h2>
            <button className="text-sm text-unimore-blue hover:text-unimore-blue-dark font-medium">
              View All
            </button>
          </div>

          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 group cursor-pointer hover:bg-unimore-blue/5 -mx-2 px-2 py-2 rounded-lg transition-colors">
                <div className={`p-2 rounded-lg ${
                  activity.status === 'new' ? 'bg-blue-50 text-blue-600' :
                  activity.status === 'completed' ? 'bg-green-50 text-green-600' :
                  activity.status === 'warning' ? 'bg-yellow-50 text-yellow-600' :
                  activity.status === 'success' ? 'bg-green-50 text-green-600' :
                  'bg-gray-50 text-gray-600'
                }`}>
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-unimore-navy group-hover:text-unimore-blue transition-colors">
                    {activity.action}
                  </p>
                  <p className="text-xs text-unimore-navy/50 mt-1">
                    {activity.time}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <button className="w-full mt-4 py-2 text-sm font-medium text-unimore-blue hover:text-unimore-blue-dark hover:bg-unimore-blue/5 rounded-lg transition-colors">
            Load More Activities
          </button>
        </div>
      </div>

      {/* Bottom Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Production Trend Chart */}
        <div className="bg-white rounded-xl border border-unimore-blue/10 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-unimore-navy">Production Trend</h2>
            <select className="text-sm text-unimore-navy/70 bg-unimore-blue/5 border-0 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-unimore-blue">
              <option>Last 7 days</option>
              <option>Last 30 days</option>
              <option>Last 3 months</option>
            </select>
          </div>

          {/* Production Chart */}
          <div className="h-64">
            <ProductionChart />
          </div>
        </div>

        {/* Quality Metrics */}
        <div className="bg-white rounded-xl border border-unimore-blue/10 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-unimore-navy">Quality Metrics</h2>
            <span className="px-3 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-full">
              98.5% Pass Rate
            </span>
          </div>

          {/* Quality Chart */}
          <div className="h-64 mb-4">
            <QualityChart />
          </div>

          {/* Metrics Summary */}
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 bg-unimore-blue/5 rounded-lg">
              <p className="text-xl font-bold text-unimore-navy font-century">2,220</p>
              <p className="text-xs text-unimore-navy/60 mt-1">Total Inspected</p>
            </div>
            <div className="text-center p-3 bg-unimore-blue/5 rounded-lg">
              <p className="text-xl font-bold text-green-600 font-century">4.8/5</p>
              <p className="text-xs text-unimore-navy/60 mt-1">Quality Score</p>
            </div>
            <div className="text-center p-3 bg-unimore-blue/5 rounded-lg">
              <p className="text-xl font-bold text-unimore-blue font-century">12</p>
              <p className="text-xs text-unimore-navy/60 mt-1">Pending Review</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
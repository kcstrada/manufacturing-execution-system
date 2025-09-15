'use client'

import { ReactNode } from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface KPICardProps {
  title: string
  value: string | number
  change?: number
  changeType?: 'increase' | 'decrease' | 'neutral'
  icon?: ReactNode
  subtitle?: string
  loading?: boolean
  accentColor?: 'blue' | 'navy' | 'green' | 'orange'
}

export function KPICard({
  title,
  value,
  change,
  changeType = 'neutral',
  icon,
  subtitle,
  loading = false,
  accentColor = 'blue',
}: KPICardProps) {
  const getChangeColor = () => {
    switch (changeType) {
      case 'increase':
        return 'text-green-600 bg-green-50'
      case 'decrease':
        return 'text-red-600 bg-red-50'
      default:
        return 'text-unimore-navy/60 bg-unimore-blue/5'
    }
  }

  const getAccentGradient = () => {
    switch (accentColor) {
      case 'navy':
        return 'from-unimore-navy to-unimore-navy-light'
      case 'green':
        return 'from-green-500 to-green-600'
      case 'orange':
        return 'from-orange-500 to-orange-600'
      default:
        return 'from-unimore-blue to-unimore-blue-light'
    }
  }

  if (loading) {
    return (
      <div className="card-unimore animate-pulse">
        <div className="p-6">
          <div className="h-4 bg-unimore-blue/10 rounded w-1/2 mb-4"></div>
          <div className="h-8 bg-unimore-blue/10 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-unimore-blue/10 rounded w-1/3"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="group card-unimore hover-lift overflow-hidden relative">
      {/* Gradient accent bar */}
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${getAccentGradient()}`} />

      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {/* Title */}
            <p className="text-xs font-semibold text-unimore-navy/60 uppercase tracking-wider">
              {title}
            </p>

            {/* Value */}
            <p className="mt-3 text-3xl font-bold text-unimore-navy font-century">
              {value}
            </p>

            {/* Subtitle */}
            {subtitle && (
              <p className="mt-1 text-sm text-unimore-navy/50 font-medium">
                {subtitle}
              </p>
            )}

            {/* Change indicator */}
            {change !== undefined && (
              <div className={`mt-3 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${getChangeColor()}`}>
                {changeType === 'increase' ? (
                  <TrendingUp className="w-3 h-3 mr-1" />
                ) : changeType === 'decrease' ? (
                  <TrendingDown className="w-3 h-3 mr-1" />
                ) : null}
                <span>{changeType === 'increase' ? '+' : ''}{change}%</span>
                <span className="ml-1 font-normal opacity-75">vs last</span>
              </div>
            )}
          </div>

          {/* Icon */}
          {icon && (
            <div className={`ml-4 p-3 rounded-xl bg-gradient-to-br ${getAccentGradient()} text-white shadow-md group-hover:scale-110 transition-transform`}>
              {icon}
            </div>
          )}
        </div>

        {/* Progress bar (optional visual element) */}
        {changeType === 'increase' && change && (
          <div className="mt-4 h-1 bg-unimore-blue/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-unimore-blue to-unimore-blue-light animate-slide-in"
              style={{ width: `${Math.min(100, Math.abs(change) * 5)}%` }}
            />
          </div>
        )}
      </div>

      {/* Subtle hover effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-unimore-blue/0 to-unimore-blue/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
    </div>
  )
}
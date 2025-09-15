'use client'

import { useEffect, useState } from 'react'
import { Button } from '@mes/ui'
import {
  FileDown,
  RefreshCw,
  Ship,
  Activity,
  Bell
} from 'lucide-react'

export function DashboardHeader() {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000) // Update every minute

    return () => clearInterval(timer)
  }, [])

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const handleRefresh = () => {
    setIsRefreshing(true)
    // Simulate refresh
    setTimeout(() => setIsRefreshing(false), 2000)
  }

  return (
    <header className="relative bg-white shadow-lg border-b-4 border-unimore-blue">
      {/* Subtle maritime pattern overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-unimore-navy/5 to-transparent pointer-events-none" />

      <div className="relative max-w-[1920px] mx-auto px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between">
          {/* Left Section - Branding & Title */}
          <div className="flex items-center space-x-6">
            {/* Logo/Icon */}
            <div className="flex items-center justify-center w-14 h-14 bg-gradient-unimore rounded-xl shadow-md">
              <Ship className="w-8 h-8 text-white" />
            </div>

            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-3xl font-bold text-unimore-navy font-century">
                  Manufacturing Operations Center
                </h1>
                <span className="px-3 py-1 bg-unimore-blue/10 text-unimore-blue text-xs font-semibold rounded-full uppercase tracking-wider">
                  Live
                </span>
              </div>
              <div className="flex items-center space-x-4 mt-2">
                <p className="text-sm text-unimore-navy/60 font-medium">
                  {formatDate(currentTime)}
                </p>
                <span className="text-unimore-blue/40">•</span>
                <p className="text-sm font-semibold text-unimore-blue">
                  {formatTime(currentTime)}
                </p>
                <span className="text-unimore-blue/40">•</span>
                <div className="flex items-center space-x-1">
                  <Activity className="w-3 h-3 text-green-500" />
                  <span className="text-sm text-unimore-navy/60">All Systems Operational</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Section - Actions */}
          <div className="flex items-center space-x-3">
            {/* Notification Bell */}
            <button className="relative p-2 text-unimore-navy/60 hover:text-unimore-blue hover:bg-unimore-blue/10 rounded-lg transition-all">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            </button>

            {/* Export Button */}
            <Button
              variant="outline"
              size="sm"
              className="border-unimore-blue/30 text-unimore-navy hover:bg-unimore-blue/10 hover:border-unimore-blue transition-all"
            >
              <FileDown className="w-4 h-4 mr-2" />
              Export Report
            </Button>

            {/* Refresh Button */}
            <Button
              variant="primary"
              size="sm"
              onClick={handleRefresh}
              className="bg-gradient-unimore hover:shadow-hover text-white border-0 transition-all"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh Data
            </Button>
          </div>
        </div>

        {/* Shift Indicator Bar */}
        <div className="mt-4 pt-4 border-t border-unimore-blue/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold text-unimore-navy/60 uppercase tracking-wider">Current Shift:</span>
                <span className="px-3 py-1 bg-unimore-blue text-white text-xs font-bold rounded">Day Shift (06:00 - 14:00)</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold text-unimore-navy/60 uppercase tracking-wider">Shift Lead:</span>
                <span className="text-sm font-medium text-unimore-navy">John Anderson</span>
              </div>
            </div>
            <div className="flex items-center space-x-4 text-xs">
              <span className="text-unimore-navy/60">Next Shift Change:</span>
              <span className="font-bold text-unimore-blue">2h 35m</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
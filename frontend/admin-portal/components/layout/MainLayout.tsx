'use client'

import { useState, useEffect } from 'react'
import { Sidebar } from './Sidebar'
import { Header } from './Header'

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    // Initialize from localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sidebar-collapsed')
      return saved ? JSON.parse(saved) : false
    }
    return false
  })

  // Listen for changes
  useEffect(() => {
    // Listen for storage events to sync sidebar state across tabs
    const handleStorageChange = () => {
      const saved = localStorage.getItem('sidebar-collapsed')
      if (saved) {
        setSidebarCollapsed(JSON.parse(saved))
      }
    }

    // Create custom event listener for sidebar toggle
    const handleSidebarToggle = (e: CustomEvent) => {
      setSidebarCollapsed(e.detail.collapsed)
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('sidebar-toggle' as any, handleSidebarToggle as any)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('sidebar-toggle' as any, handleSidebarToggle as any)
    }
  }, [])

  return (
    <div className="min-h-screen bg-unimore-white-off">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div
        className={`
          transition-all duration-300 ease-in-out
          ${sidebarCollapsed ? 'lg:ml-[72px]' : 'lg:ml-64'}
        `}
      >
        {/* Header */}
        <Header />

        {/* Page Content */}
        <main className="pt-20 min-h-screen">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
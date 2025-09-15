'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@mes/auth'
import {
  Bell,
  User,
  Settings,
  LogOut,
  ChevronDown,
  Sun,
  Moon,
  Globe,
  HelpCircle,
  Command,
  Sparkles,
  Shield,
  Palette,
  Zap,
  Search,
  Menu,
  Activity
} from 'lucide-react'

export function Header() {
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isNotificationOpen, setIsNotificationOpen] = useState(false)
  const [isDark, setIsDark] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    // Initialize from localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sidebar-collapsed')
      return saved ? JSON.parse(saved) : false
    }
    return false
  })
  // Listen for sidebar state changes
  useEffect(() => {

    const handleSidebarToggle = (e: CustomEvent) => {
      setSidebarCollapsed(e.detail.collapsed)
    }

    window.addEventListener('sidebar-toggle' as any, handleSidebarToggle as any)

    return () => {
      window.removeEventListener('sidebar-toggle' as any, handleSidebarToggle as any)
    }
  }, [])

  // Use Keycloak authentication
  const { user, logout, isAuthenticated, login } = useAuth()

  // Fallback to mock user if not authenticated
  const displayUser = user ? {
    name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || 'User',
    email: user.email || '',
    role: user.roles?.includes('admin') ? 'Administrator' : 'User',
    avatar: `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() || 'U'
  } : {
    name: 'Guest User',
    email: 'Not logged in',
    role: 'Guest',
    avatar: 'GU'
  }

  const handleSignOut = async () => {
    try {
      // Use Keycloak logout
      await logout()
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  // Auto-redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated && typeof window !== 'undefined') {
      // Give a small delay to allow Keycloak to initialize
      const timer = setTimeout(() => {
        if (!isAuthenticated) {
          login()
        }
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [isAuthenticated, login])

  const notifications = [
    {
      id: 1,
      title: 'Production Line Alpha Completed',
      message: 'Batch #2024-156 finished successfully',
      time: '5 min ago',
      unread: true,
      type: 'success'
    },
    {
      id: 2,
      title: 'Low Inventory Alert',
      message: 'SKU-789 below threshold level',
      time: '1 hour ago',
      unread: true,
      type: 'warning'
    },
    {
      id: 3,
      title: 'New Order Received',
      message: 'Order #3456 from Maritime Corp',
      time: '2 hours ago',
      unread: false,
      type: 'info'
    }
  ]

  const getNotificationIcon = (type: string) => {
    switch(type) {
      case 'success':
        return 'bg-emerald-500'
      case 'warning':
        return 'bg-amber-500'
      case 'info':
        return 'bg-blue-500'
      default:
        return 'bg-gray-500'
    }
  }

  return (
    <header className={`fixed top-0 right-0 left-0 h-20 bg-white border-b border-gray-200 z-30 transition-all duration-300 ${
      sidebarCollapsed ? 'lg:left-[72px]' : 'lg:left-64'
    }`}>
      <div className="h-full px-6 flex items-center justify-between">
        {/* Left Section - Mobile Menu */}
        <div className="flex items-center">
          <button className="lg:hidden p-2 hover:bg-gray-100 rounded-lg">
            <Menu className="w-5 h-5 text-gray-700" />
          </button>
        </div>

        {/* Center Section - Search */}
        <div className="hidden xl:flex flex-1 max-w-xl mx-8">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search anything..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm
                focus:outline-none focus:border-unimore-blue focus:bg-white transition-all
                placeholder:text-gray-400 text-gray-700"
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:inline-block px-2 py-1 text-xs font-semibold bg-white rounded border border-gray-200">
              ⌘K
            </kbd>
          </div>
        </div>

        {/* Right Section - Actions */}
        <div className="flex items-center space-x-3">
          {/* Quick Actions */}
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors group relative">
            <Command className="w-5 h-5 text-gray-600 group-hover:text-unimore-blue" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-unimore-blue rounded-full"></span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={() => setIsDark(!isDark)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors group"
          >
            {isDark ? (
              <Sun className="w-5 h-5 text-gray-600 group-hover:text-amber-500" />
            ) : (
              <Moon className="w-5 h-5 text-gray-600 group-hover:text-indigo-500" />
            )}
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setIsNotificationOpen(!isNotificationOpen)}
              className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors group"
            >
              <Bell className="w-5 h-5 text-gray-600 group-hover:text-unimore-blue" />
              {notifications.some(n => n.unread) && (
                <span className="absolute top-1 right-1 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            {isNotificationOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setIsNotificationOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-xl border border-gray-200 z-20 overflow-hidden">
                  <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900">Notifications</h3>
                      <span className="px-2 py-0.5 bg-unimore-blue text-white text-xs font-medium rounded-full">
                        {notifications.filter(n => n.unread).length} new
                      </span>
                    </div>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer border-b border-gray-100 ${
                          notif.unread ? 'bg-blue-50/50' : ''
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <div className={`w-2 h-2 rounded-full mt-1.5 ${getNotificationIcon(notif.type)}`} />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{notif.title}</p>
                            <p className="text-xs text-gray-600 mt-0.5">{notif.message}</p>
                            <p className="text-xs text-gray-400 mt-2">{notif.time}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-3 bg-gray-50 border-t border-gray-200">
                    <button className="w-full text-sm text-unimore-blue hover:text-unimore-blue-dark font-medium">
                      View all notifications →
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="w-px h-8 bg-gray-200" />

          {/* Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center space-x-3 p-2 pr-3 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <div className="relative">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, #056389 0%, #0678a7 100%)'
                  }}
                >
                  <span className="text-xs font-bold" style={{ color: '#ffffff' }}>{displayUser.avatar}</span>
                </div>
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-gray-900">{displayUser.name}</p>
                <p className="text-xs text-gray-500">{displayUser.role}</p>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>

            {/* Profile Dropdown Menu */}
            {isProfileOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setIsProfileOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-200 z-20 overflow-hidden">
                  <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-12 h-12 rounded-lg flex items-center justify-center"
                        style={{
                          background: 'linear-gradient(135deg, #056389 0%, #0678a7 100%)'
                        }}
                      >
                        <span className="font-bold" style={{ color: '#ffffff' }}>{displayUser.avatar}</span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{displayUser.name}</p>
                        <p className="text-xs text-gray-600">{displayUser.email}</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-2">
                    <button className="w-full flex items-center space-x-3 px-3 py-2 hover:bg-gray-50 rounded-lg transition-colors group">
                      <User className="w-4 h-4 text-gray-400 group-hover:text-unimore-blue" />
                      <span className="text-sm text-gray-700">My Profile</span>
                    </button>
                    <button className="w-full flex items-center space-x-3 px-3 py-2 hover:bg-gray-50 rounded-lg transition-colors group">
                      <Settings className="w-4 h-4 text-gray-400 group-hover:text-unimore-blue" />
                      <span className="text-sm text-gray-700">Preferences</span>
                    </button>
                    <button className="w-full flex items-center space-x-3 px-3 py-2 hover:bg-gray-50 rounded-lg transition-colors group">
                      <Shield className="w-4 h-4 text-gray-400 group-hover:text-unimore-blue" />
                      <span className="text-sm text-gray-700">Security</span>
                    </button>
                    <button className="w-full flex items-center space-x-3 px-3 py-2 hover:bg-gray-50 rounded-lg transition-colors group">
                      <Palette className="w-4 h-4 text-gray-400 group-hover:text-unimore-blue" />
                      <span className="text-sm text-gray-700">Appearance</span>
                    </button>
                  </div>

                  <div className="p-2 border-t border-gray-200">
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center space-x-3 px-3 py-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors group"
                    >
                      <LogOut className="w-4 h-4" />
                      <span className="text-sm font-medium">Sign Out</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Border Accent */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-unimore-blue to-transparent opacity-20"></div>
    </header>
  )
}
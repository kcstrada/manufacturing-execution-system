'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  BarChart3,
  Settings,
  FileText,
  Factory,
  Truck,
  ClipboardList,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Activity,
  Zap,
  Shield,
  Database,
  Workflow,
  TrendingUp,
  Box,
  Layers,
  PieChart
} from 'lucide-react'

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
  badge?: string | number
  badgeType?: 'info' | 'warning' | 'success' | 'danger'
  description?: string
}

const navigation: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: <LayoutDashboard className="w-5 h-5" />,
    description: 'Overview & Analytics'
  },
  {
    label: 'Orders',
    href: '/orders',
    icon: <ShoppingCart className="w-5 h-5" />,
    badge: 'New',
    badgeType: 'success',
    description: 'Sales & Orders'
  },
  {
    label: 'Production',
    href: '/production',
    icon: <Factory className="w-5 h-5" />,
    badge: 4,
    badgeType: 'info',
    description: 'Manufacturing'
  },
  {
    label: 'Inventory',
    href: '/inventory',
    icon: <Box className="w-5 h-5" />,
    badge: '!',
    badgeType: 'danger',
    description: 'Stock Management'
  },
  {
    label: 'Analytics',
    href: '/analytics',
    icon: <TrendingUp className="w-5 h-5" />,
    description: 'Reports & Insights'
  },
  {
    label: 'Workers',
    href: '/workers',
    icon: <Users className="w-5 h-5" />,
    description: 'Team Management'
  },
  {
    label: 'Settings',
    href: '/settings',
    icon: <Settings className="w-5 h-5" />,
    description: 'Configuration'
  }
]

const bottomNavigation: NavItem[] = [
  {
    label: 'Activity',
    href: '/activity',
    icon: <Activity className="w-5 h-5" />,
    description: 'System Logs'
  },
  {
    label: 'Security',
    href: '/security',
    icon: <Shield className="w-5 h-5" />,
    description: 'Access Control'
  }
]

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    // Initialize from localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sidebar-collapsed')
      return saved ? JSON.parse(saved) : false
    }
    return false
  })
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const pathname = usePathname()

  // Save collapsed state to localStorage and dispatch event
  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', JSON.stringify(isCollapsed))
    // Dispatch custom event for immediate updates
    window.dispatchEvent(new CustomEvent('sidebar-toggle', {
      detail: { collapsed: isCollapsed }
    }))
  }, [isCollapsed])

  const isActive = (href: string) => pathname === href

  const getBadgeStyles = (type?: string) => {
    switch (type) {
      case 'success':
        return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
      case 'warning':
        return 'bg-amber-500/10 text-amber-600 border-amber-500/20'
      case 'danger':
        return 'bg-red-500/10 text-red-600 border-red-500/20'
      default:
        return 'bg-unimore-blue/10 text-unimore-blue border-unimore-blue/20'
    }
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2.5 bg-white/90 backdrop-blur-lg rounded-xl shadow-lg hover:shadow-xl transition-all border border-gray-100"
      >
        {isMobileOpen ? (
          <X className="w-5 h-5 text-unimore-navy" />
        ) : (
          <Menu className="w-5 h-5 text-unimore-navy" />
        )}
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full bg-white/95 backdrop-blur-xl border-r border-gray-100 z-40
          transition-all duration-500 ease-[cubic-bezier(0.4,0.0,0.2,1)] shadow-2xl
          ${isCollapsed ? 'w-[72px]' : 'w-64'}
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Logo Section */}
        <div className="h-20 relative bg-white border-b border-gray-100 overflow-hidden">
          <div className="h-full flex items-center justify-between px-4">
            {!isCollapsed ? (
              <Link href="/dashboard" className="flex items-center gap-3 group">
                {/* Logo Icon */}
                <div className="relative transition-all duration-500 transform scale-100">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-lg transition-all group-hover:scale-105"
                    style={{
                      background: 'linear-gradient(135deg, #056389 0%, #0678a7 100%)'
                    }}
                  >
                    <Zap className="w-5 h-5" style={{ color: '#ffffff' }} />
                  </div>
                  {/* Status Indicator */}
                  <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full border-2 border-white shadow-sm" />
                </div>

                {/* Logo Text */}
                <div className="overflow-hidden">
                  <h2 className="text-sm font-semibold text-gray-900 whitespace-nowrap">Admin Portal</h2>
                  <p className="text-[10px] text-gray-400 font-medium whitespace-nowrap">Unimore Trading</p>
                </div>
              </Link>
            ) : (
              /* Expand Button in Logo Position */
              <button
                onClick={() => setIsCollapsed(false)}
                className="mx-auto flex items-center justify-center w-10 h-10 rounded-xl transition-all hover:scale-110 group"
                aria-label="Expand sidebar"
                style={{
                  background: 'linear-gradient(135deg, #056389 0%, #0678a7 100%)',
                  boxShadow: '0 2px 8px rgba(5, 99, 137, 0.15)'
                }}
              >
                <ChevronRight
                  className="w-5 h-5 transition-transform group-hover:translate-x-1"
                  style={{ color: '#ffffff' }}
                />
              </button>
            )}

            {/* Collapse Toggle - Desktop Only */}
            {!isCollapsed && (
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="hidden lg:flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-50 transition-all group"
                aria-label="Collapse sidebar"
              >
                <ChevronLeft
                  className="w-4 h-4 transition-transform group-hover:-translate-x-0.5"
                  style={{ color: '#9ca3af' }}
                />
              </button>
            )}
          </div>

        </div>


        {/* Main Navigation */}
        <nav className="p-3 space-y-1 overflow-y-auto h-[calc(100vh-10rem-4rem)]">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsMobileOpen(false)}
              className={`
                relative flex items-center px-3 py-2.5 rounded-xl
                transition-all duration-300 group overflow-hidden
                ${isActive(item.href)
                  ? 'shadow-lg scale-[1.02]'
                  : 'hover:bg-gray-50 hover:shadow-md hover:scale-[1.01] active:scale-[0.99]'
                }
              `}
              style={isActive(item.href) ? {
                background: 'linear-gradient(to right, #056389, #6CAECF)'
              } : {}}
            >

              {/* Click Effect Overlay */}
              <div className={`
                absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent
                transform -translate-x-full group-hover:translate-x-full
                transition-transform duration-700 ease-out
              `} />

              <div className="flex items-center justify-between w-full relative z-10">
                <div className="flex items-center space-x-3">
                  <span className={`
                    transition-all duration-300 transform
                    ${isActive(item.href)
                      ? 'text-white'
                      : 'text-unimore-navy/60 group-hover:text-unimore-blue group-hover:rotate-6 group-active:rotate-0'
                    }
                  `}>
                    {item.icon}
                  </span>
                  <div className={`flex-1 overflow-hidden transition-all duration-500 ${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
                    <p className={`
                      font-medium text-sm whitespace-nowrap transition-all duration-300
                      ${isActive(item.href)
                        ? 'text-white'
                        : 'text-unimore-navy group-hover:translate-x-1'
                      }
                    `}>
                      {item.label}
                    </p>
                    {item.description && (
                      <p className={`
                        text-[10px] mt-0.5 whitespace-nowrap transition-all duration-300 delay-75
                        ${isActive(item.href)
                          ? 'text-white/80'
                          : 'text-unimore-navy/40 group-hover:text-unimore-navy/60 group-hover:translate-x-1'
                        }
                      `}>
                        {item.description}
                      </p>
                    )}
                  </div>
                </div>
                {item.badge && (
                  <span className={`
                    px-2 py-0.5 text-[10px] font-bold rounded-full border
                    transition-all duration-500 transform
                    ${!isCollapsed ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}
                    ${isActive(item.href)
                      ? 'bg-white/20 text-white border-white/30'
                      : getBadgeStyles(item.badgeType)
                    }
                    group-hover:scale-110
                  `}>
                    {item.badge}
                  </span>
                )}
              </div>

              {/* Bottom accent line */}
              <div className={`
                absolute bottom-0 left-0 h-0.5 transition-all duration-300
                ${isActive(item.href)
                  ? 'w-full bg-white/30'
                  : 'w-0 bg-unimore-blue group-hover:w-full'
                }
              `} />

              {/* Tooltip for collapsed state */}
              {isCollapsed && (
                <div className="absolute left-full ml-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg
                  opacity-0 invisible group-hover:opacity-100 group-hover:visible
                  transition-all duration-200 transform translate-x-2 group-hover:translate-x-0
                  whitespace-nowrap z-50 shadow-xl">
                  <div className="font-medium">{item.label}</div>
                  {item.description && (
                    <div className="text-[10px] text-white/70 mt-0.5">{item.description}</div>
                  )}
                  {item.badge && (
                    <span className="inline-block mt-1 px-1.5 py-0.5 bg-white/20 rounded text-[10px]">
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </Link>
          ))}
        </nav>

        {/* Bottom Navigation */}
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-gray-100 bg-white/95 backdrop-blur-xl space-y-1">
          {bottomNavigation.map((item, index) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsMobileOpen(false)}
              className={`
                relative flex items-center px-3 py-2 rounded-xl
                transition-all duration-300 group overflow-hidden
                hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100
                hover:shadow-md hover:scale-[1.02]
                ${isCollapsed ? 'justify-center' : ''}
              `}
              style={{
                animationDelay: `${index * 50}ms`
              }}
            >
              <div className="flex items-center space-x-3 w-full">
                <span className={`
                  transition-all duration-300
                  text-unimore-navy/50 group-hover:text-unimore-blue group-hover:scale-110
                  ${isCollapsed ? 'mx-auto' : ''}
                `}>
                  {item.icon}
                </span>
                <div className={`
                  overflow-hidden transition-all duration-500
                  ${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}
                `}>
                  <p className="text-xs font-medium whitespace-nowrap group-hover:text-unimore-blue transition-colors">
                    {item.label}
                  </p>
                  {item.description && (
                    <p className="text-[10px] text-unimore-navy/40 whitespace-nowrap">
                      {item.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Hover Effect Line */}
              <div className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-unimore-blue to-unimore-blue-light transition-all duration-300 w-0 group-hover:w-full" />

              {/* Tooltip for collapsed state */}
              {isCollapsed && (
                <div className="absolute left-full ml-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg
                  opacity-0 invisible group-hover:opacity-100 group-hover:visible
                  transition-all duration-200 transform translate-x-2 group-hover:translate-x-0
                  whitespace-nowrap z-50 shadow-xl">
                  <div className="font-medium">{item.label}</div>
                  {item.description && (
                    <div className="text-[10px] text-white/70 mt-0.5">{item.description}</div>
                  )}
                </div>
              )}
            </Link>
          ))}
        </div>
      </aside>
    </>
  )
}
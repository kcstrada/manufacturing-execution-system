'use client'

import { usePathname } from 'next/navigation'
import { MainLayout } from './MainLayout'

interface LayoutWrapperProps {
  children: React.ReactNode
}

export function LayoutWrapper({ children }: LayoutWrapperProps) {
  const pathname = usePathname()

  // Pages that should not have sidebar
  const noSidebarPages = ['/tenants']
  const shouldHideSidebar = noSidebarPages.some(page => pathname?.startsWith(page))

  if (shouldHideSidebar) {
    return <>{children}</>
  }

  return <MainLayout>{children}</MainLayout>
}
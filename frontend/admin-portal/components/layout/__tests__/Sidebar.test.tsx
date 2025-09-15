import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { usePathname } from 'next/navigation'
import { Sidebar } from '../Sidebar'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}))

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  clear: jest.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

describe('Sidebar Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(usePathname as jest.Mock).mockReturnValue('/dashboard')
    localStorageMock.getItem.mockReturnValue(null)
  })

  describe('Rendering', () => {
    it('should render the sidebar with logo and navigation items', () => {
      render(<Sidebar />)

      // Check logo text
      expect(screen.getByText('Admin Portal')).toBeInTheDocument()
      expect(screen.getByText('Unimore Trading')).toBeInTheDocument()

      // Check main navigation items
      expect(screen.getByText('Dashboard')).toBeInTheDocument()
      expect(screen.getByText('Orders')).toBeInTheDocument()
      expect(screen.getByText('Production')).toBeInTheDocument()
      expect(screen.getByText('Inventory')).toBeInTheDocument()
      expect(screen.getByText('Analytics')).toBeInTheDocument()
      expect(screen.getByText('Workers')).toBeInTheDocument()
      expect(screen.getByText('Settings')).toBeInTheDocument()

      // Check footer navigation items
      expect(screen.getByText('Activity')).toBeInTheDocument()
      expect(screen.getByText('Security')).toBeInTheDocument()
    })

    it('should render navigation item descriptions', () => {
      render(<Sidebar />)

      expect(screen.getByText('Overview & Analytics')).toBeInTheDocument()
      expect(screen.getByText('Sales & Orders')).toBeInTheDocument()
      expect(screen.getByText('Manufacturing')).toBeInTheDocument()
      expect(screen.getByText('Stock Management')).toBeInTheDocument()
    })

    it('should render badges on navigation items', () => {
      render(<Sidebar />)

      expect(screen.getByText('New')).toBeInTheDocument()
      expect(screen.getByText('4')).toBeInTheDocument()
      expect(screen.getByText('!')).toBeInTheDocument()
    })

    it('should highlight the active navigation item', () => {
      (usePathname as jest.Mock).mockReturnValue('/orders')
      render(<Sidebar />)

      const ordersLink = screen.getByRole('link', { name: /Orders Sales & Orders/i })
      expect(ordersLink).toHaveStyle({
        background: 'linear-gradient(to right, #056389, #6CAECF)'
      })
    })
  })

  describe('Collapse/Expand Functionality', () => {
    it('should start expanded by default when localStorage is empty', () => {
      render(<Sidebar />)

      // Logo text should be visible
      expect(screen.getByText('Admin Portal')).toBeVisible()
      expect(screen.getByText('Unimore Trading')).toBeVisible()

      // Collapse button should be visible
      expect(screen.getByLabelText('Collapse sidebar')).toBeInTheDocument()
    })

    it('should start collapsed when localStorage indicates collapsed state', () => {
      localStorageMock.getItem.mockReturnValue('true')
      render(<Sidebar />)

      // Logo text should not be rendered when collapsed
      expect(screen.queryByText('Admin Portal')).not.toBeInTheDocument()

      // Expand button should be visible
      expect(screen.getByLabelText('Expand sidebar')).toBeInTheDocument()
    })

    it('should toggle collapse state when collapse button is clicked', async () => {
      render(<Sidebar />)

      const collapseButton = screen.getByLabelText('Collapse sidebar')
      fireEvent.click(collapseButton)

      await waitFor(() => {
        expect(localStorageMock.setItem).toHaveBeenCalledWith('sidebar-collapsed', 'true')
      })

      // After collapse, expand button should appear
      expect(screen.getByLabelText('Expand sidebar')).toBeInTheDocument()
    })

    it('should toggle expand state when expand button is clicked', async () => {
      localStorageMock.getItem.mockReturnValue('true')
      render(<Sidebar />)

      const expandButton = screen.getByLabelText('Expand sidebar')
      fireEvent.click(expandButton)

      await waitFor(() => {
        expect(localStorageMock.setItem).toHaveBeenCalledWith('sidebar-collapsed', 'false')
      })

      // After expand, collapse button should appear
      expect(screen.getByLabelText('Collapse sidebar')).toBeInTheDocument()
    })

    it('should dispatch custom event when toggling sidebar state', async () => {
      const mockDispatchEvent = jest.fn()
      window.dispatchEvent = mockDispatchEvent

      render(<Sidebar />)

      const collapseButton = screen.getByLabelText('Collapse sidebar')
      fireEvent.click(collapseButton)

      await waitFor(() => {
        expect(mockDispatchEvent).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'sidebar-toggle',
            detail: { collapsed: true }
          })
        )
      })
    })
  })

  describe('Mobile Menu', () => {
    it('should render mobile menu button', () => {
      render(<Sidebar />)

      // Both open and close buttons exist, but only one is visible at a time
      const menuButtons = screen.getAllByRole('button').filter(
        button => button.className.includes('lg:hidden')
      )
      expect(menuButtons.length).toBeGreaterThan(0)
    })

    it('should toggle mobile menu when button is clicked', () => {
      render(<Sidebar />)

      // Find the mobile menu button (it's the fixed positioned one)
      const mobileMenuButton = screen.getAllByRole('button').find(
        button => button.className.includes('lg:hidden') && button.className.includes('fixed')
      )

      expect(mobileMenuButton).toBeInTheDocument()

      // Click to open
      fireEvent.click(mobileMenuButton!)

      // The sidebar should have translate-x-0 class when open
      const sidebar = screen.getByRole('complementary')
      expect(sidebar.className).toContain('translate-x-0')
    })
  })

  describe('Navigation', () => {
    it('should navigate to correct routes when clicking links', () => {
      render(<Sidebar />)

      const dashboardLink = screen.getByRole('link', { name: /Dashboard Overview & Analytics/i })
      expect(dashboardLink).toHaveAttribute('href', '/dashboard')

      const ordersLink = screen.getByRole('link', { name: /Orders Sales & Orders/i })
      expect(ordersLink).toHaveAttribute('href', '/orders')

      const productionLink = screen.getByRole('link', { name: /Production Manufacturing/i })
      expect(productionLink).toHaveAttribute('href', '/production')
    })

    it('should close mobile menu when a navigation item is clicked', () => {
      render(<Sidebar />)

      // Open mobile menu first
      const mobileMenuButton = screen.getAllByRole('button').find(
        button => button.className.includes('lg:hidden') && button.className.includes('fixed')
      )
      fireEvent.click(mobileMenuButton!)

      // Click a navigation item
      const dashboardLink = screen.getByRole('link', { name: /Dashboard Overview & Analytics/i })
      fireEvent.click(dashboardLink)

      // Mobile menu should be closed (sidebar should have -translate-x-full)
      const sidebar = screen.getByRole('complementary')
      expect(sidebar.className).toContain('-translate-x-full')
    })
  })

  describe('Badge Styles', () => {
    it('should apply correct styles for different badge types', () => {
      render(<Sidebar />)

      // Success badge (New)
      const successBadge = screen.getByText('New')
      expect(successBadge.className).toContain('bg-emerald-500/10')
      expect(successBadge.className).toContain('text-emerald-600')

      // Info badge (4)
      const infoBadge = screen.getByText('4')
      expect(infoBadge.className).toContain('bg-unimore-blue/10')
      expect(infoBadge.className).toContain('text-unimore-blue')

      // Danger badge (!)
      const dangerBadge = screen.getByText('!')
      expect(dangerBadge.className).toContain('bg-red-500/10')
      expect(dangerBadge.className).toContain('text-red-600')
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<Sidebar />)

      expect(screen.getByLabelText('Collapse sidebar')).toBeInTheDocument()
      expect(screen.getByRole('complementary')).toBeInTheDocument()
      expect(screen.getByRole('navigation')).toBeInTheDocument()
    })

    it('should have proper link labels', () => {
      render(<Sidebar />)

      const links = screen.getAllByRole('link')
      links.forEach(link => {
        expect(link).toHaveAttribute('href')
      })
    })
  })
})
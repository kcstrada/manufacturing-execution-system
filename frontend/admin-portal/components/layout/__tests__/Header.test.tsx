import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useAuth } from '@mes/auth'
import { Header } from '../Header'

// Mock @mes/auth
jest.mock('@mes/auth', () => ({
  useAuth: jest.fn(),
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

// Mock window.addEventListener
const mockAddEventListener = jest.fn()
const mockRemoveEventListener = jest.fn()
window.addEventListener = mockAddEventListener
window.removeEventListener = mockRemoveEventListener

describe('Header Component', () => {
  const mockLogout = jest.fn()
  const mockLogin = jest.fn()

  const mockAuthUser = {
    id: '123',
    email: 'john.doe@unimore.com',
    firstName: 'John',
    lastName: 'Doe',
    username: 'johndoe',
    roles: ['admin'],
    permissions: [],
  }

  beforeEach(() => {
    jest.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)

    // Default auth mock
    ;(useAuth as jest.Mock).mockReturnValue({
      user: mockAuthUser,
      isAuthenticated: true,
      isLoading: false,
      token: 'mock-token',
      login: mockLogin,
      logout: mockLogout,
      hasRole: jest.fn(),
      hasPermission: jest.fn(),
      hasAnyRole: jest.fn(),
      hasAllRoles: jest.fn(),
      refreshToken: jest.fn(),
    })
  })

  describe('Rendering', () => {
    it('should render header with user information when authenticated', () => {
      render(<Header />)

      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('Administrator')).toBeInTheDocument()
      expect(screen.getByText('JD')).toBeInTheDocument() // Avatar initials
    })

    it('should render guest user when not authenticated', () => {
      ;(useAuth as jest.Mock).mockReturnValue({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        token: null,
        login: mockLogin,
        logout: mockLogout,
        hasRole: jest.fn(),
        hasPermission: jest.fn(),
        hasAnyRole: jest.fn(),
        hasAllRoles: jest.fn(),
        refreshToken: jest.fn(),
      })

      render(<Header />)

      expect(screen.getByText('Guest User')).toBeInTheDocument()
      expect(screen.getByText('Guest')).toBeInTheDocument()
      expect(screen.getByText('GU')).toBeInTheDocument() // Guest avatar
    })

    it('should render notification bell with indicator when there are unread notifications', () => {
      render(<Header />)

      const bellButton = screen.getByRole('button', { name: /notifications/i })
      expect(bellButton).toBeInTheDocument()

      // Check for unread indicator (the pulsing dot)
      const unreadIndicator = bellButton.querySelector('.animate-ping')
      expect(unreadIndicator).toBeInTheDocument()
    })

    it('should render theme toggle button', () => {
      render(<Header />)

      // Look for Moon icon (light mode)
      const themeButton = screen.getAllByRole('button').find(button =>
        button.querySelector('.lucide-moon')
      )
      expect(themeButton).toBeInTheDocument()
    })
  })

  describe('Profile Dropdown', () => {
    it('should toggle profile dropdown when clicking profile button', async () => {
      render(<Header />)

      // Profile dropdown should not be visible initially
      expect(screen.queryByText('My Profile')).not.toBeInTheDocument()

      // Click profile button
      const profileButton = screen.getByRole('button', { name: /John Doe Administrator/i })
      fireEvent.click(profileButton)

      // Profile dropdown should be visible
      await waitFor(() => {
        expect(screen.getByText('My Profile')).toBeInTheDocument()
        expect(screen.getByText('Preferences')).toBeInTheDocument()
        expect(screen.getByText('Security')).toBeInTheDocument()
        expect(screen.getByText('Appearance')).toBeInTheDocument()
        expect(screen.getByText('Sign Out')).toBeInTheDocument()
      })
    })

    it('should close profile dropdown when clicking outside', async () => {
      render(<Header />)

      // Open dropdown
      const profileButton = screen.getByRole('button', { name: /John Doe Administrator/i })
      fireEvent.click(profileButton)

      // Verify dropdown is open
      expect(screen.getByText('My Profile')).toBeInTheDocument()

      // Click outside (on the overlay)
      const overlay = document.querySelector('.fixed.inset-0')
      fireEvent.click(overlay!)

      // Dropdown should be closed
      await waitFor(() => {
        expect(screen.queryByText('My Profile')).not.toBeInTheDocument()
      })
    })

    it('should display user email in profile dropdown', async () => {
      render(<Header />)

      const profileButton = screen.getByRole('button', { name: /John Doe Administrator/i })
      fireEvent.click(profileButton)

      await waitFor(() => {
        expect(screen.getByText('john.doe@unimore.com')).toBeInTheDocument()
      })
    })
  })

  describe('Notifications Dropdown', () => {
    it('should toggle notifications dropdown when clicking bell icon', async () => {
      render(<Header />)

      // Notifications should not be visible initially
      expect(screen.queryByText('Production Line Alpha Completed')).not.toBeInTheDocument()

      // Click notification bell
      const bellButton = screen.getByRole('button', { name: /notifications/i })
      fireEvent.click(bellButton)

      // Notifications should be visible
      await waitFor(() => {
        expect(screen.getByText('Notifications')).toBeInTheDocument()
        expect(screen.getByText('Production Line Alpha Completed')).toBeInTheDocument()
        expect(screen.getByText('Low Inventory Alert')).toBeInTheDocument()
        expect(screen.getByText('New Order Received')).toBeInTheDocument()
      })
    })

    it('should show notification count', async () => {
      render(<Header />)

      const bellButton = screen.getByRole('button', { name: /notifications/i })
      fireEvent.click(bellButton)

      await waitFor(() => {
        expect(screen.getByText('2 new')).toBeInTheDocument() // 2 unread notifications
      })
    })

    it('should display notification details', async () => {
      render(<Header />)

      const bellButton = screen.getByRole('button', { name: /notifications/i })
      fireEvent.click(bellButton)

      await waitFor(() => {
        expect(screen.getByText('Batch #2024-156 finished successfully')).toBeInTheDocument()
        expect(screen.getByText('SKU-789 below threshold level')).toBeInTheDocument()
        expect(screen.getByText('Order #3456 from Maritime Corp')).toBeInTheDocument()
      })
    })

    it('should show "View all notifications" link', async () => {
      render(<Header />)

      const bellButton = screen.getByRole('button', { name: /notifications/i })
      fireEvent.click(bellButton)

      await waitFor(() => {
        expect(screen.getByText('View all notifications →')).toBeInTheDocument()
      })
    })
  })

  describe('Authentication', () => {
    it('should call logout when sign out button is clicked', async () => {
      render(<Header />)

      // Open profile dropdown
      const profileButton = screen.getByRole('button', { name: /John Doe Administrator/i })
      fireEvent.click(profileButton)

      // Click sign out
      const signOutButton = await screen.findByText('Sign Out')
      fireEvent.click(signOutButton)

      await waitFor(() => {
        expect(mockLogout).toHaveBeenCalled()
      })
    })

    it('should call login when not authenticated after timeout', async () => {
      jest.useFakeTimers()

      ;(useAuth as jest.Mock).mockReturnValue({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        token: null,
        login: mockLogin,
        logout: mockLogout,
        hasRole: jest.fn(),
        hasPermission: jest.fn(),
        hasAnyRole: jest.fn(),
        hasAllRoles: jest.fn(),
        refreshToken: jest.fn(),
      })

      render(<Header />)

      // Fast-forward time by 1 second
      jest.advanceTimersByTime(1000)

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalled()
      })

      jest.useRealTimers()
    })

    it('should handle different user roles', () => {
      // Test non-admin user
      ;(useAuth as jest.Mock).mockReturnValue({
        user: {
          ...mockAuthUser,
          roles: ['user'],
        },
        isAuthenticated: true,
        isLoading: false,
        token: 'mock-token',
        login: mockLogin,
        logout: mockLogout,
        hasRole: jest.fn(),
        hasPermission: jest.fn(),
        hasAnyRole: jest.fn(),
        hasAllRoles: jest.fn(),
        refreshToken: jest.fn(),
      })

      render(<Header />)

      expect(screen.getByText('User')).toBeInTheDocument() // Role should be 'User' not 'Administrator'
    })
  })

  describe('Theme Toggle', () => {
    it('should toggle between light and dark mode', async () => {
      render(<Header />)

      // Initially should show Moon icon (light mode)
      let themeButton = screen.getAllByRole('button').find(button =>
        button.querySelector('.lucide-moon')
      )
      expect(themeButton).toBeInTheDocument()

      // Click to toggle to dark mode
      fireEvent.click(themeButton!)

      // Should now show Sun icon (dark mode)
      await waitFor(() => {
        themeButton = screen.getAllByRole('button').find(button =>
          button.querySelector('.lucide-sun')
        )
        expect(themeButton).toBeInTheDocument()
      })
    })
  })

  describe('Sidebar State Integration', () => {
    it('should initialize sidebar collapsed state from localStorage', () => {
      localStorageMock.getItem.mockReturnValue('true')

      render(<Header />)

      // Check that localStorage was accessed
      expect(localStorageMock.getItem).toHaveBeenCalledWith('sidebar-collapsed')
    })

    it('should listen for sidebar toggle events', () => {
      render(<Header />)

      // Check that event listener was added
      expect(mockAddEventListener).toHaveBeenCalledWith(
        'sidebar-toggle',
        expect.any(Function)
      )
    })

    it('should adjust layout based on sidebar state', () => {
      localStorageMock.getItem.mockReturnValue('true') // Sidebar collapsed

      const { container } = render(<Header />)

      const header = container.querySelector('header')
      expect(header?.className).toContain('lg:left-[72px]') // Collapsed width
    })

    it('should clean up event listeners on unmount', () => {
      const { unmount } = render(<Header />)

      unmount()

      expect(mockRemoveEventListener).toHaveBeenCalledWith(
        'sidebar-toggle',
        expect.any(Function)
      )
    })
  })

  describe('Mobile Responsiveness', () => {
    it('should hide user details on mobile', () => {
      render(<Header />)

      const userDetails = screen.getByText('John Doe').parentElement
      expect(userDetails?.className).toContain('hidden md:block')
    })

    it('should render mobile menu button', () => {
      render(<Header />)

      const mobileMenuButton = screen.getAllByRole('button').find(button =>
        button.className.includes('lg:hidden')
      )
      expect(mobileMenuButton).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels for interactive elements', () => {
      render(<Header />)

      // Profile button should be accessible
      const profileButton = screen.getByRole('button', { name: /John Doe Administrator/i })
      expect(profileButton).toBeInTheDocument()

      // Notification button should have accessible name
      const notificationButton = screen.getByRole('button', { name: /notifications/i })
      expect(notificationButton).toBeInTheDocument()
    })

    it('should use semantic HTML elements', () => {
      const { container } = render(<Header />)

      expect(container.querySelector('header')).toBeInTheDocument()
      expect(container.querySelector('nav')).not.toBeInTheDocument() // Header doesn't have nav
    })
  })
})
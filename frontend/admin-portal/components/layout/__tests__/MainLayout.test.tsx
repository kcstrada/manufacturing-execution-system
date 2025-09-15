import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { MainLayout } from '../MainLayout'
import { usePathname } from 'next/navigation'
import { useAuth } from '@mes/auth'

// Mock the child components
jest.mock('../Sidebar', () => ({
  Sidebar: () => <div data-testid="sidebar">Sidebar Component</div>,
}))

jest.mock('../Header', () => ({
  Header: () => <header data-testid="header">Header Component</header>,
}))

// Mock next/navigation
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}))

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

// Mock window event listeners
const eventListeners: { [key: string]: EventListener[] } = {}
const mockAddEventListener = jest.fn((event: string, handler: EventListener) => {
  if (!eventListeners[event]) {
    eventListeners[event] = []
  }
  eventListeners[event].push(handler)
})
const mockRemoveEventListener = jest.fn((event: string, handler: EventListener) => {
  if (eventListeners[event]) {
    eventListeners[event] = eventListeners[event].filter(h => h !== handler)
  }
})

window.addEventListener = mockAddEventListener
window.removeEventListener = mockRemoveEventListener

describe('MainLayout Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
    ;(usePathname as jest.Mock).mockReturnValue('/dashboard')
    ;(useAuth as jest.Mock).mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      token: null,
      login: jest.fn(),
      logout: jest.fn(),
      hasRole: jest.fn(),
      hasPermission: jest.fn(),
      hasAnyRole: jest.fn(),
      hasAllRoles: jest.fn(),
      refreshToken: jest.fn(),
    })

    // Clear event listeners
    Object.keys(eventListeners).forEach(key => {
      delete eventListeners[key]
    })
  })

  describe('Rendering', () => {
    it('should render sidebar, header, and children', () => {
      render(
        <MainLayout>
          <div data-testid="page-content">Page Content</div>
        </MainLayout>
      )

      expect(screen.getByTestId('sidebar')).toBeInTheDocument()
      expect(screen.getByTestId('header')).toBeInTheDocument()
      expect(screen.getByTestId('page-content')).toBeInTheDocument()
    })

    it('should wrap children in main element with proper classes', () => {
      const { container } = render(
        <MainLayout>
          <div>Content</div>
        </MainLayout>
      )

      const main = container.querySelector('main')
      expect(main).toBeInTheDocument()
      expect(main?.className).toContain('pt-20') // Padding top for header
      expect(main?.className).toContain('min-h-screen')
    })

    it('should apply background color to root container', () => {
      const { container } = render(
        <MainLayout>
          <div>Content</div>
        </MainLayout>
      )

      const rootDiv = container.firstChild as HTMLElement
      expect(rootDiv.className).toContain('min-h-screen')
      expect(rootDiv.className).toContain('bg-unimore-white-off')
    })

    it('should wrap page content with padding', () => {
      const { container } = render(
        <MainLayout>
          <div>Content</div>
        </MainLayout>
      )

      const contentWrapper = container.querySelector('main > div')
      expect(contentWrapper?.className).toContain('p-6')
    })
  })

  describe('Sidebar State Management', () => {
    it('should initialize sidebar state from localStorage', () => {
      localStorageMock.getItem.mockReturnValue('true')

      render(
        <MainLayout>
          <div>Content</div>
        </MainLayout>
      )

      expect(localStorageMock.getItem).toHaveBeenCalledWith('sidebar-collapsed')
    })

    it('should apply correct margin when sidebar is expanded', () => {
      localStorageMock.getItem.mockReturnValue('false')

      const { container } = render(
        <MainLayout>
          <div>Content</div>
        </MainLayout>
      )

      const mainContent = container.querySelector('div.transition-all')
      expect(mainContent?.className).toContain('lg:ml-64') // Expanded width
    })

    it('should apply correct margin when sidebar is collapsed', () => {
      localStorageMock.getItem.mockReturnValue('true')

      const { container } = render(
        <MainLayout>
          <div>Content</div>
        </MainLayout>
      )

      const mainContent = container.querySelector('div.transition-all')
      expect(mainContent?.className).toContain('lg:ml-[72px]') // Collapsed width
    })

    it('should use smooth transition when changing sidebar state', () => {
      const { container } = render(
        <MainLayout>
          <div>Content</div>
        </MainLayout>
      )

      const mainContent = container.querySelector('div.transition-all')
      expect(mainContent?.className).toContain('transition-all')
      expect(mainContent?.className).toContain('duration-300')
      expect(mainContent?.className).toContain('ease-in-out')
    })
  })

  describe('Event Listeners', () => {
    it('should listen for storage events to sync across tabs', () => {
      render(
        <MainLayout>
          <div>Content</div>
        </MainLayout>
      )

      expect(mockAddEventListener).toHaveBeenCalledWith('storage', expect.any(Function))
    })

    it('should listen for custom sidebar-toggle events', () => {
      render(
        <MainLayout>
          <div>Content</div>
        </MainLayout>
      )

      expect(mockAddEventListener).toHaveBeenCalledWith('sidebar-toggle', expect.any(Function))
    })

    it('should update layout when receiving sidebar-toggle event', async () => {
      const { container } = render(
        <MainLayout>
          <div>Content</div>
        </MainLayout>
      )

      // Simulate sidebar-toggle event
      const event = new CustomEvent('sidebar-toggle', {
        detail: { collapsed: true }
      })

      // Find and call the event handler
      const handler = eventListeners['sidebar-toggle']?.[0]
      if (handler) {
        handler(event)
      }

      await waitFor(() => {
        const mainContent = container.querySelector('div.transition-all')
        expect(mainContent?.className).toContain('lg:ml-[72px]')
      })
    })

    it('should update layout when localStorage changes (storage event)', async () => {
      const { container, rerender } = render(
        <MainLayout>
          <div>Content</div>
        </MainLayout>
      )

      // Change localStorage
      localStorageMock.getItem.mockReturnValue('true')

      // Simulate storage event
      const storageEvent = new StorageEvent('storage')
      const handler = eventListeners['storage']?.[0]
      if (handler) {
        handler(storageEvent)
      }

      // Force re-render to see the change
      rerender(
        <MainLayout>
          <div>Content</div>
        </MainLayout>
      )

      await waitFor(() => {
        expect(localStorageMock.getItem).toHaveBeenCalledWith('sidebar-collapsed')
      })
    })

    it('should clean up event listeners on unmount', () => {
      const { unmount } = render(
        <MainLayout>
          <div>Content</div>
        </MainLayout>
      )

      unmount()

      expect(mockRemoveEventListener).toHaveBeenCalledWith('storage', expect.any(Function))
      expect(mockRemoveEventListener).toHaveBeenCalledWith('sidebar-toggle', expect.any(Function))
    })
  })

  describe('Responsive Design', () => {
    it('should apply responsive margin class', () => {
      const { container } = render(
        <MainLayout>
          <div>Content</div>
        </MainLayout>
      )

      const mainContent = container.querySelector('div.transition-all')
      // Should have lg: prefix for large screens only
      expect(mainContent?.className).toMatch(/lg:ml-/)
    })

    it('should maintain full width on mobile', () => {
      const { container } = render(
        <MainLayout>
          <div>Content</div>
        </MainLayout>
      )

      const mainContent = container.querySelector('div.transition-all')
      // Should not have margin on mobile (no ml- without lg: prefix)
      expect(mainContent?.className).not.toMatch(/^ml-/)
    })
  })

  describe('Children Rendering', () => {
    it('should render multiple children correctly', () => {
      render(
        <MainLayout>
          <div data-testid="child-1">First Child</div>
          <div data-testid="child-2">Second Child</div>
          <div data-testid="child-3">Third Child</div>
        </MainLayout>
      )

      expect(screen.getByTestId('child-1')).toBeInTheDocument()
      expect(screen.getByTestId('child-2')).toBeInTheDocument()
      expect(screen.getByTestId('child-3')).toBeInTheDocument()
    })

    it('should render React fragments as children', () => {
      render(
        <MainLayout>
          <>
            <div data-testid="fragment-child-1">Fragment Child 1</div>
            <div data-testid="fragment-child-2">Fragment Child 2</div>
          </>
        </MainLayout>
      )

      expect(screen.getByTestId('fragment-child-1')).toBeInTheDocument()
      expect(screen.getByTestId('fragment-child-2')).toBeInTheDocument()
    })

    it('should render null children without error', () => {
      expect(() => {
        render(
          <MainLayout>
            {null}
          </MainLayout>
        )
      }).not.toThrow()
    })

    it('should render conditional children', () => {
      const showContent = true
      render(
        <MainLayout>
          {showContent && <div data-testid="conditional">Conditional Content</div>}
        </MainLayout>
      )

      expect(screen.getByTestId('conditional')).toBeInTheDocument()
    })
  })

  describe('Integration', () => {
    it('should work with nested layouts', () => {
      render(
        <MainLayout>
          <div className="nested-layout">
            <aside>Nested Sidebar</aside>
            <main>Nested Content</main>
          </div>
        </MainLayout>
      )

      expect(screen.getByText('Nested Sidebar')).toBeInTheDocument()
      expect(screen.getByText('Nested Content')).toBeInTheDocument()
    })

    it('should preserve children props and events', () => {
      const handleClick = jest.fn()

      render(
        <MainLayout>
          <button onClick={handleClick} data-testid="clickable">
            Click Me
          </button>
        </MainLayout>
      )

      const button = screen.getByTestId('clickable')
      button.click()

      expect(handleClick).toHaveBeenCalled()
    })
  })

  describe('Accessibility', () => {
    it('should have proper landmark roles', () => {
      const { container } = render(
        <MainLayout>
          <div>Content</div>
        </MainLayout>
      )

      expect(container.querySelector('main')).toBeInTheDocument()
      expect(container.querySelector('header')).toBeInTheDocument()
    })

    it('should maintain semantic HTML structure', () => {
      const { container } = render(
        <MainLayout>
          <h1>Page Title</h1>
          <p>Page content</p>
        </MainLayout>
      )

      const main = container.querySelector('main')
      expect(main?.querySelector('h1')).toBeInTheDocument()
      expect(main?.querySelector('p')).toBeInTheDocument()
    })
  })
})
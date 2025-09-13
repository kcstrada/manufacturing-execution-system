import React from 'react'
import { render, screen } from '@testing-library/react'
import { PermissionGate, CanView, CanEdit, RequireRole } from './PermissionGate'
import { PermissionProvider } from '../contexts/PermissionContext'

const mockCheckPermission = jest.fn()
const mockHasRole = jest.fn()
const mockHasAnyRole = jest.fn()
const mockHasAllRoles = jest.fn()

jest.mock('../contexts/PermissionContext', () => ({
  ...jest.requireActual('../contexts/PermissionContext'),
  usePermissionContext: () => ({
    checkPermission: mockCheckPermission,
    checkMultiplePermissions: jest.fn(),
    hasRole: mockHasRole,
    hasAnyRole: mockHasAnyRole,
    hasAllRoles: mockHasAllRoles,
    isLoading: false,
    error: null,
  }),
}))

jest.mock('../hooks/usePermission', () => ({
  usePermission: (options: any) => ({
    hasPermission: options.skip ? null : mockCheckPermission(),
    isLoading: false,
    error: null,
    checkPermission: jest.fn(),
  }),
}))

jest.mock('../hooks/useRole', () => ({
  useRole: (options: any) => {
    if (options.role) {
      return mockHasRole(options.role)
    }
    if (options.roles && options.requireAll) {
      return mockHasAllRoles(options.roles)
    }
    if (options.roles) {
      return mockHasAnyRole(options.roles)
    }
    return false
  },
}))

describe('PermissionGate', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <PermissionProvider
      apiUrl="http://localhost:8081"
      storeId="01ARZ3NDEKTSV4RRFFQ69G5FAV"
      userId="user123"
      userRoles={['admin']}
    >
      {children}
    </PermissionProvider>
  )

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('PermissionGate component', () => {
    it('should render children when permission is granted', () => {
      mockCheckPermission.mockReturnValue(true)

      render(
        <PermissionGate relation="viewer" object="order:123">
          <div>Protected Content</div>
        </PermissionGate>,
        { wrapper }
      )

      expect(screen.getByText('Protected Content')).toBeInTheDocument()
    })

    it('should render fallback when permission is denied', () => {
      mockCheckPermission.mockReturnValue(false)

      render(
        <PermissionGate
          relation="editor"
          object="order:123"
          fallback={<div>Access Denied</div>}
        >
          <div>Protected Content</div>
        </PermissionGate>,
        { wrapper }
      )

      expect(screen.getByText('Access Denied')).toBeInTheDocument()
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
    })

    it('should render children when role matches', () => {
      mockHasRole.mockReturnValue(true)

      render(
        <PermissionGate role="admin">
          <div>Admin Content</div>
        </PermissionGate>,
        { wrapper }
      )

      expect(screen.getByText('Admin Content')).toBeInTheDocument()
    })

    it('should check multiple roles with requireAll', () => {
      mockHasAllRoles.mockReturnValue(true)

      render(
        <PermissionGate roles={['admin', 'executive']} requireAll>
          <div>Multi-Role Content</div>
        </PermissionGate>,
        { wrapper }
      )

      expect(screen.getByText('Multi-Role Content')).toBeInTheDocument()
    })

    it('should check any of multiple roles', () => {
      mockHasAnyRole.mockReturnValue(true)

      render(
        <PermissionGate roles={['admin', 'executive']}>
          <div>Any Role Content</div>
        </PermissionGate>,
        { wrapper }
      )

      expect(screen.getByText('Any Role Content')).toBeInTheDocument()
    })

    it('should check both permission and role', () => {
      mockCheckPermission.mockReturnValue(true)
      mockHasRole.mockReturnValue(true)

      render(
        <PermissionGate relation="viewer" object="order:123" role="admin">
          <div>Combined Check Content</div>
        </PermissionGate>,
        { wrapper }
      )

      expect(screen.getByText('Combined Check Content')).toBeInTheDocument()
    })

    it('should deny access when permission passes but role fails', () => {
      mockCheckPermission.mockReturnValue(true)
      mockHasRole.mockReturnValue(false)

      render(
        <PermissionGate
          relation="viewer"
          object="order:123"
          role="admin"
          fallback={<div>Access Denied</div>}
        >
          <div>Combined Check Content</div>
        </PermissionGate>,
        { wrapper }
      )

      expect(screen.getByText('Access Denied')).toBeInTheDocument()
      expect(screen.queryByText('Combined Check Content')).not.toBeInTheDocument()
    })
  })

  describe('CanView component', () => {
    it('should render children when view permission is granted', () => {
      mockCheckPermission.mockReturnValue(true)

      render(
        <CanView object="order:123">
          <div>View Content</div>
        </CanView>,
        { wrapper }
      )

      expect(screen.getByText('View Content')).toBeInTheDocument()
    })

    it('should render fallback when view permission is denied', () => {
      mockCheckPermission.mockReturnValue(false)

      render(
        <CanView object="order:123" fallback={<div>Cannot View</div>}>
          <div>View Content</div>
        </CanView>,
        { wrapper }
      )

      expect(screen.getByText('Cannot View')).toBeInTheDocument()
    })
  })

  describe('CanEdit component', () => {
    it('should render children when edit permission is granted', () => {
      mockCheckPermission.mockReturnValue(true)

      render(
        <CanEdit object="task:456">
          <button>Edit Task</button>
        </CanEdit>,
        { wrapper }
      )

      expect(screen.getByText('Edit Task')).toBeInTheDocument()
    })

    it('should render fallback when edit permission is denied', () => {
      mockCheckPermission.mockReturnValue(false)

      render(
        <CanEdit object="task:456" fallback={<div>Read Only</div>}>
          <button>Edit Task</button>
        </CanEdit>,
        { wrapper }
      )

      expect(screen.getByText('Read Only')).toBeInTheDocument()
    })
  })

  describe('RequireRole component', () => {
    it('should render children when role matches', () => {
      mockHasRole.mockReturnValue(true)

      render(
        <RequireRole role="admin">
          <div>Admin Section</div>
        </RequireRole>,
        { wrapper }
      )

      expect(screen.getByText('Admin Section')).toBeInTheDocument()
    })

    it('should check multiple roles', () => {
      mockHasAnyRole.mockReturnValue(true)

      render(
        <RequireRole roles={['admin', 'executive']}>
          <div>Management Section</div>
        </RequireRole>,
        { wrapper }
      )

      expect(screen.getByText('Management Section')).toBeInTheDocument()
    })

    it('should require all roles when specified', () => {
      mockHasAllRoles.mockReturnValue(false)

      render(
        <RequireRole
          roles={['admin', 'executive']}
          requireAll
          fallback={<div>Insufficient Roles</div>}
        >
          <div>Super Admin Section</div>
        </RequireRole>,
        { wrapper }
      )

      expect(screen.getByText('Insufficient Roles')).toBeInTheDocument()
    })
  })
})
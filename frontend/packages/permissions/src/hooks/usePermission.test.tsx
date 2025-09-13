import React from 'react'
import { renderHook, waitFor } from '@testing-library/react'
import { usePermission } from './usePermission'
import { PermissionProvider } from '../contexts/PermissionContext'

const mockCheckPermission = jest.fn()
jest.mock('../contexts/PermissionContext', () => ({
  ...jest.requireActual('../contexts/PermissionContext'),
  usePermissionContext: () => ({
    checkPermission: mockCheckPermission,
    checkMultiplePermissions: jest.fn(),
    hasRole: jest.fn(),
    hasAnyRole: jest.fn(),
    hasAllRoles: jest.fn(),
    isLoading: false,
    error: null,
  }),
}))

describe('usePermission', () => {
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

  it('should check permission on mount', async () => {
    mockCheckPermission.mockResolvedValue(true)

    const { result } = renderHook(
      () =>
        usePermission({
          relation: 'viewer',
          object: 'order:123',
        }),
      { wrapper }
    )

    await waitFor(() => {
      expect(result.current.hasPermission).toBe(true)
    })

    expect(mockCheckPermission).toHaveBeenCalledWith('viewer', 'order:123')
  })

  it('should handle permission denied', async () => {
    mockCheckPermission.mockResolvedValue(false)

    const { result } = renderHook(
      () =>
        usePermission({
          relation: 'editor',
          object: 'order:123',
        }),
      { wrapper }
    )

    await waitFor(() => {
      expect(result.current.hasPermission).toBe(false)
    })
  })

  it('should skip check when skip is true', async () => {
    const { result } = renderHook(
      () =>
        usePermission({
          relation: 'viewer',
          object: 'order:123',
          skip: true,
        }),
      { wrapper }
    )

    await waitFor(() => {
      expect(result.current.hasPermission).toBe(null)
    })

    expect(mockCheckPermission).not.toHaveBeenCalled()
  })

  it('should call onSuccess when permission is granted', async () => {
    mockCheckPermission.mockResolvedValue(true)
    const onSuccess = jest.fn()

    renderHook(
      () =>
        usePermission({
          relation: 'viewer',
          object: 'order:123',
          onSuccess,
        }),
      { wrapper }
    )

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled()
    })
  })

  it('should call onError when permission check fails', async () => {
    const error = new Error('Permission check failed')
    mockCheckPermission.mockRejectedValue(error)
    const onError = jest.fn()

    const { result } = renderHook(
      () =>
        usePermission({
          relation: 'viewer',
          object: 'order:123',
          onError,
        }),
      { wrapper }
    )

    await waitFor(() => {
      expect(result.current.error).toBeTruthy()
    })

    expect(onError).toHaveBeenCalledWith(error)
  })

  it('should handle loading state', async () => {
    let resolvePromise: (value: boolean) => void
    const promise = new Promise<boolean>((resolve) => {
      resolvePromise = resolve
    })
    mockCheckPermission.mockReturnValue(promise)

    const { result } = renderHook(
      () =>
        usePermission({
          relation: 'viewer',
          object: 'order:123',
        }),
      { wrapper }
    )

    expect(result.current.isLoading).toBe(true)

    resolvePromise!(true)

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
      expect(result.current.hasPermission).toBe(true)
    })
  })
})
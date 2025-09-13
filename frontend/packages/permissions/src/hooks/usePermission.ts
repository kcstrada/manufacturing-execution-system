import { useState, useEffect, useCallback } from 'react'
import { usePermissionContext } from '../contexts/PermissionContext'
import { UsePermissionOptions } from '../types/permissions.types'

export interface UsePermissionResult {
  hasPermission: boolean | null
  isLoading: boolean
  error: Error | null
  checkPermission: () => Promise<void>
}

export const usePermission = (options: UsePermissionOptions): UsePermissionResult => {
  const { relation, object, skip = false, onSuccess, onError } = options
  const { checkPermission: checkPermissionContext, isLoading: contextLoading, error: contextError } = usePermissionContext()
  
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const checkPermission = useCallback(async () => {
    if (skip) {
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const result = await checkPermissionContext(relation, object)
      setHasPermission(result)
      
      if (result && onSuccess) {
        onSuccess()
      }
    } catch (err) {
      const error = err as Error
      setError(error)
      setHasPermission(false)
      
      if (onError) {
        onError(error)
      }
    } finally {
      setIsLoading(false)
    }
  }, [relation, object, skip, checkPermissionContext, onSuccess, onError])

  useEffect(() => {
    checkPermission()
  }, [checkPermission])

  return {
    hasPermission,
    isLoading: isLoading || contextLoading,
    error: error || contextError,
    checkPermission,
  }
}
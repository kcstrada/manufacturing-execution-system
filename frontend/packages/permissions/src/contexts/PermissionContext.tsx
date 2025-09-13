import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { OpenFgaClient, CredentialsMethod } from '@openfga/sdk'
import { PermissionContext as IPermissionContext, PermissionCheckRequest } from '../types/permissions.types'

const PermissionContext = createContext<IPermissionContext | undefined>(undefined)

export interface PermissionProviderProps {
  children: React.ReactNode
  apiUrl: string
  storeId: string
  userId: string | null
  userRoles?: string[]
  token?: string | null
}

export const PermissionProvider: React.FC<PermissionProviderProps> = ({
  children,
  apiUrl,
  storeId,
  userId,
  userRoles = [],
  token,
}) => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [client, setClient] = useState<OpenFgaClient | null>(null)

  useEffect(() => {
    if (!apiUrl || !storeId) {
      return
    }

    const fgaClient = new OpenFgaClient({
      apiUrl,
      storeId,
      credentials: token
        ? {
            method: CredentialsMethod.ApiToken,
            config: {
              token,
            },
          }
        : {
            method: CredentialsMethod.None,
          },
    })

    setClient(fgaClient)
  }, [apiUrl, storeId, token])

  const checkPermission = useCallback(
    async (relation: string, object: string): Promise<boolean> => {
      if (!client || !userId) {
        return false
      }

      setIsLoading(true)
      setError(null)

      try {
        const response = await client.check({
          user: `user:${userId}`,
          relation,
          object,
        })

        return response.allowed ?? false
      } catch (err) {
        const error = err as Error
        setError(error)
        console.error('Permission check failed:', error)
        return false
      } finally {
        setIsLoading(false)
      }
    },
    [client, userId]
  )

  const checkMultiplePermissions = useCallback(
    async (checks: Omit<PermissionCheckRequest, 'user'>[]): Promise<boolean[]> => {
      if (!client || !userId) {
        return checks.map(() => false)
      }

      setIsLoading(true)
      setError(null)

      try {
        const results = await Promise.all(
          checks.map(async (check) => {
            try {
              const response = await client.check({
                user: `user:${userId}`,
                relation: check.relation,
                object: check.object,
              })
              return response.allowed ?? false
            } catch {
              return false
            }
          })
        )

        return results
      } catch (err) {
        const error = err as Error
        setError(error)
        console.error('Multiple permission checks failed:', error)
        return checks.map(() => false)
      } finally {
        setIsLoading(false)
      }
    },
    [client, userId]
  )

  const hasRole = useCallback(
    (role: string): boolean => {
      return userRoles.includes(role)
    },
    [userRoles]
  )

  const hasAnyRole = useCallback(
    (roles: string[]): boolean => {
      return roles.some(role => userRoles.includes(role))
    },
    [userRoles]
  )

  const hasAllRoles = useCallback(
    (roles: string[]): boolean => {
      return roles.every(role => userRoles.includes(role))
    },
    [userRoles]
  )

  const value: IPermissionContext = {
    checkPermission,
    checkMultiplePermissions,
    hasRole,
    hasAnyRole,
    hasAllRoles,
    isLoading,
    error,
  }

  return <PermissionContext.Provider value={value}>{children}</PermissionContext.Provider>
}

export const usePermissionContext = (): IPermissionContext => {
  const context = useContext(PermissionContext)
  if (!context) {
    throw new Error('usePermissionContext must be used within a PermissionProvider')
  }
  return context
}
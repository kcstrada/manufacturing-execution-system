import React, { ComponentType } from 'react'
import { PermissionGate } from '../components/PermissionGate'
import { PermissionRelation, PermissionObject } from '../types/permissions.types'

export interface WithPermissionOptions {
  relation?: PermissionRelation
  object?: PermissionObject
  role?: string
  roles?: string[]
  requireAll?: boolean
  fallback?: React.ReactNode
  loading?: React.ReactNode
}

export function withPermission<P extends object>(
  Component: ComponentType<P>,
  options: WithPermissionOptions
): ComponentType<P> {
  const WrappedComponent = (props: P) => {
    return (
      <PermissionGate
        relation={options.relation}
        object={options.object}
        role={options.role}
        roles={options.roles}
        requireAll={options.requireAll}
        fallback={options.fallback}
        loading={options.loading}
      >
        <Component {...props} />
      </PermissionGate>
    )
  }

  WrappedComponent.displayName = `withPermission(${Component.displayName || Component.name})`

  return WrappedComponent
}

export function withRole<P extends object>(
  Component: ComponentType<P>,
  role: string | string[],
  options?: {
    requireAll?: boolean
    fallback?: React.ReactNode
  }
): ComponentType<P> {
  return withPermission(Component, {
    role: typeof role === 'string' ? role : undefined,
    roles: Array.isArray(role) ? role : undefined,
    requireAll: options?.requireAll,
    fallback: options?.fallback,
  })
}

export function withViewPermission<P extends object>(
  Component: ComponentType<P>,
  object: PermissionObject,
  options?: {
    fallback?: React.ReactNode
    loading?: React.ReactNode
  }
): ComponentType<P> {
  return withPermission(Component, {
    relation: 'viewer',
    object,
    fallback: options?.fallback,
    loading: options?.loading,
  })
}

export function withEditPermission<P extends object>(
  Component: ComponentType<P>,
  object: PermissionObject,
  options?: {
    fallback?: React.ReactNode
    loading?: React.ReactNode
  }
): ComponentType<P> {
  return withPermission(Component, {
    relation: 'editor',
    object,
    fallback: options?.fallback,
    loading: options?.loading,
  })
}
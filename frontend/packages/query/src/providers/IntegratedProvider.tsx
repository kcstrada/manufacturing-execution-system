'use client'

import React from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { queryClient as defaultQueryClient } from '../queryClient'

interface IntegratedQueryProviderProps {
  children: React.ReactNode
  enableDevtools?: boolean
}

/**
 * Integrated provider that combines TanStack Query with Redux
 * This provider should be used alongside Redux Provider
 */
export function IntegratedQueryProvider({
  children,
  enableDevtools = process.env.NODE_ENV === 'development'
}: IntegratedQueryProviderProps) {
  // The query client is configured to work alongside Redux
  // Redux handles auth and UI state, TanStack Query handles server state

  return (
    <QueryClientProvider client={defaultQueryClient}>
      {children}
      {enableDevtools && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  )
}
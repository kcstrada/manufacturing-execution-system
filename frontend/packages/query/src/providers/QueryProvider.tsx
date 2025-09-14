'use client'

import React from 'react'
import {
  QueryClientProvider,
  QueryClient,
} from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { queryClient as defaultQueryClient } from '../queryClient'

interface QueryProviderProps {
  children: React.ReactNode
  client?: QueryClient
  enableDevtools?: boolean
}

export function QueryProvider({
  children,
  client = defaultQueryClient,
  enableDevtools = process.env.NODE_ENV === 'development'
}: QueryProviderProps) {
  return (
    <QueryClientProvider client={client}>
      {children}
      {enableDevtools && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  )
}
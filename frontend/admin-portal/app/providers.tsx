'use client'

import { StoreProvider } from '@mes/store'
import { IntegratedQueryProvider } from '@mes/query'
import { AuthProvider } from '@mes/auth'
import { ReactNode } from 'react'

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <StoreProvider>
      <IntegratedQueryProvider>
        <AuthProvider>
          {children}
        </AuthProvider>
      </IntegratedQueryProvider>
    </StoreProvider>
  )
}
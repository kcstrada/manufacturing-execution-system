'use client'

import { StoreProvider } from '@mes/store'
import { AuthProvider } from '@mes/auth'
import { ReactNode } from 'react'

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <StoreProvider>
      <AuthProvider>
        {children}
      </AuthProvider>
    </StoreProvider>
  )
}
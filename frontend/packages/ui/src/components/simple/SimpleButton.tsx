import * as React from 'react'

export interface SimpleButtonProps {
  children: React.ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary'
  disabled?: boolean
}

export function SimpleButton({ 
  children, 
  onClick, 
  variant = 'primary',
  disabled = false 
}: SimpleButtonProps) {
  const variantClass = variant === 'primary' ? 'btn-primary' : 'btn-secondary'
  
  return (
    <button
      className={`btn ${variantClass}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  )
}
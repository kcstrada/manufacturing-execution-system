import React from 'react'

export interface BadgeProps {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'accent' | 'ghost' | 'info' | 'success' | 'warning' | 'error'
  size?: 'xs' | 'sm' | 'md' | 'lg'
  outline?: boolean
  dot?: boolean
  className?: string
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  outline = false,
  dot = false,
  className = ''
}) => {
  const baseClass = 'badge'
  const variantClass = variant ? `badge-${variant}` : ''
  const sizeClass = size ? `badge-${size}` : ''
  const outlineClass = outline ? 'badge-outline' : ''
  
  const classes = [
    baseClass,
    variantClass,
    sizeClass,
    outlineClass,
    className
  ].filter(Boolean).join(' ')

  if (dot) {
    return (
      <div className="flex items-center gap-1">
        <span className={`w-2 h-2 rounded-full bg-current opacity-75`}></span>
        <span className={classes}>{children}</span>
      </div>
    )
  }

  return (
    <span className={classes}>
      {children}
    </span>
  )
}
import React from 'react'
import { cn } from '../../utils/cn'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'ghost' | 'link' | 'outline' | 'error' | 'warning' | 'success'
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  isLoading?: boolean
  fullWidth?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    children, 
    variant = 'primary',
    size = 'md',
    isLoading = false,
    fullWidth = false,
    leftIcon,
    rightIcon,
    className = '',
    disabled,
    ...props 
  }, ref) => {
    // Base button styles with Unimore design
    const baseStyles = [
      'btn',
      'font-poppins',
      'font-medium',
      'transition-all',
      'duration-300',
      'rounded-md',
      'inline-flex',
      'items-center',
      'justify-center',
      'border-2',
      'focus:outline-none',
      'focus:ring-2',
      'focus:ring-offset-2',
      'disabled:opacity-50',
      'disabled:cursor-not-allowed',
    ]

    // Variant styles aligned with Unimore colors
    const variantStyles = {
      primary: [
        'bg-unimore-blue',
        'hover:bg-unimore-blue-dark',
        'text-white',
        'border-unimore-blue',
        'hover:border-unimore-blue-dark',
        'focus:ring-unimore-blue',
        'hover:shadow-hover',
      ],
      secondary: [
        'bg-unimore-navy',
        'hover:bg-unimore-navy-dark',
        'text-white',
        'border-unimore-navy',
        'hover:border-unimore-navy-dark',
        'focus:ring-unimore-navy',
        'hover:shadow-hover',
      ],
      accent: [
        'bg-unimore-blue-light',
        'hover:bg-unimore-blue',
        'text-white',
        'border-unimore-blue-light',
        'hover:border-unimore-blue',
        'focus:ring-unimore-blue-light',
        'hover:shadow-hover',
      ],
      ghost: [
        'bg-transparent',
        'hover:bg-unimore-blue-ice',
        'text-unimore-navy',
        'border-transparent',
        'hover:border-unimore-blue-ice',
        'focus:ring-unimore-blue',
      ],
      link: [
        'bg-transparent',
        'hover:bg-transparent',
        'text-unimore-blue',
        'hover:text-unimore-blue-dark',
        'border-transparent',
        'hover:border-transparent',
        'underline-offset-4',
        'hover:underline',
        'focus:ring-unimore-blue',
      ],
      outline: [
        'bg-transparent',
        'hover:bg-unimore-blue',
        'text-unimore-blue',
        'hover:text-white',
        'border-unimore-blue',
        'hover:border-unimore-blue-dark',
        'focus:ring-unimore-blue',
      ],
      error: [
        'bg-error',
        'hover:bg-red-600',
        'text-white',
        'border-error',
        'hover:border-red-600',
        'focus:ring-error',
      ],
      warning: [
        'bg-warning',
        'hover:bg-amber-600',
        'text-white',
        'border-warning',
        'hover:border-amber-600',
        'focus:ring-warning',
      ],
      success: [
        'bg-success',
        'hover:bg-green-600',
        'text-white',
        'border-success',
        'hover:border-green-600',
        'focus:ring-success',
      ],
    }

    // Size styles
    const sizeStyles = {
      xs: 'btn-xs text-xs px-2 py-1',
      sm: 'btn-sm text-sm px-3 py-1.5',
      md: 'btn-md text-base px-4 py-2',
      lg: 'btn-lg text-lg px-6 py-3',
      xl: 'btn-xl text-xl px-8 py-4',
    }

    return (
      <button
        ref={ref}
        className={cn(
          baseStyles,
          variantStyles[variant],
          sizeStyles[size],
          fullWidth && 'w-full',
          isLoading && 'loading',
          className
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        {leftIcon && !isLoading && <span className="mr-2">{leftIcon}</span>}
        {children}
        {rightIcon && !isLoading && <span className="ml-2">{rightIcon}</span>}
      </button>
    )
  }
)

Button.displayName = 'Button'
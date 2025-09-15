import React, { forwardRef } from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'accent' | 'info' | 'success' | 'warning' | 'error' | 'ghost' | 'link' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  outline?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  variant = 'primary',
  size = 'md',
  outline = false,
  loading = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  children,
  className = '',
  disabled,
  ...props
}, ref) => {
  // Use DaisyUI with Unimore theme (defined in tailwind config)
  const variantClasses = {
    default: 'btn',
    primary: 'btn btn-primary', // Uses Unimore blue from theme
    secondary: 'btn btn-secondary', // Uses Unimore navy from theme
    accent: 'btn btn-accent', // Uses Unimore light blue from theme
    info: 'btn btn-info',
    success: 'btn btn-success',
    warning: 'btn btn-warning',
    error: 'btn btn-error',
    ghost: 'btn btn-ghost',
    link: 'btn btn-link',
    outline: 'btn btn-outline btn-primary'
  };

  const sizeClasses = {
    sm: 'btn-sm',
    md: '',
    lg: 'btn-lg'
  };

  const buttonClasses = [
    variantClasses[variant],
    sizeClasses[size],
    outline && variant !== 'outline' ? 'btn-outline' : '',
    fullWidth ? 'btn-block w-full' : '',
    loading ? 'loading' : '',
    'font-poppins transition-all hover:shadow-md',
    className
  ].filter(Boolean).join(' ');

  return (
    <button
      ref={ref}
      className={buttonClasses}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <span className="loading loading-spinner loading-sm"></span>}
      {leftIcon && !loading && <span className="inline-flex items-center mr-2">{leftIcon}</span>}
      {children}
      {rightIcon && !loading && <span className="inline-flex items-center ml-2">{rightIcon}</span>}
    </button>
  );
});
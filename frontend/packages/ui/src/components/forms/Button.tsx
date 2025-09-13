import React, { forwardRef } from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'accent' | 'info' | 'success' | 'warning' | 'error' | 'ghost' | 'link';
  size?: 'sm' | 'md' | 'lg';
  outline?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  variant = 'default',
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
  const variantClasses = {
    default: 'btn',
    primary: 'btn btn-primary',
    secondary: 'btn btn-secondary',
    accent: 'btn btn-accent',
    info: 'btn btn-info',
    success: 'btn btn-success',
    warning: 'btn btn-warning',
    error: 'btn btn-error',
    ghost: 'btn btn-ghost',
    link: 'btn btn-link'
  };

  const sizeClasses = {
    sm: 'btn-sm',
    md: '',
    lg: 'btn-lg'
  };

  const buttonClasses = [
    variantClasses[variant],
    sizeClasses[size],
    outline ? 'btn-outline' : '',
    fullWidth ? 'btn-block' : '',
    loading ? 'loading' : '',
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
      {leftIcon && !loading && <span className="w-4 h-4">{leftIcon}</span>}
      {children}
      {rightIcon && !loading && <span className="w-4 h-4">{rightIcon}</span>}
    </button>
  );
});
import React, { forwardRef } from 'react';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  helperText?: string;
  variant?: 'default' | 'bordered' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  helperText,
  variant = 'default',
  size = 'md',
  fullWidth = false,
  leftIcon,
  rightIcon,
  className = '',
  ...props
}, ref) => {
  const variantClasses = {
    default: 'input input-bordered',
    bordered: 'input input-bordered',
    ghost: 'input input-ghost'
  };

  const sizeClasses = {
    sm: 'input-sm',
    md: '',
    lg: 'input-lg'
  };

  const inputClasses = [
    variantClasses[variant],
    sizeClasses[size],
    error ? 'input-error' : '',
    fullWidth ? 'w-full' : '',
    leftIcon || rightIcon ? 'pl-10' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={`form-control ${fullWidth ? 'w-full' : ''}`}>
      {label && (
        <label className="label">
          <span className="label-text">{label}</span>
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-base-content/50 w-5 h-5">{leftIcon}</span>
          </div>
        )}
        <input
          ref={ref}
          className={inputClasses}
          {...props}
        />
        {rightIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <span className="text-base-content/50 w-5 h-5">{rightIcon}</span>
          </div>
        )}
      </div>
      {(error || helperText) && (
        <label className="label">
          <span className={`label-text-alt ${error ? 'text-error' : 'text-base-content/70'}`}>
            {error || helperText}
          </span>
        </label>
      )}
    </div>
  );
});
import React, { forwardRef } from 'react';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: string;
  error?: string;
  helperText?: string;
  options: SelectOption[];
  placeholder?: string;
  variant?: 'default' | 'bordered' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(({
  label,
  error,
  helperText,
  options,
  placeholder = 'Select an option...',
  variant = 'default',
  size = 'md',
  fullWidth = false,
  className = '',
  ...props
}, ref) => {
  const variantClasses = {
    default: 'select select-bordered',
    bordered: 'select select-bordered',
    ghost: 'select select-ghost'
  };

  const sizeClasses = {
    sm: 'select-sm',
    md: '',
    lg: 'select-lg'
  };

  const selectClasses = [
    variantClasses[variant],
    sizeClasses[size],
    error ? 'select-error' : '',
    fullWidth ? 'w-full' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={`form-control ${fullWidth ? 'w-full' : ''}`}>
      {label && (
        <label className="label">
          <span className="label-text">{label}</span>
        </label>
      )}
      <select
        ref={ref}
        className={selectClasses}
        {...props}
      >
        <option disabled value="">
          {placeholder}
        </option>
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
      </select>
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
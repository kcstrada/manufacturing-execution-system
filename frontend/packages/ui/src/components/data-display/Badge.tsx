import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'primary' | 'secondary' | 'accent' | 'info' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md' | 'lg';
  outline?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({ 
  children, 
  className = '',
  variant = 'default',
  size = 'md',
  outline = false
}) => {
  const variantClasses = {
    default: 'badge',
    primary: 'badge badge-primary',
    secondary: 'badge badge-secondary',
    accent: 'badge badge-accent',
    info: 'badge badge-info',
    success: 'badge badge-success',
    warning: 'badge badge-warning',
    error: 'badge badge-error'
  };

  const sizeClasses = {
    sm: 'badge-sm',
    md: '',
    lg: 'badge-lg'
  };

  const badgeClasses = [
    variantClasses[variant],
    sizeClasses[size],
    outline ? 'badge-outline' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <span className={badgeClasses}>
      {children}
    </span>
  );
};
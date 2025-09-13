import React from 'react';

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  variant?: 'default' | 'bordered' | 'compact';
  shadow?: 'none' | 'sm' | 'md' | 'lg';
  clickable?: boolean;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  className = '',
  title,
  subtitle,
  actions,
  variant = 'default',
  shadow = 'md',
  clickable = false,
  onClick
}) => {
  const variantClasses = {
    default: 'card bg-base-100',
    bordered: 'card bg-base-100 bordered',
    compact: 'card card-compact bg-base-100'
  };

  const shadowClasses = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg'
  };

  const cardClasses = [
    variantClasses[variant],
    shadowClasses[shadow],
    clickable || onClick ? 'cursor-pointer hover:shadow-lg transition-shadow' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div 
      className={cardClasses}
      onClick={onClick}
    >
      {(title || subtitle || actions) && (
        <div className="card-body">
          {(title || subtitle) && (
            <div className="flex justify-between items-start">
              <div>
                {title && <h2 className="card-title">{title}</h2>}
                {subtitle && <p className="text-base-content/70">{subtitle}</p>}
              </div>
              {actions && <div className="card-actions">{actions}</div>}
            </div>
          )}
          {!title && !subtitle && actions && (
            <div className="card-actions justify-end">{actions}</div>
          )}
          {children}
        </div>
      )}
      {!title && !subtitle && !actions && (
        <div className="card-body">
          {children}
        </div>
      )}
    </div>
  );
};
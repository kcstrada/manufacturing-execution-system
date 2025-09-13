import React from 'react';

export interface MetricsCardProps {
  title: string;
  value: string | number;
  unit?: string;
  change?: {
    value: number;
    period: string;
    direction: 'up' | 'down' | 'neutral';
  };
  target?: {
    value: number;
    label?: string;
  };
  icon?: React.ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error';
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const MetricsCard: React.FC<MetricsCardProps> = ({
  title,
  value,
  unit,
  change,
  target,
  icon,
  variant = 'default',
  className = '',
  size = 'md'
}) => {
  const variantClasses = {
    default: 'bg-base-100 border-base-200',
    primary: 'bg-primary/10 border-primary/20',
    success: 'bg-success/10 border-success/20',
    warning: 'bg-warning/10 border-warning/20',
    error: 'bg-error/10 border-error/20'
  };

  const sizeClasses = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6'
  };

  const valueSizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl'
  };

  const getChangeIcon = (direction: 'up' | 'down' | 'neutral') => {
    if (direction === 'up') {
      return (
        <svg className="w-4 h-4 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 17l9.2-9.2M17 17V7H7" />
        </svg>
      );
    }
    if (direction === 'down') {
      return (
        <svg className="w-4 h-4 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 7L7.8 16.2M7 7v10h10" />
        </svg>
      );
    }
    return (
      <svg className="w-4 h-4 text-base-content/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 12H6" />
      </svg>
    );
  };

  return (
    <div className={`card border ${variantClasses[variant]} ${className}`}>
      <div className={`card-body ${sizeClasses[size]}`}>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-base-content/70 uppercase tracking-wide">
            {title}
          </h3>
          {icon && (
            <div className="w-6 h-6 text-base-content/50">
              {icon}
            </div>
          )}
        </div>
        
        <div className="flex items-baseline gap-1 mt-1">
          <span className={`font-bold ${valueSizeClasses[size]} text-base-content`}>
            {typeof value === 'number' ? value.toLocaleString() : value}
          </span>
          {unit && (
            <span className="text-sm text-base-content/70">{unit}</span>
          )}
        </div>
        
        <div className="flex items-center justify-between mt-2 text-sm">
          {change && (
            <div className="flex items-center gap-1">
              {getChangeIcon(change.direction)}
              <span className={
                change.direction === 'up' ? 'text-success' :
                change.direction === 'down' ? 'text-error' :
                'text-base-content/50'
              }>
                {Math.abs(change.value)}% {change.period}
              </span>
            </div>
          )}
          
          {target && (
            <div className="text-right">
              <div className="text-base-content/70">
                Target: {target.value.toLocaleString()}{unit}
              </div>
              {target.label && (
                <div className="text-xs text-base-content/50">
                  {target.label}
                </div>
              )}
            </div>
          )}
        </div>
        
        {target && typeof value === 'number' && (
          <div className="mt-2">
            <div className="flex justify-between text-xs mb-1">
              <span>Progress</span>
              <span>{Math.round((value / target.value) * 100)}%</span>
            </div>
            <progress 
              className="progress progress-primary w-full h-2" 
              value={value} 
              max={target.value}
            ></progress>
          </div>
        )}
      </div>
    </div>
  );
};
import React from 'react';

export interface StatusProps {
  status: 'online' | 'offline' | 'idle' | 'busy' | 'error' | 'warning' | 'success';
  label?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showDot?: boolean;
  showLabel?: boolean;
}

export const Status: React.FC<StatusProps> = ({ 
  status, 
  label,
  className = '',
  size = 'md',
  showDot = true,
  showLabel = true
}) => {
  const statusConfig = {
    online: { color: 'bg-success', label: label || 'Online' },
    offline: { color: 'bg-base-300', label: label || 'Offline' },
    idle: { color: 'bg-warning', label: label || 'Idle' },
    busy: { color: 'bg-info', label: label || 'Busy' },
    error: { color: 'bg-error', label: label || 'Error' },
    warning: { color: 'bg-warning', label: label || 'Warning' },
    success: { color: 'bg-success', label: label || 'Success' }
  };

  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  const config = statusConfig[status];

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {showDot && (
        <div className={`rounded-full ${config.color} ${sizeClasses[size]} animate-pulse`} />
      )}
      {showLabel && (
        <span className={`${textSizeClasses[size]} text-base-content`}>
          {config.label}
        </span>
      )}
    </div>
  );
};
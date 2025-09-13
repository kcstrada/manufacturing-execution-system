import React from 'react';

export interface LoadingProps {
  variant?: 'spinner' | 'dots' | 'ring' | 'ball' | 'bars' | 'infinity';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  overlay?: boolean;
  message?: string;
}

export const Loading: React.FC<LoadingProps> = ({
  variant = 'spinner',
  size = 'md',
  className = '',
  overlay = false,
  message
}) => {
  const variantClasses = {
    spinner: 'loading-spinner',
    dots: 'loading-dots',
    ring: 'loading-ring',
    ball: 'loading-ball',
    bars: 'loading-bars',
    infinity: 'loading-infinity'
  };

  const sizeClasses = {
    sm: 'loading-sm',
    md: 'loading-md',
    lg: 'loading-lg'
  };

  const loadingElement = (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <span className={`loading ${variantClasses[variant]} ${sizeClasses[size]}`}></span>
      {message && (
        <p className="mt-2 text-sm text-base-content/70">{message}</p>
      )}
    </div>
  );

  if (overlay) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-base-100 p-6 rounded-lg shadow-lg">
          {loadingElement}
        </div>
      </div>
    );
  }

  return loadingElement;
};

// Skeleton component for loading states
export interface SkeletonProps {
  className?: string;
  width?: string;
  height?: string;
  circle?: boolean;
  count?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  width = '100%',
  height = '1rem',
  circle = false,
  count = 1
}) => {
  const skeletonClass = `animate-pulse bg-base-300 ${circle ? 'rounded-full' : 'rounded'} ${className}`;
  
  if (count === 1) {
    return (
      <div 
        className={skeletonClass}
        style={{ width, height }}
      />
    );
  }

  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={skeletonClass}
          style={{ width, height }}
        />
      ))}
    </div>
  );
};
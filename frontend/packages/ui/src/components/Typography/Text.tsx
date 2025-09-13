import React from 'react';
import { cn } from '../../utils/cn';

export interface TextProps {
  as?: 'p' | 'span' | 'div' | 'label';
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl';
  weight?: 'light' | 'normal' | 'medium' | 'semibold' | 'bold';
  color?: 'navy' | 'blue' | 'gray' | 'primary' | 'secondary' | 'muted' | 'inherit';
  align?: 'left' | 'center' | 'right' | 'justify';
  leading?: 'tight' | 'normal' | 'relaxed' | 'loose';
  tracking?: 'tight' | 'normal' | 'wide' | 'wider' | 'body';
  className?: string;
  children: React.ReactNode;
}

const sizeClasses = {
  xs: 'text-xs',
  sm: 'text-sm',
  base: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
  '2xl': 'text-2xl',
};

const weightClasses = {
  light: 'font-light',
  normal: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',
};

const colorClasses = {
  navy: 'text-unimore-navy',
  blue: 'text-unimore-blue',
  gray: 'text-unimore-gray-600',
  primary: 'text-primary',
  secondary: 'text-secondary',
  muted: 'text-unimore-gray-500',
  inherit: 'text-inherit',
};

const alignClasses = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
  justify: 'text-justify',
};

const leadingClasses = {
  tight: 'leading-tight',
  normal: 'leading-normal',
  relaxed: 'leading-relaxed',
  loose: 'leading-loose',
};

const trackingClasses = {
  tight: 'tracking-tight',
  normal: 'tracking-normal',
  wide: 'tracking-wide',
  wider: 'tracking-wider',
  body: 'tracking-body',
};

export const Text: React.FC<TextProps> = ({
  as = 'p',
  size = 'base',
  weight = 'normal',
  color = 'inherit',
  align = 'left',
  leading = 'normal',
  tracking = 'body',
  className,
  children,
}) => {
  const Component = as;
  
  return (
    <Component
      className={cn(
        'font-poppins',
        sizeClasses[size],
        weightClasses[weight],
        colorClasses[color],
        alignClasses[align],
        leadingClasses[leading],
        trackingClasses[tracking],
        className
      )}
    >
      {children}
    </Component>
  );
};
import React from 'react';
import { cn } from '../../utils/cn';

export interface HeadingProps {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl';
  weight?: 'light' | 'normal' | 'medium' | 'semibold' | 'bold';
  color?: 'navy' | 'blue' | 'primary' | 'secondary' | 'inherit';
  align?: 'left' | 'center' | 'right' | 'justify';
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
  '3xl': 'text-3xl',
  '4xl': 'text-4xl',
  '5xl': 'text-5xl',
  '6xl': 'text-6xl',
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
  primary: 'text-primary',
  secondary: 'text-secondary',
  inherit: 'text-inherit',
};

const alignClasses = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
  justify: 'text-justify',
};

// Default sizes for each heading level
const defaultSizes = {
  h1: '5xl',
  h2: '4xl',
  h3: '3xl',
  h4: '2xl',
  h5: 'xl',
  h6: 'lg',
} as const;

export const Heading: React.FC<HeadingProps> = ({
  as = 'h2',
  size,
  weight = 'bold',
  color = 'navy',
  align = 'left',
  className,
  children,
}) => {
  const Component = as;
  const effectiveSize = size || defaultSizes[as];
  
  return (
    <Component
      className={cn(
        'font-poppins tracking-tight',
        sizeClasses[effectiveSize],
        weightClasses[weight],
        colorClasses[color],
        alignClasses[align],
        className
      )}
    >
      {children}
    </Component>
  );
};
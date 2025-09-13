import React from 'react';

export interface FormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  children: React.ReactNode;
  spacing?: 'sm' | 'md' | 'lg';
}

export const Form: React.FC<FormProps> = ({
  children,
  spacing = 'md',
  className = '',
  ...props
}) => {
  const spacingClasses = {
    sm: 'space-y-2',
    md: 'space-y-4',
    lg: 'space-y-6'
  };

  return (
    <form className={`${spacingClasses[spacing]} ${className}`} {...props}>
      {children}
    </form>
  );
};

// Form Group component for grouping related form elements
export interface FormGroupProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  className?: string;
}

export const FormGroup: React.FC<FormGroupProps> = ({
  children,
  title,
  description,
  className = ''
}) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {title && (
        <h3 className="text-lg font-medium text-base-content">{title}</h3>
      )}
      {description && (
        <p className="text-sm text-base-content/70">{description}</p>
      )}
      <div className="space-y-3">
        {children}
      </div>
    </div>
  );
};
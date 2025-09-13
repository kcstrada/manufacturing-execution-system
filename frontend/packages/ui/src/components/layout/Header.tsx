import React from 'react';

export interface HeaderProps {
  title?: string;
  children?: React.ReactNode;
  className?: string;
  actions?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({ 
  title, 
  children, 
  className = '', 
  actions 
}) => {
  return (
    <header className={`navbar bg-base-100 shadow-sm border-b border-base-200 ${className}`}>
      <div className="navbar-start">
        {title && (
          <h1 className="text-xl font-semibold text-base-content">{title}</h1>
        )}
        {children}
      </div>
      {actions && (
        <div className="navbar-end">
          {actions}
        </div>
      )}
    </header>
  );
};
import React from 'react';

export interface TabItem {
  label: string;
  value: string;
  content?: React.ReactNode;
  disabled?: boolean;
  badge?: string | number;
}

export interface TabNavProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (value: string) => void;
  className?: string;
  variant?: 'default' | 'bordered' | 'lifted';
  size?: 'sm' | 'md' | 'lg';
}

export const TabNav: React.FC<TabNavProps> = ({ 
  tabs, 
  activeTab, 
  onChange, 
  className = '',
  variant = 'default',
  size = 'md'
}) => {
  const variantClasses = {
    default: 'tabs',
    bordered: 'tabs tabs-bordered',
    lifted: 'tabs tabs-lifted'
  };

  const sizeClasses = {
    sm: 'tabs-sm',
    md: '',
    lg: 'tabs-lg'
  };

  return (
    <div className={`${variantClasses[variant]} ${sizeClasses[size]} ${className}`}>
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => !tab.disabled && onChange(tab.value)}
          className={`tab ${activeTab === tab.value ? 'tab-active' : ''} ${
            tab.disabled ? 'tab-disabled' : ''
          }`}
          disabled={tab.disabled}
        >
          <span className="flex items-center gap-2">
            {tab.label}
            {tab.badge && (
              <span className="badge badge-sm">{tab.badge}</span>
            )}
          </span>
        </button>
      ))}
    </div>
  );
};
import React from 'react';

export interface SidebarItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
  children?: SidebarItem[];
}

export interface SidebarProps {
  items: SidebarItem[];
  className?: string;
  width?: 'sm' | 'md' | 'lg';
  collapsible?: boolean;
  collapsed?: boolean;
  onToggle?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  items, 
  className = '',
  width = 'md',
  collapsible = false,
  collapsed = false,
  onToggle
}) => {
  const widthClasses = {
    sm: 'w-48',
    md: 'w-64',
    lg: 'w-80'
  };

  const renderItem = (item: SidebarItem, index: number) => (
    <li key={index}>
      {item.href ? (
        <a 
          href={item.href}
          className={`flex items-center gap-3 ${item.active ? 'active' : ''}`}
        >
          {item.icon && <span className="w-5 h-5">{item.icon}</span>}
          {!collapsed && <span>{item.label}</span>}
        </a>
      ) : (
        <button 
          onClick={item.onClick}
          className={`flex items-center gap-3 w-full ${item.active ? 'active' : ''}`}
        >
          {item.icon && <span className="w-5 h-5">{item.icon}</span>}
          {!collapsed && <span>{item.label}</span>}
        </button>
      )}
      {item.children && !collapsed && (
        <ul className="ml-4">
          {item.children.map((child, childIndex) => renderItem(child, childIndex))}
        </ul>
      )}
    </li>
  );

  return (
    <aside className={`${collapsed ? 'w-16' : widthClasses[width]} min-h-screen bg-base-200 ${className}`}>
      <div className="flex flex-col h-full">
        {collapsible && (
          <div className="flex justify-end p-2">
            <button 
              onClick={onToggle}
              className="btn btn-ghost btn-sm"
            >
              {collapsed ? '→' : '←'}
            </button>
          </div>
        )}
        <ul className="menu p-2 flex-1">
          {items.map((item, index) => renderItem(item, index))}
        </ul>
      </div>
    </aside>
  );
};
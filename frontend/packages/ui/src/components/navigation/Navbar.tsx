import React from 'react';

export interface NavItem {
  label: string;
  href?: string;
  onClick?: () => void;
  active?: boolean;
  icon?: React.ReactNode;
}

export interface NavbarProps {
  brand?: React.ReactNode;
  items?: NavItem[];
  actions?: React.ReactNode;
  className?: string;
  variant?: 'default' | 'transparent';
}

export const Navbar: React.FC<NavbarProps> = ({ 
  brand, 
  items = [], 
  actions, 
  className = '',
  variant = 'default'
}) => {
  const baseClasses = variant === 'transparent' 
    ? 'navbar bg-transparent' 
    : 'navbar bg-base-100 shadow-sm';

  return (
    <nav className={`${baseClasses} ${className}`}>
      <div className="navbar-start">
        {brand && (
          <div className="btn btn-ghost normal-case text-xl">
            {brand}
          </div>
        )}
      </div>
      
      <div className="navbar-center hidden lg:flex">
        <ul className="menu menu-horizontal px-1">
          {items.map((item, index) => (
            <li key={index}>
              {item.href ? (
                <a 
                  href={item.href}
                  className={`flex items-center gap-2 ${item.active ? 'active' : ''}`}
                >
                  {item.icon && <span className="w-4 h-4">{item.icon}</span>}
                  {item.label}
                </a>
              ) : (
                <button 
                  onClick={item.onClick}
                  className={`flex items-center gap-2 ${item.active ? 'active' : ''}`}
                >
                  {item.icon && <span className="w-4 h-4">{item.icon}</span>}
                  {item.label}
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>
      
      <div className="navbar-end">
        {actions}
        <div className="dropdown lg:hidden">
          <label tabIndex={0} className="btn btn-ghost">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h8m-8 6h16" />
            </svg>
          </label>
          <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52">
            {items.map((item, index) => (
              <li key={index}>
                {item.href ? (
                  <a href={item.href} className={item.active ? 'active' : ''}>
                    {item.label}
                  </a>
                ) : (
                  <button onClick={item.onClick} className={item.active ? 'active' : ''}>
                    {item.label}
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </nav>
  );
};
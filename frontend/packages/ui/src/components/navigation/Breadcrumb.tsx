import React from 'react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  onClick?: () => void;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
  separator?: React.ReactNode;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ 
  items, 
  className = ''
  // Note: separator is available for future customization
}) => {
  return (
    <div className={`text-sm breadcrumbs ${className}`}>
      <ul>
        {items.map((item, index) => (
          <li key={index}>
            {index === items.length - 1 ? (
              <span className="text-base-content/70">{item.label}</span>
            ) : item.href ? (
              <a href={item.href} className="link link-hover">
                {item.label}
              </a>
            ) : (
              <button onClick={item.onClick} className="link link-hover">
                {item.label}
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};
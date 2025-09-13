import React from 'react';

export interface FooterProps {
  children?: React.ReactNode;
  className?: string;
  copyright?: string;
  links?: Array<{ label: string; href: string; }>;
}

export const Footer: React.FC<FooterProps> = ({ 
  children, 
  className = '', 
  copyright,
  links = []
}) => {
  return (
    <footer className={`footer footer-center p-4 bg-base-200 text-base-content ${className}`}>
      <div className="flex flex-col sm:flex-row justify-between items-center w-full max-w-6xl">
        <div className="flex flex-wrap gap-4 mb-2 sm:mb-0">
          {links.map((link, index) => (
            <a 
              key={index}
              href={link.href} 
              className="link link-hover text-sm"
            >
              {link.label}
            </a>
          ))}
        </div>
        {copyright && (
          <p className="text-sm text-base-content/70">
            {copyright}
          </p>
        )}
        {children}
      </div>
    </footer>
  );
};
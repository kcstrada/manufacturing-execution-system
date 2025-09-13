import React from 'react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  closeOnBackdropClick?: boolean;
  showCloseButton?: boolean;
  actions?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  children,
  title,
  className = '',
  size = 'md',
  closeOnBackdropClick = true,
  showCloseButton = true,
  actions
}) => {
  const sizeClasses = {
    sm: 'modal-box w-11/12 max-w-md',
    md: 'modal-box w-11/12 max-w-2xl',
    lg: 'modal-box w-11/12 max-w-4xl',
    xl: 'modal-box w-11/12 max-w-6xl'
  };

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && closeOnBackdropClick) {
      onClose();
    }
  };

  return (
    <div className="modal modal-open" onClick={handleBackdropClick}>
      <div className={`${sizeClasses[size]} ${className}`}>
        <div className="flex justify-between items-center mb-4">
          {title && (
            <h3 className="font-bold text-lg">{title}</h3>
          )}
          {showCloseButton && (
            <button
              onClick={onClose}
              className="btn btn-sm btn-circle btn-ghost ml-auto"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        
        <div className="py-4">
          {children}
        </div>
        
        {actions && (
          <div className="modal-action">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};
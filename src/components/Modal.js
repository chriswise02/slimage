import React from 'react';

const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  maxWidth = 'max-w-md',
  showCloseButton = true 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 overflow-y-auto">
      <div className="min-h-full flex items-center justify-center p-4">
        <div className={`bg-white rounded-xl ${maxWidth} w-full my-8 max-h-[calc(100vh-4rem)] flex flex-col`}>
          {/* Header */}
          {(title || showCloseButton) && (
            <div className="flex items-center justify-between p-6 pb-0 flex-shrink-0">
              {title && (
                <h2 className="text-xl font-medium text-[#333333]">{title}</h2>
              )}
              {showCloseButton && (
                <button 
                  onClick={onClose}
                  className="text-[#333333] opacity-60 hover:opacity-100 transition-all"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              )}
            </div>
          )}
          
          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6 pt-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Modal; 
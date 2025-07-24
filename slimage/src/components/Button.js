import React from 'react';

const Button = ({ 
  variant = 'primary', 
  size = 'medium',
  disabled = false,
  onClick,
  children,
  className = '',
  ...props 
}) => {
  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return 'bg-[#FF3008] text-white hover:bg-opacity-90';
      case 'secondary':
        return 'bg-[#F0F0F0] text-[#333333] hover:bg-[#E7E7E7]';
      case 'preset':
        return 'bg-[#F0F0F0] text-[#333333] hover:bg-[#E7E7E7]';
      default:
        return 'bg-[#FF3008] text-white hover:bg-opacity-90';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return 'px-3 py-1 text-xs';
      case 'medium':
        return 'px-6 py-2 text-sm';
      case 'large':
        return 'px-8 py-3 text-base';
      default:
        return 'px-6 py-2 text-sm';
    }
  };

  const baseClasses = 'font-medium transition-all rounded-lg disabled:opacity-40 disabled:cursor-not-allowed';
  const variantClasses = getVariantClasses();
  const sizeClasses = getSizeClasses();

  return (
    <button
      className={`${baseClasses} ${variantClasses} ${sizeClasses} ${className}`}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button; 
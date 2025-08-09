import React from 'react';

const Logo = ({ 
  size = 'md', 
  showText = true, 
  className = '', 
  textClassName = '',
  variant = 'default' // 'default', 'white', 'dark'
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-20 h-20'
  };

  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-3xl'
  };

  // Use PNG image with fallback to placeholder
  const LogoImage = () => {
    const borderClass = variant === 'white' || variant === 'light' ? 'border-2 border-black rounded-full' : '';
    
    return (
      <img 
        src="/logo.png" 
        alt="GameOn Logo"
        className={`${sizeClasses[size]} ${borderClass} ${className} object-contain`}
        onError={(e) => {
          // Fallback to a simple placeholder if image fails to load
          e.target.style.display = 'none';
          e.target.nextSibling.style.display = 'flex';
        }}
      />
    );
  };

  // Fallback placeholder when image is not available
  const LogoPlaceholder = () => (
    <div 
      className={`${sizeClasses[size]} ${className} rounded-full bg-gradient-to-tr from-accent-blue to-accent-purple shadow-neon flex items-center justify-center`}
      style={{ display: 'none' }}
    >
      <span className="font-display text-2xl text-white font-bold">G</span>
    </div>
  );

  const textColor = variant === 'white' ? 'text-white' : variant === 'dark' ? 'text-gray-900' : 'text-primary';

  return (
    <div className="flex items-center gap-3">
      <div className="relative">
        <LogoImage />
        <LogoPlaceholder />
      </div>
      {showText && (
        <span className={`font-display font-bold ${textSizeClasses[size]} ${textColor} ${textClassName}`}>
          GameOn
        </span>
      )}
    </div>
  );
};

export default Logo;
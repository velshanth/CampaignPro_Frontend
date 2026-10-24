import React from 'react';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showWordmark?: boolean;
  theme?: 'dark' | 'light';
  className?: string;
}

export const Logo: React.FC<BrandLogoProps> = ({
  size = 'md',
  showWordmark = true,
  theme = 'light',
  className = '',
}) => {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-11 h-11',
  };

  const wordmarkSizes = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-xl',
  };

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {showWordmark && (
        <div className="flex flex-col">
          <div className="flex items-center">
            <span
              className={`font-black tracking-tight leading-none ${wordmarkSizes[size]} ${
                theme === 'dark' ? 'text-white' : 'text-[#0A2540]'
              }`}
            >
              Campaign<span className="text-emerald-600">Pro</span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

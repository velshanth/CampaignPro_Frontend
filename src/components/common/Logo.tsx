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
      {/* Geometric Mark: Green, White, and Blue Interlocking Nexus */}
      <div className={`relative ${iconSizes[size]} shrink-0 rounded-xl overflow-hidden shadow-xs flex items-center justify-center`}>
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          <defs>
            
            <linearGradient id="nexusGreenGrad" x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#22C55E" />
              <stop offset="60%" stopColor="#16A34A" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>

            {/* Corporate Royal Blue Gradient */}
            <linearGradient id="nexusBlueGrad" x1="0" y1="24" x2="48" y2="48" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#0284C7" />
              <stop offset="50%" stopColor="#1E40AF" />
              <stop offset="100%" stopColor="#0A2540" />
            </linearGradient>

            {/* Crisp Light Edge */}
            <linearGradient id="logoEdgeGrad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#4ADE80" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.4" />
            </linearGradient>
          </defs>

          {/* Base Background: Deep Navy / Obsidian */}
          <rect width="48" height="48" rx="12" fill="#0A2540" />
          <rect x="0.5" y="0.5" width="47" height="47" rx="11.5" stroke="url(#logoEdgeGrad)" strokeWidth="1" strokeOpacity="0.5" />

          {/* Green Dynamic Geometric Segment (Top Curve & Forward Drive) */}
          <path
            d="M12 14C12 12.8954 12.8954 12 14 12H26L34 24L26 24L20 16H14C12.8954 16 12 15.1046 12 14Z"
            fill="url(#nexusGreenGrad)"
          />

          {/* Interlocking Blue Geometric Segment (Lower Base & Stability Anchor) */}
          <path
            d="M12 34C12 35.1046 12.8954 36 14 36H26L34 24H22L16 32H14C12.8954 32 12 33.1046 12 34Z"
            fill="url(#nexusBlueGrad)"
          />

          {/* Central Forward Prism Vector: Vibrant Green */}
          <path
            d="M19 18L31 24L19 30L23 24L19 18Z"
            fill="#22C55E"
          />

          {/* Brilliant White Core Fold Highlight */}
          <path
            d="M15 19L22 24L15 29V19Z"
            fill="#FFFFFF"
            fillOpacity="0.95"
          />

          {/* Active Green Dispatch Node */}
          <circle cx="34" cy="24" r="2.5" fill="#22C55E" />
          <circle cx="34" cy="24" r="5" stroke="#4ADE80" strokeWidth="1" strokeOpacity="0.8" />
        </svg>
      </div>

      {/* Wordmark: CampaignPro as a single unified word */}
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
          <span
            className={`text-[10px] font-semibold tracking-wide mt-0.5 leading-none ${
              theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            Email Dispatch Cloud
          </span>
        </div>
      )}
    </div>
  );
};

export const BrandLogo = Logo;

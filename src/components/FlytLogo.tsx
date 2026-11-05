import React from 'react';

interface FlytLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showTagline?: boolean;
  className?: string;
}

export const FlytLogo: React.FC<FlytLogoProps> = ({
  size = 'md',
  showTagline = false,
  className = '',
}) => {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
    xl: 'text-4xl',
  };

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Aerodynamic Supersonic Vector Emblem */}
      <div className={`relative ${iconSizes[size]} shrink-0 flex items-center justify-center`}>
        <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/20 to-cyan-500/30 rounded-xl blur-[6px]" />
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full relative drop-shadow-[0_0_12px_rgba(16,185,129,0.5)]"
        >
          {/* Outer aerodynamic wing vector */}
          <path
            d="M8 82L42 12L92 38L62 52L46 36L34 82L8 82Z"
            fill="url(#flyt-grad-1)"
          />
          {/* Inner supersonic speed slice */}
          <path
            d="M32 72L50 32L82 46L60 56L44 48L32 72Z"
            fill="url(#flyt-grad-2)"
          />
          {/* Core laser vertex */}
          <circle cx="50" cy="32" r="4.5" fill="#A7F3D0" />

          <defs>
            <linearGradient id="flyt-grad-1" x1="8" y1="12" x2="92" y2="82" gradientUnits="userSpaceOnUse">
              <stop stopColor="#10B981" />
              <stop offset="0.6" stopColor="#059669" />
              <stop offset="1" stopColor="#064E3B" />
            </linearGradient>
            <linearGradient id="flyt-grad-2" x1="32" y1="32" x2="82" y2="72" gradientUnits="userSpaceOnUse">
              <stop stopColor="#67E8F9" />
              <stop offset="1" stopColor="#10B981" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Modernist Geometric Wordmark */}
      <div className="flex flex-col justify-center">
        <div className="flex items-center gap-1.5 leading-none">
          <span className={`font-display font-black tracking-wider text-white ${textSizes[size]}`}>
            FLY<span className="text-emerald-400">T</span>
          </span>
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee] animate-pulse" />
        </div>
        {showTagline && (
          <span className="text-[10px] uppercase font-medium tracking-[0.24em] text-slate-400 mt-1">
            Dispatch & Logistics OS
          </span>
        )}
      </div>
    </div>
  );
};

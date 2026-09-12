'use client';

import React from 'react';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
  minimal?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  showSubtitle = true,
  minimal = false,
}) => {
  const badgeClasses = {
    sm: 'h-8 px-2.5 text-xs tracking-wider rounded-lg',
    md: 'h-10 px-3 text-sm tracking-widest rounded-xl',
    lg: 'h-16 px-6 text-2xl tracking-[0.25em] rounded-2xl',
  };

  return (
    <div className="flex items-center gap-3 select-none">
      {/* Clean Modern Typography CPU Badge */}
      <div
        className={`${badgeClasses[size]} bg-slate-950 text-white flex items-center justify-center font-black shadow-md border border-slate-800 relative overflow-hidden shrink-0`}
      >
        {/* Clean Emerald Accent indicator */}
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500" />
        <span className="font-mono font-black text-white pl-1 drop-shadow-xs">
          CPU
        </span>
      </div>

      {/* Brand Text Details */}
      {!minimal && (
        <div>
          <div className="flex items-center gap-2">
            <span className="font-black text-slate-900 text-sm sm:text-base tracking-tight leading-none">
              CPU <span className="text-emerald-700 font-bold text-xs sm:text-sm">(Central Production Unit)</span>
            </span>
            <span className="hidden sm:inline-block text-[10px] font-extrabold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md uppercase tracking-wider border border-slate-300">
              Kitchen OPS
            </span>
          </div>
          {showSubtitle && (
            <p className="text-[11px] text-slate-500 font-medium tracking-tight mt-1">
              Company: <strong className="text-slate-800 font-bold">Kandal Commissary Kitchen</strong> • Tube Coffee+ &amp; OnMart
            </p>
          )}
        </div>
      )}
    </div>
  );
};

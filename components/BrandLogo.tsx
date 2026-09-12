'use client';

import React from 'react';
import { ChefHat, UtensilsCrossed, Factory } from 'lucide-react';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ size = 'md', showSubtitle = true }) => {
  const iconSizes = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-base',
  };

  return (
    <div className="flex items-center gap-3">
      {/* Visual Logo Badge */}
      <div
        className={`${iconSizes[size]} rounded-2xl bg-gradient-to-br from-emerald-700 via-slate-900 to-slate-950 text-white flex items-center justify-center shadow-md relative overflow-hidden border border-emerald-500/30 shrink-0`}
      >
        <div className="absolute inset-0 bg-radial from-emerald-500/20 to-transparent opacity-60" />
        <div className="relative flex flex-col items-center justify-center">
          <ChefHat className="w-4 h-4 text-emerald-400" />
          <span className="font-black text-[9px] tracking-tighter text-amber-300 -mt-0.5">
            CPU
          </span>
        </div>
      </div>

      {/* Brand Text */}
      <div>
        <div className="flex items-center gap-2">
          <span className="font-black text-slate-900 text-sm sm:text-base leading-tight tracking-tight">
            CPU <span className="text-emerald-700 font-bold text-xs sm:text-sm">(Central Production Unit)</span>
          </span>
          <span className="hidden sm:inline-block text-[10px] font-extrabold bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-full uppercase tracking-wider border border-emerald-300">
            Kitchen OPS
          </span>
        </div>
        {showSubtitle && (
          <p className="text-[11px] text-slate-500 font-semibold tracking-tight">
            Company: <strong className="text-slate-800">Kandal Commissary Kitchen</strong> • Tube Coffee &amp; OnMart
          </p>
        )}
      </div>
    </div>
  );
};

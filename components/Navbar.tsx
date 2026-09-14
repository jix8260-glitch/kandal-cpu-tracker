'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Cloud, Calendar, Package, BarChart3, Lock, Settings } from 'lucide-react';
import { isSupabaseConfigured } from '@/lib/supabase';
import { BrandLogo } from './BrandLogo';
import { useAuth } from './AuthLock';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const { lockApp, openSettings } = useAuth();

  const navLinks = [
    { href: '/', label: 'Daily Stock Tracker', icon: <Calendar className="w-4 h-4" /> },
    { href: '/summary', label: 'Store Summary (១៣ ហាង)', icon: <BarChart3 className="w-4 h-4" /> },
  ];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Brand with CPU and Kandal Commissary Kitchen */}
        <Link href="/" className="flex items-center hover:opacity-95 transition-opacity">
          <BrandLogo size="md" />
        </Link>

        {/* Navigation Tabs */}
        <nav className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  isActive
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {link.icon}
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right Tools: Cloud Indicator */}
        <div className="flex items-center gap-2">
          {/* Cloud Status */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${
              isSupabaseConfigured
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : 'bg-emerald-50 text-emerald-800 border-emerald-300'
            }`}
          >
            <Cloud className="w-3.5 h-3.5 text-emerald-600" />
            <span>{isSupabaseConfigured ? 'Supabase Online' : 'Auto-Save Active'}</span>
          </div>
        </div>
      </div>
    </header>
  );
};

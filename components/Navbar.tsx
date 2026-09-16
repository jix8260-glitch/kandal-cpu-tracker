'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Calendar, BarChart3, Printer } from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { useAuth } from './AuthLock';
import SettingsMenu from './SettingsMenu';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const { openSettings } = useAuth();

  // Do not render navbar on standalone login page
  if (pathname === '/login') return null;

  const navLinks = [
    { href: '/', label: 'Daily Stock Tracker', icon: <Calendar className="w-4 h-4" /> },
    { href: '/summary', label: 'Store Summary (១៣ ហាង)', icon: <BarChart3 className="w-4 h-4" /> },
  ];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs overflow-visible">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex items-center justify-between gap-3 overflow-visible">
        {/* Brand with CPU and Kandal Commissary Kitchen */}
        <Link href="/" className="flex items-center hover:opacity-95 transition-opacity shrink-0">
          <BrandLogo size="md" />
        </Link>

        {/* 2 Navigation Buttons (Daily Stock Tracker & Store Summary) */}
        <nav className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold shrink-0">
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

        {/* 2 Buttons Moved Up (Print & Settings & Tools) */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold border border-slate-300 transition-colors cursor-pointer shadow-2xs"
            title="បោះពុម្ពរបាយការណ៍ (Print Report)"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span>Print</span>
          </button>

          <SettingsMenu
            onOpenSettings={openSettings}
            onPrint={() => window.print()}
            onLogout={() => {
              try {
                localStorage.removeItem('cpu_current_user');
                localStorage.removeItem('cpu_current_role');
                sessionStorage.removeItem('cpu_current_user');
                sessionStorage.removeItem('cpu_current_role');
                window.location.href = '/login';
              } catch (e) {}
            }}
          />
        </div>
      </div>
    </header>
  );
};

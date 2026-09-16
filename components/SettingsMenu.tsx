'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { 
  Settings, Shield, Users, FileText, 
  Printer, LogOut, ChevronDown, ExternalLink, Sliders,
  BarChart3
} from 'lucide-react';

interface SettingsMenuProps {
  currentUserName?: string;
  currentUserRole?: 'ADMIN' | 'STAFF';
  onOpenSettings?: () => void;
  onPrint?: () => void;
  onLogout?: () => void;
}

export default function SettingsMenu({
  currentUserName = 'Manager',
  currentUserRole = 'ADMIN',
  onOpenSettings,
  onPrint,
  onLogout
}: SettingsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // បិទ Dropdown ពេលចុចនៅខាងក្រៅ
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      {/* TRIGGER BUTTON (ប៊ូតុងចុចបើក Menu) */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-800 rounded-xl text-xs font-bold border border-slate-200 shadow-2xs hover:border-slate-300 transition-all cursor-pointer"
        title="បើកម៉ឺនុយការកំណត់ និងឧបករណ៍ (Tools & Settings)"
      >
        <div className="w-5 h-5 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
          <Settings className="w-3.5 h-3.5" />
        </div>
        <span className="hidden sm:inline">Settings &amp; Tools</span>
        <span className="sm:hidden">Menu</span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* DROPDOWN MENU */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200/90 py-2 z-50 animate-in fade-in zoom-in-95 origin-top-right divide-y divide-slate-100">
          
          {/* ១. ព័ត៌មានអ្នកប្រើប្រាស់ (User Profile Header) */}
          <div className="px-4 py-2.5 bg-slate-50/70">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center font-black text-xs">
                  {currentUserName.substring(0, 1).toUpperCase()}
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 leading-tight">{currentUserName}</div>
                  <div className="text-[10px] text-slate-500">Connected to CPU</div>
                </div>
              </div>
              <span
                className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                  currentUserRole === 'ADMIN'
                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                    : 'bg-blue-100 text-blue-900 border border-blue-200'
                }`}
              >
                {currentUserRole}
              </span>
            </div>
          </div>

          {/* ២. ឧបករណ៍ និងការកំណត់ (Actions & Tools) */}
          <div className="py-1.5">
            {/* Admin Settings & Logs */}
            {currentUserRole === 'ADMIN' && (
              <button
                onClick={() => {
                  setIsOpen(false);
                  onOpenSettings?.();
                }}
                className="w-full text-left flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer"
              >
                <div className="w-6 h-6 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center">
                  <Sliders className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div>Settings &amp; Logs</div>
                  <div className="text-[10px] text-slate-400 font-normal">Cloud Sync, Passwords &amp; Audits</div>
                </div>
              </button>
            )}

            {/* Owner Console */}
            <Link
              href="/admin"
              onClick={() => setIsOpen(false)}
              className="w-full text-left flex items-center justify-between px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-md bg-slate-900 text-emerald-400 flex items-center justify-center">
                  <Shield className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="font-bold">Owner Console</div>
                  <div className="text-[10px] text-slate-400 font-normal">Security &amp; Backup Snapshots</div>
                </div>
              </div>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </Link>

            {/* Store Summary */}
            <Link
              href="/summary"
              onClick={() => setIsOpen(false)}
              className="w-full text-left flex items-center justify-between px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center">
                  <BarChart3 className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div>Store Summary</div>
                  <div className="text-[10px] text-slate-400 font-normal">13 Stores Daily Breakdown</div>
                </div>
              </div>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </Link>

            {/* Print Report */}
            <button
              onClick={() => {
                setIsOpen(false);
                if (onPrint) onPrint();
                else window.print();
              }}
              className="w-full text-left flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer"
            >
              <div className="w-6 h-6 rounded-md bg-slate-100 text-slate-600 flex items-center justify-center">
                <Printer className="w-3.5 h-3.5" />
              </div>
              <div>
                <div>Print Report</div>
                <div className="text-[10px] text-slate-400 font-normal">A4 Paper with 3 Signatures</div>
              </div>
            </button>
          </div>

          {/* ៣. ប៊ូតុងចាកចេញ (Logout) */}
          <div className="py-1">
            <button
              onClick={() => {
                setIsOpen(false);
                onLogout?.();
              }}
              className="w-full text-left flex items-center gap-2.5 px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
            >
              <div className="w-6 h-6 rounded-md bg-rose-100 text-rose-600 flex items-center justify-center">
                <LogOut className="w-3.5 h-3.5" />
              </div>
              <span>ចាកចេញពីគណនី (Logout)</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

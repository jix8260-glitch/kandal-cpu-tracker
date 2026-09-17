'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Trash2, Home, Package, Store } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Next.js Client Exception caught by error.tsx:', error);
  }, [error]);

  const handleClearCacheAndReset = () => {
    try {
      localStorage.removeItem('cpu_stores');
      localStorage.removeItem('cpu_items');
      localStorage.removeItem('cpu_history_distribution');
      localStorage.removeItem('cpu_history_stock');
      localStorage.removeItem('kandal_cpu_pin_secret_v3');
      localStorage.removeItem('kandal_cpu_auth_token_v3');
      sessionStorage.clear();
    } catch (e) {
      console.warn('Could not clear storage:', e);
    }
    window.location.href = '/';
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-rose-100 p-6 sm:p-8 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto shadow-inner">
          <AlertTriangle className="w-8 h-8 animate-pulse" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-black text-slate-900">
            ប្រព័ន្ធជួបប្រទះបញ្ហា (System Error)
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
            សូមអភ័យទោស! ប្រព័ន្ធរអាក់រអួលដោយសារទិន្នន័យ Cache ចាស់ក្នុង Browser។ សូមចុចប៊ូតុងខាងក្រោមដើម្បីចូលឡើងវិញ។
          </p>
          {error?.message && (
            <div className="mt-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-left font-mono text-[11px] text-rose-700 max-h-24 overflow-y-auto break-all">
              {error.message}
            </div>
          )}
        </div>

        <div className="space-y-2.5 pt-2">
          <button
            onClick={() => {
              reset();
              window.location.reload();
            }}
            className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white rounded-xl font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>ព្យាយាមចូលឡើងវិញ (Retry / Reload)</span>
          </button>

          <button
            onClick={handleClearCacheAndReset}
            className="w-full py-3 px-4 bg-amber-50 hover:bg-amber-100 active:scale-[0.99] text-amber-800 border border-amber-300 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Trash2 className="w-4 h-4 text-amber-600" />
            <span>សម្អាត Cache &amp; Reset (Clear Cache)</span>
          </button>
        </div>

        <div className="border-t border-slate-100 pt-4">
          <p className="text-[11px] text-slate-400 font-medium mb-3">
            ឬចូលទៅកាន់ផ្នែកផ្សេងទៀត (Navigate to other sections):
          </p>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <Link
              href="/"
              className="py-2 px-1 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold rounded-lg border border-slate-200 flex flex-col items-center gap-1"
            >
              <Home className="w-3.5 h-3.5 text-blue-600" />
              <span>Daily Tracker</span>
            </Link>
            <Link
              href="/summary"
              className="py-2 px-1 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold rounded-lg border border-slate-200 flex flex-col items-center gap-1"
            >
              <Store className="w-3.5 h-3.5 text-amber-600" />
              <span>Summary</span>
            </Link>
            <Link
              href="/items"
              className="py-2 px-1 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold rounded-lg border border-slate-200 flex flex-col items-center gap-1"
            >
              <Package className="w-3.5 h-3.5 text-emerald-600" />
              <span>Master Items</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

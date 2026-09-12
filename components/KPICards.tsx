import React from 'react';
import { DollarSign, ArrowDownLeft, ArrowUpRight, Package } from 'lucide-react';

interface KPICardsProps {
  totalStockValue: number;
  totalStockIn: number;
  totalStockOut: number;
  totalBalance: number;
  activeItemCount: number;
  selectedDate: string;
  selectedLocation: string;
}

export const KPICards: React.FC<KPICardsProps> = ({
  totalStockValue,
  totalStockIn,
  totalStockOut,
  totalBalance,
  activeItemCount,
  selectedDate,
  selectedLocation,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total Stock Value */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center justify-between text-slate-500 mb-2 text-xs font-semibold uppercase tracking-wider">
          <span>Total Stock Value</span>
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-black text-slate-900">
          ${totalStockValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <div className="mt-2 text-[11px] text-slate-500 flex justify-between pt-2 border-t border-slate-100">
          <span>Date: {selectedDate}</span>
          <span className="font-bold text-emerald-700">{selectedLocation}</span>
        </div>
      </div>

      {/* 2. Stock In */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center justify-between text-slate-500 mb-2 text-xs font-semibold uppercase tracking-wider">
          <span>Stock In Today</span>
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
            <ArrowDownLeft className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-black text-emerald-700">
          +{totalStockIn.toLocaleString()} <span className="text-xs font-normal text-slate-500">units</span>
        </div>
        <div className="mt-2 text-[11px] text-slate-500 flex justify-between pt-2 border-t border-slate-100">
          <span>Restocked / Purchased</span>
          <span className="bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded font-medium">Incoming</span>
        </div>
      </div>

      {/* 3. Stock Out */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center justify-between text-slate-500 mb-2 text-xs font-semibold uppercase tracking-wider">
          <span>Stock Out Today</span>
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
            <ArrowUpRight className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-black text-amber-700">
          -{totalStockOut.toLocaleString()} <span className="text-xs font-normal text-slate-500">units</span>
        </div>
        <div className="mt-2 text-[11px] text-slate-500 flex justify-between pt-2 border-t border-slate-100">
          <span>Sold / Issued / Usage</span>
          <span className="bg-amber-50 text-amber-800 px-1.5 py-0.5 rounded font-medium">Outgoing</span>
        </div>
      </div>

      {/* 4. Active Items & Total Balance */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center justify-between text-slate-500 mb-2 text-xs font-semibold uppercase tracking-wider">
          <span>Tracked Inventory</span>
          <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
            <Package className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-black text-slate-800">
          {activeItemCount} <span className="text-xs font-normal text-slate-500">SKUs</span>
        </div>
        <div className="mt-2 text-[11px] text-slate-500 flex justify-between pt-2 border-t border-slate-100">
          <span>Total Balance: {totalBalance.toLocaleString()} units</span>
          <span className="text-blue-600 font-bold">Active</span>
        </div>
      </div>
    </div>
  );
};

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  BarChart3,
  Coffee,
  Store,
  Layers,
  Calendar,
  Package,
  TrendingUp,
  DollarSign,
  ArrowDownLeft,
  ArrowUpRight,
  ExternalLink,
  Search,
  Filter,
  Eye,
  CheckCircle2
} from 'lucide-react';
import {
  StockItem,
  FilterLocation,
  TUBE_COFFEE_STORES,
  ONMART_STORES,
  ALL_STORES,
  StoreBranch
} from '@/lib/types';
import { getNormalizedStarterItems } from '@/lib/starter-items';

const YEARS = [2024, 2025, 2026, 2027, 2028];
const MONTHS = [
  { num: 1, nameKh: 'មករា', nameEn: 'Jan' },
  { num: 2, nameKh: 'កុម្ភៈ', nameEn: 'Feb' },
  { num: 3, nameKh: 'មីនា', nameEn: 'Mar' },
  { num: 4, nameKh: 'មេសា', nameEn: 'Apr' },
  { num: 5, nameKh: 'ឧសភា', nameEn: 'May' },
  { num: 6, nameKh: 'មិថុនា', nameEn: 'Jun' },
  { num: 7, nameKh: 'កក្កដា', nameEn: 'Jul' },
  { num: 8, nameKh: 'សីហា', nameEn: 'Aug' },
  { num: 9, nameKh: 'កញ្ញា', nameEn: 'Sep' },
  { num: 10, nameKh: 'តុលា', nameEn: 'Oct' },
  { num: 11, nameKh: 'វិច្ឆិកា', nameEn: 'Nov' },
  { num: 12, nameKh: 'ធ្នូ', nameEn: 'Dec' },
];

export default function SummaryPage() {
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth() + 1);
  const [selectedDay, setSelectedDay] = useState<number>(currentDate.getDate());
  const [selectedBrand, setSelectedBrand] = useState<FilterLocation>('ALL');
  const [selectedStoreCode, setSelectedStoreCode] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeDetailStore, setActiveDetailStore] = useState<StoreBranch | null>(null);

  // All 105 starter items
  const allItems: StockItem[] = useMemo(() => {
    return getNormalizedStarterItems() as StockItem[];
  }, []);

  // Stock logs from LocalStorage
  const [storedLogs, setStoredLogs] = useState<
    Record<string, Record<string, { stock_in: number; stock_out: number }>>
  >({});

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('kandal_cpu_stock_logs');
        if (raw) {
          setStoredLogs(JSON.parse(raw));
        }
      } catch (e) {
        console.error('Error loading stock logs', e);
      }
    }
  }, []);

  // Selected date formatted: YYYY-MM-DD
  const selectedDateStr = useMemo(() => {
    const mm = String(selectedMonth).padStart(2, '0');
    const dd = String(selectedDay).padStart(2, '0');
    return `${selectedYear}-${mm}-${dd}`;
  }, [selectedYear, selectedMonth, selectedDay]);

  // Filtered stores list
  const filteredStores = useMemo(() => {
    let list = ALL_STORES;
    if (selectedBrand === 'TUBE_COFFEE') {
      list = TUBE_COFFEE_STORES;
    } else if (selectedBrand === 'ONMART') {
      list = ONMART_STORES;
    }
    if (selectedStoreCode !== 'ALL') {
      list = list.filter((s) => s.code === selectedStoreCode);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((s) => s.code.toLowerCase().includes(q) || s.name.toLowerCase().includes(q));
    }
    return list;
  }, [selectedBrand, selectedStoreCode, searchQuery]);

  // Aggregate stats per store
  const storeSummaries = useMemo(() => {
    const monthPrefix = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
    const yearPrefix = `${selectedYear}-`;

    return ALL_STORES.map((store) => {
      // Items for this store brand
      const storeItems = allItems.filter((it) => it.location === store.brand);
      const itemsCount = storeItems.length; // 69 for Tube Coffee+, 36 for OnMart

      // 1. Daily Stats (Selected Date)
      const dailyLogMap = storedLogs[selectedDateStr] || {};
      let dailyIn = 0;
      let dailyOut = 0;
      let dailyValuation = 0;

      // 2. Monthly Stats (Selected Month)
      let monthlyIn = 0;
      let monthlyOut = 0;

      // 3. Yearly Stats (Selected Year)
      let yearlyIn = 0;
      let yearlyOut = 0;

      storeItems.forEach((item) => {
        // Daily
        const dLog = dailyLogMap[item.id] || { stock_in: 0, stock_out: 0 };
        dailyIn += dLog.stock_in;
        dailyOut += dLog.stock_out;

        // Current Balance & Valuation
        const currentBalance = Math.max(0, item.opening_stock + dLog.stock_in - dLog.stock_out);
        dailyValuation += currentBalance * item.cpu;
      });

      // Scan all stored dates for Monthly & Yearly
      Object.entries(storedLogs).forEach(([dateStr, itemsMap]) => {
        if (dateStr.startsWith(yearPrefix)) {
          storeItems.forEach((item) => {
            const log = itemsMap[item.id];
            if (log) {
              yearlyIn += log.stock_in || 0;
              yearlyOut += log.stock_out || 0;

              if (dateStr.startsWith(monthPrefix)) {
                monthlyIn += log.stock_in || 0;
                monthlyOut += log.stock_out || 0;
              }
            }
          });
        }
      });

      // Opening stock total for valuation
      const totalOpening = storeItems.reduce((acc, i) => acc + i.opening_stock, 0);
      const startingValuation = storeItems.reduce((acc, i) => acc + i.opening_stock * i.cpu, 0);
      const estimatedMonthBalance = totalOpening + monthlyIn - monthlyOut;
      const estimatedYearBalance = totalOpening + yearlyIn - yearlyOut;

      return {
        ...store,
        itemsCount,
        dailyIn,
        dailyOut,
        dailyValuation: dailyValuation > 0 ? dailyValuation : startingValuation,
        monthlyIn,
        monthlyOut,
        estimatedMonthBalance,
        yearlyIn,
        yearlyOut,
        estimatedYearBalance,
        startingValuation,
      };
    });
  }, [allItems, storedLogs, selectedDateStr, selectedYear, selectedMonth]);

  // Overall Totals
  const overallTotals = useMemo(() => {
    return storeSummaries.reduce(
      (acc, s) => {
        acc.dailyIn += s.dailyIn;
        acc.dailyOut += s.dailyOut;
        acc.monthlyIn += s.monthlyIn;
        acc.monthlyOut += s.monthlyOut;
        acc.yearlyIn += s.yearlyIn;
        acc.yearlyOut += s.yearlyOut;
        acc.totalValuation += s.dailyValuation;
        return acc;
      },
      {
        dailyIn: 0,
        dailyOut: 0,
        monthlyIn: 0,
        monthlyOut: 0,
        yearlyIn: 0,
        yearlyOut: 0,
        totalValuation: 0,
      }
    );
  }, [storeSummaries]);

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 leading-tight flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-600" />
              <span>របាយការណ៍សរុបតាមសាខាហាងទាំង ១៣ (Stores Summary)</span>
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Kandal Commissary Kitchen • Tube Coffee+ (9 ហាង) &amp; OnMart (4 ហាង) • 105 Items
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href="/"
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
            >
              <Calendar className="w-4 h-4 text-emerald-400" />
              <span>ទៅកាន់ Daily Stock</span>
            </Link>
            <Link
              href="/items"
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold border border-slate-300 transition-colors"
            >
              <Package className="w-4 h-4 text-slate-500" />
              <span>Item Master (105 Items)</span>
            </Link>
          </div>
        </div>

        {/* Filters: Brand, Year, Month, Day */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Brand Switcher */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 gap-1 font-bold">
            <button
              onClick={() => {
                setSelectedBrand('ALL');
                setSelectedStoreCode('ALL');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                selectedBrand === 'ALL'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              <span>All 13 Stores (រួម)</span>
            </button>
            <button
              onClick={() => {
                setSelectedBrand('TUBE_COFFEE');
                setSelectedStoreCode('ALL');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                selectedBrand === 'TUBE_COFFEE'
                  ? 'bg-white text-amber-900 shadow-xs'
                  : 'text-slate-600 hover:text-amber-800'
              }`}
            >
              <Coffee className="w-3.5 h-3.5 text-amber-600" />
              <span>Tube Coffee+ (9 ហាង)</span>
            </button>
            <button
              onClick={() => {
                setSelectedBrand('ONMART');
                setSelectedStoreCode('ALL');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                selectedBrand === 'ONMART'
                  ? 'bg-white text-emerald-900 shadow-xs'
                  : 'text-slate-600 hover:text-emerald-800'
              }`}
            >
              <Store className="w-3.5 h-3.5 text-emerald-600" />
              <span>OnMart (4 ហាង)</span>
            </button>
          </div>

          {/* Year & Date Selector */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Year Selector */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 gap-1">
              <span className="px-2 font-bold text-slate-500">ឆ្នាំ:</span>
              {YEARS.map((yr) => (
                <button
                  key={yr}
                  onClick={() => setSelectedYear(yr)}
                  className={`px-2.5 py-1 rounded-lg font-black transition-all ${
                    selectedYear === yr
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {yr}
                </button>
              ))}
            </div>

            {/* Month Dropdown */}
            <div className="flex items-center gap-1">
              <span className="font-bold text-slate-500">ខែ:</span>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800 focus:outline-none"
              >
                {MONTHS.map((m) => (
                  <option key={m.num} value={m.num}>
                    ខែ {String(m.num).padStart(2, '0')} - {m.nameKh} ({m.nameEn})
                  </option>
                ))}
              </select>
            </div>

            {/* Day Dropdown */}
            <div className="flex items-center gap-1">
              <span className="font-bold text-slate-500">ថ្ងៃ:</span>
              <select
                value={selectedDay}
                onChange={(e) => setSelectedDay(Number(e.target.value))}
                className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs font-bold text-slate-800 focus:outline-none"
              >
                {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={d}>
                    ថ្ងៃទី {d}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Store Selector Pills */}
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-1.5 flex-wrap text-xs">
          <span className="font-bold text-slate-500 mr-1">សាខាហាង:</span>
          <button
            onClick={() => setSelectedStoreCode('ALL')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
              selectedStoreCode === 'ALL'
                ? 'bg-slate-800 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Stores ({selectedBrand === 'TUBE_COFFEE' ? '9' : selectedBrand === 'ONMART' ? '4' : '13'})
          </button>

          {(selectedBrand === 'ALL' || selectedBrand === 'TUBE_COFFEE'
            ? TUBE_COFFEE_STORES
            : []
          ).map((st) => (
            <button
              key={st.code}
              onClick={() => setSelectedStoreCode(st.code)}
              className={`px-2.5 py-1 rounded-lg font-bold font-mono transition-all ${
                selectedStoreCode === st.code
                  ? 'bg-amber-700 text-white shadow-2xs'
                  : 'bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100'
              }`}
            >
              ☕ {st.code}
            </button>
          ))}

          {(selectedBrand === 'ALL' || selectedBrand === 'ONMART'
            ? ONMART_STORES
            : []
          ).map((st) => (
            <button
              key={st.code}
              onClick={() => setSelectedStoreCode(st.code)}
              className={`px-2.5 py-1 rounded-lg font-bold font-mono transition-all ${
                selectedStoreCode === st.code
                  ? 'bg-emerald-700 text-white shadow-2xs'
                  : 'bg-emerald-50 text-emerald-900 border border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              🛒 {st.code}
            </button>
          ))}
        </div>
      </div>

      {/* Executive KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Stores Tracked */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2 text-xs font-semibold uppercase tracking-wider">
            <span>Total Outlets / Stores</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <Store className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            13 <span className="text-xs font-normal text-slate-500">Stores</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex justify-between pt-2 border-t border-slate-100 font-medium">
            <span>Tube Coffee+ (9)</span>
            <span>OnMart (4)</span>
          </div>
        </div>

        {/* Daily Summary (Selected Date) */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2 text-xs font-semibold uppercase tracking-wider">
            <span>Daily Stock Movement</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-slate-900 flex items-center gap-2">
            <span className="text-emerald-700">+{overallTotals.dailyIn}</span>
            <span className="text-slate-300">/</span>
            <span className="text-amber-700">-{overallTotals.dailyOut}</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex justify-between pt-2 border-t border-slate-100 font-medium">
            <span>Date: {selectedDateStr}</span>
            <span className="text-blue-600 font-bold">Daily In/Out</span>
          </div>
        </div>

        {/* Monthly Summary (Selected Month) */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2 text-xs font-semibold uppercase tracking-wider">
            <span>Monthly Movement ({MONTHS[selectedMonth - 1].nameEn})</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-slate-900 flex items-center gap-2">
            <span className="text-emerald-700">+{overallTotals.monthlyIn}</span>
            <span className="text-slate-300">/</span>
            <span className="text-amber-700">-{overallTotals.monthlyOut}</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex justify-between pt-2 border-t border-slate-100 font-medium">
            <span>Month {selectedMonth}/{selectedYear}</span>
            <span className="text-emerald-700 font-bold">Monthly Total</span>
          </div>
        </div>

        {/* Total Asset Valuation ($) */}
        <div className="bg-slate-950 text-white p-4 rounded-2xl border border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-2 text-xs font-semibold uppercase tracking-wider">
            <span>Consolidated Value</span>
            <div className="w-8 h-8 rounded-lg bg-white/10 text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-400">
            ${overallTotals.totalValuation.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex justify-between pt-2 border-t border-slate-800 font-medium">
            <span>105 Items Tracked</span>
            <span className="text-emerald-300 font-bold">Live Asset</span>
          </div>
        </div>
      </div>

      {/* Main Consolidated Table: ITEMS PER STORE, DAILY, MONTHLY, YEARLY */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50/70">
          <div>
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <span>តារាងសរុបទិន្នន័យសាខាហាង (Store Breakdown: Daily, Monthly, Yearly)</span>
              <span className="text-xs font-extrabold px-2 py-0.5 rounded-full bg-slate-200 text-slate-800">
                {filteredStores.length} Stores Displayed
              </span>
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              បង្ហាញចំនួន Items per store និងសរុប Stock In / Stock Out តាមថ្ងៃ ខែ ឆ្នាំ
            </p>
          </div>

          <div className="relative min-w-[220px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search store code or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-500 shadow-2xs"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-900 text-white font-semibold sticky top-0 z-10">
              <tr className="divide-x divide-slate-800">
                <th className="py-3 px-3 w-20 text-center">Store Code</th>
                <th className="py-3 px-3 min-w-[200px]">Store Name / Branch</th>
                <th className="py-3 px-2.5 text-center w-28">Brand</th>
                <th className="py-3 px-2.5 text-center w-28 bg-indigo-950/70 text-indigo-200">
                  Items per Store
                </th>
                <th className="py-3 px-3 text-right w-36 bg-blue-950/70 text-blue-200">
                  Daily (ថ្ងៃ {selectedDay})
                  <div className="text-[10px] font-normal text-slate-400">In / Out</div>
                </th>
                <th className="py-3 px-3 text-right w-36 bg-emerald-950/70 text-emerald-200">
                  Monthly (ខែ {selectedMonth})
                  <div className="text-[10px] font-normal text-slate-400">In / Out</div>
                </th>
                <th className="py-3 px-3 text-right w-36 bg-amber-950/70 text-amber-200">
                  Yearly (ឆ្នាំ {selectedYear})
                  <div className="text-[10px] font-normal text-slate-400">In / Out</div>
                </th>
                <th className="py-3 px-3 text-right w-32 bg-slate-800 text-emerald-300">
                  Stock Value ($)
                </th>
                <th className="py-3 px-2.5 text-center w-24">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStores.map((st) => {
                const summary = storeSummaries.find((s) => s.code === st.code);
                const isTube = st.brand === 'TUBE_COFFEE';

                return (
                  <tr key={st.code} className="hover:bg-slate-50/90 transition-colors divide-x divide-slate-100">
                    {/* Store Code */}
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-lg font-mono font-black text-xs ${
                          isTube
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                        }`}
                      >
                        {st.code}
                      </span>
                    </td>

                    {/* Store Name */}
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900">{st.name}</div>
                      <div className="text-[10px] text-slate-500 font-medium">
                        Kandal Commissary Kitchen Outlet
                      </div>
                    </td>

                    {/* Brand */}
                    <td className="py-3 px-2.5 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          isTube
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        {isTube ? <Coffee className="w-2.5 h-2.5" /> : <Store className="w-2.5 h-2.5" />}
                        <span>{isTube ? 'Tube Coffee+' : 'OnMart'}</span>
                      </span>
                    </td>

                    {/* Items per Store */}
                    <td className="py-3 px-2.5 text-center bg-indigo-50/40">
                      <span className="font-black text-indigo-900 text-xs px-2.5 py-0.5 bg-indigo-100 rounded-md">
                        {summary?.itemsCount || st.itemCount} Items
                      </span>
                    </td>

                    {/* Daily Summary */}
                    <td className="py-3 px-3 text-right bg-blue-50/20 font-mono">
                      <div className="font-bold text-slate-800 text-xs">
                        <span className="text-emerald-700">+{summary?.dailyIn || 0}</span>
                        <span className="text-slate-400 mx-1">/</span>
                        <span className="text-amber-700">-{summary?.dailyOut || 0}</span>
                      </div>
                    </td>

                    {/* Monthly Summary */}
                    <td className="py-3 px-3 text-right bg-emerald-50/20 font-mono">
                      <div className="font-bold text-slate-800 text-xs">
                        <span className="text-emerald-700">+{summary?.monthlyIn || 0}</span>
                        <span className="text-slate-400 mx-1">/</span>
                        <span className="text-amber-700">-{summary?.monthlyOut || 0}</span>
                      </div>
                    </td>

                    {/* Yearly Summary */}
                    <td className="py-3 px-3 text-right bg-amber-50/20 font-mono">
                      <div className="font-bold text-slate-800 text-xs">
                        <span className="text-emerald-700">+{summary?.yearlyIn || 0}</span>
                        <span className="text-slate-400 mx-1">/</span>
                        <span className="text-amber-700">-{summary?.yearlyOut || 0}</span>
                      </div>
                    </td>

                    {/* Stock Value ($) */}
                    <td className="py-3 px-3 text-right font-black font-mono text-emerald-800 bg-slate-50/40">
                      ${(summary?.dailyValuation || 0).toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                      })}
                    </td>

                    {/* Action: Inspect Store */}
                    <td className="py-3 px-2.5 text-center">
                      <button
                        onClick={() => setActiveDetailStore(st)}
                        className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 mx-auto transition-colors"
                      >
                        <Eye className="w-3 h-3" />
                        <span>មើល</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300 sticky bottom-0 z-10 shadow-xs">
              <tr className="divide-x divide-slate-200">
                <td colSpan={3} className="py-3 px-3 uppercase tracking-wider text-xs">
                  សរុបរួមទាំងអស់ (Total for {filteredStores.length} Stores)
                </td>
                <td className="py-3 px-2.5 text-center text-indigo-900 font-black">
                  105 Items
                </td>
                <td className="py-3 px-3 text-right font-mono font-black">
                  <span className="text-emerald-700">+{overallTotals.dailyIn}</span> /{' '}
                  <span className="text-amber-700">-{overallTotals.dailyOut}</span>
                </td>
                <td className="py-3 px-3 text-right font-mono font-black">
                  <span className="text-emerald-700">+{overallTotals.monthlyIn}</span> /{' '}
                  <span className="text-amber-700">-{overallTotals.monthlyOut}</span>
                </td>
                <td className="py-3 px-3 text-right font-mono font-black">
                  <span className="text-emerald-700">+{overallTotals.yearlyIn}</span> /{' '}
                  <span className="text-amber-700">-{overallTotals.yearlyOut}</span>
                </td>
                <td className="py-3 px-3 text-right font-black font-mono text-emerald-900">
                  ${overallTotals.totalValuation.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                  })}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Store Detail Modal */}
      {activeDetailStore && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center font-mono font-black text-sm ${
                    activeDetailStore.brand === 'TUBE_COFFEE'
                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                      : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                  }`}
                >
                  {activeDetailStore.code}
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <span>{activeDetailStore.name}</span>
                    <span className="text-[10px] uppercase font-bold bg-slate-200 text-slate-700 px-2 py-0.5 rounded-md">
                      {activeDetailStore.brand === 'TUBE_COFFEE' ? 'Tube Coffee+' : 'OnMart'}
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    បញ្ជីមុខទំនិញសរុប៖ <strong>{activeDetailStore.itemCount} Items</strong> ផ្គត់ផ្គង់ដោយ Kandal Commissary Kitchen
                  </p>
                </div>
              </div>

              <button
                onClick={() => setActiveDetailStore(null)}
                className="w-8 h-8 rounded-lg hover:bg-slate-200 text-slate-500 font-bold flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 sticky top-0 font-semibold text-slate-700">
                  <tr className="border-b border-slate-200">
                    <th className="py-2.5 px-3">Item Code</th>
                    <th className="py-2.5 px-3">Description (Khmer)</th>
                    <th className="py-2.5 px-2.5">Category</th>
                    <th className="py-2.5 px-2 text-center">UoM</th>
                    <th className="py-2.5 px-2.5 text-right">CPU ($)</th>
                    <th className="py-2.5 px-2.5 text-right">Opening Stock</th>
                    <th className="py-2.5 px-2.5 text-right font-bold text-emerald-800">Est. Value ($)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {allItems
                    .filter((it) => it.location === activeDetailStore.brand)
                    .map((it) => (
                      <tr key={it.id} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-mono font-bold text-slate-800">{it.code}</td>
                        <td className="py-2 px-3 font-medium text-slate-900">{it.description_khmer}</td>
                        <td className="py-2 px-2.5 text-slate-500">{it.category}</td>
                        <td className="py-2 px-2 text-center text-slate-500">{it.uom}</td>
                        <td className="py-2 px-2.5 text-right font-mono text-slate-700">${it.cpu.toFixed(2)}</td>
                        <td className="py-2 px-2.5 text-right font-mono text-slate-800">{it.opening_stock}</td>
                        <td className="py-2 px-2.5 text-right font-mono font-bold text-emerald-700">
                          ${(it.opening_stock * it.cpu).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">
                Showing all <strong>{activeDetailStore.itemCount} Items</strong> assigned to {activeDetailStore.name}
              </span>
              <button
                onClick={() => setActiveDetailStore(null)}
                className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold"
              >
                បិទ (Close)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

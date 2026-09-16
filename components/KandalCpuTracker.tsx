'use client';

import React, { useState, useMemo } from 'react';
import { 
  Package, Store, BarChart3, TrendingUp, AlertTriangle, 
  Search, CheckCircle2, ChevronRight, ShieldCheck, 
  ArrowUpRight, ArrowDownRight, Layers, Smartphone, Laptop,
  Coffee, ShoppingBag, Filter
} from 'lucide-react';

// Sample 13 Stores (Tube Coffee Branches & ON-MART)
const STORES = [
  { code: 'TKC', name: 'Tube Toul Kork', brand: 'Tube Coffee' },
  { code: 'CCV', name: 'Tube Chbar Ampov', brand: 'Tube Coffee' },
  { code: 'CMH', name: 'Tube Chamkarmon', brand: 'Tube Coffee' },
  { code: 'CDP', name: 'Tube Daun Penh', brand: 'Tube Coffee' },
  { code: 'KPI', name: 'Tube Kbal Thnal', brand: 'Tube Coffee' },
  { code: '2K4', name: 'Tube 2004 St', brand: 'Tube Coffee' },
  { code: 'RTN', name: 'Tube Ratana Plaza', brand: 'Tube Coffee' },
  { code: 'KSH', name: 'Tube Koh Pich', brand: 'Tube Coffee' },
  { code: 'CKD', name: 'Tube Chroy Changvar', brand: 'Tube Coffee' },
  { code: 'TPL', name: 'Tube Toul Tom Poung', brand: 'Tube Coffee' },
  { code: 'NSF', name: 'Tube National Road 5', brand: 'Tube Coffee' },
  { code: 'AMC', name: 'Tube Aeon Mall', brand: 'Tube Coffee' },
  { code: 'ONM', name: 'ON-MART Central', brand: 'ON-MART' },
];

// Representative Sample of the 105 Items
const SAMPLE_ITEMS = [
  { id: '1', code: 'V0003', nameKh: 'ក្រូចឆ្មា (500g)', cat: 'Daily Product', uom: 'Pack', open: 120, inQty: 50, outQty: 65, min: 30 },
  { id: '2', code: 'V0004', nameKh: 'សណ្តែកបណ្តុះ (1000g)', cat: 'Daily Product', uom: 'Pack', open: 45, inQty: 60, outQty: 85, min: 25 },
  { id: '3', code: 'V0001', nameKh: 'ស្លឹកខ្ទឹម (300g)', cat: 'Daily Product', uom: 'Pack', open: 15, inQty: 40, outQty: 45, min: 20 },
  { id: '4', code: 'D0011', nameKh: 'ពងមាន់ (1pcs)', cat: 'Dry Store', uom: 'PCS', open: 2400, inQty: 1200, outQty: 1850, min: 500 },
  { id: '5', code: 'S0001', nameKh: 'ទឹកផ្សំ បាយមាន់គ្រឿង (300g)', cat: 'Semi Product Sauce', uom: 'Pack', open: 85, inQty: 50, outQty: 40, min: 30 },
  { id: '6', code: 'SM017', nameKh: 'សាច់ជ្រូកអាំង (50g)', cat: 'Semi Product Meat', uom: 'Pack', open: 350, inQty: 200, outQty: 420, min: 100 },
  { id: '7', code: 'SM010', nameKh: 'សាច់ គោ (50g)', cat: 'Semi Product Meat', uom: 'Pack', open: 180, inQty: 100, outQty: 140, min: 50 },
  { id: '8', code: '10130122', nameKh: 'ប៉ាស្តាសាច់ក្រក (180g)', cat: 'Finished Product', uom: 'Pack', open: 90, inQty: 60, outQty: 75, min: 20 },
  { id: '9', code: '10160144', nameKh: 'ប្រហិតសាច់ជ្រូកកញ្ចប់ (500g)', cat: 'OnMart Sauce/Balls', uom: 'Pack', open: 60, inQty: 30, outQty: 45, min: 15 },
];

export default function KandalCpuTracker() {
  const [activeTab, setActiveTab] = useState<'daily' | 'stores' | 'analytics'>('daily');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStore, setSelectedStore] = useState('TKC');

  // Categories list
  const categories = useMemo(() => {
    const set = new Set(SAMPLE_ITEMS.map((item) => item.cat));
    return ['All', ...Array.from(set)];
  }, []);

  // Calculations for Dashboard 1 (Daily Stock)
  const itemsWithComputed = useMemo(() => {
    return SAMPLE_ITEMS.map((item) => {
      const closing = item.open + item.inQty - item.outQty;
      const isLowStock = closing <= item.min;
      return { ...item, closing, isLowStock };
    });
  }, []);

  const filteredItems = useMemo(() => {
    return itemsWithComputed.filter((i) => {
      const matchesSearch =
        i.nameKh.toLowerCase().includes(searchQuery.toLowerCase()) ||
        i.code.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCat = selectedCategory === 'All' || i.cat === selectedCategory;
      return matchesSearch && matchesCat;
    });
  }, [itemsWithComputed, searchQuery, selectedCategory]);

  // Overall statistics
  const stats = useMemo(() => {
    const totalItems = itemsWithComputed.length;
    const lowStockCount = itemsWithComputed.filter((i) => i.isLowStock).length;
    const totalIn = itemsWithComputed.reduce((acc, curr) => acc + curr.inQty, 0);
    const totalOut = itemsWithComputed.reduce((acc, curr) => acc + curr.outQty, 0);
    return { totalItems, lowStockCount, totalIn, totalOut };
  }, [itemsWithComputed]);

  const currentStoreInfo = useMemo(() => {
    return STORES.find((s) => s.code === selectedStore) || STORES[0];
  }, [selectedStore]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* 1. TOP HEADER */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 lg:px-8 py-3.5 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 text-white flex items-center justify-center shadow-sm">
              <Coffee className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-lg text-slate-900 tracking-tight">Kandal CPU Tracker</h1>
                <span className="bg-emerald-100 text-emerald-800 text-[11px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> System Live
                </span>
              </div>
              <p className="text-xs text-slate-500">Central Stock Management & Distribution (Tube Coffee + ON-MART)</p>
            </div>
          </div>

          {/* Device & Mode Badges */}
          <div className="flex items-center gap-2 text-xs">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 border border-slate-200">
              <Laptop className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">PC / Terminal</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 border border-slate-200">
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Mobile Ready</span>
            </div>
          </div>
        </div>

        {/* NAVIGATION TABS */}
        <div className="max-w-7xl mx-auto mt-3 flex items-center gap-2 border-t border-slate-100 pt-2">
          <button
            onClick={() => setActiveTab('daily')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'daily'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Daily Stock</span>
          </button>

          <button
            onClick={() => setActiveTab('stores')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'stores'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Store className="w-4 h-4" />
            <span>13 Stores Distribution</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'analytics'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Analytics & CPU</span>
          </button>
        </div>
      </header>

      {/* 2. MAIN CONTENT AREA */}
      <main className="max-w-7xl mx-auto px-4 lg:px-8 py-6 space-y-6">
        
        {/* ================================================================= */}
        {/* TAB 1: DAILY STOCK TRACKER                                        */}
        {/* ================================================================= */}
        {activeTab === 'daily' && (
          <div className="space-y-6">
            {/* KPI Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                  <span>Total Items</span>
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Layers className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2 text-2xl font-black text-slate-900">{stats.totalItems}</div>
                <div className="text-[11px] text-slate-500 mt-1">Monitored Items in CPU</div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                  <span>Stock In Today</span>
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <ArrowDownRight className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2 text-2xl font-black text-emerald-600">+{stats.totalIn.toLocaleString()}</div>
                <div className="text-[11px] text-slate-500 mt-1">Units Received</div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                  <span>Stock Out Today</span>
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2 text-2xl font-black text-indigo-600">-{stats.totalOut.toLocaleString()}</div>
                <div className="text-[11px] text-slate-500 mt-1">Dispatched to Stores</div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                  <span>Low Stock Warnings</span>
                  <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2 text-2xl font-black text-rose-600">{stats.lowStockCount}</div>
                <div className="text-[11px] text-slate-500 mt-1">Needs Replenishment</div>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="ស្វែងរកតាមឈ្មោះ ឬកូដទំនិញ (Search name or code)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                  />
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
                  <Filter className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="text-xs text-slate-500 font-medium shrink-0">Category:</span>
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`text-xs px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition-all ${
                        selectedCategory === cat
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Stock Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-xs">
                      <th className="py-3 px-4">Item Code</th>
                      <th className="py-3 px-4">Description (Khmer)</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4 text-center">UoM</th>
                      <th className="py-3 px-4 text-right">Opening</th>
                      <th className="py-3 px-4 text-right text-emerald-600">Stock In (+)</th>
                      <th className="py-3 px-4 text-right text-indigo-600">Stock Out (-)</th>
                      <th className="py-3 px-4 text-right">Closing</th>
                      <th className="py-3 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredItems.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-xs text-slate-700">{item.code}</td>
                        <td className="py-3 px-4 font-medium text-slate-900">{item.nameKh}</td>
                        <td className="py-3 px-4 text-xs text-slate-500">{item.cat}</td>
                        <td className="py-3 px-4 text-center">
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs">{item.uom}</span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-slate-600">{item.open.toLocaleString()}</td>
                        <td className="py-3 px-4 text-right font-mono font-medium text-emerald-600">
                          +{item.inQty.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-medium text-indigo-600">
                          -{item.outQty.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                          {item.closing.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {item.isLowStock ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                              <AlertTriangle className="w-3 h-3" /> Low Stock
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" /> Normal
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 2: 13 STORES DISTRIBUTION                                     */}
        {/* ================================================================= */}
        {activeTab === 'stores' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">13 Stores Distribution Overview</h2>
                <p className="text-xs text-slate-500">Tube Coffee Branches (9) + ON-MART Stores (4)</p>
              </div>
            </div>

            {/* Store Selection Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2.5">
              {STORES.map((s) => {
                const isSelected = selectedStore === s.code;
                const isTube = s.brand === 'Tube Coffee';
                return (
                  <button
                    key={s.code}
                    onClick={() => setSelectedStore(s.code)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-amber-600 bg-amber-50/50 shadow-sm ring-2 ring-amber-500/20'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-sm text-slate-900">{s.code}</span>
                      <span
                        className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                          isTube ? 'bg-amber-100 text-amber-800' : 'bg-orange-100 text-orange-800'
                        }`}
                      >
                        {isTube ? 'Tube' : 'OnMart'}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 truncate">{s.name}</div>
                  </button>
                );
              })}
            </div>

            {/* Distribution Card for Selected Store */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-sm">
                    {currentStoreInfo.code}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{currentStoreInfo.name}</h3>
                    <span className="text-xs text-slate-500">Brand: {currentStoreInfo.brand}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full font-semibold border border-emerald-200">
                    Active Delivery Branch
                  </span>
                </div>
              </div>

              {/* Sample Allocated Items Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs font-semibold">
                      <th className="py-2.5 px-3">Item Code</th>
                      <th className="py-2.5 px-3">Description</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3 text-right">Dispatched Today</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {SAMPLE_ITEMS.slice(0, 6).map((item, idx) => (
                      <tr key={item.id} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3 font-mono font-bold text-xs text-slate-700">{item.code}</td>
                        <td className="py-2.5 px-3 font-medium text-slate-900">{item.nameKh}</td>
                        <td className="py-2.5 px-3 text-xs text-slate-500">{item.cat}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-700">
                          {(Math.floor(item.outQty / 13) + (idx % 3)).toLocaleString()} {item.uom}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="px-2 py-0.5 rounded text-[11px] bg-slate-100 text-slate-700 font-medium">
                            Delivered
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 3: ANALYTICS & CPU                                             */}
        {/* ================================================================= */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase">
                  <span>Stock Turnover Health</span>
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="mt-3 text-3xl font-black text-slate-900">92.4%</div>
                <p className="text-xs text-slate-500 mt-1">High dispatch efficiency across 13 stores</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase">
                  <span>Fast Moving Category</span>
                  <ShoppingBag className="w-4 h-4 text-amber-600" />
                </div>
                <div className="mt-3 text-2xl font-bold text-slate-900">Semi Product Meat</div>
                <p className="text-xs text-slate-500 mt-1">Accounts for 38% of total daily output</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase">
                  <span>Data Integrity</span>
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                </div>
                <div className="mt-3 text-3xl font-black text-blue-600">100%</div>
                <p className="text-xs text-slate-500 mt-1">ACID Atomic local logs verified</p>
              </div>
            </div>

            {/* Fast Moving Items Overview */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <h3 className="font-bold text-sm text-slate-900 mb-3">Top Dispatched Items (Stock Out Velocity)</h3>
              <div className="space-y-3">
                {SAMPLE_ITEMS.slice(0, 5).map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs">
                        {item.code.substring(0, 3)}
                      </div>
                      <div>
                        <div className="font-semibold text-xs text-slate-900">{item.nameKh}</div>
                        <div className="text-[11px] text-slate-500">{item.cat} • {item.uom}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold font-mono text-sm text-indigo-600">-{item.outQty}</div>
                      <div className="text-[10px] text-slate-400">Total Outflow</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

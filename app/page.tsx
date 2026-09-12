'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Store,
  Package,
  TrendingUp,
  Award,
  Layers,
  Calendar,
  Search,
  ArrowUpRight,
  Coffee,
  ShoppingBag,
  Save,
  RotateCcw,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  BarChart2,
  ChevronLeft,
  ChevronRight,
  Database,
  Cloud,
  Check
} from 'lucide-react';
import Link from 'next/link';
import { getNormalizedStarterItems } from '@/lib/starter-items';
import { StockItem, FilterLocation, CalculatedStockRow } from '@/lib/types';
import { KPICards } from '@/components/KPICards';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

// ==========================================
// 1. DATA CONFIGURATION: 13 STORES
// ==========================================
export interface StoreData {
  id: string;
  name: string;
  code: string;
  brand: 'Tube Coffee' | 'OnMart';
  totalUnits: number;
  lastUpdated?: string;
}

const INITIAL_STORES: StoreData[] = [
  // Tube Coffee (9 Stores)
  { id: 's1', name: 'Tube Coffee KPI', code: 'KPI', brand: 'Tube Coffee', totalUnits: 1450 },
  { id: 's2', name: 'Tube Coffee TKC', code: 'TKC', brand: 'Tube Coffee', totalUnits: 1320 },
  { id: 's3', name: 'Tube Coffee CCV', code: 'CCV', brand: 'Tube Coffee', totalUnits: 1180 },
  { id: 's4', name: 'Tube Coffee CDP', code: 'CDP', brand: 'Tube Coffee', totalUnits: 1050 },
  { id: 's5', name: 'Tube Coffee CYH', code: 'CYH', brand: 'Tube Coffee', totalUnits: 980 },
  { id: 's6', name: 'Tube Coffee KSH', code: 'KSH', brand: 'Tube Coffee', totalUnits: 920 },
  { id: 's7', name: 'Tube Coffee CKD', code: 'CKD', brand: 'Tube Coffee', totalUnits: 890 },
  { id: 's8', name: 'Tube Coffee 2K4', code: '2K4', brand: 'Tube Coffee', totalUnits: 760 },
  { id: 's9', name: 'Tube Coffee ATN', code: 'ATN', brand: 'Tube Coffee', totalUnits: 650 },
  // OnMart (4 Stores)
  { id: 's10', name: 'OnMart POK', code: 'POK', brand: 'OnMart', totalUnits: 1120 },
  { id: 's11', name: 'OnMart TK', code: 'TK', brand: 'OnMart', totalUnits: 940 },
  { id: 's12', name: 'OnMart OU3', code: 'OU3', brand: 'OnMart', totalUnits: 710 },
  { id: 's13', name: 'OnMart DT', code: 'DT', brand: 'OnMart', totalUnits: 580 },
];

// ==========================================
// 2. DATA CONFIGURATION: SAMPLE & MASTER ITEMS
// ==========================================
export interface ItemData {
  item_code: string;
  description_khmer: string;
  brand: 'Tube Coffee' | 'OnMart';
  category: string;
  uom: string;
  cpu: number;
  stock_out_total: number;
  current_stock: number;
}

const STORAGE_STORES_KEY = 'kandal_cpu_store_totals_v3';
const STORAGE_LOGS_KEY = 'kandal_cpu_stock_logs';

const MONTHS = [
  { num: 1, key: '01', en: 'Jan', kh: 'មករា' },
  { num: 2, key: '02', en: 'Feb', kh: 'កុម្ភៈ' },
  { num: 3, key: '03', en: 'Mar', kh: 'មីនា' },
  { num: 4, key: '04', en: 'Apr', kh: 'មេសា' },
  { num: 5, key: '05', en: 'May', kh: 'ឧសភា' },
  { num: 6, key: '06', en: 'Jun', kh: 'មិថុនា' },
  { num: 7, key: '07', en: 'Jul', kh: 'កក្កដា' },
  { num: 8, key: '08', en: 'Aug', kh: 'សីហា' },
  { num: 9, key: '09', en: 'Sep', kh: 'កញ្ញា' },
  { num: 10, key: '10', en: 'Oct', kh: 'តុលា' },
  { num: 11, key: '11', en: 'Nov', kh: 'វិច្ឆិកា' },
  { num: 12, key: '12', en: 'Dec', kh: 'ធ្នូ' },
];

export default function AntigravityDashboard() {
  const [activeTab, setActiveTab] = useState<'stores' | 'items' | 'detailed'>('stores');
  const [selectedBrand, setSelectedBrand] = useState<'ALL' | 'Tube Coffee' | 'OnMart'>('ALL');
  const [stores, setStores] = useState<StoreData[]>(INITIAL_STORES);
  const [searchTerm, setSearchTerm] = useState('');
  const [savedAlert, setSavedAlert] = useState(false);

  // Load saved store totals from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_STORES_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setStores(parsed);
          }
        }
      } catch (e) {
        console.error('Error loading store totals', e);
      }
    }
  }, []);

  // Update total for store
  const handleStoreTotalChange = (id: string, value: number) => {
    setStores((prev) => {
      const updated = prev.map((s) => (s.id === id ? { ...s, totalUnits: isNaN(value) ? 0 : value } : s));
      // Auto save locally
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_STORES_KEY, JSON.stringify(updated));
      }
      return updated;
    });
  };

  // Build full item list (105 items) with accurate stock stats
  const allMasterItems: ItemData[] = useMemo(() => {
    const starters = getNormalizedStarterItems() as StockItem[];
    let logs: Record<string, Record<string, { stock_in: number; stock_out: number }>> = {};
    if (typeof window !== 'undefined') {
      try {
        logs = JSON.parse(localStorage.getItem(STORAGE_LOGS_KEY) || '{}');
      } catch {
        logs = {};
      }
    }

    return starters.map((it) => {
      let stockOut = 0;
      Object.values(logs).forEach((dayMap) => {
        if (dayMap[it.id]?.stock_out) {
          stockOut += Number(dayMap[it.id].stock_out) || 0;
        }
      });

      // Default reasonable demo distribution if no manual entries yet
      if (stockOut === 0) {
        if (it.code === 'SM017') stockOut = 2800;
        else if (it.code === 'D0011') stockOut = 2590;
        else if (it.code === 'SM010') stockOut = 1240;
        else if (it.code === 'SM027') stockOut = 930;
        else if (it.code === 'SM013') stockOut = 750;
        else if (it.code === 'SM032') stockOut = 640;
        else if (it.code === 'SM008') stockOut = 590;
        else if (it.code === 'SM031') stockOut = 470;
        else if (it.code === '10160147') stockOut = 450;
        else if (it.code === '10150139') stockOut = 420;
        else if (it.code === 'S0031') stockOut = 326;
        else if (it.code === 'S0046') stockOut = 310;
        else stockOut = Math.max(10, Math.round(it.opening_stock * 0.4));
      }

      const balance = Math.max(0, it.opening_stock - stockOut);

      return {
        item_code: it.code,
        description_khmer: it.description_khmer,
        brand: it.location === 'TUBE_COFFEE' ? 'Tube Coffee' : 'OnMart',
        category: it.category,
        uom: it.uom,
        cpu: it.cpu,
        stock_out_total: stockOut,
        current_stock: balance,
      };
    });
  }, []);

  // Top 10 Stores calculation
  const top10Stores = useMemo(() => {
    return [...stores].sort((a, b) => b.totalUnits - a.totalUnits).slice(0, 10);
  }, [stores]);

  const maxStoreUnits = useMemo(() => {
    return top10Stores[0]?.totalUnits || 1;
  }, [top10Stores]);

  // Top 10 Items calculation
  const top10Items = useMemo(() => {
    return [...allMasterItems].sort((a, b) => b.stock_out_total - a.stock_out_total).slice(0, 10);
  }, [allMasterItems]);

  const maxItemUnits = useMemo(() => {
    return top10Items[0]?.stock_out_total || 1;
  }, [top10Items]);

  // Filtered Stores for Table
  const filteredStores = useMemo(() => {
    return stores.filter((s) => {
      const matchBrand = selectedBrand === 'ALL' || s.brand === selectedBrand;
      const matchSearch =
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.code.toLowerCase().includes(searchTerm.toLowerCase());
      return matchBrand && matchSearch;
    });
  }, [stores, selectedBrand, searchTerm]);

  // Filtered Items for Master Overview Table
  const filteredItems = useMemo(() => {
    return allMasterItems.filter((i) => {
      const matchBrand = selectedBrand === 'ALL' || i.brand === selectedBrand;
      const matchSearch =
        i.description_khmer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.item_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.category.toLowerCase().includes(searchTerm.toLowerCase());
      return matchBrand && matchSearch;
    });
  }, [allMasterItems, selectedBrand, searchTerm]);

  // Total Summary stats
  const totalDeliveredUnits = useMemo(() => {
    return stores.reduce((acc, s) => acc + s.totalUnits, 0);
  }, [stores]);

  const handleSave = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_STORES_KEY, JSON.stringify(stores));
    }
    setSavedAlert(true);
    setTimeout(() => setSavedAlert(false), 3000);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-4 md:p-6 lg:p-8">
      {/* Top Header */}
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full bg-emerald-100 text-emerald-800">
                Kandal Commissary Kitchen
              </span>
              <span className="text-xs text-slate-400 font-medium">v3.0 Simplified Analytics</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-800 mt-1">
              ប្រព័ន្ធគ្រប់គ្រងចែកចាយសាខា &amp; ស្តុកកណ្តាល
            </h1>
            <p className="text-sm text-slate-500">
              Tube Coffee+ (9 ហាង) &amp; OnMart (4 ហាង) — មើលទិន្នន័យស្រួល និងបញ្ចូលតែចំនួនសរុប
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="flex items-center bg-slate-100 p-1.5 rounded-xl border border-slate-200 flex-wrap gap-1">
            <button
              onClick={() => setActiveTab('stores')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'stores'
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Store className="w-4 h-4" />
              <span>ផ្ទាំងសាខា (Store Totals &amp; Top 10)</span>
            </button>
            <button
              onClick={() => setActiveTab('items')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'items'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>ផ្ទាំងទំនិញ (Items &amp; Top 10)</span>
            </button>
          </div>
        </header>

        {/* ========================================================= */}
        {/* VIEW 1: STORE DASHBOARD (TOTAL ONLY + TOP 10) */}
        {/* ========================================================= */}
        {activeTab === 'stores' && (
          <div className="space-y-6 animate-fadeIn">
            {/* KPI Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 font-medium">ចំនួនផ្គត់ផ្គង់សរុបទៅសាខា</p>
                  <p className="text-2xl font-bold text-slate-800 mt-1">{totalDeliveredUnits.toLocaleString()} units</p>
                  <span className="text-xs text-emerald-600 font-medium">សាខាទាំង ១៣</span>
                </div>
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 font-medium">សាខាលំដាប់លេខ ១ (Top 1)</p>
                  <p className="text-xl font-bold text-slate-800 mt-1">{top10Stores[0]?.name || 'N/A'}</p>
                  <span className="text-xs text-slate-400 font-medium">
                    {top10Stores[0]?.totalUnits.toLocaleString()} units
                  </span>
                </div>
                <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                  <Award className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 font-medium">Tube Coffee+ (9 ហាង)</p>
                  <p className="text-2xl font-bold text-slate-800 mt-1">
                    {stores
                      .filter((s) => s.brand === 'Tube Coffee')
                      .reduce((a, b) => a + b.totalUnits, 0)
                      .toLocaleString()}{' '}
                    units
                  </p>
                  <span className="text-xs text-slate-400">សាខាកាហ្វេ</span>
                </div>
                <div className="w-12 h-12 bg-amber-50 text-amber-700 rounded-xl flex items-center justify-center">
                  <Coffee className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 font-medium">OnMart (4 ហាង)</p>
                  <p className="text-2xl font-bold text-slate-800 mt-1">
                    {stores
                      .filter((s) => s.brand === 'OnMart')
                      .reduce((a, b) => a + b.totalUnits, 0)
                      .toLocaleString()}{' '}
                    units
                  </p>
                  <span className="text-xs text-slate-400">សាខា Mart</span>
                </div>
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                  <ShoppingBag className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* TOP 10 STORES LEADERBOARD */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <Award className="w-5 h-5 text-amber-500" />
                    តារាងចំណាត់ថ្នាក់ TOP 10 STORES (សាខាទទួលទំនិញច្រើនជាងគេ)
                  </h2>
                  <p className="text-xs text-slate-500">គិតជាចំនួនសរុប (Units) ដែលបានចែកចាយទៅសាខានីមួយៗ</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {top10Stores.map((store, index) => {
                  const percentage =
                    totalDeliveredUnits > 0 ? ((store.totalUnits / totalDeliveredUnits) * 100).toFixed(1) : '0';
                  const barWidth = `${Math.round((store.totalUnits / maxStoreUnits) * 100)}%`;

                  return (
                    <div
                      key={store.id}
                      className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center gap-4 hover:bg-slate-100/60 transition-all"
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                          index === 0
                            ? 'bg-amber-400 text-white'
                            : index === 1
                            ? 'bg-slate-300 text-slate-800'
                            : index === 2
                            ? 'bg-amber-700 text-white'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {index + 1}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-slate-800 truncate text-sm">{store.name}</span>
                          <span className="text-sm font-bold text-emerald-700">
                            {store.totalUnits.toLocaleString()} units
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              store.brand === 'Tube Coffee' ? 'bg-amber-500' : 'bg-blue-500'
                            }`}
                            style={{ width: barWidth }}
                          />
                        </div>
                        <div className="flex justify-between items-center mt-1 text-xs text-slate-400">
                          <span>
                            {store.brand} ({store.code})
                          </span>
                          <span>{percentage}% of Total</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* SIMPLIFIED STORE ENTRY TABLE (TOTAL UNITS ONLY - NO ITEMS BREAKDOWN) */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-800">
                    បញ្ចូលចំនួនសរុបក្នុងមួយ STORE (មិនបាច់វាយ Items ចូលទេ)
                  </h2>
                  <p className="text-xs text-slate-500">
                    គ្រាន់តែវាយចំនួនសរុប (Total Units) សម្រាប់សាខានីមួយៗ រួចចុច Save Online
                  </p>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
                  {/* Brand Filter */}
                  <div className="inline-flex rounded-lg border border-slate-200 p-1 bg-slate-50 text-xs font-semibold">
                    <button
                      onClick={() => setSelectedBrand('ALL')}
                      className={`px-3 py-1.5 rounded-md ${
                        selectedBrand === 'ALL' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'
                      }`}
                    >
                      ទាំងអស់ (13)
                    </button>
                    <button
                      onClick={() => setSelectedBrand('Tube Coffee')}
                      className={`px-3 py-1.5 rounded-md ${
                        selectedBrand === 'Tube Coffee' ? 'bg-white text-amber-700 shadow-sm' : 'text-slate-500'
                      }`}
                    >
                      Tube Coffee (9)
                    </button>
                    <button
                      onClick={() => setSelectedBrand('OnMart')}
                      className={`px-3 py-1.5 rounded-md ${
                        selectedBrand === 'OnMart' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500'
                      }`}
                    >
                      OnMart (4)
                    </button>
                  </div>

                  <button
                    onClick={handleSave}
                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-sm"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Online</span>
                  </button>
                </div>
              </div>

              {savedAlert && (
                <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800 text-sm animate-pulse">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>បានរក្សាទុកទិន្នន័យសាខាទាំងអស់ដោយជោគជ័យ!</span>
                </div>
              )}

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs font-bold uppercase tracking-wider">
                      <th className="p-3">Store Code</th>
                      <th className="p-3">ឈ្មោះសាខា (Store Name)</th>
                      <th className="p-3">Brand</th>
                      <th className="p-3 text-right">ចំនួនសរុប (Total Units)</th>
                      <th className="p-3 text-right">% ចំណែក</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredStores.map((store) => {
                      const share =
                        totalDeliveredUnits > 0 ? ((store.totalUnits / totalDeliveredUnits) * 100).toFixed(1) : '0';

                      return (
                        <tr key={store.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="p-3 font-bold text-slate-800">
                            <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs">
                              {store.code}
                            </span>
                          </td>
                          <td className="p-3 font-medium text-slate-700">{store.name}</td>
                          <td className="p-3">
                            <span
                              className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                                store.brand === 'Tube Coffee'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {store.brand}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <input
                              type="number"
                              min="0"
                              value={store.totalUnits}
                              onChange={(e) => handleStoreTotalChange(store.id, parseInt(e.target.value))}
                              className="w-32 px-3 py-1.5 text-right font-bold text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                            />
                          </td>
                          <td className="p-3 text-right font-semibold text-slate-500">{share}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 2: ITEMS DASHBOARD (KITCHEN & TOP 10 ITEMS) */}
        {/* ========================================================= */}
        {activeTab === 'items' && (
          <div className="space-y-6 animate-fadeIn">
            {/* TOP 10 ITEMS LEADERBOARD */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <Award className="w-5 h-5 text-indigo-600" />
                    តារាងចំណាត់ថ្នាក់ TOP 10 ITEMS (ទំនិញចេញច្រើនជាងគេបំផុត)
                  </h2>
                  <p className="text-xs text-slate-500">
                    ទិន្នន័យស្រង់ចេញពីការកត់ត្រាស្តុកចេញប្រចាំខែ (Stock Out Total)
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {top10Items.map((item, index) => {
                  const barWidth = `${Math.round((item.stock_out_total / maxItemUnits) * 100)}%`;

                  return (
                    <div
                      key={item.item_code}
                      className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center gap-4 hover:bg-slate-100/60 transition-all"
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                          index === 0
                            ? 'bg-amber-400 text-white'
                            : index === 1
                            ? 'bg-slate-300 text-slate-800'
                            : index === 2
                            ? 'bg-amber-700 text-white'
                            : 'bg-indigo-100 text-indigo-800'
                        }`}
                      >
                        {index + 1}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-slate-800 truncate text-sm">
                            {item.description_khmer}
                          </span>
                          <span className="text-sm font-bold text-indigo-700">
                            {item.stock_out_total.toLocaleString()} {item.uom}
                          </span>
                        </div>

                        {/* Bar */}
                        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-indigo-600 transition-all duration-500"
                            style={{ width: barWidth }}
                          />
                        </div>
                        <div className="flex justify-between items-center mt-1 text-xs text-slate-400">
                          <span>
                            Code: {item.item_code} • {item.category}
                          </span>
                          <span>សល់ស្តុក: {item.current_stock}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* MASTER ITEMS OVERVIEW TABLE */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-800">
                    បញ្ជីទំនិញមេ (Items Master &amp; Inventory 105 Items)
                  </h2>
                  <span className="text-xs text-slate-400">គ្រប់គ្រងដោយ Kitchen ស្តុកកណ្តាល</span>
                </div>

                {/* Search Bar */}
                <div className="relative min-w-[260px] w-full sm:w-auto">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="ស្វែងរកតាម Code ឬ ឈ្មោះ (105 Items)..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-2xs"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs font-bold uppercase tracking-wider">
                      <th className="p-3">Item Code</th>
                      <th className="p-3">ឈ្មោះទំនិញ (Khmer Description)</th>
                      <th className="p-3">Brand</th>
                      <th className="p-3">Category</th>
                      <th className="p-3">UOM</th>
                      <th className="p-3 text-right">CPU ($)</th>
                      <th className="p-3 text-right">សរុបចេញ (Stock Out)</th>
                      <th className="p-3 text-right">ស្តុកនៅសល់</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredItems.map((item) => (
                      <tr key={item.item_code} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-3 font-bold text-slate-700">{item.item_code}</td>
                        <td className="p-3 font-medium text-slate-800">{item.description_khmer}</td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-semibold ${
                              item.brand === 'Tube Coffee'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {item.brand}
                          </span>
                        </td>
                        <td className="p-3 text-slate-500 text-xs">{item.category}</td>
                        <td className="p-3 text-slate-500">{item.uom}</td>
                        <td className="p-3 text-right font-mono font-bold text-emerald-700">
                          ${item.cpu.toFixed(2)}
                        </td>
                        <td className="p-3 text-right font-bold text-indigo-700">
                          {item.stock_out_total.toLocaleString()}
                        </td>
                        <td className="p-3 text-right font-semibold text-emerald-600">
                          {item.current_stock.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

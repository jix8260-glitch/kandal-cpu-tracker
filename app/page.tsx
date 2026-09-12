'use client';

import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { StockItem, FilterLocation, CalculatedStockRow, TUBE_COFFEE_STORES, ONMART_STORES, ALL_STORES } from '@/lib/types';
import { KPICards } from '@/components/KPICards';
import {
  RefreshCw,
  Save,
  Plus,
  Search,
  Calendar,
  Coffee,
  Store,
  Layers,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Database,
  Cloud,
  Sparkles,
  BarChart2,
  CalendarDays,
  ShieldCheck,
  Check,
} from 'lucide-react';
import Link from 'next/link';
import { getNormalizedStarterItems } from '@/lib/starter-items';

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

const YEARS = [2024, 2025, 2026, 2027, 2028];
const STORAGE_LOGS_KEY = 'kandal_cpu_stock_logs';

// Bulletproof LocalStorage helpers
const getStoredLogs = (): Record<string, Record<string, { stock_in: number; stock_out: number }>> => {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem(STORAGE_LOGS_KEY) || '{}');
  } catch {
    return {};
  }
};

const setStoredLogs = (data: Record<string, Record<string, { stock_in: number; stock_out: number }>>) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_LOGS_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('LocalStorage write error:', e);
  }
};

export default function DailyStockTrackerPage() {
  const [items, setItems] = useState<StockItem[]>([]);
  const [dailyLogs, setDailyLogs] = useState<Record<string, { stock_in: number; stock_out: number }>>({});
  const [selectedLocation, setSelectedLocation] = useState<FilterLocation>('ALL');
  const [selectedStore, setSelectedStore] = useState<string>('ALL');

  // Month & Year Filter State
  const today = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(() => today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(() => today.getMonth() + 1);
  const [selectedDay, setSelectedDay] = useState<number>(() => today.getDate());
  const [viewMode, setViewMode] = useState<'DAILY' | 'MONTHLY'>('DAILY');

  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [autoSavedNotice, setAutoSavedNotice] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Compute number of days in selected month
  const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
  const clampedDay = Math.min(selectedDay, daysInMonth);
  const selectedDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(clampedDay).padStart(2, '0')}`;

  // 1. Fetch Items and Logs from LocalStorage & Supabase
  useEffect(() => {
    fetchItemsAndLogs();
  }, [selectedYear, selectedMonth, clampedDay, viewMode, selectedLocation]);

  const fetchItemsAndLogs = async () => {
    setLoading(true);
    setFeedback(null);

    const allStarters = getNormalizedStarterItems() as StockItem[];

    // --- STEP 1: Load items (Cloud or Starter 105 Items) ---
    if (!isSupabaseConfigured) {
      let filtered = allStarters;
      if (selectedLocation !== 'ALL') {
        filtered = filtered.filter((i) => i.location === selectedLocation);
      }
      setItems(filtered);
    } else {
      try {
        let itemQuery = supabase.from('item_master').select('*').order('code');
        if (selectedLocation !== 'ALL') {
          itemQuery = itemQuery.eq('location', selectedLocation);
        }
        let { data: itemData, error: itemError } = await itemQuery;

        if (itemError || !itemData || itemData.length === 0) {
          let itemsQuery = supabase.from('items').select('*');
          if (selectedLocation !== 'ALL') {
            const locName = selectedLocation === 'TUBE_COFFEE' ? 'Tube Coffee' : 'OnMart';
            itemsQuery = itemsQuery.or(`location.eq.${selectedLocation},location.eq.${locName}`);
          }
          const { data: altData, error: altError } = await itemsQuery;
          if (!altError && altData && altData.length > 0) {
            itemData = altData.map((it: any) => ({
              id: it.id || `item-${it.item_code || it.code}`,
              code: it.item_code || it.code,
              description_khmer: it.description_khmer,
              category: it.category,
              uom: it.uom,
              cpu: Number(it.cpu) || 0,
              location: String(it.location).toUpperCase().includes('TUBE') ? 'TUBE_COFFEE' : 'ONMART',
              opening_stock: Number(it.opening_stock) || 0,
            }));
            itemError = null;
          }
        }

        if (itemError || !itemData || itemData.length === 0) {
          setItems(selectedLocation === 'ALL' ? allStarters : allStarters.filter((i) => i.location === selectedLocation));
        } else {
          setItems(itemData);
        }
      } catch (err) {
        setItems(allStarters.filter((i) => selectedLocation === 'ALL' || i.location === selectedLocation));
      }
    }

    // --- STEP 2: Load Stock Logs (Guaranteed LocalStorage + Supabase Cloud Merge) ---
    const allStored = getStoredLogs();
    let loadedLogs: Record<string, { stock_in: number; stock_out: number }> = {};

    if (viewMode === 'DAILY') {
      // Load saved logs for this specific date
      loadedLogs = { ...(allStored[selectedDate] || {}) };

      // If Supabase is configured, fetch and merge remote logs
      if (isSupabaseConfigured) {
        try {
          const { data: logData, error: logError } = await supabase
            .from('daily_stock_logs')
            .select('*')
            .eq('entry_date', selectedDate);

          if (!logError && logData) {
            logData.forEach((log: any) => {
              loadedLogs[log.item_id] = {
                stock_in: Number(log.stock_in) || 0,
                stock_out: Number(log.stock_out) || 0,
              };
            });
            // Also update local cache
            allStored[selectedDate] = { ...loadedLogs };
            setStoredLogs(allStored);
          }
        } catch (e) {
          console.warn('Supabase fetch error, using local logs:', e);
        }
      }
      setDailyLogs(loadedLogs);
    } else {
      // MONTHLY MODE: Sum all logs for that month from LocalStorage
      const monthPrefix = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
      Object.entries(allStored).forEach(([dateStr, itemsMap]) => {
        if (dateStr.startsWith(monthPrefix)) {
          Object.entries(itemsMap).forEach(([itemId, log]) => {
            if (!loadedLogs[itemId]) loadedLogs[itemId] = { stock_in: 0, stock_out: 0 };
            loadedLogs[itemId].stock_in += Number(log.stock_in) || 0;
            loadedLogs[itemId].stock_out += Number(log.stock_out) || 0;
          });
        }
      });

      // Also merge with Supabase if online
      if (isSupabaseConfigured) {
        try {
          const startDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;
          const endDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;

          const { data: monthLogs } = await supabase
            .from('daily_stock_logs')
            .select('*')
            .gte('entry_date', startDate)
            .lte('entry_date', endDate);

          if (monthLogs) {
            monthLogs.forEach((log: any) => {
              if (!loadedLogs[log.item_id]) loadedLogs[log.item_id] = { stock_in: 0, stock_out: 0 };
              loadedLogs[log.item_id].stock_in = Math.max(loadedLogs[log.item_id].stock_in, Number(log.stock_in) || 0);
              loadedLogs[log.item_id].stock_out = Math.max(loadedLogs[log.item_id].stock_out, Number(log.stock_out) || 0);
            });
          }
        } catch (e) {
          console.warn('Supabase month fetch error:', e);
        }
      }
      setDailyLogs(loadedLogs);
    }

    setLoading(false);
  };

  // 2. Handle Key-In Inputs (Instant Auto-Save to LocalStorage)
  const handleInputChange = (itemId: string, field: 'stock_in' | 'stock_out', value: number) => {
    const clampedVal = Math.max(0, value || 0);

    setDailyLogs((prev) => {
      const updated = {
        ...prev,
        [itemId]: {
          stock_in: prev[itemId]?.stock_in || 0,
          stock_out: prev[itemId]?.stock_out || 0,
          [field]: clampedVal,
        },
      };

      // Auto-save instantly to LocalStorage
      const allStored = getStoredLogs();
      if (!allStored[selectedDate]) allStored[selectedDate] = {};
      allStored[selectedDate][itemId] = {
        stock_in: updated[itemId].stock_in,
        stock_out: updated[itemId].stock_out,
      };
      setStoredLogs(allStored);

      // Trigger auto-save visual indicator
      setAutoSavedNotice(true);
      setTimeout(() => setAutoSavedNotice(false), 2000);

      return updated;
    });
  };

  // 3. Save Online (Sync to Cloud + LocalStorage)
  const handleSaveOnline = async () => {
    if (viewMode !== 'DAILY') {
      alert('ℹ️ សូមជ្រើសរើសទម្រង់ "តាមថ្ងៃ (Daily)" ដើម្បីកត់ត្រាស្តុកប្រចាំថ្ងៃ។');
      return;
    }

    // Always guarantee LocalStorage is saved
    const allStored = getStoredLogs();
    allStored[selectedDate] = { ...dailyLogs };
    setStoredLogs(allStored);

    if (isSupabaseConfigured) {
      setSaving(true);
      setFeedback(null);
      try {
        const updates = Object.entries(dailyLogs).map(([itemId, log]) => ({
          item_id: itemId,
          entry_date: selectedDate,
          stock_in: log.stock_in || 0,
          stock_out: log.stock_out || 0,
        }));

        if (updates.length === 0) {
          alert('មិនមានទិន្នន័យត្រូវរក្សាទុកទេ។');
          setSaving(false);
          return;
        }

        const res = await fetch('/api/logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ updates }),
        });

        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to save');

        setFeedback({
          text: `✅ បានរក្សាទុកទិន្នន័យ ${updates.length} មុខក្នុង Supabase Cloud និង Browser រួចរាល់!`,
          type: 'success',
        });
      } catch (err: any) {
        setFeedback({
          text: `⚠️ បានរក្សាទុកក្នុង Browser ដោយសុវត្ថិភាព (Cloud Sync Error: ${err.message})`,
          type: 'info',
        });
      } finally {
        setSaving(false);
      }
    } else {
      // Local mode save
      setFeedback({
        text: `✅ បានរក្សាទុកក្នុង Browser (LocalStorage) រួចរាល់ ១០០%! ទោះបីបិទកុំព្យូទ័រ ឬ Refresh ក៏ទិន្នន័យនៅរក្សាទុកដដែល។`,
        type: 'success',
      });
    }
  };

  // 4. Seed database with 1-click
  const handleSeedDatabase = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/seed', { method: 'POST' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Seeding failed');
      setFeedback({ text: json.message, type: 'success' });
      fetchItemsAndLogs();
    } catch (err: any) {
      alert('Seeding error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Date stepper
  const changeDateByDays = (days: number) => {
    const current = new Date(selectedYear, selectedMonth - 1, clampedDay);
    current.setDate(current.getDate() + days);
    setSelectedYear(current.getFullYear());
    setSelectedMonth(current.getMonth() + 1);
    setSelectedDay(current.getDate());
  };

  // Filter items based on search query
  const filteredItems = items.filter(
    (item) =>
      item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description_khmer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculations
  let totalStockValue = 0;
  let totalStockIn = 0;
  let totalStockOut = 0;
  let totalOpeningStock = 0;
  let totalBalance = 0;

  const calculatedRows: CalculatedStockRow[] = filteredItems.map((item) => {
    const log = dailyLogs[item.id] || { stock_in: 0, stock_out: 0 };
    const stockIn = log.stock_in || 0;
    const stockOut = log.stock_out || 0;
    const balance = item.opening_stock + stockIn - stockOut;
    const stockValue = balance * item.cpu;

    totalOpeningStock += item.opening_stock;
    totalStockIn += stockIn;
    totalStockOut += stockOut;
    totalBalance += balance;
    totalStockValue += stockValue;

    return {
      ...item,
      stock_in: stockIn,
      stock_out: stockOut,
      balance,
      stockValue,
      isNegative: balance < 0,
      isLow: balance <= 15,
    };
  });

  const currentMonthInfo = MONTHS.find((m) => m.num === selectedMonth) || MONTHS[8];

  return (
    <div className="space-y-6">
      {/* 1. Control Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 leading-tight flex items-center gap-2">
              <span>CPU • Stock Tracker</span>
              <span className="text-xs bg-emerald-100 text-emerald-900 font-bold px-2 py-0.5 rounded-md border border-emerald-300">
                Kandal Commissary Kitchen
              </span>
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5 flex items-center gap-2">
              <span>បែងចែកតាម <strong>ខែ &amp; ឆ្នាំ</strong> (Tube Coffee+ &amp; OnMart • 105 Items • 13 ហាង)</span>
              {autoSavedNotice && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 animate-pulse">
                  <Check className="w-3 h-3" />
                  <span>រក្សាទុកស្វ័យប្រវត្តិ (Saved!)</span>
                </span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={fetchItemsAndLogs}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold border border-slate-300 transition-colors"
              title="Refresh Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>

            {isSupabaseConfigured && items.length === 0 && (
              <button
                onClick={handleSeedDatabase}
                disabled={loading}
                className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-semibold border border-blue-200 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Seed Items</span>
              </button>
            )}

            <Link
              href="/items"
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>Add Item</span>
            </Link>

            {viewMode === 'DAILY' && (
              <button
                onClick={handleSaveOnline}
                disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving...' : 'Save Online (រក្សាទុក)'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Feedback Message */}
        {feedback && (
          <div
            className={`mt-3 p-3 rounded-xl text-xs font-semibold flex items-center justify-between ${
              feedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : feedback.type === 'error'
                ? 'bg-rose-50 text-rose-800 border border-rose-200'
                : 'bg-blue-50 text-blue-800 border border-blue-200'
            }`}
          >
            <span>{feedback.text}</span>
            <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-600 font-bold ml-2">
              ✕
            </button>
          </div>
        )}

        {/* YEAR & LOCATION & VIEW MODE SELECTOR */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Location Switcher */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 gap-1">
            <button
              onClick={() => {
                setSelectedLocation('ALL');
                setSelectedStore('ALL');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
                selectedLocation === 'ALL'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              <span>All Locations (13 ហាង)</span>
            </button>

            <button
              onClick={() => {
                setSelectedLocation('TUBE_COFFEE');
                setSelectedStore('ALL');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
                selectedLocation === 'TUBE_COFFEE'
                  ? 'bg-white text-amber-900 shadow-xs'
                  : 'text-slate-600 hover:text-amber-800'
              }`}
            >
              <Coffee className="w-3.5 h-3.5 text-amber-600" />
              <span>Tube Coffee+ (៦៩ Items - 9 ហាង)</span>
            </button>

            <button
              onClick={() => {
                setSelectedLocation('ONMART');
                setSelectedStore('ALL');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
                selectedLocation === 'ONMART'
                  ? 'bg-white text-emerald-900 shadow-xs'
                  : 'text-slate-600 hover:text-emerald-800'
              }`}
            >
              <Store className="w-3.5 h-3.5 text-emerald-600" />
              <span>OnMart (៣៦ Items - 4 ហាង)</span>
            </button>
          </div>

          {/* Year Selector & View Mode Switcher */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Year Pills */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 gap-1">
              <span className="px-2 font-bold text-slate-500 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>ឆ្នាំ:</span>
              </span>
              {YEARS.map((yr) => (
                <button
                  key={yr}
                  onClick={() => setSelectedYear(yr)}
                  className={`px-3 py-1 rounded-lg font-black transition-all ${
                    selectedYear === yr
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {yr}
                </button>
              ))}
            </div>

            {/* View Mode: Daily vs Monthly */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 gap-1 font-bold">
              <button
                onClick={() => setViewMode('DAILY')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all ${
                  viewMode === 'DAILY'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <CalendarDays className="w-3.5 h-3.5" />
                <span>តាមថ្ងៃ (Daily)</span>
              </button>
              <button
                onClick={() => setViewMode('MONTHLY')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all ${
                  viewMode === 'MONTHLY'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <BarChart2 className="w-3.5 h-3.5" />
                <span>សរុបខែ (Monthly)</span>
              </button>
            </div>
          </div>
        </div>

        {/* 13 STORES BRANCH SELECTOR */}
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-1.5 flex-wrap text-xs">
          <span className="font-bold text-slate-500 mr-1 flex items-center gap-1">
            <Store className="w-3.5 h-3.5 text-slate-400" />
            <span>សាខាហាង (Stores):</span>
          </span>
          <button
            onClick={() => setSelectedStore('ALL')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
              selectedStore === 'ALL'
                ? 'bg-slate-800 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Stores ({selectedLocation === 'TUBE_COFFEE' ? '9' : selectedLocation === 'ONMART' ? '4' : '13'})
          </button>

          {(selectedLocation === 'ALL' || selectedLocation === 'TUBE_COFFEE'
            ? TUBE_COFFEE_STORES
            : []
          ).map((st) => (
            <button
              key={st.code}
              onClick={() => setSelectedStore(st.code)}
              className={`px-2.5 py-1 rounded-lg font-bold font-mono transition-all ${
                selectedStore === st.code
                  ? 'bg-amber-700 text-white shadow-2xs ring-2 ring-amber-400/40'
                  : 'bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100'
              }`}
              title={st.name}
            >
              ☕ {st.code}
            </button>
          ))}

          {(selectedLocation === 'ALL' || selectedLocation === 'ONMART'
            ? ONMART_STORES
            : []
          ).map((st) => (
            <button
              key={st.code}
              onClick={() => setSelectedStore(st.code)}
              className={`px-2.5 py-1 rounded-lg font-bold font-mono transition-all ${
                selectedStore === st.code
                  ? 'bg-emerald-700 text-white shadow-2xs ring-2 ring-emerald-400/40'
                  : 'bg-emerald-50 text-emerald-900 border border-emerald-200 hover:bg-emerald-100'
              }`}
              title={st.name}
            >
              🛒 {st.code}
            </button>
          ))}

          {selectedStore !== 'ALL' && (
            <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md ml-auto">
              Selected Branch: <strong className="text-slate-800">{ALL_STORES.find((s) => s.code === selectedStore)?.name}</strong>
            </span>
          )}
        </div>

        {/* 12-MONTH NAVIGATION BAR */}
        <div className="mt-4 pt-4 border-t border-slate-100">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>🗓️ ជ្រើសរើសខែដើម្បីឆែកទិន្នន័យ (Month Selector - {selectedYear}):</span>
            <span className="text-emerald-700 font-extrabold bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
              កំពុងមើល: ខែ {currentMonthInfo.key} - {currentMonthInfo.kh} ({currentMonthInfo.en}) ឆ្នាំ {selectedYear}
            </span>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-1.5">
            {MONTHS.map((m) => {
              const isSelected = selectedMonth === m.num;
              return (
                <button
                  key={m.num}
                  onClick={() => setSelectedMonth(m.num)}
                  className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl text-center border transition-all ${
                    isSelected
                      ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm ring-2 ring-emerald-400/30 scale-[1.02]'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  <span className={`text-[10px] font-mono font-bold ${isSelected ? 'text-emerald-100' : 'text-slate-400'}`}>
                    ខែ {m.key}
                  </span>
                  <span className="text-xs font-black leading-tight mt-0.5">
                    {m.kh}
                  </span>
                  <span className={`text-[10px] uppercase font-semibold ${isSelected ? 'text-emerald-200' : 'text-slate-400'}`}>
                    {m.en}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* DATE STEPPER & SEARCH BAR */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          {viewMode === 'DAILY' ? (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-slate-700 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>កាលបរិច្ឆេទ (Date):</span>
              </span>

              {/* Stepper */}
              <div className="flex items-center bg-white border border-slate-300 rounded-xl px-1 py-0.5 shadow-2xs">
                <button
                  onClick={() => changeDateByDays(-1)}
                  className="p-1 hover:bg-slate-100 rounded text-slate-600"
                  title="Previous Day"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    if (e.target.value) {
                      const [y, m, d] = e.target.value.split('-').map(Number);
                      setSelectedYear(y);
                      setSelectedMonth(m);
                      setSelectedDay(d);
                    }
                  }}
                  className="px-2 py-1 text-xs font-bold text-slate-800 focus:outline-none bg-transparent"
                />
                <button
                  onClick={() => changeDateByDays(1)}
                  className="p-1 hover:bg-slate-100 rounded text-slate-600"
                  title="Next Day"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Quick Day Dropdown */}
              <div className="flex items-center gap-1">
                <span className="text-slate-500 font-medium">រើសថ្ងៃ:</span>
                <select
                  value={clampedDay}
                  onChange={(e) => setSelectedDay(Number(e.target.value))}
                  className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs font-bold text-slate-800 focus:outline-none"
                >
                  {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => (
                    <option key={d} value={d}>
                      ថ្ងៃទី {d}
                    </option>
                  ))}
                </select>
              </div>

              <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200">
                💾 ធានារក្សាទុកអចិន្ត្រៃយ៍ (Auto-Saved)
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-800 bg-indigo-50 px-3.5 py-1.5 rounded-xl border border-indigo-200">
              <BarChart2 className="w-4 h-4 text-indigo-600" />
              <span>
                របាយការណ៍សរុបពេញមួយខែ {currentMonthInfo.kh} ({currentMonthInfo.en}) ឆ្នាំ {selectedYear} (1st – {daysInMonth}th)
              </span>
            </div>
          )}

          {/* Search Bar */}
          <div className="relative min-w-[260px] flex-1 sm:flex-initial">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="ស្វែងរកតាម Code ឬ ឈ្មោះ (105 SKUs)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-2xs"
            />
          </div>
        </div>
      </div>

      {/* 2. KPI Summary Cards */}
      <KPICards
        totalStockValue={totalStockValue}
        totalStockIn={totalStockIn}
        totalStockOut={totalStockOut}
        totalBalance={totalBalance}
        activeItemCount={filteredItems.length}
        selectedDate={viewMode === 'DAILY' ? selectedDate : `ខែ ${currentMonthInfo.key}/${selectedYear}`}
        selectedLocation={selectedLocation}
      />

      {/* 3. Interactive Stock Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto max-h-[620px] relative">
          <table className="w-full text-left border-collapse text-xs">
            {/* Sticky Table Header */}
            <thead className="bg-slate-900 text-white font-semibold sticky top-0 z-10 shadow-xs">
              <tr className="divide-x divide-slate-800">
                <th className="py-3 px-3 w-28">Item Code</th>
                <th className="py-3 px-3 min-w-[240px]">Description (Khmer)</th>
                <th className="py-3 px-2.5 text-center w-28">Location</th>
                <th className="py-3 px-2.5 w-28">Category</th>
                <th className="py-3 px-2 text-center w-14">UoM</th>
                <th className="py-3 px-2.5 text-right w-20">CPU ($)</th>
                <th className="py-3 px-2.5 text-right w-24 bg-slate-800/80">Opening</th>
                <th className="py-3 px-3 text-right w-28 bg-emerald-900/50 text-emerald-200">
                  {viewMode === 'DAILY' ? 'Stock In (ថ្ងៃនេះ)' : 'Month In (សរុបខែ)'}
                </th>
                <th className="py-3 px-3 text-right w-28 bg-amber-900/50 text-amber-200">
                  {viewMode === 'DAILY' ? 'Stock Out (ថ្ងៃនេះ)' : 'Month Out (សរុបខែ)'}
                </th>
                <th className="py-3 px-2.5 text-right w-28 bg-slate-800/90 text-blue-200">
                  {viewMode === 'DAILY' ? 'Current Stock' : 'Ending Balance'}
                </th>
                <th className="py-3 px-2.5 text-right w-28 bg-slate-800/90 text-emerald-200">
                  Stock Value ($)
                </th>
                <th className="py-3 px-2 text-center w-24">Status</th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={12} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-emerald-600" />
                    <span>កំពុងទាញទិន្នន័យ (Loading stock data)...</span>
                  </td>
                </tr>
              ) : calculatedRows.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-12 text-center text-slate-400">
                    <Database className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-600">មិនមានទំនិញត្រូវបង្ហាញទេ។</p>
                  </td>
                </tr>
              ) : (
                calculatedRows.map((row) => (
                  <tr
                    key={row.id}
                    className={`transition-colors divide-x divide-slate-100 ${
                      row.isNegative
                        ? 'bg-rose-50/60 hover:bg-rose-100/50'
                        : row.isLow
                        ? 'bg-amber-50/50 hover:bg-amber-100/50'
                        : 'hover:bg-slate-50/80'
                    }`}
                  >
                    {/* Item Code */}
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                      {row.code}
                    </td>

                    {/* Description Khmer */}
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-slate-900 leading-snug">
                        {row.description_khmer}
                      </div>
                    </td>

                    {/* Location Badge */}
                    <td className="py-2.5 px-2.5 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                          row.location === 'TUBE_COFFEE'
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        {row.location === 'TUBE_COFFEE' ? <Coffee className="w-2.5 h-2.5" /> : <Store className="w-2.5 h-2.5" />}
                        {row.location === 'TUBE_COFFEE' ? 'Tube Coffee+' : 'OnMart'}
                      </span>
                    </td>

                    {/* Category */}
                    <td className="py-2.5 px-2.5 text-slate-600 font-medium">
                      {row.category}
                    </td>

                    {/* UoM */}
                    <td className="py-2.5 px-2 text-center text-slate-600 font-semibold">
                      {row.uom}
                    </td>

                    {/* CPU ($) */}
                    <td className="py-2.5 px-2.5 text-right font-semibold text-slate-700">
                      ${Number(row.cpu).toFixed(2)}
                    </td>

                    {/* Opening Stock */}
                    <td className="py-2.5 px-2.5 text-right font-medium text-slate-700 bg-slate-50/40">
                      {Number(row.opening_stock).toLocaleString()}
                    </td>

                    {/* Stock In */}
                    <td className="py-2 px-2.5 text-right bg-emerald-50/30">
                      {viewMode === 'DAILY' ? (
                        <input
                          type="number"
                          min="0"
                          value={row.stock_in === 0 ? '' : row.stock_in}
                          placeholder="0"
                          onChange={(e) =>
                            handleInputChange(row.id, 'stock_in', parseFloat(e.target.value) || 0)
                          }
                          className="w-full text-right bg-white border border-emerald-300 rounded-lg px-2 py-1 font-bold text-emerald-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-2xs"
                        />
                      ) : (
                        <span className="font-extrabold text-emerald-700 text-xs">
                          +{row.stock_in.toLocaleString()}
                        </span>
                      )}
                    </td>

                    {/* Stock Out */}
                    <td className="py-2 px-2.5 text-right bg-amber-50/30">
                      {viewMode === 'DAILY' ? (
                        <input
                          type="number"
                          min="0"
                          value={row.stock_out === 0 ? '' : row.stock_out}
                          placeholder="0"
                          onChange={(e) =>
                            handleInputChange(row.id, 'stock_out', parseFloat(e.target.value) || 0)
                          }
                          className="w-full text-right bg-white border border-amber-300 rounded-lg px-2 py-1 font-bold text-amber-800 focus:outline-none focus:ring-1 focus:ring-amber-500 shadow-2xs"
                        />
                      ) : (
                        <span className="font-extrabold text-amber-700 text-xs">
                          -{row.stock_out.toLocaleString()}
                        </span>
                      )}
                    </td>

                    {/* Balance */}
                    <td className="py-2.5 px-2.5 text-right font-bold bg-slate-50/60">
                      <span
                        className={
                          row.isNegative
                            ? 'text-rose-700 font-black'
                            : row.isLow
                            ? 'text-amber-700'
                            : 'text-slate-900'
                        }
                      >
                        {row.balance.toLocaleString()}
                      </span>
                    </td>

                    {/* Stock Value */}
                    <td className="py-2.5 px-2.5 text-right font-bold text-slate-900 bg-slate-50/40">
                      ${row.stockValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>

                    {/* Status */}
                    <td className="py-2.5 px-2 text-center">
                      {row.isNegative ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                          Negative
                        </span>
                      ) : row.isLow ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                          Low Stock
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                          Optimal
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>

            {/* Sticky Table Footer */}
            <tfoot className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300 sticky bottom-0 z-10 shadow-xs">
              <tr className="divide-x divide-slate-200">
                <td colSpan={6} className="py-3 px-3 uppercase text-xs tracking-wider">
                  Total Summary ({calculatedRows.length} Items Displayed)
                </td>
                <td className="py-3 px-2.5 text-right">{totalOpeningStock.toLocaleString()}</td>
                <td className="py-3 px-3 text-right text-emerald-700 font-extrabold">
                  +{totalStockIn.toLocaleString()}
                </td>
                <td className="py-3 px-3 text-right text-amber-700 font-extrabold">
                  -{totalStockOut.toLocaleString()}
                </td>
                <td className="py-3 px-2.5 text-right font-black text-blue-900">
                  {totalBalance.toLocaleString()}
                </td>
                <td className="py-3 px-2.5 text-right font-black text-emerald-900">
                  ${totalStockValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}

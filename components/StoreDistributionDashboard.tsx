'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart3,
  Coffee,
  Store,
  Layers,
  Calendar,
  Package,
  DollarSign,
  ArrowDownLeft,
  ArrowUpRight,
  Truck,
  Search,
  Eye,
  CheckCircle2,
  Plus,
  Save,
  Clock,
  Sparkles,
  TrendingUp,
  X
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

// Baseline distribution weights across stores
const STORE_WEIGHTS: Record<string, number> = {
  KPI: 0.15,
  TKC: 0.14,
  CCV: 0.12,
  CDP: 0.11,
  CMH: 0.11,
  KSH: 0.10,
  CKD: 0.09,
  '2K4': 0.09,
  RTN: 0.09,
  PDK: 0.30,
  TK: 0.28,
  OU3: 0.22,
  DT: 0.20,
};

interface StoreDistributionDashboardProps {
  initialStore?: string;
  onSelectStoreFilter?: (storeCode: string) => void;
}

export const StoreDistributionDashboard: React.FC<StoreDistributionDashboardProps> = ({
  initialStore = 'ALL',
  onSelectStoreFilter
}) => {
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth() + 1);
  const [selectedDay, setSelectedDay] = useState<number>(currentDate.getDate());
  const [selectedBrand, setSelectedBrand] = useState<FilterLocation>('ALL');
  const [selectedStoreCode, setSelectedStoreCode] = useState<string>(initialStore);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'DAILY' | 'MONTHLY' | 'YEARLY' | 'ALL_MATRIX'>('DAILY');

  // Modal detail for a store
  const [activeDetailStore, setActiveDetailStore] = useState<StoreBranch | null>(null);

  // Delivery logger modal
  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState<boolean>(false);
  const [deliveryStoreCode, setDeliveryStoreCode] = useState<string>('KPI');
  const [deliveryItemId, setDeliveryItemId] = useState<string>('');
  const [deliveryQty, setDeliveryQty] = useState<number>(0);
  const [deliverySuccessMsg, setDeliverySuccessMsg] = useState<string>('');

  // All starter items
  const allItems: StockItem[] = useMemo(() => {
    return getNormalizedStarterItems() as StockItem[];
  }, []);

  // Stock logs from LocalStorage
  const [storedLogs, setStoredLogs] = useState<
    Record<string, Record<string, { stock_in: number; stock_out: number }>>
  >({});

  // Store dispatches from LocalStorage
  const [storeDispatches, setStoreDispatches] = useState<
    Record<string, Record<string, Record<string, number>>>
  >({});

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const rawLogs = localStorage.getItem('kandal_cpu_stock_logs');
        if (rawLogs) setStoredLogs(JSON.parse(rawLogs));

        const rawDispatches = localStorage.getItem('kandal_cpu_store_dispatches');
        if (rawDispatches) setStoreDispatches(JSON.parse(rawDispatches));
      } catch (e) {
        console.error('Error loading store dispatches', e);
      }
    }
  }, []);

  // Sync initialStore when prop changes
  useEffect(() => {
    if (initialStore) {
      setSelectedStoreCode(initialStore);
    }
  }, [initialStore]);

  const selectedDateStr = useMemo(() => {
    const mm = String(selectedMonth).padStart(2, '0');
    const dd = String(selectedDay).padStart(2, '0');
    return `${selectedYear}-${mm}-${dd}`;
  }, [selectedYear, selectedMonth, selectedDay]);

  // Handle Save Manual Delivery
  const handleSaveDelivery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deliveryItemId || deliveryQty <= 0) {
      alert('សូមជ្រើសរើសទំនិញ និងបញ្ចូលចំនួន (Quantity > 0)');
      return;
    }

    const updated = { ...storeDispatches };
    if (!updated[selectedDateStr]) updated[selectedDateStr] = {};
    if (!updated[selectedDateStr][deliveryStoreCode]) updated[selectedDateStr][deliveryStoreCode] = {};

    updated[selectedDateStr][deliveryStoreCode][deliveryItemId] =
      (updated[selectedDateStr][deliveryStoreCode][deliveryItemId] || 0) + deliveryQty;

    setStoreDispatches(updated);
    localStorage.setItem('kandal_cpu_store_dispatches', JSON.stringify(updated));

    // Also increment daily stock out for this item
    const updatedStockLogs = { ...storedLogs };
    if (!updatedStockLogs[selectedDateStr]) updatedStockLogs[selectedDateStr] = {};
    const currLog = updatedStockLogs[selectedDateStr][deliveryItemId] || { stock_in: 0, stock_out: 0 };
    updatedStockLogs[selectedDateStr][deliveryItemId] = {
      ...currLog,
      stock_out: currLog.stock_out + deliveryQty,
    };
    setStoredLogs(updatedStockLogs);
    localStorage.setItem('kandal_cpu_stock_logs', JSON.stringify(updatedStockLogs));

    const itemObj = allItems.find((i) => i.id === deliveryItemId);
    const cost = (itemObj?.cpu || 0) * deliveryQty;

    setDeliverySuccessMsg(
      `✅ បានកត់ត្រាការបញ្ជូនទៅ ${deliveryStoreCode}: ${deliveryQty} ${itemObj?.uom || 'units'} (${itemObj?.description_khmer}) = $${cost.toFixed(2)}`
    );
    setDeliveryQty(0);
    setTimeout(() => setDeliverySuccessMsg(''), 4000);
  };

  // Selected item info for delivery logger
  const selectedDeliveryItem = useMemo(() => {
    return allItems.find((i) => i.id === deliveryItemId);
  }, [allItems, deliveryItemId]);

  // Available stores filtered by brand
  const filteredStores = useMemo(() => {
    let stores = ALL_STORES;
    if (selectedBrand === 'TUBE_COFFEE') stores = TUBE_COFFEE_STORES;
    if (selectedBrand === 'ONMART') stores = ONMART_STORES;
    if (selectedStoreCode !== 'ALL') {
      stores = stores.filter((s) => s.code === selectedStoreCode);
    }
    return stores;
  }, [selectedBrand, selectedStoreCode]);

  // Compute Daily Store Amount & Units
  const dailyStoreMetrics = useMemo(() => {
    const todayLogs = storedLogs[selectedDateStr] || {};
    let totalKitchenOutUnits = 0;
    let totalKitchenOutValue = 0;

    allItems.forEach((it) => {
      const out = todayLogs[it.id]?.stock_out || 0;
      totalKitchenOutUnits += out;
      totalKitchenOutValue += out * it.cpu;
    });

    const storeMetrics: Record<
      string,
      {
        store: StoreBranch;
        units: number;
        amount: number;
        pctOfTotal: number;
        itemBreakdown: Array<{ item: StockItem; qty: number; amount: number }>;
      }
    > = {};

    ALL_STORES.forEach((st) => {
      const explicitDispatches = storeDispatches[selectedDateStr]?.[st.code] || {};
      let units = 0;
      let amount = 0;
      const itemBreakdown: Array<{ item: StockItem; qty: number; amount: number }> = [];

      const hasExplicit = Object.keys(explicitDispatches).length > 0;

      if (hasExplicit) {
        Object.entries(explicitDispatches).forEach(([itemId, qty]) => {
          const item = allItems.find((i) => i.id === itemId);
          if (item && qty > 0) {
            const cost = qty * item.cpu;
            units += qty;
            amount += cost;
            itemBreakdown.push({ item, qty, amount: cost });
          }
        });
      } else {
        const weight = STORE_WEIGHTS[st.code] || 0.1;
        const brandItems = allItems.filter((i) => i.location === st.brand);
        let brandOutUnits = 0;
        let brandOutValue = 0;

        brandItems.forEach((it) => {
          const out = todayLogs[it.id]?.stock_out || 0;
          brandOutUnits += out;
          brandOutValue += out * it.cpu;
        });

        units = Math.round(brandOutUnits * weight);
        amount = brandOutValue * weight;

        brandItems.slice(0, 8).forEach((it) => {
          const itemOut = todayLogs[it.id]?.stock_out || 0;
          const storeItemQty = Math.round(itemOut * weight);
          if (storeItemQty > 0) {
            itemBreakdown.push({
              item: it,
              qty: storeItemQty,
              amount: storeItemQty * it.cpu,
            });
          }
        });
      }

      const pctOfTotal = totalKitchenOutValue > 0 ? (amount / totalKitchenOutValue) * 100 : 0;

      storeMetrics[st.code] = {
        store: st,
        units,
        amount,
        pctOfTotal,
        itemBreakdown,
      };
    });

    return {
      storeMetrics,
      totalKitchenOutUnits,
      totalKitchenOutValue,
    };
  }, [selectedDateStr, storedLogs, storeDispatches, allItems]);

  // Compute Monthly Store Amount & Units
  const monthlyStoreMetrics = useMemo(() => {
    const monthPrefix = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
    let totalMonthlyKitchenUnits = 0;
    let totalMonthlyKitchenAmount = 0;

    const storeMonthlyTotals: Record<
      string,
      {
        store: StoreBranch;
        units: number;
        amount: number;
        pctOfTotal: number;
      }
    > = {};

    ALL_STORES.forEach((st) => {
      storeMonthlyTotals[st.code] = {
        store: st,
        units: 0,
        amount: 0,
        pctOfTotal: 0,
      };
    });

    Object.entries(storedLogs).forEach(([dateStr, itemsMap]) => {
      if (dateStr.startsWith(monthPrefix)) {
        allItems.forEach((it) => {
          const out = itemsMap[it.id]?.stock_out || 0;
          totalMonthlyKitchenUnits += out;
          totalMonthlyKitchenAmount += out * it.cpu;
        });

        ALL_STORES.forEach((st) => {
          const dispatches = storeDispatches[dateStr]?.[st.code];
          if (dispatches) {
            Object.entries(dispatches).forEach(([itemId, qty]) => {
              const item = allItems.find((i) => i.id === itemId);
              if (item && qty > 0) {
                storeMonthlyTotals[st.code].units += qty;
                storeMonthlyTotals[st.code].amount += qty * item.cpu;
              }
            });
          } else {
            const weight = STORE_WEIGHTS[st.code] || 0.1;
            const brandItems = allItems.filter((i) => i.location === st.brand);
            let dayBrandOutUnits = 0;
            let dayBrandOutValue = 0;

            brandItems.forEach((it) => {
              const out = itemsMap[it.id]?.stock_out || 0;
              dayBrandOutUnits += out;
              dayBrandOutValue += out * it.cpu;
            });

            storeMonthlyTotals[st.code].units += Math.round(dayBrandOutUnits * weight);
            storeMonthlyTotals[st.code].amount += dayBrandOutValue * weight;
          }
        });
      }
    });

    ALL_STORES.forEach((st) => {
      const amt = storeMonthlyTotals[st.code].amount;
      storeMonthlyTotals[st.code].pctOfTotal =
        totalMonthlyKitchenAmount > 0 ? (amt / totalMonthlyKitchenAmount) * 100 : 0;
    });

    return {
      storeMonthlyTotals,
      totalMonthlyKitchenUnits,
      totalMonthlyKitchenAmount,
    };
  }, [selectedYear, selectedMonth, storedLogs, storeDispatches, allItems]);

  // Compute Yearly Store Amount & Units
  const yearlyStoreMetrics = useMemo(() => {
    const yearPrefix = `${selectedYear}-`;
    let totalYearlyKitchenUnits = 0;
    let totalYearlyKitchenAmount = 0;

    const storeYearlyTotals: Record<
      string,
      {
        store: StoreBranch;
        units: number;
        amount: number;
        pctOfTotal: number;
      }
    > = {};

    ALL_STORES.forEach((st) => {
      storeYearlyTotals[st.code] = {
        store: st,
        units: 0,
        amount: 0,
        pctOfTotal: 0,
      };
    });

    Object.entries(storedLogs).forEach(([dateStr, itemsMap]) => {
      if (dateStr.startsWith(yearPrefix)) {
        allItems.forEach((it) => {
          const out = itemsMap[it.id]?.stock_out || 0;
          totalYearlyKitchenUnits += out;
          totalYearlyKitchenAmount += out * it.cpu;
        });

        ALL_STORES.forEach((st) => {
          const dispatches = storeDispatches[dateStr]?.[st.code];
          if (dispatches) {
            Object.entries(dispatches).forEach(([itemId, qty]) => {
              const item = allItems.find((i) => i.id === itemId);
              if (item && qty > 0) {
                storeYearlyTotals[st.code].units += qty;
                storeYearlyTotals[st.code].amount += qty * item.cpu;
              }
            });
          } else {
            const weight = STORE_WEIGHTS[st.code] || 0.1;
            const brandItems = allItems.filter((i) => i.location === st.brand);
            let dayBrandOutUnits = 0;
            let dayBrandOutValue = 0;

            brandItems.forEach((it) => {
              const out = itemsMap[it.id]?.stock_out || 0;
              dayBrandOutUnits += out;
              dayBrandOutValue += out * it.cpu;
            });

            storeYearlyTotals[st.code].units += Math.round(dayBrandOutUnits * weight);
            storeYearlyTotals[st.code].amount += dayBrandOutValue * weight;
          }
        });
      }
    });

    ALL_STORES.forEach((st) => {
      const amt = storeYearlyTotals[st.code].amount;
      storeYearlyTotals[st.code].pctOfTotal =
        totalYearlyKitchenAmount > 0 ? (amt / totalYearlyKitchenAmount) * 100 : 0;
    });

    return {
      storeYearlyTotals,
      totalYearlyKitchenUnits,
      totalYearlyKitchenAmount,
    };
  }, [selectedYear, storedLogs, storeDispatches, allItems]);

  const selectedMonthInfo = MONTHS.find((m) => m.num === selectedMonth) || MONTHS[0];

  return (
    <div className="space-y-6">
      {/* 1. Header Toolbar with Controls */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
                <BarChart3 className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900 leading-tight flex items-center gap-2">
                  <span>Store Distribution &amp; Amount Analytics</span>
                  <span className="text-[11px] bg-emerald-100 text-emerald-900 font-bold px-2 py-0.5 rounded-md border border-emerald-300">
                    ១៣ សាខាហាង
                  </span>
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  បង្ហាញទឹកប្រាក់សរុប (Total Amount $) និងចំនួនទំនិញ (Items) ដែលហាងនីមួយៗទទួលបាន
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Delivery Logger Button */}
            <button
              onClick={() => setIsDeliveryModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
            >
              <Truck className="w-4 h-4" />
              <span>+ កត់ត្រាការដឹកជញ្ជូន (Log Delivery)</span>
            </button>
          </div>
        </div>

        {/* Brand & Tab Navigation */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Brand Filter */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 gap-1">
            <button
              onClick={() => {
                setSelectedBrand('ALL');
                setSelectedStoreCode('ALL');
                if (onSelectStoreFilter) onSelectStoreFilter('ALL');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
                selectedBrand === 'ALL'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              <span>All 13 Stores</span>
            </button>

            <button
              onClick={() => {
                setSelectedBrand('TUBE_COFFEE');
                setSelectedStoreCode('ALL');
                if (onSelectStoreFilter) onSelectStoreFilter('TUBE_COFFEE');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
                selectedBrand === 'TUBE_COFFEE'
                  ? 'bg-white text-amber-900 shadow-xs'
                  : 'text-slate-600 hover:text-amber-800'
              }`}
            >
              <Coffee className="w-3.5 h-3.5 text-amber-600" />
              <span>Tube Coffee+ (9 ហាង • 69 Items)</span>
            </button>

            <button
              onClick={() => {
                setSelectedBrand('ONMART');
                setSelectedStoreCode('ALL');
                if (onSelectStoreFilter) onSelectStoreFilter('ONMART');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
                selectedBrand === 'ONMART'
                  ? 'bg-white text-emerald-900 shadow-xs'
                  : 'text-slate-600 hover:text-emerald-800'
              }`}
            >
              <Store className="w-3.5 h-3.5 text-emerald-600" />
              <span>OnMart (4 ហាង • 36 Items)</span>
            </button>
          </div>

          {/* Timeframe Tabs */}
          <div className="flex items-center bg-slate-900 p-1 rounded-xl shadow-xs text-white text-xs font-bold gap-1">
            <button
              onClick={() => setActiveTab('DAILY')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'DAILY'
                  ? 'bg-emerald-500 text-slate-950 font-black shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>📅 Daily Amount (ថ្ងៃនេះ)</span>
            </button>

            <button
              onClick={() => setActiveTab('MONTHLY')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'MONTHLY'
                  ? 'bg-emerald-500 text-slate-950 font-black shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>📆 Monthly Amount (ខែ)</span>
            </button>

            <button
              onClick={() => setActiveTab('YEARLY')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'YEARLY'
                  ? 'bg-emerald-500 text-slate-950 font-black shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>📈 Yearly Amount (ឆ្នាំ)</span>
            </button>

            <button
              onClick={() => setActiveTab('ALL_MATRIX')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'ALL_MATRIX'
                  ? 'bg-emerald-500 text-slate-950 font-black shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>📋 Master Matrix</span>
            </button>
          </div>
        </div>

        {/* Store Branch Selection Pills */}
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-1.5 flex-wrap text-xs">
          <span className="font-bold text-slate-500 mr-1 flex items-center gap-1">
            <Store className="w-3.5 h-3.5 text-slate-400" />
            <span>ជ្រើសរើសហាង:</span>
          </span>

          <button
            onClick={() => {
              setSelectedStoreCode('ALL');
              if (onSelectStoreFilter) onSelectStoreFilter('ALL');
            }}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
              selectedStoreCode === 'ALL'
                ? 'bg-slate-800 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Stores (13)
          </button>

          {/* Tube Coffee+ Stores */}
          {(selectedBrand === 'ALL' || selectedBrand === 'TUBE_COFFEE'
            ? TUBE_COFFEE_STORES
            : []
          ).map((st) => (
            <button
              key={st.code}
              onClick={() => {
                setSelectedStoreCode(st.code);
                if (onSelectStoreFilter) onSelectStoreFilter(st.code);
              }}
              className={`px-2.5 py-1 rounded-lg font-bold font-mono transition-all ${
                selectedStoreCode === st.code
                  ? 'bg-amber-700 text-white shadow-2xs ring-2 ring-amber-400/40'
                  : 'bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100'
              }`}
              title={st.name}
            >
              ☕ {st.code}
            </button>
          ))}

          {/* OnMart Stores */}
          {(selectedBrand === 'ALL' || selectedBrand === 'ONMART'
            ? ONMART_STORES
            : []
          ).map((st) => (
            <button
              key={st.code}
              onClick={() => {
                setSelectedStoreCode(st.code);
                if (onSelectStoreFilter) onSelectStoreFilter(st.code);
              }}
              className={`px-2.5 py-1 rounded-lg font-bold font-mono transition-all ${
                selectedStoreCode === st.code
                  ? 'bg-emerald-700 text-white shadow-2xs ring-2 ring-emerald-400/40'
                  : 'bg-emerald-50 text-emerald-900 border border-emerald-200 hover:bg-emerald-100'
              }`}
              title={st.name}
            >
              🛒 {st.code}
            </button>
          ))}
        </div>

        {/* Date & Month Controls */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-slate-700">ឆ្នាំ (Year):</span>
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 gap-1">
              {YEARS.map((yr) => (
                <button
                  key={yr}
                  onClick={() => setSelectedYear(yr)}
                  className={`px-2.5 py-0.5 rounded-lg font-bold transition-all ${
                    selectedYear === yr
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {yr}
                </button>
              ))}
            </div>

            {(activeTab === 'DAILY' || activeTab === 'MONTHLY') && (
              <div className="flex items-center gap-1.5 ml-2">
                <span className="font-bold text-slate-700">ខែ:</span>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs font-bold text-slate-800 focus:outline-none"
                >
                  {MONTHS.map((m) => (
                    <option key={m.num} value={m.num}>
                      ខែ {m.num} ({m.nameKh} - {m.nameEn})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {activeTab === 'DAILY' && (
              <div className="flex items-center gap-1.5 ml-2">
                <span className="font-bold text-slate-700">ថ្ងៃ:</span>
                <input
                  type="date"
                  value={selectedDateStr}
                  onChange={(e) => {
                    if (e.target.value) {
                      const [y, m, d] = e.target.value.split('-').map(Number);
                      setSelectedYear(y);
                      setSelectedMonth(m);
                      setSelectedDay(d);
                    }
                  }}
                  className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs font-bold text-slate-800 focus:outline-none"
                />
              </div>
            )}
          </div>

          <div className="text-right">
            <span className="text-xs font-bold text-slate-500">
              កំពុងមើលទិន្នន័យ:{' '}
              <strong className="text-slate-800">
                {activeTab === 'DAILY'
                  ? `ថ្ងៃ ${selectedDateStr}`
                  : activeTab === 'MONTHLY'
                  ? `ខែ ${selectedMonthInfo.nameKh} ${selectedYear}`
                  : `ឆ្នាំ ${selectedYear}`}
              </strong>
            </span>
          </div>
        </div>
      </div>

      {/* 2. TAB CONTENT VIEWS */}
      {/* -------------------- TAB 1: DAILY STORE AMOUNT -------------------- */}
      {activeTab === 'DAILY' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <span>📅 ទឹកប្រាក់ និងចំនួនទំនិញប្រចាំថ្ងៃ (Daily Store Amount)</span>
                <span className="text-xs font-normal text-slate-500 font-mono">({selectedDateStr})</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                តារាងខាងក្រោមកត់ត្រាជាក់លាក់នូវទឹកប្រាក់ ($) និងទំនិញដែលបានផ្គត់ផ្គង់ទៅកាន់សាខានីមួយៗ
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredStores.map((store) => {
              const metrics = dailyStoreMetrics.storeMetrics[store.code] || {
                units: 0,
                amount: 0,
                pctOfTotal: 0,
                itemBreakdown: [],
              };
              const isTube = store.brand === 'TUBE_COFFEE';

              return (
                <div
                  key={store.code}
                  className="bg-white rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md transition-all p-4 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-mono font-black text-xs ${
                            isTube
                              ? 'bg-amber-100 text-amber-900 border border-amber-200'
                              : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                          }`}
                        >
                          {store.code}
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-slate-900 truncate max-w-[130px]" title={store.name}>
                            {store.name}
                          </h4>
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                              isTube ? 'bg-amber-50 text-amber-800' : 'bg-emerald-50 text-emerald-800'
                            }`}
                          >
                            {isTube ? 'Tube Coffee+ • 69 Items' : 'OnMart • 36 Items'}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => setActiveDetailStore(store)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
                        title="មើល Itemized Breakdown"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-2 py-2 border-y border-slate-100">
                      <div className="flex items-baseline justify-between">
                        <span className="text-xs text-slate-500 font-medium">ទឹកប្រាក់សរុប (Amount):</span>
                        <span className="text-lg font-black text-slate-900 font-mono">
                          ${metrics.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>

                      <div className="flex items-baseline justify-between text-xs">
                        <span className="text-slate-500 font-medium">ចំនួនទំនិញទទួល (Units):</span>
                        <span className="font-bold text-slate-800 font-mono">
                          {metrics.units.toLocaleString()} units
                        </span>
                      </div>

                      <div className="flex items-baseline justify-between text-xs">
                        <span className="text-slate-500 font-medium">% ចំណែកផ្គត់ផ្គង់:</span>
                        <span className="font-bold text-emerald-700 font-mono">
                          {metrics.pctOfTotal.toFixed(1)}% of Kitchen
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 flex items-center justify-between text-[11px]">
                    <button
                      onClick={() => {
                        setDeliveryStoreCode(store.code);
                        setIsDeliveryModalOpen(true);
                      }}
                      className="text-emerald-700 font-bold hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>បញ្ជូនទំនិញ</span>
                    </button>

                    <button
                      onClick={() => setActiveDetailStore(store)}
                      className="text-slate-500 font-semibold hover:text-slate-800 flex items-center gap-1"
                    >
                      <span>លម្អិត</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* -------------------- TAB 2: MONTHLY STORE AMOUNT -------------------- */}
      {activeTab === 'MONTHLY' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <span>📆 របាយការណ៍សរុបប្រចាំខែ (Monthly Store Amount)</span>
                <span className="text-xs font-normal text-slate-500 font-mono">
                  (ខែ {selectedMonthInfo.nameKh} ឆ្នាំ {selectedYear})
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                បង្ហាញទឹកប្រាក់សរុបប្រចាំខែនីមួយៗ និងចំនួនសរុបដែលបានផ្គត់ផ្គង់ទៅតាមសាខា
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-900 text-white font-semibold">
                  <tr className="divide-x divide-slate-800">
                    <th className="py-3 px-3 w-20">Code</th>
                    <th className="py-3 px-3">Store Name (សាខា)</th>
                    <th className="py-3 px-2.5 text-center w-32">Brand</th>
                    <th className="py-3 px-2.5 text-center w-28">Items Range</th>
                    <th className="py-3 px-3 text-right w-36">សរុប Units (ខែ)</th>
                    <th className="py-3 px-3 text-right w-40 bg-emerald-950/60 text-emerald-200">
                      សរុបទឹកប្រាក់ Amount ($)
                    </th>
                    <th className="py-3 px-3 text-right w-32">% Kitchen Share</th>
                    <th className="py-3 px-2.5 text-center w-24">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStores.map((store) => {
                    const m = monthlyStoreMetrics.storeMonthlyTotals[store.code] || {
                      units: 0,
                      amount: 0,
                      pctOfTotal: 0,
                    };
                    const isTube = store.brand === 'TUBE_COFFEE';

                    return (
                      <tr key={store.code} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-3 font-mono font-bold text-slate-900">{store.code}</td>
                        <td className="py-3 px-3 font-bold text-slate-800">{store.name}</td>
                        <td className="py-3 px-2.5 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                              isTube ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-900'
                            }`}
                          >
                            {isTube ? 'Tube Coffee+' : 'OnMart'}
                          </span>
                        </td>
                        <td className="py-3 px-2.5 text-center font-mono font-semibold text-slate-600">
                          {store.itemCount} Items
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-slate-800">
                          {m.units.toLocaleString()} units
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-black text-emerald-700 bg-emerald-50/40 text-sm">
                          ${m.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-slate-600">
                          {m.pctOfTotal.toFixed(1)}%
                        </td>
                        <td className="py-3 px-2.5 text-center">
                          <button
                            onClick={() => setActiveDetailStore(store)}
                            className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px]"
                          >
                            មើល
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* -------------------- TAB 3: YEARLY STORE AMOUNT -------------------- */}
      {activeTab === 'YEARLY' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <span>📈 របាយការណ៍សរុបប្រចាំឆ្នាំ (Yearly Store Amount)</span>
                <span className="text-xs font-normal text-slate-500 font-mono">(ឆ្នាំ {selectedYear})</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                បង្ហាញទឹកប្រាក់សរុប និងទំនិញដែលបានផ្គត់ផ្គង់ពេញមួយឆ្នាំសម្រាប់សាខាទាំង ១៣
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredStores.map((store) => {
              const y = yearlyStoreMetrics.storeYearlyTotals[store.code] || {
                units: 0,
                amount: 0,
                pctOfTotal: 0,
              };
              const isTube = store.brand === 'TUBE_COFFEE';

              return (
                <div
                  key={store.code}
                  className="bg-white rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md transition-all p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-mono font-black text-xs ${
                          isTube
                            ? 'bg-amber-100 text-amber-900 border border-amber-200'
                            : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                        }`}
                      >
                        {store.code}
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-slate-900 truncate max-w-[130px]">{store.name}</h4>
                        <span className="text-[10px] text-slate-500 font-bold">{store.itemCount} Items Master</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 py-2 border-t border-slate-100">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs text-slate-500">ទឹកប្រាក់សរុបប្រចាំឆ្នាំ:</span>
                      <span className="text-lg font-black text-emerald-800 font-mono">
                        ${y.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>

                    <div className="flex items-baseline justify-between text-xs">
                      <span className="text-slate-500">ចំនួនទំនិញប្រចាំឆ្នាំ:</span>
                      <span className="font-bold text-slate-800 font-mono">{y.units.toLocaleString()} units</span>
                    </div>

                    <div className="flex items-baseline justify-between text-xs">
                      <span className="text-slate-500">% ចំណែកទូទាំងឆ្នាំ:</span>
                      <span className="font-bold text-blue-700 font-mono">{y.pctOfTotal.toFixed(1)}% of Year</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* -------------------- TAB 4: MASTER COMPARISON MATRIX -------------------- */}
      {activeTab === 'ALL_MATRIX' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <span>📋 តារាងប្រៀបធៀបគ្រប់សាខា (13 Stores Master Matrix)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                ប្រៀបធៀបទិន្នន័យ Daily, Monthly, Yearly Amount ($) គ្រប់ហាងទាំងអស់ក្នុងតារាងតែមួយ
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-900 text-white font-semibold">
                  <tr className="divide-x divide-slate-800">
                    <th className="py-3 px-3 w-20">Code</th>
                    <th className="py-3 px-3">Store Name</th>
                    <th className="py-3 px-2 text-center w-28">Brand</th>
                    <th className="py-3 px-2.5 text-center w-24">Items</th>
                    <th className="py-3 px-3 text-right bg-slate-800/80">Daily Units</th>
                    <th className="py-3 px-3 text-right bg-emerald-950/60 text-emerald-200">Daily Amount ($)</th>
                    <th className="py-3 px-3 text-right bg-slate-800/80">Monthly Units</th>
                    <th className="py-3 px-3 text-right bg-emerald-950/60 text-emerald-200">Monthly Amount ($)</th>
                    <th className="py-3 px-3 text-right bg-emerald-950/80 text-emerald-200">Yearly Amount ($)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {ALL_STORES.map((st) => {
                    const d = dailyStoreMetrics.storeMetrics[st.code] || { units: 0, amount: 0 };
                    const m = monthlyStoreMetrics.storeMonthlyTotals[st.code] || { units: 0, amount: 0 };
                    const y = yearlyStoreMetrics.storeYearlyTotals[st.code] || { units: 0, amount: 0 };
                    const isTube = st.brand === 'TUBE_COFFEE';

                    return (
                      <tr key={st.code} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-3 font-mono font-black text-slate-900">{st.code}</td>
                        <td className="py-3 px-3 font-bold text-slate-800">{st.name}</td>
                        <td className="py-3 px-2 text-center">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              isTube ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-900'
                            }`}
                          >
                            {isTube ? 'Tube Coffee+' : 'OnMart'}
                          </span>
                        </td>
                        <td className="py-3 px-2.5 text-center font-mono text-slate-600 font-semibold">
                          {st.itemCount} Items
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-medium">{d.units.toLocaleString()}</td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700 bg-emerald-50/30">
                          ${d.amount.toFixed(2)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-medium">{m.units.toLocaleString()}</td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700 bg-emerald-50/30">
                          ${m.amount.toFixed(2)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-black text-emerald-800 bg-emerald-100/40">
                          ${y.amount.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* -------------------- DELIVERY LOGGER MODAL -------------------- */}
      {isDeliveryModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">កត់ត្រាការដឹកជញ្ជូន (Store Delivery)</h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    កត់ត្រាចំនួនទំនិញដែលបានដឹកចេញពី Kitchen ទៅកាន់សាខាហាង
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsDeliveryModalOpen(false)}
                className="w-7 h-7 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            {deliverySuccessMsg && (
              <div className="mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{deliverySuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveDelivery} className="mt-4 space-y-4 text-xs">
              {/* Select Date */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">កាលបរិច្ឆេទដឹក (Date):</label>
                <div className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-3 py-2 rounded-xl border border-slate-200">
                  {selectedDateStr}
                </div>
              </div>

              {/* Select Store */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">សាខាហាងដែលត្រូវដឹកទៅ (Destination Store):</label>
                <select
                  value={deliveryStoreCode}
                  onChange={(e) => setDeliveryStoreCode(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:bg-white"
                >
                  <optgroup label="☕ Tube Coffee+ (9 ហាង - 69 Items)">
                    {TUBE_COFFEE_STORES.map((st) => (
                      <option key={st.code} value={st.code}>
                        {st.code} - {st.name}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="🛒 OnMart (4 ហាង - 36 Items)">
                    {ONMART_STORES.map((st) => (
                      <option key={st.code} value={st.code}>
                        {st.code} - {st.name}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              {/* Select Item */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">មុខទំនិញ (Select Item):</label>
                <select
                  value={deliveryItemId}
                  onChange={(e) => setDeliveryItemId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:bg-white"
                  required
                >
                  <option value="">-- សូមជ្រើសរើសមុខទំនិញ --</option>
                  {allItems
                    .filter((it) => {
                      const destStore = ALL_STORES.find((s) => s.code === deliveryStoreCode);
                      return !destStore || it.location === destStore.brand;
                    })
                    .map((it) => (
                      <option key={it.id} value={it.id}>
                        [{it.code}] {it.description_khmer} (CPU: ${it.cpu.toFixed(2)}/{it.uom})
                      </option>
                    ))}
                </select>
              </div>

              {/* Quantity */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">ចំនួនដឹកចេញ (Quantity to Dispatch):</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    value={deliveryQty || ''}
                    onChange={(e) => setDeliveryQty(parseFloat(e.target.value) || 0)}
                    placeholder="បញ្ចូលចំនួន..."
                    className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:bg-white"
                    required
                  />
                  <span className="font-bold text-slate-600 px-3 py-2.5 bg-slate-100 rounded-xl border border-slate-200">
                    {selectedDeliveryItem?.uom || 'units'}
                  </span>
                </div>
              </div>

              {/* Total USD Calculation */}
              {selectedDeliveryItem && deliveryQty > 0 && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between">
                  <span className="font-bold text-emerald-900">តម្លៃទឹកប្រាក់សរុប (Total Amount):</span>
                  <span className="font-mono text-base font-black text-emerald-800">
                    ${(selectedDeliveryItem.cpu * deliveryQty).toFixed(2)} USD
                  </span>
                </div>
              )}

              {/* Actions */}
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsDeliveryModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors"
                >
                  បោះបង់ (Cancel)
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>កត់ត្រាចូលប្រព័ន្ធ (Save Delivery)</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* -------------------- STORE ITEMIZED DETAIL MODAL -------------------- */}
      {activeDetailStore && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center font-mono font-black text-sm ${
                    activeDetailStore.brand === 'TUBE_COFFEE'
                      ? 'bg-amber-100 text-amber-900'
                      : 'bg-emerald-100 text-emerald-900'
                  }`}
                >
                  {activeDetailStore.code}
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">{activeDetailStore.name}</h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {activeDetailStore.brand === 'TUBE_COFFEE' ? 'Tube Coffee+ (69 Items)' : 'OnMart (36 Items)'} •
                    Itemized Supply List
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveDetailStore(null)}
                className="w-8 h-8 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <div className="mt-4">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-2">
                📦 បញ្ជីមុខទំនិញដែលបានផ្គត់ផ្គង់ (Supply Breakdown):
              </h4>
              <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Item Code</th>
                      <th className="py-2.5 px-3">Description (Khmer)</th>
                      <th className="py-2.5 px-2 text-center">UoM</th>
                      <th className="py-2.5 px-3 text-right">CPU ($)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {allItems
                      .filter((it) => it.location === activeDetailStore.brand)
                      .map((it) => (
                        <tr key={it.id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{it.code}</td>
                          <td className="py-2.5 px-3 text-slate-800">{it.description_khmer}</td>
                          <td className="py-2.5 px-2 text-center text-slate-500 font-medium">{it.uom}</td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-800">
                            ${it.cpu.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setActiveDetailStore(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors"
              >
                បិទ (Close)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

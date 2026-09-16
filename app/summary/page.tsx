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
  Truck,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  Plus,
  Save,
  Clock,
  Sparkles,
  Award,
  RefreshCw,
  Cloud,
  CloudOff,
  FileText,
  X,
  ShieldCheck,
  Users,
  History,
  Activity,
  ShoppingBag
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
import { StoreRecord, getAllDistributions } from '@/lib/inventoryStore';

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

// Baseline distribution share for realistic calculation when manual dispatch is not entered
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

// Store ID and code mappings to support legacy and current keys
const STORE_ID_MAP: Record<string, string> = {
  s1: 'KPI',
  s2: 'TKC',
  s3: 'CCV',
  s4: 'CDP',
  s5: 'CMH',
  s6: 'KSH',
  s7: 'CKD',
  s8: '2K4',
  s9: 'RTN',
  s10: 'PDK',
  s11: 'TK',
  s12: 'OU3',
  s13: 'DT',
};

const STORE_CODE_TO_ID: Record<string, string> = {
  KPI: 's1',
  TKC: 's2',
  CCV: 's3',
  CDP: 's4',
  CMH: 's5',
  CYH: 's5',
  KSH: 's6',
  CKD: 's7',
  '2K4': 's8',
  RTN: 's9',
  ATN: 's9',
  PDK: 's10',
  POK: 's10',
  TK: 's11',
  OU3: 's12',
  DT: 's13',
};

// Store code/alias matcher
const isStoreMatch = (sourceCodeOrId: string, targetCode: string): boolean => {
  if (!sourceCodeOrId || !targetCode) return false;
  const s = sourceCodeOrId.trim().toUpperCase();
  const t = targetCode.trim().toUpperCase();
  if (s === t) return true;
  if (STORE_ID_MAP[sourceCodeOrId.toLowerCase()]?.toUpperCase() === t) return true;
  if (STORE_CODE_TO_ID[t]?.toLowerCase() === sourceCodeOrId.toLowerCase()) return true;
  if ((s === 'CYH' && t === 'CMH') || (s === 'CMH' && t === 'CYH')) return true;
  if ((s === 'ATN' && t === 'RTN') || (s === 'RTN' && t === 'ATN')) return true;
  if ((s === 'POK' && t === 'PDK') || (s === 'PDK' && t === 'POK')) return true;
  return false;
};

export default function SummaryPage() {
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth() + 1);
  const [selectedDay, setSelectedDay] = useState<number>(currentDate.getDate());
  const [selectedBrand, setSelectedBrand] = useState<FilterLocation>('ALL');
  const [selectedStoreCode, setSelectedStoreCode] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'TRACKER' | 'DAILY' | 'MONTHLY' | 'YEARLY' | 'ALL_MATRIX'>('TRACKER');

  // Modal detail for a store
  const [activeDetailStore, setActiveDetailStore] = useState<StoreBranch | null>(null);

  // Delivery logger modal
  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState<boolean>(false);
  const [deliveryStoreCode, setDeliveryStoreCode] = useState<string>('KPI');
  const [deliveryItemId, setDeliveryItemId] = useState<string>('');
  const [deliveryQty, setDeliveryQty] = useState<number>(0);
  const [deliverySuccessMsg, setDeliverySuccessMsg] = useState<string>('');

  // Dynamic Item Prices from Master Items
  const [v5Prices, setV5Prices] = useState<Record<string, number>>({});

  // All 105 starter items with dynamic CPU from Master Items
  const allItems: StockItem[] = useMemo(() => {
    const starters = getNormalizedStarterItems() as StockItem[];
    return starters.map((it) => ({
      ...it,
      cpu: v5Prices[it.code] !== undefined ? v5Prices[it.code] : it.cpu,
    }));
  }, [v5Prices]);

  // Stock logs from LocalStorage
  const [storedLogs, setStoredLogs] = useState<
    Record<string, Record<string, { stock_in: number; stock_out: number }>>
  >({});

  // Store dispatches from LocalStorage
  const [storeDispatches, setStoreDispatches] = useState<
    Record<string, Record<string, Record<string, number>>>
  >({});

  // Linked v5 Stores & Stock from Dashboard
  const [v5Stores, setV5Stores] = useState<
    Record<string, Array<{ id: string; code: string; name: string; brand: string; dailyAmount: number; monthlyAmount: number; yearlyAmount: number }>>
  >({});
  const [v5Stock, setV5Stock] = useState<
    Record<string, Array<{ item_code: string; description_khmer: string; brand: string; cpu: number; opening_stock: number; stock_in: number; stock_out: number }>>
  >({});

  // cpu_history_distribution (Recorded from Main Dashboard / page.tsx)
  const [historyDistribution, setHistoryDistribution] = useState<Record<string, Record<string, number>>>({});

  // kandal_cpu_daily_store_distributions (Recorded from DailyStoreDistribution / inventoryStore.ts)
  const [dailyStoreDistributions, setDailyStoreDistributions] = useState<StoreRecord[]>([]);

  // Cloud Sync state
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
  const [lastSyncedTime, setLastSyncedTime] = useState<string>('');
  const [isReferenceOpen, setIsReferenceOpen] = useState(false);

  const fetchFromCloud = async () => {
    try {
      setSyncStatus('syncing');
      const res = await fetch('/api/sync', { cache: 'no-store' });
      if (!res.ok) throw new Error('Sync failed');
      const cloudData = await res.json();

      if (cloudData) {
        if (cloudData.storesByDate && Object.keys(cloudData.storesByDate).length > 0) {
          setV5Stores(prev => {
            const merged = { ...prev, ...cloudData.storesByDate };
            try { localStorage.setItem('kandal_cpu_stores_by_date_v5', JSON.stringify(merged)); } catch(e){}
            return merged;
          });
        }
        if (cloudData.stockByDate && Object.keys(cloudData.stockByDate).length > 0) {
          setV5Stock(prev => {
            const merged = { ...prev, ...cloudData.stockByDate };
            try { localStorage.setItem('kandal_cpu_stock_by_date_v5', JSON.stringify(merged)); } catch(e){}
            return merged;
          });
        }
        if (cloudData.itemPrices && Object.keys(cloudData.itemPrices).length > 0) {
          setV5Prices(prev => {
            const merged = { ...prev, ...cloudData.itemPrices };
            try { localStorage.setItem('kandal_cpu_item_prices_v5', JSON.stringify(merged)); } catch(e){}
            return merged;
          });
        }
        setSyncStatus('synced');
        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setLastSyncedTime(timeStr);
      }
    } catch (e) {
      console.error('Error fetching cloud sync in summary', e);
      setSyncStatus('error');
    }
  };

  const loadLocalData = () => {
    if (typeof window === 'undefined') return;
    try {
      const rawLogs = localStorage.getItem('kandal_cpu_stock_logs');
      if (rawLogs) setStoredLogs(JSON.parse(rawLogs));

      const rawDispatches = localStorage.getItem('kandal_cpu_store_dispatches');
      if (rawDispatches) setStoreDispatches(JSON.parse(rawDispatches));

      const rawV5Stores = localStorage.getItem('kandal_cpu_stores_by_date_v5');
      if (rawV5Stores) setV5Stores(JSON.parse(rawV5Stores));

      const rawV5Stock = localStorage.getItem('kandal_cpu_stock_by_date_v5');
      if (rawV5Stock) setV5Stock(JSON.parse(rawV5Stock));

      const rawV5Prices = localStorage.getItem('kandal_cpu_item_prices_v5');
      if (rawV5Prices) setV5Prices(JSON.parse(rawV5Prices));

      const rawCpuItems = localStorage.getItem('cpu_items');
      if (rawCpuItems) {
        try {
          const parsed = JSON.parse(rawCpuItems);
          if (Array.isArray(parsed)) {
            const extractedPrices: Record<string, number> = {};
            parsed.forEach((it: any) => {
              const c = it.code || it.item_code;
              if (c && it.cpu !== undefined) {
                extractedPrices[c] = Number(it.cpu) || 0;
              }
            });
            setV5Prices((prev) => ({ ...extractedPrices, ...prev }));
          }
        } catch (e) {}
      }

      const rawHistDist = localStorage.getItem('cpu_history_distribution');
      if (rawHistDist) setHistoryDistribution(JSON.parse(rawHistDist));

      const rawDailyDist = localStorage.getItem('kandal_cpu_daily_store_distributions');
      if (rawDailyDist) {
        setDailyStoreDistributions(JSON.parse(rawDailyDist));
      } else {
        setDailyStoreDistributions(getAllDistributions());
      }
    } catch (e) {
      console.error('Error loading logs', e);
    }
  };

  useEffect(() => {
    loadLocalData();

    // Pull from cloud
    fetchFromCloud();

    // Pull on tab focus / visible
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadLocalData();
        fetchFromCloud();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    // Listen for storage events across tabs & custom dispatch
    const handleStorageUpdate = () => {
      loadLocalData();
    };
    window.addEventListener('storage', handleStorageUpdate);
    window.addEventListener('storage_updated', handleStorageUpdate);

    // Auto background poll every 15s for concurrent multi-device collaboration
    const pollInterval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchFromCloud();
      }
    }, 15000);

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('storage', handleStorageUpdate);
      window.removeEventListener('storage_updated', handleStorageUpdate);
      clearInterval(pollInterval);
    };
  }, []);

  // Formatted date string (YYYY-MM-DD)
  const selectedDateStr = useMemo(() => {
    const mm = String(selectedMonth).padStart(2, '0');
    const dd = String(selectedDay).padStart(2, '0');
    return `${selectedYear}-${mm}-${dd}`;
  }, [selectedYear, selectedMonth, selectedDay]);

  // Handle Save Manual Delivery to a Store
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

    const item = allItems.find((i) => i.id === deliveryItemId);
    setDeliverySuccessMsg(
      `✅ បានកត់ត្រាការចែក៖ ${deliveryQty} ${item?.uom || ''} នៃ ${item?.description_khmer} ទៅកាន់ហាង ${deliveryStoreCode}!`
    );
    setDeliveryQty(0);
    setTimeout(() => setDeliverySuccessMsg(''), 3500);
  };

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
      list = list.filter(
        (s) => s.code.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
      );
    }
    return list;
  }, [selectedBrand, selectedStoreCode, searchQuery]);

  // Helper to extract items delivered to a specific store on a specific date across all storage sources
  const getStoreUnitsOnDate = (storeCode: string, dateStr: string): number => {
    // 1. Daily store distribution from inventoryStore / DailyStoreDistribution
    const dailyRec = dailyStoreDistributions.find(
      (r) => r.date === dateStr && isStoreMatch(r.storeCode, storeCode)
    );
    const dailyDistQty = dailyRec ? Number(dailyRec.itemCount) || 0 : 0;

    // 2. cpu_history_distribution from Main Dashboard in page.tsx
    let histQty = 0;
    const dayHist = historyDistribution[dateStr];
    if (dayHist) {
      for (const [k, v] of Object.entries(dayHist)) {
        if (isStoreMatch(k, storeCode)) {
          histQty = Math.max(histQty, Number(v) || 0);
        }
      }
    }

    // 3. v5 stores
    let v5Qty = 0;
    const dayV5List = v5Stores[dateStr];
    if (dayV5List && Array.isArray(dayV5List)) {
      const matched = dayV5List.find((s) => isStoreMatch(s.code || s.id, storeCode));
      if (matched) {
        v5Qty = Number(matched.dailyAmount) || 0;
      }
    }

    // 4. Manual item dispatches
    let dispatchQty = 0;
    const dayDispatches = storeDispatches[dateStr];
    if (dayDispatches) {
      for (const [stKey, itemMap] of Object.entries(dayDispatches)) {
        if (isStoreMatch(stKey, storeCode)) {
          dispatchQty += Object.values(itemMap).reduce((sum, q) => sum + (Number(q) || 0), 0);
        }
      }
    }

    const baseCount = Math.max(dailyDistQty, histQty, v5Qty);
    return baseCount > 0 ? baseCount : dispatchQty;
  };

  // Collect all unique recorded dates across all data sources
  const allRecordedDates = useMemo(() => {
    const set = new Set<string>();
    Object.keys(historyDistribution).forEach((d) => set.add(d));
    Object.keys(v5Stores).forEach((d) => set.add(d));
    Object.keys(storeDispatches).forEach((d) => set.add(d));
    dailyStoreDistributions.forEach((r) => {
      if (r.date) set.add(r.date);
    });
    set.add(selectedDateStr);
    return Array.from(set);
  }, [historyDistribution, v5Stores, storeDispatches, dailyStoreDistributions, selectedDateStr]);

  // Aggregate stats per store (DAILY, MONTHLY, YEARLY)
  const storeAnalytics = useMemo(() => {
    const monthPrefix = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
    const yearPrefix = `${selectedYear}-`;

    const monthDates = allRecordedDates.filter((d) => d.startsWith(monthPrefix));
    const yearDates = allRecordedDates.filter((d) => d.startsWith(yearPrefix));

    return ALL_STORES.map((store) => {
      const storeItems = allItems.filter((it) => it.location === store.brand);
      const itemsCount = storeItems.length; // 69 for Tube Coffee+, 36 for OnMart

      // Average CPU price for store brand
      const storePrices = storeItems.map((it) => v5Prices[it.code] || it.cpu || 0).filter((p) => p > 0);
      const avgPrice = storePrices.length > 0 ? storePrices.reduce((a, b) => a + b, 0) / storePrices.length : 2.5;

      // 1. DAILY CALCULATION (Selected Date)
      const dailyUnits = getStoreUnitsOnDate(store.code, selectedDateStr);
      let dailyAmount = 0;
      let dailyItemsList: { item: StockItem; qty: number; value: number }[] = [];

      // Check manual item-specific dispatches
      const dayDispatches = storeDispatches[selectedDateStr];
      if (dayDispatches) {
        for (const [stKey, itemMap] of Object.entries(dayDispatches)) {
          if (isStoreMatch(stKey, store.code)) {
            Object.entries(itemMap).forEach(([itemId, qty]) => {
              const item = allItems.find((i) => i.id === itemId || i.code === itemId);
              if (item) {
                const price = v5Prices[item.code] || item.cpu || avgPrice;
                const val = (Number(qty) || 0) * price;
                dailyAmount += val;
                dailyItemsList.push({ item, qty: Number(qty) || 0, value: val });
              }
            });
          }
        }
      }

      if (dailyAmount === 0 && dailyUnits > 0 && avgPrice > 0) {
        dailyAmount = dailyUnits * avgPrice;
      }

      // 2. MONTHLY CALCULATION (Selected Month)
      let monthlyUnitsFromDays = 0;
      monthDates.forEach((dStr) => {
        monthlyUnitsFromDays += getStoreUnitsOnDate(store.code, dStr);
      });

      // Match v5 baseline monthly
      const dayV5StoreList = v5Stores[selectedDateStr];
      const matchV5 = dayV5StoreList?.find((s) => isStoreMatch(s.code || s.id, store.code));
      const monthlyUnits = Math.max(monthlyUnitsFromDays, matchV5?.monthlyAmount || 0);
      const monthlyAmount = monthlyUnits * avgPrice;

      // 3. YEARLY CALCULATION (Selected Year)
      let yearlyUnitsFromDays = 0;
      yearDates.forEach((dStr) => {
        yearlyUnitsFromDays += getStoreUnitsOnDate(store.code, dStr);
      });
      const yearlyUnits = Math.max(yearlyUnitsFromDays, matchV5?.yearlyAmount || 0);
      const yearlyAmount = yearlyUnits * avgPrice;

      // Total Inventory Valuation allocated to this store
      let storeTotalStockValue = 0;
      const dayStock = v5Stock[selectedDateStr];
      if (dayStock) {
        dayStock.forEach((i) => {
          if (i.brand === (store.brand === 'TUBE_COFFEE' ? 'Tube Coffee' : 'OnMart')) {
            const bal = (i.opening_stock || 0) + (i.stock_in || 0) - (i.stock_out || 0);
            const itemPrice = v5Prices[i.item_code] !== undefined ? v5Prices[i.item_code] : (i.cpu || 0);
            if (bal > 0 && itemPrice > 0) {
              storeTotalStockValue += (bal * itemPrice) * (1 / (store.brand === 'TUBE_COFFEE' ? 9 : 4));
            }
          }
        });
      }

      return {
        ...store,
        itemsCount,
        dailyUnits,
        dailyAmount,
        dailyItemsList,
        monthlyUnits,
        monthlyAmount,
        yearlyUnits,
        yearlyAmount,
        storeTotalStockValue,
      };
    });
  }, [
    allItems,
    storeDispatches,
    v5Stores,
    v5Stock,
    v5Prices,
    selectedDateStr,
    selectedYear,
    selectedMonth,
    allRecordedDates,
    dailyStoreDistributions,
    historyDistribution,
  ]);

  // Overall Totals
  const overallTotals = useMemo(() => {
    return storeAnalytics.reduce(
      (acc, s) => {
        acc.dailyUnits += s.dailyUnits;
        acc.dailyAmount += s.dailyAmount;
        acc.monthlyUnits += s.monthlyUnits;
        acc.monthlyAmount += s.monthlyAmount;
        acc.yearlyUnits += s.yearlyUnits;
        acc.yearlyAmount += s.yearlyAmount;
        acc.totalValuation += s.storeTotalStockValue;
        return acc;
      },
      {
        dailyUnits: 0,
        dailyAmount: 0,
        monthlyUnits: 0,
        monthlyAmount: 0,
        yearlyUnits: 0,
        yearlyAmount: 0,
        totalValuation: 0,
      }
    );
  }, [storeAnalytics]);

  // Dedicated Brand Breakdown for Daily, Monthly, and Yearly Tracker Items Total
  const brandTotals = useMemo(() => {
    let tubeDaily = 0, tubeMonthly = 0, tubeYearly = 0, tubeDailyAmt = 0, tubeMonthlyAmt = 0, tubeYearlyAmt = 0;
    let onmartDaily = 0, onmartMonthly = 0, onmartYearly = 0, onmartDailyAmt = 0, onmartMonthlyAmt = 0, onmartYearlyAmt = 0;

    storeAnalytics.forEach((s) => {
      if (s.brand === 'TUBE_COFFEE') {
        tubeDaily += s.dailyUnits;
        tubeMonthly += s.monthlyUnits;
        tubeYearly += s.yearlyUnits;
        tubeDailyAmt += s.dailyAmount;
        tubeMonthlyAmt += s.monthlyAmount;
        tubeYearlyAmt += s.yearlyAmount;
      } else {
        onmartDaily += s.dailyUnits;
        onmartMonthly += s.monthlyUnits;
        onmartYearly += s.yearlyUnits;
        onmartDailyAmt += s.dailyAmount;
        onmartMonthlyAmt += s.monthlyAmount;
        onmartYearlyAmt += s.yearlyAmount;
      }
    });

    const totalDaily = tubeDaily + onmartDaily;
    const totalMonthly = tubeMonthly + onmartMonthly;
    const totalYearly = tubeYearly + onmartYearly;

    return {
      tube: {
        dailyItems: tubeDaily,
        monthlyItems: tubeMonthly,
        yearlyItems: tubeYearly,
        dailyAmount: tubeDailyAmt,
        monthlyAmount: tubeMonthlyAmt,
        yearlyAmount: tubeYearlyAmt,
        dailyPct: totalDaily > 0 ? ((tubeDaily / totalDaily) * 100).toFixed(1) : '0',
        monthlyPct: totalMonthly > 0 ? ((tubeMonthly / totalMonthly) * 100).toFixed(1) : '0',
        yearlyPct: totalYearly > 0 ? ((tubeYearly / totalYearly) * 100).toFixed(1) : '0',
      },
      onmart: {
        dailyItems: onmartDaily,
        monthlyItems: onmartMonthly,
        yearlyItems: onmartYearly,
        dailyAmount: onmartDailyAmt,
        monthlyAmount: onmartMonthlyAmt,
        yearlyAmount: onmartYearlyAmt,
        dailyPct: totalDaily > 0 ? ((onmartDaily / totalDaily) * 100).toFixed(1) : '0',
        monthlyPct: totalMonthly > 0 ? ((onmartMonthly / totalMonthly) * 100).toFixed(1) : '0',
        yearlyPct: totalYearly > 0 ? ((onmartYearly / totalYearly) * 100).toFixed(1) : '0',
      },
      total: {
        dailyItems: totalDaily,
        monthlyItems: totalMonthly,
        yearlyItems: totalYearly,
        dailyAmount: tubeDailyAmt + onmartDailyAmt,
        monthlyAmount: tubeMonthlyAmt + onmartMonthlyAmt,
        yearlyAmount: tubeYearlyAmt + onmartYearlyAmt,
      },
    };
  }, [storeAnalytics]);

  // Find Top Receiving Store
  const topStoreDaily = useMemo(() => {
    return [...storeAnalytics].sort((a, b) => b.dailyUnits - a.dailyUnits)[0];
  }, [storeAnalytics]);

  const topStoreMonthly = useMemo(() => {
    return [...storeAnalytics].sort((a, b) => b.monthlyUnits - a.monthlyUnits)[0];
  }, [storeAnalytics]);

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 leading-tight flex items-center gap-2">
              <Truck className="w-5 h-5 text-indigo-600" />
              <span>Store Distribution Dashboard • របាយការណ៍បែងចែកទំនិញតាមហាង</span>
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              បង្ហាញ Daily, Monthly, Yearly Total Amount ($) &amp; Items per Store (Tube Coffee+ 9 ហាង &amp; OnMart 4 ហាង)
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Cloud Sync Status Badge & Button */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs">
              {syncStatus === 'syncing' && (
                <span className="flex items-center gap-1 text-amber-700 font-bold">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-600" />
                  <span>Syncing...</span>
                </span>
              )}
              {syncStatus === 'synced' && (
                <span className="flex items-center gap-1 text-emerald-700 font-bold" title={`Last synced: ${lastSyncedTime}`}>
                  <Cloud className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Cloud Synced {lastSyncedTime ? `(${lastSyncedTime})` : ''}</span>
                </span>
              )}
              {syncStatus === 'error' && (
                <span className="flex items-center gap-1 text-rose-700 font-bold">
                  <CloudOff className="w-3.5 h-3.5 text-rose-500" />
                  <span>Offline</span>
                </span>
              )}
              {syncStatus === 'idle' && (
                <span className="flex items-center gap-1 text-slate-500 font-medium">
                  <Cloud className="w-3.5 h-3.5 text-slate-400" />
                  <span>Ready</span>
                </span>
              )}
              <button
                onClick={() => fetchFromCloud()}
                disabled={syncStatus === 'syncing'}
                className="ml-1 flex items-center gap-1 px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-200 text-xs font-bold transition-all shadow-xs active:scale-95 disabled:opacity-50 cursor-pointer"
                title="ទាញទិន្នន័យចុងក្រោយពី Cloud (Pull from Cloud)"
              >
                <RefreshCw className={`w-3 h-3 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
                <span>Sync Cloud 🔄</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filters: Brand, Year, Month, Day */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Brand Switcher */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 gap-1 font-bold flex-wrap">
            <button
              onClick={() => {
                setSelectedBrand('ALL');
                setSelectedStoreCode('ALL');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
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
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
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
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                selectedBrand === 'ONMART'
                  ? 'bg-white text-emerald-900 shadow-xs'
                  : 'text-slate-600 hover:text-emerald-800'
              }`}
            >
              <Store className="w-3.5 h-3.5 text-emerald-600" />
              <span>OnMart (4 ហាង)</span>
            </button>
          </div>

          {/* Date Range Selector */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Year Selector */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 gap-1">
              <span className="px-2 font-bold text-slate-500">ឆ្នាំ:</span>
              {YEARS.map((yr) => (
                <button
                  key={yr}
                  onClick={() => setSelectedYear(yr)}
                  className={`px-2.5 py-1 rounded-lg font-black transition-all cursor-pointer ${
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
                className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
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
                className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
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
      </div>

      {/* ========================================================================= */}
      {/* 🎯 EXECUTIVE TRACKER ITEMS TOTAL (DAILY • MONTHLY • YEARLY) BANNER & CARDS */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-5 sm:p-6 text-white shadow-xl border border-indigo-800/40 relative overflow-hidden">
        {/* Ambient lighting glow */}
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Tracker Banner Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-white/10 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shadow-inner">
              <TrendingUp className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
                  <span>🎯 TRACKER ITEMS TOTAL • ផ្ទាំងតាមដានចំនួនទំនិញសរុប</span>
                </h3>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Live Sync Realtime
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium mt-0.5">
                ប្រព័ន្ធតាមដានចំនួនទំនិញសរុប (Items Total) ចែកចាយទៅកាន់សាខាទាំង ១៣ (Tube Coffee 9 ហាង + OnMart 4 ហាង) ប្រចាំថ្ងៃ ខែ ឆ្នាំ
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="bg-white/10 px-3 py-1.5 rounded-xl border border-white/10 text-slate-200 font-bold">
              កាលបរិច្ឆេទជ្រើសរើស៖ <span className="font-mono text-amber-300">{selectedDateStr}</span>
            </span>
          </div>
        </div>

        {/* 3 Prominent Tracker Metric Cards: Daily, Monthly, Yearly */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5 relative z-10">
          {/* 1. DAILY ITEMS TOTAL TRACKER */}
          <div className="bg-white/5 hover:bg-white/10 transition-all rounded-2xl p-4.5 border border-emerald-500/30 backdrop-blur-xs relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                <span>1. DAILY ITEMS TOTAL (ថ្ងៃនេះ)</span>
              </span>
              <span className="text-[11px] font-mono text-slate-300">ថ្ងៃទី {selectedDay}</span>
            </div>

            <div className="mt-3.5">
              <div className="text-3xl sm:text-4xl font-black text-emerald-400 font-mono tracking-tight flex items-baseline gap-2">
                <span>{brandTotals.total.dailyItems.toLocaleString()}</span>
                <span className="text-xs font-bold text-emerald-200/80 uppercase">Items Total</span>
              </div>
              <div className="text-xs text-slate-300 mt-1 flex items-center justify-between">
                <span>សរុបតម្លៃទឹកប្រាក់ថ្ងៃនេះ៖</span>
                <span className="font-mono font-bold text-white">
                  ${brandTotals.total.dailyAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Brand Breakdown Pills */}
            <div className="mt-3.5 pt-3 border-t border-white/10 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-amber-300 font-bold">
                  <Coffee className="w-3.5 h-3.5" />
                  <span>Tube Coffee (9 ហាង)៖</span>
                </span>
                <span className="font-mono font-black text-white">
                  {brandTotals.tube.dailyItems.toLocaleString()} items{' '}
                  <span className="text-[10px] text-amber-400 font-normal">({brandTotals.tube.dailyPct}%)</span>
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-blue-300 font-bold">
                  <Store className="w-3.5 h-3.5" />
                  <span>OnMart (4 ហាង)៖</span>
                </span>
                <span className="font-mono font-black text-white">
                  {brandTotals.onmart.dailyItems.toLocaleString()} items{' '}
                  <span className="text-[10px] text-blue-400 font-normal">({brandTotals.onmart.dailyPct}%)</span>
                </span>
              </div>

              {/* Progress visual bar */}
              <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden flex mt-2">
                <div
                  className="bg-amber-400 h-full transition-all duration-500"
                  style={{ width: `${brandTotals.tube.dailyPct}%` }}
                  title={`Tube Coffee: ${brandTotals.tube.dailyPct}%`}
                />
                <div
                  className="bg-blue-400 h-full transition-all duration-500"
                  style={{ width: `${brandTotals.onmart.dailyPct}%` }}
                  title={`OnMart: ${brandTotals.onmart.dailyPct}%`}
                />
              </div>
            </div>
          </div>

          {/* 2. MONTHLY ITEMS TOTAL TRACKER */}
          <div className="bg-white/5 hover:bg-white/10 transition-all rounded-2xl p-4.5 border border-indigo-500/30 backdrop-blur-xs relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                <BarChart3 className="w-3.5 h-3.5 text-indigo-400" />
                <span>2. MONTHLY ITEMS TOTAL (ខែនេះ)</span>
              </span>
              <span className="text-[11px] font-mono text-slate-300">
                {MONTHS[selectedMonth - 1].nameEn} {selectedYear}
              </span>
            </div>

            <div className="mt-3.5">
              <div className="text-3xl sm:text-4xl font-black text-indigo-300 font-mono tracking-tight flex items-baseline gap-2">
                <span>{brandTotals.total.monthlyItems.toLocaleString()}</span>
                <span className="text-xs font-bold text-indigo-200/80 uppercase">Items Total</span>
              </div>
              <div className="text-xs text-slate-300 mt-1 flex items-center justify-between">
                <span>សរុបតម្លៃទឹកប្រាក់ខែនេះ៖</span>
                <span className="font-mono font-bold text-white">
                  ${brandTotals.total.monthlyAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Brand Breakdown Pills */}
            <div className="mt-3.5 pt-3 border-t border-white/10 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-amber-300 font-bold">
                  <Coffee className="w-3.5 h-3.5" />
                  <span>Tube Coffee (9 ហាង)៖</span>
                </span>
                <span className="font-mono font-black text-white">
                  {brandTotals.tube.monthlyItems.toLocaleString()} items{' '}
                  <span className="text-[10px] text-amber-400 font-normal">({brandTotals.tube.monthlyPct}%)</span>
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-blue-300 font-bold">
                  <Store className="w-3.5 h-3.5" />
                  <span>OnMart (4 ហាង)៖</span>
                </span>
                <span className="font-mono font-black text-white">
                  {brandTotals.onmart.monthlyItems.toLocaleString()} items{' '}
                  <span className="text-[10px] text-blue-400 font-normal">({brandTotals.onmart.monthlyPct}%)</span>
                </span>
              </div>

              {/* Progress visual bar */}
              <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden flex mt-2">
                <div
                  className="bg-amber-400 h-full transition-all duration-500"
                  style={{ width: `${brandTotals.tube.monthlyPct}%` }}
                  title={`Tube Coffee: ${brandTotals.tube.monthlyPct}%`}
                />
                <div
                  className="bg-blue-400 h-full transition-all duration-500"
                  style={{ width: `${brandTotals.onmart.monthlyPct}%` }}
                  title={`OnMart: ${brandTotals.onmart.monthlyPct}%`}
                />
              </div>
            </div>
          </div>

          {/* 3. YEARLY ITEMS TOTAL TRACKER */}
          <div className="bg-white/5 hover:bg-white/10 transition-all rounded-2xl p-4.5 border border-amber-500/30 backdrop-blur-xs relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-500/40">
                <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                <span>3. YEARLY ITEMS TOTAL (ឆ្នាំនេះ)</span>
              </span>
              <span className="text-[11px] font-mono text-slate-300">ឆ្នាំ {selectedYear}</span>
            </div>

            <div className="mt-3.5">
              <div className="text-3xl sm:text-4xl font-black text-amber-300 font-mono tracking-tight flex items-baseline gap-2">
                <span>{brandTotals.total.yearlyItems.toLocaleString()}</span>
                <span className="text-xs font-bold text-amber-200/80 uppercase">Items Total</span>
              </div>
              <div className="text-xs text-slate-300 mt-1 flex items-center justify-between">
                <span>សរុបតម្លៃទឹកប្រាក់ឆ្នាំនេះ៖</span>
                <span className="font-mono font-bold text-white">
                  ${brandTotals.total.yearlyAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Brand Breakdown Pills */}
            <div className="mt-3.5 pt-3 border-t border-white/10 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-amber-300 font-bold">
                  <Coffee className="w-3.5 h-3.5" />
                  <span>Tube Coffee (9 ហាង)៖</span>
                </span>
                <span className="font-mono font-black text-white">
                  {brandTotals.tube.yearlyItems.toLocaleString()} items{' '}
                  <span className="text-[10px] text-amber-400 font-normal">({brandTotals.tube.yearlyPct}%)</span>
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-blue-300 font-bold">
                  <Store className="w-3.5 h-3.5" />
                  <span>OnMart (4 ហាង)៖</span>
                </span>
                <span className="font-mono font-black text-white">
                  {brandTotals.onmart.yearlyItems.toLocaleString()} items{' '}
                  <span className="text-[10px] text-blue-400 font-normal">({brandTotals.onmart.yearlyPct}%)</span>
                </span>
              </div>

              {/* Progress visual bar */}
              <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden flex mt-2">
                <div
                  className="bg-amber-400 h-full transition-all duration-500"
                  style={{ width: `${brandTotals.tube.yearlyPct}%` }}
                  title={`Tube Coffee: ${brandTotals.tube.yearlyPct}%`}
                />
                <div
                  className="bg-blue-400 h-full transition-all duration-500"
                  style={{ width: `${brandTotals.onmart.yearlyPct}%` }}
                  title={`OnMart: ${brandTotals.onmart.yearlyPct}%`}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Highlights Summary Bar */}
        <div className="mt-4 pt-3.5 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-400" />
              <span>
                ហាងទទួលច្រើនជាងគេប្រចាំថ្ងៃ៖{' '}
                <strong className="text-white">
                  {topStoreDaily && topStoreDaily.dailyUnits > 0 ? `${topStoreDaily.name} (${topStoreDaily.dailyUnits} Items)` : 'គ្មានទិន្នន័យ'}
                </strong>
              </span>
            </span>
            <span className="text-white/20 hidden sm:inline">•</span>
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>
                ហាងទទួលច្រើនជាងគេប្រចាំខែ៖{' '}
                <strong className="text-white">
                  {topStoreMonthly && topStoreMonthly.monthlyUnits > 0 ? `${topStoreMonthly.name} (${topStoreMonthly.monthlyUnits} Items)` : 'គ្មានទិន្នន័យ'}
                </strong>
              </span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="bg-emerald-500/20 text-emerald-300 px-2.5 py-1 rounded-lg font-bold border border-emerald-500/30">
              13 សាខាសកម្ម
            </span>
            <span className="bg-indigo-500/20 text-indigo-300 px-2.5 py-1 rounded-lg font-bold border border-indigo-500/30">
              105 ទំនិញក្នុងស្តុក
            </span>
          </div>
        </div>
      </div>

      {/* Dashboard View Mode Selector Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 gap-1 text-xs font-bold flex-wrap">
            <button
              onClick={() => setActiveTab('TRACKER')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition-all cursor-pointer ${
                activeTab === 'TRACKER'
                  ? 'bg-slate-900 text-white shadow-xs font-black ring-2 ring-slate-900/20'
                  : 'text-slate-700 hover:text-slate-900 bg-white/60'
              }`}
            >
              <TrendingUp className="w-4 h-4 text-amber-400" />
              <span>🎯 Items Total Tracker (Daily • Monthly • Yearly)</span>
            </button>

            <button
              onClick={() => setActiveTab('DAILY')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all cursor-pointer ${
                activeTab === 'DAILY'
                  ? 'bg-emerald-600 text-white shadow-xs font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>1. Daily Store Details (ថ្ងៃ {selectedDay})</span>
            </button>

            <button
              onClick={() => setActiveTab('MONTHLY')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all cursor-pointer ${
                activeTab === 'MONTHLY'
                  ? 'bg-indigo-600 text-white shadow-xs font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>2. Monthly Store Details ({MONTHS[selectedMonth - 1].nameEn})</span>
            </button>

            <button
              onClick={() => setActiveTab('YEARLY')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all cursor-pointer ${
                activeTab === 'YEARLY'
                  ? 'bg-amber-600 text-white shadow-xs font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>3. Yearly Store Details ({selectedYear})</span>
            </button>

            <button
              onClick={() => setActiveTab('ALL_MATRIX')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all cursor-pointer ${
                activeTab === 'ALL_MATRIX'
                  ? 'bg-purple-700 text-white shadow-xs font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>4. Master Table (តារាងប្រៀបធៀប)</span>
            </button>

            <Link
              href="/items"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-black transition-all text-xs shadow-2xs"
              title="កំណត់តម្លៃទំនិញ Master Items (Key In Prices)"
            >
              <Package className="w-3.5 h-3.5 text-emerald-600" />
              <span>Master Items ($) ↗</span>
              {Object.keys(v5Prices).filter((k) => v5Prices[k] > 0).length > 0 && (
                <span className="px-1.5 py-0.5 bg-emerald-600 text-white rounded-md text-[10px] font-mono font-black">
                  {Object.keys(v5Prices).filter((k) => v5Prices[k] > 0).length} Set
                </span>
              )}
            </Link>
          </div>

          {/* Quick Search */}
          <div className="relative min-w-[220px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="ស្វែងរកកូដ ឬឈ្មោះហាង..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 0: 🎯 DEDICATED ITEMS TOTAL TRACKER MATRIX (DAILY • MONTHLY • YEARLY) */}
      {/* ========================================================================= */}
      {activeTab === 'TRACKER' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-0">
          <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50/80">
            <div>
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-amber-600" />
                <span>តារាងតាមដានចំនួនទំនិញសរុបគ្រប់សាខា (Items Total Tracker: Daily • Monthly • Yearly)</span>
                <span className="text-xs font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                  {filteredStores.length} Stores
                </span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                ប្រៀបធៀបចំនួន Items សរុបជាក់ស្តែងដែលបានចែកចាយទៅកាន់សាខាទាំង ១៣ តាមថ្ងៃ ខែ ឆ្នាំ និងភាគរយចែកចាយ
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                Daily: {overallTotals.dailyUnits} Items
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-800 font-bold border border-indigo-200">
                Monthly: {overallTotals.monthlyUnits} Items
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 font-bold border border-amber-200">
                Yearly: {overallTotals.yearlyUnits} Items
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-900 text-white font-semibold sticky top-0 z-10">
                <tr className="divide-x divide-slate-800">
                  <th className="py-3 px-3 w-16 text-center">កូដ</th>
                  <th className="py-3 px-3 min-w-[180px]">ឈ្មោះសាខា (Store Name)</th>
                  <th className="py-3 px-2 text-center w-28">Brand</th>
                  <th className="py-3 px-2 text-center w-28 bg-slate-800 text-slate-300">
                    Items Catalog
                  </th>
                  <th className="py-3 px-3 text-right w-44 bg-emerald-950/80 text-emerald-200">
                    <div className="flex items-center justify-end gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>1. Daily Items (ថ្ងៃទី {selectedDay})</span>
                    </div>
                    <div className="text-[10px] font-normal text-emerald-300/70">Items Total • Amount ($)</div>
                  </th>
                  <th className="py-3 px-3 text-right w-44 bg-indigo-950/80 text-indigo-200">
                    <div className="flex items-center justify-end gap-1">
                      <BarChart3 className="w-3.5 h-3.5" />
                      <span>2. Monthly Items (ខែ {selectedMonth})</span>
                    </div>
                    <div className="text-[10px] font-normal text-indigo-300/70">Items Total • Amount ($)</div>
                  </th>
                  <th className="py-3 px-3 text-right w-44 bg-amber-950/80 text-amber-200">
                    <div className="flex items-center justify-end gap-1">
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span>3. Yearly Items ({selectedYear})</span>
                    </div>
                    <div className="text-[10px] font-normal text-amber-300/70">Items Total • Amount ($)</div>
                  </th>
                  <th className="py-3 px-3 text-center w-24">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredStores.map((st) => {
                  const data = storeAnalytics.find((s) => s.code === st.code);
                  const isTube = st.brand === 'TUBE_COFFEE';

                  const dailyShare =
                    overallTotals.dailyUnits > 0
                      ? (((data?.dailyUnits || 0) / overallTotals.dailyUnits) * 100).toFixed(1)
                      : '0';
                  const monthlyShare =
                    overallTotals.monthlyUnits > 0
                      ? (((data?.monthlyUnits || 0) / overallTotals.monthlyUnits) * 100).toFixed(1)
                      : '0';
                  const yearlyShare =
                    overallTotals.yearlyUnits > 0
                      ? (((data?.yearlyUnits || 0) / overallTotals.yearlyUnits) * 100).toFixed(1)
                      : '0';

                  return (
                    <tr
                      key={st.code}
                      className="hover:bg-slate-50/90 transition-colors divide-x divide-slate-100"
                    >
                      {/* Code */}
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
                        <div className="text-[10px] text-slate-400">
                          {isTube ? 'Tube Coffee+ Network' : 'OnMart Supermarket'}
                        </div>
                      </td>

                      {/* Brand */}
                      <td className="py-3 px-2 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            isTube
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : 'bg-blue-50 text-blue-800 border border-blue-200'
                          }`}
                        >
                          {isTube ? 'Tube Coffee+' : 'OnMart'}
                        </span>
                      </td>

                      {/* Items Catalog Available */}
                      <td className="py-3 px-2 text-center bg-slate-50/50">
                        <span className="font-black text-slate-800 text-xs px-2.5 py-0.5 bg-slate-200 rounded-md">
                          {st.itemCount} Items
                        </span>
                      </td>

                      {/* 1. DAILY ITEMS TRACKER */}
                      <td className="py-3 px-3 text-right bg-emerald-50/20 font-mono">
                        <div className="text-sm font-black text-emerald-900">
                          {data?.dailyUnits || 0}{' '}
                          <span className="text-[10px] font-normal text-emerald-700">items</span>
                        </div>
                        <div className="text-[11px] font-bold text-emerald-700">
                          ${(data?.dailyAmount || 0).toFixed(2)}
                        </div>
                        <div className="text-[9px] text-slate-400 mt-0.5">
                          {dailyShare}% of day
                        </div>
                      </td>

                      {/* 2. MONTHLY ITEMS TRACKER */}
                      <td className="py-3 px-3 text-right bg-indigo-50/20 font-mono">
                        <div className="text-sm font-black text-indigo-900">
                          {data?.monthlyUnits || 0}{' '}
                          <span className="text-[10px] font-normal text-indigo-700">items</span>
                        </div>
                        <div className="text-[11px] font-bold text-indigo-700">
                          ${(data?.monthlyAmount || 0).toFixed(2)}
                        </div>
                        <div className="text-[9px] text-slate-400 mt-0.5">
                          {monthlyShare}% of month
                        </div>
                      </td>

                      {/* 3. YEARLY ITEMS TRACKER */}
                      <td className="py-3 px-3 text-right bg-amber-50/20 font-mono">
                        <div className="text-sm font-black text-amber-900">
                          {data?.yearlyUnits || 0}{' '}
                          <span className="text-[10px] font-normal text-amber-700">items</span>
                        </div>
                        <div className="text-[11px] font-bold text-amber-700">
                          ${(data?.yearlyAmount || 0).toFixed(2)}
                        </div>
                        <div className="text-[9px] text-slate-400 mt-0.5">
                          {yearlyShare}% of year
                        </div>
                      </td>

                      {/* Action */}
                      <td className="py-3 px-2 text-center">
                        <button
                          onClick={() => setActiveDetailStore(st)}
                          className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300 sticky bottom-0 z-10 shadow-xs">
                <tr className="divide-x divide-slate-200">
                  <td colSpan={3} className="py-3 px-3 uppercase tracking-wider text-xs">
                    សរុបរួម {filteredStores.length} សាខាហាង (GRAND TOTAL)
                  </td>
                  <td className="py-3 px-2 text-center text-slate-900 font-black">
                    105 Items
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-black text-emerald-900 bg-emerald-100/50">
                    <div className="text-sm">{overallTotals.dailyUnits.toLocaleString()} Items</div>
                    <div className="text-[11px] text-emerald-700 font-bold">${overallTotals.dailyAmount.toFixed(2)}</div>
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-black text-indigo-900 bg-indigo-100/50">
                    <div className="text-sm">{overallTotals.monthlyUnits.toLocaleString()} Items</div>
                    <div className="text-[11px] text-indigo-700 font-bold">${overallTotals.monthlyAmount.toFixed(2)}</div>
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-black text-amber-900 bg-amber-100/50">
                    <div className="text-sm">{overallTotals.yearlyUnits.toLocaleString()} Items</div>
                    <div className="text-[11px] text-amber-700 font-bold">${overallTotals.yearlyAmount.toFixed(2)}</div>
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: DAILY STORE DISTRIBUTION DASHBOARD */}
      {/* ========================================================================= */}
      {activeTab === 'DAILY' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <span>
                Daily Total Items &amp; Amount Received per Store (ថ្ងៃទី {selectedDay}/{selectedMonth}/{selectedYear})
              </span>
            </h3>
            <span className="text-xs font-bold text-slate-500">
              សរុបថ្ងៃនេះ៖ <strong className="text-emerald-700">{overallTotals.dailyUnits} Items</strong> (
              <strong className="text-slate-900">${overallTotals.dailyAmount.toFixed(2)}</strong>)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredStores.map((st) => {
              const data = storeAnalytics.find((s) => s.code === st.code);
              const isTube = st.brand === 'TUBE_COFFEE';
              const sharePct =
                overallTotals.dailyAmount > 0
                  ? (((data?.dailyAmount || 0) / overallTotals.dailyAmount) * 100).toFixed(1)
                  : '0';

              return (
                <div
                  key={st.code}
                  className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs hover:border-slate-400 hover:shadow-xs transition-all relative overflow-hidden group"
                >
                  <div
                    className={`absolute top-0 left-0 bottom-0 w-1.5 ${
                      isTube ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                  />
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-mono font-black text-xs px-2 py-0.5 rounded-md ${
                            isTube
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          }`}
                        >
                          {st.code}
                        </span>
                        <span className="font-bold text-slate-900 text-xs truncate max-w-[150px]">
                          {st.name}
                        </span>
                      </div>
                      <span className="text-[10px] font-semibold text-slate-400 mt-0.5 block">
                        Brand: {isTube ? 'Tube Coffee+' : 'OnMart'} • {st.itemCount} Items available
                      </span>
                    </div>

                    <button
                      onClick={() => setActiveDetailStore(st)}
                      className="opacity-80 group-hover:opacity-100 px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                    >
                      Items
                    </button>
                  </div>

                  {/* Amount & Items Received Today */}
                  <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2">
                    <div className="bg-slate-50 p-2 rounded-xl">
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">
                        Items Received
                      </span>
                      <span className="text-lg font-black text-slate-900">
                        {data?.dailyUnits || 0}{' '}
                        <span className="text-[11px] font-normal text-slate-500">items</span>
                      </span>
                    </div>

                    <div className="bg-emerald-50/70 p-2 rounded-xl border border-emerald-100">
                      <span className="text-[10px] uppercase font-bold text-emerald-800 block">
                        Total Amount ($)
                      </span>
                      <span className="text-lg font-black text-emerald-800 font-mono">
                        ${(data?.dailyAmount || 0).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* 3-in-1 Tracker Pills for Daily, Monthly, Yearly */}
                  <div className="mt-2.5 grid grid-cols-3 gap-1 text-[10px] font-bold text-center">
                    <div className="bg-emerald-50 text-emerald-800 py-1 px-1 rounded-lg border border-emerald-200">
                      <span className="block text-[8px] uppercase text-emerald-600 font-medium">Daily</span>
                      <span>{data?.dailyUnits || 0} items</span>
                    </div>
                    <div className="bg-indigo-50 text-indigo-800 py-1 px-1 rounded-lg border border-indigo-200">
                      <span className="block text-[8px] uppercase text-indigo-600 font-medium">Monthly</span>
                      <span>{data?.monthlyUnits || 0} items</span>
                    </div>
                    <div className="bg-amber-50 text-amber-800 py-1 px-1 rounded-lg border border-amber-200">
                      <span className="block text-[8px] uppercase text-amber-600 font-medium">Yearly</span>
                      <span>{data?.yearlyUnits || 0} items</span>
                    </div>
                  </div>

                  {/* Share of daily output */}
                  <div className="mt-2.5 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 font-medium">Daily Supply Share:</span>
                    <span className="font-bold text-slate-700">{sharePct}% of kitchen</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1">
                    <div
                      className={`h-full ${isTube ? 'bg-amber-500' : 'bg-emerald-500'}`}
                      style={{ width: `${Math.min(100, Number(sharePct) * 3)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: MONTHLY STORE DISTRIBUTION DASHBOARD */}
      {/* ========================================================================= */}
      {activeTab === 'MONTHLY' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-600" />
              <span>
                Monthly Total Items &amp; Amount Received per Store (ខែ {MONTHS[selectedMonth - 1].nameKh} {selectedYear})
              </span>
            </h3>
            <span className="text-xs font-bold text-slate-500">
              សរុបប្រចាំខែ៖ <strong className="text-indigo-700">{overallTotals.monthlyUnits} Items</strong> (
              <strong className="text-slate-900">${overallTotals.monthlyAmount.toFixed(2)}</strong>)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredStores.map((st) => {
              const data = storeAnalytics.find((s) => s.code === st.code);
              const isTube = st.brand === 'TUBE_COFFEE';
              const sharePct =
                overallTotals.monthlyAmount > 0
                  ? (((data?.monthlyAmount || 0) / overallTotals.monthlyAmount) * 100).toFixed(1)
                  : '0';

              return (
                <div
                  key={st.code}
                  className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs hover:shadow-xs transition-all relative overflow-hidden"
                >
                  <div
                    className={`absolute top-0 left-0 bottom-0 w-1.5 ${
                      isTube ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                  />
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-mono font-black text-xs px-2 py-0.5 rounded-md ${
                            isTube
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          }`}
                        >
                          {st.code}
                        </span>
                        <span className="font-bold text-slate-900 text-xs">{st.name}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 mt-0.5 block">
                        Monthly Delivery Distribution • {MONTHS[selectedMonth - 1].nameEn} {selectedYear}
                      </span>
                    </div>

                    <button
                      onClick={() => setActiveDetailStore(st)}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                    >
                      Items
                    </button>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2">
                    <div className="bg-slate-50 p-2 rounded-xl">
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">
                        Month Items
                      </span>
                      <span className="text-lg font-black text-slate-900">
                        {data?.monthlyUnits || 0}{' '}
                        <span className="text-[11px] font-normal text-slate-500">items</span>
                      </span>
                    </div>

                    <div className="bg-indigo-50/70 p-2 rounded-xl border border-indigo-100">
                      <span className="text-[10px] uppercase font-bold text-indigo-800 block">
                        Month Amount ($)
                      </span>
                      <span className="text-lg font-black text-indigo-800 font-mono">
                        ${(data?.monthlyAmount || 0).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* 3-in-1 Tracker Pills */}
                  <div className="mt-2.5 grid grid-cols-3 gap-1 text-[10px] font-bold text-center">
                    <div className="bg-emerald-50 text-emerald-800 py-1 px-1 rounded-lg border border-emerald-200">
                      <span className="block text-[8px] uppercase text-emerald-600 font-medium">Daily</span>
                      <span>{data?.dailyUnits || 0} items</span>
                    </div>
                    <div className="bg-indigo-50 text-indigo-800 py-1 px-1 rounded-lg border border-indigo-200">
                      <span className="block text-[8px] uppercase text-indigo-600 font-medium">Monthly</span>
                      <span>{data?.monthlyUnits || 0} items</span>
                    </div>
                    <div className="bg-amber-50 text-amber-800 py-1 px-1 rounded-lg border border-amber-200">
                      <span className="block text-[8px] uppercase text-amber-600 font-medium">Yearly</span>
                      <span>{data?.yearlyUnits || 0} items</span>
                    </div>
                  </div>

                  <div className="mt-2.5 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 font-medium">Monthly Kitchen Share:</span>
                    <span className="font-bold text-indigo-700">{sharePct}% of total</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1">
                    <div
                      className="h-full bg-indigo-600"
                      style={{ width: `${Math.min(100, Number(sharePct) * 3)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: YEARLY STORE DISTRIBUTION DASHBOARD */}
      {/* ========================================================================= */}
      {activeTab === 'YEARLY' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-amber-600" />
              <span>
                Yearly Total Items &amp; Amount Received per Store (ឆ្នាំ {selectedYear})
              </span>
            </h3>
            <span className="text-xs font-bold text-slate-500">
              សរុបប្រចាំឆ្នាំ {selectedYear}៖ <strong className="text-amber-700">{overallTotals.yearlyUnits} Items</strong> (
              <strong className="text-slate-900">${overallTotals.yearlyAmount.toFixed(2)}</strong>)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredStores.map((st) => {
              const data = storeAnalytics.find((s) => s.code === st.code);
              const isTube = st.brand === 'TUBE_COFFEE';
              const sharePct =
                overallTotals.yearlyAmount > 0
                  ? (((data?.yearlyAmount || 0) / overallTotals.yearlyAmount) * 100).toFixed(1)
                  : '0';

              return (
                <div
                  key={st.code}
                  className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs hover:shadow-xs transition-all relative overflow-hidden"
                >
                  <div
                    className={`absolute top-0 left-0 bottom-0 w-1.5 ${
                      isTube ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                  />
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-mono font-black text-xs px-2 py-0.5 rounded-md ${
                            isTube
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          }`}
                        >
                          {st.code}
                        </span>
                        <span className="font-bold text-slate-900 text-xs">{st.name}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 mt-0.5 block">
                        Annual Cumulative Supply • Year {selectedYear}
                      </span>
                    </div>

                    <button
                      onClick={() => setActiveDetailStore(st)}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                    >
                      Items
                    </button>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2">
                    <div className="bg-slate-50 p-2 rounded-xl">
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">
                        Year Items
                      </span>
                      <span className="text-lg font-black text-slate-900">
                        {data?.yearlyUnits || 0}{' '}
                        <span className="text-[11px] font-normal text-slate-500">items</span>
                      </span>
                    </div>

                    <div className="bg-amber-50/70 p-2 rounded-xl border border-amber-100">
                      <span className="text-[10px] uppercase font-bold text-amber-800 block">
                        Year Amount ($)
                      </span>
                      <span className="text-lg font-black text-amber-800 font-mono">
                        ${(data?.yearlyAmount || 0).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* 3-in-1 Tracker Pills */}
                  <div className="mt-2.5 grid grid-cols-3 gap-1 text-[10px] font-bold text-center">
                    <div className="bg-emerald-50 text-emerald-800 py-1 px-1 rounded-lg border border-emerald-200">
                      <span className="block text-[8px] uppercase text-emerald-600 font-medium">Daily</span>
                      <span>{data?.dailyUnits || 0} items</span>
                    </div>
                    <div className="bg-indigo-50 text-indigo-800 py-1 px-1 rounded-lg border border-indigo-200">
                      <span className="block text-[8px] uppercase text-indigo-600 font-medium">Monthly</span>
                      <span>{data?.monthlyUnits || 0} items</span>
                    </div>
                    <div className="bg-amber-50 text-amber-800 py-1 px-1 rounded-lg border border-amber-200">
                      <span className="block text-[8px] uppercase text-amber-600 font-medium">Yearly</span>
                      <span>{data?.yearlyUnits || 0} items</span>
                    </div>
                  </div>

                  <div className="mt-2.5 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 font-medium">Yearly Allocation Share:</span>
                    <span className="font-bold text-amber-800">{sharePct}% of year</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1">
                    <div
                      className="h-full bg-amber-500"
                      style={{ width: `${Math.min(100, Number(sharePct) * 3)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: MASTER COMPARISON TABLE */}
      {/* ========================================================================= */}
      {activeTab === 'ALL_MATRIX' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50/70">
            <div>
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <span>តារាងសរុបប្រៀបធៀបសាខាហាង (Master Store Comparison: Daily, Monthly, Yearly)</span>
                <span className="text-xs font-extrabold px-2 py-0.5 rounded-full bg-slate-200 text-slate-800">
                  {filteredStores.length} Stores
                </span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                បង្ហាញចំនួន Items per store និងសរុបទឹកប្រាក់ Amount ($) តាមថ្ងៃ ខែ ឆ្នាំ
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-900 text-white font-semibold sticky top-0 z-10">
                <tr className="divide-x divide-slate-800">
                  <th className="py-3 px-3 w-20 text-center">Store</th>
                  <th className="py-3 px-3 min-w-[180px]">Store Name</th>
                  <th className="py-3 px-2 text-center w-28">Brand</th>
                  <th className="py-3 px-2 text-center w-28 bg-indigo-950/70 text-indigo-200">
                    Items per Store
                  </th>
                  <th className="py-3 px-3 text-right w-36 bg-emerald-950/70 text-emerald-200">
                    Daily Received (ថ្ងៃ {selectedDay})
                    <div className="text-[10px] font-normal text-slate-400">Items • Amount ($)</div>
                  </th>
                  <th className="py-3 px-3 text-right w-36 bg-indigo-950/70 text-indigo-200">
                    Monthly Received (ខែ {selectedMonth})
                    <div className="text-[10px] font-normal text-slate-400">Items • Amount ($)</div>
                  </th>
                  <th className="py-3 px-3 text-right w-36 bg-amber-950/70 text-amber-200">
                    Yearly Received (ឆ្នាំ {selectedYear})
                    <div className="text-[10px] font-normal text-slate-400">Items • Amount ($)</div>
                  </th>
                  <th className="py-3 px-3 text-right w-32 bg-slate-800 text-emerald-300">
                    Est. Value ($)
                  </th>
                  <th className="py-3 px-2 text-center w-20">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStores.map((st) => {
                  const data = storeAnalytics.find((s) => s.code === st.code);
                  const isTube = st.brand === 'TUBE_COFFEE';

                  return (
                    <tr
                      key={st.code}
                      className="hover:bg-slate-50/90 transition-colors divide-x divide-slate-100"
                    >
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

                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900">{st.name}</div>
                      </td>

                      <td className="py-3 px-2 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            isTube
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          }`}
                        >
                          {isTube ? 'Tube Coffee+' : 'OnMart'}
                        </span>
                      </td>

                      <td className="py-3 px-2 text-center bg-indigo-50/30">
                        <span className="font-black text-indigo-900 text-xs px-2.5 py-0.5 bg-indigo-100 rounded-md">
                          {st.itemCount} Items
                        </span>
                      </td>

                      {/* Daily Received */}
                      <td className="py-3 px-3 text-right bg-emerald-50/20 font-mono">
                        <div className="font-bold text-slate-900">
                          {data?.dailyUnits || 0} items
                        </div>
                        <div className="text-[11px] font-black text-emerald-700">
                          ${(data?.dailyAmount || 0).toFixed(2)}
                        </div>
                      </td>

                      {/* Monthly Received */}
                      <td className="py-3 px-3 text-right bg-indigo-50/20 font-mono">
                        <div className="font-bold text-slate-900">
                          {data?.monthlyUnits || 0} items
                        </div>
                        <div className="text-[11px] font-black text-indigo-700">
                          ${(data?.monthlyAmount || 0).toFixed(2)}
                        </div>
                      </td>

                      {/* Yearly Received */}
                      <td className="py-3 px-3 text-right bg-amber-50/20 font-mono">
                        <div className="font-bold text-slate-900">
                          {data?.yearlyUnits || 0} items
                        </div>
                        <div className="text-[11px] font-black text-amber-700">
                          ${(data?.yearlyAmount || 0).toFixed(2)}
                        </div>
                      </td>

                      <td className="py-3 px-3 text-right font-black font-mono text-emerald-800 bg-slate-50/40">
                        ${(data?.storeTotalStockValue || 0).toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                        })}
                      </td>

                      <td className="py-3 px-2 text-center">
                        <button
                          onClick={() => setActiveDetailStore(st)}
                          className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[10px] font-bold cursor-pointer"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300 sticky bottom-0 z-10 shadow-xs">
                <tr className="divide-x divide-slate-200">
                  <td colSpan={3} className="py-3 px-3 uppercase tracking-wider text-xs">
                    Total for {filteredStores.length} Stores
                  </td>
                  <td className="py-3 px-2 text-center text-indigo-900 font-black">
                    105 Items
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-black text-emerald-900">
                    {overallTotals.dailyUnits} items • ${overallTotals.dailyAmount.toFixed(2)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-black text-indigo-900">
                    {overallTotals.monthlyUnits} items • ${overallTotals.monthlyAmount.toFixed(2)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-black text-amber-900">
                    {overallTotals.yearlyUnits} items • ${overallTotals.yearlyAmount.toFixed(2)}
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
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: STORE ITEM SPECIFICATION & DETAIL */}
      {/* ========================================================================= */}
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
                className="w-8 h-8 rounded-lg hover:bg-slate-200 text-slate-500 font-bold flex items-center justify-center cursor-pointer"
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
                        <td className="py-2 px-2.5 text-right font-mono text-slate-700">
                          ${it.cpu.toFixed(2)}
                        </td>
                        <td className="py-2 px-2.5 text-right font-mono text-slate-800">
                          {it.opening_stock}
                        </td>
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
                className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold cursor-pointer"
              >
                បិទ (Close)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: LOG STORE DELIVERY / DISPATCH */}
      {/* ========================================================================= */}
      {isDeliveryModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    កត់ត្រាការចែកទំនិញទៅហាង (Log Store Delivery)
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Kandal Commissary Kitchen • Stock Dispatched to Store
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsDeliveryModalOpen(false)}
                className="w-7 h-7 rounded-lg hover:bg-slate-100 text-slate-400 font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {deliverySuccessMsg && (
              <div className="mt-3 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
                {deliverySuccessMsg}
              </div>
            )}

            <form onSubmit={handleSaveDelivery} className="mt-4 space-y-3.5 text-xs">
              {/* Select Target Store */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  ជ្រើសរើសសាខាហាងទទួល (Target Store Outlet) *
                </label>
                <select
                  value={deliveryStoreCode}
                  onChange={(e) => {
                    setDeliveryStoreCode(e.target.value);
                    setDeliveryItemId('');
                  }}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold text-slate-900 focus:bg-white focus:outline-none cursor-pointer"
                >
                  <optgroup label="☕ Tube Coffee+ (9 ហាង)">
                    {TUBE_COFFEE_STORES.map((s) => (
                      <option key={s.code} value={s.code}>
                        {s.code} - {s.name} (69 Items)
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="🛒 OnMart (4 ហាង)">
                    {ONMART_STORES.map((s) => (
                      <option key={s.code} value={s.code}>
                        {s.code} - {s.name} (36 Items)
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              {/* Select Date */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  កាលបរិច្ឆេទចែកទំនិញ (Delivery Date) *
                </label>
                <div className="text-slate-600 bg-slate-100 px-3 py-2 rounded-xl font-bold font-mono">
                  {selectedDateStr} (ថ្ងៃទី {selectedDay})
                </div>
              </div>

              {/* Select Item */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  មុខទំនិញដែលបានចែក (Select Item) *
                </label>
                <select
                  value={deliveryItemId}
                  onChange={(e) => setDeliveryItemId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-semibold text-slate-900 focus:bg-white focus:outline-none cursor-pointer"
                >
                  <option value="">-- សូមជ្រើសរើសទំនិញ --</option>
                  {allItems
                    .filter((it) => {
                      const isTargetTube = TUBE_COFFEE_STORES.some((s) => s.code === deliveryStoreCode);
                      return isTargetTube ? it.location === 'TUBE_COFFEE' : it.location === 'ONMART';
                    })
                    .map((it) => (
                      <option key={it.id} value={it.id}>
                        [{it.code}] {it.description_khmer} (CPU: ${it.cpu.toFixed(2)} / {it.uom})
                      </option>
                    ))}
                </select>
              </div>

              {/* Quantity Delivered */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  ចំនួនដែលបានប្រគល់ជូន (Quantity Delivered) *
                </label>
                <input
                  type="number"
                  min="1"
                  placeholder="0"
                  value={deliveryQty || ''}
                  onChange={(e) => setDeliveryQty(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-mono font-bold text-slate-900 text-sm focus:bg-white focus:outline-none"
                />
              </div>

              {/* Calculated Amount */}
              {deliveryItemId && deliveryQty > 0 && (
                <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-between text-xs">
                  <span className="font-bold text-indigo-900">Total Delivery Value:</span>
                  <span className="font-mono font-black text-indigo-950 text-sm">
                    $
                    {(
                      deliveryQty *
                      (allItems.find((i) => i.id === deliveryItemId)?.cpu || 0)
                    ).toFixed(2)}
                  </span>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsDeliveryModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
                >
                  បោះបង់ (Cancel)
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-sm cursor-pointer"
                >
                  រក្សាទុកការចែក (Save Delivery)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* REFERENCE GUIDE MODAL (ឯកសារយោង & របៀបប្រើប្រាស់ផ្លូវការ) */}
      {/* ========================================================================= */}
      {isReferenceOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-xs z-10">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900">
                    📘 សៀវភៅណែនាំ &amp; REFERENCE ផ្លូវការ
                  </h3>
                  <p className="text-xs text-slate-500">
                    គោលការណ៍រក្សាទុកទិន្នន័យអចិន្ត្រៃយ៍ &amp; ការប្រើប្រាស់ព្រមគ្នាលើ Phone &amp; PC
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsReferenceOpen(false)}
                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 sm:p-6 space-y-4 text-xs sm:text-sm text-slate-700">
              {/* Section 1 */}
              <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200/80">
                <h4 className="font-bold text-emerald-900 flex items-center gap-2 text-sm">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>១. ការរក្សាទុកទិន្នន័យអចិន្ត្រៃយ៍ (Permanent Data Retention)</span>
                </h4>
                <p className="text-xs text-emerald-800/90 mt-1 leading-relaxed">
                  រាល់ពេលដែលលោកអ្នកចុចប៊ូតុង <strong>Save Store Totals</strong> ឬ <strong>Save Stock Log</strong> ទិន្នន័យនឹងត្រូវបញ្ជូនទៅរក្សាទុកជាស្ថាពរលើ Cloud Database និងកត់ត្រាទុកក្នុង Local Storage ម៉ាស៊ីន។ ប្រព័ន្ធប្រើបច្ចេកវិទ្យា <strong>Non-destructive Deep Merge</strong> ដែលធានាថាទិន្នន័យថ្ងៃចាស់ៗ និងសាខាផ្សេងៗ មិនត្រូវបានលុបបាត់ឡើយ។
                </p>
              </div>

              {/* Section 2 */}
              <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-200/80">
                <h4 className="font-bold text-indigo-900 flex items-center gap-2 text-sm">
                  <Users className="w-4 h-4 text-indigo-600" />
                  <span>២. ដំណើរការព្រមគ្នាលើ Phone &amp; PC (Concurrent Multi-Device Collaboration)</span>
                </h4>
                <p className="text-xs text-indigo-800/90 mt-1 leading-relaxed">
                  ក្រុមការងារអាចបើកដំណើរការទូរសព្ទ័ដៃ (Mobile) និងកុំព្យូទ័រ (PC) ក្នុងពេលតែមួយ។ ប្រព័ន្ធមានមុខងារ <strong>Auto-Background Polling រៀងរាល់ 15 វិនាទី</strong> និង Re-sync ស្វ័យប្រវត្តិនៅពេលត្រឡប់ចូល Screen វិញ ធ្វើឱ្យលេខដែលបញ្ចូលលើទូរសព្ទ័ នឹងបង្ហាញលើកុំព្យូទ័រដោយស្វ័យប្រវត្តិ។
                </p>
              </div>

              {/* Section 3 */}
              <div className="p-4 rounded-xl bg-purple-50/50 border border-purple-200/80">
                <h4 className="font-bold text-purple-900 flex items-center gap-2 text-sm">
                  <History className="w-4 h-4 text-purple-600" />
                  <span>៣. ការតាមដានប្រវត្តិទិន្នន័យ (Audit Trail &amp; Activity Tracking)</span>
                </h4>
                <p className="text-xs text-purple-800/90 mt-1 leading-relaxed">
                  រាល់ការ Save នីមួយៗ ត្រូវបានបង្កើតជា Audit Log កត់ត្រាទុកនូវ៖ ម៉ោង, ថ្ងៃ, ចំនួន Items, សាខា និងឧបករណ៍ដែលបាន Update (Phone 📱 ឬ PC 💻)។ លោកអ្នកអាចចូលទៅកាន់ Tab <strong>«ប្រវត្តិ &amp; តាមដាន Live Sync»</strong> លើទំព័រដើម ដើម្បីពិនិត្យមើលឡើងវិញ ឬចុចប៊ូតុង «ពិនិត្យមើល» ដើម្បីបើកមើលទិន្នន័យថ្ងៃនោះបានភ្លាមៗ។
                </p>
              </div>

              {/* Section 4 */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <h4 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
                  <span>៤. សាខាទាំង ១៣ (13 Standard Stores)</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 text-xs">
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <p className="font-bold text-amber-800">Tube Coffee+ (9 ហាង)៖</p>
                    <p className="text-slate-600 mt-0.5">KPI, TKC, CCV, CDP, CMH, KSH, CKD, 2K4, RTN</p>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <p className="font-bold text-blue-800">OnMart (4 ហាង)៖</p>
                    <p className="text-slate-600 mt-0.5">PDK, TK, OU3, DT</p>
                  </div>
                </div>
              </div>

              {/* Section 5 */}
              <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200/80">
                <h4 className="font-bold text-amber-900 flex items-center gap-2 text-sm">
                  <span>៥. លេខកូដសម្ងាត់ &amp; ការ Backup (PIN &amp; Export)</span>
                </h4>
                <p className="text-xs text-amber-800/90 mt-1 leading-relaxed">
                  • <strong>លេខកូដសម្ងាត់ផ្លូវការ៖</strong> <code className="bg-amber-100 px-1.5 py-0.5 rounded font-black text-amber-900">8899</code> (លេខចាស់ 1234 ត្រូវបាន Block ដាច់ខាត)<br />
                  • <strong>ការទាញយកទិន្នន័យ Backup៖</strong> អាចចុចប៊ូតុង «Download Backup» លើទំព័រដើម ដើម្បីរក្សាទុកឯកសារ JSON លើម៉ាស៊ីនផ្ទាល់ខ្លួនបានគ្រប់ពេលវេលា។
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                onClick={() => setIsReferenceOpen(false)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                យល់ព្រម (Close)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

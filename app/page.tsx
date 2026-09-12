"use client";

import React, { useState, useMemo, useEffect } from "react";
import { 
  Store, 
  Package, 
  TrendingUp, 
  TrendingDown,
  Award, 
  Calendar, 
  Search, 
  Coffee, 
  ShoppingBag, 
  Save, 
  CheckCircle2, 
  Clock, 
  BarChart3, 
  Boxes, 
  ArrowDownRight, 
  ArrowUpRight,
  RotateCcw,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { STARTER_ITEMS } from "@/lib/starter-items";

// =========================================================================
// 1. DATA TYPES & MODELS
// =========================================================================
export interface StoreTotalRecord {
  id: string;
  code: string;
  name: string;
  brand: "Tube Coffee" | "OnMart";
  dailyAmount: number;    // Items for Today
  monthlyAmount: number;  // Items for Current Month
  yearlyAmount: number;   // Items for Year-To-Date
}

export interface StockItemRecord {
  item_code: string;
  description_khmer: string;
  brand: "Tube Coffee" | "OnMart";
  category: string;
  uom: string;
  cpu: number;            // Cost Per Unit / Price ($) = 0
  opening_stock: number;  // = 0
  stock_in: number;       // = 0
  stock_out: number;      // = 0
}

// =========================================================================
// 2. INITIAL STORES (13 STORES WITH ALL AMOUNTS = 0)
// =========================================================================
const DEFAULT_ZERO_STORES: StoreTotalRecord[] = [
  // Tube Coffee+ (9 Stores)
  { id: "s1", code: "KPI", name: "Tube Coffee KPI", brand: "Tube Coffee", dailyAmount: 0, monthlyAmount: 0, yearlyAmount: 0 },
  { id: "s2", code: "TKC", name: "Tube Coffee TKC", brand: "Tube Coffee", dailyAmount: 0, monthlyAmount: 0, yearlyAmount: 0 },
  { id: "s3", code: "CCV", name: "Tube Coffee CCV", brand: "Tube Coffee", dailyAmount: 0, monthlyAmount: 0, yearlyAmount: 0 },
  { id: "s4", code: "CDP", name: "Tube Coffee CDP", brand: "Tube Coffee", dailyAmount: 0, monthlyAmount: 0, yearlyAmount: 0 },
  { id: "s5", code: "CYH", name: "Tube Coffee CYH", brand: "Tube Coffee", dailyAmount: 0, monthlyAmount: 0, yearlyAmount: 0 },
  { id: "s6", code: "KSH", name: "Tube Coffee KSH", brand: "Tube Coffee", dailyAmount: 0, monthlyAmount: 0, yearlyAmount: 0 },
  { id: "s7", code: "CKD", name: "Tube Coffee CKD", brand: "Tube Coffee", dailyAmount: 0, monthlyAmount: 0, yearlyAmount: 0 },
  { id: "s8", code: "2K4", name: "Tube Coffee 2K4", brand: "Tube Coffee", dailyAmount: 0, monthlyAmount: 0, yearlyAmount: 0 },
  { id: "s9", code: "ATN", name: "Tube Coffee ATN", brand: "Tube Coffee", dailyAmount: 0, monthlyAmount: 0, yearlyAmount: 0 },
  
  // OnMart (4 Stores)
  { id: "s10", code: "POK", name: "OnMart POK", brand: "OnMart", dailyAmount: 0, monthlyAmount: 0, yearlyAmount: 0 },
  { id: "s11", code: "TK",  name: "OnMart TK",  brand: "OnMart", dailyAmount: 0, monthlyAmount: 0, yearlyAmount: 0 },
  { id: "s12", code: "OU3", name: "OnMart OU3", brand: "OnMart", dailyAmount: 0, monthlyAmount: 0, yearlyAmount: 0 },
  { id: "s13", code: "DT",  name: "OnMart DT",  brand: "OnMart", dailyAmount: 0, monthlyAmount: 0, yearlyAmount: 0 },
];

// =========================================================================
// 3. INITIAL 105 STOCK ITEMS (ALL AMOUNTS & PRICES = 0)
// =========================================================================
const buildZeroStockItems = (): StockItemRecord[] => {
  const map = new Map<string, StockItemRecord>();

  STARTER_ITEMS.forEach(si => {
    const brand: "Tube Coffee" | "OnMart" = 
      (si.location?.includes("OnMart") || si.location === "ONMART") ? "OnMart" : "Tube Coffee";
    map.set(si.item_code, {
      item_code: si.item_code,
      description_khmer: si.description_khmer,
      brand,
      category: si.category || "General",
      uom: si.uom || "Pack",
      cpu: 0,           // Price = 0
      opening_stock: 0, // Opening = 0
      stock_in: 0,      // In = 0
      stock_out: 0,     // Out = 0
    });
  });

  return Array.from(map.values());
};

const DEFAULT_ZERO_STOCK_ITEMS = buildZeroStockItems();

// Helper to get today's date formatted as YYYY-MM-DD
const getTodayDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper to shift date by N days
const shiftDate = (dateStr: string, days: number) => {
  const parts = dateStr.split('-');
  if (parts.length !== 3) return getTodayDateString();
  const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
  d.setDate(d.getDate() + days);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const STORAGE_STORES_BY_DATE_KEY = "kandal_cpu_stores_by_date_v5";
const STORAGE_STOCK_BY_DATE_KEY = "kandal_cpu_stock_by_date_v5";
const STORAGE_ITEM_PRICES_KEY = "kandal_cpu_item_prices_v5";

export default function StandardInventoryDashboard() {
  const [activeTab, setActiveTab] = useState<"stores" | "stock">("stock");
  const [selectedBrand, setSelectedBrand] = useState<"ALL" | "Tube Coffee" | "OnMart">("ALL");
  const [storePeriod, setStorePeriod] = useState<"daily" | "monthly" | "yearly">("monthly");
  
  // DATE SELECTION FOR KEY IN
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString());

  // Store records organized by date
  const [storesByDate, setStoresByDate] = useState<{ [date: string]: StoreTotalRecord[] }>({});
  // Stock items organized by date
  const [stockByDate, setStockByDate] = useState<{ [date: string]: StockItemRecord[] }>({});
  // Shared Price/CPU map
  const [itemPrices, setItemPrices] = useState<{ [code: string]: number }>({});

  const [searchTerm, setSearchTerm] = useState("");
  const [notification, setNotification] = useState<string | null>(null);

  // Load saved data from localStorage on mount
  useEffect(() => {
    try {
      const savedStores = localStorage.getItem(STORAGE_STORES_BY_DATE_KEY);
      if (savedStores) {
        setStoresByDate(JSON.parse(savedStores));
      }

      const savedStock = localStorage.getItem(STORAGE_STOCK_BY_DATE_KEY);
      if (savedStock) {
        setStockByDate(JSON.parse(savedStock));
      }

      const savedPrices = localStorage.getItem(STORAGE_ITEM_PRICES_KEY);
      if (savedPrices) {
        setItemPrices(JSON.parse(savedPrices));
      }
    } catch (e) {
      console.error("Failed to load inventory data", e);
    }
  }, []);

  // Current stores for the selected date (default to 0 if none)
  const currentStores = useMemo<StoreTotalRecord[]>(() => {
    if (storesByDate[selectedDate]) {
      return storesByDate[selectedDate];
    }
    return DEFAULT_ZERO_STORES.map(s => ({ ...s }));
  }, [storesByDate, selectedDate]);

  // Current stock items for the selected date (default to 0 if none)
  const currentStockItems = useMemo<StockItemRecord[]>(() => {
    const existing = stockByDate[selectedDate];
    return DEFAULT_ZERO_STOCK_ITEMS.map(item => {
      const saved = existing?.find(e => e.item_code === item.item_code);
      const userPrice = itemPrices[item.item_code] !== undefined ? itemPrices[item.item_code] : (saved?.cpu ?? 0);
      return {
        ...item,
        cpu: userPrice,
        opening_stock: saved?.opening_stock ?? 0,
        stock_in: saved?.stock_in ?? 0,
        stock_out: saved?.stock_out ?? 0,
      };
    });
  }, [stockByDate, selectedDate, itemPrices]);

  // Show auto-dismiss notification
  const triggerNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // -------------------------------------------------------------
  // STOCK CALCULATIONS & HANDLERS
  // -------------------------------------------------------------
  const handleStockNumberChange = (
    itemCode: string, 
    field: "stock_in" | "stock_out" | "opening_stock" | "cpu", 
    val: number
  ) => {
    const cleanVal = isNaN(val) || val < 0 ? 0 : val;

    if (field === "cpu") {
      const nextPrices = { ...itemPrices, [itemCode]: cleanVal };
      setItemPrices(nextPrices);
      try {
        localStorage.setItem(STORAGE_ITEM_PRICES_KEY, JSON.stringify(nextPrices));
      } catch (e) {}
    }

    const updated = currentStockItems.map(item => 
      item.item_code === itemCode ? { ...item, [field]: cleanVal } : item
    );

    const nextStockByDate = { ...stockByDate, [selectedDate]: updated };
    setStockByDate(nextStockByDate);
    try {
      localStorage.setItem(STORAGE_STOCK_BY_DATE_KEY, JSON.stringify(nextStockByDate));
    } catch (e) {}
  };

  // Overall Stock In & Out KPI for selected date
  const stockSummary = useMemo(() => {
    let totalIn = 0;
    let totalOut = 0;
    let totalValue = 0;

    currentStockItems.forEach((i) => {
      totalIn += i.stock_in;
      totalOut += i.stock_out;
      const currentBalance = i.opening_stock + i.stock_in - i.stock_out;
      totalValue += Math.max(0, currentBalance) * i.cpu;
    });

    return { totalIn, totalOut, totalValue };
  }, [currentStockItems]);

  // TOP 5 ITEMS (Ranked by Stock Out for selected date)
  const top5Items = useMemo(() => {
    return [...currentStockItems]
      .sort((a, b) => b.stock_out - a.stock_out)
      .slice(0, 5);
  }, [currentStockItems]);

  const maxItemOut = useMemo(() => {
    return top5Items[0]?.stock_out || 1;
  }, [top5Items]);

  // -------------------------------------------------------------
  // STORE CALCULATIONS & HANDLERS
  // -------------------------------------------------------------
  const handleStoreAmountChange = (
    id: string, 
    period: "dailyAmount" | "monthlyAmount" | "yearlyAmount", 
    val: number
  ) => {
    const cleanVal = isNaN(val) || val < 0 ? 0 : val;
    const updated = currentStores.map(s => (s.id === id ? { ...s, [period]: cleanVal } : s));

    const nextStoresByDate = { ...storesByDate, [selectedDate]: updated };
    setStoresByDate(nextStoresByDate);
    try {
      localStorage.setItem(STORAGE_STORES_BY_DATE_KEY, JSON.stringify(nextStoresByDate));
    } catch (e) {}
  };

  // TOP 5 STORES (Ranked by active period amount for selected date)
  const top5Stores = useMemo(() => {
    const sortField = storePeriod === "daily" ? "dailyAmount" : storePeriod === "monthly" ? "monthlyAmount" : "yearlyAmount";
    return [...currentStores]
      .sort((a, b) => b[sortField] - a[sortField])
      .slice(0, 5);
  }, [currentStores, storePeriod]);

  const maxStoreAmount = useMemo(() => {
    const sortField = storePeriod === "daily" ? "dailyAmount" : storePeriod === "monthly" ? "monthlyAmount" : "yearlyAmount";
    return top5Stores[0]?.[sortField] || 1;
  }, [top5Stores, storePeriod]);

  const storeTotalsSum = useMemo(() => {
    return {
      daily: currentStores.reduce((acc, s) => acc + s.dailyAmount, 0),
      monthly: currentStores.reduce((acc, s) => acc + s.monthlyAmount, 0),
      yearly: currentStores.reduce((acc, s) => acc + s.yearlyAmount, 0),
    };
  }, [currentStores]);

  // Filtered lists
  const filteredStockItems = useMemo(() => {
    return currentStockItems.filter((i) => {
      const matchBrand = selectedBrand === "ALL" || i.brand === selectedBrand;
      const matchSearch = i.item_code.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          i.description_khmer.toLowerCase().includes(searchTerm.toLowerCase());
      return matchBrand && matchSearch;
    });
  }, [currentStockItems, selectedBrand, searchTerm]);

  const filteredStores = useMemo(() => {
    return currentStores.filter((s) => {
      const matchBrand = selectedBrand === "ALL" || s.brand === selectedBrand;
      const matchSearch = s.code.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          s.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchBrand && matchSearch;
    });
  }, [currentStores, selectedBrand, searchTerm]);

  // Clear all amounts and prices to 0 handler
  const handleClearAllToZero = () => {
    if (confirm("តើអ្នកពិតជាចង់កំណត់តម្លៃ និងចំនួនទាំងអស់ទៅ ០ (Clear all amounts & price = 0) មែនទេ?")) {
      setStoresByDate({});
      setStockByDate({});
      setItemPrices({});
      try {
        localStorage.removeItem(STORAGE_STORES_BY_DATE_KEY);
        localStorage.removeItem(STORAGE_STOCK_BY_DATE_KEY);
        localStorage.removeItem(STORAGE_ITEM_PRICES_KEY);
      } catch (e) {}
      triggerNotification("បានសម្អាតទិន្នន័យទាំងអស់ទៅ ០ (All Amount & Price = 0) ដោយជោគជ័យ!");
    }
  };

  return (
    <div className="w-full space-y-6">

      {/* ========================================================================= */}
      {/* TOP HEADER */}
      {/* ========================================================================= */}
      <header className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1.5">
              <Boxes className="w-3.5 h-3.5" />
              Kandal Commissary Kitchen
            </span>
            <span className="text-xs text-slate-400 font-medium">Standard Cloud System</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 mt-1.5">
            ប្រព័ន្ធតាមដានស្តុកចេញ-ចូល &amp; បរិមាណសរុបតាមសាខា (13 Stores)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            កត់ត្រាស្តុកប្រចាំថ្ងៃតាមកាលបរិច្ឆេទ និងតាមដានចំនួន items សរុបរបស់សាខា (Daily, Monthly, Yearly)
          </p>
        </div>

        {/* MAIN TABS & RESET BUTTON */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleClearAllToZero}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-all"
            title="កំណត់ទិន្នន័យទាំងអស់ទៅ 0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Clear All (0)</span>
          </button>

          <div className="flex items-center bg-slate-100 p-1.5 rounded-xl border border-slate-200">
            <button
              onClick={() => { setActiveTab("stock"); setSearchTerm(""); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === "stock"
                  ? "bg-white text-emerald-700 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Package className="w-4 h-4" />
              <span>ស្តុកចេញ-ចូល (Daily Stock)</span>
            </button>
            <button
              onClick={() => { setActiveTab("stores"); setSearchTerm(""); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === "stores"
                  ? "bg-white text-indigo-700 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Store className="w-4 h-4" />
              <span>សរុបតាមសាខា (Store Totals)</span>
            </button>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* GLOBAL DATE SELECTOR FOR KEY IN */}
      {/* ========================================================================= */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-700 flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              ជ្រើសរើសថ្ងៃកត់ត្រាទិន្នន័យ (Select Day for Key In)
            </div>
            <div className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <span>កំពុងកត់ត្រាសម្រាប់ថ្ងៃ៖</span>
              <span className="font-mono text-emerald-700 font-black bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-sm">
                {selectedDate}
              </span>
            </div>
          </div>
        </div>

        {/* Date Selector Controls */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <button
            onClick={() => setSelectedDate(prev => shiftDate(prev, -1))}
            className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all border border-slate-200"
            title="ថ្ងៃមុន"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>ថ្ងៃមុន (Prev)</span>
          </button>

          <input
            type="date"
            value={selectedDate}
            onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-800 shadow-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />

          <button
            onClick={() => setSelectedDate(getTodayDateString())}
            className="px-3 py-2 rounded-xl text-xs font-bold bg-emerald-100 hover:bg-emerald-200 text-emerald-800 transition-all border border-emerald-300"
            title="កំណត់យកថ្ងៃនេះ"
          >
            ថ្ងៃនេះ (Today)
          </button>

          <button
            onClick={() => setSelectedDate(prev => shiftDate(prev, 1))}
            className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all border border-slate-200"
            title="ថ្ងៃបន្ទាប់"
          >
            <span>ថ្ងៃបន្ទាប់ (Next)</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* NOTIFICATION TOAST */}
      {notification && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-2.5 text-sm font-medium shadow-sm animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: DAILY STOCK TRACKER (IN & OUT) + TOP 5 ITEMS */}
      {/* ========================================================================= */}
      {activeTab === "stock" && (
        <div className="space-y-6 animate-fadeIn">
          
          {/* KPI STAT CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 font-medium">ស្តុកចូលថ្ងៃនេះ (Stock In Today)</p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">+{stockSummary.totalIn.toLocaleString()} items</p>
                <span className="text-xs text-slate-400">ទំនិញទទួលចូលកណ្តាល ({selectedDate})</span>
              </div>
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                <ArrowDownRight className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 font-medium">ស្តុកចេញថ្ងៃនេះ (Stock Out Today)</p>
                <p className="text-2xl font-bold text-rose-600 mt-1">-{stockSummary.totalOut.toLocaleString()} items</p>
                <span className="text-xs text-slate-400">ចែកចាយទៅហាង ({selectedDate})</span>
              </div>
              <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center">
                <ArrowUpRight className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 font-medium">តម្លៃស្តុកបច្ចុប្បន្ន (Valuation)</p>
                <p className="text-2xl font-bold text-slate-800 mt-1">${stockSummary.totalValue.toFixed(2)}</p>
                <span className="text-xs text-emerald-600 font-medium">Live CPU Calculation</span>
              </div>
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 font-medium">ទំនិញកំពូលចេញលេខ ១</p>
                <p className="text-base font-bold text-slate-800 truncate mt-1">
                  {top5Items[0]?.stock_out > 0 ? top5Items[0].description_khmer : "គ្មានទិន្នន័យ"}
                </p>
                <span className="text-xs text-rose-600 font-semibold">
                  {top5Items[0]?.stock_out > 0 ? `${top5Items[0].stock_out.toLocaleString()} items ចេញ` : "0 items ចេញ"}
                </span>
              </div>
              <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                <Award className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* TOP 5 ITEMS MOST ORDER / MOST ISSUED */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-500" />
                  តារាងចំណាត់ថ្នាក់ TOP 5 ITEMS MOST ORDER (ទំនិញចេញច្រើនជាងគេ)
                </h2>
                <p className="text-xs text-slate-500">គិតតាមចំនួនស្តុកចេញប្រចាំថ្ងៃ (Stock Out Items សម្រាប់ {selectedDate})</p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 bg-amber-50 text-amber-800 rounded-lg border border-amber-200">
                កំពូលទាំង ៥ មុខ
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {top5Items.map((item, index) => {
                const percent = maxItemOut > 0 ? Math.round((item.stock_out / maxItemOut) * 100) : 0;

                return (
                  <div
                    key={item.item_code}
                    className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/70 flex flex-col justify-between hover:bg-slate-100/70 transition-all"
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                        index === 0 ? "bg-amber-400 text-white" :
                        index === 1 ? "bg-slate-300 text-slate-800" :
                        index === 2 ? "bg-amber-700 text-white" :
                        "bg-slate-200 text-slate-600"
                      }`}>
                        #{index + 1}
                      </span>
                      <span className="text-xs font-bold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                        {item.item_code}
                      </span>
                    </div>

                    <div className="my-1">
                      <p className="font-bold text-sm text-slate-800 line-clamp-1" title={item.description_khmer}>
                        {item.description_khmer}
                      </p>
                      <p className="text-xs text-slate-400">{item.brand} • {item.uom}</p>
                    </div>

                    <div className="mt-2 pt-2 border-t border-slate-200/60">
                      <div className="flex justify-between items-center text-xs mb-1">
                        <span className="text-slate-400">បានចេញ:</span>
                        <span className="font-bold text-rose-600">{item.stock_out.toLocaleString()} items</span>
                      </div>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div className="h-full bg-rose-500 rounded-full" style={{ width: `${percent}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* DAILY STOCK TRACKING TABLE (IN & OUT) */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h2 className="text-lg font-bold text-slate-800">
                  តារាងកត់ត្រាស្តុកប្រចាំថ្ងៃ (Daily Stock Log: In &amp; Out)
                </h2>
                <p className="text-xs text-slate-500">
                  កាលបរិច្ឆេទ៖ <span className="font-bold text-emerald-700">{selectedDate}</span> — វាយចំនួន និងតម្លៃ (Price/CPU) ដោយផ្ទាល់ ({filteredStockItems.length} មុខ)
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
                {/* Brand Selector */}
                <div className="inline-flex rounded-lg border border-slate-200 p-1 bg-slate-50 text-xs font-semibold">
                  <button
                    onClick={() => setSelectedBrand("ALL")}
                    className={`px-3 py-1.5 rounded-md transition-all ${selectedBrand === "ALL" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500"}`}
                  >
                    ទាំងអស់
                  </button>
                  <button
                    onClick={() => setSelectedBrand("Tube Coffee")}
                    className={`px-3 py-1.5 rounded-md transition-all ${selectedBrand === "Tube Coffee" ? "bg-white text-amber-700 shadow-sm" : "text-slate-500"}`}
                  >
                    Tube Coffee
                  </button>
                  <button
                    onClick={() => setSelectedBrand("OnMart")}
                    className={`px-3 py-1.5 rounded-md transition-all ${selectedBrand === "OnMart" ? "bg-white text-blue-700 shadow-sm" : "text-slate-500"}`}
                  >
                    OnMart
                  </button>
                </div>

                {/* Search Input */}
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="ស្វែងរក Code / ឈ្មោះ..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 w-44"
                  />
                </div>

                <button
                  onClick={() => {
                    triggerNotification(`បានរក្សាទុកស្តុកប្រចាំថ្ងៃ (${selectedDate}) ដោយជោគជ័យ!`);
                  }}
                  className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Stock Log</span>
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs font-bold uppercase tracking-wider">
                    <th className="p-3">Code</th>
                    <th className="p-3">ឈ្មោះទំនិញ (Khmer)</th>
                    <th className="p-3">Brand</th>
                    <th className="p-3">UOM</th>
                    <th className="p-3 text-center bg-slate-100/60 text-slate-800">តម្លៃ/CPU ($)</th>
                    <th className="p-3 text-center bg-slate-100/60 text-slate-800">ដើមគ្រា (Opening)</th>
                    <th className="p-3 text-center bg-emerald-50/50 text-emerald-800">ស្តុកចូល (Stock In)</th>
                    <th className="p-3 text-center bg-rose-50/50 text-rose-800">ស្តុកចេញ (Stock Out)</th>
                    <th className="p-3 text-right">ស្តុកសល់ (Balance)</th>
                    <th className="p-3 text-right">តម្លៃសរុប ($)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStockItems.map((item) => {
                    const balance = item.opening_stock + item.stock_in - item.stock_out;
                    const value = Math.max(0, balance) * item.cpu;

                    return (
                      <tr key={item.item_code} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3 font-bold text-slate-700 text-xs">{item.item_code}</td>
                        <td className="p-3 font-medium text-slate-800">{item.description_khmer}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                            item.brand === "Tube Coffee" ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-800"
                          }`}>
                            {item.brand}
                          </span>
                        </td>
                        <td className="p-3 text-slate-500 text-xs">{item.uom}</td>

                        {/* CPU / Price Input */}
                        <td className="p-2 text-center bg-slate-50/40">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.cpu}
                            onChange={(e) => handleStockNumberChange(item.item_code, "cpu", parseFloat(e.target.value))}
                            className="w-18 px-2 py-1 text-center font-bold text-slate-800 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none text-xs"
                          />
                        </td>

                        {/* Opening Stock Input */}
                        <td className="p-2 text-center bg-slate-50/40">
                          <input
                            type="number"
                            min="0"
                            value={item.opening_stock}
                            onChange={(e) => handleStockNumberChange(item.item_code, "opening_stock", parseInt(e.target.value))}
                            className="w-20 px-2 py-1 text-center font-bold text-slate-700 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none text-xs"
                          />
                        </td>
                        
                        {/* Stock In Input */}
                        <td className="p-2 text-center bg-emerald-50/20">
                          <input
                            type="number"
                            min="0"
                            value={item.stock_in}
                            onChange={(e) => handleStockNumberChange(item.item_code, "stock_in", parseInt(e.target.value))}
                            className="w-20 px-2 py-1 text-center font-bold text-emerald-700 border border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none text-xs"
                          />
                        </td>

                        {/* Stock Out Input */}
                        <td className="p-2 text-center bg-rose-50/20">
                          <input
                            type="number"
                            min="0"
                            value={item.stock_out}
                            onChange={(e) => handleStockNumberChange(item.item_code, "stock_out", parseInt(e.target.value))}
                            className="w-20 px-2 py-1 text-center font-bold text-rose-700 border border-rose-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none text-xs"
                          />
                        </td>

                        {/* Current Balance */}
                        <td className={`p-3 text-right font-bold text-xs ${balance < 0 ? "text-rose-600" : "text-slate-800"}`}>
                          {balance.toLocaleString()} items
                        </td>

                        {/* Valuation */}
                        <td className="p-3 text-right font-bold text-xs text-slate-700">
                          ${value.toFixed(2)}
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

      {/* ========================================================================= */}
      {/* TAB 2: STORE ONLY TOTAL AMOUNT (DAILY, MONTHLY, YEARLY) + TOP 5 STORES */}
      {/* ========================================================================= */}
      {activeTab === "stores" && (
        <div className="space-y-6 animate-fadeIn">

          {/* KPI STAT CARDS FOR STORES */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 font-medium">សរុបប្រចាំថ្ងៃ (Daily Total)</p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">{storeTotalsSum.daily.toLocaleString()} items</p>
                <span className="text-xs text-slate-400">ចែកចាយថ្ងៃ {selectedDate} (13 ហាង)</span>
              </div>
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 font-medium">សរុបប្រចាំខែ (Monthly Total)</p>
                <p className="text-2xl font-bold text-indigo-600 mt-1">{storeTotalsSum.monthly.toLocaleString()} items</p>
                <span className="text-xs text-slate-400">ខែនេះ (Current Month)</span>
              </div>
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 font-medium">សរុបប្រចាំឆ្នាំ (Yearly Total)</p>
                <p className="text-2xl font-bold text-slate-800 mt-1">{storeTotalsSum.yearly.toLocaleString()} items</p>
                <span className="text-xs text-slate-400">ឆ្នាំនេះ (Year-To-Date)</span>
              </div>
              <div className="w-12 h-12 bg-slate-100 text-slate-700 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 font-medium">សាខាលំដាប់លេខ ១ (Top 1 Store)</p>
                <p className="text-base font-bold text-slate-800 truncate mt-1">
                  {top5Stores[0] && (storePeriod === "daily" ? top5Stores[0].dailyAmount : storePeriod === "monthly" ? top5Stores[0].monthlyAmount : top5Stores[0].yearlyAmount) > 0
                    ? top5Stores[0].name 
                    : "គ្មានទិន្នន័យ"}
                </p>
                <span className="text-xs text-amber-600 font-semibold">
                  {storePeriod === "daily" ? top5Stores[0]?.dailyAmount : storePeriod === "monthly" ? top5Stores[0]?.monthlyAmount : top5Stores[0]?.yearlyAmount} items ({storePeriod})
                </span>
              </div>
              <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                <Award className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* TOP 5 STORES MOST ORDER */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-500" />
                  តារាងចំណាត់ថ្នាក់ TOP 5 STORES MOST ORDER (សាខាបញ្ជាទិញច្រើនជាងគេ)
                </h2>
                <p className="text-xs text-slate-500">គិតតាមចំនួន items សរុបដែលបានចែកចាយទៅសាខា</p>
              </div>

              {/* Period Selector for Ranking */}
              <div className="inline-flex rounded-lg border border-slate-200 p-1 bg-slate-50 text-xs font-semibold">
                <button
                  onClick={() => setStorePeriod("daily")}
                  className={`px-3 py-1.5 rounded-md transition-all ${storePeriod === "daily" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500"}`}
                >
                  Daily
                </button>
                <button
                  onClick={() => setStorePeriod("monthly")}
                  className={`px-3 py-1.5 rounded-md transition-all ${storePeriod === "monthly" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500"}`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setStorePeriod("yearly")}
                  className={`px-3 py-1.5 rounded-md transition-all ${storePeriod === "yearly" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500"}`}
                >
                  Yearly
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {top5Stores.map((store, index) => {
                const amount = storePeriod === "daily" ? store.dailyAmount : storePeriod === "monthly" ? store.monthlyAmount : store.yearlyAmount;
                const percent = maxStoreAmount > 0 ? Math.round((amount / maxStoreAmount) * 100) : 0;

                return (
                  <div
                    key={store.id}
                    className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/70 flex flex-col justify-between hover:bg-slate-100/70 transition-all"
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                        index === 0 ? "bg-amber-400 text-white" :
                        index === 1 ? "bg-slate-300 text-slate-800" :
                        index === 2 ? "bg-amber-700 text-white" :
                        "bg-slate-200 text-slate-600"
                      }`}>
                        #{index + 1}
                      </span>
                      <span className="text-xs font-bold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                        {store.code}
                      </span>
                    </div>

                    <div className="my-1">
                      <p className="font-bold text-sm text-slate-800 line-clamp-1" title={store.name}>
                        {store.name}
                      </p>
                      <p className="text-xs text-slate-400">{store.brand}</p>
                    </div>

                    <div className="mt-2 pt-2 border-t border-slate-200/60">
                      <div className="flex justify-between items-center text-xs mb-1">
                        <span className="text-slate-400 capitalize">{storePeriod}:</span>
                        <span className="font-bold text-indigo-700">{amount.toLocaleString()} items</span>
                      </div>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${store.brand === "Tube Coffee" ? "bg-amber-500" : "bg-blue-500"}`} 
                          style={{ width: `${percent}%` }} 
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* STORE TOTALS TABLE (SHOW DAILY, MONTHLY, YEARLY AMOUNTS ONLY - NO ITEMS) */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h2 className="text-lg font-bold text-slate-800">
                  តារាងបរិមាណសរុបតាមសាខា (13 Stores: Daily, Monthly, Yearly)
                </h2>
                <p className="text-xs text-slate-500">
                  កាលបរិច្ឆេទ៖ <span className="font-bold text-indigo-700">{selectedDate}</span> — បញ្ចូលចំនួន items សរុបប្រចាំថ្ងៃ និងប្រចាំខែ
                </p>
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                {/* Brand Filter */}
                <div className="inline-flex rounded-lg border border-slate-200 p-1 bg-slate-50 text-xs font-semibold">
                  <button
                    onClick={() => setSelectedBrand("ALL")}
                    className={`px-3 py-1.5 rounded-md transition-all ${selectedBrand === "ALL" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500"}`}
                  >
                    ទាំងអស់ (13)
                  </button>
                  <button
                    onClick={() => setSelectedBrand("Tube Coffee")}
                    className={`px-3 py-1.5 rounded-md transition-all ${selectedBrand === "Tube Coffee" ? "bg-white text-amber-700 shadow-sm" : "text-slate-500"}`}
                  >
                    Tube Coffee (9)
                  </button>
                  <button
                    onClick={() => setSelectedBrand("OnMart")}
                    className={`px-3 py-1.5 rounded-md transition-all ${selectedBrand === "OnMart" ? "bg-white text-blue-700 shadow-sm" : "text-slate-500"}`}
                  >
                    OnMart (4)
                  </button>
                </div>

                <button
                  onClick={() => {
                    triggerNotification(`បានរក្សាទុកបរិមាណសរុបសាខាថ្ងៃ (${selectedDate}) ដោយជោគជ័យ!`);
                  }}
                  className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Store Totals</span>
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs font-bold uppercase tracking-wider">
                    <th className="p-3">Code</th>
                    <th className="p-3">ឈ្មោះសាខា (Store Name)</th>
                    <th className="p-3">Brand</th>
                    <th className="p-3 text-center bg-emerald-50/40 text-emerald-800">
                      សរុបប្រចាំថ្ងៃ ({selectedDate})
                    </th>
                    <th className="p-3 text-center bg-indigo-50/40 text-indigo-800">សរុបប្រចាំខែ (Monthly Amount)</th>
                    <th className="p-3 text-center bg-slate-100/60 text-slate-800">សរុបប្រចាំឆ្នាំ (Yearly Amount)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStores.map((store) => (
                    <tr key={store.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 font-bold text-slate-800 text-xs">
                        <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-700 border border-slate-200">
                          {store.code}
                        </span>
                      </td>
                      <td className="p-3 font-medium text-slate-800">{store.name}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                          store.brand === "Tube Coffee" ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-800"
                        }`}>
                          {store.brand}
                        </span>
                      </td>
                      
                      {/* Daily Amount Input */}
                      <td className="p-2 text-center bg-emerald-50/20">
                        <input
                          type="number"
                          min="0"
                          value={store.dailyAmount}
                          onChange={(e) => handleStoreAmountChange(store.id, "dailyAmount", parseInt(e.target.value))}
                          className="w-24 px-2 py-1 text-center font-bold text-emerald-700 border border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none text-xs"
                        />
                      </td>

                      {/* Monthly Amount Input */}
                      <td className="p-2 text-center bg-indigo-50/20">
                        <input
                          type="number"
                          min="0"
                          value={store.monthlyAmount}
                          onChange={(e) => handleStoreAmountChange(store.id, "monthlyAmount", parseInt(e.target.value))}
                          className="w-24 px-2 py-1 text-center font-bold text-indigo-700 border border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-xs"
                        />
                      </td>

                      {/* Yearly Amount Input */}
                      <td className="p-2 text-center bg-slate-50/40">
                        <input
                          type="number"
                          min="0"
                          value={store.yearlyAmount}
                          onChange={(e) => handleStoreAmountChange(store.id, "yearlyAmount", parseInt(e.target.value))}
                          className="w-28 px-2 py-1 text-center font-bold text-slate-700 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-xs"
                        />
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
  );
}

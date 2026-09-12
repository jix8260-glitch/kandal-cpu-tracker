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
  ArrowUpRight 
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
  dailyAmount: number;    // Units or $ for Today
  monthlyAmount: number;  // Units or $ for Current Month
  yearlyAmount: number;   // Units or $ for Year-To-Date
}

export interface StockItemRecord {
  item_code: string;
  description_khmer: string;
  brand: "Tube Coffee" | "OnMart";
  category: string;
  uom: string;
  cpu: number;
  opening_stock: number;
  stock_in: number;
  stock_out: number;
}

// =========================================================================
// 2. INITIAL STORES (13 STORES WITH DAILY, MONTHLY, YEARLY TOTALS ONLY)
// =========================================================================
const INITIAL_STORES: StoreTotalRecord[] = [
  // Tube Coffee+ (9 Stores)
  { id: "s1", code: "KPI", name: "Tube Coffee KPI", brand: "Tube Coffee", dailyAmount: 120, monthlyAmount: 3450, yearlyAmount: 38200 },
  { id: "s2", code: "TKC", name: "Tube Coffee TKC", brand: "Tube Coffee", dailyAmount: 110, monthlyAmount: 3120, yearlyAmount: 35100 },
  { id: "s3", code: "CCV", name: "Tube Coffee CCV", brand: "Tube Coffee", dailyAmount: 95,  monthlyAmount: 2840, yearlyAmount: 31800 },
  { id: "s4", code: "CDP", name: "Tube Coffee CDP", brand: "Tube Coffee", dailyAmount: 85,  monthlyAmount: 2490, yearlyAmount: 28400 },
  { id: "s5", code: "CYH", name: "Tube Coffee CYH", brand: "Tube Coffee", dailyAmount: 80,  monthlyAmount: 2280, yearlyAmount: 26100 },
  { id: "s6", code: "KSH", name: "Tube Coffee KSH", brand: "Tube Coffee", dailyAmount: 75,  monthlyAmount: 2150, yearlyAmount: 24700 },
  { id: "s7", code: "CKD", name: "Tube Coffee CKD", brand: "Tube Coffee", dailyAmount: 70,  monthlyAmount: 2040, yearlyAmount: 23200 },
  { id: "s8", code: "2K4", name: "Tube Coffee 2K4", brand: "Tube Coffee", dailyAmount: 60,  monthlyAmount: 1820, yearlyAmount: 20900 },
  { id: "s9", code: "ATN", name: "Tube Coffee ATN", brand: "Tube Coffee", dailyAmount: 55,  monthlyAmount: 1650, yearlyAmount: 18900 },
  
  // OnMart (4 Stores)
  { id: "s10", code: "POK", name: "OnMart POK", brand: "OnMart", dailyAmount: 90, monthlyAmount: 2650, yearlyAmount: 29800 },
  { id: "s11", code: "TK",  name: "OnMart TK",  brand: "OnMart", dailyAmount: 80, monthlyAmount: 2340, yearlyAmount: 26400 },
  { id: "s12", code: "OU3", name: "OnMart OU3", brand: "OnMart", dailyAmount: 65, monthlyAmount: 1910, yearlyAmount: 21500 },
  { id: "s13", code: "DT",  name: "OnMart DT",  brand: "OnMart", dailyAmount: 50, monthlyAmount: 1520, yearlyAmount: 17200 },
];

// =========================================================================
// 3. INITIAL CORE ITEMS & MERGE WITH ALL 105 ITEMS FROM EXCEL
// =========================================================================
const CORE_SAMPLE_ITEMS: StockItemRecord[] = [
  // Tube Coffee
  { item_code: "SM017", description_khmer: "សាច់ជ្រូកអាំង (50g)", brand: "Tube Coffee", category: "Semi Product Meat", uom: "Pack", cpu: 0.85, opening_stock: 450, stock_in: 500, stock_out: 420 },
  { item_code: "D0011", description_khmer: "ពងមាន់ (1pcs)", brand: "Tube Coffee", category: "Dry Store", uom: "PCS", cpu: 0.12, opening_stock: 800, stock_in: 1000, stock_out: 320 },
  { item_code: "SM010", description_khmer: "សាច់ គោ (50g)", brand: "Tube Coffee", category: "Semi Product Meat", uom: "Pack", cpu: 1.10, opening_stock: 300, stock_in: 250, stock_out: 180 },
  { item_code: "SM027", description_khmer: "សាច់ ភ្លៅមាន់ (200g)", brand: "Tube Coffee", category: "Semi Product Meat", uom: "Pack", cpu: 0.95, opening_stock: 220, stock_in: 200, stock_out: 150 },
  { item_code: "SM013", description_khmer: "សាច់ ឡុកឡាក់ (80g)", brand: "Tube Coffee", category: "Semi Product Meat", uom: "Pack", cpu: 1.30, opening_stock: 180, stock_in: 150, stock_out: 110 },
  { item_code: "V0001", description_khmer: "ស្លឹកខ្ទឹម (300g)", brand: "Tube Coffee", category: "Daily Product", uom: "Pack", cpu: 0.70, opening_stock: 45, stock_in: 60, stock_out: 55 },
  { item_code: "S0046", description_khmer: "លត (1000g)", brand: "Tube Coffee", category: "Daily Product", uom: "Pack", cpu: 0.75, opening_stock: 80, stock_in: 100, stock_out: 90 },
  { item_code: "S0001", description_khmer: "ទឹកផ្សំ បាយមាន់គ្រឿង (300g)", brand: "Tube Coffee", category: "Semi Product Sauce", uom: "Pack", cpu: 0.60, opening_stock: 60, stock_in: 50, stock_out: 45 },
  { item_code: "D0081", description_khmer: "មីជាតិ(សាច់ជ្រូកជញ្ជ្រាំ) (24pack)", brand: "Tube Coffee", category: "Dry Store", uom: "CTN", cpu: 4.80, opening_stock: 35, stock_in: 20, stock_out: 18 },
  { item_code: "V0005", description_khmer: "ត្រកួនចិន (500g)", brand: "Tube Coffee", category: "Daily Product", uom: "Pack", cpu: 0.40, opening_stock: 50, stock_in: 70, stock_out: 65 },

  // OnMart
  { item_code: "10130122", description_khmer: "ប៉ាស្តាសាច់ក្រក (180g)", brand: "OnMart", category: "FINISHED PRODUCT", uom: "Pack", cpu: 1.50, opening_stock: 60, stock_in: 80, stock_out: 44 },
  { item_code: "10160147", description_khmer: "ប្រហិតបង្កង (5stick)", brand: "OnMart", category: "Semi Product Sauce", uom: "Pack", cpu: 1.20, opening_stock: 90, stock_in: 120, stock_out: 70 },
  { item_code: "10150139", description_khmer: "ស្ពៃក្តោប (500g)", brand: "OnMart", category: "Dry Store", uom: "Pack", cpu: 0.60, opening_stock: 120, stock_in: 150, stock_out: 95 },
  { item_code: "10160145", description_khmer: "ប្រហិតកាំប្រម៉ា (5stick)", brand: "OnMart", category: "Semi Product Sauce", uom: "Pack", cpu: 1.10, opening_stock: 80, stock_in: 100, stock_out: 60 },
  { item_code: "10130125", description_khmer: "បាយឆាសាច់់មាន់ខ្ទឹម (160g)", brand: "OnMart", category: "FINISHED PRODUCT", uom: "Pack", cpu: 1.40, opening_stock: 50, stock_in: 70, stock_out: 35 }
];

// Build full 105 items catalog with the user's core items given priority
const buildFullStockItems = (): StockItemRecord[] => {
  const map = new Map<string, StockItemRecord>();
  CORE_SAMPLE_ITEMS.forEach(item => map.set(item.item_code, item));

  STARTER_ITEMS.forEach(si => {
    if (!map.has(si.item_code)) {
      const brand: "Tube Coffee" | "OnMart" = 
        (si.location?.includes("OnMart") || si.location === "ONMART") ? "OnMart" : "Tube Coffee";
      map.set(si.item_code, {
        item_code: si.item_code,
        description_khmer: si.description_khmer,
        brand,
        category: si.category || "General",
        uom: si.uom || "Pack",
        cpu: si.cpu || 0.5,
        opening_stock: si.opening_stock || 0,
        stock_in: 0,
        stock_out: 0,
      });
    }
  });

  return Array.from(map.values());
};

const INITIAL_STOCK_ITEMS = buildFullStockItems();

const STORAGE_STORES_KEY = "kandal_cpu_standard_stores_v4";
const STORAGE_STOCK_KEY = "kandal_cpu_standard_stock_v4";

export default function StandardInventoryDashboard() {
  const [activeTab, setActiveTab] = useState<"stores" | "stock">("stock");
  const [selectedBrand, setSelectedBrand] = useState<"ALL" | "Tube Coffee" | "OnMart">("ALL");
  const [storePeriod, setStorePeriod] = useState<"daily" | "monthly" | "yearly">("monthly");
  
  const [stores, setStores] = useState<StoreTotalRecord[]>(INITIAL_STORES);
  const [stockItems, setStockItems] = useState<StockItemRecord[]>(INITIAL_STOCK_ITEMS);
  const [searchTerm, setSearchTerm] = useState("");
  const [notification, setNotification] = useState<string | null>(null);

  // Load saved data from localStorage on mount
  useEffect(() => {
    try {
      const savedStores = localStorage.getItem(STORAGE_STORES_KEY);
      if (savedStores) {
        const parsed = JSON.parse(savedStores);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setStores(parsed);
        }
      }

      const savedStock = localStorage.getItem(STORAGE_STOCK_KEY);
      if (savedStock) {
        const parsed = JSON.parse(savedStock);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Merge to retain any newly added 105 items
          const savedMap = new Map<string, StockItemRecord>(parsed.map((p: StockItemRecord) => [p.item_code, p]));
          setStockItems(prev => prev.map(item => savedMap.get(item.item_code) || item));
        }
      }
    } catch (e) {
      console.error("Failed to load stored inventory", e);
    }
  }, []);

  // Show auto-dismiss notification
  const triggerNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // -------------------------------------------------------------
  // STOCK CALCULATIONS & HANDLERS
  // -------------------------------------------------------------
  const handleStockChange = (itemCode: string, field: "stock_in" | "stock_out", val: number) => {
    const cleanVal = isNaN(val) || val < 0 ? 0 : val;
    setStockItems((prev) => {
      const next = prev.map((item) => (item.item_code === itemCode ? { ...item, [field]: cleanVal } : item));
      try {
        localStorage.setItem(STORAGE_STOCK_KEY, JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  // Overall Stock In & Out KPI
  const stockSummary = useMemo(() => {
    let totalIn = 0;
    let totalOut = 0;
    let totalValue = 0;

    stockItems.forEach((i) => {
      totalIn += i.stock_in;
      totalOut += i.stock_out;
      const currentBalance = i.opening_stock + i.stock_in - i.stock_out;
      totalValue += Math.max(0, currentBalance) * i.cpu;
    });

    return { totalIn, totalOut, totalValue };
  }, [stockItems]);

  // TOP 5 ITEMS (Ranked by Stock Out Daily/Total)
  const top5Items = useMemo(() => {
    return [...stockItems]
      .sort((a, b) => b.stock_out - a.stock_out)
      .slice(0, 5);
  }, [stockItems]);

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
    setStores((prev) => {
      const next = prev.map((s) => (s.id === id ? { ...s, [period]: cleanVal } : s));
      try {
        localStorage.setItem(STORAGE_STORES_KEY, JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  // TOP 5 STORES (Ranked by active period amount)
  const top5Stores = useMemo(() => {
    const sortField = storePeriod === "daily" ? "dailyAmount" : storePeriod === "monthly" ? "monthlyAmount" : "yearlyAmount";
    return [...stores]
      .sort((a, b) => b[sortField] - a[sortField])
      .slice(0, 5);
  }, [stores, storePeriod]);

  const maxStoreAmount = useMemo(() => {
    const sortField = storePeriod === "daily" ? "dailyAmount" : storePeriod === "monthly" ? "monthlyAmount" : "yearlyAmount";
    return top5Stores[0]?.[sortField] || 1;
  }, [top5Stores, storePeriod]);

  const storeTotalsSum = useMemo(() => {
    return {
      daily: stores.reduce((acc, s) => acc + s.dailyAmount, 0),
      monthly: stores.reduce((acc, s) => acc + s.monthlyAmount, 0),
      yearly: stores.reduce((acc, s) => acc + s.yearlyAmount, 0),
    };
  }, [stores]);

  // Filtered lists
  const filteredStockItems = useMemo(() => {
    return stockItems.filter((i) => {
      const matchBrand = selectedBrand === "ALL" || i.brand === selectedBrand;
      const matchSearch = i.item_code.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          i.description_khmer.toLowerCase().includes(searchTerm.toLowerCase());
      return matchBrand && matchSearch;
    });
  }, [stockItems, selectedBrand, searchTerm]);

  const filteredStores = useMemo(() => {
    return stores.filter((s) => {
      const matchBrand = selectedBrand === "ALL" || s.brand === selectedBrand;
      const matchSearch = s.code.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          s.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchBrand && matchSearch;
    });
  }, [stores, selectedBrand, searchTerm]);

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
            ផ្តោតលើការកត់ត្រាស្តុកប្រចាំថ្ងៃ និងតាមដានចំនួនសរុបរបស់សាខា (Daily, Monthly, Yearly)
          </p>
        </div>

        {/* MAIN TABS */}
        <div className="flex items-center bg-slate-100 p-1.5 rounded-xl border border-slate-200">
          <button
            onClick={() => { setActiveTab("stock"); setSearchTerm(""); }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
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
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === "stores"
                ? "bg-white text-indigo-700 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Store className="w-4 h-4" />
            <span>សរុបតាមសាខា (Store Totals)</span>
          </button>
        </div>
      </header>

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
                <p className="text-2xl font-bold text-emerald-600 mt-1">+{stockSummary.totalIn.toLocaleString()} units</p>
                <span className="text-xs text-slate-400">ទំនិញទទួលចូលកណ្តាល</span>
              </div>
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                <ArrowDownRight className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 font-medium">ស្តុកចេញថ្ងៃនេះ (Stock Out Today)</p>
                <p className="text-2xl font-bold text-rose-600 mt-1">-{stockSummary.totalOut.toLocaleString()} units</p>
                <span className="text-xs text-slate-400">ចែកចាយទៅហាង</span>
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
                <p className="text-xs text-slate-500 font-medium">ទំនិញកំពូលលក់ដាច់លេខ ១</p>
                <p className="text-base font-bold text-slate-800 truncate mt-1">{top5Items[0]?.description_khmer || "N/A"}</p>
                <span className="text-xs text-rose-600 font-semibold">{top5Items[0]?.stock_out.toLocaleString()} units ចេញ</span>
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
                <p className="text-xs text-slate-500">គិតតាមចំនួនស្តុកចេញប្រចាំថ្ងៃ (Stock Out Units)</p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 bg-amber-50 text-amber-800 rounded-lg border border-amber-200">
                កំពូលទាំង ៥ មុខ
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {top5Items.map((item, index) => {
                const percent = Math.round((item.stock_out / maxItemOut) * 100);

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
                        <span className="font-bold text-rose-600">{item.stock_out.toLocaleString()}</span>
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
                  វាយចំនួនចូល (Stock In) និងចេញ (Stock Out) — ប្រព័ន្ធគណនាស្តុកសល់ និងតម្លៃដោយស្វ័យប្រវត្តិ ({filteredStockItems.length} មុខ)
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
                    try {
                      localStorage.setItem(STORAGE_STOCK_KEY, JSON.stringify(stockItems));
                    } catch (e) {}
                    triggerNotification("បានរក្សាទុកទិន្នន័យស្តុកប្រចាំថ្ងៃដោយជោគជ័យ! (Saved Online)");
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
                    <th className="p-3 text-right">ដើមគ្រា (Opening)</th>
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
                        <td className="p-3 text-right font-semibold text-slate-600">{item.opening_stock}</td>
                        
                        {/* Stock In Input */}
                        <td className="p-2 text-center bg-emerald-50/20">
                          <input
                            type="number"
                            min="0"
                            value={item.stock_in}
                            onChange={(e) => handleStockChange(item.item_code, "stock_in", parseInt(e.target.value))}
                            className="w-20 px-2 py-1 text-center font-bold text-emerald-700 border border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none text-xs"
                          />
                        </td>

                        {/* Stock Out Input */}
                        <td className="p-2 text-center bg-rose-50/20">
                          <input
                            type="number"
                            min="0"
                            value={item.stock_out}
                            onChange={(e) => handleStockChange(item.item_code, "stock_out", parseInt(e.target.value))}
                            className="w-20 px-2 py-1 text-center font-bold text-rose-700 border border-rose-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none text-xs"
                          />
                        </td>

                        {/* Current Balance */}
                        <td className={`p-3 text-right font-bold text-xs ${balance < 20 ? "text-amber-600" : "text-slate-800"}`}>
                          {balance.toLocaleString()}
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
                <p className="text-2xl font-bold text-emerald-600 mt-1">{storeTotalsSum.daily.toLocaleString()} units</p>
                <span className="text-xs text-slate-400">ចែកចាយថ្ងៃនេះ (13 ហាង)</span>
              </div>
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 font-medium">សរុបប្រចាំខែ (Monthly Total)</p>
                <p className="text-2xl font-bold text-indigo-600 mt-1">{storeTotalsSum.monthly.toLocaleString()} units</p>
                <span className="text-xs text-slate-400">ខែនេះ (Current Month)</span>
              </div>
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 font-medium">សរុបប្រចាំឆ្នាំ (Yearly Total)</p>
                <p className="text-2xl font-bold text-slate-800 mt-1">{storeTotalsSum.yearly.toLocaleString()} units</p>
                <span className="text-xs text-slate-400">ឆ្នាំនេះ (Year-To-Date)</span>
              </div>
              <div className="w-12 h-12 bg-slate-100 text-slate-700 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 font-medium">សាខាលំដាប់លេខ ១ (Top 1 Store)</p>
                <p className="text-base font-bold text-slate-800 truncate mt-1">{top5Stores[0]?.name || "N/A"}</p>
                <span className="text-xs text-amber-600 font-semibold">
                  {storePeriod === "daily" ? top5Stores[0]?.dailyAmount : storePeriod === "monthly" ? top5Stores[0]?.monthlyAmount : top5Stores[0]?.yearlyAmount} units ({storePeriod})
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
                <p className="text-xs text-slate-500">គិតតាមចំនួនសរុបដែលបានចែកចាយទៅសាខា</p>
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
                const percent = Math.round((amount / maxStoreAmount) * 100);

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
                        <span className="font-bold text-indigo-700">{amount.toLocaleString()} units</span>
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
                  បង្ហាញតែបរិមាណសរុបប៉ុណ្ណោះ — មិនបាច់វាយទំនិញរាយមុខចូលទេ
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
                    try {
                      localStorage.setItem(STORAGE_STORES_KEY, JSON.stringify(stores));
                    } catch (e) {}
                    triggerNotification("បានរក្សាទុកបរិមាណសរុបសាខាដោយជោគជ័យ! (Saved Online)");
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
                    <th className="p-3 text-center bg-emerald-50/40 text-emerald-800">សរុបប្រចាំថ្ងៃ (Daily Amount)</th>
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

                      {/* Yearly Amount Display */}
                      <td className="p-3 text-center font-bold text-slate-700 text-xs bg-slate-50/30">
                        {store.yearlyAmount.toLocaleString()} units
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

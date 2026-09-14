"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
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
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Cloud,
  CloudOff,
  History,
  FileText,
  Download,
  Copy,
  ExternalLink,
  ShieldCheck,
  Users,
  Smartphone,
  Laptop,
  X,
  Eye
} from "lucide-react";
import { STARTER_ITEMS } from "@/lib/starter-items";
import { AuditLogEntry } from "@/lib/types";

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
  { id: "s1", code: "KPI", name: "Tube Coffee+ KPI", brand: "Tube Coffee", dailyAmount: 0, monthlyAmount: 0, yearlyAmount: 0 },
  { id: "s2", code: "TKC", name: "Tube Coffee+ TKC", brand: "Tube Coffee", dailyAmount: 0, monthlyAmount: 0, yearlyAmount: 0 },
  { id: "s3", code: "CCV", name: "Tube Coffee+ CCV", brand: "Tube Coffee", dailyAmount: 0, monthlyAmount: 0, yearlyAmount: 0 },
  { id: "s4", code: "CDP", name: "Tube Coffee+ CDP", brand: "Tube Coffee", dailyAmount: 0, monthlyAmount: 0, yearlyAmount: 0 },
  { id: "s5", code: "CMH", name: "Tube Coffee+ CMH", brand: "Tube Coffee", dailyAmount: 0, monthlyAmount: 0, yearlyAmount: 0 },
  { id: "s6", code: "KSH", name: "Tube Coffee+ KSH", brand: "Tube Coffee", dailyAmount: 0, monthlyAmount: 0, yearlyAmount: 0 },
  { id: "s7", code: "CKD", name: "Tube Coffee+ CKD", brand: "Tube Coffee", dailyAmount: 0, monthlyAmount: 0, yearlyAmount: 0 },
  { id: "s8", code: "2K4", name: "Tube Coffee+ 2K4", brand: "Tube Coffee", dailyAmount: 0, monthlyAmount: 0, yearlyAmount: 0 },
  { id: "s9", code: "RTN", name: "Tube Coffee+ RTN", brand: "Tube Coffee", dailyAmount: 0, monthlyAmount: 0, yearlyAmount: 0 },
  
  // OnMart (4 Stores)
  { id: "s10", code: "PDK", name: "OnMart PDK", brand: "OnMart", dailyAmount: 0, monthlyAmount: 0, yearlyAmount: 0 },
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
  const [activeTab, setActiveTab] = useState<"stores" | "stock" | "history">("stock");
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

  // Audit Logs & Tracking History
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [historySearchTerm, setHistorySearchTerm] = useState("");
  const [isReferenceOpen, setIsReferenceOpen] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [notification, setNotification] = useState<string | null>(null);

  // Cloud Sync state
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "synced" | "error">("idle");
  const [lastSyncedTime, setLastSyncedTime] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

  // Function to pull latest data from cloud API
  const fetchFromCloud = async (showToast = false) => {
    try {
      setSyncStatus("syncing");
      const res = await fetch("/api/sync", { cache: "no-store" });
      if (!res.ok) throw new Error("Sync failed");
      const cloudData = await res.json();

      if (cloudData) {
        if (cloudData.storesByDate && Object.keys(cloudData.storesByDate).length > 0) {
          setStoresByDate(prev => {
            const merged = { ...prev, ...cloudData.storesByDate };
            try { localStorage.setItem(STORAGE_STORES_BY_DATE_KEY, JSON.stringify(merged)); } catch(e){}
            return merged;
          });
        }
        if (cloudData.stockByDate && Object.keys(cloudData.stockByDate).length > 0) {
          setStockByDate(prev => {
            const merged = { ...prev, ...cloudData.stockByDate };
            try { localStorage.setItem(STORAGE_STOCK_BY_DATE_KEY, JSON.stringify(merged)); } catch(e){}
            return merged;
          });
        }
        if (cloudData.itemPrices && Object.keys(cloudData.itemPrices).length > 0) {
          setItemPrices(prev => {
            const merged = { ...prev, ...cloudData.itemPrices };
            try { localStorage.setItem(STORAGE_ITEM_PRICES_KEY, JSON.stringify(merged)); } catch(e){}
            return merged;
          });
        }
        if (Array.isArray(cloudData.auditLogs)) {
          setAuditLogs(cloudData.auditLogs);
        }
        setSyncStatus("synced");
        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setLastSyncedTime(timeStr);
        if (showToast) {
          triggerNotification(`✅ ទាញទិន្នន័យពី Cloud ជោគជ័យ! (${timeStr})`);
        }
      }
    } catch (err) {
      console.error("Fetch from cloud error:", err);
      setSyncStatus("error");
      if (showToast) {
        triggerNotification(`⚠️ មិនអាចភ្ជាប់ Cloud (កំពុងប្រើ Offline Local)`);
      }
    }
  };

  // Function to push data to cloud API with action metadata
  const saveToCloud = async (
    targetStoresByDate: typeof storesByDate,
    targetStockByDate: typeof stockByDate,
    targetItemPrices: typeof itemPrices,
    actionMeta?: { actionType: 'STORE_TOTALS' | 'STOCK_LOG'; targetDate: string }
  ) => {
    setIsSaving(true);
    setSyncStatus("syncing");
    try {
      // Always persist locally
      try {
        localStorage.setItem(STORAGE_STORES_BY_DATE_KEY, JSON.stringify(targetStoresByDate));
        localStorage.setItem(STORAGE_STOCK_BY_DATE_KEY, JSON.stringify(targetStockByDate));
        localStorage.setItem(STORAGE_ITEM_PRICES_KEY, JSON.stringify(targetItemPrices));
      } catch (e) {}

      const res = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storesByDate: targetStoresByDate,
          stockByDate: targetStockByDate,
          itemPrices: targetItemPrices,
          actionMeta,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.data?.auditLogs) {
          setAuditLogs(json.data.auditLogs);
        }
        if (json.data?.storesByDate) {
          setStoresByDate(json.data.storesByDate);
        }
        if (json.data?.stockByDate) {
          setStockByDate(json.data.stockByDate);
        }
        setSyncStatus("synced");
        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setLastSyncedTime(timeStr);
        setIsSaving(false);
        return true;
      } else {
        setSyncStatus("error");
        setIsSaving(false);
        return false;
      }
    } catch (err) {
      console.error("Save to cloud error:", err);
      setSyncStatus("error");
      setIsSaving(false);
      return false;
    }
  };

  // Load saved data on mount, then pull from cloud
  useEffect(() => {
    try {
      const savedStores = localStorage.getItem(STORAGE_STORES_BY_DATE_KEY);
      if (savedStores) setStoresByDate(JSON.parse(savedStores));

      const savedStock = localStorage.getItem(STORAGE_STOCK_BY_DATE_KEY);
      if (savedStock) setStockByDate(JSON.parse(savedStock));

      const savedPrices = localStorage.getItem(STORAGE_ITEM_PRICES_KEY);
      if (savedPrices) setItemPrices(JSON.parse(savedPrices));
    } catch (e) {
      console.error("Failed to load inventory data", e);
    }

    // Pull latest data from cloud
    fetchFromCloud();

    // Re-sync when switching back to this tab (especially on phone)
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchFromCloud();
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    // Auto background poll every 15 seconds for real-time concurrent multi-device sync
    const pollInterval = setInterval(() => {
      if (document.visibilityState === "visible") {
        fetchFromCloud(false);
      }
    }, 15000);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      clearInterval(pollInterval);
    };
  }, []);

  // Current stores for the selected date (default to 0 if none)
  const currentStores = useMemo<StoreTotalRecord[]>(() => {
    const existing = storesByDate[selectedDate];
    return DEFAULT_ZERO_STORES.map(base => {
      const match = existing?.find(s => 
        s.code === base.code ||
        (base.code === "CMH" && (s.code === "CYH" || s.code === "CMH")) ||
        (base.code === "RTN" && (s.code === "ATN" || s.code === "RTN")) ||
        (base.code === "PDK" && (s.code === "POK" || s.code === "PDK")) ||
        s.id === base.id
      );
      return {
        ...base,
        dailyAmount: match?.dailyAmount ?? 0,
        monthlyAmount: match?.monthlyAmount ?? 0,
        yearlyAmount: match?.yearlyAmount ?? 0,
      };
    });
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
    setTimeout(() => setNotification(null), 3500);
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

    let nextPrices = itemPrices;
    if (field === "cpu") {
      nextPrices = { ...itemPrices, [itemCode]: cleanVal };
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

  const handleSaveStockLog = async () => {
    triggerNotification(`កំពុងរក្សាទុកស្តុក (${selectedDate}) ទៅ Cloud & Phone...`);
    const success = await saveToCloud(storesByDate, stockByDate, itemPrices, {
      actionType: 'STOCK_LOG',
      targetDate: selectedDate,
    });
    if (success) {
      triggerNotification(`✅ បានរក្សាទុកស្តុក (${selectedDate}) ទៅ Cloud & History រួចរាល់! អាចមើលឃើញលើទូរសព្ទ័ភ្លាមៗ`);
    } else {
      triggerNotification(`✅ បានរក្សាទុកក្នុងទូរសព្ទ័/កុំព្យូទ័រ (Local)`);
    }
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

  const handleSaveStoreTotals = async () => {
    triggerNotification(`កំពុងរក្សាទុកបរិមាណសរុបសាខា (${selectedDate}) ទៅ Cloud & Phone...`);
    const success = await saveToCloud(storesByDate, stockByDate, itemPrices, {
      actionType: 'STORE_TOTALS',
      targetDate: selectedDate,
    });
    if (success) {
      triggerNotification(`✅ បានរក្សាទុកបរិមាណសរុបសាខា (${selectedDate}) ទៅ Cloud & History រួចរាល់! អាចមើលឃើញលើទូរសព្ទ័ភ្លាមៗ`);
    } else {
      triggerNotification(`✅ បានរក្សាទុកក្នុងទូរសព្ទ័/កុំព្យូទ័រ (Local)`);
    }
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

  // Filtered Audit Logs for History Tab
  const filteredAuditLogs = useMemo(() => {
    if (!historySearchTerm.trim()) return auditLogs;
    const q = historySearchTerm.toLowerCase();
    return auditLogs.filter(log => 
      log.targetDate?.toLowerCase().includes(q) ||
      log.titleKhmer?.toLowerCase().includes(q) ||
      log.detailsKhmer?.toLowerCase().includes(q) ||
      log.device?.toLowerCase().includes(q) ||
      log.actionType?.toLowerCase().includes(q)
    );
  }, [auditLogs, historySearchTerm]);

  // List of all dates recorded in the cloud/local storage
  const savedDatesList = useMemo(() => {
    const datesSet = new Set<string>();
    Object.keys(storesByDate).forEach(d => datesSet.add(d));
    Object.keys(stockByDate).forEach(d => datesSet.add(d));
    auditLogs.forEach(l => { if (l.targetDate && l.targetDate !== 'Unknown Date') datesSet.add(l.targetDate); });
    return Array.from(datesSet).sort().reverse();
  }, [storesByDate, stockByDate, auditLogs]);

  // Copy full backup JSON to clipboard
  const handleCopyBackup = () => {
    try {
      const backup = {
        storesByDate,
        stockByDate,
        itemPrices,
        auditLogs,
        exportedAt: new Date().toISOString()
      };
      navigator.clipboard.writeText(JSON.stringify(backup, null, 2));
      triggerNotification("✅ បានចម្លងទិន្នន័យ Backup ទាំងអស់ទៅក្នុង Clipboard រួចរាល់!");
    } catch (e) {
      triggerNotification("⚠️ មិនអាចចម្លងទិន្នន័យបានទេ");
    }
  };

  // Download full backup JSON
  const handleDownloadBackup = () => {
    try {
      const backup = {
        storesByDate,
        stockByDate,
        itemPrices,
        auditLogs,
        exportedAt: new Date().toISOString()
      };
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `kandal_stock_backup_${selectedDate}.json`;
      a.click();
      URL.revokeObjectURL(url);
      triggerNotification("✅ បានទាញយកឯកសារ JSON Backup រួចរាល់!");
    } catch (e) {
      triggerNotification("⚠️ មិនអាចទាញយកឯកសារបានទេ");
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

        {/* MAIN TABS, CLOUD SYNC & NAVIGATION */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Cloud Sync Status Badge & Manual Trigger */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs">
            {syncStatus === "syncing" && (
              <span className="flex items-center gap-1.5 text-amber-700 font-bold">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-600" />
                <span>Syncing Cloud...</span>
              </span>
            )}
            {syncStatus === "synced" && (
              <span className="flex items-center gap-1.5 text-emerald-700 font-bold" title={`Last synced: ${lastSyncedTime}`}>
                <Cloud className="w-3.5 h-3.5 text-emerald-600" />
                <span>Cloud Synced {lastSyncedTime ? `(${lastSyncedTime})` : ''}</span>
              </span>
            )}
            {syncStatus === "error" && (
              <span className="flex items-center gap-1.5 text-rose-700 font-bold">
                <CloudOff className="w-3.5 h-3.5 text-rose-500" />
                <span>Cloud Offline</span>
              </span>
            )}
            {syncStatus === "idle" && (
              <span className="flex items-center gap-1.5 text-slate-500 font-medium">
                <Cloud className="w-3.5 h-3.5 text-slate-400" />
                <span>Cloud Ready</span>
              </span>
            )}

            <button
              onClick={() => fetchFromCloud(true)}
              disabled={syncStatus === "syncing"}
              className="flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-200 text-xs font-bold transition-all shadow-xs active:scale-95 disabled:opacity-50"
              title="ទាញទិន្នន័យចុងក្រោយពី Cloud (Pull from Cloud)"
            >
              <RefreshCw className={`w-3 h-3 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
              <span>Sync Cloud 🔄</span>
            </button>
          </div>

          <div className="flex items-center bg-slate-100 p-1.5 rounded-xl border border-slate-200 gap-1">
            <button
              onClick={() => { setActiveTab("stock"); setSearchTerm(""); }}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
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
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                activeTab === "stores"
                  ? "bg-white text-indigo-700 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Store className="w-4 h-4" />
              <span>សរុបតាមសាខា (Store Totals)</span>
            </button>
            <button
              onClick={() => { setActiveTab("history"); setSearchTerm(""); }}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                activeTab === "history"
                  ? "bg-white text-purple-700 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <History className="w-4 h-4 text-purple-600" />
              <span>ប្រវត្តិ &amp; តាមដាន Live Sync</span>
              {auditLogs.length > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] font-extrabold rounded-full bg-purple-100 text-purple-800">
                  {auditLogs.length}
                </span>
              )}
            </button>
          </div>

          <button
            onClick={() => setIsReferenceOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-all shadow-xs"
            title="បើកមើលសៀវភៅណែនាំ & REFERENCE ផ្លូវការ"
          >
            <FileText className="w-4 h-4 text-emerald-600" />
            <span>REFERENCE ឯកសារយោង</span>
          </button>

          <Link
            href="/summary"
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-all shadow-xs"
            title="ទៅកាន់ Store Summary"
          >
            <BarChart3 className="w-4 h-4 text-indigo-600" />
            <span>Store Summary ↗</span>
          </Link>
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
                  onClick={handleSaveStockLog}
                  disabled={isSaving}
                  className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm disabled:opacity-50"
                >
                  {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>{isSaving ? "កំពុងរក្សាទុក..." : "Save Stock Log"}</span>
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
                            inputMode="decimal"
                            placeholder="0"
                            value={item.cpu === 0 ? "" : item.cpu}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => {
                              const v = e.target.value;
                              const num = v === "" ? 0 : parseFloat(v);
                              handleStockNumberChange(item.item_code, "cpu", isNaN(num) ? 0 : num);
                            }}
                            className="w-18 px-2 py-1 text-center font-bold text-slate-800 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none text-xs"
                          />
                        </td>

                        {/* Opening Stock Input */}
                        <td className="p-2 text-center bg-slate-50/40">
                          <input
                            type="number"
                            min="0"
                            inputMode="numeric"
                            placeholder="0"
                            value={item.opening_stock === 0 ? "" : item.opening_stock}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => {
                              const v = e.target.value;
                              const num = v === "" ? 0 : parseInt(v, 10);
                              handleStockNumberChange(item.item_code, "opening_stock", isNaN(num) ? 0 : num);
                            }}
                            className="w-20 px-2 py-1 text-center font-bold text-slate-700 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none text-xs"
                          />
                        </td>
                        
                        {/* Stock In Input */}
                        <td className="p-2 text-center bg-emerald-50/20">
                          <input
                            type="number"
                            min="0"
                            inputMode="numeric"
                            placeholder="0"
                            value={item.stock_in === 0 ? "" : item.stock_in}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => {
                              const v = e.target.value;
                              const num = v === "" ? 0 : parseInt(v, 10);
                              handleStockNumberChange(item.item_code, "stock_in", isNaN(num) ? 0 : num);
                            }}
                            className="w-20 px-2 py-1 text-center font-bold text-emerald-700 border border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none text-xs"
                          />
                        </td>

                        {/* Stock Out Input */}
                        <td className="p-2 text-center bg-rose-50/20">
                          <input
                            type="number"
                            min="0"
                            inputMode="numeric"
                            placeholder="0"
                            value={item.stock_out === 0 ? "" : item.stock_out}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => {
                              const v = e.target.value;
                              const num = v === "" ? 0 : parseInt(v, 10);
                              handleStockNumberChange(item.item_code, "stock_out", isNaN(num) ? 0 : num);
                            }}
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
                    Tube Coffee+ (9)
                  </button>
                  <button
                    onClick={() => setSelectedBrand("OnMart")}
                    className={`px-3 py-1.5 rounded-md transition-all ${selectedBrand === "OnMart" ? "bg-white text-blue-700 shadow-sm" : "text-slate-500"}`}
                  >
                    OnMart (4)
                  </button>
                </div>

                <button
                  onClick={handleSaveStoreTotals}
                  disabled={isSaving}
                  className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm disabled:opacity-50"
                >
                  {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>{isSaving ? "កំពុងរក្សាទុក..." : "Save Store Totals"}</span>
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
                          inputMode="numeric"
                          placeholder="0"
                          value={store.dailyAmount === 0 ? "" : store.dailyAmount}
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => {
                            const v = e.target.value;
                            const num = v === "" ? 0 : parseInt(v, 10);
                            handleStoreAmountChange(store.id, "dailyAmount", isNaN(num) ? 0 : num);
                          }}
                          className="w-24 px-2 py-1 text-center font-bold text-emerald-700 border border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none text-xs"
                        />
                      </td>

                      {/* Monthly Amount Input */}
                      <td className="p-2 text-center bg-indigo-50/20">
                        <input
                          type="number"
                          min="0"
                          inputMode="numeric"
                          placeholder="0"
                          value={store.monthlyAmount === 0 ? "" : store.monthlyAmount}
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => {
                            const v = e.target.value;
                            const num = v === "" ? 0 : parseInt(v, 10);
                            handleStoreAmountChange(store.id, "monthlyAmount", isNaN(num) ? 0 : num);
                          }}
                          className="w-24 px-2 py-1 text-center font-bold text-indigo-700 border border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-xs"
                        />
                      </td>

                      {/* Yearly Amount Input */}
                      <td className="p-2 text-center bg-slate-50/40">
                        <input
                          type="number"
                          min="0"
                          inputMode="numeric"
                          placeholder="0"
                          value={store.yearlyAmount === 0 ? "" : store.yearlyAmount}
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => {
                            const v = e.target.value;
                            const num = v === "" ? 0 : parseInt(v, 10);
                            handleStoreAmountChange(store.id, "yearlyAmount", isNaN(num) ? 0 : num);
                          }}
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

      {/* ========================================================================= */}
      {/* TAB 3: UPDATE HISTORY & CONCURRENT AUDIT TRAIL */}
      {/* ========================================================================= */}
      {activeTab === "history" && (
        <div className="space-y-6 animate-fadeIn">

          {/* KPI STAT CARDS FOR AUDIT TRAIL & CONCURRENCY */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 font-medium">ស្ថានភាពដំណើរការព្រមគ្នា (Live Sync)</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-base font-bold text-emerald-700">កំពុង Sync ស្វ័យប្រវត្តិ</span>
                </div>
                <span className="text-xs text-slate-400">Phone 📱 &amp; PC 💻 Auto-Sync (15s)</span>
              </div>
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 font-medium">កាលបរិច្ឆេទដែលបានកត់ត្រា (Saved Days)</p>
                <p className="text-2xl font-bold text-indigo-600 mt-1">{savedDatesList.length} ថ្ងៃ</p>
                <span className="text-xs text-slate-400">រក្សាទុកអចិន្ត្រៃយ៍លើ Cloud</span>
              </div>
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 font-medium">កំណត់ត្រា Audit Logs សរុប</p>
                <p className="text-2xl font-bold text-purple-600 mt-1">{auditLogs.length} Records</p>
                <span className="text-xs text-slate-400">តាមដានរាល់ការចុច Save</span>
              </div>
              <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
                <History className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 font-medium">ម៉ោង Sync ចុងក្រោយ (Last Sync)</p>
                <p className="text-lg font-bold text-slate-800 mt-1">{lastSyncedTime || "Ready"}</p>
                <span className="text-xs text-emerald-600 font-semibold">Cloud Synced ✓</span>
              </div>
              <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* AUDIT LOG TABLE & ARCHIVE */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <div>
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <History className="w-5 h-5 text-purple-600" />
                  <span>តារាងតាមដានប្រវត្តិនៃការកែប្រែទិន្នន័យ (Audit Trail &amp; Update History)</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  តាមដានរាល់ការកែប្រែ ឬការដាក់ទិន្នន័យចូលដែលបានដំណើរការព្រមគ្នាលើ Phone &amp; PC (រក្សាទុកជាអចិន្ត្រៃយ៍)
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="ស្វែងរកតាមកាលបរិច្ឆេទ / ឧបករណ៍..."
                    value={historySearchTerm}
                    onChange={(e) => setHistorySearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <button
                  onClick={handleCopyBackup}
                  className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all border border-slate-200 active:scale-95"
                  title="ចម្លងទិន្នន័យ Backup ទាំងអស់ (Copy JSON)"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Backup</span>
                </button>

                <button
                  onClick={handleDownloadBackup}
                  className="flex items-center gap-1.5 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95"
                  title="ទាញយកឯកសារ JSON Backup"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Backup</span>
                </button>
              </div>
            </div>

            {/* Audit Logs Table */}
            {filteredAuditLogs.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <History className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-600">មិនទាន់មានកំណត់ត្រា Audit Log នៅឡើយទេ</p>
                <p className="text-xs text-slate-400 mt-1">
                  រាល់ពេលលោកអ្នកចុច Save Store Totals ឬ Save Stock Log កំណត់ត្រានឹងបង្ហាញនៅទីនេះដោយស្វ័យប្រវត្តិ
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs font-bold uppercase tracking-wider">
                      <th className="p-3">ពេលកត់ត្រា (Time)</th>
                      <th className="p-3">កាលបរិច្ឆេទគោលដៅ</th>
                      <th className="p-3">ប្រភេទ (Action)</th>
                      <th className="p-3">ឧបករណ៍ (Device)</th>
                      <th className="p-3">ព័ត៌មានលម្អិត (Details)</th>
                      <th className="p-3 text-center">ស្ថានភាព</th>
                      <th className="p-3 text-right">សកម្មភាព</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredAuditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/80 transition-colors text-xs">
                        <td className="p-3 font-mono text-slate-600 whitespace-nowrap">
                          {log.timeFormatted || new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td className="p-3 font-bold text-indigo-700 whitespace-nowrap">
                          {log.targetDate}
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            log.actionType === 'STORE_TOTALS' 
                              ? 'bg-indigo-100 text-indigo-800' 
                              : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {log.actionType === 'STORE_TOTALS' ? 'សរុបសាខា' : 'ស្តុកទំនិញ'}
                          </span>
                        </td>
                        <td className="p-3 text-slate-600 whitespace-nowrap font-medium">
                          {log.device || 'System 🌐'}
                        </td>
                        <td className="p-3 text-slate-800 max-w-xs sm:max-w-md font-medium">
                          <div>{log.titleKhmer}</div>
                          {log.detailsKhmer && (
                            <div className="text-[11px] text-slate-500 font-normal">{log.detailsKhmer}</div>
                          )}
                        </td>
                        <td className="p-3 text-center whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Saved &amp; Synced</span>
                          </span>
                        </td>
                        <td className="p-3 text-right whitespace-nowrap">
                          <button
                            onClick={() => {
                              if (log.targetDate && log.targetDate !== 'Unknown Date') {
                                setSelectedDate(log.targetDate);
                                setActiveTab(log.actionType === 'STOCK_LOG' ? 'stock' : 'stores');
                                triggerNotification(`បានជ្រើសរើសទិន្នន័យថ្ងៃ ${log.targetDate}!`);
                              }
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 rounded-lg border border-slate-200 font-bold transition-all active:scale-95"
                            title="បើកមើលទិន្នន័យថ្ងៃនេះ"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>ពិនិត្យមើល</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* PERMANENT DATES ARCHIVE */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-indigo-600" />
                  <span>បញ្ជីកាលបរិច្ឆេទដែលបានរក្សាទុកទាំងអស់ (Permanent Dates Archive)</span>
                </h3>
                <p className="text-xs text-slate-500">
                  រាល់ទិន្នន័យកាលបរិច្ឆេទទាំងអស់ត្រូវបានរក្សាទុកអចិន្ត្រៃយ៍ អាចចុចជ្រើសរើសមើលឡើងវិញបានគ្រប់ពេល
                </p>
              </div>
              <span className="text-xs font-bold bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full border border-indigo-200">
                {savedDatesList.length} ថ្ងៃសរុប
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
              {savedDatesList.map(dateStr => {
                const isSelected = selectedDate === dateStr;
                const hasStoreData = storesByDate[dateStr] && storesByDate[dateStr].some(s => s.dailyAmount > 0);
                const hasStockData = stockByDate[dateStr] && stockByDate[dateStr].some(i => i.stock_in > 0 || i.stock_out > 0);

                return (
                  <button
                    key={dateStr}
                    onClick={() => {
                      setSelectedDate(dateStr);
                      triggerNotification(`បានជ្រើសរើសថ្ងៃ ${dateStr}!`);
                    }}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                      isSelected
                        ? "bg-indigo-50/80 border-indigo-300 ring-2 ring-indigo-500/20 shadow-xs"
                        : "bg-slate-50 hover:bg-slate-100/80 border-slate-200/80"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className={`text-xs font-black font-mono ${isSelected ? 'text-indigo-900' : 'text-slate-800'}`}>
                        {dateStr}
                      </span>
                      {isSelected && (
                        <span className="w-2 h-2 rounded-full bg-indigo-600" />
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1 text-[10px]">
                      {hasStoreData && (
                        <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold">
                          Stores ✓
                        </span>
                      )}
                      {hasStockData && (
                        <span className="px-1.5 py-0.5 bg-purple-100 text-purple-800 rounded font-bold">
                          Stock ✓
                        </span>
                      )}
                      {!hasStoreData && !hasStockData && (
                        <span className="text-slate-400">Saved</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
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
                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-all"
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
                  រាល់ការ Save នីមួយៗ ត្រូវបានបង្កើតជា Audit Log កត់ត្រាទុកនូវ៖ ម៉ោង, ថ្ងៃ, ចំនួន Items, សាខា និងឧបករណ៍ដែលបាន Update (Phone 📱 ឬ PC 💻)។ លោកអ្នកអាចចូលទៅកាន់ Tab <strong>«ប្រវត្តិ &amp; តាមដាន Live Sync»</strong> ដើម្បីពិនិត្យមើលឡើងវិញ ឬចុចប៊ូតុង «ពិនិត្យមើល» ដើម្បីបើកមើលទិន្នន័យថ្ងៃនោះបានភ្លាមៗ។
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
                  • <strong>ការទាញយកទិន្នន័យ Backup៖</strong> អាចចុចប៊ូតុង «Download Backup» ដើម្បីរក្សាទុកឯកសារ JSON លើម៉ាស៊ីនផ្ទាល់ខ្លួនបានគ្រប់ពេលវេលា។
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                onClick={() => setIsReferenceOpen(false)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all"
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

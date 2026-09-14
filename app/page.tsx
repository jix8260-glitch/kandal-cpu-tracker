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
  const [activeTab, setActiveTab] = useState<"stores" | "stock">("stock");
  const [selectedBrand, setSelectedBrand] = useState<"ALL" | "Tube Coffee" | "OnMart">("ALL");
  
  // Manager PIN & Price Visibility state (0203 reveals prices, 8899 or default hides prices)
  const [isManager, setIsManager] = useState<boolean>(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState<boolean>(false);
  const [pinInput, setPinInput] = useState<string>("");
  const [pinError, setPinError] = useState<string>("");

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

      if (localStorage.getItem("kandal_manager_mode") === "true") {
        setIsManager(true);
      }
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

  // TOP 2 TUBE COFFEE+ AND TOP 2 ONMART STORES (Ranked by Daily Items for selected date)
  const top2TubeStores = useMemo(() => {
    return [...currentStores]
      .filter((s) => s.brand === "Tube Coffee")
      .sort((a, b) => b.dailyAmount - a.dailyAmount)
      .slice(0, 2);
  }, [currentStores]);

  const top2OnMartStores = useMemo(() => {
    return [...currentStores]
      .filter((s) => s.brand === "OnMart")
      .sort((a, b) => b.dailyAmount - a.dailyAmount)
      .slice(0, 2);
  }, [currentStores]);

  const maxTubeAmount = useMemo(() => top2TubeStores[0]?.dailyAmount || 1, [top2TubeStores]);
  const maxOnMartAmount = useMemo(() => top2OnMartStores[0]?.dailyAmount || 1, [top2OnMartStores]);

  const storeTotalsSum = useMemo(() => {
    const tubeSum = currentStores.filter((s) => s.brand === "Tube Coffee").reduce((acc, s) => acc + s.dailyAmount, 0);
    const onmartSum = currentStores.filter((s) => s.brand === "OnMart").reduce((acc, s) => acc + s.dailyAmount, 0);
    return {
      daily: currentStores.reduce((acc, s) => acc + s.dailyAmount, 0),
      tubeDaily: tubeSum,
      onmartDaily: onmartSum,
    };
  }, [currentStores]);

  // Manager PIN & Mode Handlers (0203 reveals prices, 8899 hides prices)
  const handlePinSubmit = () => {
    setPinError("");
    if (pinInput === "0203") {
      setIsManager(true);
      setIsPinModalOpen(false);
      setPinInput("");
      try { localStorage.setItem("kandal_manager_mode", "true"); } catch (e) {}
      triggerNotification("✅ បានចូល Manager Mode ជោគជ័យ! បង្ហាញព័ត៌មានតម្លៃ CPU ទាំងអស់");
    } else if (pinInput === "8899") {
      setIsManager(false);
      setIsPinModalOpen(false);
      setPinInput("");
      try { localStorage.removeItem("kandal_manager_mode"); } catch (e) {}
      triggerNotification("ℹ️ កូដ 8899៖ របៀបបុគ្គលិកទូទៅ (លាក់តម្លៃ រក្សាការវាយបញ្ចូលធម្មតា)");
    } else {
      setPinError("លេខកូដមិនត្រឹមត្រូវ! (Manager: 0203, បុគ្គលិក: 8899)");
    }
  };

  const handleLogoutManager = () => {
    setIsManager(false);
    try { localStorage.removeItem("kandal_manager_mode"); } catch (e) {}
    triggerNotification("🔒 បានចាកចេញពី Manager Mode! តម្លៃត្រូវបានលាក់វិញ");
  };

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
          </div>

          {/* SINGLE STORE SUMMARY LINK */}
          <Link
            href="/summary"
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-all shadow-xs"
            title="ទៅកាន់ Store Summary"
          >
            <BarChart3 className="w-4 h-4 text-indigo-600" />
            <span>Store Summary ↗</span>
          </Link>

          {/* MANAGER PIN ACCESS BUTTON */}
          {isManager ? (
            <button
              onClick={handleLogoutManager}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 transition-all shadow-xs"
              title="Manager Mode កំពុងបើក (ចុចដើម្បីចាកចេញ/លាក់តម្លៃ)"
            >
              <span>👑 Manager (0203)</span>
              <span className="text-[10px] bg-amber-200 px-1.5 py-0.5 rounded text-amber-800">ចាកចេញ</span>
            </button>
          ) : (
            <button
              onClick={() => { setPinInput(""); setPinError(""); setIsPinModalOpen(true); }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-all shadow-xs"
              title="ចូលមើលតម្លៃ (សម្រាប់ Manager: 0203)"
            >
              <span>🔐 Manager</span>
            </button>
          )}
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

            {isManager ? (
              <div className="bg-white p-5 rounded-2xl border border-amber-200/80 bg-amber-50/20 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs text-amber-800 font-bold flex items-center gap-1">
                    <span>👑 តម្លៃស្តុកបច្ចុប្បន្ន (Valuation)</span>
                  </p>
                  <p className="text-2xl font-bold text-slate-800 mt-1">${stockSummary.totalValue.toFixed(2)}</p>
                  <span className="text-xs text-emerald-600 font-semibold">Manager CPU Calculation ($)</span>
                </div>
                <div className="w-12 h-12 bg-amber-100 text-amber-800 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6" />
                </div>
              </div>
            ) : (
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 font-medium">មុខទំនិញសរុប (Total Items)</p>
                  <p className="text-2xl font-bold text-indigo-700 mt-1">{currentStockItems.length} មុខ</p>
                  <span className="text-xs text-slate-400">Tube Coffee+ (69) &amp; OnMart (36)</span>
                </div>
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                  <Boxes className="w-6 h-6" />
                </div>
              </div>
            )}

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
                    {isManager && (
                      <th className="p-3 text-center bg-amber-50/80 text-amber-900 border-x border-amber-200/80">
                        👑 តម្លៃ/CPU ($)
                      </th>
                    )}
                    <th className="p-3 text-center bg-slate-100/60 text-slate-800">ដើមគ្រា (Opening)</th>
                    <th className="p-3 text-center bg-emerald-50/50 text-emerald-800">ស្តុកចូល (Stock In)</th>
                    <th className="p-3 text-center bg-rose-50/50 text-rose-800">ស្តុកចេញ (Stock Out)</th>
                    <th className="p-3 text-right">ស្តុកសល់ (Balance)</th>
                    {isManager && (
                      <th className="p-3 text-right bg-amber-50/80 text-amber-900 border-l border-amber-200/80">
                        👑 តម្លៃសរុប ($)
                      </th>
                    )}
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

                        {/* CPU / Price Input - ONLY VISIBLE IF MANAGER (0203) */}
                        {isManager && (
                          <td className="p-2 text-center bg-amber-50/30 border-x border-amber-100">
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
                              className="w-18 px-2 py-1 text-center font-bold text-slate-800 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none text-xs bg-white"
                            />
                          </td>
                        )}

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

                        {/* Valuation - ONLY VISIBLE IF MANAGER (0203) */}
                        {isManager && (
                          <td className="p-3 text-right font-bold text-xs text-amber-950 bg-amber-50/20 border-l border-amber-100">
                            ${value.toFixed(2)}
                          </td>
                        )}
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

          {/* KPI STAT CARDS FOR STORES (DAILY ITEMS ONLY) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 font-medium">សរុបប្រចាំថ្ងៃ (Daily Total Items)</p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">{storeTotalsSum.daily.toLocaleString()} items</p>
                <span className="text-xs text-slate-400">ចែកចាយថ្ងៃ {selectedDate} (13 ហាង)</span>
              </div>
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 font-medium">Tube Coffee+ សរុបថ្ងៃនេះ</p>
                <p className="text-2xl font-bold text-amber-700 mt-1">{storeTotalsSum.tubeDaily.toLocaleString()} items</p>
                <span className="text-xs text-amber-600 font-medium">សរុប 9 ហាង ({selectedDate})</span>
              </div>
              <div className="w-12 h-12 bg-amber-50 text-amber-700 rounded-xl flex items-center justify-center">
                <Coffee className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 font-medium">OnMart សរុបថ្ងៃនេះ</p>
                <p className="text-2xl font-bold text-blue-700 mt-1">{storeTotalsSum.onmartDaily.toLocaleString()} items</p>
                <span className="text-xs text-blue-600 font-medium">សរុប 4 ហាង ({selectedDate})</span>
              </div>
              <div className="w-12 h-12 bg-blue-50 text-blue-700 rounded-xl flex items-center justify-center">
                <ShoppingBag className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 font-medium">សាខាលំដាប់លេខ ១ ថ្ងៃនេះ</p>
                <p className="text-base font-bold text-slate-800 truncate mt-1">
                  {top2TubeStores[0] && top2OnMartStores[0] 
                    ? (top2TubeStores[0].dailyAmount >= top2OnMartStores[0].dailyAmount 
                        ? top2TubeStores[0].name 
                        : top2OnMartStores[0].name)
                    : "គ្មានទិន្នន័យ"}
                </p>
                <span className="text-xs text-amber-600 font-semibold">
                  {Math.max(top2TubeStores[0]?.dailyAmount || 0, top2OnMartStores[0]?.dailyAmount || 0).toLocaleString()} items ថ្ងៃនេះ
                </span>
              </div>
              <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                <Award className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* TOP STORES: TUBE COFFEE+ (TOP 2) & ONMART (TOP 2) */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-500" />
                  <span>តារាងចំណាត់ថ្នាក់ TOP STORES (TUBE 2 ហាង &amp; ONMART 2 ហាង)</span>
                </h2>
                <p className="text-xs text-slate-500">
                  គិតតាមចំនួន items សរុបប្រចាំថ្ងៃ ({selectedDate})
                </p>
              </div>
              <span className="text-xs font-bold px-3 py-1 bg-slate-100 text-slate-700 rounded-full border border-slate-200">
                Top 2 តាម Brand នីមួយៗ
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Tube Coffee+ Top 2 */}
              <div className="bg-amber-50/40 rounded-xl p-4 border border-amber-200/70">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                    <Coffee className="w-4 h-4 text-amber-700" />
                    Tube Coffee+ (Top 2)
                  </span>
                  <span className="text-[11px] font-semibold text-amber-700 bg-white px-2 py-0.5 rounded border border-amber-200">
                    9 Stores Roster
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {top2TubeStores.map((store, idx) => {
                    const percent = maxTubeAmount > 0 ? Math.round((store.dailyAmount / maxTubeAmount) * 100) : 0;
                    return (
                      <div key={store.id} className="bg-white p-3.5 rounded-xl border border-amber-100 shadow-xs">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                            idx === 0 ? "bg-amber-500 text-white" : "bg-amber-200 text-amber-900"
                          }`}>
                            #{idx + 1}
                          </span>
                          <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            {store.code}
                          </span>
                        </div>
                        <p className="font-bold text-sm text-slate-800 truncate" title={store.name}>{store.name}</p>
                        <div className="mt-2 pt-2 border-t border-slate-100">
                          <div className="flex justify-between items-center text-xs mb-1">
                            <span className="text-slate-400">ថ្ងៃនេះ:</span>
                            <span className="font-bold text-amber-800">{store.dailyAmount.toLocaleString()} items</span>
                          </div>
                          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div className="h-full bg-amber-500 rounded-full" style={{ width: `${percent}%` }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* OnMart Top 2 */}
              <div className="bg-blue-50/40 rounded-xl p-4 border border-blue-200/70">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
                    <ShoppingBag className="w-4 h-4 text-blue-700" />
                    OnMart (Top 2)
                  </span>
                  <span className="text-[11px] font-semibold text-blue-700 bg-white px-2 py-0.5 rounded border border-blue-200">
                    4 Stores Roster
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {top2OnMartStores.map((store, idx) => {
                    const percent = maxOnMartAmount > 0 ? Math.round((store.dailyAmount / maxOnMartAmount) * 100) : 0;
                    return (
                      <div key={store.id} className="bg-white p-3.5 rounded-xl border border-blue-100 shadow-xs">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                            idx === 0 ? "bg-blue-600 text-white" : "bg-blue-200 text-blue-900"
                          }`}>
                            #{idx + 1}
                          </span>
                          <span className="text-xs font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            {store.code}
                          </span>
                        </div>
                        <p className="font-bold text-sm text-slate-800 truncate" title={store.name}>{store.name}</p>
                        <div className="mt-2 pt-2 border-t border-slate-100">
                          <div className="flex justify-between items-center text-xs mb-1">
                            <span className="text-slate-400">ថ្ងៃនេះ:</span>
                            <span className="font-bold text-blue-800">{store.dailyAmount.toLocaleString()} items</span>
                          </div>
                          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-600 rounded-full" style={{ width: `${percent}%` }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* STORE TOTALS TABLE (DAILY ITEMS KEY IN ONLY) */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h2 className="text-lg font-bold text-slate-800">
                  តារាងបរិមាណសរុបតាមសាខា (13 Stores: Daily Items Key In)
                </h2>
                <p className="text-xs text-slate-500">
                  កាលបរិច្ឆេទ៖ <span className="font-bold text-indigo-700">{selectedDate}</span> — បញ្ចូលចំនួន items សរុបប្រចាំថ្ងៃ (សម្រាប់របាយការណ៍សរុបខែ/ឆ្នាំ សូមចូល Store Summary ខាងលើ)
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
                      សរុបប្រចាំថ្ងៃ ({selectedDate}) (items)
                    </th>
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
                      
                      {/* Daily Amount Input Only */}
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
                          className="w-32 px-3 py-1.5 text-center font-bold text-emerald-700 border border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none text-xs"
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
      {/* MANAGER ACCESS / PIN CODE MODAL (0203 for Manager, 8899 for Staff) */}
      {/* ========================================================================= */}
      {isPinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-slate-800 font-bold">
                <ShieldCheck className="w-5 h-5 text-amber-600" />
                <span>ផ្ទៀងផ្ទាត់លេខកូដ (Security PIN)</span>
              </div>
              <button
                onClick={() => setIsPinModalOpen(false)}
                className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="my-5 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">
                  លេខកូដសម្ងាត់ (PIN 4 ខ្ទង់)៖
                </label>
                <input
                  type="password"
                  maxLength={6}
                  inputMode="numeric"
                  autoFocus
                  placeholder="••••"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handlePinSubmit()}
                  className="w-full text-center tracking-[0.4em] font-mono text-xl py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              {pinError && (
                <p className="text-xs text-rose-600 font-bold text-center">
                  {pinError}
                </p>
              )}

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 space-y-1">
                <p>• <strong>Manager (0203)៖</strong> បើកមើលតម្លៃ CPU ($) និងរបាយការណ៍ទាំងអស់</p>
                <p>• <strong>Staff (8899)៖</strong> លាក់តម្លៃ រក្សាការបញ្ចូលទិន្នន័យធម្មតា</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsPinModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                បោះបង់
              </button>
              <button
                type="button"
                onClick={handlePinSubmit}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-sm"
              >
                យល់ព្រម (Confirm)
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

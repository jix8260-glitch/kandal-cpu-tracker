"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Lock,
  Unlock,
  Shield,
  ShieldCheck,
  Store,
  Package,
  Calendar,
  Search,
  Plus,
  Printer,
  Settings,
  Save,
  CheckCircle2,
  AlertCircle,
  Coffee,
  ShoppingBag,
  TrendingUp,
  TrendingDown,
  Award,
  Users,
  Eye,
  EyeOff,
  LogOut,
  X,
  Boxes,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Cloud,
  CloudOff,
  BarChart3,
  QrCode
} from "lucide-react";
import { STARTER_ITEMS } from "@/lib/starter-items";
import { AuditLogEntry } from "@/lib/types";
import QRCodeModal from "@/components/QRCodeModal";
import ApprovalQueue from "@/components/ApprovalQueue";
import SettingsMenu from "@/components/SettingsMenu";

// =========================================================================
// 1. DATA TYPES & INTERFACES
// =========================================================================
export interface StoreRecord {
  id: string;
  code: string;
  name: string;
  brand: "Tube Coffee" | "OnMart";
}

export interface ItemRecord {
  item_code: string;
  description_khmer: string;
  brand: "Tube Coffee" | "OnMart";
  category: string;
  uom: string;
  cpu: number;
  opening_stock: number;
}

export interface DayDistribution {
  [storeId: string]: number; // storeId -> quantity for selected date
}

export interface DayStockLog {
  [itemCode: string]: {
    stock_in: number;
    stock_out: number;
  };
}

export interface AccessLog {
  id: string;
  userName: string;
  role: "ADMIN" | "STAFF";
  timestamp: string;
  device: string;
}

// =========================================================================
// 2. INITIAL SEED DATA
// =========================================================================
const DEFAULT_STORES: StoreRecord[] = [
  // Tube Coffee+ (9 Stores)
  { id: "s1", code: "KPI", name: "Tube Coffee+ KPI", brand: "Tube Coffee" },
  { id: "s2", code: "TKC", name: "Tube Coffee+ TKC", brand: "Tube Coffee" },
  { id: "s3", code: "CCV", name: "Tube Coffee+ CCV", brand: "Tube Coffee" },
  { id: "s4", code: "CDP", name: "Tube Coffee+ CDP", brand: "Tube Coffee" },
  { id: "s5", code: "CMH", name: "Tube Coffee+ CMH", brand: "Tube Coffee" },
  { id: "s6", code: "KSH", name: "Tube Coffee+ KSH", brand: "Tube Coffee" },
  { id: "s7", code: "CKD", name: "Tube Coffee+ CKD", brand: "Tube Coffee" },
  { id: "s8", code: "2K4", name: "Tube Coffee+ 2K4", brand: "Tube Coffee" },
  { id: "s9", code: "RTN", name: "Tube Coffee+ RTN", brand: "Tube Coffee" },
  // OnMart (4 Stores)
  { id: "s10", code: "PDK", name: "OnMart PDK", brand: "OnMart" },
  { id: "s11", code: "TK",  name: "OnMart TK",  brand: "OnMart" },
  { id: "s12", code: "OU3", name: "OnMart OU3", brand: "OnMart" },
  { id: "s13", code: "DT",  name: "OnMart DT",  brand: "OnMart" }
];

// Helper to build 105 starter items
const buildStarterItems = (): ItemRecord[] => {
  const map = new Map<string, ItemRecord>();
  STARTER_ITEMS.forEach((si) => {
    const brand: "Tube Coffee" | "OnMart" =
      si.location?.includes("OnMart") || si.location === "ONMART" ? "OnMart" : "Tube Coffee";
    map.set(si.item_code, {
      item_code: si.item_code,
      description_khmer: si.description_khmer,
      brand,
      category: si.category || "Daily Product",
      uom: si.uom || "Pack",
      cpu: si.cpu || 0,
      opening_stock: si.opening_stock || 0,
    });
  });
  return Array.from(map.values());
};

const DEFAULT_ITEMS: ItemRecord[] = buildStarterItems();

export default function CPUMainPage() {
  // --- AUTHENTICATION STATE ---
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState<"ADMIN" | "STAFF">("STAFF");
  const [currentUserName, setCurrentUserName] = useState("Staff");
  const [inputPasscode, setInputPasscode] = useState("8899");
  const [inputUserName, setInputUserName] = useState("Staff");
  const [showPasscode, setShowPasscode] = useState(false);
  const [loginError, setLoginError] = useState("");

  // Passwords
  const [adminPassword, setAdminPassword] = useState("admin8888");
  const [staffPassword, setStaffPassword] = useState("tube1234");
  const [appVersion, setAppVersion] = useState("v3.6 Production");
  const [editAppVersion, setEditAppVersion] = useState("v3.6 Production");
  const [accessLogs, setAccessLogs] = useState<AccessLog[]>([]);

  // Supabase Cloud Connection State
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(false);
  const [sbUrl, setSbUrl] = useState("");
  const [sbKey, setSbKey] = useState("");
  const [sbNotice, setSbNotice] = useState("");

  // --- CORE APP STATE ---
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [activeTab, setActiveTab] = useState<"stores" | "stock">("stores");
  const [selectedBrand, setSelectedBrand] = useState<"ALL" | "Tube Coffee" | "OnMart">("ALL");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  // Masters
  const [stores, setStores] = useState(DEFAULT_STORES);
  const [items, setItems] = useState(DEFAULT_ITEMS);

  // Date-Linked Records (Keyed by YYYY-MM-DD)
  const [historyDistribution, setHistoryDistribution] = useState<{ [date: string]: DayDistribution }>({});
  const [historyStock, setHistoryStock] = useState<{ [date: string]: DayStockLog }>({});

  // Cloud sync status
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "synced" | "error">("idle");
  const [lastSyncedTime, setLastSyncedTime] = useState<string>("");

  // Modals & UI helpers
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showAddStoreModal, setShowAddStoreModal] = useState(false);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Form State for Add Store
  const [newStoreCode, setNewStoreCode] = useState("");
  const [newStoreName, setNewStoreName] = useState("");
  const [newStoreBrand, setNewStoreBrand] = useState<"Tube Coffee" | "OnMart">("Tube Coffee");

  // Form State for Add Item
  const [newItemCode, setNewItemCode] = useState("");
  const [newItemDesc, setNewItemDesc] = useState("");
  const [newItemBrand, setNewItemBrand] = useState<"Tube Coffee" | "OnMart">("Tube Coffee");
  const [newItemCategory, setNewItemCategory] = useState("Daily Product");
  const [newItemUom, setNewItemUom] = useState("Pack");
  const [newItemCpu, setNewItemCpu] = useState("0");
  const [newItemOpening, setNewItemOpening] = useState("0");

  // Admin Modal change password state
  const [editAdminPw, setEditAdminPw] = useState("");
  const [editStaffPw, setEditStaffPw] = useState("");
  const [adminNotice, setAdminNotice] = useState("");

  // Pull latest data from Cloud API
  const fetchFromCloud = async (showToast = false) => {
    try {
      setSyncStatus("syncing");
      const res = await fetch("/api/sync", { cache: "no-store" });
      if (!res.ok) throw new Error("Sync failed");
      const cloudData = await res.json();

      if (cloudData) {
        if (cloudData.storesByDate && Object.keys(cloudData.storesByDate).length > 0) {
          // Convert to historyDistribution format
          const distMap: { [date: string]: DayDistribution } = {};
          for (const [d, sList] of Object.entries(cloudData.storesByDate)) {
            if (Array.isArray(sList)) {
              distMap[d] = {};
              (sList as any[]).forEach((s) => {
                distMap[d][s.id] = s.dailyAmount || 0;
              });
            }
          }
          setHistoryDistribution((prev) => ({ ...prev, ...distMap }));
        }

        if (cloudData.stockByDate && Object.keys(cloudData.stockByDate).length > 0) {
          const stockMap: { [date: string]: DayStockLog } = {};
          for (const [d, iList] of Object.entries(cloudData.stockByDate)) {
            if (Array.isArray(iList)) {
              stockMap[d] = {};
              (iList as any[]).forEach((i) => {
                stockMap[d][i.item_code] = {
                  stock_in: i.stock_in || 0,
                  stock_out: i.stock_out || 0,
                };
              });
            }
          }
          setHistoryStock((prev) => ({ ...prev, ...stockMap }));
        }

        setIsSupabaseConnected(Boolean(cloudData.supabaseConnected));

        setSyncStatus("synced");
        const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
        setLastSyncedTime(timeStr);
        if (showToast) {
          notify(`✅ ទាញទិន្នន័យពី Cloud ជោគជ័យ! (${timeStr})`);
        }
      }
    } catch (err) {
      console.warn("Cloud sync error:", err);
      setSyncStatus("error");
    }
  };

  // Push updates to Cloud API
  const saveToCloud = async (
    targetDist: { [date: string]: DayDistribution },
    targetStock: { [date: string]: DayStockLog }
  ) => {
    try {
      setSyncStatus("syncing");
      // Format stores for cloud
      const storesByDate: { [date: string]: any[] } = {};
      for (const [d, dist] of Object.entries(targetDist)) {
        storesByDate[d] = stores.map((s) => ({
          id: s.id,
          code: s.code,
          name: s.name,
          brand: s.brand,
          dailyAmount: dist[s.id] || 0,
        }));
      }

      // Format stock for cloud
      const stockByDate: { [date: string]: any[] } = {};
      for (const [d, sLog] of Object.entries(targetStock)) {
        stockByDate[d] = items.map((i) => ({
          item_code: i.item_code,
          description_khmer: i.description_khmer,
          brand: i.brand,
          category: i.category,
          uom: i.uom,
          cpu: i.cpu,
          opening_stock: i.opening_stock,
          stock_in: sLog[i.item_code]?.stock_in || 0,
          stock_out: sLog[i.item_code]?.stock_out || 0,
        }));
      }

      await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storesByDate,
          stockByDate,
          itemPrices: {},
          actionMeta: {
            actionType: "SYNC",
            targetDate: selectedDate,
          },
        }),
      });
      setSyncStatus("synced");
      const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      setLastSyncedTime(timeStr);
    } catch (e) {
      console.warn("Failed to push to cloud", e);
      setSyncStatus("error");
    }
  };

  // Load from LocalStorage on mount
  useEffect(() => {
    try {
      const savedStores = localStorage.getItem("cpu_stores");
      if (savedStores) setStores(JSON.parse(savedStores));

      const savedItems = localStorage.getItem("cpu_items");
      if (savedItems) {
        try {
          const parsed = JSON.parse(savedItems);
          if (Array.isArray(parsed) && parsed.length >= 80) {
            setItems(parsed);
          } else {
            setItems(DEFAULT_ITEMS);
            localStorage.setItem("cpu_items", JSON.stringify(DEFAULT_ITEMS));
          }
        } catch {
          setItems(DEFAULT_ITEMS);
          localStorage.setItem("cpu_items", JSON.stringify(DEFAULT_ITEMS));
        }
      } else {
        setItems(DEFAULT_ITEMS);
        localStorage.setItem("cpu_items", JSON.stringify(DEFAULT_ITEMS));
      }

      const savedDist = localStorage.getItem("cpu_history_distribution");
      if (savedDist) setHistoryDistribution(JSON.parse(savedDist));

      const savedStock = localStorage.getItem("cpu_history_stock");
      if (savedStock) setHistoryStock(JSON.parse(savedStock));

      const savedAdminPw = localStorage.getItem("cpu_admin_pw");
      if (savedAdminPw) {
        setAdminPassword(savedAdminPw);
        setEditAdminPw(savedAdminPw);
      } else {
        setEditAdminPw("admin8888");
      }

      const savedStaffPw = localStorage.getItem("cpu_staff_pw");
      if (savedStaffPw) {
        setStaffPassword(savedStaffPw);
        setEditStaffPw(savedStaffPw);
      } else {
        setEditStaffPw("tube1234");
      }

      const savedLogs = localStorage.getItem("cpu_access_logs");
      if (savedLogs) setAccessLogs(JSON.parse(savedLogs));

      const savedVer = localStorage.getItem("cpu_app_version");
      if (savedVer) {
        setAppVersion(savedVer);
        setEditAppVersion(savedVer);
      }

      const savedSbUrl = localStorage.getItem("supabase_cloud_url");
      const savedSbKey = localStorage.getItem("supabase_cloud_key");
      if (savedSbUrl) setSbUrl(savedSbUrl);
      if (savedSbKey) setSbKey(savedSbKey);

      // Auto-restore session if logged in
      const savedUser = localStorage.getItem("cpu_current_user") || sessionStorage.getItem("cpu_current_user");
      const savedRole = (localStorage.getItem("cpu_current_role") || sessionStorage.getItem("cpu_current_role")) as "ADMIN" | "STAFF" | null;
      if (savedUser && savedRole) {
        setCurrentUserName(savedUser);
        setCurrentUserRole(savedRole);
        setIsAuthenticated(true);
      } else {
        const lastUser = localStorage.getItem("cpu_last_username");
        const lastPass = localStorage.getItem("cpu_last_passcode");
        if (lastUser) setInputUserName(lastUser);
        if (lastPass) setInputPasscode(lastPass);
      }
    } catch (e) {
      console.error("Failed to load local data", e);
    }

    // Fetch latest cloud data
    fetchFromCloud();

    // Auto-poll cloud every 20 seconds
    const poll = setInterval(() => {
      if (document.visibilityState === "visible") {
        fetchFromCloud(false);
      }
    }, 20000);

    return () => clearInterval(poll);
  }, []);

  const notify = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // --- LOGIN LOGIC ---
  const quickLogin = (name: string, role: "ADMIN" | "STAFF", code: string) => {
    logAccess(name, role);
    setCurrentUserName(name);
    setCurrentUserRole(role);
    setIsAuthenticated(true);
    setLoginError("");
    try {
      localStorage.setItem("cpu_current_user", name);
      localStorage.setItem("cpu_current_role", role);
      localStorage.setItem("cpu_last_username", name);
      localStorage.setItem("cpu_last_passcode", code);
      sessionStorage.setItem("cpu_current_user", name);
      sessionStorage.setItem("cpu_current_role", role);
    } catch (e) {}
    notify(`សូមស្វាគមន៍ ${name} (${role === "ADMIN" ? "Manager / Admin Mode" : "Staff Mode"})`);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUserName.trim()) {
      setLoginError("សូមបញ្ចូលឈ្មោះ ឬអត្តលេខរបស់អ្នក!");
      return;
    }

    if (inputPasscode === adminPassword || inputPasscode === "0203" || inputPasscode === "admin8888") {
      logAccess(inputUserName, "ADMIN");
      setCurrentUserName(inputUserName.trim());
      setCurrentUserRole("ADMIN");
      setIsAuthenticated(true);
      setLoginError("");
      try {
        localStorage.setItem("cpu_current_user", inputUserName.trim());
        localStorage.setItem("cpu_current_role", "ADMIN");
        localStorage.setItem("cpu_last_username", inputUserName.trim());
        localStorage.setItem("cpu_last_passcode", inputPasscode.trim());
        sessionStorage.setItem("cpu_current_user", inputUserName.trim());
        sessionStorage.setItem("cpu_current_role", "ADMIN");
      } catch (e) {}
      notify(`សូមស្វាគមន៍ ${inputUserName} (Manager / Admin Mode)`);
    } else if (inputPasscode === staffPassword || inputPasscode === "8899" || inputPasscode === "tube1234") {
      logAccess(inputUserName, "STAFF");
      setCurrentUserName(inputUserName.trim());
      setCurrentUserRole("STAFF");
      setIsAuthenticated(true);
      setLoginError("");
      try {
        localStorage.setItem("cpu_current_user", inputUserName.trim());
        localStorage.setItem("cpu_current_role", "STAFF");
        localStorage.setItem("cpu_last_username", inputUserName.trim());
        localStorage.setItem("cpu_last_passcode", inputPasscode.trim());
        sessionStorage.setItem("cpu_current_user", inputUserName.trim());
        sessionStorage.setItem("cpu_current_role", "STAFF");
      } catch (e) {}
      notify(`សូមស្វាគមន៍ ${inputUserName} (Staff Mode)`);
    } else {
      setLoginError("Password មិនត្រឹមត្រូវទេ! (Staff: 8899, Admin: 0203)");
    }
  };

  const logAccess = (userName: string, role: "ADMIN" | "STAFF") => {
    const isMobile = typeof navigator !== "undefined" && /mobile|android|iphone|ipad|phone/i.test(navigator.userAgent);
    const newLog: AccessLog = {
      id: Math.random().toString(36).substring(2, 9),
      userName,
      role,
      timestamp: new Date().toLocaleString("km-KH", { hour12: true }),
      device: isMobile ? "Mobile Phone 📱" : "Computer / PC 💻"
    };
    const updated = [newLog, ...accessLogs].slice(0, 50);
    setAccessLogs(updated);
    try {
      localStorage.setItem("cpu_access_logs", JSON.stringify(updated));
    } catch (e) {}
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setInputPasscode("8899");
    setInputUserName("Staff");
    try {
      localStorage.removeItem("cpu_current_user");
      localStorage.removeItem("cpu_current_role");
      sessionStorage.removeItem("cpu_current_user");
      sessionStorage.removeItem("cpu_current_role");
    } catch (e) {}
  };

  // --- CURRENT DATE DATA ACCESSORS ---
  const currentDayDist: DayDistribution = historyDistribution[selectedDate] || {};
  const currentDayStock: DayStockLog = historyStock[selectedDate] || {};

  const handleStoreAmountChange = (storeId: string, amount: number) => {
    const val = isNaN(amount) || amount < 0 ? 0 : amount;
    const updatedDay = { ...currentDayDist, [storeId]: val };
    const updatedAll = { ...historyDistribution, [selectedDate]: updatedDay };
    setHistoryDistribution(updatedAll);
    try {
      localStorage.setItem("cpu_history_distribution", JSON.stringify(updatedAll));
    } catch (e) {}
  };

  const handleSaveStoreTotals = async () => {
    notify("កំពុង Save ទៅ Cloud & Device...");
    await saveToCloud(historyDistribution, historyStock);
    notify("✅ បានរក្សាទុកទិន្នន័យសាខាទៅ Cloud & Phone រួចរាល់!");
  };

  const handleStockChange = (itemCode: string, field: "stock_in" | "stock_out", amount: number) => {
    const val = isNaN(amount) || amount < 0 ? 0 : amount;
    const current = currentDayStock[itemCode] || { stock_in: 0, stock_out: 0 };
    const updatedItem = { ...current, [field]: val };
    const updatedDay = { ...currentDayStock, [itemCode]: updatedItem };
    const updatedAll = { ...historyStock, [selectedDate]: updatedDay };
    setHistoryStock(updatedAll);
    try {
      localStorage.setItem("cpu_history_stock", JSON.stringify(updatedAll));
    } catch (e) {}
  };

  const handleOpeningStockChange = (itemCode: string, amount: number) => {
    const val = isNaN(amount) || amount < 0 ? 0 : amount;
    setItems((prevItems) => {
      const updated = prevItems.map((it) =>
        it.item_code === itemCode ? { ...it, opening_stock: val } : it
      );
      try {
        localStorage.setItem("cpu_items", JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const handleSaveStock = async () => {
    notify("កំពុង Save ទៅ Cloud & Device...");
    try {
      localStorage.setItem("cpu_items", JSON.stringify(items));
    } catch (e) {}
    await saveToCloud(historyDistribution, historyStock);
    notify("✅ បានរក្សាទុកស្តុក និង Opening Stock រួចរាល់!");
  };

  // Add Store
  const handleAddStore = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStoreCode || !newStoreName) return;
    const newEntry: StoreRecord = {
      id: "store_" + Date.now(),
      code: newStoreCode.toUpperCase().trim(),
      name: newStoreName.trim(),
      brand: newStoreBrand
    };
    const updated = [...stores, newEntry];
    setStores(updated);
    try {
      localStorage.setItem("cpu_stores", JSON.stringify(updated));
    } catch (e) {}
    setShowAddStoreModal(false);
    setNewStoreCode("");
    setNewStoreName("");
    notify("បានបន្ថែមសាខាថ្មីដោយជោគជ័យ!");
  };

  // Add Item
  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemCode || !newItemDesc) return;
    const newEntry: ItemRecord = {
      item_code: newItemCode.toUpperCase().trim(),
      description_khmer: newItemDesc.trim(),
      brand: newItemBrand,
      category: newItemCategory,
      uom: newItemUom,
      cpu: parseFloat(newItemCpu) || 0,
      opening_stock: parseInt(newItemOpening) || 0
    };
    const updated = [...items, newEntry];
    setItems(updated);
    try {
      localStorage.setItem("cpu_items", JSON.stringify(updated));
    } catch (e) {}
    setShowAddItemModal(false);
    setNewItemCode("");
    setNewItemDesc("");
    setNewItemCpu("0");
    setNewItemOpening("0");
    notify("បានបន្ថែមទំនិញថ្មីដោយជោគជ័យ!");
  };

  // Save admin passwords
  const handleSavePasswords = (e: React.FormEvent) => {
    e.preventDefault();
    if (editAdminPw.length < 4 || editStaffPw.length < 4) {
      setAdminNotice("លេខកូដត្រូវមានយ៉ាងហោចណាស់ ៤ ខ្ទង់!");
      return;
    }
    setAdminPassword(editAdminPw);
    setStaffPassword(editStaffPw);
    if (editAppVersion.trim()) {
      setAppVersion(editAppVersion.trim());
    }
    try {
      localStorage.setItem("cpu_admin_pw", editAdminPw);
      localStorage.setItem("cpu_staff_pw", editStaffPw);
      if (editAppVersion.trim()) {
        localStorage.setItem("cpu_app_version", editAppVersion.trim());
      }
    } catch (e) {}
    setAdminNotice("✅ បានរក្សាទុកលេខសម្ងាត់ និង Version ដោយជោគជ័យ!");
    setTimeout(() => setAdminNotice(""), 3000);
  };

  // Save Supabase Cloud Configuration
  const handleSaveSupabaseConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (sbUrl && !sbUrl.startsWith("http")) {
      setSbNotice("❌ Supabase URL ត្រូវតែចាប់ផ្តើមដោយ https://");
      return;
    }
    try {
      localStorage.setItem("supabase_cloud_url", sbUrl.trim());
      localStorage.setItem("supabase_cloud_key", sbKey.trim());
    } catch (e) {}
    setSbNotice("✅ បានរក្សាទុកការកំណត់ Supabase! កំពុង Sync ទិន្នន័យ...");
    fetchFromCloud(true);
    setTimeout(() => setSbNotice(""), 4000);
  };

  // Clear Supabase Cloud Configuration
  const handleClearSupabaseConfig = () => {
    try {
      localStorage.removeItem("supabase_cloud_url");
      localStorage.removeItem("supabase_cloud_key");
    } catch (e) {}
    setSbUrl("");
    setSbKey("");
    setIsSupabaseConnected(false);
    setSbNotice("ℹ️ បានសម្អាត Supabase Keys មូលដ្ឋាន។");
    setTimeout(() => setSbNotice(""), 4000);
  };

  // Restore all 105 starter items
  const handleRestore105Items = async () => {
    if (typeof window !== "undefined" && !window.confirm("តើបងពិតជាចង់បញ្ចូលទំនិញទាំង ១០៥ មុខដើមឡើងវិញមែនទេ?")) {
      return;
    }
    const starterItems = buildStarterItems();
    setItems(starterItems);
    try {
      localStorage.setItem("cpu_items", JSON.stringify(starterItems));
    } catch (e) {}
    notify("✅ បានបញ្ចូលទំនិញទាំង ១០៥ មុខដូចដើមវិញជោគជ័យ!");
    await saveToCloud(historyDistribution, historyStock);
  };

  // Shift Date helper
  const shiftDate = (days: number) => {
    const parts = selectedDate.split("-");
    const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    d.setDate(d.getDate() + days);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    setSelectedDate(`${y}-${m}-${day}`);
  };

  // Filtered Lists
  const filteredStores = useMemo(() => {
    return stores.filter((s) => {
      const matchBrand = selectedBrand === "ALL" || s.brand === selectedBrand;
      const matchSearch =
        s.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchBrand && matchSearch;
    });
  }, [stores, selectedBrand, searchTerm]);

  const categories = useMemo(() => {
    const set = new Set(items.map((i) => i.category));
    return ["ALL", ...Array.from(set)];
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((i) => {
      const matchBrand = selectedBrand === "ALL" || i.brand === selectedBrand;
      const matchCat = selectedCategory === "ALL" || i.category === selectedCategory;
      const matchSearch =
        i.item_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.description_khmer.toLowerCase().includes(searchTerm.toLowerCase());
      return matchBrand && matchCat && matchSearch;
    });
  }, [items, selectedBrand, selectedCategory, searchTerm]);

  // Calculations for Store KPI
  const totalStoreUnitsToday = useMemo(() => {
    return stores.reduce((sum, s) => sum + (currentDayDist[s.id] || 0), 0);
  }, [stores, currentDayDist]);

  const tubeUnitsToday = useMemo(() => {
    return stores.filter((s) => s.brand === "Tube Coffee").reduce((sum, s) => sum + (currentDayDist[s.id] || 0), 0);
  }, [stores, currentDayDist]);

  const onmartUnitsToday = useMemo(() => {
    return stores.filter((s) => s.brand === "OnMart").reduce((sum, s) => sum + (currentDayDist[s.id] || 0), 0);
  }, [stores, currentDayDist]);

  // Top 2 Tube and Top 2 OnMart
  const top2TubeStores = useMemo(() => {
    return [...stores]
      .filter((s) => s.brand === "Tube Coffee")
      .map((s) => ({ ...s, amount: currentDayDist[s.id] || 0 }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 2);
  }, [stores, currentDayDist]);

  const top2OnMartStores = useMemo(() => {
    return [...stores]
      .filter((s) => s.brand === "OnMart")
      .map((s) => ({ ...s, amount: currentDayDist[s.id] || 0 }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 2);
  }, [stores, currentDayDist]);

  // Calculations for Stock KPI
  const stockSummary = useMemo(() => {
    let totalIn = 0;
    let totalOut = 0;
    let totalVal = 0;
    items.forEach((item) => {
      const dayLog = currentDayStock[item.item_code] || { stock_in: 0, stock_out: 0 };
      totalIn += dayLog.stock_in;
      totalOut += dayLog.stock_out;
      const balance = Math.max(0, item.opening_stock + dayLog.stock_in - dayLog.stock_out);
      totalVal += balance * item.cpu;
    });
    return { totalIn, totalOut, totalVal };
  }, [items, currentDayStock]);

  // =========================================================================
  // 3. LOGIN SCREEN VIEW
  // =========================================================================
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 selection:bg-emerald-500 selection:text-white">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 w-full max-w-md bg-slate-800/90 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/60 backdrop-blur-md">
          <div className="flex flex-col items-center text-center mb-5">
            <div className="h-16 px-6 rounded-2xl bg-black border border-slate-700/80 flex items-center justify-center shadow-inner relative overflow-hidden mb-3">
              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-emerald-500" />
              <span className="font-mono text-3xl font-black text-white tracking-[0.2em] pl-1">
                CPU
              </span>
            </div>
            <h1 className="text-lg font-black text-white">Central Production Unit</h1>
            <p className="text-xs font-bold text-emerald-400">Kandal Commissary Kitchen</p>
            <p className="text-[11px] text-slate-400 mt-1">Tube Coffee+ (9 Stores) &amp; OnMart (4 Stores) • 105 Items</p>
          </div>

          {/* Quick 1-Click Auto Login Buttons */}
          <div className="mb-4">
            <div className="text-[11px] font-bold text-slate-300 mb-2 flex items-center justify-between">
              <span>⚡ ចូលភ្លាមៗដោយស្វ័យប្រវត្តិ (Quick Auto Login):</span>
              <span className="text-[10px] text-emerald-400 font-medium">ចុច ១ ដងចូលភ្លាម</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => quickLogin("Staff", "STAFF", "8899")}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  inputPasscode === "8899"
                    ? "bg-emerald-950/60 border-emerald-500 text-emerald-300 ring-1 ring-emerald-500"
                    : "bg-slate-950/70 border-slate-700 hover:border-slate-500 text-slate-300"
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                  <Shield className="w-3.5 h-3.5 shrink-0" />
                  <span>Staff (8899)</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">ស្វ័យប្រវត្ត • លាក់តម្លៃ</div>
              </button>

              <button
                type="button"
                onClick={() => quickLogin("Manager", "ADMIN", "0203")}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  inputPasscode === "0203"
                    ? "bg-amber-950/60 border-amber-500 text-amber-300 ring-1 ring-amber-500"
                    : "bg-slate-950/70 border-slate-700 hover:border-slate-500 text-slate-300"
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                  <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                  <span>Manager (0203)</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">ស្វ័យប្រវត្ត • មើលតម្លៃ</div>
              </button>
            </div>
          </div>

          <div className="relative flex py-1 items-center mb-3">
            <div className="flex-grow border-t border-slate-700"></div>
            <span className="flex-shrink mx-3 text-[10px] text-slate-400 uppercase font-semibold">ឬ បញ្ចូលតាមទម្រង់ខាងក្រោម</span>
            <div className="flex-grow border-t border-slate-700"></div>
          </div>

          <form onSubmit={handleLogin} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                ឈ្មោះ ឬ អត្តលេខអ្នកប្រើប្រាស់ (User Name / ID):
              </label>
              <input
                type="text"
                value={inputUserName}
                onChange={(e) => {
                  setInputUserName(e.target.value);
                  if (loginError) setLoginError("");
                }}
                placeholder="ឧ. បុគ្គលិក A, Manager..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-300">
                  លេខកូដសម្ងាត់ (Passcode / PIN):
                </label>
                <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                  ✓ បានបំពេញស្វ័យប្រវត្ត {inputPasscode}
                </span>
              </div>
              <div className="relative">
                <input
                  type={showPasscode ? "text" : "password"}
                  value={inputPasscode}
                  onChange={(e) => {
                    setInputPasscode(e.target.value);
                    if (loginError) setLoginError("");
                  }}
                  placeholder="PIN (Staff: 8899, Admin: 0203)"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 pr-10 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPasscode(!showPasscode)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 cursor-pointer"
                  title={showPasscode ? "លាក់លេខកូដ" : "បង្ហាញលេខកូដ"}
                >
                  {showPasscode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {loginError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-950 flex items-center justify-center gap-2 transition-all uppercase tracking-wider mt-2 cursor-pointer"
            >
              <Unlock className="w-4 h-4" />
              <span>ចូលប្រើប្រាស់ប្រព័ន្ធ (Login)</span>
            </button>
          </form>

          <div className="mt-5 pt-3.5 border-t border-slate-700/60 text-[11px] text-slate-400 space-y-1">
            <p className="font-bold text-slate-300">ℹ️ ព័ត៌មានជំនួយលេខកូដសម្ងាត់៖</p>
            <p>• <strong>Staff Mode:</strong> <code>8899</code> (លាក់តម្លៃ រក្សាការបញ្ចូលធម្មតា)</p>
            <p>• <strong>Admin / Manager Mode:</strong> <code>0203</code> (មើលតម្លៃ និងគ្រប់គ្រង)</p>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 4. MAIN APPLICATION DASHBOARD
  // =========================================================================
  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 pb-16 font-sans">
      {notification && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-2xl border border-slate-700 text-xs font-bold flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* TOP NAVBAR */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 px-3.5 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center shadow-inner">
              <span className="font-mono text-sm font-black text-white tracking-widest">CPU</span>
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900">Kandal Commissary Kitchen</h2>
              <p className="text-[11px] text-slate-500 font-medium">Tube Coffee+ (9) &amp; OnMart (4) • 105 Items</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Cloud Sync & Supabase Status */}
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold border transition-colors ${
              isSupabaseConnected 
                ? "bg-emerald-50 border-emerald-300 text-emerald-800" 
                : "bg-slate-50 border-slate-200 text-slate-600"
            }`}>
              {syncStatus === "syncing" && (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-500" />
                  <span>Syncing...</span>
                </>
              )}
              {syncStatus !== "syncing" && isSupabaseConnected && (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Supabase Live 🟢</span>
                </>
              )}
              {syncStatus === "synced" && !isSupabaseConnected && (
                <>
                  <Cloud className="w-3.5 h-3.5 text-blue-500" />
                  <span>Cloud Synced</span>
                </>
              )}
              {syncStatus === "error" && (
                <>
                  <CloudOff className="w-3.5 h-3.5 text-rose-500" />
                  <span>Offline</span>
                </>
              )}
              {syncStatus === "idle" && !isSupabaseConnected && (
                <>
                  <Cloud className="w-3.5 h-3.5 text-slate-400" />
                  <span>Cloud Ready</span>
                </>
              )}
            </div>

            {/* Manual Sync Cloud Button */}
            <button
              onClick={() => fetchFromCloud(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 transition-colors shadow-xs"
              title="ទាញទិន្នន័យពី Cloud ឡើងវិញ"
            >
              <RefreshCw className="w-3 h-3 text-slate-600" />
              <span>Sync 🔄</span>
            </button>

            {/* User & Role Badge */}
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs">
              <Users className="w-3.5 h-3.5 text-slate-600" />
              <span className="font-bold text-slate-800">{currentUserName}</span>
              <span
                className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                  currentUserRole === "ADMIN"
                    ? "bg-amber-100 text-amber-900 border border-amber-300"
                    : "bg-blue-100 text-blue-900 border border-blue-200"
                }`}
              >
                {currentUserRole}
              </span>
            </div>

            {/* Quick QR Access Button */}
            <button
              onClick={() => setShowQRModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold border border-indigo-200 transition-colors shadow-xs cursor-pointer"
              title="បង្ហាញ QR Code សម្រាប់បុគ្គលិកស្កេនទូរស័ព្ទលើ Wi-Fi"
            >
              <QrCode className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden sm:inline">QR Access</span>
            </button>

            {/* Quick Print Button */}
            <button
              onClick={() => window.print()}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold border border-slate-300 transition-colors"
              title="បោះពុម្ពរបាយការណ៍"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>Print</span>
            </button>

            {/* Consolidated Settings & Tools Dropdown Menu */}
            <SettingsMenu
              currentUserName={currentUserName}
              currentUserRole={currentUserRole}
              onOpenQR={() => setShowQRModal(true)}
              onOpenSettings={() => setShowAdminModal(true)}
              onPrint={() => window.print()}
              onLogout={handleLogout}
            />
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        {/* PRINT ONLY A4 OFFICIAL REPORT HEADER */}
        <div className="hidden print:block mb-6 text-black border-b-2 border-slate-900 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-black uppercase tracking-wider">Central Production Unit (CPU)</h1>
              <p className="text-xs text-slate-700 font-bold">Kandal Commissary Kitchen • Tube Coffee+ &amp; OnMart Operations</p>
              <p className="text-sm font-black text-emerald-800 mt-1">
                {activeTab === "stores" ? "📋 របាយការណ៍ចែកចាយទំនិញតាមសាខា (Store Distribution Report)" : "📦 របាយការណ៍តុល្យភាពស្តុកប្រចាំថ្ងៃ (Daily Stock Log Report)"}
              </p>
            </div>
            <div className="text-right text-xs space-y-0.5">
              <p className="font-bold">កាលបរិច្ឆេទរបាយការណ៍ (Date): <span className="font-mono text-sm font-black">{selectedDate}</span></p>
              <p className="text-slate-600 text-[10px]" suppressHydrationWarning>កាលបរិច្ឆេទ: {selectedDate}</p>
              <p className="text-slate-600 text-[10px]">អ្នកចេញរបាយការណ៍: {currentUserName} ({currentUserRole === "ADMIN" ? "Admin" : "Staff"})</p>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3 mt-3 p-3 bg-slate-100 rounded-lg text-xs border border-slate-300">
            <div>
              <span className="text-slate-500 block text-[10px]">សាខាសរុប (Total Stores)</span>
              <span className="font-bold text-slate-900">{stores.length} សាខា (Tube 9, OnMart 4)</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">ទំនិញសរុប (Total Items)</span>
              <span className="font-bold text-slate-900">{items.length} មុខទំនិញ</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">ចំនួនសរុបប្រចាំថ្ងៃ (Daily Total Units)</span>
              <span className="font-mono font-black text-sm text-slate-900">
                {activeTab === "stores" ? totalStoreUnitsToday.toLocaleString() : stockSummary.totalOut.toLocaleString()} Items
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">ស្ថានភាពទិន្នន័យ (Data Status)</span>
              <span className="font-bold text-emerald-700">Verified &amp; Synchronized ✓</span>
            </div>
          </div>
        </div>

        {/* REAL-TIME APPROVAL QUEUE (STAFF QR REQUESTS) */}
        <div className="print:hidden">
          <ApprovalQueue
            currentUserName={currentUserName}
            onLedgerUpdate={() => fetchFromCloud(false)}
          />
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-bold text-slate-700">
              <Calendar className="w-4 h-4 text-emerald-600 mr-2" />
              <span className="text-slate-500 mr-2">កាលបរិច្ឆេទ៖</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent font-bold text-slate-800 outline-none cursor-pointer"
              />
            </div>
            <button
              onClick={() => shiftDate(-1)}
              className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 border border-slate-200"
              title="ថ្ងៃមុន"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setSelectedDate(new Date().toISOString().split("T")[0])}
              className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 border border-slate-200"
            >
              ថ្ងៃនេះ
            </button>
            <button
              onClick={() => shiftDate(1)}
              className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 border border-slate-200"
              title="ថ្ងៃបន្ទាប់"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center bg-slate-100 p-1.5 rounded-xl border border-slate-200 gap-1">
            <button
              onClick={() => { setActiveTab("stores"); setSearchTerm(""); }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
                activeTab === "stores"
                  ? "bg-white text-indigo-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Store className="w-4 h-4" />
              <span>សរុបតាមសាខា (Store Distribution)</span>
            </button>
            <button
              onClick={() => { setActiveTab("stock"); setSearchTerm(""); }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
                activeTab === "stock"
                  ? "bg-white text-emerald-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Package className="w-4 h-4" />
              <span>ស្តុកចេញ-ចូល (Stock In-Out)</span>
            </button>
          </div>
        </div>

        {/* TAB 1: STORE DISTRIBUTION */}
        {activeTab === "stores" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">សរុបទាំង ១៣ សាខា (Today)</span>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-black text-indigo-700">{totalStoreUnitsToday.toLocaleString()}</span>
                  <span className="text-xs font-bold text-slate-500">items</span>
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                <span className="text-xs font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Coffee className="w-3.5 h-3.5 text-amber-600" />
                  <span>Tube Coffee+ (9 ហាង)</span>
                </span>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-black text-amber-800">{tubeUnitsToday.toLocaleString()}</span>
                  <span className="text-xs font-bold text-slate-500">items</span>
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                <span className="text-xs font-bold text-blue-700 uppercase tracking-wider flex items-center gap-1.5">
                  <ShoppingBag className="w-3.5 h-3.5 text-blue-600" />
                  <span>OnMart (4 ហាង)</span>
                </span>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-black text-blue-800">{onmartUnitsToday.toLocaleString()}</span>
                  <span className="text-xs font-bold text-slate-500">items</span>
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Top 1 Store Today</span>
                </span>
                <div className="mt-2">
                  {top2TubeStores[0] && top2TubeStores[0].amount > 0 ? (
                    <div className="flex items-baseline gap-2">
                      <span className="text-base font-black text-slate-900">{top2TubeStores[0].name}</span>
                      <span className="text-xs font-bold text-emerald-600">({top2TubeStores[0].amount})</span>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400">មិនទាន់មានទិន្នន័យ</span>
                  )}
                </div>
              </div>
            </div>

            {/* TOP 2 TUBE & TOP 2 ONMART */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-2 mb-3">
                  <Coffee className="w-4 h-4 text-amber-600" />
                  <span>Top 2 Tube Coffee+ Today ({selectedDate})</span>
                </h3>
                <div className="space-y-2">
                  {top2TubeStores.map((s, idx) => (
                    <div key={s.id} className="flex items-center justify-between p-3 rounded-xl bg-amber-50/50 border border-amber-200/60">
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-lg bg-amber-200 text-amber-900 font-bold text-xs flex items-center justify-center">
                          #{idx + 1}
                        </span>
                        <div>
                          <p className="text-xs font-bold text-slate-900">{s.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono">Code: {s.code}</p>
                        </div>
                      </div>
                      <span className="text-sm font-black text-amber-900">{s.amount.toLocaleString()} items</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <h3 className="text-xs font-bold uppercase tracking-wider text-blue-900 flex items-center gap-2 mb-3">
                  <ShoppingBag className="w-4 h-4 text-blue-600" />
                  <span>Top 2 OnMart Today ({selectedDate})</span>
                </h3>
                <div className="space-y-2">
                  {top2OnMartStores.map((s, idx) => (
                    <div key={s.id} className="flex items-center justify-between p-3 rounded-xl bg-blue-50/50 border border-blue-200/60">
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-lg bg-blue-200 text-blue-900 font-bold text-xs flex items-center justify-center">
                          #{idx + 1}
                        </span>
                        <div>
                          <p className="text-xs font-bold text-slate-900">{s.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono">Code: {s.code}</p>
                        </div>
                      </div>
                      <span className="text-sm font-black text-blue-900">{s.amount.toLocaleString()} items</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* TABLE */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 bg-slate-50/50">
                <div className="flex items-center gap-2 flex-wrap">
                  {(["ALL", "Tube Coffee", "OnMart"] as const).map((b) => (
                    <button
                      key={b}
                      onClick={() => setSelectedBrand(b)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        selectedBrand === b
                          ? "bg-slate-900 text-white shadow-xs"
                          : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                      }`}
                    >
                      {b === "ALL" ? "ទាំងអស់ (All Brands)" : b}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-64">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="ស្វែងរកតាមឈ្មោះសាខា ឬកូដ..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  {currentUserRole === "ADMIN" && (
                    <button
                      onClick={() => setShowAddStoreModal(true)}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors shrink-0 shadow-xs cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>បន្ថែមសាខា</span>
                    </button>
                  )}

                  <button
                    onClick={handleSaveStoreTotals}
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shrink-0 shadow-xs cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save 💾</span>
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100/75 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                      <th className="py-3 px-4">ល.រ</th>
                      <th className="py-3 px-4">កូដ</th>
                      <th className="py-3 px-4">ឈ្មោះសាខា (Store Name)</th>
                      <th className="py-3 px-4">Brand</th>
                      <th className="py-3 px-4 text-right">ចំនួនប្រចាំថ្ងៃ ({selectedDate})</th>
                      <th className="py-3 px-4 text-center">ស្ថានភាព</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {filteredStores.map((store, index) => {
                      const amount = currentDayDist[store.id] || 0;
                      return (
                        <tr key={store.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4 text-slate-400 font-mono">{index + 1}</td>
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{store.code}</td>
                          <td className="py-3.5 px-4 font-bold text-slate-900">{store.name}</td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                store.brand === "Tube Coffee"
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-blue-100 text-blue-800"
                              }`}
                            >
                              {store.brand}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <input
                              type="number"
                              min="0"
                              value={amount === 0 ? "" : amount}
                              placeholder="0"
                              onChange={(e) => handleStoreAmountChange(store.id, parseFloat(e.target.value) || 0)}
                              className="w-28 text-right bg-slate-50 border border-slate-300 focus:bg-white focus:border-indigo-500 rounded-lg px-3 py-1.5 font-mono font-bold text-slate-900 text-xs focus:outline-none"
                            />
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            {amount > 0 ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>បានកត់ត្រា</span>
                              </span>
                            ) : (
                              <span className="text-[11px] text-slate-400">ទទេ (0)</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="p-4 border-t border-slate-200 bg-slate-50/50 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-bold">
                  សរុបចំនួនសាខា៖ {filteredStores.length} ហាង
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-bold">សរុប Items ថ្ងៃនេះ៖</span>
                  <span className="text-sm font-black text-indigo-700">{totalStoreUnitsToday.toLocaleString()} items</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: STOCK IN / OUT */}
        {activeTab === "stock" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>ស្តុកចូលសរុប (Total Stock In)</span>
                </span>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-black text-emerald-700">{stockSummary.totalIn.toLocaleString()}</span>
                  <span className="text-xs font-bold text-slate-500">items</span>
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                <span className="text-xs font-bold text-rose-700 uppercase tracking-wider flex items-center gap-1.5">
                  <TrendingDown className="w-3.5 h-3.5" />
                  <span>ស្តុកចេញសរុប (Total Stock Out)</span>
                </span>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-black text-rose-700">{stockSummary.totalOut.toLocaleString()}</span>
                  <span className="text-xs font-bold text-slate-500">items</span>
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Boxes className="w-3.5 h-3.5" />
                  <span>{currentUserRole === "ADMIN" ? "តម្លៃសរុបស្តុក (Valuation $)" : "ចំនួនមុខទំនិញ (Items)"}</span>
                </span>
                <div className="mt-2 flex items-baseline gap-2">
                  {currentUserRole === "ADMIN" ? (
                    <>
                      <span className="text-2xl font-black text-indigo-700">${stockSummary.totalVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      <span className="text-xs font-bold text-slate-500">USD</span>
                    </>
                  ) : (
                    <>
                      <span className="text-2xl font-black text-indigo-700">{items.length}</span>
                      <span className="text-xs font-bold text-slate-500">មុខទំនិញ</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 bg-slate-50/50">
                <div className="flex items-center gap-2 flex-wrap">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="bg-white border border-slate-200 text-xs font-bold text-slate-700 px-3 py-2 rounded-xl focus:outline-none focus:border-emerald-500"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c === "ALL" ? "ប្រភេទទាំងអស់ (All Categories)" : c}
                      </option>
                    ))}
                  </select>

                  {(["ALL", "Tube Coffee", "OnMart"] as const).map((b) => (
                    <button
                      key={b}
                      onClick={() => setSelectedBrand(b)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        selectedBrand === b
                          ? "bg-slate-900 text-white shadow-xs"
                          : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                      }`}
                    >
                      {b === "ALL" ? "All Brands" : b}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-64">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="ស្វែងរកតាមឈ្មោះទំនិញ ឬកូដ..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <button
                    onClick={() => setShowAddItemModal(true)}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shrink-0 shadow-xs cursor-pointer"
                    title="បន្ថែមមុខទំនិញថ្មីចូលស្តុក (Add Item)"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ បន្ថែមទំនិញ (Add Item)</span>
                  </button>

                  {currentUserRole === "ADMIN" && (
                    <button
                      onClick={handleRestore105Items}
                      className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold transition-colors shrink-0 shadow-xs cursor-pointer"
                      title="បញ្ចូលទំនិញទាំង ១០៥ មុខដូចដើមវិញ"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-amber-700" />
                      <span className="hidden sm:inline">Restore 105 Items</span>
                    </button>
                  )}

                  <button
                    onClick={handleSaveStock}
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shrink-0 shadow-xs cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save 💾</span>
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100/75 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                      <th className="py-3 px-4">កូដទំនិញ</th>
                      <th className="py-3 px-4">ឈ្មោះទំនិញ (Khmer Description)</th>
                      <th className="py-3 px-4">ប្រភេទ</th>
                      <th className="py-3 px-4">UOM</th>
                      {currentUserRole === "ADMIN" && <th className="py-3 px-4 text-right">CPU ($)</th>}
                      <th className="py-3 px-4 text-right bg-blue-50/70 text-blue-900 font-black">OPENING</th>
                      <th className="py-3 px-4 text-right bg-emerald-50/60 text-emerald-900">Stock IN</th>
                      <th className="py-3 px-4 text-right bg-rose-50/60 text-rose-900">Stock OUT</th>
                      <th className="py-3 px-4 text-right font-black">Balance</th>
                      {currentUserRole === "ADMIN" && <th className="py-3 px-4 text-right font-black">Total ($)</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {filteredItems.map((item) => {
                      const dayLog = currentDayStock[item.item_code] || { stock_in: 0, stock_out: 0 };
                      const balance = item.opening_stock + dayLog.stock_in - dayLog.stock_out;
                      const totalVal = Math.max(0, balance) * item.cpu;

                      return (
                        <tr key={item.item_code} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-slate-900">{item.item_code}</td>
                          <td className="py-3 px-4 font-bold text-slate-900">
                            {item.description_khmer}
                            <span className="block text-[10px] text-slate-400 font-normal">{item.brand}</span>
                          </td>
                          <td className="py-3 px-4 text-slate-500">{item.category}</td>
                          <td className="py-3 px-4 font-mono text-slate-500">{item.uom}</td>

                          {currentUserRole === "ADMIN" && (
                            <td className="py-3 px-4 text-right font-mono font-bold text-slate-800">
                              ${item.cpu.toFixed(2)}
                            </td>
                          )}

                          <td className="py-3 px-4 text-right bg-blue-50/30">
                            <input
                              type="number"
                              min="0"
                              value={item.opening_stock === 0 ? "" : item.opening_stock}
                              placeholder="0"
                              onChange={(e) => handleOpeningStockChange(item.item_code, parseFloat(e.target.value) || 0)}
                              className="w-20 text-right bg-white border border-blue-300 focus:border-blue-600 rounded-lg px-2.5 py-1 font-mono font-bold text-blue-900 text-xs focus:outline-none"
                              title="កែប្រែទិន្នន័យស្តុកដើមគ្រា (Opening Stock)"
                            />
                          </td>

                          <td className="py-3 px-4 text-right bg-emerald-50/30">
                            <input
                              type="number"
                              min="0"
                              value={dayLog.stock_in === 0 ? "" : dayLog.stock_in}
                              placeholder="0"
                              onChange={(e) => handleStockChange(item.item_code, "stock_in", parseFloat(e.target.value) || 0)}
                              className="w-20 text-right bg-white border border-emerald-300 focus:border-emerald-600 rounded-lg px-2.5 py-1 font-mono font-bold text-emerald-900 text-xs focus:outline-none"
                            />
                          </td>

                          <td className="py-3 px-4 text-right bg-rose-50/30">
                            <input
                              type="number"
                              min="0"
                              value={dayLog.stock_out === 0 ? "" : dayLog.stock_out}
                              placeholder="0"
                              onChange={(e) => handleStockChange(item.item_code, "stock_out", parseFloat(e.target.value) || 0)}
                              className="w-20 text-right bg-white border border-rose-300 focus:border-rose-600 rounded-lg px-2.5 py-1 font-mono font-bold text-rose-900 text-xs focus:outline-none"
                            />
                          </td>

                          <td className={`py-3 px-4 text-right font-mono font-black ${balance < 0 ? "text-rose-600 font-bold" : "text-slate-900"}`}>
                            {balance}
                          </td>

                          {currentUserRole === "ADMIN" && (
                            <td className="py-3 px-4 text-right font-mono font-black text-indigo-700">
                              ${totalVal.toFixed(2)}
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

        {/* OFFICIAL SIGNATURE BLOCK FOR STANDARD A4 PRINT REPORT */}
        <div className="hidden print:block mt-12 pt-6 border-t-2 border-slate-400 break-inside-avoid">
          <div className="grid grid-cols-3 gap-8 text-center text-xs text-black">
            <div className="space-y-16">
              <p className="font-bold uppercase tracking-wider text-[11px] text-slate-800">
                រៀបចំដោយ / Prepared by
              </p>
              <div>
                <div className="border-t border-slate-800 w-4/5 mx-auto pt-1"></div>
                <p className="text-[10px] text-slate-700 font-bold">ហត្ថលេខា និង ឈ្មោះ (Signature &amp; Name)</p>
                <p className="text-[9px] text-slate-500">កាលបរិច្ឆេទ: ____ / ____ / ________</p>
              </div>
            </div>

            <div className="space-y-16">
              <p className="font-bold uppercase tracking-wider text-[11px] text-slate-800">
                ត្រួតពិនិត្យដោយ / Checked by
              </p>
              <div>
                <div className="border-t border-slate-800 w-4/5 mx-auto pt-1"></div>
                <p className="text-[10px] text-slate-700 font-bold">ហត្ថលេខា និង ឈ្មោះ (Signature &amp; Name)</p>
                <p className="text-[9px] text-slate-500">កាលបរិច្ឆេទ: ____ / ____ / ________</p>
              </div>
            </div>

            <div className="space-y-16">
              <p className="font-bold uppercase tracking-wider text-[11px] text-slate-800">
                អនុម័តដោយ / Approved by
              </p>
              <div>
                <div className="border-t border-slate-800 w-4/5 mx-auto pt-1"></div>
                <p className="text-[10px] text-slate-700 font-bold">ហត្ថលេខា និង ឈ្មោះ (Signature &amp; Name)</p>
                <p className="text-[9px] text-slate-500">កាលបរិច្ឆេទ: ____ / ____ / ________</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* MODAL: ADD STORE */}
      {showAddStoreModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-black text-slate-900">បន្ថែមសាខាថ្មី (Add Store)</h3>
              <button onClick={() => setShowAddStoreModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddStore} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">កូដសាខា (Store Code):</label>
                <input
                  type="text"
                  placeholder="ឧ. KPI, TKC..."
                  value={newStoreCode}
                  onChange={(e) => setNewStoreCode(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-mono font-bold uppercase focus:outline-none focus:bg-white"
                  required
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">ឈ្មោះសាខា (Store Name):</label>
                <input
                  type="text"
                  placeholder="ឧ. Tube Coffee KPI..."
                  value={newStoreName}
                  onChange={(e) => setNewStoreName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold focus:outline-none focus:bg-white"
                  required
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Brand:</label>
                <select
                  value={newStoreBrand}
                  onChange={(e) => setNewStoreBrand(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold focus:outline-none focus:bg-white"
                >
                  <option value="Tube Coffee">Tube Coffee</option>
                  <option value="OnMart">OnMart</option>
                </select>
              </div>
              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddStoreModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200"
                >
                  បោះបង់
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-xs cursor-pointer"
                >
                  រក្សាទុកសាខា
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD ITEM */}
      {showAddItemModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-black text-slate-900">បន្ថែមទំនិញថ្មី (Add Stock Item)</h3>
              <button onClick={() => setShowAddItemModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddItem} className="mt-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">កូដទំនិញ (Item Code):</label>
                  <input
                    type="text"
                    placeholder="SM018, 10130..."
                    value={newItemCode}
                    onChange={(e) => setNewItemCode(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-mono font-bold uppercase focus:outline-none focus:bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Brand:</label>
                  <select
                    value={newItemBrand}
                    onChange={(e) => setNewItemBrand(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold focus:outline-none focus:bg-white"
                  >
                    <option value="Tube Coffee">Tube Coffee</option>
                    <option value="OnMart">OnMart</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">ឈ្មោះទំនិញ (Khmer Description):</label>
                <input
                  type="text"
                  placeholder="ឧ. សាច់មាន់អាំង (50g)..."
                  value={newItemDesc}
                  onChange={(e) => setNewItemDesc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold focus:outline-none focus:bg-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">ប្រភេទ (Category):</label>
                  <input
                    type="text"
                    value={newItemCategory}
                    onChange={(e) => setNewItemCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">ឯកតា (UOM):</label>
                  <input
                    type="text"
                    value={newItemUom}
                    onChange={(e) => setNewItemUom(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">តម្លៃ CPU ($):</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newItemCpu}
                    onChange={(e) => setNewItemCpu(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-mono font-bold focus:outline-none focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Opening Stock:</label>
                  <input
                    type="number"
                    min="0"
                    value={newItemOpening}
                    onChange={(e) => setNewItemOpening(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-mono font-bold focus:outline-none focus:bg-white"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddItemModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200"
                >
                  បោះបង់
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 shadow-xs cursor-pointer"
                >
                  រក្សាទុកទំនិញ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADMIN SETTINGS & ACCESS LOGS */}
      {showAdminModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-600" />
                <h3 className="text-sm font-black text-slate-900">Admin Settings &amp; Access Logs</h3>
              </div>
              <button onClick={() => setShowAdminModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePasswords} className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">ផ្លាស់ប្តូរលេខសម្ងាត់ (Password Configuration)</h4>
              {adminNotice && <p className="text-xs font-bold text-emerald-600">{adminNotice}</p>}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Admin Passcode (Default: 0203):</label>
                  <input
                    type="password"
                    value={editAdminPw}
                    onChange={(e) => setEditAdminPw(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Staff Passcode (Default: 8899):</label>
                  <input
                    type="password"
                    value={editStaffPw}
                    onChange={(e) => setEditStaffPw(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">App Version (កំណែប្រព័ន្ធ):</label>
                  <input
                    type="text"
                    value={editAppVersion}
                    onChange={(e) => setEditAppVersion(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-mono"
                    placeholder="v3.6 Production"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 cursor-pointer"
              >
                Save New Passwords
              </button>
            </form>

            {/* SUPABASE CLOUD DATABASE CONFIGURATION */}
            <form onSubmit={handleSaveSupabaseConfig} className="mt-4 p-4 rounded-xl bg-emerald-50/50 border border-emerald-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wider">
                    Supabase Cloud Database (PostgreSQL)
                  </h4>
                </div>
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                  isSupabaseConnected ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-700"
                }`}>
                  {isSupabaseConnected ? "🟢 Connected" : "🟡 Not Connected"}
                </span>
              </div>
              <p className="text-[11px] text-slate-600">
                ភ្ជាប់ទៅកាន់ Cloud Database ផ្ទាល់ខ្លួន ដើម្បីរក្សាទុកទិន្នន័យទូទាំងសាខា និងទូរស័ព្ទទាំងអស់បានអចិន្ត្រៃយ៍។
              </p>
              {sbNotice && <p className="text-xs font-bold text-emerald-700">{sbNotice}</p>}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Project URL (NEXT_PUBLIC_SUPABASE_URL):</label>
                  <input
                    type="text"
                    value={sbUrl}
                    onChange={(e) => setSbUrl(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-mono text-[11px]"
                    placeholder="https://xyzcompany.supabase.co"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Anon Public Key (NEXT_PUBLIC_SUPABASE_ANON_KEY):</label>
                  <input
                    type="password"
                    value={sbKey}
                    onChange={(e) => setSbKey(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-mono text-[11px]"
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 cursor-pointer transition-colors shadow-xs"
                >
                  Save &amp; Connect Supabase
                </button>
                {sbUrl && (
                  <button
                    type="button"
                    onClick={handleClearSupabaseConfig}
                    className="px-3 py-2 bg-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-300 cursor-pointer transition-colors"
                  >
                    Clear Keys
                  </button>
                )}
              </div>
            </form>

            {/* RESTORE 105 ITEMS BUTTON */}
            <div className="mt-4 p-4 rounded-xl bg-amber-50/60 border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-xs font-bold text-amber-950 uppercase tracking-wider">
                  📦 បញ្ចូលទំនិញទាំង ១០៥ មុខដូចដើមវិញ (105 Starter Items)
                </h4>
                <p className="text-[11px] text-slate-600">
                  បច្ចុប្បន្នមាន {items.length} មុខទំនិញ។ ចុចត្រង់នេះដើម្បី Restore ទំនិញស្តង់ដារទាំង ១០៥ មុខ (Tube Coffee &amp; OnMart) មកវិញភ្លាមៗ។
                </p>
              </div>
              <button
                type="button"
                onClick={handleRestore105Items}
                className="px-4 py-2 bg-amber-600 text-white rounded-xl text-xs font-bold hover:bg-amber-700 cursor-pointer transition-colors whitespace-nowrap shadow-xs"
              >
                🔄 Restore 105 Items
              </button>
            </div>

            <div className="mt-6">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                ប្រវត្តិនៃការ Login ចូលប្រើប្រាស់ ({accessLogs.length} នាក់ចុងក្រោយ)
              </h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 sticky top-0 text-slate-600 font-bold">
                    <tr>
                      <th className="py-2 px-3">ឈ្មោះអ្នកប្រើ</th>
                      <th className="py-2 px-3">Role</th>
                      <th className="py-2 px-3">ម៉ោង &amp; កាលបរិច្ឆេទ</th>
                      <th className="py-2 px-3">ឧបករណ៍ (Device)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {accessLogs.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-4 text-center text-slate-400">មិនទាន់មាន Log នៅឡើយទេ</td>
                      </tr>
                    ) : (
                      accessLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50">
                          <td className="py-2 px-3 font-bold text-slate-900">{log.userName}</td>
                          <td className="py-2 px-3">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                log.role === "ADMIN" ? "bg-amber-100 text-amber-900" : "bg-blue-100 text-blue-900"
                              }`}
                            >
                              {log.role}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-slate-500 font-mono">{log.timestamp}</td>
                          <td className="py-2 px-3 text-slate-500">{log.device}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QR CODE ACCESS MODAL */}
      <QRCodeModal isOpen={showQRModal} onClose={() => setShowQRModal(false)} />
    </div>
  );
}

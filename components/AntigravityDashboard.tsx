"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  Store,
  Package,
  TrendingUp,
  Award,
  Coffee,
  ShoppingBag,
  Save,
  CheckCircle2,
  Lock,
  Unlock,
  User,
  Settings,
  LogOut,
  Eye,
  EyeOff,
  Trash2,
  Plus,
  ShieldCheck,
  ShieldAlert,
  Printer,
  FileText,
  Search,
  RefreshCw,
  Boxes,
  DollarSign,
  ArrowRight,
  Home,
  BarChart3,
  Check
} from "lucide-react";

// ==========================================
// 1. DATA DEFINITIONS & TYPES
// ==========================================

export interface UserProfile {
  id: string;
  name: string;
  pin: string;
  role: "Admin" | "Manager" | "Staff";
  canViewFinancials: boolean;
}

export interface StoreData {
  id: string;
  name: string;
  code: string;
  brand: "Tube Coffee" | "OnMart";
  totalUnits: number;
}

export interface ItemData {
  item_code: string;
  description_khmer: string;
  brand: "Tube Coffee" | "OnMart";
  category: string;
  uom: string;
  cpu: number;
  stock_out_total: number;
  current_stock: number;
}

// Initial System Defaults
const INITIAL_USERS: UserProfile[] = [
  { id: "u1", name: "Thai Samnang", pin: "8888", role: "Admin", canViewFinancials: true },
  { id: "u2", name: "Manager", pin: "0203", role: "Admin", canViewFinancials: true },
  { id: "u3", name: "Kitchen Supervisor", pin: "1234", role: "Manager", canViewFinancials: false },
  { id: "u4", name: "Store Staff", pin: "8899", role: "Staff", canViewFinancials: false },
  { id: "u5", name: "Kitchen Operator", pin: "0000", role: "Staff", canViewFinancials: false }
];

const INITIAL_STORES: StoreData[] = [
  // Tube Coffee (9 Stores)
  { id: "s1", name: "Tube Coffee KPI", code: "KPI", brand: "Tube Coffee", totalUnits: 1450 },
  { id: "s2", name: "Tube Coffee TKC", code: "TKC", brand: "Tube Coffee", totalUnits: 1320 },
  { id: "s3", name: "Tube Coffee CCV", code: "CCV", brand: "Tube Coffee", totalUnits: 1180 },
  { id: "s4", name: "Tube Coffee CDP", code: "CDP", brand: "Tube Coffee", totalUnits: 1050 },
  { id: "s5", name: "Tube Coffee CYH", code: "CYH", brand: "Tube Coffee", totalUnits: 980 },
  { id: "s6", name: "Tube Coffee KSH", code: "KSH", brand: "Tube Coffee", totalUnits: 920 },
  { id: "s7", name: "Tube Coffee CKD", code: "CKD", brand: "Tube Coffee", totalUnits: 890 },
  { id: "s8", name: "Tube Coffee 2K4", code: "2K4", brand: "Tube Coffee", totalUnits: 760 },
  { id: "s9", name: "Tube Coffee ATN", code: "ATN", brand: "Tube Coffee", totalUnits: 650 },
  // OnMart (4 Stores)
  { id: "s10", name: "OnMart POK", code: "POK", brand: "OnMart", totalUnits: 1120 },
  { id: "s11", name: "OnMart TK", code: "TK", brand: "OnMart", totalUnits: 940 },
  { id: "s12", name: "OnMart OU3", code: "OU3", brand: "OnMart", totalUnits: 710 },
  { id: "s13", name: "OnMart DT", code: "DT", brand: "OnMart", totalUnits: 580 }
];

const SAMPLE_ITEMS: ItemData[] = [
  { item_code: "SM017", description_khmer: "សាច់ជ្រូកអាំង (50g)", brand: "Tube Coffee", category: "Semi Product Meat", uom: "Pack", cpu: 0.85, stock_out_total: 2800, current_stock: 450 },
  { item_code: "D0011", description_khmer: "ពងមាន់ (1pcs)", brand: "Tube Coffee", category: "Dry Store", uom: "PCS", cpu: 0.12, stock_out_total: 2590, current_stock: 620 },
  { item_code: "SM010", description_khmer: "សាច់ គោ (50g)", brand: "Tube Coffee", category: "Semi Product Meat", uom: "Pack", cpu: 1.10, stock_out_total: 1240, current_stock: 310 },
  { item_code: "SM027", description_khmer: "សាច់ ភ្លៅមាន់ (200g)", brand: "Tube Coffee", category: "Semi Product Meat", uom: "Pack", cpu: 0.95, stock_out_total: 930, current_stock: 220 },
  { item_code: "SM013", description_khmer: "សាច់ ឡុកឡាក់ (80g)", brand: "Tube Coffee", category: "Semi Product Meat", uom: "Pack", cpu: 1.30, stock_out_total: 750, current_stock: 180 },
  { item_code: "SM032", description_khmer: "ស្លាបមាន់ប្រលាក់ (190g)", brand: "Tube Coffee", category: "Semi Product Meat", uom: "Pack", cpu: 0.90, stock_out_total: 640, current_stock: 140 },
  { item_code: "10160147", description_khmer: "ប្រហិតបង្កង (5stick)", brand: "OnMart", category: "Semi Product Sauce", uom: "Pack", cpu: 1.20, stock_out_total: 450, current_stock: 90 },
  { item_code: "10150139", description_khmer: "ស្ពៃក្តោប (500g)", brand: "OnMart", category: "Dry Store", uom: "Pack", cpu: 0.60, stock_out_total: 420, current_stock: 130 },
  { item_code: "S0031", description_khmer: "ទឹកខ្លាញ់ស្រូបបាយសាច់ជ្រូក (200g)", brand: "Tube Coffee", category: "Semi Product Sauce", uom: "Pack", cpu: 0.50, stock_out_total: 326, current_stock: 85 },
  { item_code: "S0046", description_khmer: "លត (1000g)", brand: "Tube Coffee", category: "Daily Product", uom: "Pack", cpu: 0.70, stock_out_total: 310, current_stock: 75 }
];

export default function AntigravityDashboard() {
  // Persistence for user accounts
  const [users, setUsers] = useState<UserProfile[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("cpu_kitchen_users_v3");
        return saved ? JSON.parse(saved) : INITIAL_USERS;
      } catch (e) {
        return INITIAL_USERS;
      }
    }
    return INITIAL_USERS;
  });

  useEffect(() => {
    try {
      localStorage.setItem("cpu_kitchen_users_v3", JSON.stringify(users));
    } catch (e) {}
  }, [users]);

  // Auth State (All Locks Removed)
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(INITIAL_USERS[0]);
  const [selectedUserId, setSelectedUserId] = useState<string>("u1");
  const [enteredPin, setEnteredPin] = useState<string>("");
  const [showPin, setShowPin] = useState<boolean>(false);
  const [failedAttempts, setFailedAttempts] = useState<number>(0);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string>("");

  // App Navigation & Data
  const [activeTab, setActiveTab] = useState<"stores" | "items" | "report" | "settings">("stores");
  const [selectedBrand, setSelectedBrand] = useState<"ALL" | "Tube Coffee" | "OnMart">("ALL");
  const [stores, setStores] = useState<StoreData[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("cpu_kitchen_stores_v3");
        return saved ? JSON.parse(saved) : INITIAL_STORES;
      } catch (e) {
        return INITIAL_STORES;
      }
    }
    return INITIAL_STORES;
  });
  const [items, setItems] = useState<ItemData[]>(SAMPLE_ITEMS);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [savedAlert, setSavedAlert] = useState<boolean>(false);

  // New User Form State
  const [newUserName, setNewUserName] = useState<string>("");
  const [newUserPin, setNewUserPin] = useState<string>("");
  const [newUserRole, setNewUserRole] = useState<"Admin" | "Manager" | "Staff">("Staff");
  const [newUserCanViewFinance, setNewUserCanViewFinance] = useState<boolean>(false);

  // Login handler
  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isLocked) return;
    const foundUser = users.find((u) => u.id === selectedUserId && u.pin === enteredPin);

    if (foundUser) {
      setCurrentUser(foundUser);
      setEnteredPin("");
      setAuthError("");
      setFailedAttempts(0);
    } else {
      const updatedFail = failedAttempts + 1;
      setFailedAttempts(updatedFail);
      if (updatedFail >= 5) {
        setIsLocked(true);
        setAuthError("គណនីត្រូវបានចាក់សោរបណ្តោះអាសន្ន ដោយសារវាយលេខកូដខុស ៥ ដង!");
      } else {
        setAuthError(`លេខកូដ PIN មិនត្រឹមត្រូវ! នៅសល់ ${5 - updatedFail} ដងទៀត។`);
      }
    }
  };

  // Quick 1-Click Login
  const quickLogin = (user: UserProfile) => {
    setCurrentUser(user);
    setSelectedUserId(user.id);
    setEnteredPin("");
    setAuthError("");
    setFailedAttempts(0);
  };

  const handleLockTerminal = () => {
    setCurrentUser(users[0] || INITIAL_USERS[0]);
    setEnteredPin("");
    setSelectedUserId("u1");
    setAuthError("");
  };

  const toggleFinancialView = (userId: string) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, canViewFinancials: !u.canViewFinancials } : u))
    );
  };

  const handleDeleteUser = (userId: string) => {
    const adminCount = users.filter((u) => u.role === "Admin").length;
    const target = users.find((u) => u.id === userId);
    if (target?.role === "Admin" && adminCount <= 1) {
      alert("មិនអាចលុបគណនី Admin តែមួយគត់បានទេ!");
      return;
    }
    if (window.confirm(`តើអ្នកពិតជាចង់លុបគណនី "${target?.name}" មែនទេ?`)) {
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    }
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || newUserPin.length !== 4) {
      alert("សូមបញ្ចូលឈ្មោះ និងលេខ PIN ៤ ខ្ទង់ឱ្យបានត្រឹមត្រូវ!");
      return;
    }

    const newUser: UserProfile = {
      id: `u_${Date.now()}`,
      name: newUserName.trim(),
      pin: newUserPin.trim(),
      role: newUserRole,
      canViewFinancials: newUserCanViewFinance
    };

    setUsers((prev) => [...prev, newUser]);
    setNewUserName("");
    setNewUserPin("");
    setNewUserRole("Staff");
    setNewUserCanViewFinance(false);
    alert("បានបង្កើតគណនីថ្មីដោយជោគជ័យ!");
  };

  const handleStoreTotalChange = (id: string, value: number) => {
    const val = isNaN(value) || value < 0 ? 0 : value;
    setStores((prev) =>
      prev.map((s) => (s.id === id ? { ...s, totalUnits: val } : s))
    );
  };

  const handleSaveStores = () => {
    try {
      localStorage.setItem("cpu_kitchen_stores_v3", JSON.stringify(stores));
      setSavedAlert(true);
      setTimeout(() => setSavedAlert(false), 3000);
    } catch (e) {}
  };

  const handleNumClick = (digit: string) => {
    if (isLocked || enteredPin.length >= 4) return;
    setEnteredPin((prev) => prev + digit);
    setAuthError("");
  };

  const handleNumBackspace = () => {
    setEnteredPin((prev) => prev.slice(0, -1));
    setAuthError("");
  };

  const handleNumClear = () => {
    setEnteredPin("");
    setAuthError("");
  };

  // KPIs
  const totalDeliveredUnits = useMemo(() => {
    return stores.reduce((acc, s) => acc + s.totalUnits, 0);
  }, [stores]);

  const tubeCoffeeTotal = useMemo(() => {
    return stores
      .filter((s) => s.brand === "Tube Coffee")
      .reduce((acc, s) => acc + s.totalUnits, 0);
  }, [stores]);

  const onMartTotal = useMemo(() => {
    return stores
      .filter((s) => s.brand === "OnMart")
      .reduce((acc, s) => acc + s.totalUnits, 0);
  }, [stores]);

  const topStore = useMemo(() => {
    return [...stores].sort((a, b) => b.totalUnits - a.totalUnits)[0];
  }, [stores]);

  const totalFinancialValuation = useMemo(() => {
    return items.reduce((acc, it) => acc + (it.stock_out_total * it.cpu), 0);
  }, [items]);

  const filteredStores = useMemo(() => {
    return stores.filter((s) => {
      const matchBrand = selectedBrand === "ALL" || s.brand === selectedBrand;
      const matchSearch =
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.code.toLowerCase().includes(searchTerm.toLowerCase());
      return matchBrand && matchSearch;
    });
  }, [stores, selectedBrand, searchTerm]);

  const filteredItems = useMemo(() => {
    return items.filter((it) => {
      const matchBrand = selectedBrand === "ALL" || it.brand === selectedBrand;
      const matchSearch =
        it.item_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        it.description_khmer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        it.category.toLowerCase().includes(searchTerm.toLowerCase());
      return matchBrand && matchSearch;
    });
  }, [items, selectedBrand, searchTerm]);

  // ==========================================
  // VIEW: MAIN AUTHENTICATED DASHBOARD (ALL LOCKS REMOVED - DIRECT ACCESS)
  // ==========================================
  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 pb-16 font-sans">
      {savedAlert && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-2xl border border-slate-700 text-xs font-bold flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>✅ បានរក្សាទុកទិន្នន័យដោយជោគជ័យ!</span>
        </div>
      )}

      {/* 1. TOP NAVBAR (STRICTLY ONE LINE) */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex items-center justify-between gap-3 overflow-x-auto whitespace-nowrap">
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-xs">
              <Store className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-black text-slate-900">Antigravity Kitchen &amp; Store Tracker</h1>
              <span className="text-slate-300">•</span>
              <span className="text-[11px] text-slate-500 font-medium">Tube Coffee+ (9) &amp; OnMart (4)</span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Quick Links */}
            <Link
              href="/"
              className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 transition-colors shadow-2xs shrink-0"
              title="ទៅកាន់ Main Dashboard"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Main Dashboard</span>
            </Link>

            <Link
              href="/summary"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold border border-indigo-200 transition-colors shadow-2xs shrink-0"
              title="ទៅកាន់ Store Summary Tracker"
            >
              <BarChart3 className="w-3.5 h-3.5 text-indigo-600" />
              <span>Store Summary ↗</span>
            </Link>

            {/* Current User Badge */}
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs shrink-0">
              <User className="w-3.5 h-3.5 text-slate-600" />
              <span className="font-bold text-slate-800">{currentUser.name}</span>
              <span
                className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                  currentUser.role === "Admin"
                    ? "bg-purple-100 text-purple-900 border border-purple-300"
                    : currentUser.role === "Manager"
                    ? "bg-amber-100 text-amber-900 border border-amber-300"
                    : "bg-blue-100 text-blue-900 border border-blue-200"
                }`}
              >
                {currentUser.role}
              </span>
              {currentUser.canViewFinancials && (
                <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  $$$
                </span>
              )}
            </div>

            {/* Print Button */}
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold border border-slate-300 transition-colors shrink-0 cursor-pointer"
              title="បោះពុម្ពរបាយការណ៍"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>Print</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. MAIN CONTAINER */}
      <main className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Navigation Tabs Bar (STRICTLY ONE LINE) */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-3 sm:p-4 shadow-xs flex flex-row items-center justify-between gap-3 overflow-x-auto whitespace-nowrap print:hidden">
          <div className="flex items-center bg-slate-100 p-1.5 rounded-xl border border-slate-200 gap-1 shrink-0">
            <button
              onClick={() => { setActiveTab("stores"); setSearchTerm(""); }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === "stores"
                  ? "bg-white text-indigo-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Store className="w-4 h-4" />
              <span>សរុបតាមសាខា (Stores)</span>
            </button>

            <button
              onClick={() => { setActiveTab("items"); setSearchTerm(""); }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === "items"
                  ? "bg-white text-emerald-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Package className="w-4 h-4" />
              <span>ស្តុកទំនិញ (Items)</span>
            </button>

            <button
              onClick={() => setActiveTab("report")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === "report"
                  ? "bg-white text-amber-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>របាយការណ៍ (Report)</span>
            </button>

            <button
              onClick={() => setActiveTab("settings")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === "settings"
                  ? "bg-white text-purple-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>ការកំណត់ (Settings)</span>
            </button>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-bold text-slate-500">
              {stores.length} សាខា • {items.length} មុខទំនិញ
            </span>
          </div>
        </div>

        {/* TAB 1: STORES */}
        {activeTab === "stores" && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">សរុបទាំង ១៣ សាខា</span>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-black text-indigo-700">{totalDeliveredUnits.toLocaleString()}</span>
                  <span className="text-xs font-bold text-slate-500">items</span>
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                <span className="text-xs font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Coffee className="w-3.5 h-3.5 text-amber-600" />
                  <span>Tube Coffee+ (9 ហាង)</span>
                </span>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-black text-amber-800">{tubeCoffeeTotal.toLocaleString()}</span>
                  <span className="text-xs font-bold text-slate-500">items</span>
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                <span className="text-xs font-bold text-blue-700 uppercase tracking-wider flex items-center gap-1.5">
                  <ShoppingBag className="w-3.5 h-3.5 text-blue-600" />
                  <span>OnMart (4 ហាង)</span>
                </span>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-black text-blue-800">{onMartTotal.toLocaleString()}</span>
                  <span className="text-xs font-bold text-slate-500">items</span>
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Top Store</span>
                </span>
                <div className="mt-2">
                  {topStore ? (
                    <div className="flex items-baseline gap-2">
                      <span className="text-base font-black text-slate-900">{topStore.name}</span>
                      <span className="text-xs font-bold text-emerald-600">({topStore.totalUnits.toLocaleString()})</span>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400">គ្មានទិន្នន័យ</span>
                  )}
                </div>
              </div>
            </div>

            {/* Store Table Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-3 sm:p-4 border-b border-slate-200 flex flex-row items-center justify-between gap-3 overflow-x-auto whitespace-nowrap bg-slate-50/50">
                <div className="flex items-center gap-2 shrink-0">
                  {(["ALL", "Tube Coffee", "OnMart"] as const).map((b) => (
                    <button
                      key={b}
                      onClick={() => setSelectedBrand(b)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        selectedBrand === b
                          ? "bg-slate-900 text-white shadow-xs"
                          : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                      }`}
                    >
                      {b === "ALL" ? "ទាំងអស់ (All Brands)" : b}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="relative w-56 sm:w-64">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="ស្វែងរកតាមឈ្មោះសាខា ឬកូដ..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <button
                    onClick={handleSaveStores}
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
                      <th className="py-3 px-4 text-right">ចំនួន Units សរុប</th>
                      <th className="py-3 px-4 text-center">ស្ថានភាព</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {filteredStores.map((store, index) => (
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
                            value={store.totalUnits === 0 ? "" : store.totalUnits}
                            placeholder="0"
                            onChange={(e) => handleStoreTotalChange(store.id, parseFloat(e.target.value) || 0)}
                            className="w-28 text-right bg-slate-50 border border-slate-300 focus:bg-white focus:border-indigo-500 rounded-lg px-3 py-1.5 font-mono font-bold text-slate-900 text-xs focus:outline-none"
                          />
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {store.totalUnits > 0 ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>បានកត់ត្រា</span>
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400">ទទេ (0)</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-4 border-t border-slate-200 bg-slate-50/50 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-bold">
                  សរុបចំនួនសាខា៖ {filteredStores.length} ហាង
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-bold">សរុប Units ទាំងអស់៖</span>
                  <span className="text-sm font-black text-indigo-700">{totalDeliveredUnits.toLocaleString()} items</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ITEMS */}
        {activeTab === "items" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">ចំនួនមុខទំនិញសរុប</span>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-black text-indigo-700">{items.length}</span>
                  <span className="text-xs font-bold text-slate-500">មុខទំនិញ</span>
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                <span className="text-xs font-bold text-rose-700 uppercase tracking-wider flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-rose-600" />
                  <span>ស្តុកចេញសរុប (Total Stock Out)</span>
                </span>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-black text-rose-700">
                    {items.reduce((acc, it) => acc + it.stock_out_total, 0).toLocaleString()}
                  </span>
                  <span className="text-xs font-bold text-slate-500">units</span>
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                  <span>តម្លៃសរុប ($ Valuation)</span>
                </span>
                <div className="mt-2 flex items-baseline gap-2">
                  {currentUser.canViewFinancials ? (
                    <>
                      <span className="text-2xl font-black text-emerald-700">
                        ${totalFinancialValuation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                      <span className="text-xs font-bold text-slate-500">USD</span>
                    </>
                  ) : (
                    <span className="text-sm font-bold text-slate-400">🔒 លាក់តម្លៃ (Locked)</span>
                  )}
                </div>
              </div>
            </div>

            {/* Items Table Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-3 sm:p-4 border-b border-slate-200 flex flex-row items-center justify-between gap-3 overflow-x-auto whitespace-nowrap bg-slate-50/50">
                <div className="flex items-center gap-2 shrink-0">
                  {(["ALL", "Tube Coffee", "OnMart"] as const).map((b) => (
                    <button
                      key={b}
                      onClick={() => setSelectedBrand(b)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        selectedBrand === b
                          ? "bg-slate-900 text-white shadow-xs"
                          : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                      }`}
                    >
                      {b === "ALL" ? "All Brands" : b}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="relative w-56 sm:w-64">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="ស្វែងរកតាមឈ្មោះទំនិញ ឬកូដ..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100/75 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                      <th className="py-3 px-4">កូដទំនិញ</th>
                      <th className="py-3 px-4">ឈ្មោះទំនិញ (Khmer Description)</th>
                      <th className="py-3 px-4">Brand</th>
                      <th className="py-3 px-4">ប្រភេទ</th>
                      <th className="py-3 px-4">UOM</th>
                      {currentUser.canViewFinancials && (
                        <th className="py-3 px-4 text-right">CPU ($)</th>
                      )}
                      <th className="py-3 px-4 text-right">ស្តុកចេញសរុប</th>
                      <th className="py-3 px-4 text-right">ស្តុកបច្ចុប្បន្ន</th>
                      {currentUser.canViewFinancials && (
                        <th className="py-3 px-4 text-right font-black">សរុប ($)</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {filteredItems.map((item) => (
                      <tr key={item.item_code} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{item.item_code}</td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">{item.description_khmer}</td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              item.brand === "Tube Coffee"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {item.brand}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-500">{item.category}</td>
                        <td className="py-3.5 px-4 font-mono text-slate-500">{item.uom}</td>
                        {currentUser.canViewFinancials && (
                          <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-800">
                            ${item.cpu.toFixed(2)}
                          </td>
                        )}
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-rose-700">
                          {item.stock_out_total.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-700">
                          {item.current_stock.toLocaleString()}
                        </td>
                        {currentUser.canViewFinancials && (
                          <td className="py-3.5 px-4 text-right font-mono font-black text-indigo-700">
                            ${(item.stock_out_total * item.cpu).toFixed(2)}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: REPORT */}
        {activeTab === "report" && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
                <div>
                  <h2 className="text-lg font-black text-slate-900">
                    របាយការណ៍ប្រតិបត្តិការផ្ទះបាយកណ្តាល (Executive Kitchen Report)
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    Kandal Commissary Kitchen • Tube Coffee &amp; OnMart Operations
                  </p>
                </div>
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>បោះពុម្ពរបាយការណ៍ A4</span>
                </button>
              </div>

              {/* Summary Stats Table */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-xs font-bold text-slate-500 block">សរុប Units បែងចែក</span>
                  <span className="text-2xl font-black text-slate-900">{totalDeliveredUnits.toLocaleString()}</span>
                </div>
                <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200">
                  <span className="text-xs font-bold text-amber-800 block">Tube Coffee (9 ហាង)</span>
                  <span className="text-2xl font-black text-amber-900">{tubeCoffeeTotal.toLocaleString()}</span>
                </div>
                <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200">
                  <span className="text-xs font-bold text-blue-800 block">OnMart (4 ហាង)</span>
                  <span className="text-2xl font-black text-blue-900">{onMartTotal.toLocaleString()}</span>
                </div>
              </div>

              {/* Signatures */}
              <div className="pt-8 border-t border-slate-200">
                <div className="grid grid-cols-3 gap-6 text-center text-xs">
                  <div className="space-y-12">
                    <p className="font-bold text-slate-700">រៀបចំដោយ / Prepared by</p>
                    <div className="border-t border-slate-300 w-3/4 mx-auto pt-1 text-slate-500">
                      {currentUser.name}
                    </div>
                  </div>
                  <div className="space-y-12">
                    <p className="font-bold text-slate-700">ត្រួតពិនិត្យដោយ / Checked by</p>
                    <div className="border-t border-slate-300 w-3/4 mx-auto pt-1 text-slate-500">
                      Supervisor
                    </div>
                  </div>
                  <div className="space-y-12">
                    <p className="font-bold text-slate-700">អនុម័តដោយ / Approved by</p>
                    <div className="border-t border-slate-300 w-3/4 mx-auto pt-1 text-slate-500">
                      Manager / Owner
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: SETTINGS & USER MANAGEMENT */}
        {activeTab === "settings" && (
          <div className="space-y-6">
            {/* User List */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-sm font-black text-slate-900">គ្រប់គ្រងអ្នកប្រើប្រាស់ (User Management)</h3>
                </div>
                <span className="text-xs font-bold text-slate-500">{users.length} គណនីក្នុងប្រព័ន្ធ</span>
              </div>

              <div className="divide-y divide-slate-100">
                {users.map((u) => (
                  <div key={u.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                          u.role === "Admin"
                            ? "bg-purple-100 text-purple-700"
                            : u.role === "Manager"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">{u.name}</div>
                        <div className="text-[10px] text-slate-500">
                          Role: <span className="font-semibold text-slate-700">{u.role}</span> • PIN: <span className="font-mono font-bold text-slate-700">{u.pin}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleFinancialView(u.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          u.canViewFinancials
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {u.canViewFinancials ? "✓ មើលលុយ ($)" : "✕ លាក់លុយ ($)"}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteUser(u.id)}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="លុបគណនី"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Add User Form */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Plus className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-black text-slate-900">បន្ថែមអ្នកប្រើប្រាស់ថ្មី (Add New User)</h3>
              </div>

              <form onSubmit={handleAddUser} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">ឈ្មោះអ្នកប្រើប្រាស់ (Name):</label>
                    <input
                      type="text"
                      placeholder="ឧ. Sokha Staff..."
                      value={newUserName}
                      onChange={(e) => setNewUserName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold focus:outline-none focus:bg-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">លេខកូដ PIN ៤ ខ្ទង់ (4-digit PIN):</label>
                    <input
                      type="password"
                      maxLength={4}
                      placeholder="••••"
                      value={newUserPin}
                      onChange={(e) => {
                        if (/^\d*$/.test(e.target.value)) {
                          setNewUserPin(e.target.value);
                        }
                      }}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-mono font-bold text-center focus:outline-none focus:bg-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">តួនាទី (Role):</label>
                    <select
                      value={newUserRole}
                      onChange={(e) => setNewUserRole(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold focus:outline-none focus:bg-white"
                    >
                      <option value="Staff">Staff (បុគ្គលិក)</option>
                      <option value="Manager">Manager (ប្រធានផ្នែក)</option>
                      <option value="Admin">Admin (អ្នកគ្រប់គ្រង)</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="canViewFinance"
                    checked={newUserCanViewFinance}
                    onChange={(e) => setNewUserCanViewFinance(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="canViewFinance" className="font-bold text-slate-700 cursor-pointer">
                    អនុញ្ញាតឱ្យមើលតម្លៃទំនិញ និងទិន្នន័យហិរញ្ញវត្ថុ ($ CPU Financial Valuation)
                  </label>
                </div>

                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-xs transition-colors cursor-pointer"
                >
                  + បង្កើតគណនីថ្មី
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

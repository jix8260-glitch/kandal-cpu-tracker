"use client";

import React, { useState, useMemo, useEffect } from "react";
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
  Search,
  KeyRound,
  DollarSign,
  Layers,
  AlertCircle
} from "lucide-react";

// ==========================================
// 1. TYPES & INTERFACES
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

// គណនីលំនាំដើមពេលចាប់ផ្តើម
const INITIAL_USERS: UserProfile[] = [
  { id: "u1", name: "Thai Samnang", pin: "8888", role: "Admin", canViewFinancials: true },
  { id: "u2", name: "CPU Kitchen Lead", pin: "1234", role: "Manager", canViewFinancials: false },
  { id: "u3", name: "Store Staff", pin: "0000", role: "Staff", canViewFinancials: false }
];

const INITIAL_STORES: StoreData[] = [
  { id: "s1", name: "Tube Coffee KPI", code: "KPI", brand: "Tube Coffee", totalUnits: 1450 },
  { id: "s2", name: "Tube Coffee TKC", code: "TKC", brand: "Tube Coffee", totalUnits: 1320 },
  { id: "s3", name: "Tube Coffee CCV", code: "CCV", brand: "Tube Coffee", totalUnits: 1180 },
  { id: "s4", name: "Tube Coffee CDP", code: "CDP", brand: "Tube Coffee", totalUnits: 1050 },
  { id: "s5", name: "Tube Coffee CYH", code: "CYH", brand: "Tube Coffee", totalUnits: 980 },
  { id: "s6", name: "Tube Coffee KSH", code: "KSH", brand: "Tube Coffee", totalUnits: 920 },
  { id: "s7", name: "Tube Coffee CKD", code: "CKD", brand: "Tube Coffee", totalUnits: 890 },
  { id: "s8", name: "Tube Coffee 2K4", code: "2K4", brand: "Tube Coffee", totalUnits: 760 },
  { id: "s9", name: "Tube Coffee ATN", code: "ATN", brand: "Tube Coffee", totalUnits: 650 },
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
  { item_code: "10150139", description_khmer: "ស្ពៃក្តោប (500g)", brand: "OnMart", category: "Dry Store", uom: "Pack", cpu: 0.60, stock_out_total: 420, current_stock: 130 }
];

export default function AntigravityDashboard() {
  // Persistence សម្រាប់បញ្ជីអ្នកប្រើប្រាស់
  const [users, setUsers] = useState<UserProfile[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("kitchen_dashboard_users");
        return saved ? JSON.parse(saved) : INITIAL_USERS;
      } catch (e) {
        return INITIAL_USERS;
      }
    }
    return INITIAL_USERS;
  });

  useEffect(() => {
    try {
      localStorage.setItem("kitchen_dashboard_users", JSON.stringify(users));
    } catch (e) {}
  }, [users]);

  // Auth State
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string>("u1");
  const [enteredPin, setEnteredPin] = useState<string>("");
  const [showPin, setShowPin] = useState<boolean>(false);
  const [failedAttempts, setFailedAttempts] = useState<number>(0);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string>("");

  // App Navigation & Data State
  const [activeTab, setActiveTab] = useState<"stores" | "items" | "settings">("stores");
  const [selectedBrand, setSelectedBrand] = useState<"ALL" | "Tube Coffee" | "OnMart">("ALL");
  const [stores, setStores] = useState<StoreData[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("kitchen_dashboard_stores");
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

  // ផ្ទៀងផ្ទាត់ការ Login
  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isLocked) return;

    if (!selectedUserId) {
      setAuthError("សូមជ្រើសរើសគណនីអ្នកប្រើប្រាស់ជាមុនសិន!");
      return;
    }

    const foundUser = users.find((u) => u.id === selectedUserId && u.pin === enteredPin);

    if (foundUser) {
      setCurrentUser(foundUser);
      setEnteredPin("");
      setFailedAttempts(0);
      setAuthError("");
    } else {
      const updatedFail = failedAttempts + 1;
      setFailedAttempts(updatedFail);
      if (updatedFail >= 5) {
        setIsLocked(true);
        setAuthError("គណនីត្រូវបានចាក់សោរដោយសារវាយខុស ៥ ដង! សូមទាក់ទង Admin។");
      } else {
        setAuthError(`លេខកូដ PIN មិនត្រឹមត្រូវទេ! នៅសល់ ${5 - updatedFail} ដងទៀត។`);
      }
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setSelectedUserId("u1");
    setEnteredPin("");
    setAuthError("");
    setActiveTab("stores");
  };

  // Numpad input helper
  const handleNumClick = (num: string) => {
    if (isLocked) return;
    if (enteredPin.length < 4) {
      setEnteredPin((prev) => prev + num);
      setAuthError("");
    }
  };

  const handleNumBackspace = () => {
    setEnteredPin((prev) => prev.slice(0, -1));
    setAuthError("");
  };

  const handleNumClear = () => {
    setEnteredPin("");
    setAuthError("");
  };

  // Toggle សិទ្ធិមើលលុយ
  const toggleFinancialView = (userId: string) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, canViewFinancials: !u.canViewFinancials } : u))
    );
  };

  // លុបអ្នកប្រើប្រាស់
  const handleDeleteUser = (userId: string) => {
    const adminCount = users.filter((u) => u.role === "Admin").length;
    const target = users.find((u) => u.id === userId);
    if (target?.role === "Admin" && adminCount <= 1) {
      alert("មិនអាចលុប Admin តែមួយគត់ក្នុងប្រព័ន្ធបានទេ!");
      return;
    }
    if (window.confirm(`តើអ្នកប្រាកដថាចង់លុបគណនី "${target?.name}" មែនទេ?`)) {
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    }
  };

  // បន្ថែមអ្នកប្រើប្រាស់ថ្មី
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
    alert("បានបង្កើតគណនីជោគជ័យ!");
  };

  // កែប្រែចំនួន Units របស់សាខា
  const handleStoreUnitsChange = (storeId: string, val: number) => {
    const num = isNaN(val) || val < 0 ? 0 : val;
    setStores((prev) =>
      prev.map((s) => (s.id === storeId ? { ...s, totalUnits: num } : s))
    );
  };

  const handleSaveStores = () => {
    try {
      localStorage.setItem("kitchen_dashboard_stores", JSON.stringify(stores));
      setSavedAlert(true);
      setTimeout(() => setSavedAlert(false), 2500);
    } catch (e) {}
  };

  // គណនាទិន្នន័យ Dashboard
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
  // VIEW: AUTHENTICATION MODAL (LOCK SCREEN)
  // ==========================================
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-6 sm:p-8 space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white mx-auto flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Lock className="w-7 h-7" />
            </div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              ប្រព័ន្ធគ្រប់គ្រងផ្ទះបាយកណ្តាល
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Central Kitchen &amp; Store Distribution Dashboard
            </p>
          </div>

          {/* User Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700">
              ជ្រើសរើសគណនី (Select User) :
            </label>
            <div className="grid grid-cols-1 gap-2">
              {users.map((u) => {
                const isSelected = selectedUserId === u.id;
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => {
                      setSelectedUserId(u.id);
                      setEnteredPin("");
                      setAuthError("");
                    }}
                    className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? "bg-indigo-50/80 border-indigo-500 shadow-xs ring-2 ring-indigo-500/20"
                        : "bg-slate-50 border-slate-200 hover:bg-slate-100/70"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs ${
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
                        <div className="text-[10px] text-slate-500 flex items-center gap-1">
                          <span>{u.role}</span>
                          {u.canViewFinancials && (
                            <span className="text-emerald-600 font-bold">• មើលលុយ ($)</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                        u.role === "Admin"
                          ? "bg-purple-100 text-purple-800"
                          : u.role === "Manager"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {u.role}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* PIN Input Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700">
                  វាយបញ្ចូលលេខកូដ PIN ៤ ខ្ទង់ :
                </label>
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-semibold cursor-pointer"
                >
                  {showPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showPin ? "លាក់ PIN" : "បង្ហាញ PIN"}</span>
                </button>
              </div>

              {/* Pin Display / Input Box */}
              <div className="relative">
                <input
                  type={showPin ? "text" : "password"}
                  maxLength={4}
                  value={enteredPin}
                  onChange={(e) => {
                    if (/^\d*$/.test(e.target.value)) {
                      setEnteredPin(e.target.value);
                      setAuthError("");
                    }
                  }}
                  disabled={isLocked}
                  placeholder="••••"
                  className="w-full bg-slate-100 border border-slate-300 rounded-2xl py-3 px-4 text-center font-mono text-2xl font-black tracking-widest text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-none disabled:bg-slate-200"
                />
              </div>

              {/* Dot Indicators */}
              <div className="flex justify-center gap-3 mt-2.5">
                {[0, 1, 2, 3].map((idx) => (
                  <div
                    key={idx}
                    className={`w-3 h-3 rounded-full transition-all ${
                      enteredPin.length > idx
                        ? "bg-indigo-600 scale-110"
                        : "bg-slate-200"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Error Message */}
            {authError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2 animate-shake">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            {/* Touch Numpad */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((n) => (
                <button
                  key={n}
                  type="button"
                  disabled={isLocked}
                  onClick={() => handleNumClick(n)}
                  className="py-2.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 rounded-xl font-mono text-base font-bold text-slate-800 transition-all cursor-pointer disabled:opacity-50"
                >
                  {n}
                </button>
              ))}
              <button
                type="button"
                disabled={isLocked}
                onClick={handleNumClear}
                className="py-2.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 rounded-xl text-xs font-bold text-slate-600 transition-all cursor-pointer disabled:opacity-50"
              >
                Clear
              </button>
              <button
                type="button"
                disabled={isLocked}
                onClick={() => handleNumClick("0")}
                className="py-2.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 rounded-xl font-mono text-base font-bold text-slate-800 transition-all cursor-pointer disabled:opacity-50"
              >
                0
              </button>
              <button
                type="button"
                disabled={isLocked}
                onClick={handleNumBackspace}
                className="py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-600 transition-all cursor-pointer disabled:opacity-50"
              >
                ⌫
              </button>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLocked || enteredPin.length !== 4}
              className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white font-black text-sm shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Unlock className="w-4 h-4" />
              <span>ចូលប្រព័ន្ធ (Unlock &amp; Login)</span>
            </button>
          </form>

          {/* Demo Credentials Quick Guide */}
          <div className="pt-3 border-t border-slate-200/80 text-[11px] text-slate-500 text-center space-y-1">
            <span className="font-bold text-slate-600">លេខ PIN លំនាំដើម (Default PINs) :</span>
            <div className="flex justify-center gap-3 font-mono font-bold text-slate-700">
              <span>Admin: 8888</span>
              <span>•</span>
              <span>Manager: 1234</span>
              <span>•</span>
              <span>Staff: 0000</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW: MAIN AUTHENTICATED DASHBOARD
  // ==========================================
  return (
    <div className="min-h-screen bg-slate-50/50 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* 1. TOP NAVBAR & USER STATUS BAR */}
      <header className="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-indigo-500/20">
            <Store className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                Antigravity Kitchen &amp; Store Tracker
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                Live
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              គ្រប់គ្រងការផ្គត់ផ្គង់សាខាទាំង ១៣ (Tube Coffee 9 ហាង + OnMart 4 ហាង)
            </p>
          </div>
        </div>

        {/* Current User Pill & Logout */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200 py-1.5 px-3 rounded-2xl text-xs">
            <div
              className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs ${
                currentUser.role === "Admin"
                  ? "bg-purple-100 text-purple-700"
                  : currentUser.role === "Manager"
                  ? "bg-amber-100 text-amber-700"
                  : "bg-blue-100 text-blue-700"
              }`}
            >
              <User className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="font-black text-slate-900 leading-none">{currentUser.name}</div>
              <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                <span className="font-bold">{currentUser.role}</span>
                <span>•</span>
                {currentUser.canViewFinancials ? (
                  <span className="text-emerald-600 font-bold">Financials ($) ✓</span>
                ) : (
                  <span className="text-slate-400">Operations Only</span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95"
            title="ចាកចេញពីគណនី"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>ចាកចេញ</span>
          </button>
        </div>
      </header>

      {/* 2. EXECUTIVE KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Delivered */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>ទំនិញចែកចាយសរុប</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 mt-2 font-mono">
            {totalDeliveredUnits.toLocaleString()}{" "}
            <span className="text-xs font-bold text-slate-500">items</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">ចែកចាយទៅកាន់ ១៣ សាខា</div>
        </div>

        {/* Tube Coffee Total */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-amber-800 text-xs font-bold uppercase tracking-wider">
            <span>Tube Coffee+ (9 ហាង)</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <Coffee className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-amber-900 mt-2 font-mono">
            {tubeCoffeeTotal.toLocaleString()}{" "}
            <span className="text-xs font-bold text-slate-500">items</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {totalDeliveredUnits > 0
              ? `${((tubeCoffeeTotal / totalDeliveredUnits) * 100).toFixed(1)}% of output`
              : "0%"}
          </div>
        </div>

        {/* OnMart Total */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-blue-800 text-xs font-bold uppercase tracking-wider">
            <span>OnMart (4 ហាង)</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-blue-900 mt-2 font-mono">
            {onMartTotal.toLocaleString()}{" "}
            <span className="text-xs font-bold text-slate-500">items</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {totalDeliveredUnits > 0
              ? `${((onMartTotal / totalDeliveredUnits) * 100).toFixed(1)}% of output`
              : "0%"}
          </div>
        </div>

        {/* Top Store or Financial Valuation */}
        <div className="bg-slate-900 text-white p-5 rounded-3xl border border-slate-800 shadow-2xs relative overflow-hidden">
          {currentUser.canViewFinancials ? (
            <>
              <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
                <span>សរុបតម្លៃទំនិញ ($)</span>
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-black text-emerald-400 mt-2 font-mono">
                ${totalFinancialValuation.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">គិតតាមថ្លៃដើម CPU</div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
                <span>សាខាទទួលច្រើនជាងគេ</span>
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Award className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xl font-black text-amber-300 mt-2 truncate">
                {topStore?.name || "គ្មានទិន្នន័យ"}
              </div>
              <div className="text-[11px] text-slate-400 mt-1 font-mono font-bold">
                {topStore?.totalUnits.toLocaleString()} units
              </div>
            </>
          )}
        </div>
      </div>

      {/* 3. NAVIGATION CONTROLS & SEARCH */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 sm:p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Main Navigation Tabs */}
          <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200 gap-1 text-xs font-bold flex-wrap">
            <button
              onClick={() => setActiveTab("stores")}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
                activeTab === "stores"
                  ? "bg-indigo-600 text-white shadow-xs font-black"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              <span>១. ការបែងចែកតាមសាខា (Stores)</span>
            </button>

            <button
              onClick={() => setActiveTab("items")}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
                activeTab === "items"
                  ? "bg-indigo-600 text-white shadow-xs font-black"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>២. បញ្ជីទំនិញ &amp; ស្តុក (Items)</span>
            </button>

            {currentUser.role === "Admin" && (
              <button
                onClick={() => setActiveTab("settings")}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
                  activeTab === "settings"
                    ? "bg-purple-700 text-white shadow-xs font-black"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Settings className="w-3.5 h-3.5" />
                <span>៣. គ្រប់គ្រងអ្នកប្រើប្រាស់ (Settings)</span>
              </button>
            )}
          </div>

          {/* Quick Search */}
          <div className="relative min-w-[220px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="ស្វែងរកសាខា ឬទំនិញ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Brand Filters (Only for Stores & Items) */}
        {activeTab !== "settings" && (
          <div className="flex items-center justify-between border-t border-slate-100 pt-3 flex-wrap gap-2 text-xs">
            <div className="flex items-center gap-1.5 font-bold">
              <span className="text-slate-400 mr-1">Brand:</span>
              <button
                onClick={() => setSelectedBrand("ALL")}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  selectedBrand === "ALL"
                    ? "bg-slate-900 text-white font-black"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                All 13 Stores
              </button>
              <button
                onClick={() => setSelectedBrand("Tube Coffee")}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  selectedBrand === "Tube Coffee"
                    ? "bg-amber-600 text-white font-black"
                    : "bg-amber-50 text-amber-900 hover:bg-amber-100"
                }`}
              >
                Tube Coffee (9)
              </button>
              <button
                onClick={() => setSelectedBrand("OnMart")}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  selectedBrand === "OnMart"
                    ? "bg-blue-600 text-white font-black"
                    : "bg-blue-50 text-blue-900 hover:bg-blue-100"
                }`}
              >
                OnMart (4)
              </button>
            </div>

            {activeTab === "stores" && (
              <button
                onClick={handleSaveStores}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl font-bold transition-all cursor-pointer shadow-xs ${
                  savedAlert
                    ? "bg-emerald-600 text-white"
                    : "bg-indigo-600 hover:bg-indigo-700 text-white"
                }`}
              >
                {savedAlert ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>បានរក្សាទុក ✓</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Save 💾</span>
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>

      {/* 4. TAB CONTENT 1: STORES DISTRIBUTION */}
      {activeTab === "stores" && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Store className="w-4 h-4 text-indigo-600" />
              <span>តារាងចែកចាយទំនិញតាមសាខា ({filteredStores.length} ហាង)</span>
            </h2>
            <span className="text-xs text-slate-500 font-bold">
              សរុប៖ <strong className="text-indigo-700">{totalDeliveredUnits} units</strong>
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 w-14 text-center">ល.រ</th>
                  <th className="py-3 px-4 w-24">កូដសាខា</th>
                  <th className="py-3 px-4">ឈ្មោះសាខា (Store Name)</th>
                  <th className="py-3 px-4">Brand</th>
                  <th className="py-3 px-4 text-right w-40">ចំនួនទំនិញ (Units)</th>
                  <th className="py-3 px-4 text-right w-32">ភាគរយ (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredStores.map((store, index) => {
                  const isTube = store.brand === "Tube Coffee";
                  const sharePct =
                    totalDeliveredUnits > 0
                      ? ((store.totalUnits / totalDeliveredUnits) * 100).toFixed(1)
                      : "0";

                  return (
                    <tr key={store.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 text-center text-slate-400 font-mono">
                        {index + 1}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`font-mono font-black text-xs px-2 py-0.5 rounded-md ${
                            isTube
                              ? "bg-amber-100 text-amber-900 border border-amber-300"
                              : "bg-blue-100 text-blue-900 border border-blue-300"
                          }`}
                        >
                          {store.code}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">{store.name}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            isTube ? "bg-amber-50 text-amber-800" : "bg-blue-50 text-blue-800"
                          }`}
                        >
                          {store.brand}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <input
                          type="number"
                          min="0"
                          value={store.totalUnits}
                          onChange={(e) =>
                            handleStoreUnitsChange(store.id, parseFloat(e.target.value) || 0)
                          }
                          className="w-28 text-right bg-slate-50 border border-slate-300 focus:bg-white focus:border-indigo-500 rounded-lg px-2.5 py-1 font-mono font-bold text-slate-900 text-xs focus:outline-none"
                        />
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-600">
                        {sharePct}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-slate-50 font-bold text-slate-900 border-t border-slate-200">
                <tr>
                  <td colSpan={4} className="py-3 px-4 uppercase text-xs">
                    សរុបរួម (Grand Total)
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-black text-indigo-700 text-sm">
                    {totalDeliveredUnits.toLocaleString()} units
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-black text-slate-900">
                    100%
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* 5. TAB CONTENT 2: ITEMS INVENTORY */}
      {activeTab === "items" && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Package className="w-4 h-4 text-indigo-600" />
              <span>បញ្ជីទំនិញ និងតុល្យភាពស្តុក ({filteredItems.length} មុខ)</span>
            </h2>
            {currentUser.canViewFinancials && (
              <span className="text-xs text-emerald-700 font-bold">
                សរុបតម្លៃ ($)៖ <strong>${totalFinancialValuation.toFixed(2)}</strong>
              </span>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 w-24">Item Code</th>
                  <th className="py-3 px-4">Description (Khmer)</th>
                  <th className="py-3 px-4">Brand</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-2 text-center w-16">UoM</th>
                  <th className="py-3 px-4 text-right w-28">Current Stock</th>
                  <th className="py-3 px-4 text-right w-28">Stock Out</th>
                  {currentUser.canViewFinancials && (
                    <>
                      <th className="py-3 px-4 text-right w-24">CPU ($)</th>
                      <th className="py-3 px-4 text-right w-32 bg-emerald-50/50 text-emerald-900">
                        Valuation ($)
                      </th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredItems.map((item) => {
                  const isTube = item.brand === "Tube Coffee";
                  const valuation = item.stock_out_total * item.cpu;

                  return (
                    <tr key={item.item_code} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {item.item_code}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {item.description_khmer}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            isTube ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {item.brand}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500">{item.category}</td>
                      <td className="py-3 px-2 text-center font-bold text-slate-500">{item.uom}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-800">
                        {item.current_stock}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-indigo-700">
                        {item.stock_out_total}
                      </td>
                      {currentUser.canViewFinancials && (
                        <>
                          <td className="py-3 px-4 text-right font-mono text-slate-700">
                            ${item.cpu.toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700 bg-emerald-50/30">
                            ${valuation.toFixed(2)}
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. TAB CONTENT 3: SETTINGS & USER MANAGEMENT (ADMIN ONLY) */}
      {activeTab === "settings" && currentUser.role === "Admin" && (
        <div className="space-y-6">
          {/* Add New User Card */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-4">
            <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Plus className="w-4 h-4 text-indigo-600" />
              <span>បន្ថែមអ្នកប្រើប្រាស់ថ្មី (Add New User)</span>
            </h2>

            <form onSubmit={handleAddUser} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">ឈ្មោះអ្នកប្រើប្រាស់ (Name) *</label>
                <input
                  type="text"
                  placeholder="ឧ. John Doe"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">លេខកូដ PIN ៤ ខ្ទង់ *</label>
                <input
                  type="password"
                  maxLength={4}
                  placeholder="ឧ. 1234"
                  value={newUserPin}
                  onChange={(e) => {
                    if (/^\d*$/.test(e.target.value)) setNewUserPin(e.target.value);
                  }}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-mono text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">តួនាទី (Role) *</label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold text-slate-900 focus:bg-white focus:outline-none"
                >
                  <option value="Staff">Staff (បុគ្គលិកទូទៅ)</option>
                  <option value="Manager">Manager (ប្រធានផ្នែក)</option>
                  <option value="Admin">Admin (អ្នកគ្រប់គ្រងជាន់ខ្ពស់)</option>
                </select>
              </div>

              <div className="flex flex-col justify-end">
                <label className="flex items-center gap-2 font-bold text-slate-700 mb-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newUserCanViewFinance}
                    onChange={(e) => setNewUserCanViewFinance(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>អនុញ្ញាតឱ្យមើលលុយ ($)</span>
                </label>

                <button
                  type="submit"
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-xs transition-all cursor-pointer"
                >
                  + បង្កើតគណនី
                </button>
              </div>
            </form>
          </div>

          {/* Active Users Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-purple-600" />
                <span>បញ្ជីអ្នកប្រើប្រាស់សកម្មក្នុងប្រព័ន្ធ ({users.length} នាក់)</span>
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">ឈ្មោះ</th>
                    <th className="py-3 px-4">តួនាទី (Role)</th>
                    <th className="py-3 px-4 text-center">លេខ PIN</th>
                    <th className="py-3 px-4 text-center">សិទ្ធិមើលលុយ ($)</th>
                    <th className="py-3 px-4 text-center w-28">សកម្មភាព</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900">{u.name}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                            u.role === "Admin"
                              ? "bg-purple-100 text-purple-800"
                              : u.role === "Manager"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-slate-500">
                        ••••
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => toggleFinancialView(u.id)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                            u.canViewFinancials
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                              : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                          }`}
                        >
                          {u.canViewFinancials ? "អនុញ្ញាត ✓" : "បិទ ✕"}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleDeleteUser(u.id)}
                          className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5 inline mr-1" />
                          <span>លុប</span>
                        </button>
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

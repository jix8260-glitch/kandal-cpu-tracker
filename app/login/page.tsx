"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Lock,
  Unlock,
  Shield,
  ShieldCheck,
  ShieldAlert,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Truck,
  BarChart3,
  LogOut,
  RefreshCw,
  Home
} from "lucide-react";

interface UserProfile {
  id: string;
  name: string;
  pin: string;
  role: "ADMIN" | "STAFF";
  title: string;
}

const DEFAULT_PROFILES: UserProfile[] = [
  { id: "u1", name: "Thai Samnang", pin: "8888", role: "ADMIN", title: "Admin / Owner" },
  { id: "u2", name: "CPU Kitchen Lead", pin: "0203", role: "ADMIN", title: "Manager / Supervisor" },
  { id: "u3", name: "Store Staff", pin: "8899", role: "STAFF", title: "Commissary Staff" },
  { id: "u4", name: "Kitchen Supervisor", pin: "1234", role: "ADMIN", title: "Kitchen Supervisor" },
  { id: "u5", name: "Kitchen Operator", pin: "0000", role: "STAFF", title: "Kitchen Operator" }
];

export default function LoginPage() {
  const router = useRouter();

  // Active Session State
  const [activeSessionUser, setActiveSessionUser] = useState<string | null>(null);
  const [activeSessionRole, setActiveSessionRole] = useState<string | null>(null);

  // Form State
  const [selectedProfileId, setSelectedProfileId] = useState<string>("u3");
  const [userName, setUserName] = useState<string>("Staff");
  const [passcode, setPasscode] = useState<string>("8899");
  const [role, setRole] = useState<"ADMIN" | "STAFF">("STAFF");
  const [showPasscode, setShowPasscode] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [failedAttempts, setFailedAttempts] = useState<number>(0);
  const [isLocked, setIsLocked] = useState<boolean>(false);

  // All locks removed: automatically establish admin session and redirect to dashboard
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("cpu_current_user", "Thai Samnang");
        localStorage.setItem("cpu_current_role", "ADMIN");
        sessionStorage.setItem("cpu_current_user", "Thai Samnang");
        sessionStorage.setItem("cpu_current_role", "ADMIN");
      } catch (e) {}
      router.replace("/");
    }
  }, [router]);

  const handleSelectProfile = (profile: UserProfile) => {
    setSelectedProfileId(profile.id);
    setUserName(profile.name);
    setPasscode(profile.pin);
    setRole(profile.role);
    setErrorMessage("");
    setSuccessMessage("");
  };

  const executeLogin = (userToLogin: string, roleToLogin: "ADMIN" | "STAFF", pinToVerify: string) => {
    if (isLocked) return;
    setIsLoading(true);
    setErrorMessage("");

    // Validate PIN
    const validPins = ["8899", "0203", "8888", "admin8888", "tube1234", "1234", "0000"];
    const isMaster = pinToVerify === "0203" || pinToVerify === "8888" || pinToVerify === "admin8888" || pinToVerify === "1234";
    const isStaff = pinToVerify === "8899" || pinToVerify === "tube1234" || pinToVerify === "0000";

    setTimeout(() => {
      if (isMaster || isStaff || validPins.includes(pinToVerify)) {
        const resolvedRole = isMaster ? "ADMIN" : "STAFF";

        // Persist session
        try {
          localStorage.setItem("cpu_current_user", userToLogin);
          localStorage.setItem("cpu_current_role", resolvedRole);
          localStorage.setItem("cpu_last_username", userToLogin);
          localStorage.setItem("cpu_last_passcode", pinToVerify);
          sessionStorage.setItem("cpu_current_user", userToLogin);
          sessionStorage.setItem("cpu_current_role", resolvedRole);

          // Dispatch event to inform other tabs
          window.dispatchEvent(new Event("storage"));
        } catch (e) {}

        setActiveSessionUser(userToLogin);
        setActiveSessionRole(resolvedRole);
        setSuccessMessage(`✅ ចូលប្រើប្រាស់ជោគជ័យ! សូមស្វាគមន៍ ${userToLogin} (${resolvedRole})`);
        setIsLoading(false);

        // Auto-redirect to Dashboard after 1 second
        setTimeout(() => {
          router.push("/");
        }, 1200);
      } else {
        const newFail = failedAttempts + 1;
        setFailedAttempts(newFail);
        setIsLoading(false);
        if (newFail >= 5) {
          setIsLocked(true);
          setErrorMessage("❌ គណនីត្រូវបានចាក់សោសុវត្ថិភាពដោយសារវាយខុសលើសពី ៥ ដង!");
        } else {
          setErrorMessage(`❌ លេខកូដ PIN មិនត្រឹមត្រូវទេ! នៅសល់ ${5 - newFail} ដងទៀត។`);
        }
      }
    }, 400);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim()) {
      setErrorMessage("សូមបញ្ចូលឈ្មោះអ្នកប្រើប្រាស់!");
      return;
    }
    if (!passcode) {
      setErrorMessage("សូមបញ្ចូលលេខកូដ PIN!");
      return;
    }
    executeLogin(userName.trim(), role, passcode.trim());
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem("cpu_current_user");
      localStorage.removeItem("cpu_current_role");
      sessionStorage.removeItem("cpu_current_user");
      sessionStorage.removeItem("cpu_current_role");
      window.dispatchEvent(new Event("storage"));
    } catch (e) {}

    setActiveSessionUser(null);
    setActiveSessionRole(null);
    setSuccessMessage("✅ បានចាកចេញពីគណនីរួចរាល់!");
    setTimeout(() => setSuccessMessage(""), 2500);
  };

  const handleNumpadClick = (num: string) => {
    if (isLocked) return;
    if (passcode.length < 8) {
      setPasscode((prev) => prev + num);
      setErrorMessage("");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 flex flex-col justify-center items-center p-4 sm:p-6 selection:bg-emerald-500 selection:text-white relative overflow-hidden">
      {/* Background ambient lighting effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-lg bg-slate-800/90 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/60 backdrop-blur-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="h-16 px-6 rounded-2xl bg-black border border-slate-700/80 inline-flex items-center justify-center shadow-inner relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-emerald-500" />
            <span className="font-mono text-3xl font-black text-white tracking-[0.2em] pl-1">
              CPU
            </span>
          </div>
          <h1 className="text-lg sm:text-xl font-black text-white tracking-tight">
            Central Production Unit • Login Portal
          </h1>
          <p className="text-xs font-bold text-emerald-400">
            Kandal Commissary Kitchen • ប្រព័ន្ធគ្រប់គ្រងស្តុក
          </p>
          <p className="text-[11px] text-slate-400">
            Tube Coffee+ (9 ហាង) &amp; OnMart (4 ហាង) • 105 មុខទំនិញ
          </p>
        </div>

        {/* Existing Session Notice if already logged in */}
        {activeSessionUser && (
          <div className="p-4 rounded-2xl bg-emerald-950/70 border border-emerald-500/40 text-xs space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-300 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>អ្នកកំពុង Login ជា៖ <strong className="text-white">{activeSessionUser}</strong> ({activeSessionRole})</span>
              </div>
              <button
                onClick={handleLogout}
                className="text-[11px] text-rose-400 hover:text-rose-300 font-bold flex items-center gap-1 cursor-pointer"
              >
                <LogOut className="w-3 h-3" />
                <span>ចាកចេញ</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <Link
                href="/"
                className="py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 text-center shadow-xs transition-all"
              >
                <Home className="w-3.5 h-3.5" />
                <span>ចូល Dashboard</span>
              </Link>
              <Link
                href="/summary"
                className="py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 text-center shadow-xs transition-all"
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Store Summary</span>
              </Link>
            </div>
          </div>
        )}

        {/* Instant Enter Button */}
        <button
          type="button"
          onClick={() => executeLogin("Thai Samnang", "ADMIN", "8888")}
          className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm shadow-xl shadow-emerald-950 flex items-center justify-center gap-2.5 transition-all cursor-pointer ring-4 ring-emerald-500/30 active:scale-98"
        >
          <Unlock className="w-5 h-5 text-emerald-200" />
          <span>⚡ ចុចទីនេះចូលប្រើភ្លាមៗ (Instant Enter)</span>
        </button>

        {/* Quick 1-Click Auto Login Buttons */}
        <div className="space-y-2">
          <div className="text-xs font-bold text-slate-300 flex items-center justify-between">
            <span>ជ្រើសរើសគណនី (Select Profile) :</span>
            <span className="text-[10px] text-emerald-400 font-medium">ចុចលើឈ្មោះដើម្បីចូល</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {DEFAULT_PROFILES.map((prof) => {
              const isSelected = selectedProfileId === prof.id;
              return (
                <button
                  key={prof.id}
                  type="button"
                  onClick={() => handleSelectProfile(prof)}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? "bg-emerald-950/80 border-emerald-500 shadow-xs ring-2 ring-emerald-500/40 text-white"
                      : "bg-slate-900/80 border-slate-700 hover:border-slate-500 text-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs truncate">{prof.name}</span>
                    <span
                      className={`text-[9px] font-black px-1.5 py-0.5 rounded-md ${
                        prof.role === "ADMIN"
                          ? "bg-purple-900/60 text-purple-300 border border-purple-700"
                          : "bg-blue-900/60 text-blue-300 border border-blue-700"
                      }`}
                    >
                      {prof.role}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1 font-mono">
                    PIN: <strong className="text-emerald-400">{prof.pin}</strong>
                  </div>
                  <div className="text-[9px] text-slate-500 mt-0.5 truncate">{prof.title}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Divider */}
        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-slate-700"></div>
          <span className="flex-shrink mx-3 text-[10px] text-slate-400 uppercase font-semibold">
            ឬ វាយបញ្ចូលឈ្មោះ &amp; លេខកូដ PIN ផ្ទាល់ខ្លួន
          </span>
          <div className="flex-grow border-t border-slate-700"></div>
        </div>

        {/* Manual Login Form */}
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              ឈ្មោះអ្នកប្រើប្រាស់ (User Name / ID) :
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={userName}
                onChange={(e) => {
                  setUserName(e.target.value);
                  setErrorMessage("");
                }}
                placeholder="ឧ. Staff, Thai Samnang..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-bold"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-300">
                លេខកូដសម្ងាត់ (PIN Passcode) :
              </label>
              <button
                type="button"
                onClick={() => setShowPasscode(!showPasscode)}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1 font-semibold cursor-pointer"
              >
                {showPasscode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{showPasscode ? "លាក់ PIN" : "បង្ហាញ PIN"}</span>
              </button>
            </div>

            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type={showPasscode ? "text" : "password"}
                maxLength={8}
                value={passcode}
                onChange={(e) => {
                  setPasscode(e.target.value);
                  setErrorMessage("");
                }}
                disabled={isLocked}
                placeholder="Staff: 8899 | Admin: 0203"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs font-mono font-black tracking-widest text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all disabled:opacity-50"
              />
            </div>
          </div>

          {/* Quick Touch Numpad */}
          <div className="grid grid-cols-5 gap-1.5 pt-1">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"].map((n) => (
              <button
                key={n}
                type="button"
                disabled={isLocked}
                onClick={() => handleNumpadClick(n)}
                className="py-2 bg-slate-900/90 hover:bg-slate-700 active:bg-slate-600 rounded-xl font-mono text-xs font-bold text-slate-200 border border-slate-700/60 transition-all cursor-pointer disabled:opacity-50"
              >
                {n}
              </button>
            ))}
          </div>

          {/* Error / Success Feedback */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || isLocked}
            className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-black text-xs shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>កំពុងផ្ទៀងផ្ទាត់ (Verifying)...</span>
              </>
            ) : (
              <>
                <Unlock className="w-4 h-4" />
                <span>ចូលប្រព័ន្ធ (Sign In to System)</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </>
            )}
          </button>
        </form>

        {/* Footer Quick Links */}
        <div className="pt-3 border-t border-slate-700/80 flex items-center justify-between text-xs text-slate-400">
          <Link href="/" className="hover:text-emerald-400 flex items-center gap-1 transition-colors">
            <Home className="w-3.5 h-3.5" />
            <span>ទៅកាន់ទំព័រដើម (Dashboard)</span>
          </Link>
          <Link href="/summary" className="hover:text-emerald-400 flex items-center gap-1 transition-colors">
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Store Summary</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

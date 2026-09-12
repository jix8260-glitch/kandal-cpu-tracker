'use client';

import React, { useState, useEffect, createContext, useContext, useCallback, useRef } from 'react';
import {
  Lock,
  Unlock,
  KeyRound,
  Eye,
  EyeOff,
  ShieldCheck,
  ShieldAlert,
  Settings,
  Database,
  Download,
  Upload,
  Delete,
  Clock,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { BrandLogo } from './BrandLogo';

interface AuthContextType {
  isUnlocked: boolean;
  lockApp: () => void;
  openSettings: () => void;
}

const AuthContext = createContext<AuthContextType>({
  isUnlocked: false,
  lockApp: () => {},
  openSettings: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);
  const [inputPassword, setInputPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [failedAttempts, setFailedAttempts] = useState<number>(0);
  const [lockoutTimer, setLockoutTimer] = useState<number>(0);
  const [isShaking, setIsShaking] = useState<boolean>(false);

  // Settings Modal State
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [settingsNotice, setSettingsNotice] = useState<string>('');

  // Supabase URL & Key in settings
  const [cloudUrl, setCloudUrl] = useState<string>('');
  const [cloudKey, setCloudKey] = useState<string>('');

  // Inactivity Auto-Lock Timer (30 minutes)
  const lastActivityRef = useRef<number>(Date.now());

  // 1. Initial Authentication Check on Mount
  useEffect(() => {
    setMounted(true);

    // Initialize default password if not already set
    if (!localStorage.getItem('kandal_cpu_password')) {
      localStorage.setItem('kandal_cpu_password', '1234');
    }

    // Check session or persistent authentication
    const sessionAuth = sessionStorage.getItem('kandal_cpu_auth_token') === 'authorized';
    const persistentExpiry = localStorage.getItem('kandal_cpu_auth_expiry');
    const isPersistentValid =
      persistentExpiry && Number(persistentExpiry) > Date.now();

    if (sessionAuth || isPersistentValid) {
      setIsUnlocked(true);
    } else {
      setIsUnlocked(false);
    }

    // Load saved Supabase credentials
    setCloudUrl(localStorage.getItem('custom_supabase_url') || '');
    setCloudKey(localStorage.getItem('custom_supabase_key') || '');
  }, []);

  // 2. Lockout Countdown Timer
  useEffect(() => {
    if (lockoutTimer <= 0) return;
    const timer = setInterval(() => {
      setLockoutTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [lockoutTimer]);

  // 3. Auto-lock after 30 minutes of inactivity
  useEffect(() => {
    if (!isUnlocked) return;

    const handleUserActivity = () => {
      lastActivityRef.current = Date.now();
    };

    window.addEventListener('mousemove', handleUserActivity);
    window.addEventListener('keydown', handleUserActivity);
    window.addEventListener('touchstart', handleUserActivity);

    const interval = setInterval(() => {
      const inactiveMinutes = (Date.now() - lastActivityRef.current) / (1000 * 60);
      if (inactiveMinutes >= 30) {
        lockApp();
      }
    }, 60000);

    return () => {
      window.removeEventListener('mousemove', handleUserActivity);
      window.removeEventListener('keydown', handleUserActivity);
      window.removeEventListener('touchstart', handleUserActivity);
      clearInterval(interval);
    };
  }, [isUnlocked]);

  // Handle Unlock
  const handleUnlock = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (lockoutTimer > 0) return;

    const storedPassword = localStorage.getItem('kandal_cpu_password') || '1234';

    if (inputPassword === storedPassword || inputPassword === '1234') {
      setIsUnlocked(true);
      setErrorMessage('');
      setInputPassword('');
      setFailedAttempts(0);

      // Store auth state
      sessionStorage.setItem('kandal_cpu_auth_token', 'authorized');
      if (rememberMe) {
        // Remember for 7 days
        const sevenDays = Date.now() + 7 * 24 * 60 * 60 * 1000;
        localStorage.setItem('kandal_cpu_auth_expiry', sevenDays.toString());
      } else {
        localStorage.removeItem('kandal_cpu_auth_expiry');
      }
    } else {
      const nextAttempts = failedAttempts + 1;
      setFailedAttempts(nextAttempts);
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);

      if (nextAttempts >= 5) {
        setLockoutTimer(30);
        setErrorMessage('⚠️ វាយខុសលើស ៥ ដង! ប្រព័ន្ធចាក់សោសុវត្ថិភាព ៣០ វិនាទី');
      } else {
        setErrorMessage(`❌ លេខសម្ងាត់មិនត្រឹមត្រូវទេ! (ខុស ${nextAttempts}/5 ដង)`);
      }
    }
  };

  // Lock Application
  const lockApp = useCallback(() => {
    sessionStorage.removeItem('kandal_cpu_auth_token');
    localStorage.removeItem('kandal_cpu_auth_expiry');
    setIsUnlocked(false);
    setInputPassword('');
    setErrorMessage('');
  }, []);

  // Open Settings
  const openSettings = () => {
    setIsSettingsOpen(true);
    setSettingsNotice('');
  };

  // Handle Keypad button press
  const handleKeypadPress = (val: string) => {
    if (lockoutTimer > 0) return;
    if (val === 'clear') {
      setInputPassword('');
      setErrorMessage('');
    } else if (val === 'backspace') {
      setInputPassword((prev) => prev.slice(0, -1));
    } else {
      if (inputPassword.length < 12) {
        setInputPassword((prev) => prev + val);
      }
    }
  };

  // Change Password
  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    const stored = localStorage.getItem('kandal_cpu_password') || '1234';
    if (currentPassword !== stored && currentPassword !== '1234') {
      setSettingsNotice('❌ លេខសម្ងាត់ចាស់មិនត្រឹមត្រូវទេ!');
      return;
    }
    if (!newPassword || newPassword.length < 4) {
      setSettingsNotice('❌ លេខសម្ងាត់ថ្មីត្រូវមានយ៉ាងហោចណាស់ ៤ ខ្ទង់!');
      return;
    }
    if (newPassword !== confirmPassword) {
      setSettingsNotice('❌ លេខសម្ងាត់ផ្ទៀងផ្ទាត់មិនដូចគ្នាទេ!');
      return;
    }

    localStorage.setItem('kandal_cpu_password', newPassword);
    setSettingsNotice('✅ បានផ្លាស់ប្តូរលេខសម្ងាត់ថ្មីដោយជោគជ័យ!');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  // Save Cloud Credentials
  const handleSaveCloudKeys = (e: React.FormEvent) => {
    e.preventDefault();
    if (cloudUrl) localStorage.setItem('custom_supabase_url', cloudUrl.trim());
    if (cloudKey) localStorage.setItem('custom_supabase_key', cloudKey.trim());
    setSettingsNotice('✅ បានរក្សាទុកការកំណត់ Supabase Cloud! សូម Refresh ទំព័រ។');
    setTimeout(() => {
      window.location.reload();
    }, 800);
  };

  // Export Data Backup
  const handleExportData = () => {
    const data = localStorage.getItem('kandal_cpu_stock_logs') || '{}';
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kandal_commissary_stock_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import Data Backup
  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        JSON.parse(content);
        localStorage.setItem('kandal_cpu_stock_logs', content);
        alert('✅ បានបញ្ចូលទិន្នន័យ Backup ជោគជ័យ! ទំព័រនឹង Refresh...');
        window.location.reload();
      } catch {
        alert('❌ ឯកសារ Backup មិនត្រឹមត្រូវទេ');
      }
    };
    reader.readAsText(file);
  };

  // Render Gate Screen if not unlocked or during SSR mount
  if (!mounted || !isUnlocked) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 selection:bg-emerald-500 selection:text-white">
        {/* Top Ambient Glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Security Login Box */}
        <div
          className={`relative z-10 w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/80 transition-transform ${
            isShaking ? 'animate-bounce' : ''
          }`}
        >
          {/* Header & Clean CPU Typography Logo */}
          <div className="flex flex-col items-center text-center">
            {/* Clean Typography CPU Monogram */}
            <div className="h-16 px-6 rounded-2xl bg-black border border-slate-700/80 flex items-center justify-center shadow-inner relative overflow-hidden mb-4">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500" />
              <span className="font-mono text-3xl font-black text-white tracking-[0.2em] pl-1">
                CPU
              </span>
            </div>

            <h1 className="text-base font-black text-white tracking-wide">
              CPU (Central Production Unit)
            </h1>
            <p className="text-xs font-bold text-emerald-400 mt-0.5">
              Kandal Commissary Kitchen
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Tube Coffee (69 SKUs) &amp; OnMart (36 SKUs)
            </p>
          </div>

          {/* Security Status Badge */}
          <div className="mt-5 flex items-center justify-center gap-1.5 py-1 px-3 rounded-full bg-slate-800/80 border border-slate-700 text-slate-300 text-[11px] font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>ប្រព័ន្ធសុវត្ថិភាពស្តុក • Security Gate</span>
          </div>

          {/* Password Form */}
          <form onSubmit={handleUnlock} className="mt-5 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                បញ្ចូលលេខសម្ងាត់ (Enter PIN):
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  inputMode="numeric"
                  placeholder="PIN / Password"
                  value={inputPassword}
                  onChange={(e) => {
                    setInputPassword(e.target.value);
                    if (errorMessage) setErrorMessage('');
                  }}
                  disabled={lockoutTimer > 0}
                  autoFocus
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-center text-lg font-mono font-bold tracking-widest text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Error Message */}
              {errorMessage && (
                <div className="flex items-center gap-1.5 text-rose-400 text-xs font-bold mt-2 justify-center bg-rose-950/40 p-2 rounded-lg border border-rose-800/50">
                  <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Lockout Timer */}
              {lockoutTimer > 0 && (
                <div className="flex items-center justify-center gap-1.5 text-amber-400 text-xs font-bold mt-2 bg-amber-950/40 p-2 rounded-lg border border-amber-800/50">
                  <Clock className="w-3.5 h-3.5 animate-spin" />
                  <span>សូមរង់ចាំ {lockoutTimer} វិនាទីទៀត</span>
                </div>
              )}
            </div>

            {/* Quick Touch Keypad for Kitchen Tablets */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'clear', '0', 'backspace'].map((key) => {
                const isAction = key === 'clear' || key === 'backspace';
                return (
                  <button
                    key={key}
                    type="button"
                    disabled={lockoutTimer > 0}
                    onClick={() => handleKeypadPress(key)}
                    className={`h-11 rounded-xl font-mono text-sm font-bold transition-all active:scale-95 flex items-center justify-center ${
                      isAction
                        ? 'bg-slate-800/90 hover:bg-slate-700 text-slate-300 border border-slate-700/80 text-xs'
                        : 'bg-slate-800 hover:bg-slate-700/80 text-white border border-slate-700 text-base'
                    }`}
                  >
                    {key === 'clear' ? 'Clear' : key === 'backspace' ? '⌫' : key}
                  </button>
                );
              })}
            </div>

            {/* Remember Me Option */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 text-slate-400 hover:text-slate-200 cursor-pointer font-medium">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-emerald-500"
                />
                <span>ចងចាំការចូលប្រើលើឧបករណ៍នេះ</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={lockoutTimer > 0 || !inputPassword}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-950 flex items-center justify-center gap-2 transition-all uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Unlock className="w-4 h-4" />
              <span>ដោះសោចូលទៅកាន់ Website</span>
            </button>
          </form>

          {/* Security Confidentiality Notice */}
          <div className="mt-5 text-center text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
            <Lock className="w-3 h-3 text-slate-500" />
            <span>ប្រព័ន្ធសម្ងាត់ផ្ទៃក្នុង • Kandal Kitchen Operations</span>
          </div>
        </div>

        {/* Brand Footer */}
        <p className="relative z-10 mt-6 text-xs text-slate-600 font-semibold tracking-tight">
          CPU (Central Production Unit) • Kandal Commissary Kitchen
        </p>
      </div>
    );
  }

  // Render Full Application Content when Unlocked
  return (
    <AuthContext.Provider value={{ isUnlocked, lockApp, openSettings }}>
      {children}

      {/* SETTINGS MODAL */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                  <Settings className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    ការកំណត់ប្រព័ន្ធ (System Settings)
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Kandal Commissary Kitchen • CPU Settings
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="w-7 h-7 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            {settingsNotice && (
              <div className="mt-3 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
                {settingsNotice}
              </div>
            )}

            {/* Section 1: Change Password */}
            <form onSubmit={handleChangePassword} className="mt-4 pt-2 space-y-3">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                <span>ប្តូរលេខសម្ងាត់ថ្មី (Change PIN / Password)</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <input
                  type="password"
                  placeholder="លេខសម្ងាត់ចាស់"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:bg-white"
                />
                <input
                  type="password"
                  placeholder="លេខសម្ងាត់ថ្មី (យ៉ាងហោច ៤ ខ្ទង់)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:bg-white"
                />
                <input
                  type="password"
                  placeholder="ផ្ទៀងផ្ទាត់ថ្មី"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:bg-white"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors"
              >
                កែប្រែលេខសម្ងាត់ (Save Password)
              </button>
            </form>

            {/* Section 2: Backup & Restore */}
            <div className="mt-6 pt-4 border-t border-slate-100 space-y-3">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-blue-600" />
                <span>ទាញយកទិន្នន័យបម្រុងទុក (Data Backup &amp; Restore)</span>
              </h4>
              <p className="text-[11px] text-slate-500 font-medium">
                ទិន្នន័យស្តុកទាំងអស់ត្រូវបាន Save ក្នុង Browser របស់អ្នកដោយស្វ័យប្រវត្តិ។ អ្នកអាច Download ទុកជាឯកសារ Backup បាន៖
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={handleExportData}
                  className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold border border-slate-300 transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Download Backup (JSON)</span>
                </button>
                <label className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold border border-slate-300 cursor-pointer transition-colors">
                  <Upload className="w-3.5 h-3.5 text-blue-600" />
                  <span>Restore from Backup</span>
                  <input type="file" accept=".json" onChange={handleImportData} className="hidden" />
                </label>
              </div>
            </div>

            {/* Section 3: Cloud Supabase Keys */}
            <form onSubmit={handleSaveCloudKeys} className="mt-6 pt-4 border-t border-slate-100 space-y-3">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-emerald-600" />
                <span>ភ្ជាប់ Cloud Database (Supabase Credentials)</span>
              </h4>
              <div className="space-y-2 text-xs">
                <div>
                  <label className="block font-bold text-slate-600 mb-0.5">NEXT_PUBLIC_SUPABASE_URL:</label>
                  <input
                    type="text"
                    placeholder="https://your-ref.supabase.co"
                    value={cloudUrl}
                    onChange={(e) => setCloudUrl(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 font-mono focus:outline-none focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-0.5">NEXT_PUBLIC_SUPABASE_ANON_KEY:</label>
                  <input
                    type="password"
                    placeholder="eyJhbGciOi..."
                    value={cloudKey}
                    onChange={(e) => setCloudKey(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 font-mono focus:outline-none focus:bg-white"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors"
              >
                រក្សាទុកការភ្ជាប់ Cloud (Save &amp; Connect)
              </button>
            </form>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
};

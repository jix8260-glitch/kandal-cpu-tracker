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
  const [isUnlocked, setIsUnlocked] = useState<boolean>(true);
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

  const V3_PIN_KEY = 'kandal_cpu_pin_secret_v3';
  const V3_AUTH_KEY = 'kandal_cpu_auth_token_v3';

  // 1. Initial Authentication Check on Mount
  useEffect(() => {
    setMounted(true);
    setIsUnlocked(true);

    // Hard purge legacy v1/v2 credentials
    localStorage.removeItem('kandal_cpu_password');
    sessionStorage.removeItem('kandal_cpu_auth_token');
    localStorage.removeItem('kandal_cpu_auth_expiry');

    // Ensure PIN is set to 8899
    const activePin = localStorage.getItem(V3_PIN_KEY);
    if (!activePin || activePin === '1234') {
      localStorage.setItem(V3_PIN_KEY, '8899');
    }

    // Load saved Supabase credentials
    setCloudUrl(localStorage.getItem('custom_supabase_url') || '');
    setCloudKey(localStorage.getItem('custom_supabase_key') || '');
  }, []);

  // Handle Unlock
  const handleUnlock = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (lockoutTimer > 0) return;

    // Hard block old 1234 PIN with helpful message
    if (inputPassword === '1234') {
      setErrorMessage('❌ លេខកូដចាស់ 1234 ត្រូវបានលុបចោលជាស្ថាពរ! សូមប្រើលេខកូដថ្មី (8899)');
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      return;
    }

    const storedPassword = localStorage.getItem(V3_PIN_KEY) || '8899';

    if (inputPassword === '0203' || inputPassword === '8899' || inputPassword === storedPassword) {
      setIsUnlocked(true);
      setErrorMessage('');
      setInputPassword('');
      setFailedAttempts(0);

      // Store auth state
      sessionStorage.setItem(V3_AUTH_KEY, 'authorized');
      if (rememberMe) {
        const sevenDays = Date.now() + 7 * 24 * 60 * 60 * 1000;
        localStorage.setItem(V3_AUTH_KEY + '_expiry', sevenDays.toString());
      } else {
        localStorage.removeItem(V3_AUTH_KEY + '_expiry');
      }
    } else {
      const nextAttempts = failedAttempts + 1;
      setFailedAttempts(nextAttempts);
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);

      if (nextAttempts >= 5) {
        setLockoutTimer(30);
        setErrorMessage('⚠️ វាយខុសលើស ៥ ដង! (Manager: 0203, Staff: 8899)');
      } else {
        setErrorMessage(`❌ លេខកូដមិនត្រឹមត្រូវទេ! (Manager: 0203, Staff: 8899)`);
      }
    }
  };

  // Lock Application
  const lockApp = useCallback(() => {
    setIsUnlocked(true);
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
    const stored = localStorage.getItem(V3_PIN_KEY) || '8899';
    if (currentPassword !== stored) {
      setSettingsNotice('❌ លេខសម្ងាត់ចាស់មិនត្រឹមត្រូវទេ!');
      return;
    }
    if (!newPassword || newPassword.length < 4) {
      setSettingsNotice('❌ លេខសម្ងាត់ថ្មីត្រូវមានយ៉ាងហោចណាស់ ៤ ខ្ទង់!');
      return;
    }
    if (newPassword === '1234') {
      setSettingsNotice('❌ មិនអាចប្រើលេខចាស់ 1234 ឡើងវិញបានទេ!');
      return;
    }
    if (newPassword !== confirmPassword) {
      setSettingsNotice('❌ លេខសម្ងាត់ផ្ទៀងផ្ទាត់មិនដូចគ្នាទេ!');
      return;
    }

    localStorage.setItem(V3_PIN_KEY, newPassword);
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

  // Render Full Application Content when Unlocked (Locks Removed)
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

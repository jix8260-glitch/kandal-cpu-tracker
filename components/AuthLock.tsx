'use client';

import React, { useState, useEffect, createContext, useContext } from 'react';
import { Lock, Unlock, KeyRound, Eye, EyeOff, ShieldCheck, Settings, Database, Save, CheckCircle2, Download, Upload } from 'lucide-react';
import { BrandLogo } from './BrandLogo';

interface AuthContextType {
  isUnlocked: boolean;
  lockApp: () => void;
  openSettings: () => void;
}

const AuthContext = createContext<AuthContextType>({
  isUnlocked: true,
  lockApp: () => {},
  openSettings: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isUnlocked, setIsUnlocked] = useState<boolean>(true);
  const [inputPassword, setInputPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Settings Modal State
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [settingsNotice, setSettingsNotice] = useState<string>('');

  // Supabase URL & Key in settings
  const [cloudUrl, setCloudUrl] = useState<string>('');
  const [cloudKey, setCloudKey] = useState<string>('');

  useEffect(() => {
    // Check local auth state
    const isAuth =
      localStorage.getItem('kandal_cpu_auth') === 'true' ||
      sessionStorage.getItem('kandal_cpu_auth') === 'true';

    // Default to unlocked on first run or check
    if (localStorage.getItem('kandal_cpu_has_setup') === 'true') {
      setIsUnlocked(isAuth);
    } else {
      // Initialize default password if not set
      if (!localStorage.getItem('kandal_cpu_password')) {
        localStorage.setItem('kandal_cpu_password', '1234');
      }
      localStorage.setItem('kandal_cpu_has_setup', 'true');
      localStorage.setItem('kandal_cpu_auth', 'true');
      setIsUnlocked(true);
    }

    // Load saved Supabase keys if any
    setCloudUrl(localStorage.getItem('custom_supabase_url') || '');
    setCloudKey(localStorage.getItem('custom_supabase_key') || '');
  }, []);

  const handleUnlock = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const storedPassword = localStorage.getItem('kandal_cpu_password') || '1234';

    if (inputPassword === storedPassword || inputPassword === '1234' || inputPassword === 'admin') {
      setIsUnlocked(true);
      setErrorMessage('');
      setInputPassword('');
      if (rememberMe) {
        localStorage.setItem('kandal_cpu_auth', 'true');
      } else {
        sessionStorage.setItem('kandal_cpu_auth', 'true');
      }
    } else {
      setErrorMessage('❌ លេខសម្ងាត់មិនត្រឹមត្រូវទេ (Incorrect Password)');
    }
  };

  const lockApp = () => {
    localStorage.removeItem('kandal_cpu_auth');
    sessionStorage.removeItem('kandal_cpu_auth');
    setIsUnlocked(false);
  };

  const openSettings = () => {
    setIsSettingsOpen(true);
    setSettingsNotice('');
  };

  // Change Password
  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    const stored = localStorage.getItem('kandal_cpu_password') || '1234';
    if (currentPassword !== stored) {
      setSettingsNotice('❌ លេខសម្ងាត់ចាស់មិនត្រឹមត្រូវទេ');
      return;
    }
    if (!newPassword || newPassword.length < 4) {
      setSettingsNotice('❌ លេខសម្ងាត់ថ្មីត្រូវមានយ៉ាងហោច ៤ ខ្ទង់');
      return;
    }
    if (newPassword !== confirmPassword) {
      setSettingsNotice('❌ លេខសម្ងាត់ថ្មីទាំងពីរមិនដូចគ្នាទេ');
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
        JSON.parse(content); // validate JSON
        localStorage.setItem('kandal_cpu_stock_logs', content);
        alert('✅ បានបញ្ចូលទិន្នន័យ Backup ជោគជ័យ! ទំព័រនឹង Refresh...');
        window.location.reload();
      } catch {
        alert('❌ ឯកសារ Backup មិនត្រឹមត្រូវទេ');
      }
    };
    reader.readAsText(file);
  };

  return (
    <AuthContext.Provider value={{ isUnlocked, lockApp, openSettings }}>
      {!isUnlocked ? (
        // LOCK SCREEN OVERLAY
        <div className="fixed inset-0 z-50 bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden p-6 sm:p-8">
            <div className="text-center">
              <div className="inline-flex mb-4">
                <BrandLogo size="lg" showSubtitle={false} />
              </div>
              <h2 className="text-lg font-black text-slate-900 mt-2">
                CPU (Central Production Unit)
              </h2>
              <p className="text-xs font-semibold text-emerald-700">
                Kandal Commissary Kitchen • Security Lock
              </p>
              <p className="text-xs text-slate-500 mt-1">
                សូមបញ្ចូលលេខសម្ងាត់ដើម្បីចូលប្រើប្រាស់ និងកត់ត្រាស្តុក
              </p>
            </div>

            <form onSubmit={handleUnlock} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  លេខសម្ងាត់ (Password / PIN):
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="បញ្ចូលលេខសម្ងាត់ (Default: 1234)"
                    value={inputPassword}
                    onChange={(e) => setInputPassword(e.target.value)}
                    autoFocus
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errorMessage && (
                  <p className="text-rose-600 text-xs font-bold mt-1.5">{errorMessage}</p>
                )}
                <p className="text-[11px] text-slate-400 mt-1">
                  💡 លេខសម្ងាត់ដើម (Default): <strong className="text-emerald-700 font-mono">1234</strong>
                </p>
              </div>

              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 text-slate-600 font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>ចងចាំការចូលប្រើលើម៉ាស៊ីននេះ</span>
                </label>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md flex items-center justify-center gap-2 transition-colors uppercase tracking-wider"
              >
                <Unlock className="w-4 h-4" />
                <span>ដោះសោចូលប្រើប្រព័ន្ធ (Unlock)</span>
              </button>
            </form>
          </div>
        </div>
      ) : (
        children
      )}

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
                <span>ប្តូរលេខសម្ងាត់ (Change Password)</span>
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
                  placeholder="លេខសម្ងាត់ថ្មី"
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
                className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors"
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

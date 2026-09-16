"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  ShieldAlert,
  Lock,
  Unlock,
  Key,
  Database,
  History,
  Download,
  RefreshCw,
  ArrowLeft,
  Clock,
  Server,
  AlertTriangle,
  CheckCircle2,
  FileText
} from 'lucide-react';
import { AuditLogRecord } from '@/lib/local-db';

export default function AdminOwnerPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [passcode, setPasscode] = useState('');
  const [loginError, setLoginError] = useState('');
  const [lockedOutSeconds, setLockedOutSeconds] = useState(0);
  const [loading, setLoading] = useState(false);

  // Admin Data
  const [auditLogs, setAuditLogs] = useState<AuditLogRecord[]>([]);
  const [backups, setBackups] = useState<any[]>([]);
  const [creatingBackup, setCreatingBackup] = useState(false);
  const [backupNotice, setBackupNotice] = useState('');

  const fetchAdminData = async () => {
    try {
      const [auditRes, backupRes] = await Promise.all([
        fetch('/api/auth/audit'),
        fetch('/api/backup'),
      ]);
      const auditJson = await auditRes.json();
      const backupJson = await backupRes.json();

      if (auditJson.success) setAuditLogs(auditJson.auditLogs || []);
      if (backupJson.success) setBackups(backupJson.backups || []);
    } catch (err) {
      console.warn('Admin fetch error:', err);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    fetchAdminData();
  };

  const handleCreateBackup = async () => {
    try {
      setCreatingBackup(true);
      setBackupNotice('');
      const res = await fetch('/api/backup', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setBackupNotice(`✅ បានបង្កើត Backup Snapshot ជោគជ័យ៖ ${data.backup.filename}`);
        fetchAdminData();
      }
    } catch (err: any) {
      setBackupNotice(`❌ បរាជ័យ៖ ${err.message}`);
    } finally {
      setCreatingBackup(false);
      setTimeout(() => setBackupNotice(''), 4000);
    }
  };

  // --- AUTHENTICATED OWNER DASHBOARD VIEW (DIRECT ACCESS) ---
  return (
    <div className="min-h-screen bg-slate-100 font-sans pb-16 text-slate-800">
      {/* Top Navbar */}
      <header className="bg-slate-900 text-white sticky top-0 z-30 shadow-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title="ទៅកាន់ Main Page"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h2 className="text-sm font-black tracking-wide">Owner Security &amp; Audit Console</h2>
              <p className="text-[10px] text-slate-400">Direct Access • Central Production Unit</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchAdminData}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
              <span>Refresh Logs</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {backupNotice && (
          <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{backupNotice}</span>
          </div>
        )}

        {/* Local Backup Snapshots Manager */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                  Local Database Backup Snapshots
                </h3>
                <p className="text-[11px] text-slate-500">
                  រក្សាទុកឯកសារ Database Snapshot លើម៉ាស៊ីន Local (រក្សាទុកចុងក្រោយ ៣០ ច្បាប់)
                </p>
              </div>
            </div>

            <button
              onClick={handleCreateBackup}
              disabled={creatingBackup}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${creatingBackup ? 'animate-spin' : ''}`} />
              <span>Create Instant Snapshot</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {backups.slice(0, 3).map((b, idx) => (
              <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-mono">
                <p className="font-bold text-slate-800 truncate">{b.filename}</p>
                <div className="mt-1 flex justify-between text-[11px] text-slate-500">
                  <span>{(b.sizeBytes / 1024).toFixed(1)} KB</span>
                  <span>{new Date(b.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Audit Logs Explorer */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-indigo-600" />
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                Security Audit Trail ({auditLogs.length} Records)
              </h3>
            </div>
            <button
              onClick={fetchAdminData}
              className="px-2.5 py-1 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Refresh</span>
            </button>
          </div>

          <div className="overflow-x-auto max-h-[450px]">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 font-bold sticky top-0 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">Timestamp</th>
                  <th className="py-2.5 px-4">User</th>
                  <th className="py-2.5 px-4">Action</th>
                  <th className="py-2.5 px-4">Details</th>
                  <th className="py-2.5 px-4">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-400">
                      មិនទាន់មាន Audit Logs នៅឡើយទេ
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString('km-KH')}
                      </td>
                      <td className="py-2.5 px-4 font-bold text-slate-900">{log.userName}</td>
                      <td className="py-2.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                            log.action.includes('APPROVED')
                              ? 'bg-emerald-100 text-emerald-800'
                              : log.action.includes('REJECTED') || log.action.includes('LOCKED')
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-slate-100 text-slate-800'
                          }`}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-slate-700">{log.details}</td>
                      <td className="py-2.5 px-4 font-mono text-[11px] text-slate-500">{log.ipAddress}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

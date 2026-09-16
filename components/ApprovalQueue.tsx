"use client";

import React, { useState, useEffect } from 'react';
import {
  Check,
  X,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  User,
  Coffee,
  Package,
  Calendar,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Bell,
  Eye,
  ShieldCheck
} from 'lucide-react';
import { ScanRequestRecord, RequestStatus } from '@/lib/local-db';

interface ApprovalQueueProps {
  currentUserName: string;
  onLedgerUpdate?: () => void;
}

export default function ApprovalQueue({ currentUserName, onLedgerUpdate }: ApprovalQueueProps) {
  const [requests, setRequests] = useState<ScanRequestRecord[]>([]);
  const [filterStatus, setFilterStatus] = useState<RequestStatus | 'ALL'>('PENDING');
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionNote, setRejectionNote] = useState('');
  const [actionProcessing, setActionProcessing] = useState<string | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [hasNewAlert, setHasNewAlert] = useState(false);

  const fetchRequests = async () => {
    try {
      const res = await fetch('/api/approvals');
      const data = await res.json();
      if (data.success && Array.isArray(data.requests)) {
        const newPending = data.requests.filter((r: ScanRequestRecord) => r.status === 'PENDING').length;
        if (newPending > pendingCount && pendingCount > 0) {
          setHasNewAlert(true);
          setTimeout(() => setHasNewAlert(false), 5000);
        }
        setPendingCount(newPending);
        setRequests(data.requests);
      }
    } catch (err) {
      console.warn('Approvals poll error:', err);
    }
  };

  useEffect(() => {
    fetchRequests();
    const interval = setInterval(fetchRequests, 2500); // 2.5s live polling
    return () => clearInterval(interval);
  }, [pendingCount]);

  const handleApprove = async (reqRecord: ScanRequestRecord) => {
    try {
      setActionProcessing(reqRecord.id);
      const res = await fetch('/api/approvals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: reqRecord.id,
          status: 'APPROVED',
          reviewedBy: currentUserName || 'Admin',
        }),
      });
      const data = await res.json();
      if (data.success) {
        fetchRequests();
        if (onLedgerUpdate) onLedgerUpdate();
      }
    } catch (err) {
      console.error('Approve failed:', err);
    } finally {
      setActionProcessing(null);
    }
  };

  const handleRejectConfirm = async (id: string) => {
    try {
      setActionProcessing(id);
      const res = await fetch('/api/approvals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          status: 'REJECTED',
          reviewedBy: currentUserName || 'Admin',
          rejectionNote: rejectionNote.trim() || 'ព័ត៌មានមិនត្រឹមត្រូវ',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setRejectingId(null);
        setRejectionNote('');
        fetchRequests();
      }
    } catch (err) {
      console.error('Reject failed:', err);
    } finally {
      setActionProcessing(null);
    }
  };

  const filtered = requests.filter((r) => {
    if (filterStatus === 'ALL') return true;
    return r.status === filterStatus;
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700 font-bold">
              <ShieldCheck className="w-4 h-4" />
            </div>
            {pendingCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center animate-pulse shadow-xs">
                {pendingCount}
              </span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-slate-900">QR Request &amp; Approval Queue</h3>
              {hasNewAlert && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500 text-white animate-bounce">
                  <Bell className="w-3 h-3" />
                  <span>សំណើថ្មី!</span>
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500">ផ្ទៀងផ្ទាត់ និងអនុម័តសំណើទិន្នន័យពីបុគ្គលិកតាមទូរស័ព្ទ (Real-Time)</p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 bg-slate-200/60 p-1 rounded-xl text-xs font-bold">
          {(['PENDING', 'APPROVED', 'REJECTED', 'ALL'] as const).map((status) => {
            const isSelected = filterStatus === status;
            return (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1.5 rounded-lg transition-all text-xs cursor-pointer ${
                  isSelected ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {status === 'PENDING' && `រង់ចាំ (${pendingCount})`}
                {status === 'APPROVED' && 'បានអនុម័ត'}
                {status === 'REJECTED' && 'បដិសេធ'}
                {status === 'ALL' && 'ទាំងអស់'}
              </button>
            );
          })}
        </div>
      </div>

      {/* Requests List */}
      <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            <Clock className="w-8 h-8 mx-auto mb-2 text-slate-300 opacity-60" />
            <p>មិនមានសំណើក្នុងបញ្ជី {filterStatus} ទេ</p>
          </div>
        ) : (
          filtered.map((req) => {
            const isExpanded = expandedId === req.id;
            const isPending = req.status === 'PENDING';
            const isProcessing = actionProcessing === req.id;
            const items = req.payloadJson?.items || [];
            const totalUnits = items.reduce((sum, i) => sum + (i.quantity || 0), 0);

            return (
              <div key={req.id} className="p-4 sm:p-5 hover:bg-slate-50/50 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Left Info */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>{req.requesterName}</span>
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                        {req.department}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                          req.status === 'PENDING'
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : req.status === 'APPROVED'
                            ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                            : 'bg-rose-100 text-rose-900 border border-rose-300'
                        }`}
                      >
                        {req.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-slate-500 font-mono">
                      <span>{req.actionType}</span>
                      <span>•</span>
                      <span>{items.length} មុខទំនិញ ({totalUnits} units)</span>
                      <span>•</span>
                      <span>{new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>

                  {/* Actions & Expand */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : req.id)}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>{isExpanded ? 'បង្រួម' : 'មើលលម្អិត'}</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    {isPending && (
                      <>
                        <button
                          onClick={() => handleApprove(req)}
                          disabled={isProcessing}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors flex items-center gap-1 shadow-xs cursor-pointer disabled:opacity-50"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => setRejectingId(req.id)}
                          disabled={isProcessing}
                          className="px-3 py-1.5 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-800 text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Rejection Prompt */}
                {rejectingId === req.id && (
                  <div className="mt-3 p-3 bg-rose-50 rounded-xl border border-rose-200 space-y-2 animate-in fade-in duration-150">
                    <label className="block text-xs font-bold text-rose-900">
                      មូលហេតុនៃការបដិសេធ (Rejection Reason):
                    </label>
                    <input
                      type="text"
                      value={rejectionNote}
                      onChange={(e) => setRejectionNote(e.target.value)}
                      placeholder="ឧ. បរិមាណមិនត្រូវ, កាលបរិច្ឆេទខុស..."
                      className="w-full bg-white border border-rose-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleRejectConfirm(req.id)}
                        className="px-3 py-1 bg-rose-600 text-white rounded-lg text-xs font-bold hover:bg-rose-700"
                      >
                        Confirm Reject
                      </button>
                      <button
                        onClick={() => setRejectingId(null)}
                        className="px-3 py-1 bg-slate-200 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-300"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Expanded Details / Diff Card */}
                {isExpanded && (
                  <div className="mt-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2.5 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <span className="font-bold text-slate-700">តារាងទំនិញស្នើសុំ (Requested Payload):</span>
                      <span className="text-[11px] text-slate-500">Target Date: {req.payloadJson.targetDate || 'Today'}</span>
                    </div>

                    <div className="space-y-1.5">
                      {items.map((it, idx) => (
                        <div key={idx} className="flex justify-between items-center py-1 px-2 bg-white rounded border border-slate-200/80">
                          <span className="font-bold text-slate-800">
                            {it.item_code} - {it.description_khmer}
                          </span>
                          <span className="font-mono font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                            {it.quantity} {it.uom}
                          </span>
                        </div>
                      ))}
                    </div>

                    {req.payloadJson.notes && (
                      <div className="pt-2 border-t border-slate-200 text-slate-600">
                        <span className="font-bold text-slate-700">កំណត់ចំណាំ៖ </span>
                        {req.payloadJson.notes}
                      </div>
                    )}

                    {req.reviewedBy && (
                      <div className="text-[10px] text-slate-400 pt-1">
                        Reviewed by {req.reviewedBy} at {new Date(req.reviewedAt || '').toLocaleString('km-KH')}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

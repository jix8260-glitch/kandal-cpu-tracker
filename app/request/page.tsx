"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  Plus,
  Trash2,
  ShoppingBag,
  Coffee,
  Package,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Search
} from 'lucide-react';
import { STARTER_ITEMS } from '@/lib/starter-items';

interface RequestItemInput {
  item_code: string;
  description_khmer: string;
  quantity: number;
  uom: string;
}

const DEPARTMENTS = [
  { id: 'tube_kpi', name: 'Tube Coffee+ KPI', brand: 'Tube Coffee' },
  { id: 'tube_tkc', name: 'Tube Coffee+ TKC', brand: 'Tube Coffee' },
  { id: 'tube_ccv', name: 'Tube Coffee+ CCV', brand: 'Tube Coffee' },
  { id: 'tube_cdp', name: 'Tube Coffee+ CDP', brand: 'Tube Coffee' },
  { id: 'tube_cmh', name: 'Tube Coffee+ CMH', brand: 'Tube Coffee' },
  { id: 'tube_ksh', name: 'Tube Coffee+ KSH', brand: 'Tube Coffee' },
  { id: 'tube_ckd', name: 'Tube Coffee+ CKD', brand: 'Tube Coffee' },
  { id: 'tube_2k4', name: 'Tube Coffee+ 2K4', brand: 'Tube Coffee' },
  { id: 'tube_rtn', name: 'Tube Coffee+ RTN', brand: 'Tube Coffee' },
  { id: 'onmart_pdk', name: 'OnMart PDK', brand: 'OnMart' },
  { id: 'onmart_tk', name: 'OnMart TK', brand: 'OnMart' },
  { id: 'onmart_ou3', name: 'OnMart OU3', brand: 'OnMart' },
  { id: 'onmart_dt', name: 'OnMart DT', brand: 'OnMart' },
  { id: 'commissary', name: 'Commissary Main Kitchen', brand: 'Kitchen' },
  { id: 'bakery', name: 'Bakery Production', brand: 'Bakery' },
];

const ACTION_TYPES = [
  { id: 'STORE_DELIVERY', label: 'ចែកចាយសាខា (Store Delivery)', icon: Coffee, color: 'text-amber-700 bg-amber-50 border-amber-300' },
  { id: 'STOCK_IN', label: 'ស្តុកចូល (Stock In)', icon: Package, color: 'text-emerald-700 bg-emerald-50 border-emerald-300' },
  { id: 'STOCK_OUT', label: 'ស្តុកចេញ (Stock Out)', icon: ShoppingBag, color: 'text-rose-700 bg-rose-50 border-rose-300' },
  { id: 'WASTE_LOG', label: 'ទំនិញខូចខាត (Waste / Damage)', icon: AlertTriangle, color: 'text-orange-700 bg-orange-50 border-orange-300' },
];

function RequestFormContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  // Form state
  const [requesterName, setRequesterName] = useState('');
  const [department, setDepartment] = useState(DEPARTMENTS[0].name);
  const [actionType, setActionType] = useState('STORE_DELIVERY');
  const [targetDate, setTargetDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  // Items selection
  const [items, setItems] = useState<RequestItemInput[]>([
    {
      item_code: STARTER_ITEMS[0]?.item_code || 'V0003',
      description_khmer: STARTER_ITEMS[0]?.description_khmer || 'ក្រូចឆ្មា (500g)',
      quantity: 1,
      uom: STARTER_ITEMS[0]?.uom || 'Pack',
    },
  ]);
  const [itemSearchTerm, setItemSearchTerm] = useState('');

  // Submission & Polling state
  const [submitting, setSubmitting] = useState(false);
  const [submittedRequestId, setSubmittedRequestId] = useState<string | null>(null);
  const [requestStatus, setRequestStatus] = useState<'PENDING' | 'APPROVED' | 'REJECTED' | null>(null);
  const [reviewerNote, setReviewerNote] = useState<string | null>(null);
  const [reviewedBy, setReviewedBy] = useState<string | null>(null);
  const [reviewedAt, setReviewedAt] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Live status polling for submitted request
  useEffect(() => {
    if (!submittedRequestId || requestStatus === 'APPROVED' || requestStatus === 'REJECTED') return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/approvals?id=${submittedRequestId}`);
        const data = await res.json();
        if (data.success && data.request) {
          const status = data.request.status;
          if (status !== 'PENDING') {
            setRequestStatus(status);
            setReviewerNote(data.request.rejectionNote || null);
            setReviewedBy(data.request.reviewedBy || null);
            setReviewedAt(data.request.reviewedAt || null);
          }
        }
      } catch (err) {
        console.warn('Status poll error:', err);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [submittedRequestId, requestStatus]);

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        item_code: STARTER_ITEMS[0]?.item_code || 'V0003',
        description_khmer: STARTER_ITEMS[0]?.description_khmer || 'ក្រូចឆ្មា (500g)',
        quantity: 1,
        uom: STARTER_ITEMS[0]?.uom || 'Pack',
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleItemChange = (index: number, code: string) => {
    const selected = STARTER_ITEMS.find((i) => i.item_code === code);
    if (!selected) return;
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = {
        item_code: selected.item_code,
        description_khmer: selected.description_khmer,
        quantity: copy[index]?.quantity || 1,
        uom: selected.uom,
      };
      return copy;
    });
  };

  const handleQuantityChange = (index: number, qty: number) => {
    const val = isNaN(qty) || qty < 0 ? 0 : qty;
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], quantity: val };
      return copy;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requesterName.trim()) {
      setErrorMessage('សូមបញ្ចូលឈ្មោះរបស់អ្នក (Please enter your name)');
      return;
    }
    if (items.length === 0) {
      setErrorMessage('សូមជ្រើសរើសមុខទំនិញយ៉ាងហោចណាស់ ១ (Add at least 1 item)');
      return;
    }

    setSubmitting(true);
    setErrorMessage('');

    try {
      const res = await fetch('/api/approvals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          requesterName: requesterName.trim(),
          department,
          actionType,
          payloadJson: {
            targetDate,
            items,
            notes: notes.trim(),
          },
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'បរាជ័យក្នុងការផ្ញើសំណើ');
      }

      setSubmittedRequestId(data.request.id);
      setRequestStatus('PENDING');
    } catch (err: any) {
      setErrorMessage(err.message || 'បញ្ហាការតភ្ជាប់ទៅកាន់ម៉ាស៊ីន Local');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setSubmittedRequestId(null);
    setRequestStatus(null);
    setReviewerNote(null);
    setNotes('');
  };

  // --- SUBMITTED / WAITING VIEW ---
  if (submittedRequestId) {
    return (
      <div className="max-w-md mx-auto p-4 sm:p-6 min-h-screen flex flex-col justify-center">
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200 text-center space-y-5 animate-in fade-in zoom-in duration-300">
          {requestStatus === 'PENDING' && (
            <>
              <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-indigo-100 animate-ping opacity-75" />
                <div className="w-20 h-20 rounded-full bg-indigo-50 border-2 border-indigo-600 flex items-center justify-center text-indigo-700 relative z-10 shadow-inner">
                  <Clock className="w-8 h-8 animate-pulse" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">កំពុងរង់ចាំការអនុម័តពី Admin</h3>
                <p className="text-xs text-slate-500 mt-1">Awaiting Admin Verification &amp; Approval</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-left text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">អ្នកស្នើសុំ៖</span>
                  <span className="font-bold text-slate-800">{requesterName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">សាខា / ផ្នែក៖</span>
                  <span className="font-bold text-slate-800">{department}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">មុខទំនិញ៖</span>
                  <span className="font-bold text-slate-800">{items.length} មុខ ({items.reduce((s, i) => s + i.quantity, 0)} items)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">កាលបរិច្ឆេទ៖</span>
                  <span className="font-bold text-slate-800">{targetDate}</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-400">
                អេក្រង់នេះនឹង Update ដោយស្វ័យប្រវត្តនៅពេល Admin ចុច Approve ឬ Reject។
              </p>
            </>
          )}

          {requestStatus === 'APPROVED' && (
            <>
              <div className="w-20 h-20 mx-auto rounded-full bg-emerald-100 border-2 border-emerald-500 flex items-center justify-center text-emerald-600 animate-bounce">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-lg font-black text-emerald-900">បានអនុម័តដោយជោគជ័យ! ✅</h3>
                <p className="text-xs text-slate-500 mt-1">Request Approved &amp; Committed to Local Ledger</p>
              </div>
              <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-800 font-medium">
                ទិន្នន័យត្រូវបានកត់ត្រាចូលក្នុងប្រព័ន្ធស្តុកផ្លូវការដោយ {reviewedBy || 'Admin'}។
              </div>
              <button
                onClick={resetForm}
                className="w-full py-3 bg-slate-900 text-white rounded-2xl text-xs font-bold hover:bg-slate-800 transition-colors"
              >
                ផ្ញើសំណើថ្មីទៀត (Submit Another)
              </button>
            </>
          )}

          {requestStatus === 'REJECTED' && (
            <>
              <div className="w-20 h-20 mx-auto rounded-full bg-rose-100 border-2 border-rose-500 flex items-center justify-center text-rose-600">
                <XCircle className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-lg font-black text-rose-900">សំណើត្រូវបានបដិសេធ ❌</h3>
                <p className="text-xs text-slate-500 mt-1">Request Rejected by Admin</p>
              </div>
              {reviewerNote && (
                <div className="p-3.5 bg-rose-50 rounded-2xl border border-rose-200 text-xs text-rose-800 font-bold text-left">
                  <span className="block text-[10px] uppercase text-rose-500 mb-0.5">មូលហេតុបដិសេធ (Reason):</span>
                  {reviewerNote}
                </div>
              )}
              <button
                onClick={resetForm}
                className="w-full py-3 bg-slate-900 text-white rounded-2xl text-xs font-bold hover:bg-slate-800 transition-colors"
              >
                កែសម្រួល &amp; ផ្ញើឡើងវិញ (Edit &amp; Resubmit)
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  // --- SUBMISSION FORM VIEW ---
  return (
    <div className="min-h-screen bg-slate-100 py-6 px-4 font-sans">
      <div className="max-w-lg mx-auto bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 sm:p-6 text-center relative">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-emerald-400 text-[10px] font-mono font-bold mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Secure Local-First Entry</span>
          </div>
          <h1 className="text-base font-black tracking-wide">ទម្រង់ស្នើសុំ និងបញ្ចូលទិន្នន័យ</h1>
          <p className="text-xs text-slate-400 mt-0.5">Kandal Commissary Kitchen • Local Wi-Fi</p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Requester Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              ឈ្មោះអ្នកស្នើសុំ (Requester Name) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={requesterName}
              onChange={(e) => setRequesterName(e.target.value)}
              placeholder="ឧទាហរណ៍៖ សុខា (Barista) / ធីតា"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {/* Department / Store */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              សាខា ឬផ្នែក (Store / Department) <span className="text-rose-500">*</span>
            </label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-none cursor-pointer"
            >
              {DEPARTMENTS.map((d) => (
                <option key={d.id} value={d.name}>
                  {d.name} ({d.brand})
                </option>
              ))}
            </select>
          </div>

          {/* Action Type */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              ប្រភេទប្រតិបត្តិការ (Transaction Type)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {ACTION_TYPES.map((a) => {
                const Icon = a.icon;
                const isSelected = actionType === a.id;
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => setActionType(a.id)}
                    className={`flex items-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all text-left cursor-pointer ${
                      isSelected ? `${a.color} shadow-xs ring-2 ring-indigo-500/20` : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{a.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Target Date */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              កាលបរិច្ឆេទ (Date)
            </label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {/* Items Selector */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                បញ្ជីទំនិញស្នើសុំ ({items.length} មុខ)
              </label>
              <button
                type="button"
                onClick={handleAddItem}
                className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>បន្ថែមទំនិញ</span>
              </button>
            </div>

            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {items.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-2 text-xs"
                >
                  <div className="flex-1 min-w-0">
                    <select
                      value={item.item_code}
                      onChange={(e) => handleItemChange(idx, e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1.5 font-bold text-slate-800 text-xs focus:outline-none focus:border-indigo-500"
                    >
                      {STARTER_ITEMS.map((si) => (
                        <option key={si.item_code} value={si.item_code}>
                          {si.item_code} - {si.description_khmer} ({si.uom})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="w-20">
                    <input
                      type="number"
                      min="1"
                      value={item.quantity === 0 ? '' : item.quantity}
                      placeholder="Qty"
                      onChange={(e) => handleQuantityChange(idx, parseFloat(e.target.value) || 0)}
                      className="w-full text-center bg-white border border-slate-300 rounded-lg px-2 py-1.5 font-mono font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="w-8 h-8 rounded-lg hover:bg-rose-50 flex items-center justify-center text-slate-400 hover:text-rose-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Operational Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              កំណត់ចំណាំបន្ថែម (Notes / Remarks)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="ព័ត៌មានបន្ថែមសម្រាប់ Admin..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer disabled:opacity-50"
          >
            {submitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                <span>កំពុងផ្ញើសំណើ...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>ផ្ញើសំណើទៅកាន់ Admin (Submit Request)</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function MobileRequestPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-500">Loading request form...</div>}>
      <RequestFormContent />
    </Suspense>
  );
}

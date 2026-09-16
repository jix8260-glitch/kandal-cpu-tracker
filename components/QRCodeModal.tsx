"use client";

import React, { useState, useEffect } from 'react';
import { QrCode, RefreshCw, X, Copy, Check, Smartphone, Wifi, ShieldCheck, Clock } from 'lucide-react';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function QRCodeModal({ isOpen, onClose }: QRCodeModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [qrUrl, setQrUrl] = useState<string>('');
  const [lanIp, setLanIp] = useState<string>('');
  const [expiresAt, setExpiresAt] = useState<number>(0);
  const [secondsLeft, setSecondsLeft] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const fetchQRCode = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/qr/generate?expiry=15');
      const data = await res.json();
      if (data.success) {
        setQrDataUrl(data.qrDataUrl);
        setQrUrl(data.qrUrl);
        setLanIp(data.lanIp);
        setExpiresAt(data.expiresAt);
        setSecondsLeft(Math.max(0, Math.floor((data.expiresAt - Date.now()) / 1000)));
      }
    } catch (err) {
      console.error('Failed to generate QR code:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchQRCode();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!expiresAt) return;
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
      setSecondsLeft(remaining);
      if (remaining === 0) {
        clearInterval(interval);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  const handleCopy = () => {
    if (!qrUrl) return;
    navigator.clipboard.writeText(qrUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const isExpired = secondsLeft === 0;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">QR Code Request Access</h3>
              <p className="text-[11px] text-slate-500">ស្កេនទូរស័ព្ទដើម្បីបញ្ចូលទិន្នន័យលើ Wi-Fi</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* QR Code Container */}
        <div className="mt-5 flex flex-col items-center justify-center">
          <div className="relative p-4 bg-white rounded-2xl border-2 border-slate-900 shadow-md">
            {loading ? (
              <div className="w-56 h-56 flex flex-col items-center justify-center gap-2 text-slate-400">
                <RefreshCw className="w-8 h-8 animate-spin text-indigo-600" />
                <span className="text-xs font-bold">កំពុងបង្កើត QR Code...</span>
              </div>
            ) : qrDataUrl ? (
              <div className="relative">
                <img
                  src={qrDataUrl}
                  alt="Request Access QR Code"
                  className={`w-56 h-56 rounded-lg transition-opacity duration-300 ${isExpired ? 'opacity-20 blur-xs' : 'opacity-100'}`}
                />
                {isExpired && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-900/60 rounded-lg text-white p-4 text-center">
                    <Clock className="w-8 h-8 text-rose-400 animate-pulse" />
                    <span className="text-xs font-bold">QR Code បានផុតកំណត់</span>
                    <button
                      onClick={fetchQRCode}
                      className="mt-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors"
                    >
                      Refresh QR
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="w-56 h-56 flex items-center justify-center text-slate-400 text-xs">
                បរាជ័យក្នុងការផ្ទុក QR Code
              </div>
            )}
          </div>

          {/* Expiry Countdown */}
          {!isExpired && (
            <div className="mt-3 flex items-center gap-1.5 text-xs font-bold text-amber-800 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>
                សុពលភាពនៅសល់៖ {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')} នាទី
              </span>
            </div>
          )}
        </div>

        {/* Network & Security Info */}
        <div className="mt-5 space-y-2 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
            <div className="flex items-center gap-2 text-slate-700 font-bold">
              <Wifi className="w-4 h-4 text-emerald-600" />
              <span>Local Wi-Fi Network Host:</span>
              <span className="font-mono bg-white px-2 py-0.5 rounded border border-slate-300 text-slate-900 font-black">
                {lanIp || '192.168.1.44'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 flex items-start gap-1">
              <Smartphone className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
              <span>ទូរស័ព្ទបុគ្គលិកត្រូវភ្ជាប់ Wi-Fi តែមួយជាមួយកុំព្យូទ័រនេះទើបអាចស្កេនចូលបាន។</span>
            </p>
          </div>

          <div className="flex items-center gap-1.5 p-2 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 text-[11px] font-bold">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Cryptographic HMAC-SHA256 Token ការពារការក្លែងបន្លំទិន្នន័យ</span>
          </div>
        </div>

        {/* Direct Link Copy & Refresh */}
        <div className="mt-4 flex items-center gap-2">
          <button
            onClick={handleCopy}
            disabled={!qrUrl || isExpired}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span>បានចម្លង Link រួចរាល់!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy Link សម្រាប់ផ្ញើ</span>
              </>
            )}
          </button>
          <button
            onClick={fetchQRCode}
            disabled={loading}
            className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold border border-slate-300 transition-colors flex items-center gap-1.5 cursor-pointer"
            title="បង្កើត QR Code ថ្មី"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>
    </div>
  );
}

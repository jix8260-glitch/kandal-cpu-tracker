// components/DailyStoreDistribution.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { saveDailyStoreDistribution, getAllDistributions, StoreRecord } from '@/lib/inventoryStore';
import { 
  Store, Calendar, Save, CheckCircle2, Coffee, ShoppingBag, 
  TrendingUp, Layers, Plus, Minus, ArrowRight
} from 'lucide-react';

const INITIAL_STORES = [
  // Tube Coffee+ (9 Stores)
  { code: 'KPI', name: 'Tube Coffee+ KPI', brand: 'Tube Coffee' as const },
  { code: 'TKC', name: 'Tube Coffee+ TKC', brand: 'Tube Coffee' as const },
  { code: 'CCV', name: 'Tube Coffee+ CCV', brand: 'Tube Coffee' as const },
  { code: 'CDP', name: 'Tube Coffee+ CDP', brand: 'Tube Coffee' as const },
  { code: 'CMH', name: 'Tube Coffee+ CMH', brand: 'Tube Coffee' as const },
  { code: 'KSH', name: 'Tube Coffee+ KSH', brand: 'Tube Coffee' as const },
  { code: 'CKD', name: 'Tube Coffee+ CKD', brand: 'Tube Coffee' as const },
  { code: '2K4', name: 'Tube Coffee+ 2K4', brand: 'Tube Coffee' as const },
  { code: 'RTN', name: 'Tube Coffee+ RTN', brand: 'Tube Coffee' as const },
  // OnMart (4 Stores)
  { code: 'PDK', name: 'OnMart PDK', brand: 'OnMart' as const },
  { code: 'TK',  name: 'OnMart TK',  brand: 'OnMart' as const },
  { code: 'OU3', name: 'OnMart OU3', brand: 'OnMart' as const },
  { code: 'DT',  name: 'OnMart DT',  brand: 'OnMart' as const },
];

export default function DailyStoreDistribution() {
  const [selectedDate, setSelectedDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  const [counts, setCounts] = useState<{ [storeCode: string]: number }>({
    KPI: 10,
    TKC: 10,
    CCV: 10,
  });

  const [isSaved, setIsSaved] = useState(false);
  const [filterBrand, setFilterBrand] = useState<'ALL' | 'Tube Coffee' | 'OnMart'>('ALL');

  // ផ្ទុកទិន្នន័យដែលធ្លាប់ Save មកវិញតាមថ្ងៃ
  useEffect(() => {
    const all = getAllDistributions();
    const forDay = all.filter((r) => r.date === selectedDate);
    if (forDay.length > 0) {
      const newCounts: { [code: string]: number } = {};
      forDay.forEach((r) => {
        newCounts[r.storeCode] = r.itemCount;
      });
      setCounts(newCounts);
    } else {
      // ប្រសិនបើថ្ងៃថ្មី គ្មានទិន្នន័យ
      setCounts({});
    }
  }, [selectedDate]);

  // មុខងារពេលចុច Save
  const handleSave = () => {
    const recordsToSave: StoreRecord[] = INITIAL_STORES.map((s) => {
      const qty = Number(counts[s.code]) || 0;
      return {
        date: selectedDate,
        storeCode: s.code,
        storeName: s.name,
        brand: s.brand,
        itemCount: qty,
        unitPrice: 2.5, // ឧទាហរណ៍តម្លៃ $2.5 ក្នុងមួយ Item
        totalAmount: qty * 2.5,
      };
    });

    saveDailyStoreDistribution(recordsToSave);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  // កែប្រែចំនួន Item របស់សាខា
  const handleCountChange = (storeCode: string, value: number) => {
    const qty = Math.max(0, isNaN(value) ? 0 : value);
    setCounts((prev) => ({
      ...prev,
      [storeCode]: qty,
    }));
  };

  // បន្ថែម ឬបន្ថយរហ័ស (+5 / -5)
  const handleQuickAdjust = (storeCode: string, delta: number) => {
    const current = Number(counts[storeCode]) || 0;
    handleCountChange(storeCode, current + delta);
  };

  // គណនា KPI សរុប
  const totalItemsToday = Object.values(counts).reduce((a, b) => a + (Number(b) || 0), 0);
  const tubeCoffeeTotal = INITIAL_STORES
    .filter((s) => s.brand === 'Tube Coffee')
    .reduce((sum, s) => sum + (Number(counts[s.code]) || 0), 0);
  const onMartTotal = INITIAL_STORES
    .filter((s) => s.brand === 'OnMart')
    .reduce((sum, s) => sum + (Number(counts[s.code]) || 0), 0);

  const filteredStores = INITIAL_STORES.filter(
    (s) => filterBrand === 'ALL' || s.brand === filterBrand
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 sm:p-6 space-y-6">
      {/* 1. HEADER CONTROLS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                កត់ត្រាការចែកចាយតាមសាខា (Daily Store Distribution)
              </h2>
              <p className="text-xs text-slate-500">
                ចែកចាយទំនិញពី Central Kitchen ទៅកាន់សាខាទាំង ១៣
              </p>
            </div>
          </div>
        </div>

        {/* Date Selector & Save Button */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700">
            <Calendar className="w-4 h-4 text-emerald-600 mr-2" />
            <span className="text-slate-500 mr-1.5 hidden sm:inline">កាលបរិច្ឆេទ:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent font-bold text-slate-900 outline-none cursor-pointer"
            />
          </div>

          <button
            onClick={handleSave}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer ${
              isSaved
                ? 'bg-emerald-600 text-white'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
          >
            {isSaved ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>បានរក្សាទុក ✓</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save 💾</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2. KPI METRIC CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100">
          <div className="flex items-center justify-between text-indigo-900 text-xs font-bold uppercase tracking-wider">
            <span>សរុបទាំងអស់ (Total)</span>
            <Layers className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-indigo-950">
            {totalItemsToday.toLocaleString()} <span className="text-xs font-normal text-slate-500">items</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">ចែកចាយក្នុងថ្ងៃ {selectedDate}</div>
        </div>

        <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-100">
          <div className="flex items-center justify-between text-amber-900 text-xs font-bold uppercase tracking-wider">
            <span>Tube Coffee (9 សាខា)</span>
            <Coffee className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-amber-950">
            {tubeCoffeeTotal.toLocaleString()} <span className="text-xs font-normal text-slate-500">items</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">សាខាកាហ្វេ Tube</div>
        </div>

        <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100">
          <div className="flex items-center justify-between text-blue-900 text-xs font-bold uppercase tracking-wider">
            <span>OnMart (4 សាខា)</span>
            <ShoppingBag className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-blue-950">
            {onMartTotal.toLocaleString()} <span className="text-xs font-normal text-slate-500">items</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">ផ្សារទំនើប OnMart</div>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100">
          <div className="flex items-center justify-between text-emerald-900 text-xs font-bold uppercase tracking-wider">
            <span>សរុបទឹកប្រាក់ ($)</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-700">
            ${(totalItemsToday * 2.5).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">គិតជាមធ្យម $2.5 / Item</div>
        </div>
      </div>

      {/* 3. BRAND FILTER BUTTONS */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-bold w-fit">
        <button
          onClick={() => setFilterBrand('ALL')}
          className={`px-3 py-1.5 rounded-lg transition-all ${
            filterBrand === 'ALL'
              ? 'bg-white text-slate-900 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          All 13 Stores ({INITIAL_STORES.length})
        </button>
        <button
          onClick={() => setFilterBrand('Tube Coffee')}
          className={`px-3 py-1.5 rounded-lg transition-all ${
            filterBrand === 'Tube Coffee'
              ? 'bg-amber-100 text-amber-950 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Tube Coffee (9)
        </button>
        <button
          onClick={() => setFilterBrand('OnMart')}
          className={`px-3 py-1.5 rounded-lg transition-all ${
            filterBrand === 'OnMart'
              ? 'bg-blue-100 text-blue-950 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          OnMart (4)
        </button>
      </div>

      {/* 4. STORES DISTRIBUTION TABLE */}
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
              <th className="py-3 px-4">ល.រ</th>
              <th className="py-3 px-4">កូដសាខា</th>
              <th className="py-3 px-4">ឈ្មោះសាខា (Store Name)</th>
              <th className="py-3 px-4">Brand</th>
              <th className="py-3 px-4 text-center">កែសម្រួលរហ័ស</th>
              <th className="py-3 px-4 text-right">ចំនួនទំនិញ (Items)</th>
              <th className="py-3 px-4 text-center">ស្ថានភាព</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
            {filteredStores.map((store, idx) => {
              const qty = Number(counts[store.code]) || 0;
              const isTube = store.brand === 'Tube Coffee';

              return (
                <tr key={store.code} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 text-slate-400 font-mono">{idx + 1}</td>
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">{store.code}</td>
                  <td className="py-3 px-4 font-bold text-slate-900">{store.name}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        isTube ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {store.brand}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="inline-flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleQuickAdjust(store.code, -5)}
                        className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs"
                        title="-5 items"
                      >
                        -5
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickAdjust(store.code, 5)}
                        className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs"
                        title="+5 items"
                      >
                        +5
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickAdjust(store.code, 10)}
                        className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs"
                        title="+10 items"
                      >
                        +10
                      </button>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <input
                      type="number"
                      min="0"
                      value={qty === 0 ? '' : qty}
                      placeholder="0"
                      onChange={(e) =>
                        handleCountChange(store.code, parseFloat(e.target.value) || 0)
                      }
                      className="w-24 text-right bg-slate-50 border border-slate-300 focus:bg-white focus:border-indigo-500 rounded-lg px-2.5 py-1.5 font-mono font-bold text-slate-900 text-xs focus:outline-none"
                    />
                  </td>
                  <td className="py-3 px-4 text-center">
                    {qty > 0 ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>បានកត់ត្រា</span>
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-400">ទទេ (0)</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 5. BOTTOM SUMMARY BAR */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <span className="font-bold text-slate-600">
          បង្ហាញ {filteredStores.length} ក្នុងចំណោម {INITIAL_STORES.length} សាខា
        </span>
        <div className="flex items-center gap-3">
          <span className="text-slate-600 font-bold">សរុបទំនិញចែកថ្ងៃនេះ៖</span>
          <span className="text-base font-black text-indigo-700">
            {totalItemsToday.toLocaleString()} items
          </span>
          <button
            onClick={handleSave}
            className="ml-2 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-xs cursor-pointer"
          >
            Save 💾
          </button>
        </div>
      </div>
    </div>
  );
}

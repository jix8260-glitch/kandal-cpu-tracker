'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { StockItem, StoreLocation, FilterLocation } from '@/lib/types';
import { getNormalizedStarterItems } from '@/lib/starter-items';
import {
  Package,
  Search,
  Coffee,
  Store,
  Layers,
  Save,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  TrendingUp,
  DollarSign,
  ArrowRight,
  Plus,
  Trash2,
  ExternalLink,
  Sparkles,
  SlidersHorizontal,
  X,
  Check
} from 'lucide-react';

export default function ItemMasterPage() {
  const [items, setItems] = useState<StockItem[]>([]);
  const [editedPrices, setEditedPrices] = useState<Record<string, string>>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [selectedLocation, setSelectedLocation] = useState<FilterLocation>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Add Item Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newDescKhmer, setNewDescKhmer] = useState('');
  const [newCategory, setNewCategory] = useState('Daily Product');
  const [newUom, setNewUom] = useState('Pack');
  const [newCpu, setNewCpu] = useState('');
  const [newLocation, setNewLocation] = useState<StoreLocation>('TUBE_COFFEE');
  const [newOpeningStock, setNewOpeningStock] = useState('0');

  // Input refs for keyboard navigation (Enter / Tab)
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // 1. LOAD ITEMS & CURRENT PRICES
  useEffect(() => {
    loadMasterItems();
  }, []);

  const loadMasterItems = async () => {
    setLoading(true);
    try {
      const allStarters = getNormalizedStarterItems() as StockItem[];

      // Read saved custom prices from LocalStorage
      let savedPrices: Record<string, number> = {};
      try {
        const rawV5Prices = localStorage.getItem('kandal_cpu_item_prices_v5');
        if (rawV5Prices) {
          savedPrices = JSON.parse(rawV5Prices);
        }
      } catch (e) {
        console.warn('Error reading kandal_cpu_item_prices_v5', e);
      }

      // Read saved items from cpu_items
      let savedItems: StockItem[] = [];
      try {
        const rawCpuItems = localStorage.getItem('cpu_items');
        if (rawCpuItems) {
          const parsed = JSON.parse(rawCpuItems);
          if (Array.isArray(parsed) && parsed.length > 0) {
            savedItems = parsed;
          }
        }
      } catch (e) {
        console.warn('Error reading cpu_items', e);
      }

      // Try reading cloud sync for shared prices
      try {
        const res = await fetch('/api/sync', { cache: 'no-store' });
        if (res.ok) {
          const syncData = await res.json();
          if (syncData.itemPrices && Object.keys(syncData.itemPrices).length > 0) {
            savedPrices = { ...savedPrices, ...syncData.itemPrices };
          }
        }
      } catch (e) {
        console.warn('Cloud sync fetch error in Master Items', e);
      }

      // Merge base items with saved prices
      const mergedItems: StockItem[] = allStarters.map((item) => {
        const matchingSaved = savedItems.find((si) => (si.code || (si as any).item_code) === item.code);
        const cpuVal = savedPrices[item.code] !== undefined
          ? Number(savedPrices[item.code])
          : matchingSaved && matchingSaved.cpu !== undefined
          ? Number(matchingSaved.cpu)
          : Number(item.cpu) || 0;

        return {
          ...item,
          cpu: cpuVal,
          opening_stock: matchingSaved?.opening_stock ?? item.opening_stock ?? 0,
        };
      });

      setItems(mergedItems);

      // Populate editedPrices dictionary
      const initialPrices: Record<string, string> = {};
      mergedItems.forEach((it) => {
        initialPrices[it.code] = it.cpu > 0 ? it.cpu.toString() : '';
      });
      setEditedPrices(initialPrices);
      setHasUnsavedChanges(false);
    } catch (err) {
      console.error('Error loading master items:', err);
    } finally {
      setLoading(false);
    }
  };

  // 2. HANDLE REAL-TIME PRICE KEY-IN
  const handlePriceInput = (itemCode: string, val: string) => {
    setEditedPrices((prev) => ({
      ...prev,
      [itemCode]: val,
    }));
    setHasUnsavedChanges(true);
  };

  // Keyboard navigation on inputs (Enter moves to next input)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, currentIndex: number, filteredList: StockItem[]) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const nextItem = filteredList[currentIndex + 1];
      if (nextItem && inputRefs.current[nextItem.code]) {
        inputRefs.current[nextItem.code]?.focus();
        inputRefs.current[nextItem.code]?.select();
      }
    }
  };

  // 3. SAVE ALL PRICES & PUSH TO SUMMARY
  const handleSaveAndPush = async () => {
    setIsSaving(true);
    setSaveSuccessMsg('');

    try {
      // Build clean price dictionary
      const newPriceMap: Record<string, number> = {};
      const updatedItems = items.map((it) => {
        const inputVal = editedPrices[it.code];
        const numVal = inputVal !== undefined && inputVal.trim() !== '' ? Math.max(0, parseFloat(inputVal) || 0) : 0;
        newPriceMap[it.code] = numVal;
        return {
          ...it,
          cpu: numVal,
        };
      });

      // 1. Save to LocalStorage for instant local use
      localStorage.setItem('kandal_cpu_item_prices_v5', JSON.stringify(newPriceMap));
      localStorage.setItem('cpu_items', JSON.stringify(updatedItems));

      // 2. Push to /api/sync
      try {
        await fetch('/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            itemPrices: newPriceMap,
            actionMeta: {
              actionType: 'UPDATE_PRICES',
              targetDate: new Date().toISOString().split('T')[0],
            },
          }),
        });
      } catch (apiErr) {
        console.warn('API sync warning:', apiErr);
      }

      // 3. If Supabase configured, update item_master table
      if (isSupabaseConfigured) {
        try {
          for (const [c, p] of Object.entries(newPriceMap)) {
            await supabase.from('item_master').update({ cpu: p }).eq('code', c);
          }
        } catch (sbErr) {
          console.warn('Supabase update warning:', sbErr);
        }
      }

      // 4. Fire storage events so open tabs (like Summary) instantly recalculate
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('storage_updated', { detail: { itemPrices: newPriceMap } }));

      // 5. Update local state
      setItems(updatedItems);
      setHasUnsavedChanges(false);
      setSaveSuccessMsg('✅ បានរក្សាទុក និងរុញតម្លៃទៅកាន់ Summary ដោយជោគជ័យ! (Prices pushed to Summary)');

      setTimeout(() => {
        setSaveSuccessMsg('');
      }, 5000);
    } catch (err) {
      console.error('Error saving prices:', err);
      alert('មានបញ្ហាក្នុងការរក្សាទុក សូមព្យាយាមម្តងទៀត');
    } finally {
      setIsSaving(false);
    }
  };

  // 4. ADD NEW SKU MODAL HANDLER
  const handleAddNewItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode.trim() || !newDescKhmer.trim()) {
      alert('សូមបញ្ចូល Item Code និង Description in Khmer!');
      return;
    }

    const cpuNum = parseFloat(newCpu) || 0;
    const openingNum = parseFloat(newOpeningStock) || 0;

    const newItem: StockItem = {
      id: `custom-${Date.now()}`,
      code: newCode.trim().toUpperCase(),
      description_khmer: newDescKhmer.trim(),
      category: newCategory.trim() || 'Daily Product',
      uom: newUom.trim() || 'Pack',
      cpu: Math.max(0, cpuNum),
      location: newLocation,
      opening_stock: Math.max(0, openingNum),
    };

    const nextItems = [...items, newItem];
    setItems(nextItems);
    setEditedPrices((prev) => ({
      ...prev,
      [newItem.code]: cpuNum > 0 ? cpuNum.toString() : '',
    }));
    setHasUnsavedChanges(true);

    // Save items to local storage
    localStorage.setItem('cpu_items', JSON.stringify(nextItems));

    setIsModalOpen(false);
    setNewCode('');
    setNewDescKhmer('');
    setNewCpu('');
    setNewOpeningStock('0');
  };

  // Delete item
  const handleDeleteItem = (code: string) => {
    const it = items.find((i) => i.code === code);
    if (!it) return;
    if (!window.confirm(`តើអ្នកពិតជាចង់លុបទំនិញ ${it.code} (${it.description_khmer}) មែនទេ?`)) return;

    const nextItems = items.filter((i) => i.code !== code);
    setItems(nextItems);
    localStorage.setItem('cpu_items', JSON.stringify(nextItems));

    const updatedPrices = { ...editedPrices };
    delete updatedPrices[code];
    setEditedPrices(updatedPrices);
    setHasUnsavedChanges(true);
  };

  // 5. EXTRACT UNIQUE CATEGORIES
  const categories = useMemo(() => {
    const set = new Set<string>();
    items.forEach((it) => {
      if (it.category) set.add(it.category);
    });
    return Array.from(set).sort();
  }, [items]);

  // 6. FILTERED ITEMS
  const filteredItems = useMemo(() => {
    return items.filter((it) => {
      // Filter by location/brand
      if (selectedLocation !== 'ALL' && it.location !== selectedLocation) {
        return false;
      }
      // Filter by category
      if (selectedCategory !== 'ALL' && it.category !== selectedCategory) {
        return false;
      }
      // Filter by search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesCode = it.code.toLowerCase().includes(q);
        const matchesKhmer = it.description_khmer.toLowerCase().includes(q);
        const matchesCat = it.category.toLowerCase().includes(q);
        return matchesCode || matchesKhmer || matchesCat;
      }
      return true;
    });
  }, [items, selectedLocation, selectedCategory, searchQuery]);

  // 7. KPI STATISTICS
  const stats = useMemo(() => {
    const total = items.length;
    let pricedCount = 0;
    let tubeCount = 0;
    let tubePriceSum = 0;
    let onmartCount = 0;
    let onmartPriceSum = 0;
    let totalOpeningValuation = 0;

    items.forEach((it) => {
      const priceStr = editedPrices[it.code];
      const p = priceStr !== undefined && priceStr.trim() !== '' ? parseFloat(priceStr) || 0 : it.cpu || 0;
      if (p > 0) pricedCount++;

      if (it.location === 'TUBE_COFFEE') {
        tubeCount++;
        tubePriceSum += p;
      } else {
        onmartCount++;
        onmartPriceSum += p;
      }

      totalOpeningValuation += (Number(it.opening_stock) || 0) * p;
    });

    return {
      total,
      pricedCount,
      unpricedCount: total - pricedCount,
      tubeAvg: tubeCount > 0 ? tubePriceSum / tubeCount : 0,
      tubeCount,
      onmartAvg: onmartCount > 0 ? onmartPriceSum / onmartCount : 0,
      onmartCount,
      totalOpeningValuation,
    };
  }, [items, editedPrices]);

  return (
    <div className="space-y-6 pb-20">
      {/* 1. TOP HEADER & ACTION BANNER */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 sm:p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-black text-xs border border-emerald-200 uppercase tracking-wide">
              Master Pricing Management
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs text-slate-500 font-medium">CPU (Cost Per Unit in USD $)</span>
          </div>
          <h1 className="text-lg sm:text-2xl font-black text-slate-900 mt-1 flex items-center gap-2.5">
            <Package className="w-6 h-6 text-emerald-600" />
            <span>តារាងកំណត់តម្លៃទំនិញ Master Items</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            បញ្ចូលតម្លៃទំនិញ (Key In CPU Price in $) នីមួយៗដោយផ្ទាល់លើតារាង រួចចុច <strong>Save &amp; Push to Summary</strong> ដើម្បីឱ្យប្រព័ន្ធ Store Summary គណនាទឹកប្រាក់ដោយស្វ័យប្រវត្តិ។
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Link
            href="/summary"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 transition-colors shadow-2xs"
            title="ទៅកាន់ Store Summary Tracker"
          >
            <ExternalLink className="w-3.5 h-3.5 text-slate-600" />
            <span>Store Summary ↗</span>
          </Link>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>បន្ថែម SKU ថ្មី</span>
          </button>

          <button
            onClick={handleSaveAndPush}
            disabled={isSaving}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black shadow-md transition-all cursor-pointer ${
              hasUnsavedChanges
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white ring-4 ring-emerald-100 animate-pulse'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>កំពុងរក្សាទុក...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>💾 Save &amp; Push to Summary</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* SUCCESS NOTIFICATION */}
      {saveSuccessMsg && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-5 py-3.5 rounded-2xl flex items-center justify-between gap-3 text-xs font-bold shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{saveSuccessMsg}</span>
          </div>
          <Link
            href="/summary"
            className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-2xs"
          >
            <span>ពិនិត្យមើលក្នុង Summary ↗</span>
          </Link>
        </div>
      )}

      {/* 2. KPI METRICS CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Total Items */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>មុខទំនិញសរុប (Total SKUs)</span>
            <Package className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2 font-mono">
            {stats.total}{' '}
            <span className="text-xs font-normal text-slate-400">Items</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Tube Coffee+ (69) • OnMart (36)
          </div>
        </div>

        {/* Priced Status */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>ដាក់តម្លៃរួច (Priced Items)</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600 mt-2 font-mono">
            {stats.pricedCount} / {stats.total}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {stats.unpricedCount > 0 ? (
              <span className="text-amber-600 font-semibold">នៅខ្វះ {stats.unpricedCount} មុខទៀត</span>
            ) : (
              <span className="text-emerald-600 font-semibold">✅ ដាក់តម្លៃបានគ្រប់ ១០០%</span>
            )}
          </div>
        </div>

        {/* Tube Coffee Average CPU */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>តម្លៃមធ្យម Tube Coffee+</span>
            <Coffee className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-900 mt-2 font-mono">
            ${stats.tubeAvg.toFixed(2)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            គណនាពី {stats.tubeCount} មុខទំនិញ
          </div>
        </div>

        {/* OnMart Average CPU */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>តម្លៃមធ្យម OnMart</span>
            <Store className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-900 mt-2 font-mono">
            ${stats.onmartAvg.toFixed(2)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            គណនាពី {stats.onmartCount} មុខទំនិញ
          </div>
        </div>
      </div>

      {/* 3. FILTER & SEARCH TOOLBAR */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Brand Tabs */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 gap-1">
          <button
            onClick={() => setSelectedLocation('ALL')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              selectedLocation === 'ALL' ? 'bg-white text-slate-900 shadow-xs font-black' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-blue-600" />
            <span>All ({items.length})</span>
          </button>
          <button
            onClick={() => setSelectedLocation('TUBE_COFFEE')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              selectedLocation === 'TUBE_COFFEE' ? 'bg-white text-amber-900 shadow-xs font-black' : 'text-slate-600 hover:text-amber-900'
            }`}
          >
            <Coffee className="w-3.5 h-3.5 text-amber-600" />
            <span>Tube Coffee+ ({items.filter((i) => i.location === 'TUBE_COFFEE').length})</span>
          </button>
          <button
            onClick={() => setSelectedLocation('ONMART')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              selectedLocation === 'ONMART' ? 'bg-white text-emerald-900 shadow-xs font-black' : 'text-slate-600 hover:text-emerald-900'
            }`}
          >
            <Store className="w-3.5 h-3.5 text-emerald-600" />
            <span>OnMart ({items.filter((i) => i.location === 'ONMART').length})</span>
          </button>
        </div>

        {/* Category Dropdown */}
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="ALL">All Categories (គ្រប់ប្រភេទ)</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Search Bar */}
        <div className="relative min-w-[260px] flex-1 sm:flex-initial">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search Code or Khmer (ស្វែងរកឈ្មោះ ឬកូដ)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs"
          />
        </div>
      </div>

      {/* 4. FAST KEY-IN TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">បង្ហាញ {filteredItems.length} មុខទំនិញ</span>
            <span>•</span>
            <span>ចុចលើប្រអប់ <strong>CPU in USD ($)</strong> ដើម្បីវាយបញ្ចូលតម្លៃ រួចចុច <strong>Enter</strong> ដើម្បីរំកិលទៅបន្ទាត់បន្ទាប់</span>
          </div>
          {hasUnsavedChanges && (
            <span className="flex items-center gap-1 text-amber-600 font-bold animate-pulse">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>មានតម្លៃកែប្រែមិនទាន់ Save!</span>
            </span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-900 text-white font-semibold sticky top-0 z-10">
              <tr className="divide-x divide-slate-800">
                <th className="py-3 px-3 w-14 text-center">#</th>
                <th className="py-3 px-3 w-28">Item Code</th>
                <th className="py-3 px-3 min-w-[220px]">Description (Khmer)</th>
                <th className="py-3 px-2.5 text-center w-28">Brand</th>
                <th className="py-3 px-3 w-36">Category</th>
                <th className="py-3 px-2 text-center w-16">UoM</th>
                <th className="py-3 px-4 text-right w-40 bg-emerald-950 text-emerald-200 border-x border-emerald-800">
                  <div className="flex items-center justify-end gap-1">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                    <span>CPU in USD ($) *</span>
                  </div>
                </th>
                <th className="py-3 px-2.5 text-right w-28">Opening Stock</th>
                <th className="py-3 px-3 text-right w-32 bg-slate-800 text-slate-200">Total Value ($)</th>
                <th className="py-3 px-2 text-center w-14">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-16 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
                    <span className="font-bold text-slate-600">កំពុងផ្ទុកបញ្ជីទំនិញ Master Items...</span>
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-16 text-center text-slate-400">
                    រកមិនឃើញមុខទំនិញដែលត្រូវនឹងលក្ខខណ្ឌស្វែងរកនេះទេ។
                  </td>
                </tr>
              ) : (
                filteredItems.map((item, idx) => {
                  const currentInput = editedPrices[item.code] ?? (item.cpu > 0 ? item.cpu.toString() : '');
                  const currentNumeric = currentInput.trim() !== '' ? parseFloat(currentInput) || 0 : 0;
                  const isModified = item.cpu !== currentNumeric;
                  const lineTotalValue = (Number(item.opening_stock) || 0) * currentNumeric;

                  return (
                    <tr
                      key={item.code}
                      className={`transition-colors divide-x divide-slate-100 ${
                        isModified ? 'bg-amber-50/60 hover:bg-amber-50' : 'hover:bg-slate-50'
                      }`}
                    >
                      {/* # Number */}
                      <td className="py-2.5 px-3 text-center text-slate-400 font-mono text-[11px]">
                        {idx + 1}
                      </td>

                      {/* Item Code */}
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                        <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                          {item.code}
                        </span>
                      </td>

                      {/* Description Khmer */}
                      <td className="py-2.5 px-3 font-semibold text-slate-800">
                        {item.description_khmer}
                      </td>

                      {/* Brand */}
                      <td className="py-2.5 px-2.5 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                            item.location === 'TUBE_COFFEE'
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          }`}
                        >
                          {item.location === 'TUBE_COFFEE' ? 'Tube Coffee+' : 'OnMart'}
                        </span>
                      </td>

                      {/* Category */}
                      <td className="py-2.5 px-3 text-slate-600 font-medium">
                        {item.category}
                      </td>

                      {/* UoM */}
                      <td className="py-2.5 px-2 text-center text-slate-600 font-semibold font-mono">
                        {item.uom}
                      </td>

                      {/* DIRECT KEY-IN CPU INPUT */}
                      <td className="py-2 px-3 text-right bg-emerald-50/30">
                        <div className="relative inline-flex items-center w-full justify-end">
                          <span className="absolute left-2.5 text-slate-400 font-bold text-xs pointer-events-none">
                            $
                          </span>
                          <input
                            ref={(el) => {
                              inputRefs.current[item.code] = el;
                            }}
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            value={currentInput}
                            onChange={(e) => handlePriceInput(item.code, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, idx, filteredItems)}
                            className={`w-28 pl-6 pr-2.5 py-1.5 text-right font-mono font-bold text-xs rounded-lg border transition-all focus:outline-none focus:ring-2 ${
                              isModified
                                ? 'bg-amber-50 border-amber-400 text-amber-900 focus:ring-amber-300'
                                : currentNumeric > 0
                                ? 'bg-white border-slate-300 text-slate-900 focus:ring-emerald-400 focus:border-emerald-500'
                                : 'bg-slate-50 border-dashed border-slate-300 text-slate-400 placeholder:text-slate-300 focus:ring-blue-400 focus:border-blue-500'
                            }`}
                          />
                        </div>
                      </td>

                      {/* Opening Stock */}
                      <td className="py-2.5 px-2.5 text-right font-mono font-medium text-slate-700">
                        {Number(item.opening_stock).toLocaleString()}
                      </td>

                      {/* Real-time Calculated Total Value */}
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-800 bg-slate-50/50">
                        ${lineTotalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>

                      {/* Action */}
                      <td className="py-2.5 px-2 text-center">
                        <button
                          onClick={() => handleDeleteItem(item.code)}
                          className="p-1 hover:bg-rose-50 text-slate-300 hover:text-rose-600 rounded transition-colors"
                          title="លុបទំនិញនេះ"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. STICKY FLOATING SAVE BAR */}
      {hasUnsavedChanges && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900 text-white px-6 py-3.5 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-4 animate-in slide-in-from-bottom-5">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
            <span className="text-xs font-bold text-amber-300">
              ⚡ អ្នកមានការកែប្រែតម្លៃដែលមិនទាន់រក្សាទុក!
            </span>
          </div>

          <button
            onClick={handleSaveAndPush}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs rounded-xl transition-colors cursor-pointer shadow-xs"
          >
            {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>Save &amp; Push to Summary Now</span>
          </button>
        </div>
      )}

      {/* 6. ADD NEW ITEM MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-600" />
                <span>បន្ថែមមុខទំនិញថ្មី (Add SKU)</span>
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddNewItem} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Item Code *</label>
                  <input
                    type="text"
                    placeholder="ឧ. V0099"
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-mono font-bold uppercase focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Location / Brand *</label>
                  <select
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="TUBE_COFFEE">Tube Coffee+ (9 ហាង)</option>
                    <option value="ONMART">OnMart (4 ហាង)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description in Khmer *</label>
                <input
                  type="text"
                  placeholder="ឧ. ទឹកស៊ីរ៉ូប្លូបឺរី (1000ml)"
                  value={newDescKhmer}
                  onChange={(e) => setNewDescKhmer(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category</label>
                  <input
                    type="text"
                    placeholder="Daily Product, Dry Store..."
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Unit of Measure (UoM)</label>
                  <input
                    type="text"
                    placeholder="Pack, Can, Bottle..."
                    value={newUom}
                    onChange={(e) => setNewUom(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">CPU in USD ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={newCpu}
                    onChange={(e) => setNewCpu(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Opening Stock</label>
                  <input
                    type="number"
                    min="0"
                    value={newOpeningStock}
                    onChange={(e) => setNewOpeningStock(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs cursor-pointer"
                >
                  បន្ថែម SKU ថ្មី
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

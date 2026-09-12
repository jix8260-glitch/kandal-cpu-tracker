'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { getNormalizedStarterItems } from '@/lib/starter-items';
import {
  Save,
  Search,
  Calendar,
  RefreshCw,
  Coffee,
  Store,
  Layers,
  DollarSign,
  Package,
  ArrowDownLeft,
  ArrowUpRight,
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Database,
  UploadCloud,
} from 'lucide-react';

interface StockItem {
  id: string;
  code: string;
  description_khmer: string;
  category: string;
  uom: string;
  cpu: number;
  location: 'TUBE_COFFEE' | 'ONMART';
  opening_stock: number;
}

export default function StockTrackerOnline() {
  const [items, setItems] = useState<StockItem[]>([]);
  const [dailyLogs, setDailyLogs] = useState<Record<string, { stock_in: number; stock_out: number }>>({});
  const [selectedLocation, setSelectedLocation] = useState<'ALL' | 'TUBE_COFFEE' | 'ONMART'>('ALL');
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [seeding, setSeeding] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // 1. Load Data from Cloud Server (or fallback to Starter Items)
  useEffect(() => {
    fetchData();
  }, [selectedDate, selectedLocation]);

  const fetchData = async () => {
    setLoading(true);
    try {
      let query = supabase.from('item_master').select('*').order('code');
      if (selectedLocation !== 'ALL') {
        query = query.eq('location', selectedLocation);
      }
      let { data: itemData, error: itemError } = await query;
      
      // If item_master is empty or not found, try the 'items' table
      if (itemError || !itemData || itemData.length === 0) {
        let itemsQuery = supabase.from('items').select('*');
        if (selectedLocation !== 'ALL') {
          const locName = selectedLocation === 'TUBE_COFFEE' ? 'Tube Coffee' : 'OnMart';
          itemsQuery = itemsQuery.or(`location.eq.${selectedLocation},location.eq.${locName}`);
        }
        const { data: altData, error: altError } = await itemsQuery;
        if (!altError && altData && altData.length > 0) {
          itemData = altData.map((it: any) => ({
            id: it.id || `item-${it.item_code || it.code}`,
            code: it.item_code || it.code,
            description_khmer: it.description_khmer,
            category: it.category,
            uom: it.uom,
            cpu: Number(it.cpu) || 0,
            location: String(it.location).toUpperCase().includes('TUBE') ? 'TUBE_COFFEE' : 'ONMART',
            opening_stock: Number(it.opening_stock) || 0,
          }));
          itemError = null;
        }
      }

      let finalItems: StockItem[] = [];
      if (itemError || !itemData || itemData.length === 0) {
        // Fallback to starter items from lib/starter-items.ts (105 items)
        const starters = getNormalizedStarterItems() as StockItem[];
        finalItems = selectedLocation === 'ALL'
          ? starters
          : starters.filter((it) => it.location === selectedLocation);
      } else {
        finalItems = itemData as StockItem[];
      }

      setItems(finalItems);

      // Fetch logs for selected date
      const { data: logData, error: logError } = await supabase
        .from('daily_stock_logs')
        .select('*')
        .eq('entry_date', selectedDate);

      if (logError) throw logError;

      const logMap: Record<string, { stock_in: number; stock_out: number }> = {};
      logData?.forEach((log: any) => {
        logMap[log.item_id] = {
          stock_in: Number(log.stock_in) || 0,
          stock_out: Number(log.stock_out) || 0,
        };
      });

      setDailyLogs(logMap);
    } catch (err: any) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  // 2. Handle Online Key-In
  const handleInputChange = (itemId: string, field: 'stock_in' | 'stock_out', value: number) => {
    setDailyLogs((prev) => ({
      ...prev,
      [itemId]: {
        stock_in: prev[itemId]?.stock_in || 0,
        stock_out: prev[itemId]?.stock_out || 0,
        [field]: Math.max(0, value || 0),
      },
    }));
  };

  // 3. Save directly to Cloud Database (Server)
  const handleSaveOnline = async () => {
    setSaving(true);
    try {
      const updates = Object.entries(dailyLogs).map(([itemId, log]) => ({
        item_id: itemId,
        entry_date: selectedDate,
        stock_in: log.stock_in || 0,
        stock_out: log.stock_out || 0,
      }));

      if (updates.length === 0) {
        alert('ℹ️ មិនមានទិន្នន័យត្រូវរក្សាទុកទេ។ (No stock logs to save)');
        setSaving(false);
        return;
      }

      const { error } = await supabase
        .from('daily_stock_logs')
        .upsert(updates, { onConflict: 'item_id,entry_date' });

      if (error) throw error;
      alert('✅ រក្សាទុកក្នុង Server បានជោគជ័យ! (Saved to Server)');
    } catch (err: any) {
      alert('❌ បរាជ័យក្នុងការរក្សាទុក: ' + (err?.message || 'Database error'));
    } finally {
      setSaving(false);
    }
  };

  // 4. Seed / Sync Starter Items to Supabase Cloud Database
  const handleSeedToCloud = async () => {
    if (!confirm('តើអ្នកចង់បញ្ចូលបញ្ជីទំនិញពី lib/starter-items.ts ទៅកាន់ Cloud Supabase ដែរឬទេ? (Upload starter items to Cloud?)')) {
      return;
    }
    setSeeding(true);
    try {
      const itemsToSeed = getNormalizedStarterItems().map((it) => ({
        code: it.code,
        description_khmer: it.description_khmer,
        category: it.category,
        uom: it.uom,
        cpu: it.cpu,
        location: it.location,
        opening_stock: it.opening_stock,
      }));

      const { error } = await supabase
        .from('item_master')
        .upsert(itemsToSeed, { onConflict: 'code' });

      if (error) throw error;
      alert('✅ បានបញ្ចូលបញ្ជីទំនិញទៅ Cloud Database ដោយជោគជ័យ! (Starter items synced)');
      fetchData();
    } catch (err: any) {
      alert('❌ បរាជ័យក្នុងការបញ្ចូល: ' + (err?.message || 'Check database connection'));
    } finally {
      setSeeding(false);
    }
  };

  // Date Stepper
  const changeDateByDays = (days: number) => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + days);
    setSelectedDate(current.toISOString().split('T')[0]);
  };

  const filteredItems = items.filter(
    (item) =>
      item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description_khmer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Summary Totals
  let totalStockValue = 0;
  let totalStockIn = 0;
  let totalStockOut = 0;
  let totalOpeningStock = 0;
  let totalBalance = 0;

  const calculatedRows = filteredItems.map((item) => {
    const log = dailyLogs[item.id] || { stock_in: 0, stock_out: 0 };
    const stockIn = log.stock_in || 0;
    const stockOut = log.stock_out || 0;
    const balance = item.opening_stock + stockIn - stockOut;
    const stockValue = balance * item.cpu;

    totalOpeningStock += item.opening_stock;
    totalStockIn += stockIn;
    totalStockOut += stockOut;
    totalBalance += balance;
    totalStockValue += stockValue;

    return {
      ...item,
      stock_in: stockIn,
      stock_out: stockOut,
      balance,
      stockValue,
      isNegative: balance < 0,
      isLow: balance <= 15,
    };
  });

  return (
    <div className="space-y-6">
      {/* Control Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight flex items-center gap-2">
              <span>Online Stock Tracker (ប្រព័ន្ធតាមដានស្តុកប្រចាំថ្ងៃ)</span>
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Key in daily stock online and sync live with Cloud Database (item_master &amp; daily_stock_logs)
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleSeedToCloud}
              disabled={seeding}
              className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-semibold border border-indigo-200 transition-colors"
              title="Sync starter items to Supabase"
            >
              <UploadCloud className={`w-3.5 h-3.5 ${seeding ? 'animate-bounce' : ''}`} />
              <span>{seeding ? 'Syncing...' : 'Sync Items to Cloud (បញ្ចូលទំនិញ)'}</span>
            </button>

            <button
              onClick={fetchData}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold border border-slate-300 transition-colors"
              title="Refresh from Server"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh (ផ្ទុកឡើងវិញ)</span>
            </button>

            <button
              onClick={handleSaveOnline}
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Online (រក្សាទុកក្នុង Server)'}</span>
            </button>
          </div>
        </div>

        {/* Filters & Navigation */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Location Switcher */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 gap-1">
            <button
              onClick={() => setSelectedLocation('ALL')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
                selectedLocation === 'ALL'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              <span>All Locations (រួម)</span>
            </button>

            <button
              onClick={() => setSelectedLocation('TUBE_COFFEE')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
                selectedLocation === 'TUBE_COFFEE'
                  ? 'bg-white text-amber-900 shadow-xs'
                  : 'text-slate-600 hover:text-amber-800'
              }`}
            >
              <Coffee className="w-3.5 h-3.5 text-amber-600" />
              <span>Tube Coffee</span>
            </button>

            <button
              onClick={() => setSelectedLocation('ONMART')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
                selectedLocation === 'ONMART'
                  ? 'bg-white text-emerald-900 shadow-xs'
                  : 'text-slate-600 hover:text-emerald-800'
              }`}
            >
              <Store className="w-3.5 h-3.5 text-emerald-600" />
              <span>OnMart</span>
            </button>
          </div>

          {/* Date Picker */}
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-600 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Date (កាលបរិច្ឆេទ):</span>
            </span>
            <div className="flex items-center bg-white border border-slate-300 rounded-xl px-1 py-0.5 shadow-2xs">
              <button
                onClick={() => changeDateByDays(-1)}
                className="p-1 hover:bg-slate-100 rounded text-slate-600"
                title="Previous Day"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-2 py-1 text-xs font-bold text-slate-800 focus:outline-none bg-transparent"
              />
              <button
                onClick={() => changeDateByDays(1)}
                className="p-1 hover:bg-slate-100 rounded text-slate-600"
                title="Next Day"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative min-w-[240px] flex-1 sm:flex-initial">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search Code or Description (ស្វែងរក)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-2xs"
            />
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Stock Value */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2 text-xs font-semibold uppercase">
            <span>Total Stock Value</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            ${totalStockValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex justify-between pt-2 border-t border-slate-100">
            <span>Date: {selectedDate}</span>
            <span className="font-semibold text-emerald-700">{selectedLocation}</span>
          </div>
        </div>

        {/* Stock In */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2 text-xs font-semibold uppercase">
            <span>Stock In Today</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-700">
            +{totalStockIn.toLocaleString()} <span className="text-xs font-normal text-slate-500">units</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex justify-between pt-2 border-t border-slate-100">
            <span>Incoming</span>
            <span className="bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded font-medium">Restocked</span>
          </div>
        </div>

        {/* Stock Out */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2 text-xs font-semibold uppercase">
            <span>Stock Out Today</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-700">
            -{totalStockOut.toLocaleString()} <span className="text-xs font-normal text-slate-500">units</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex justify-between pt-2 border-t border-slate-100">
            <span>Outgoing</span>
            <span className="bg-amber-50 text-amber-800 px-1.5 py-0.5 rounded font-medium">Usage / Sold</span>
          </div>
        </div>

        {/* Active Items */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2 text-xs font-semibold uppercase">
            <span>Tracked Items</span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-800">
            {filteredItems.length} <span className="text-xs font-normal text-slate-500">SKUs</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex justify-between pt-2 border-t border-slate-100">
            <span>Total Units: {totalBalance.toLocaleString()}</span>
            <span className="text-blue-600 font-bold">Cloud Synced</span>
          </div>
        </div>
      </div>

      {/* Interactive Stock Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto max-h-[620px] relative">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-900 text-white font-semibold sticky top-0 z-10 shadow-xs">
              <tr className="divide-x divide-slate-800">
                <th className="py-3 px-3 w-28">Item Code</th>
                <th className="py-3 px-3 min-w-[240px]">Description (Khmer)</th>
                <th className="py-3 px-2.5 text-center w-28">Location</th>
                <th className="py-3 px-2.5 w-24">Category</th>
                <th className="py-3 px-2 text-center w-14">UoM</th>
                <th className="py-3 px-2.5 text-right w-20">CPU ($)</th>
                <th className="py-3 px-2.5 text-right w-24 bg-slate-800/80">Opening</th>
                <th className="py-3 px-3 text-right w-28 bg-emerald-900/50 text-emerald-200">
                  Stock In
                </th>
                <th className="py-3 px-3 text-right w-28 bg-amber-900/50 text-amber-200">
                  Stock Out
                </th>
                <th className="py-3 px-2.5 text-right w-28 bg-slate-800/90 text-blue-200">
                  Current Stock
                </th>
                <th className="py-3 px-2.5 text-right w-28 bg-slate-800/90 text-emerald-200">
                  Stock Value ($)
                </th>
                <th className="py-3 px-2 text-center w-24">Status</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={12} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-emerald-600" />
                    <span>Loading data from Server...</span>
                  </td>
                </tr>
              ) : calculatedRows.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-12 text-center text-slate-400">
                    <Database className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-600">No items found in `item_master` table.</p>
                  </td>
                </tr>
              ) : (
                calculatedRows.map((row) => (
                  <tr
                    key={row.id}
                    className={`transition-colors divide-x divide-slate-100 ${
                      row.isNegative
                        ? 'bg-rose-50/60 hover:bg-rose-100/50'
                        : row.isLow
                        ? 'bg-amber-50/50 hover:bg-amber-100/50'
                        : 'hover:bg-slate-50/80'
                    }`}
                  >
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                      {row.code}
                    </td>

                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-slate-900 leading-snug">
                        {row.description_khmer}
                      </div>
                    </td>

                    <td className="py-2.5 px-2.5 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                          row.location === 'TUBE_COFFEE'
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        {row.location === 'TUBE_COFFEE' ? <Coffee className="w-2.5 h-2.5" /> : <Store className="w-2.5 h-2.5" />}
                        {row.location === 'TUBE_COFFEE' ? 'Tube Coffee' : 'OnMart'}
                      </span>
                    </td>

                    <td className="py-2.5 px-2.5 text-slate-600 font-medium">
                      {row.category}
                    </td>

                    <td className="py-2.5 px-2 text-center text-slate-600 font-semibold">
                      {row.uom}
                    </td>

                    <td className="py-2.5 px-2.5 text-right font-semibold text-slate-700">
                      ${Number(row.cpu).toFixed(2)}
                    </td>

                    <td className="py-2.5 px-2.5 text-right font-medium text-slate-700 bg-slate-50/40">
                      {Number(row.opening_stock).toLocaleString()}
                    </td>

                    {/* Stock In Input */}
                    <td className="py-2 px-2.5 text-right bg-emerald-50/30">
                      <input
                        type="number"
                        min="0"
                        value={row.stock_in === 0 ? '' : row.stock_in}
                        placeholder="0"
                        onChange={(e) =>
                          handleInputChange(row.id, 'stock_in', parseFloat(e.target.value) || 0)
                        }
                        className="w-full text-right bg-white border border-emerald-300 rounded-lg px-2 py-1 font-bold text-emerald-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-2xs"
                      />
                    </td>

                    {/* Stock Out Input */}
                    <td className="py-2 px-2.5 text-right bg-amber-50/30">
                      <input
                        type="number"
                        min="0"
                        value={row.stock_out === 0 ? '' : row.stock_out}
                        placeholder="0"
                        onChange={(e) =>
                          handleInputChange(row.id, 'stock_out', parseFloat(e.target.value) || 0)
                        }
                        className="w-full text-right bg-white border border-amber-300 rounded-lg px-2 py-1 font-bold text-amber-800 focus:outline-none focus:ring-1 focus:ring-amber-500 shadow-2xs"
                      />
                    </td>

                    {/* Balance */}
                    <td className="py-2.5 px-2.5 text-right font-bold bg-slate-50/60">
                      <span
                        className={
                          row.isNegative
                            ? 'text-rose-700 font-black'
                            : row.isLow
                            ? 'text-amber-700'
                            : 'text-slate-900'
                        }
                      >
                        {row.balance.toLocaleString()}
                      </span>
                    </td>

                    {/* Stock Value */}
                    <td className="py-2.5 px-2.5 text-right font-bold text-slate-900 bg-slate-50/40">
                      ${row.stockValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>

                    {/* Status */}
                    <td className="py-2.5 px-2 text-center">
                      {row.isNegative ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                          Negative
                        </span>
                      ) : row.isLow ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                          Low Stock
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                          Optimal
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>

            {/* Sticky Table Footer */}
            <tfoot className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300 sticky bottom-0 z-10 shadow-xs">
              <tr className="divide-x divide-slate-200">
                <td colSpan={6} className="py-3 px-3 uppercase text-xs tracking-wider">
                  Total Summary ({calculatedRows.length} Items Displayed)
                </td>
                <td className="py-3 px-2.5 text-right">{totalOpeningStock.toLocaleString()}</td>
                <td className="py-3 px-3 text-right text-emerald-700 font-extrabold">
                  +{totalStockIn.toLocaleString()}
                </td>
                <td className="py-3 px-3 text-right text-amber-700 font-extrabold">
                  -{totalStockOut.toLocaleString()}
                </td>
                <td className="py-3 px-2.5 text-right font-black text-blue-900">
                  {totalBalance.toLocaleString()}
                </td>
                <td className="py-3 px-2.5 text-right font-black text-emerald-900">
                  ${totalStockValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}

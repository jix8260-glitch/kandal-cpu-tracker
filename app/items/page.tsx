'use client';

import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { StockItem, StoreLocation, FilterLocation } from '@/lib/types';
import { getNormalizedStarterItems } from '@/lib/starter-items';
import {
  Plus,
  Search,
  Coffee,
  Store,
  Layers,
  Edit2,
  Trash2,
  Check,
  X,
  RefreshCw,
  Package,
} from 'lucide-react';

export default function ItemMasterPage() {
  const [items, setItems] = useState<StockItem[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<FilterLocation>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Editing CPU inline
  const [editingCpuId, setEditingCpuId] = useState<string | null>(null);
  const [cpuInput, setCpuInput] = useState('');

  // Add Item Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [code, setCode] = useState('');
  const [descKhmer, setDescKhmer] = useState('');
  const [category, setCategory] = useState('Coffee Beans');
  const [uom, setUom] = useState('kg');
  const [cpu, setCpu] = useState('14.50');
  const [location, setLocation] = useState<StoreLocation>('TUBE_COFFEE');
  const [openingStock, setOpeningStock] = useState('50');

  useEffect(() => {
    fetchItems();
  }, [selectedLocation]);

  const fetchItems = async () => {
    setLoading(true);
    const allStarters = getNormalizedStarterItems() as StockItem[];

    if (!isSupabaseConfigured) {
      let filtered = allStarters;
      if (selectedLocation !== 'ALL') {
        filtered = filtered.filter((i) => i.location === selectedLocation);
      }
      setItems(filtered);
      setLoading(false);
      return;
    }

    try {
      let query = supabase.from('item_master').select('*').order('code');
      if (selectedLocation !== 'ALL') {
        query = query.eq('location', selectedLocation);
      }
      let { data, error } = await query;

      if (error || !data || data.length === 0) {
        let itemsQuery = supabase.from('items').select('*');
        if (selectedLocation !== 'ALL') {
          const locName = selectedLocation === 'TUBE_COFFEE' ? 'Tube Coffee' : 'OnMart';
          itemsQuery = itemsQuery.or(`location.eq.${selectedLocation},location.eq.${locName}`);
        }
        const { data: altData, error: altError } = await itemsQuery;
        if (!altError && altData && altData.length > 0) {
          data = altData.map((it: any) => ({
            id: it.id || `item-${it.item_code || it.code}`,
            code: it.item_code || it.code,
            description_khmer: it.description_khmer,
            category: it.category,
            uom: it.uom,
            cpu: Number(it.cpu) || 0,
            location: String(it.location).toUpperCase().includes('TUBE') ? 'TUBE_COFFEE' : 'ONMART',
            opening_stock: Number(it.opening_stock) || 0,
          }));
          error = null;
        }
      }

      if (error || !data || data.length === 0) {
        setItems(selectedLocation === 'ALL' ? allStarters : allStarters.filter((i) => i.location === selectedLocation));
      } else {
        setItems(data);
      }
    } catch (err) {
      console.error('Fetch items error:', err);
      setItems(allStarters.filter((i) => selectedLocation === 'ALL' || i.location === selectedLocation));
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCpu = async (itemId: string) => {
    const val = parseFloat(cpuInput);
    if (isNaN(val) || val < 0) return;

    // Optimistic UI update
    setItems((prev) => prev.map((i) => (i.id === itemId ? { ...i, cpu: val } : i)));
    setEditingCpuId(null);

    if (isSupabaseConfigured) {
      await supabase.from('item_master').update({ cpu: val }).eq('id', itemId);
    }
  };

  const handleDelete = async (item: StockItem) => {
    if (!window.confirm(`Delete ${item.code} (${item.description_khmer})?`)) return;

    setItems((prev) => prev.filter((i) => i.id !== item.id));

    if (isSupabaseConfigured) {
      await supabase.from('item_master').delete().eq('id', item.id);
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      code: code.trim().toUpperCase(),
      description_khmer: descKhmer.trim(),
      category: category.trim(),
      uom: uom.trim(),
      cpu: Math.max(0, parseFloat(cpu) || 0),
      location,
      opening_stock: Math.max(0, parseFloat(openingStock) || 0),
    };

    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('item_master').insert([payload]).select();
      if (!error && data) {
        setItems((prev) => [...prev, data[0]]);
      }
    } else {
      setItems((prev) => [...prev, { ...payload, id: 'local-' + Date.now() }]);
    }

    setIsModalOpen(false);
    setCode('');
    setDescKhmer('');
  };

  const filteredItems = items.filter(
    (i) =>
      i.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.description_khmer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-600" />
            <span>Item Master &amp; CPU Management</span>
          </h2>
          <p className="text-xs text-slate-500">
            Manage SKU specifications, Khmer descriptions, units of measure, and unit costs ($)
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Item (បន្ថែមមុខទំនិញ)</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 gap-1">
          <button
            onClick={() => setSelectedLocation('ALL')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold ${
              selectedLocation === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-blue-600" />
            <span>All</span>
          </button>
          <button
            onClick={() => setSelectedLocation('TUBE_COFFEE')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold ${
              selectedLocation === 'TUBE_COFFEE' ? 'bg-white text-amber-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            <Coffee className="w-3.5 h-3.5 text-amber-600" />
            <span>Tube Coffee+ (9 ហាង)</span>
          </button>
          <button
            onClick={() => setSelectedLocation('ONMART')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold ${
              selectedLocation === 'ONMART' ? 'bg-white text-emerald-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            <Store className="w-3.5 h-3.5 text-emerald-600" />
            <span>OnMart (4 ហាង)</span>
          </button>
        </div>

        <div className="relative min-w-[240px] flex-1 sm:flex-initial">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search Code or Khmer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs"
          />
        </div>
      </div>

      {/* Item Master Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-900 text-white font-semibold sticky top-0 z-10">
              <tr className="divide-x divide-slate-800">
                <th className="py-3 px-3 w-28">Item Code</th>
                <th className="py-3 px-3 min-w-[240px]">Description (Khmer)</th>
                <th className="py-3 px-2.5 text-center w-28">Location</th>
                <th className="py-3 px-3 w-32">Category</th>
                <th className="py-3 px-2 text-center w-16">UoM</th>
                <th className="py-3 px-3 text-right w-32 bg-slate-800 text-emerald-200">CPU in USD ($)</th>
                <th className="py-3 px-2.5 text-right w-28">Jan Opening</th>
                <th className="py-3 px-2.5 text-center w-20">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-600" />
                    <span>Loading SKU directory...</span>
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No items found matching the selected criteria.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const isEditing = editingCpuId === item.id;
                  return (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors divide-x divide-slate-100">
                      <td className="py-3 px-3 font-mono font-bold text-slate-900">{item.code}</td>
                      <td className="py-3 px-3 font-semibold text-slate-800">{item.description_khmer}</td>
                      <td className="py-3 px-2.5 text-center">
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
                      <td className="py-3 px-3 text-slate-600 font-medium">{item.category}</td>
                      <td className="py-3 px-2 text-center text-slate-600 font-semibold">{item.uom}</td>
                      <td className="py-3 px-3 text-right bg-slate-50/60">
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-1">
                            <input
                              type="number"
                              step="0.01"
                              value={cpuInput}
                              onChange={(e) => setCpuInput(e.target.value)}
                              className="w-20 px-1 py-0.5 bg-white border border-blue-500 rounded text-right font-bold text-xs"
                              autoFocus
                            />
                            <button
                              onClick={() => handleSaveCpu(item.id)}
                              className="p-1 rounded bg-emerald-600 text-white"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => setEditingCpuId(null)}
                              className="p-1 rounded bg-slate-200 text-slate-600"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setEditingCpuId(item.id);
                              setCpuInput(item.cpu.toString());
                            }}
                            className="font-bold text-slate-900 hover:text-blue-600 inline-flex items-center gap-1 group"
                          >
                            <span>${Number(item.cpu).toFixed(2)}</span>
                            <Edit2 className="w-3 h-3 text-blue-500 opacity-0 group-hover:opacity-100" />
                          </button>
                        )}
                      </td>
                      <td className="py-3 px-2.5 text-right font-medium text-slate-700">
                        {Number(item.opening_stock).toLocaleString()}
                      </td>
                      <td className="py-3 px-2.5 text-center">
                        <button
                          onClick={() => handleDelete(item)}
                          className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                          title="Delete SKU"
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

      {/* Add Item Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-sm text-slate-900">Add New SKU to `item_master`</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddItem} className="p-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Item Code *</label>
                  <input
                    type="text"
                    placeholder="e.g. TC-115"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 font-mono font-bold uppercase focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Location *</label>
                  <select
                    value={location}
                    onChange={(e) => setLocation(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="TUBE_COFFEE">Tube Coffee+</option>
                    <option value="ONMART">OnMart</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description in Khmer *</label>
                <input
                  type="text"
                  placeholder="e.g. គ្រាប់កាហ្វេ Arabica Roast 1kg"
                  value={descKhmer}
                  onChange={(e) => setDescKhmer(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category</label>
                  <input
                    type="text"
                    placeholder="e.g. Coffee Beans"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Unit of Measure (UoM)</label>
                  <input
                    type="text"
                    placeholder="kg, Can, Bottle..."
                    value={uom}
                    onChange={(e) => setUom(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                    value={cpu}
                    onChange={(e) => setCpu(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Opening Stock</label>
                  <input
                    type="number"
                    min="0"
                    value={openingStock}
                    onChange={(e) => setOpeningStock(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xs"
                >
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

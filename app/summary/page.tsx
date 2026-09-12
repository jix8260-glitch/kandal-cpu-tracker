'use client';

import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { StockItem, FilterLocation } from '@/lib/types';
import { BarChart3, Coffee, Store, Layers, TrendingUp } from 'lucide-react';

import { getNormalizedStarterItems } from '@/lib/starter-items';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function SummaryPage() {
  const [items, setItems] = useState<StockItem[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<FilterLocation>('ALL');

  useEffect(() => {
    const fetchSummary = async () => {
      const allStarters = getNormalizedStarterItems() as StockItem[];

      if (!isSupabaseConfigured) {
        setItems(selectedLocation === 'ALL' ? allStarters : allStarters.filter((i) => i.location === selectedLocation));
        return;
      }

      try {
        let query = supabase.from('item_master').select('*');
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
          const { data: altData } = await itemsQuery;
          if (altData && altData.length > 0) {
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
          }
        }

        if (!data || data.length === 0) {
          setItems(selectedLocation === 'ALL' ? allStarters : allStarters.filter((i) => i.location === selectedLocation));
        } else {
          setItems(data);
        }
      } catch {
        setItems(selectedLocation === 'ALL' ? allStarters : allStarters.filter((i) => i.location === selectedLocation));
      }
    };
    fetchSummary();
  }, [selectedLocation]);

  const tubeItems = items.filter((i) => i.location === 'TUBE_COFFEE');
  const martItems = items.filter((i) => i.location === 'ONMART');

  const tubeValuation = tubeItems.reduce((acc, i) => acc + i.opening_stock * i.cpu, 0);
  const martValuation = martItems.reduce((acc, i) => acc + i.opening_stock * i.cpu, 0);
  const totalValuation = tubeValuation + martValuation;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-600" />
            <span>Monthly &amp; Annual Stock Summary</span>
          </h2>
          <p className="text-xs text-slate-500">
            Consolidated overview across Tube Coffee and OnMart stores
          </p>
        </div>

        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 gap-1 text-xs font-bold">
          <button
            onClick={() => setSelectedLocation('ALL')}
            className={`px-3 py-1.5 rounded-lg ${selectedLocation === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'}`}
          >
            All
          </button>
          <button
            onClick={() => setSelectedLocation('TUBE_COFFEE')}
            className={`px-3 py-1.5 rounded-lg ${selectedLocation === 'TUBE_COFFEE' ? 'bg-white text-amber-900 shadow-xs' : 'text-slate-600'}`}
          >
            Tube Coffee
          </button>
          <button
            onClick={() => setSelectedLocation('ONMART')}
            className={`px-3 py-1.5 rounded-lg ${selectedLocation === 'ONMART' ? 'bg-white text-emerald-900 shadow-xs' : 'text-slate-600'}`}
          >
            OnMart
          </button>
        </div>
      </div>

      {/* Location Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div className="bg-white rounded-2xl p-5 border border-amber-200 shadow-2xs">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
              <Coffee className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 uppercase">Tube Coffee</h4>
              <p className="text-[11px] text-slate-500">{tubeItems.length} SKUs registered</p>
            </div>
          </div>
          <div className="text-xl font-black text-amber-900">
            ${tubeValuation.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Starting Stock Valuation</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-emerald-200 shadow-2xs">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Store className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 uppercase">OnMart</h4>
              <p className="text-[11px] text-slate-500">{martItems.length} SKUs registered</p>
            </div>
          </div>
          <div className="text-xl font-black text-emerald-900">
            ${martValuation.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Starting Stock Valuation</p>
        </div>

        <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-white/10 text-white flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h4 className="font-bold uppercase tracking-wider text-slate-200">Combined Total</h4>
              <p className="text-[11px] text-slate-400">{items.length} Total Registered SKUs</p>
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-400">
            ${totalValuation.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Total Asset Value</p>
        </div>
      </div>
    </div>
  );
}

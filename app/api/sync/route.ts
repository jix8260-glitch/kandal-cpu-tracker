import { NextRequest, NextResponse } from 'next/server';
import { AuditLogEntry } from '@/lib/types';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

const FALLBACK_CLOUD_OBJECT_ID = 'ff808181a067127101a09522e8a600ef';
const FALLBACK_CLOUD_URL = `https://api.restful-api.dev/objects/${FALLBACK_CLOUD_OBJECT_ID}`;

export type { AuditLogEntry };

export async function GET() {
  // 1. If Supabase is configured, fetch directly from Supabase tables
  if (isSupabaseConfigured) {
    try {
      const [distRes, stockRes, itemsRes, logsRes] = await Promise.all([
        supabase.from('daily_distributions').select('*'),
        supabase.from('daily_stock_logs').select('*'),
        supabase.from('item_master').select('*'),
        supabase.from('access_logs').select('*').order('timestamp', { ascending: false }).limit(100),
      ]);

      const storesByDate: Record<string, any[]> = {};
      if (distRes.data) {
        for (const row of distRes.data) {
          const d = row.date;
          if (!storesByDate[d]) storesByDate[d] = [];
          storesByDate[d].push({
            id: row.store_id,
            code: row.store_id,
            dailyAmount: Number(row.quantity) || 0,
          });
        }
      }

      const stockByDate: Record<string, any[]> = {};
      if (stockRes.data) {
        for (const row of stockRes.data) {
          const d = row.date;
          if (!stockByDate[d]) stockByDate[d] = [];
          stockByDate[d].push({
            item_code: row.item_code,
            stock_in: Number(row.stock_in) || 0,
            stock_out: Number(row.stock_out) || 0,
          });
        }
      }

      const itemPrices: Record<string, number> = {};
      if (itemsRes.data) {
        for (const item of itemsRes.data) {
          itemPrices[item.item_code] = Number(item.cpu) || 0;
        }
      }

      const auditLogs = (logsRes.data || []).map((l: any) => ({
        id: l.id,
        user: l.user_name,
        role: l.role,
        timeFormatted: new Date(l.timestamp).toLocaleString('km-KH'),
        device: l.device || 'Web Browser',
      }));

      return NextResponse.json({
        supabaseConnected: true,
        storesByDate,
        stockByDate,
        itemPrices,
        auditLogs,
        lastUpdated: new Date().toISOString(),
      });
    } catch (err: any) {
      console.warn('Supabase fetch error, falling back to mock cloud:', err);
    }
  }

  // 2. Fallback to RESTful mock cloud if Supabase is not yet configured
  try {
    const res = await fetch(FALLBACK_CLOUD_URL, { cache: 'no-store' });
    if (!res.ok) {
      return NextResponse.json({ 
        supabaseConnected: false,
        storesByDate: {}, 
        stockByDate: {}, 
        itemPrices: {}, 
        auditLogs: [],
        lastUpdated: null 
      });
    }
    const json = await res.json();
    const data = json.data || {};
    return NextResponse.json({
      supabaseConnected: false,
      storesByDate: data.storesByDate || {},
      stockByDate: data.stockByDate || {},
      itemPrices: data.itemPrices || {},
      auditLogs: data.auditLogs || [],
      lastUpdated: data.lastUpdated || null,
    });
  } catch (error: any) {
    console.error('Failed to fetch from fallback cloud sync:', error);
    return NextResponse.json({ 
      supabaseConnected: false,
      storesByDate: {}, 
      stockByDate: {}, 
      itemPrices: {}, 
      auditLogs: [],
      lastUpdated: null 
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      storesByDate: incomingStores, 
      stockByDate: incomingStock, 
      itemPrices: incomingPrices,
      customAuditLog,
      actionMeta 
    } = body;

    const userAgent = req.headers.get('user-agent') || '';
    const isMobile = /mobile|android|iphone|ipad|phone/i.test(userAgent);
    const deviceName = isMobile ? 'Mobile Phone 📱' : 'Computer / PC 💻';
    const now = new Date();

    // 1. If Supabase is configured, upsert into Supabase tables
    if (isSupabaseConfigured) {
      try {
        // Upsert distributions
        if (incomingStores && typeof incomingStores === 'object') {
          const distRows: any[] = [];
          for (const [dateKey, storeList] of Object.entries(incomingStores)) {
            if (Array.isArray(storeList)) {
              for (const s of storeList) {
                const storeId = s.id || s.code;
                distRows.push({
                  id: `${dateKey}_${storeId}`,
                  date: dateKey,
                  item_code: s.item_code || 'DAILY_TOTAL',
                  store_id: storeId,
                  quantity: Number(s.dailyAmount) || 0,
                  updated_at: now.toISOString(),
                });
              }
            }
          }
          if (distRows.length > 0) {
            await supabase.from('daily_distributions').upsert(distRows, { onConflict: 'id' });
          }
        }

        // Upsert stock logs
        if (incomingStock && typeof incomingStock === 'object') {
          const stockRows: any[] = [];
          for (const [dateKey, itemList] of Object.entries(incomingStock)) {
            if (Array.isArray(itemList)) {
              for (const i of itemList) {
                stockRows.push({
                  id: `${dateKey}_${i.item_code}`,
                  date: dateKey,
                  item_code: i.item_code,
                  stock_in: Number(i.stock_in) || 0,
                  stock_out: Number(i.stock_out) || 0,
                  updated_at: now.toISOString(),
                });
              }
            }
          }
          if (stockRows.length > 0) {
            await supabase.from('daily_stock_logs').upsert(stockRows, { onConflict: 'id' });
          }
        }

        // Insert access/audit log
        if (customAuditLog) {
          await supabase.from('access_logs').insert([{
            id: customAuditLog.id || `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            user_name: customAuditLog.user || 'Unknown User',
            role: customAuditLog.role || 'STAFF',
            device: customAuditLog.device || deviceName,
            timestamp: customAuditLog.timestamp || now.toISOString(),
          }]);
        }

        return NextResponse.json({
          success: true,
          supabaseConnected: true,
          lastUpdated: now.toISOString(),
        });
      } catch (sbErr) {
        console.warn('Supabase write error, falling back to mock cloud:', sbErr);
      }
    }

    // 2. Fallback to mock cloud
    let existingData: any = { storesByDate: {}, stockByDate: {}, itemPrices: {}, auditLogs: [] };
    try {
      const getRes = await fetch(FALLBACK_CLOUD_URL, { cache: 'no-store' });
      if (getRes.ok) {
        const getJson = await getRes.json();
        if (getJson.data) existingData = getJson.data;
      }
    } catch (fetchErr) {
      console.warn('Fallback fetch error:', fetchErr);
    }

    const mergedStoresByDate = { ...(existingData.storesByDate || {}) };
    if (incomingStores && typeof incomingStores === 'object') {
      for (const [dateKey, storeList] of Object.entries(incomingStores)) {
        if (Array.isArray(storeList)) {
          if (!mergedStoresByDate[dateKey]) {
            mergedStoresByDate[dateKey] = storeList;
          } else {
            const existingStoresMap = new Map<string, any>(
              (mergedStoresByDate[dateKey] || []).map((s: any) => [s.id || s.code, s])
            );
            for (const newStore of storeList) {
              const key = newStore.id || newStore.code;
              const prevStore = existingStoresMap.get(key) || {};
              existingStoresMap.set(key, { ...prevStore, ...newStore });
            }
            mergedStoresByDate[dateKey] = Array.from(existingStoresMap.values());
          }
        }
      }
    }

    const mergedStockByDate = { ...(existingData.stockByDate || {}) };
    if (incomingStock && typeof incomingStock === 'object') {
      for (const [dateKey, itemList] of Object.entries(incomingStock)) {
        if (Array.isArray(itemList)) {
          if (!mergedStockByDate[dateKey]) {
            mergedStockByDate[dateKey] = itemList;
          } else {
            const existingItemsMap = new Map<string, any>(
              (mergedStockByDate[dateKey] || []).map((i: any) => [i.item_code, i])
            );
            for (const newItem of itemList) {
              const prevItem = existingItemsMap.get(newItem.item_code) || {};
              existingItemsMap.set(newItem.item_code, { ...prevItem, ...newItem });
            }
            mergedStockByDate[dateKey] = Array.from(existingItemsMap.values());
          }
        }
      }
    }

    const timeFormatted = now.toLocaleString('en-GB', { 
      timeZone: 'Asia/Phnom_Penh',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });

    const newAuditEntry: AuditLogEntry = customAuditLog ? {
      ...customAuditLog,
      id: customAuditLog.id || `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: customAuditLog.timestamp || now.toISOString(),
      timeFormatted: customAuditLog.timeFormatted || timeFormatted,
      device: customAuditLog.device || deviceName,
    } : {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: now.toISOString(),
      timeFormatted,
      targetDate: actionMeta?.targetDate || 'Today',
      actionType: 'STORE_TOTALS',
      titleKhmer: 'បានកត់ត្រាទិន្នន័យសាខា',
      detailsKhmer: 'បាន Sync ទៅកាន់ Cloud Storage',
      device: deviceName,
      stats: {},
    };

    const existingLogs: AuditLogEntry[] = Array.isArray(existingData.auditLogs) ? existingData.auditLogs : [];
    const updatedAuditLogs = [newAuditEntry, ...existingLogs.slice(0, 149)];

    const updatedPayload = {
      storesByDate: mergedStoresByDate,
      stockByDate: mergedStockByDate,
      itemPrices: { ...(existingData.itemPrices || {}), ...(incomingPrices || {}) },
      auditLogs: updatedAuditLogs,
      lastUpdated: now.toISOString(),
    };

    await fetch(FALLBACK_CLOUD_URL, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'kandal_commissary_kitchen_store_totals_v1',
        data: updatedPayload,
      }),
    });

    return NextResponse.json({ 
      success: true, 
      supabaseConnected: false,
      data: updatedPayload,
      newLog: newAuditEntry
    });
  } catch (error: any) {
    console.error('Sync route error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

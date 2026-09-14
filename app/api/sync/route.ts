import { NextRequest, NextResponse } from 'next/server';
import { AuditLogEntry } from '@/lib/types';

export const dynamic = 'force-dynamic';

const CLOUD_OBJECT_ID = 'ff808181a067127101a09522e8a600ef';
const CLOUD_URL = `https://api.restful-api.dev/objects/${CLOUD_OBJECT_ID}`;

export type { AuditLogEntry };

export async function GET() {
  try {
    const res = await fetch(CLOUD_URL, { cache: 'no-store' });
    if (!res.ok) {
      return NextResponse.json({ 
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
      storesByDate: data.storesByDate || {},
      stockByDate: data.stockByDate || {},
      itemPrices: data.itemPrices || {},
      auditLogs: data.auditLogs || [],
      lastUpdated: data.lastUpdated || null,
    });
  } catch (error: any) {
    console.error('Failed to fetch from cloud sync:', error);
    return NextResponse.json({ 
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

    // Detect client device
    const userAgent = req.headers.get('user-agent') || '';
    const isMobile = /mobile|android|iphone|ipad|phone/i.test(userAgent);
    const deviceName = isMobile ? 'Mobile Phone 📱' : 'Computer / PC 💻';

    // 1. Fetch current cloud state to merge non-destructively
    let existingData: any = { storesByDate: {}, stockByDate: {}, itemPrices: {}, auditLogs: [] };
    try {
      const getRes = await fetch(CLOUD_URL, { cache: 'no-store' });
      if (getRes.ok) {
        const getJson = await getRes.json();
        if (getJson.data) {
          existingData = getJson.data;
        }
      }
    } catch (fetchErr) {
      console.warn('Could not read previous cloud state for merge, proceeding with caution:', fetchErr);
    }

    // 2. Non-destructive Deep Merge for Stores by Date
    const mergedStoresByDate = { ...(existingData.storesByDate || {}) };
    if (incomingStores && typeof incomingStores === 'object') {
      for (const [dateKey, storeList] of Object.entries(incomingStores)) {
        if (Array.isArray(storeList)) {
          if (!mergedStoresByDate[dateKey]) {
            mergedStoresByDate[dateKey] = storeList;
          } else {
            // Merge store by store for that specific date
            const existingStoresMap = new Map<string, any>(
              (mergedStoresByDate[dateKey] || []).map((s: any) => [s.id || s.code, s])
            );
            for (const newStore of storeList) {
              const key = newStore.id || newStore.code;
              const prevStore = existingStoresMap.get(key) || {};
              existingStoresMap.set(key, {
                ...prevStore,
                ...newStore,
              });
            }
            mergedStoresByDate[dateKey] = Array.from(existingStoresMap.values());
          }
        }
      }
    }

    // 3. Non-destructive Deep Merge for Stock Items by Date
    const mergedStockByDate = { ...(existingData.stockByDate || {}) };
    if (incomingStock && typeof incomingStock === 'object') {
      for (const [dateKey, itemList] of Object.entries(incomingStock)) {
        if (Array.isArray(itemList)) {
          if (!mergedStockByDate[dateKey]) {
            mergedStockByDate[dateKey] = itemList;
          } else {
            // Merge item by item
            const existingItemsMap = new Map<string, any>(
              (mergedStockByDate[dateKey] || []).map((i: any) => [i.item_code, i])
            );
            for (const newItem of itemList) {
              const prevItem = existingItemsMap.get(newItem.item_code) || {};
              existingItemsMap.set(newItem.item_code, {
                ...prevItem,
                ...newItem,
              });
            }
            mergedStockByDate[dateKey] = Array.from(existingItemsMap.values());
          }
        }
      }
    }

    // 4. Merge Item Prices
    const mergedItemPrices = {
      ...(existingData.itemPrices || {}),
      ...(incomingPrices || {}),
    };

    // 5. Build Audit Log Entry
    const now = new Date();
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

    let newAuditEntry: AuditLogEntry;

    if (customAuditLog) {
      newAuditEntry = {
        ...customAuditLog,
        id: customAuditLog.id || `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        timestamp: customAuditLog.timestamp || now.toISOString(),
        timeFormatted: customAuditLog.timeFormatted || timeFormatted,
        device: customAuditLog.device || deviceName,
      };
    } else {
      // Synthesize audit log from incoming payload
      let actionType: 'STORE_TOTALS' | 'STOCK_LOG' | 'ITEM_PRICES' = 'STORE_TOTALS';
      let titleKhmer = 'បានកត់ត្រាទិន្នន័យសាខា';
      let detailsKhmer = '';
      let targetDate = actionMeta?.targetDate || Object.keys(incomingStores || {})[0] || Object.keys(incomingStock || {})[0] || 'Unknown Date';
      let stats: any = {};

      if (actionMeta?.actionType === 'STOCK_LOG' || (incomingStock && Object.keys(incomingStock).length > 0)) {
        actionType = 'STOCK_LOG';
        const targetItems = (incomingStock && incomingStock[targetDate]) || [];
        const totalIn = targetItems.reduce((sum: number, i: any) => sum + (i.stock_in || 0), 0);
        const totalOut = targetItems.reduce((sum: number, i: any) => sum + (i.stock_out || 0), 0);
        titleKhmer = `បាន Update ស្តុកទំនិញ (In & Out)`;
        detailsKhmer = `កាលបរិច្ឆេទ ${targetDate}៖ ចូល +${totalIn.toLocaleString()} items, ចេញ -${totalOut.toLocaleString()} items (${targetItems.length} មុខទំនិញ)`;
        stats = { totalItems: totalIn + totalOut, itemsCount: targetItems.length };
      } else {
        actionType = 'STORE_TOTALS';
        const targetStoreList = (incomingStores && incomingStores[targetDate]) || [];
        const totalDaily = targetStoreList.reduce((sum: number, s: any) => sum + (s.dailyAmount || 0), 0);
        const totalMonthly = targetStoreList.reduce((sum: number, s: any) => sum + (s.monthlyAmount || 0), 0);
        titleKhmer = `បាន Update បរិមាណសរុបតាមសាខា`;
        detailsKhmer = `កាលបរិច្ឆេទ ${targetDate}៖ សរុបថ្ងៃ ${totalDaily.toLocaleString()} items, ខែ ${totalMonthly.toLocaleString()} items (${targetStoreList.length} ហាង)`;
        stats = { totalItems: totalDaily, storesCount: targetStoreList.length };
      }

      newAuditEntry = {
        id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        timestamp: now.toISOString(),
        timeFormatted,
        targetDate,
        actionType,
        titleKhmer,
        detailsKhmer,
        device: deviceName,
        stats,
      };
    }

    // Keep the most recent 150 audit entries permanently
    const existingLogs: AuditLogEntry[] = Array.isArray(existingData.auditLogs) ? existingData.auditLogs : [];
    const updatedAuditLogs = [newAuditEntry, ...existingLogs.slice(0, 149)];

    const updatedPayload = {
      storesByDate: mergedStoresByDate,
      stockByDate: mergedStockByDate,
      itemPrices: mergedItemPrices,
      auditLogs: updatedAuditLogs,
      lastUpdated: now.toISOString(),
    };

    // 6. Push to persistent cloud storage
    const putRes = await fetch(CLOUD_URL, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'kandal_commissary_kitchen_store_totals_v1',
        data: updatedPayload,
      }),
    });

    if (!putRes.ok) {
      const errText = await putRes.text();
      console.error('Cloud PUT failed:', errText);
      return NextResponse.json({ success: false, error: errText }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      data: updatedPayload,
      newLog: newAuditEntry
    });
  } catch (error: any) {
    console.error('Cloud sync error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

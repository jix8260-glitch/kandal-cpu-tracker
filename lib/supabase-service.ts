import { supabase, isSupabaseConfigured, getSupabaseClient } from './supabase';

export interface StoreRecord {
  id: string;
  code: string;
  name: string;
  brand: 'Tube Coffee' | 'OnMart';
}

export interface ItemRecord {
  item_code: string;
  description_khmer: string;
  brand: 'Tube Coffee' | 'OnMart';
  category: string;
  uom: string;
  cpu: number;
  opening_stock: number;
}

export interface AccessLogEntry {
  id: string;
  user: string;
  role: string;
  time: string;
  device: string;
}

/**
 * Fetch all stores from Supabase
 */
export async function fetchStoresCloud(): Promise<StoreRecord[] | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  try {
    const { data, error } = await client
      .from('stores')
      .select('*')
      .order('code', { ascending: true });
    if (error) {
      console.warn('Supabase fetchStores error:', error.message);
      return null;
    }
    return data as StoreRecord[];
  } catch (err) {
    console.warn('Supabase fetchStores exception:', err);
    return null;
  }
}

/**
 * Fetch all items from Supabase
 */
export async function fetchItemsCloud(): Promise<ItemRecord[] | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  try {
    const { data, error } = await client
      .from('item_master')
      .select('*')
      .order('item_code', { ascending: true });
    if (error) {
      console.warn('Supabase fetchItems error:', error.message);
      return null;
    }
    return data as ItemRecord[];
  } catch (err) {
    console.warn('Supabase fetchItems exception:', err);
    return null;
  }
}

/**
 * Fetch daily distributions for a specific date
 */
export async function fetchDailyDistributionsCloud(date: string): Promise<Record<string, Record<string, number>> | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  try {
    const { data, error } = await client
      .from('daily_distributions')
      .select('*')
      .eq('date', date);
    if (error) {
      console.warn('Supabase fetchDistributions error:', error.message);
      return null;
    }
    const result: Record<string, Record<string, number>> = {};
    for (const row of data || []) {
      if (!result[row.item_code]) {
        result[row.item_code] = {};
      }
      result[row.item_code][row.store_id] = Number(row.quantity) || 0;
    }
    return result;
  } catch (err) {
    console.warn('Supabase fetchDistributions exception:', err);
    return null;
  }
}

/**
 * Fetch daily stock logs for a specific date
 */
export async function fetchDailyStockLogsCloud(date: string): Promise<Record<string, { stock_in: number; stock_out: number }> | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  try {
    const { data, error } = await client
      .from('daily_stock_logs')
      .select('*')
      .eq('date', date);
    if (error) {
      console.warn('Supabase fetchStockLogs error:', error.message);
      return null;
    }
    const result: Record<string, { stock_in: number; stock_out: number }> = {};
    for (const row of data || []) {
      result[row.item_code] = {
        stock_in: Number(row.stock_in) || 0,
        stock_out: Number(row.stock_out) || 0,
      };
    }
    return result;
  } catch (err) {
    console.warn('Supabase fetchStockLogs exception:', err);
    return null;
  }
}

/**
 * Save / Upsert single distribution entry to Supabase
 */
export async function saveDistributionCloud(date: string, itemCode: string, storeId: string, quantity: number): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;
  try {
    const id = `${date}_${itemCode}_${storeId}`;
    const { error } = await client
      .from('daily_distributions')
      .upsert({
        id,
        date,
        item_code: itemCode,
        store_id: storeId,
        quantity,
        updated_at: new Date().toISOString(),
      });
    return !error;
  } catch {
    return false;
  }
}

/**
 * Save / Upsert stock log to Supabase
 */
export async function saveStockLogCloud(date: string, itemCode: string, stockIn: number, stockOut: number): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;
  try {
    const id = `${date}_${itemCode}`;
    const { error } = await client
      .from('daily_stock_logs')
      .upsert({
        id,
        date,
        item_code: itemCode,
        stock_in: stockIn,
        stock_out: stockOut,
        updated_at: new Date().toISOString(),
      });
    return !error;
  } catch {
    return false;
  }
}

/**
 * Save a new store to Supabase
 */
export async function saveStoreCloud(store: StoreRecord): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;
  try {
    const { error } = await client
      .from('stores')
      .upsert({
        id: store.id,
        code: store.code,
        name: store.name,
        brand: store.brand,
      });
    return !error;
  } catch {
    return false;
  }
}

/**
 * Save a new item to Supabase
 */
export async function saveItemCloud(item: ItemRecord): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;
  try {
    const { error } = await client
      .from('item_master')
      .upsert({
        item_code: item.item_code,
        description_khmer: item.description_khmer,
        brand: item.brand,
        category: item.category,
        uom: item.uom,
        cpu: item.cpu,
        opening_stock: item.opening_stock,
      });
    return !error;
  } catch {
    return false;
  }
}

/**
 * Save an access log to Supabase
 */
export async function saveAccessLogCloud(log: AccessLogEntry): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;
  try {
    const { error } = await client
      .from('access_logs')
      .insert({
        id: log.id,
        user_name: log.user,
        role: log.role,
        device: log.device,
        timestamp: new Date().toISOString(),
      });
    return !error;
  } catch {
    return false;
  }
}

/**
 * Fetch recent access logs from Supabase
 */
export async function fetchAccessLogsCloud(): Promise<AccessLogEntry[] | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  try {
    const { data, error } = await client
      .from('access_logs')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(50);
    if (error || !data) return null;
    return data.map((r: any) => ({
      id: r.id,
      user: r.user_name,
      role: r.role,
      time: new Date(r.timestamp).toLocaleString('km-KH'),
      device: r.device || 'Web Browser',
    }));
  } catch {
    return null;
  }
}

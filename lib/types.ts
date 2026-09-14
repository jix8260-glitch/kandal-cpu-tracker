export type StoreLocation = 'TUBE_COFFEE' | 'ONMART';
export type FilterLocation = 'ALL' | 'TUBE_COFFEE' | 'ONMART';

export interface StoreBranch {
  code: string;
  name: string;
  brand: StoreLocation;
  itemCount: number;
}

export const TUBE_COFFEE_STORES: StoreBranch[] = [
  { code: 'KPI', name: 'Tube Coffee+ KPI', brand: 'TUBE_COFFEE', itemCount: 69 },
  { code: 'TKC', name: 'Tube Coffee+ TKC', brand: 'TUBE_COFFEE', itemCount: 69 },
  { code: 'CCV', name: 'Tube Coffee+ CCV', brand: 'TUBE_COFFEE', itemCount: 69 },
  { code: 'CDP', name: 'Tube Coffee+ CDP', brand: 'TUBE_COFFEE', itemCount: 69 },
  { code: 'CMH', name: 'Tube Coffee+ CMH', brand: 'TUBE_COFFEE', itemCount: 69 },
  { code: 'KSH', name: 'Tube Coffee+ KSH', brand: 'TUBE_COFFEE', itemCount: 69 },
  { code: 'CKD', name: 'Tube Coffee+ CKD', brand: 'TUBE_COFFEE', itemCount: 69 },
  { code: '2K4', name: 'Tube Coffee+ 2K4', brand: 'TUBE_COFFEE', itemCount: 69 },
  { code: 'RTN', name: 'Tube Coffee+ RTN', brand: 'TUBE_COFFEE', itemCount: 69 },
];

export const ONMART_STORES: StoreBranch[] = [
  { code: 'PDK', name: 'OnMart PDK', brand: 'ONMART', itemCount: 36 },
  { code: 'TK', name: 'OnMart TK', brand: 'ONMART', itemCount: 36 },
  { code: 'OU3', name: 'OnMart OU3', brand: 'ONMART', itemCount: 36 },
  { code: 'DT', name: 'OnMart DT', brand: 'ONMART', itemCount: 36 },
];

export const ALL_STORES: StoreBranch[] = [...TUBE_COFFEE_STORES, ...ONMART_STORES];

export interface StockItem {
  id: string;
  code: string;
  description_khmer: string;
  category: string;
  uom: string;
  cpu: number;
  location: StoreLocation;
  opening_stock: number;
  created_at?: string;
}

export interface DailyLog {
  id?: string;
  item_id: string;
  entry_date: string; // YYYY-MM-DD
  stock_in: number;
  stock_out: number;
  store_code?: string;
  created_at?: string;
}

export interface CalculatedStockRow extends StockItem {
  stock_in: number;
  stock_out: number;
  balance: number;
  stockValue: number;
  isNegative: boolean;
  isLow: boolean;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;          // ISO string
  timeFormatted: string;      // e.g. "14/09/2026, 10:30 PM"
  targetDate: string;         // YYYY-MM-DD
  actionType: 'STORE_TOTALS' | 'STOCK_LOG' | 'ITEM_PRICES' | 'MANUAL_SYNC';
  titleKhmer: string;         // Summary title in Khmer
  detailsKhmer: string;       // Detailed description in Khmer
  device: string;             // "Mobile Phone 📱" or "Computer / PC 💻"
  stats?: {
    totalItems?: number;
    storesCount?: number;
    itemsCount?: number;
  };
}


export type StoreLocation = 'TUBE_COFFEE' | 'ONMART';
export type FilterLocation = 'ALL' | 'TUBE_COFFEE' | 'ONMART';

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

// lib/inventoryStore.ts

export interface StoreRecord {
  id?: string;
  date: string; // Format: YYYY-MM-DD (ឧ. 2026-09-16)
  storeCode: string; // ឧ. KPI, TKC, CCV
  storeName: string;
  brand: 'Tube Coffee' | 'OnMart';
  itemCount: number;
  unitPrice?: number; // គិតជាមធ្យម ឧ. $1.5 ក្នុងមួយ Item
  totalAmount?: number;
}

const STORAGE_KEY = 'kandal_cpu_daily_store_distributions';

// ទាញយកទិន្នន័យទាំងអស់
export function getAllDistributions(): StoreRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Failed to load store records', e);
    return [];
  }
}

// ទាញយកទិន្នន័យតាមកាលបរិច្ឆេទ (Filter by Date)
export function getDistributionsByDate(date: string): StoreRecord[] {
  const all = getAllDistributions();
  return all.filter((r) => r.date === date);
}

// ទាញយកទិន្នន័យតាមសាខា (Filter by Store Code)
export function getDistributionsByStore(storeCode: string): StoreRecord[] {
  const all = getAllDistributions();
  return all.filter((r) => r.storeCode === storeCode);
}

// រក្សាទុក ឬកែប្រែទិន្នន័យប្រចាំថ្ងៃរបស់សាខា
export function saveDailyStoreDistribution(records: StoreRecord[]) {
  if (typeof window === 'undefined') return;
  try {
    const existing = getAllDistributions();

    // ច្រោះទិន្នន័យចាស់ចេញ ប្រសិនបើកាលបរិច្ឆេទ និងកូដសាខាដូចគ្នា ដើម្បីកុំឱ្យស្ទួន
    const newKeys = new Set(records.map((r) => `${r.date}_${r.storeCode}`));
    const filteredExisting = existing.filter((r) => !newKeys.has(`${r.date}_${r.storeCode}`));

    const combined = [...filteredExisting, ...records];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(combined));

    // បាញ់ Event ប្រាប់ទំព័រផ្សេងទៀតឱ្យ Update ភ្លាមៗ
    window.dispatchEvent(new Event('storage_updated'));
  } catch (e) {
    console.error('Failed to save store records', e);
  }
}

// លុបទិន្នន័យសាខាក្នុងថ្ងៃណាមួយ
export function deleteDistribution(date: string, storeCode: string) {
  if (typeof window === 'undefined') return;
  try {
    const existing = getAllDistributions();
    const keyToDelete = `${date}_${storeCode}`;
    const filtered = existing.filter((r) => `${r.date}_${r.storeCode}` !== keyToDelete);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    window.dispatchEvent(new Event('storage_updated'));
  } catch (e) {
    console.error('Failed to delete store record', e);
  }
}

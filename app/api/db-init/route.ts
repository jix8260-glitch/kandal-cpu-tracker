import { NextResponse } from 'next/server';
import { Client } from 'pg';
import { STARTER_ITEMS } from '@/lib/starter-items';

export const dynamic = 'force-dynamic';

const INIT_SQL = `
-- 1. STORES TABLE
CREATE TABLE IF NOT EXISTS public.stores (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    brand TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. ITEM MASTER TABLE
CREATE TABLE IF NOT EXISTS public.item_master (
    item_code TEXT PRIMARY KEY,
    description_khmer TEXT NOT NULL,
    brand TEXT NOT NULL,
    category TEXT NOT NULL,
    uom TEXT NOT NULL,
    cpu NUMERIC DEFAULT 0.0,
    opening_stock NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. DAILY DISTRIBUTIONS TABLE
CREATE TABLE IF NOT EXISTS public.daily_distributions (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    item_code TEXT NOT NULL,
    store_id TEXT NOT NULL,
    quantity NUMERIC DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_distributions_date ON public.daily_distributions(date);
CREATE INDEX IF NOT EXISTS idx_distributions_item ON public.daily_distributions(item_code);

-- 4. DAILY STOCK LOGS TABLE
CREATE TABLE IF NOT EXISTS public.daily_stock_logs (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    item_code TEXT NOT NULL,
    stock_in NUMERIC DEFAULT 0,
    stock_out NUMERIC DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_stock_logs_date ON public.daily_stock_logs(date);
CREATE INDEX IF NOT EXISTS idx_stock_logs_item ON public.daily_stock_logs(item_code);

-- 5. SYSTEM SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.system_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. ACCESS LOGS TABLE
CREATE TABLE IF NOT EXISTS public.access_logs (
    id TEXT PRIMARY KEY,
    user_name TEXT NOT NULL,
    role TEXT NOT NULL,
    device TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_access_logs_time ON public.access_logs(timestamp DESC);

-- Enable RLS
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.item_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_distributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_stock_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_logs ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow anon all on stores') THEN
    CREATE POLICY "Allow anon all on stores" ON public.stores FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow anon all on item_master') THEN
    CREATE POLICY "Allow anon all on item_master" ON public.item_master FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow anon all on daily_distributions') THEN
    CREATE POLICY "Allow anon all on daily_distributions" ON public.daily_distributions FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow anon all on daily_stock_logs') THEN
    CREATE POLICY "Allow anon all on daily_stock_logs" ON public.daily_stock_logs FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow anon all on system_settings') THEN
    CREATE POLICY "Allow anon all on system_settings" ON public.system_settings FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow anon all on access_logs') THEN
    CREATE POLICY "Allow anon all on access_logs" ON public.access_logs FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;
`;

export async function GET() {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

  const rawConn =
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL || '';

  if (!rawConn) {
    return NextResponse.json(
      { success: false, error: 'No PostgreSQL connection string found in environment' },
      { status: 400 }
    );
  }

  const connectionString = rawConn.replace(/([?&])sslmode=[^&]+(&|$)/, '$1').replace(/[?&]$/, '');

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    await client.query(INIT_SQL);

    // Seed 105 starter items if item_master is empty
    const countRes = await client.query('SELECT COUNT(*) FROM public.item_master;');
    const itemCount = parseInt(countRes.rows[0].count, 10);
    let seededCount = 0;

    if (itemCount === 0) {
      for (const it of STARTER_ITEMS) {
        const brand = it.location?.includes('OnMart') || it.location === 'ONMART' ? 'OnMart' : 'Tube Coffee';
        await client.query(
          `INSERT INTO public.item_master (item_code, description_khmer, brand, category, uom, cpu, opening_stock)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (item_code) DO NOTHING;`,
          [it.item_code, it.description_khmer, brand, it.category || 'Daily Product', it.uom || 'Pack', it.cpu || 0, it.opening_stock || 0]
        );
        seededCount++;
      }
    }

    await client.end();

    return NextResponse.json({
      success: true,
      message: 'PostgreSQL schema and tables successfully initialized!',
      seededStarterItems: seededCount,
      totalItemsInDb: itemCount === 0 ? seededCount : itemCount,
    });
  } catch (err: any) {
    try {
      await client.end();
    } catch {}
    return NextResponse.json(
      { success: false, error: err.message, stack: err.stack },
      { status: 500 }
    );
  }
}

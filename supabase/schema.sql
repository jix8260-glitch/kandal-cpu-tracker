-- ==============================================================================
-- KANDAL COMMISSARY & CPU TRACKER - SUPABASE DATABASE SCHEMA
-- Run this script in your Supabase Project: SQL Editor -> New Query -> Run
-- ==============================================================================

-- 1. STORES TABLE (សាខាហាង Tube Coffee & OnMart)
CREATE TABLE IF NOT EXISTS public.stores (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    brand TEXT NOT NULL CHECK (brand IN ('Tube Coffee', 'OnMart')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. ITEM MASTER TABLE (មុខទំនិញទាំង ១០៥ មុខ)
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

-- 3. DAILY DISTRIBUTIONS TABLE (ការចែកចាយតាមសាខា និងកាលបរិច្ឆេទ)
CREATE TABLE IF NOT EXISTS public.daily_distributions (
    id TEXT PRIMARY KEY, -- Composite key: date_itemCode_storeId
    date TEXT NOT NULL,
    item_code TEXT NOT NULL,
    store_id TEXT NOT NULL,
    quantity NUMERIC DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_distributions_date ON public.daily_distributions(date);
CREATE INDEX IF NOT EXISTS idx_distributions_item ON public.daily_distributions(item_code);

-- 4. DAILY STOCK LOGS TABLE (ស្តុកចូល និងស្តុកចេញតាមកាលបរិច្ឆេទ)
CREATE TABLE IF NOT EXISTS public.daily_stock_logs (
    id TEXT PRIMARY KEY, -- Composite key: date_itemCode
    date TEXT NOT NULL,
    item_code TEXT NOT NULL,
    stock_in NUMERIC DEFAULT 0,
    stock_out NUMERIC DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_stock_logs_date ON public.daily_stock_logs(date);
CREATE INDEX IF NOT EXISTS idx_stock_logs_item ON public.daily_stock_logs(item_code);

-- 5. SYSTEM SETTINGS TABLE (លេខសម្ងាត់ Passcodes, App Version, Config)
CREATE TABLE IF NOT EXISTS public.system_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. ACCESS LOGS TABLE (ប្រវត្តិអ្នកចូលប្រើប្រាស់)
CREATE TABLE IF NOT EXISTS public.access_logs (
    id TEXT PRIMARY KEY,
    user_name TEXT NOT NULL,
    role TEXT NOT NULL,
    device TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_access_logs_time ON public.access_logs(timestamp DESC);

-- ==============================================================================
-- ENABLE ROW LEVEL SECURITY (RLS) & PUBLIC ANON ACCESS POLICIES
-- ==============================================================================
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.item_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_distributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_stock_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon all on stores" ON public.stores FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon all on item_master" ON public.item_master FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon all on daily_distributions" ON public.daily_distributions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon all on daily_stock_logs" ON public.daily_stock_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon all on system_settings" ON public.system_settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon all on access_logs" ON public.access_logs FOR ALL USING (true) WITH CHECK (true);

-- ==============================================================================
-- SEED INITIAL DATA: 13 STORES
-- ==============================================================================
INSERT INTO public.stores (id, code, name, brand) VALUES
('tube_kpi', 'KPI', 'Tube Coffee+ KPI', 'Tube Coffee'),
('tube_tkc', 'TKC', 'Tube Coffee+ TKC', 'Tube Coffee'),
('tube_ccv', 'CCV', 'Tube Coffee+ CCV', 'Tube Coffee'),
('tube_cdp', 'CDP', 'Tube Coffee+ CDP', 'Tube Coffee'),
('tube_cmh', 'CMH', 'Tube Coffee+ CMH', 'Tube Coffee'),
('tube_ksh', 'KSH', 'Tube Coffee+ KSH', 'Tube Coffee'),
('tube_ckd', 'CKD', 'Tube Coffee+ CKD', 'Tube Coffee'),
('tube_2k4', '2K4', 'Tube Coffee+ 2K4', 'Tube Coffee'),
('tube_rtn', 'RTN', 'Tube Coffee+ RTN', 'Tube Coffee'),
('onmart_pdk', 'PDK', 'OnMart PDK', 'OnMart'),
('onmart_tk', 'TK', 'OnMart TK', 'OnMart'),
('onmart_ou3', 'OU3', 'OnMart OU3', 'OnMart'),
('onmart_dt', 'DT', 'OnMart DT', 'OnMart')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, brand = EXCLUDED.brand;

-- ==============================================================================
-- SEED INITIAL SYSTEM SETTINGS (Passcodes & Version)
-- ==============================================================================
INSERT INTO public.system_settings (key, value) VALUES
('app_version', '"v3.6 Production"'::jsonb),
('admin_passcode', '"0203"'::jsonb),
('staff_passcode', '"8899"'::jsonb)
ON CONFLICT (key) DO NOTHING;

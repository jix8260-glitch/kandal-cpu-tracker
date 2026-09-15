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


-- ==============================================================================
-- 8. SEED INITIAL DATA: 105+ STARTER ITEMS (Tube Coffee & OnMart)
-- ==============================================================================
INSERT INTO public.item_master (item_code, description_khmer, brand, category, uom, cpu, opening_stock) VALUES
('V0003', 'ក្រូចឆ្មា (500g)', 'Tube Coffee', 'Daily Product', 'Pack', 0, 0),
('V0004', 'សណ្តែកបណ្តុះ (1000g)', 'Tube Coffee', 'Daily Product', 'Pack', 0, 0),
('V0005', 'ត្រកួនចិន (500g)', 'Tube Coffee', 'Daily Product', 'Pack', 0, 0),
('V0008', 'ប៉េងប៉ោះទុំ (1000g)', 'Tube Coffee', 'Daily Product', 'Pack', 0, 0),
('V0009', 'ខ្ទឹមបារាំង (1000g)', 'Tube Coffee', 'Daily Product', 'Pack', 0, 0),
('V0006', 'ខ្ទឹមក្រហមបក (500g)', 'Tube Coffee', 'Daily Product', 'Pack', 0, 0),
('V0010', 'ត្រសក់ (1000g)', 'Tube Coffee', 'Daily Product', 'Pack', 0, 0),
('V0001', 'ស្លឹកខ្ទឹម (300g)', 'Tube Coffee', 'Daily Product', 'Pack', 0, 0),
('V0013', 'ជីរណា (200g)', 'Tube Coffee', 'Daily Product', 'Pack', 0, 0),
('V0028', 'ជីវ៉ាន់សុយ (5pcs)', 'Tube Coffee', 'Daily Product', 'Pack', 0, 0),
('V0016', 'ម្ទេសម៉ាឡេក្រហម (500g)', 'Tube Coffee', 'Daily Product', 'Pack', 0, 0),
('V0015', 'ម្ទេសហិរខ្មែរ (500g)', 'Tube Coffee', 'Daily Product', 'Pack', 0, 0),
('D0005', 'មីពងមាន់លឿង (500g)', 'Tube Coffee', 'Daily Product', 'Pack', 0, 0),
('S0046', 'លត (1000g)', 'Tube Coffee', 'Daily Product', 'Pack', 0, 0),
('V0038', 'ខ្ទឹមសបក (200g)', 'Tube Coffee', 'Daily Product', 'Pack', 0, 0),
('V0039', 'ម្រះព្រៅ (1Bach)', 'Tube Coffee', 'Daily Product', 'Pack', 0, 0),
('V0040', 'កូនខាត់ណា (1000g)', 'Tube Coffee', 'Daily Product', 'Pack', 0, 0),
('V0041', 'ស្ពៃក្ដោប (500g)', 'Tube Coffee', 'Daily Product', 'Pack', 0, 0),
('V0042', 'ប៉េងប៉ោះខ្ចី (1000g)', 'Tube Coffee', 'Daily Product', 'Pack', 0, 0),
('V0043', 'ស្វាយខ្ចី (1000g)', 'Tube Coffee', 'Daily Product', 'Pack', 0, 0),
('V0044', 'ត្រកួនជ្រក់ (1000g)', 'Tube Coffee', 'Daily Product', 'Pack', 0, 0),
('D0081', 'មីជាតិ(សាច់ជ្រូកជញ្ជ្រាំ) (24pack)', 'Tube Coffee', 'Dry Store', 'CTN', 0, 0),
('D0009', 'ខ្ទឹមសបំពង (200g)', 'Tube Coffee', 'Dry Store', 'Pack', 0, 0),
('D0010', 'ម្ទេសមត់ស្ងួត (250g)', 'Tube Coffee', 'Dry Store', 'Pack', 0, 0),
('D0011', 'ពងមាន់ (1pcs)', 'Tube Coffee', 'Dry Store', 'PCS', 0, 0),
('D0013', 'ប្រេងឆា (1Tin)', 'Tube Coffee', 'Dry Store', 'Tin', 0, 0),
('D0015', 'ទឹកស៊ីអ៊ីវរូបគោ (450ml)', 'Tube Coffee', 'Dry Store', 'BTL', 0, 0),
('D0016', 'ទឹកស៊ីអ៊ីវខ្មៅ (750ml)', 'Tube Coffee', 'Dry Store', 'BTL', 0, 0),
('D0049', 'ថង់ច្រកសរសៃមី (500g)', 'Tube Coffee', 'Dry Store', 'Pack', 0, 0),
('D0050', 'ទឹកម្ទេស (2000ml)', 'Tube Coffee', 'Dry Store', 'BTL', 0, 0),
('D0082', 'ត្រីខរកំប៉ុង (10cans)', 'Tube Coffee', 'Dry Store', 'Pack', 0, 0),
('D0017', 'អង្ករ ផ្កាម្លិះ (50000g)', 'Tube Coffee', 'Dry Store', 'Pack', 0, 0),
('D0018', 'ប្រហិតសាច់ជ្រូក (1000g)', 'Tube Coffee', 'Dry Store', 'Pack', 0, 0),
('D0053', 'ស្ពាហ្គាទី (500g)', 'Tube Coffee', 'Dry Store', 'Pack', 0, 0),
('D0080', 'ពងទា (1pcs)', 'Tube Coffee', 'Dry Store', 'PCS', 0, 0),
('S0001', 'ទឹកផ្សំ បាយមាន់គ្រឿង (300g)', 'Tube Coffee', 'Semi Product Sauce', 'Pack', 0, 0),
('S0021', 'ទឹកផ្សំ បាយឡុកឡាក់ (100g)', 'Tube Coffee', 'Semi Product Sauce', 'Pack', 0, 0),
('S0039', 'ទឹកផ្សំ បាយមាន់បំពង (200g)', 'Tube Coffee', 'Semi Product Sauce', 'Pack', 0, 0),
('S0006', 'ទឹកផ្សំឡុកឡាក់ (1000ml)', 'Tube Coffee', 'Semi Product Sauce', 'BTL', 0, 0),
('S0009', 'ទឹកផ្សំមីសាច់ស្រួច (1000ml)', 'Tube Coffee', 'Semi Product Sauce', 'BTL', 0, 0),
('S0003', 'ទឹកត្រីកោះកុង (1000ml)', 'Tube Coffee', 'Semi Product Sauce', 'BTL', 0, 0),
('S0004', 'ទឹកត្រីជូរអែម (1000ml)', 'Tube Coffee', 'Semi Product Sauce', 'BTL', 0, 0),
('S0005', 'អំបិលម្រេចក្រូចឆ្មា (250g)', 'Tube Coffee', 'Semi Product Sauce', 'Pack', 0, 0),
('S0014', 'ម្ទេសឆា (500g)', 'Tube Coffee', 'Semi Product Sauce', 'Pack', 0, 0),
('S0015', 'ទឹកប្រេងម្ទេស (500g)', 'Tube Coffee', 'Semi Product Sauce', 'Pack', 0, 0),
('S0031', 'ទឹកខ្លាញ់ស្រូបបាយសាច់ជ្រូក (200g)', 'Tube Coffee', 'Semi Product Sauce', 'Pack', 0, 0),
('S0011', 'ជ្រក់ម្ទេសម៉ាឡេ (500g)', 'Tube Coffee', 'Semi Product Sauce', 'Pack', 0, 0),
('S0044', 'ទឹកផ្សំឆាខ្មៅ (1000ml)', 'Tube Coffee', 'Semi Product Sauce', 'BTL', 0, 0),
('S0045', 'ទឹកផ្សំ ស្វាយខ្ចី (1000ml)', 'Tube Coffee', 'Semi Product Sauce', 'BTL', 0, 0),
('S0047', 'ទឹកត្រីកោះកុងហឹរ (1000ml)', 'Tube Coffee', 'Semi Product Sauce', 'BTL', 0, 0),
('S0024', 'ពងមាន់ចៀន (250g)', 'Tube Coffee', 'Semi Product Meat', 'Pack', 0, 0),
('S0049', 'ទឹកស៊ុប (5000L)', 'Tube Coffee', 'Semi Product Meat', 'Btl', 0, 0),
('S0008', 'ជ្រក់ត្រសក់ (1000g)', 'Tube Coffee', 'Semi Product Meat', 'Pack', 0, 0),
('SM001', 'ពងមាន់ខរ (10pcs)', 'Tube Coffee', 'Semi Product Meat', 'Pack', 0, 0),
('SM008', 'សាច់ មីសាច់ស្រួច (65g)', 'Tube Coffee', 'Semi Product Meat', 'Pack', 0, 0),
('SM010', 'សាច់ គោ (50g)', 'Tube Coffee', 'Semi Product Meat', 'Pack', 0, 0),
('SM013', 'សាច់ ឡុកឡាក់ (80g)', 'Tube Coffee', 'Semi Product Meat', 'Pack', 0, 0),
('SM027', 'សាច់ ភ្លៅមាន់ (200g)', 'Tube Coffee', 'Semi Product Meat', 'Pack', 0, 0),
('SM017', 'សាច់ជ្រូកអាំង (50g)', 'Tube Coffee', 'Semi Product Meat', 'Pack', 0, 0),
('SM024', 'ប៉ាតេ (500g)', 'Tube Coffee', 'Semi Product Meat', 'Pack', 0, 0),
('SM028', 'សាច់មាន់ស៊ីអ៊ីវ (90g)', 'Tube Coffee', 'Semi Product Meat', 'Pack', 0, 0),
('SM029', 'សាច់ពងទាត្រីប្រម៉ា (70g)', 'Tube Coffee', 'Semi Product Meat', 'Pack', 0, 0),
('SM030', 'សាច់ត្រីប្រលាក់ (160g)', 'Tube Coffee', 'Semi Product Meat', 'Pack', 0, 0),
('SM031', 'ឆ្អឹងជំនីប្រលាក់ (160g)', 'Tube Coffee', 'Semi Product Meat', 'Pack', 0, 0),
('SM032', 'ស្លាបមាន់ប្រលាក់ (190g)', 'Tube Coffee', 'Semi Product Meat', 'Pack', 0, 0),
('SM033', 'សាច់ងៀតគោ (50g)', 'Tube Coffee', 'Semi Product Meat', 'Pack', 0, 0),
('SM034', 'សាច់មាន់់ឆាខ្ញី (140g)', 'Tube Coffee', 'Semi Product Meat', 'Pack', 0, 0),
('SM035', 'ឆាឆ្អឹងជំនីរជូអែម (150g)', 'Tube Coffee', 'Semi Product Meat', 'Pack', 0, 0),
('SM036', 'សាច់ជ្រូកខ (150g)', 'Tube Coffee', 'Semi Product Meat', 'Pack', 0, 0),
('10130122', 'ប៉ាស្តាសាច់ក្រក (180g)', 'OnMart', 'FINISHED PRODUCT', 'Pack', 0, 0),
('10130123', 'ប៉ាស្តាគ្រឿងសមុទ្រហឹរ (180g)', 'OnMart', 'FINISHED PRODUCT', 'Pack', 0, 0),
('10130124', 'ប៉ាស្តាហេមកាបូណារ៉ា (180g)', 'OnMart', 'FINISHED PRODUCT', 'Pack', 0, 0),
('10130125', 'បាយឆាសាច់់មាន់ខ្ទឹម (160g)', 'OnMart', 'FINISHED PRODUCT', 'Pack', 0, 0),
('10130126', 'បាយឆាម៉ាឡា (200g)', 'OnMart', 'FINISHED PRODUCT', 'Pack', 0, 0),
('10130127', 'គុយទាវឆាសាច់គោ (300g)', 'OnMart', 'FINISHED PRODUCT', 'Pack', 0, 0),
('10130128', 'មីឆាសាច់មាន់ (200g)', 'OnMart', 'FINISHED PRODUCT', 'Pack', 0, 0),
('10130129', 'បាយសាស៊ីវ (200g)', 'OnMart', 'FINISHED PRODUCT', 'Pack', 0, 0),
('10130130', 'បាយឆាម្រះព្រៅ (250g)', 'OnMart', 'FINISHED PRODUCT', 'Pack', 0, 0),
('10130131', 'បាយឡុកឡាក់ (250g)', 'OnMart', 'FINISHED PRODUCT', 'Pack', 0, 0),
('10130132', 'លតឆា (250g)', 'OnMart', 'FINISHED PRODUCT', 'Pack', 0, 0),
('10130133', 'បាយឆាសាច់មាន់ (250g)', 'OnMart', 'FINISHED PRODUCT', 'Pack', 0, 0),
('10130134', 'បាយឆាខ្ញីសាច់មាន់ (250g)', 'OnMart', 'FINISHED PRODUCT', 'Pack', 0, 0),
('10140135', 'សាច់ស្លាយអូស្ត្រាលី (500g)', 'OnMart', 'FINISHED PRODUCT', 'Pack', 0, 0),
('10140136', 'បាខន (500g)', 'OnMart', 'FINISHED PRODUCT', 'Pack', 0, 0),
('10140137', 'បង្គា (500g)', 'OnMart', 'FINISHED PRODUCT', 'Pack', 0, 0),
('10150138', 'ពោតឆ្អិន (500g)', 'OnMart', 'Dry Store', 'Pack', 0, 0),
('10150139', 'ស្ពៃក្តោប (500g)', 'OnMart', 'Dry Store', 'Pack', 0, 0),
('10150140', 'ផ្សិតម្ចុល (500g)', 'OnMart', 'Dry Store', 'Pack', 0, 0),
('10150141', 'ខ្ទឹមខ្យល់ (500g)', 'OnMart', 'Dry Store', 'Pack', 0, 0),
('10150142', 'ម្ទេសម៉ាឡេ (100g)', 'OnMart', 'Dry Store', 'Pack', 0, 0),
('10150143', 'ទឹកផ្សំម៉ាឡា (3000g)', 'OnMart', 'Dry Store', 'Pack', 0, 0),
('10160144', 'ប្រហិតសាច់ជ្រូកកញ្ចប់ (500g)', 'OnMart', 'Semi Product Sauce', 'Pack', 0, 0),
('10160145', 'ប្រហិតកាំប្រម៉ា (5stick)', 'OnMart', 'Semi Product Sauce', 'Pack', 0, 0),
('10160146', 'ប្រហិតសាច់់គោមានស្នូរ (5stick)', 'OnMart', 'Semi Product Sauce', 'Pack', 0, 0),
('10160147', 'ប្រហិតបង្កង (5stick)', 'OnMart', 'Semi Product Sauce', 'Pack', 0, 0),
('10160148', 'ប្រហិតសាច់ជ្រូក (5stick)', 'OnMart', 'Semi Product Sauce', 'Pack', 0, 0),
('10160149', 'ប្រហិតត្រី (5stick)', 'OnMart', 'Semi Product Sauce', 'Pack', 0, 0),
('10160150', 'ឈាមទា (5stick)', 'OnMart', 'Semi Product Sauce', 'Pack', 0, 0),
('10160151', 'ប្រហិតសាច់គោមានស្នូរចៀន (5stick)', 'OnMart', 'Semi Product Sauce', 'Pack', 0, 0),
('10160152', 'ប្រហិតកាំប្រម៉ាចៀន (5stick)', 'OnMart', 'Semi Product Sauce', 'Pack', 0, 0),
('10160153', 'ប្រហិតពងត្រីចៀន (5stick)', 'OnMart', 'Semi Product Sauce', 'Pack', 0, 0),
('10160154', 'ប្រហិតសាច់គោចៀន (5stick)', 'OnMart', 'Semi Product Sauce', 'Pack', 0, 0),
('10160155', 'ប្រហិតបន្លែចៀន (5stick)', 'OnMart', 'Semi Product Sauce', 'Pack', 0, 0),
('10160156', 'ប្រហិតតៅហ៊ូ (5stick)', 'OnMart', 'Semi Product Sauce', 'Pack', 0, 0),
('10160157', 'ពងស្ងោ', 'OnMart', 'Semi Product Sauce', 'Pack', 0, 0)
ON CONFLICT (item_code) DO NOTHING;

-- ==============================================================================
-- KANDAL CPU TRACKER - PRODUCTION SUPABASE / POSTGRESQL SCHEMA
-- 105 Items + 13 Stores + Daily Stock Ledger + Distributions + RLS Policies
-- ==============================================================================

-- 1. Create Items Table (105 Items)
CREATE TABLE IF NOT EXISTS items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  item_code VARCHAR(50) UNIQUE NOT NULL,
  description_khmer TEXT NOT NULL,
  location VARCHAR(50) NOT NULL, -- 'Tube Coffee' or 'OnMart'
  category VARCHAR(50) NOT NULL, -- 'Daily Product', 'Dry Store', 'Semi Product Sauce', 'Semi Product Meat', etc.
  uom VARCHAR(20) NOT NULL,      -- 'Pack', 'BTL', 'CTN', 'PCS', 'Tin'
  min_stock NUMERIC DEFAULT 10,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Stores Table (13 Stores: Tube Coffee + ON-MART)
CREATE TABLE IF NOT EXISTS stores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_code VARCHAR(20) UNIQUE NOT NULL,
  store_name VARCHAR(100) NOT NULL,
  brand VARCHAR(50) NOT NULL, -- 'Tube Coffee' or 'ON-MART'
  is_active BOOLEAN DEFAULT TRUE
);

-- 3. Daily Stock Ledger (Log-based for Immutability)
CREATE TABLE IF NOT EXISTS daily_stock_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID REFERENCES items(id) ON DELETE RESTRICT,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  opening_stock NUMERIC NOT NULL DEFAULT 0,
  received_qty NUMERIC NOT NULL DEFAULT 0,
  dispatched_qty NUMERIC NOT NULL DEFAULT 0,
  waste_qty NUMERIC NOT NULL DEFAULT 0,
  closing_stock NUMERIC GENERATED ALWAYS AS (opening_stock + received_qty - dispatched_qty - waste_qty) STORED,
  physical_count NUMERIC,
  variance NUMERIC GENERATED ALWAYS AS (physical_count - (opening_stock + received_qty - dispatched_qty - waste_qty)) STORED,
  recorded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_item_date UNIQUE(item_id, log_date)
);

-- 4. Store Distribution / Order Requests
CREATE TABLE IF NOT EXISTS store_distributions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID REFERENCES stores(id) ON DELETE RESTRICT,
  distribution_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status VARCHAR(30) DEFAULT 'Delivered', -- 'Pending', 'Packed', 'In-Transit', 'Delivered'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS store_distribution_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  distribution_id UUID REFERENCES store_distributions(id) ON DELETE CASCADE,
  item_id UUID REFERENCES items(id) ON DELETE RESTRICT,
  requested_qty NUMERIC NOT NULL,
  delivered_qty NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_stock_logs_date ON daily_stock_logs(log_date);
CREATE INDEX IF NOT EXISTS idx_stock_logs_item ON daily_stock_logs(item_id);
CREATE INDEX IF NOT EXISTS idx_store_dist_date ON store_distributions(distribution_date);

-- Enable RLS for Security
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_stock_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_distributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_distribution_items ENABLE ROW LEVEL SECURITY;

-- Drop previous policies to avoid duplicates on re-run
DROP POLICY IF EXISTS "Allow read items" ON items;
DROP POLICY IF EXISTS "Allow authenticated read" ON items;
DROP POLICY IF EXISTS "Allow all on stores" ON stores;
DROP POLICY IF EXISTS "Allow all on daily_stock_logs" ON daily_stock_logs;
DROP POLICY IF EXISTS "Allow authenticated read daily_stock_logs" ON daily_stock_logs;
DROP POLICY IF EXISTS "Allow authenticated insert daily_stock_logs" ON daily_stock_logs;
DROP POLICY IF EXISTS "Allow all on store_distributions" ON store_distributions;
DROP POLICY IF EXISTS "Allow all on store_distribution_items" ON store_distribution_items;

-- Security Policies (Both Anon and Authenticated for Next.js Web App)
CREATE POLICY "Allow read items" ON items FOR SELECT USING (true);
CREATE POLICY "Allow all on stores" ON stores FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on daily_stock_logs" ON daily_stock_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on store_distributions" ON store_distributions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on store_distribution_items" ON store_distribution_items FOR ALL USING (true) WITH CHECK (true);

-- ==============================================================================
-- 5. SEED INITIAL DATA: 13 STORES (Tube Coffee & ON-MART)
-- ==============================================================================
INSERT INTO stores (store_code, store_name, brand, is_active) VALUES
  ('TKC', 'Tube Coffee+ TKC', 'Tube Coffee', true),
  ('CCV', 'Tube Coffee+ CCV', 'Tube Coffee', true),
  ('CMH', 'Tube Coffee+ CMH', 'Tube Coffee', true),
  ('CDP', 'Tube Coffee+ CDP', 'Tube Coffee', true),
  ('KPI', 'Tube Coffee+ KPI', 'Tube Coffee', true),
  ('2K4', 'Tube Coffee+ 2K4', 'Tube Coffee', true),
  ('RTN', 'Tube Coffee+ RTN', 'Tube Coffee', true),
  ('KSH', 'Tube Coffee+ KSH', 'Tube Coffee', true),
  ('CKD', 'Tube Coffee+ CKD', 'Tube Coffee', true),
  ('PDK', 'OnMart PDK', 'ON-MART', true),
  ('TK',  'OnMart TK',  'ON-MART', true),
  ('OU3', 'OnMart OU3', 'ON-MART', true),
  ('DT',  'OnMart DT',  'ON-MART', true)
ON CONFLICT (store_code) DO UPDATE SET 
  store_name = EXCLUDED.store_name,
  brand = EXCLUDED.brand;

-- ==============================================================================
-- 6. SEED INITIAL DATA: 105 ITEMS (Tube Coffee & OnMart)
-- ==============================================================================
INSERT INTO items (item_code, description_khmer, location, category, uom, min_stock) VALUES
  ('V0003', 'ក្រូចឆ្មា (500g)', 'Tube Coffee', 'Daily Product', 'Pack', 10),
  ('V0004', 'សណ្តែកបណ្តុះ (1000g)', 'Tube Coffee', 'Daily Product', 'Pack', 10),
  ('V0005', 'ត្រកួនចិន (500g)', 'Tube Coffee', 'Daily Product', 'Pack', 10),
  ('V0008', 'ប៉េងប៉ោះទុំ (1000g)', 'Tube Coffee', 'Daily Product', 'Pack', 10),
  ('V0009', 'ខ្ទឹមបារាំង (1000g)', 'Tube Coffee', 'Daily Product', 'Pack', 10),
  ('V0006', 'ខ្ទឹមក្រហមបក (500g)', 'Tube Coffee', 'Daily Product', 'Pack', 10),
  ('V0010', 'ត្រសក់ (1000g)', 'Tube Coffee', 'Daily Product', 'Pack', 10),
  ('V0001', 'ស្លឹកខ្ទឹម (300g)', 'Tube Coffee', 'Daily Product', 'Pack', 10),
  ('V0013', 'ជីរណា (200g)', 'Tube Coffee', 'Daily Product', 'Pack', 10),
  ('V0028', 'ជីវ៉ាន់សុយ (5pcs)', 'Tube Coffee', 'Daily Product', 'Pack', 10),
  ('V0016', 'ម្ទេសម៉ាឡេក្រហម (500g)', 'Tube Coffee', 'Daily Product', 'Pack', 10),
  ('V0015', 'ម្ទេសហិរខ្មែរ (500g)', 'Tube Coffee', 'Daily Product', 'Pack', 10),
  ('D0005', 'មីពងមាន់លឿង (500g)', 'Tube Coffee', 'Daily Product', 'Pack', 10),
  ('S0046', 'លត (1000g)', 'Tube Coffee', 'Daily Product', 'Pack', 10),
  ('V0038', 'ខ្ទឹមសបក (200g)', 'Tube Coffee', 'Daily Product', 'Pack', 10),
  ('V0039', 'ម្រះព្រៅ (1Bach)', 'Tube Coffee', 'Daily Product', 'Pack', 10),
  ('V0040', 'កូនខាត់ណា (1000g)', 'Tube Coffee', 'Daily Product', 'Pack', 10),
  ('V0041', 'ស្ពៃក្ដោប (500g)', 'Tube Coffee', 'Daily Product', 'Pack', 10),
  ('V0042', 'ប៉េងប៉ោះខ្ចី (1000g)', 'Tube Coffee', 'Daily Product', 'Pack', 10),
  ('V0043', 'ស្វាយខ្ចី (1000g)', 'Tube Coffee', 'Daily Product', 'Pack', 10),
  ('V0044', 'ត្រកួនជ្រក់ (1000g)', 'Tube Coffee', 'Daily Product', 'Pack', 10),
  ('D0081', 'មីជាតិ(សាច់ជ្រូកជញ្ជ្រាំ) (24pack)', 'Tube Coffee', 'Dry Store', 'CTN', 10),
  ('D0009', 'ខ្ទឹមសបំពង (200g)', 'Tube Coffee', 'Dry Store', 'Pack', 10),
  ('D0010', 'ម្ទេសមត់ស្ងួត (250g)', 'Tube Coffee', 'Dry Store', 'Pack', 10),
  ('D0011', 'ពងមាន់ (1pcs)', 'Tube Coffee', 'Dry Store', 'PCS', 10),
  ('D0013', 'ប្រេងឆា (1Tin)', 'Tube Coffee', 'Dry Store', 'Tin', 10),
  ('D0015', 'ទឹកស៊ីអ៊ីវរូបគោ (450ml)', 'Tube Coffee', 'Dry Store', 'BTL', 10),
  ('D0016', 'ទឹកស៊ីអ៊ីវខ្មៅ (750ml)', 'Tube Coffee', 'Dry Store', 'BTL', 10),
  ('D0049', 'ថង់ច្រកសរសៃមី (500g)', 'Tube Coffee', 'Dry Store', 'Pack', 10),
  ('D0050', 'ទឹកម្ទេស (2000ml)', 'Tube Coffee', 'Dry Store', 'BTL', 10),
  ('D0082', 'ត្រីខរកំប៉ុង (10cans)', 'Tube Coffee', 'Dry Store', 'Pack', 10),
  ('D0017', 'អង្ករ ផ្កាម្លិះ (50000g)', 'Tube Coffee', 'Dry Store', 'Pack', 10),
  ('D0018', 'ប្រហិតសាច់ជ្រូក (1000g)', 'Tube Coffee', 'Dry Store', 'Pack', 10),
  ('D0053', 'ស្ពាហ្គាទី (500g)', 'Tube Coffee', 'Dry Store', 'Pack', 10),
  ('D0080', 'ពងទា (1pcs)', 'Tube Coffee', 'Dry Store', 'PCS', 10),
  ('S0001', 'ទឹកផ្សំ បាយមាន់គ្រឿង (300g)', 'Tube Coffee', 'Semi Product Sauce', 'Pack', 10),
  ('S0021', 'ទឹកផ្សំ បាយឡុកឡាក់ (100g)', 'Tube Coffee', 'Semi Product Sauce', 'Pack', 10),
  ('S0039', 'ទឹកផ្សំ បាយមាន់បំពង (200g)', 'Tube Coffee', 'Semi Product Sauce', 'Pack', 10),
  ('S0006', 'ទឹកផ្សំឡុកឡាក់ (1000ml)', 'Tube Coffee', 'Semi Product Sauce', 'BTL', 10),
  ('S0009', 'ទឹកផ្សំមីសាច់ស្រួច (1000ml)', 'Tube Coffee', 'Semi Product Sauce', 'BTL', 10),
  ('S0003', 'ទឹកត្រីកោះកុង (1000ml)', 'Tube Coffee', 'Semi Product Sauce', 'BTL', 10),
  ('S0004', 'ទឹកត្រីជូរអែម (1000ml)', 'Tube Coffee', 'Semi Product Sauce', 'BTL', 10),
  ('S0005', 'អំបិលម្រេចក្រូចឆ្មា (250g)', 'Tube Coffee', 'Semi Product Sauce', 'Pack', 10),
  ('S0014', 'ម្ទេសឆា (500g)', 'Tube Coffee', 'Semi Product Sauce', 'Pack', 10),
  ('S0015', 'ទឹកប្រេងម្ទេស (500g)', 'Tube Coffee', 'Semi Product Sauce', 'Pack', 10),
  ('S0031', 'ទឹកខ្លាញ់ស្រូបបាយសាច់ជ្រូក (200g)', 'Tube Coffee', 'Semi Product Sauce', 'Pack', 10),
  ('S0011', 'ជ្រក់ម្ទេសម៉ាឡេ (500g)', 'Tube Coffee', 'Semi Product Sauce', 'Pack', 10),
  ('S0044', 'ទឹកផ្សំឆាខ្មៅ (1000ml)', 'Tube Coffee', 'Semi Product Sauce', 'BTL', 10),
  ('S0045', 'ទឹកផ្សំ ស្វាយខ្ចី (1000ml)', 'Tube Coffee', 'Semi Product Sauce', 'BTL', 10),
  ('S0047', 'ទឹកត្រីកោះកុងហឹរ (1000ml)', 'Tube Coffee', 'Semi Product Sauce', 'BTL', 10),
  ('S0024', 'ពងមាន់ចៀន (250g)', 'Tube Coffee', 'Semi Product Meat', 'Pack', 10),
  ('S0049', 'ទឹកស៊ុប (5000L)', 'Tube Coffee', 'Semi Product Meat', 'Btl', 10),
  ('S0008', 'ជ្រក់ត្រសក់ (1000g)', 'Tube Coffee', 'Semi Product Meat', 'Pack', 10),
  ('SM001', 'ពងមាន់ខរ (10pcs)', 'Tube Coffee', 'Semi Product Meat', 'Pack', 10),
  ('SM008', 'សាច់ មីសាច់ស្រួច (65g)', 'Tube Coffee', 'Semi Product Meat', 'Pack', 10),
  ('SM010', 'សាច់ គោ (50g)', 'Tube Coffee', 'Semi Product Meat', 'Pack', 10),
  ('SM013', 'សាច់ ឡុកឡាក់ (80g)', 'Tube Coffee', 'Semi Product Meat', 'Pack', 10),
  ('SM027', 'សាច់ ភ្លៅមាន់ (200g)', 'Tube Coffee', 'Semi Product Meat', 'Pack', 10),
  ('SM017', 'សាច់ជ្រូកអាំង (50g)', 'Tube Coffee', 'Semi Product Meat', 'Pack', 10),
  ('SM024', 'ប៉ាតេ (500g)', 'Tube Coffee', 'Semi Product Meat', 'Pack', 10),
  ('SM028', 'សាច់មាន់ស៊ីអ៊ីវ (90g)', 'Tube Coffee', 'Semi Product Meat', 'Pack', 10),
  ('SM029', 'សាច់ពងទាត្រីប្រម៉ា (70g)', 'Tube Coffee', 'Semi Product Meat', 'Pack', 10),
  ('SM030', 'សាច់ត្រីប្រលាក់ (160g)', 'Tube Coffee', 'Semi Product Meat', 'Pack', 10),
  ('SM031', 'ឆ្អឹងជំនីប្រលាក់ (160g)', 'Tube Coffee', 'Semi Product Meat', 'Pack', 10),
  ('SM032', 'ស្លាបមាន់ប្រលាក់ (190g)', 'Tube Coffee', 'Semi Product Meat', 'Pack', 10),
  ('SM033', 'សាច់ងៀតគោ (50g)', 'Tube Coffee', 'Semi Product Meat', 'Pack', 10),
  ('SM034', 'សាច់មាន់់ឆាខ្ញី (140g)', 'Tube Coffee', 'Semi Product Meat', 'Pack', 10),
  ('SM035', 'ឆាឆ្អឹងជំនីរជូអែម (150g)', 'Tube Coffee', 'Semi Product Meat', 'Pack', 10),
  ('SM036', 'សាច់ជ្រូកខ (150g)', 'Tube Coffee', 'Semi Product Meat', 'Pack', 10),
  ('10130122', 'ប៉ាស្តាសាច់ក្រក (180g)', 'OnMart', 'FINISHED PRODUCT', 'Pack', 10),
  ('10130123', 'ប៉ាស្តាគ្រឿងសមុទ្រហឹរ (180g)', 'OnMart', 'FINISHED PRODUCT', 'Pack', 10),
  ('10130124', 'ប៉ាស្តាហេមកាបូណារ៉ា (180g)', 'OnMart', 'FINISHED PRODUCT', 'Pack', 10),
  ('10130125', 'បាយឆាសាច់់មាន់ខ្ទឹម (160g)', 'OnMart', 'FINISHED PRODUCT', 'Pack', 10),
  ('10130126', 'បាយឆាម៉ាឡា (200g)', 'OnMart', 'FINISHED PRODUCT', 'Pack', 10),
  ('10130127', 'គុយទាវឆាសាច់គោ (300g)', 'OnMart', 'FINISHED PRODUCT', 'Pack', 10),
  ('10130128', 'មីឆាសាច់មាន់ (200g)', 'OnMart', 'FINISHED PRODUCT', 'Pack', 10),
  ('10130129', 'បាយសាស៊ីវ (200g)', 'OnMart', 'FINISHED PRODUCT', 'Pack', 10),
  ('10130130', 'បាយឆាម្រះព្រៅ (250g)', 'OnMart', 'FINISHED PRODUCT', 'Pack', 10),
  ('10130131', 'បាយឡុកឡាក់ (250g)', 'OnMart', 'FINISHED PRODUCT', 'Pack', 10),
  ('10130132', 'លតឆា (250g)', 'OnMart', 'FINISHED PRODUCT', 'Pack', 10),
  ('10130133', 'បាយឆាសាច់មាន់ (250g)', 'OnMart', 'FINISHED PRODUCT', 'Pack', 10),
  ('10130134', 'បាយឆាខ្ញីសាច់មាន់ (250g)', 'OnMart', 'FINISHED PRODUCT', 'Pack', 10),
  ('10140135', 'សាច់ស្លាយអូស្ត្រាលី (500g)', 'OnMart', 'FINISHED PRODUCT', 'Pack', 10),
  ('10140136', 'បាខន (500g)', 'OnMart', 'FINISHED PRODUCT', 'Pack', 10),
  ('10140137', 'បង្គា (500g)', 'OnMart', 'FINISHED PRODUCT', 'Pack', 10),
  ('10150138', 'ពោតឆ្អិន (500g)', 'OnMart', 'Dry Store', 'Pack', 10),
  ('10150139', 'ស្ពៃក្តោប (500g)', 'OnMart', 'Dry Store', 'Pack', 10),
  ('10150140', 'ផ្សិតម្ចុល (500g)', 'OnMart', 'Dry Store', 'Pack', 10),
  ('10150141', 'ខ្ទឹមខ្យល់ (500g)', 'OnMart', 'Dry Store', 'Pack', 10),
  ('10150142', 'ម្ទេសម៉ាឡេ (100g)', 'OnMart', 'Dry Store', 'Pack', 10),
  ('10150143', 'ទឹកផ្សំម៉ាឡា (3000g)', 'OnMart', 'Dry Store', 'Pack', 10),
  ('10160144', 'ប្រហិតសាច់ជ្រូកកញ្ចប់ (500g)', 'OnMart', 'Semi Product Sauce', 'Pack', 10),
  ('10160145', 'ប្រហិតកាំប្រម៉ា (5stick)', 'OnMart', 'Semi Product Sauce', 'Pack', 10),
  ('10160146', 'ប្រហិតសាច់់គោមានស្នូរ (5stick)', 'OnMart', 'Semi Product Sauce', 'Pack', 10),
  ('10160147', 'ប្រហិតបង្កង (5stick)', 'OnMart', 'Semi Product Sauce', 'Pack', 10),
  ('10160148', 'ប្រហិតសាច់ជ្រូក (5stick)', 'OnMart', 'Semi Product Sauce', 'Pack', 10),
  ('10160149', 'ប្រហិតត្រី (5stick)', 'OnMart', 'Semi Product Sauce', 'Pack', 10),
  ('10160150', 'ឈាមទា (5stick)', 'OnMart', 'Semi Product Sauce', 'Pack', 10),
  ('10160151', 'ប្រហិតសាច់គោមានស្នូរចៀន (5stick)', 'OnMart', 'Semi Product Sauce', 'Pack', 10),
  ('10160152', 'ប្រហិតកាំប្រម៉ាចៀន (5stick)', 'OnMart', 'Semi Product Sauce', 'Pack', 10),
  ('10160153', 'ប្រហិតពងត្រីចៀន (5stick)', 'OnMart', 'Semi Product Sauce', 'Pack', 10),
  ('10160154', 'ប្រហិតសាច់គោចៀន (5stick)', 'OnMart', 'Semi Product Sauce', 'Pack', 10),
  ('10160155', 'ប្រហិតបន្លែចៀន (5stick)', 'OnMart', 'Semi Product Sauce', 'Pack', 10),
  ('10160156', 'ប្រហិតតៅហ៊ូ (5stick)', 'OnMart', 'Semi Product Sauce', 'Pack', 10),
  ('10160157', 'ពងស្ងោ', 'OnMart', 'Semi Product Sauce', 'Pack', 10)
ON CONFLICT (item_code) DO UPDATE SET
  description_khmer = EXCLUDED.description_khmer,
  location = EXCLUDED.location,
  category = EXCLUDED.category,
  uom = EXCLUDED.uom;

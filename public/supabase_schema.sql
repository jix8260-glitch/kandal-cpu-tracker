-- ==========================================================
-- DAILY STOCK CPU SYSTEM - SUPABASE DATABASE SCHEMA
-- For Tube Coffee+ & OnMart Central Production Unit (CPU)
-- ==========================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. User Profiles Table (Linked with Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('admin', 'manager', 'staff')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Items Master Table
CREATE TABLE IF NOT EXISTS public.items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT NOT NULL UNIQUE,
    name_kh TEXT NOT NULL,
    location TEXT NOT NULL CHECK (location IN ('Tube Coffee+', 'OnMart')),
    category TEXT NOT NULL,
    size TEXT,
    uom TEXT NOT NULL DEFAULT 'Pack',
    cpu NUMERIC(10, 4) DEFAULT 0.0000,
    selling_price NUMERIC(10, 4) DEFAULT 0.0000,
    margin_percent NUMERIC(5, 2) GENERATED ALWAYS AS (
        CASE WHEN selling_price > 0 THEN ((selling_price - cpu) / selling_price) * 100 ELSE 0 END
    ) STORED,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Daily Stock Transactions (IN / OUT)
CREATE TABLE IF NOT EXISTS public.stock_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    opening_stock NUMERIC(12, 2) DEFAULT 0,
    stock_in NUMERIC(12, 2) DEFAULT 0,
    stock_out NUMERIC(12, 2) DEFAULT 0,
    remaining_stock NUMERIC(12, 2) GENERATED ALWAYS AS (opening_stock + stock_in - stock_out) STORED,
    notes TEXT,
    created_by UUID REFERENCES public.profiles(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_item_date UNIQUE (item_id, date)
);

-- 5. Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_transactions ENABLE ROW LEVEL SECURITY;

-- Policies for Profiles
CREATE POLICY "Public profiles are viewable by authenticated users" 
ON public.profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can update user profiles" 
ON public.profiles FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Policies for Items
CREATE POLICY "Authenticated users can read items" 
ON public.items FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins and Managers can insert/update items" 
ON public.items FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
);

-- Policies for Stock Transactions
CREATE POLICY "Authenticated users can read transactions" 
ON public.stock_transactions FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can record stock transactions" 
ON public.stock_transactions FOR ALL TO authenticated USING (true);

-- 6. Trigger for New User Profile creation upon Auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'full_name', new.email),
    COALESCE(new.raw_user_meta_data->>'role', 'staff')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. Monthly Summary View
CREATE OR REPLACE VIEW public.monthly_stock_summary AS
SELECT 
    i.id AS item_id,
    i.code,
    i.name_kh,
    i.location,
    i.category,
    i.uom,
    i.cpu,
    EXTRACT(YEAR FROM t.date) AS report_year,
    EXTRACT(MONTH FROM t.date) AS report_month,
    SUM(t.stock_in) AS total_in,
    SUM(t.stock_out) AS total_out,
    (SUM(t.stock_in) - SUM(t.stock_out)) AS net_change,
    ((SUM(t.stock_in) - SUM(t.stock_out)) * i.cpu) AS total_stock_value
FROM public.items i
LEFT JOIN public.stock_transactions t ON i.id = t.item_id
GROUP BY i.id, i.code, i.name_kh, i.location, i.category, i.uom, i.cpu, report_year, report_month;

-- 8. Seed Items Master Data
INSERT INTO public.items (code, name_kh, location, category, size, uom, cpu, selling_price)
VALUES
('V0003', 'ក្រូចឆ្មា', 'Tube Coffee+', 'Daily Product', '500g', 'Pack', 0.0, 0.0),
('V0004', 'សណ្តែកបណ្តុះ', 'Tube Coffee+', 'Daily Product', '1000g', 'Pack', 0.0, 0.0),
('V0005', 'ត្រកួនចិន', 'Tube Coffee+', 'Daily Product', '500g', 'Pack', 0.0, 0.0),
('V0008', 'ប៉េងប៉ោះទុំ', 'Tube Coffee+', 'Daily Product', '1000g', 'Pack', 0.0, 0.0),
('V0009', 'ខ្ទឹមបារាំង', 'Tube Coffee+', 'Daily Product', '1000g', 'Pack', 0.0, 0.0),
('V0006', 'ខ្ទឹមក្រហមបក', 'Tube Coffee+', 'Daily Product', '500g', 'Pack', 0.0, 0.0),
('V0010', 'ត្រសក់', 'Tube Coffee+', 'Daily Product', '1000g', 'Pack', 0.0, 0.0),
('V0001', 'ស្លឹកខ្ទឹម', 'Tube Coffee+', 'Daily Product', '300g', 'Pack', 0.0, 0.0),
('V0013', 'ជីរណា', 'Tube Coffee+', 'Daily Product', '200g', 'Pack', 0.0, 0.0),
('V0028', 'ជីវ៉ាន់សុយ', 'Tube Coffee+', 'Daily Product', '5pcs', 'Pack', 0.0, 0.0),
('V0016', 'ម្ទេសម៉ាឡេក្រហម', 'Tube Coffee+', 'Daily Product', '500g', 'Pack', 0.0, 0.0),
('V0015', 'ម្ទេសហិរខ្មែរ', 'Tube Coffee+', 'Daily Product', '500g', 'Pack', 0.0, 0.0),
('D0005', 'មីពងមាន់លឿង', 'Tube Coffee+', 'Daily Product', '500g', 'Pack', 0.0, 0.0),
('S0046', 'លត', 'Tube Coffee+', 'Daily Product', '1000g', 'Pack', 0.0, 0.0),
('V0038', 'ខ្ទឹមសបក', 'Tube Coffee+', 'Daily Product', '200g', 'Pack', 0.0, 0.0),
('V0039', 'ម្រះព្រៅ', 'Tube Coffee+', 'Daily Product', '1Bach', 'Pack', 0.0, 0.0),
('V0040', 'កូនខាត់ណា', 'Tube Coffee+', 'Daily Product', '1000g', 'Pack', 0.0, 0.0),
('V0041', 'ស្ពៃក្ដោប', 'Tube Coffee+', 'Daily Product', '500g', 'Pack', 0.0, 0.0),
('V0042', 'ប៉េងប៉ោះខ្ចី', 'Tube Coffee+', 'Daily Product', '1000g', 'Pack', 0.0, 0.0),
('V0043', 'ស្វាយខ្ចី', 'Tube Coffee+', 'Daily Product', '1000g', 'Pack', 0.0, 0.0),
('V0044', 'ត្រកួនជ្រក់', 'Tube Coffee+', 'Daily Product', '1000g', 'Pack', 0.0, 0.0),
('D0081', 'មីជាតិ(សាច់ជ្រូកជញ្ជ្រាំ)', 'Tube Coffee+', 'Dry Store', '24pack', 'CTN', 0.0, 0.0),
('D0009', 'ខ្ទឹមសបំពង', 'Tube Coffee+', 'Dry Store', '200g', 'Pack', 0.0, 0.0),
('D0010', 'ម្ទេសមត់ស្ងួត', 'Tube Coffee+', 'Dry Store', '250g', 'Pack', 0.0, 0.0),
('D0011', 'ពងមាន់', 'Tube Coffee+', 'Dry Store', '1pcs', 'PCS', 0.0, 0.0),
('D0013', 'ប្រេងឆា', 'Tube Coffee+', 'Dry Store', '1Tin', 'Tin', 0.0, 0.0),
('D0015', 'ទឹកស៊ីអ៊ីវរូបគោ', 'Tube Coffee+', 'Dry Store', '450ml', 'BTL', 0.0, 0.0),
('D0016', 'ទឹកស៊ីអ៊ីវខ្មៅ', 'Tube Coffee+', 'Dry Store', '750ml', 'BTL', 0.0, 0.0),
('D0049', 'ថង់ច្រកសរសៃមី', 'Tube Coffee+', 'Dry Store', '500g', 'Pack', 0.0, 0.0),
('D0050', 'ទឹកម្ទេស', 'Tube Coffee+', 'Dry Store', '2000ml', 'BTL', 0.0, 0.0),
('D0082', 'ត្រីខរកំប៉ុង', 'Tube Coffee+', 'Dry Store', '10cans', 'Pack', 0.0, 0.0),
('D0017', 'អង្ករ ផ្កាម្លិះ', 'Tube Coffee+', 'Dry Store', '50000g', 'Pack', 0.0, 0.0),
('D0018', 'ប្រហិតសាច់ជ្រូក', 'Tube Coffee+', 'Dry Store', '1000g', 'Pack', 0.0, 0.0),
('D0053', 'ស្ពាហ្គាទី', 'Tube Coffee+', 'Dry Store', '500g', 'Pack', 0.0, 0.0),
('D0080', 'ពងទា', 'Tube Coffee+', 'Dry Store', '1pcs', 'PCS', 0.0, 0.0),
('S0001', 'ទឹកផ្សំ បាយមាន់គ្រឿង', 'Tube Coffee+', 'Semi Product Sauce', '300g', 'Pack', 0.0, 0.0),
('S0021', 'ទឹកផ្សំ បាយឡុកឡាក់', 'Tube Coffee+', 'Semi Product Sauce', '100g', 'Pack', 0.0, 0.0),
('S0039', 'ទឹកផ្សំ បាយមាន់បំពង', 'Tube Coffee+', 'Semi Product Sauce', '200g', 'Pack', 0.0, 0.0),
('S0006', 'ទឹកផ្សំឡុកឡាក់', 'Tube Coffee+', 'Semi Product Sauce', '1000ml', 'BTL', 0.0, 0.0),
('S0009', 'ទឹកផ្សំមីសាច់ស្រួច', 'Tube Coffee+', 'Semi Product Sauce', '1000ml', 'BTL', 0.0, 0.0),
('S0003', 'ទឹកត្រីកោះកុង', 'Tube Coffee+', 'Semi Product Sauce', '1000ml', 'BTL', 0.0, 0.0),
('S0004', 'ទឹកត្រីជូរអែម', 'Tube Coffee+', 'Semi Product Sauce', '1000ml', 'BTL', 0.0, 0.0),
('S0005', 'អំបិលម្រេចក្រូចឆ្មា', 'Tube Coffee+', 'Semi Product Sauce', '250g', 'Pack', 0.0, 0.0),
('S0014', 'ម្ទេសឆា', 'Tube Coffee+', 'Semi Product Sauce', '500g', 'Pack', 0.0, 0.0),
('S0015', 'ទឹកប្រេងម្ទេស', 'Tube Coffee+', 'Semi Product Sauce', '500g', 'Pack', 0.0, 0.0),
('S0031', 'ទឹកខ្លាញ់ស្រូបបាយសាច់ជ្រូក', 'Tube Coffee+', 'Semi Product Sauce', '200g', 'Pack', 0.0, 0.0),
('S0011', 'ជ្រក់ម្ទេសម៉ាឡេ', 'Tube Coffee+', 'Semi Product Sauce', '500g', 'Pack', 0.0, 0.0),
('S0044', 'ទឹកផ្សំឆាខ្មៅ', 'Tube Coffee+', 'Semi Product Sauce', '1000ml', 'BTL', 0.0, 0.0),
('S0045', 'ទឹកផ្សំ ស្វាយខ្ចី', 'Tube Coffee+', 'Semi Product Sauce', '1000ml', 'BTL', 0.0, 0.0),
('S0047', 'ទឹកត្រីកោះកុងហឹរ', 'Tube Coffee+', 'Semi Product Sauce', '1000ml', 'BTL', 0.0, 0.0),
('S0024', 'ពងមាន់ចៀន', 'Tube Coffee+', 'Semi Product Meat', '250g', 'Pack', 0.0, 0.0),
('S0049', 'ទឹកស៊ុប', 'Tube Coffee+', 'Semi Product Meat', '5000L', 'Btl', 0.0, 0.0),
('S0008', 'ជ្រក់ត្រសក់', 'Tube Coffee+', 'Semi Product Meat', '1000g', 'Pack', 0.0, 0.0),
('SM001', 'ពងមាន់ខរ', 'Tube Coffee+', 'Semi Product Meat', '10pcs', 'Pack', 0.0, 0.0),
('SM008', 'សាច់ មីសាច់ស្រួច', 'Tube Coffee+', 'Semi Product Meat', '65g', 'Pack', 0.0, 0.0),
('SM010', 'សាច់ គោ', 'Tube Coffee+', 'Semi Product Meat', '50g', 'Pack', 0.0, 0.0),
('SM013', 'សាច់ ឡុកឡាក់', 'Tube Coffee+', 'Semi Product Meat', '80g', 'Pack', 0.0, 0.0),
('SM027', 'សាច់ ភ្លៅមាន់', 'Tube Coffee+', 'Semi Product Meat', '200g', 'Pack', 0.0, 0.0),
('SM017', 'សាច់ជ្រូកអាំង', 'Tube Coffee+', 'Semi Product Meat', '50g', 'Pack', 0.0, 0.0),
('SM024', 'ប៉ាតេ', 'Tube Coffee+', 'Semi Product Meat', '500g', 'Pack', 0.0, 0.0),
('SM028', 'សាច់មាន់ស៊ីអ៊ីវ', 'Tube Coffee+', 'Semi Product Meat', '90g', 'Pack', 0.0, 0.0),
('SM029', 'សាច់ពងទាត្រីប្រម៉ា', 'Tube Coffee+', 'Semi Product Meat', '70g', 'Pack', 0.0, 0.0),
('SM030', 'សាច់ត្រីប្រលាក់', 'Tube Coffee+', 'Semi Product Meat', '160g', 'Pack', 0.0, 0.0),
('SM031', 'ឆ្អឹងជំនីប្រលាក់', 'Tube Coffee+', 'Semi Product Meat', '160g', 'Pack', 0.0, 0.0),
('SM032', 'ស្លាបមាន់ប្រលាក់', 'Tube Coffee+', 'Semi Product Meat', '190g', 'Pack', 0.0, 0.0),
('SM033', 'សាច់ងៀតគោ', 'Tube Coffee+', 'Semi Product Meat', '50g', 'Pack', 0.0, 0.0),
('SM034', 'សាច់មាន់់ឆាខ្ញី', 'Tube Coffee+', 'Semi Product Meat', '140g', 'Pack', 0.0, 0.0),
('SM035', 'ឆាឆ្អឹងជំនីរជូអែម', 'Tube Coffee+', 'Semi Product Meat', '150g', 'Pack', 0.0, 0.0),
('SM036', 'សាច់ជ្រូកខ', 'Tube Coffee+', 'Semi Product Meat', '150g', 'Pack', 0.0, 0.0),
('10130122', 'ប៉ាស្តាសាច់ក្រក', 'OnMart', 'Finished Product', '180g', 'Pack', 0.0, 0.0),
('10130123', 'ប៉ាស្តាគ្រឿងសមុទ្រហឹរ', 'OnMart', 'Finished Product', '180g', 'Pack', 0.0, 0.0),
('10130124', 'ប៉ាស្តាហេមកាបូណារ៉ា', 'OnMart', 'Finished Product', '180g', 'Pack', 0.0, 0.0),
('10130125', 'បាយឆាសាច់់មាន់ខ្ទឹម', 'OnMart', 'Finished Product', '160g', 'Pack', 0.0, 0.0),
('10130126', 'បាយឆាម៉ាឡា', 'OnMart', 'Finished Product', '200g', 'Pack', 0.0, 0.0),
('10130127', 'គុយទាវឆាសាច់គោ', 'OnMart', 'Finished Product', '300g', 'Pack', 0.0, 0.0),
('10130128', 'មីឆាសាច់មាន់', 'OnMart', 'Finished Product', '200g', 'Pack', 0.0, 0.0),
('10130129', 'បាយសាស៊ីវ', 'OnMart', 'Finished Product', '200g', 'Pack', 0.0, 0.0),
('10130130', 'បាយឆាម្រះព្រៅ', 'OnMart', 'Finished Product', '250g', 'Pack', 0.0, 0.0),
('10130131', 'បាយឡុកឡាក់', 'OnMart', 'Finished Product', '250g', 'Pack', 0.0, 0.0),
('10130132', 'លតឆា', 'OnMart', 'Finished Product', '250g', 'Pack', 0.0, 0.0),
('10130133', 'បាយឆាសាច់មាន់', 'OnMart', 'Finished Product', '250g', 'Pack', 0.0, 0.0),
('10130134', 'បាយឆាខ្ញីសាច់មាន់', 'OnMart', 'Finished Product', '250g', 'Pack', 0.0, 0.0),
('10140135', 'សាច់ស្លាយអូស្ត្រាលី', 'OnMart', 'Finished Product', '500g', 'Pack', 0.0, 0.0),
('10140136', 'បាខន', 'OnMart', 'Finished Product', '500g', 'Pack', 0.0, 0.0),
('10140137', 'បង្គា', 'OnMart', 'Finished Product', '500g', 'Pack', 0.0, 0.0),
('10150138', 'ពោតឆ្អិន', 'OnMart', 'Dry Store', '500g', 'Pack', 0.0, 0.0),
('10150139', 'ស្ពៃក្តោប', 'OnMart', 'Dry Store', '500g', 'Pack', 0.0, 0.0),
('10150140', 'ផ្សិតម្ចុល', 'OnMart', 'Dry Store', '500g', 'Pack', 0.0, 0.0),
('10150141', 'ខ្ទឹមខ្យល់', 'OnMart', 'Dry Store', '500g', 'Pack', 0.0, 0.0),
('10150142', 'ម្ទេសម៉ាឡេ', 'OnMart', 'Dry Store', '100g', 'Pack', 0.0, 0.0),
('10150143', 'ទឹកផ្សំម៉ាឡា', 'OnMart', 'Dry Store', '3000g', 'Pack', 0.0, 0.0),
('10160144', 'ប្រហិតសាច់ជ្រូកកញ្ចប់', 'OnMart', 'Semi Product Sauce', '500g', 'Pack', 0.0, 0.0),
('10160145', 'ប្រហិតកាំប្រម៉ា', 'OnMart', 'Semi Product Sauce', '5stick', 'Pack', 0.0, 0.0),
('10160146', 'ប្រហិតសាច់់គោមានស្នូរ', 'OnMart', 'Semi Product Sauce', '5stick', 'Pack', 0.0, 0.0),
('10160147', 'ប្រហិតបង្កង', 'OnMart', 'Semi Product Sauce', '5stick', 'Pack', 0.0, 0.0),
('10160148', 'ប្រហិតសាច់ជ្រូក', 'OnMart', 'Semi Product Sauce', '5stick', 'Pack', 0.0, 0.0),
('10160149', 'ប្រហិតត្រី', 'OnMart', 'Semi Product Sauce', '5stick', 'Pack', 0.0, 0.0),
('10160150', 'ឈាមទា', 'OnMart', 'Semi Product Sauce', '5stick', 'Pack', 0.0, 0.0),
('10160151', 'ប្រហិតសាច់គោមានស្នូរចៀន', 'OnMart', 'Semi Product Sauce', '5stick', 'Pack', 0.0, 0.0),
('10160152', 'ប្រហិតកាំប្រម៉ាចៀន', 'OnMart', 'Semi Product Sauce', '5stick', 'Pack', 0.0, 0.0),
('10160153', 'ប្រហិតពងត្រីចៀន', 'OnMart', 'Semi Product Sauce', '5stick', 'Pack', 0.0, 0.0),
('10160154', 'ប្រហិតសាច់គោចៀន', 'OnMart', 'Semi Product Sauce', '5stick', 'Pack', 0.0, 0.0),
('10160155', 'ប្រហិតបន្លែចៀន', 'OnMart', 'Semi Product Sauce', '5stick', 'Pack', 0.0, 0.0),
('10160156', 'ប្រហិតតៅហ៊ូ', 'OnMart', 'Semi Product Sauce', '5stick', 'Pack', 0.0, 0.0),
('10160157', 'ពងស្ងោរ', 'OnMart', 'Semi Product Sauce', 'Pack', 'Pack', 0.0, 0.0)
ON CONFLICT (code) DO UPDATE 
SET name_kh = EXCLUDED.name_kh,
    location = EXCLUDED.location,
    category = EXCLUDED.category,
    size = EXCLUDED.size,
    uom = EXCLUDED.uom,
    cpu = EXCLUDED.cpu,
    selling_price = EXCLUDED.selling_price;

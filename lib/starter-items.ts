// បញ្ជីផលិតផលទាំង ១០៥ មុខ (Tube Coffee & OnMart)
export interface StarterItemInput {
  item_code: string;
  code?: string;
  description_khmer: string;
  location: 'Tube Coffee' | 'OnMart' | 'TUBE_COFFEE' | 'ONMART' | string;
  category: string;
  uom: string;
  cpu: number;
  opening_stock: number;
}

export const STARTER_ITEMS: StarterItemInput[] = [
  // ===== TUBE COFFEE : Daily Product =====
  { item_code: 'V0003', description_khmer: 'ក្រូចឆ្មា (500g)', location: 'Tube Coffee', category: 'Daily Product', uom: 'Pack', cpu: 0.0, opening_stock: 0 },
  { item_code: 'V0004', description_khmer: 'សណ្តែកបណ្តុះ (1000g)', location: 'Tube Coffee', category: 'Daily Product', uom: 'Pack', cpu: 0.0, opening_stock: 0 },
  { item_code: 'V0005', description_khmer: 'ត្រកួនចិន (500g)', location: 'Tube Coffee', category: 'Daily Product', uom: 'Pack', cpu: 0.0, opening_stock: 0 },
  { item_code: 'V0008', description_khmer: 'ប៉េងប៉ោះទុំ (1000g)', location: 'Tube Coffee', category: 'Daily Product', uom: 'Pack', cpu: 0.0, opening_stock: 0 },
  { item_code: 'V0009', description_khmer: 'ខ្ទឹមបារាំង (1000g)', location: 'Tube Coffee', category: 'Daily Product', uom: 'Pack', cpu: 0.0, opening_stock: 0 },
  { item_code: 'V0006', description_khmer: 'ខ្ទឹមក្រហមបក (500g)', location: 'Tube Coffee', category: 'Daily Product', uom: 'Pack', cpu: 0.0, opening_stock: 0 },
  { item_code: 'V0010', description_khmer: 'ត្រសក់ (1000g)', location: 'Tube Coffee', category: 'Daily Product', uom: 'Pack', cpu: 0.0, opening_stock: 0 },
  { item_code: 'V0001', description_khmer: 'ស្លឹកខ្ទឹម (300g)', location: 'Tube Coffee', category: 'Daily Product', uom: 'Pack', cpu: 0.0, opening_stock: 0 },
  { item_code: 'V0013', description_khmer: 'ជីរណា (200g)', location: 'Tube Coffee', category: 'Daily Product', uom: 'Pack', cpu: 0.0, opening_stock: 0 },
  { item_code: 'V0028', description_khmer: 'ជីវ៉ាន់សុយ (5pcs)', location: 'Tube Coffee', category: 'Daily Product', uom: 'Pack', cpu: 0.0, opening_stock: 0 },
  { item_code: 'V0016', description_khmer: 'ម្ទេសម៉ាឡេក្រហម (500g)', location: 'Tube Coffee', category: 'Daily Product', uom: 'Pack', cpu: 0.0, opening_stock: 0 },
  { item_code: 'V0015', description_khmer: 'ម្ទេសហិរខ្មែរ (500g)', location: 'Tube Coffee', category: 'Daily Product', uom: 'Pack', cpu: 0.0, opening_stock: 0 },
  { item_code: 'D0005', description_khmer: 'មីពងមាន់លឿង (500g)', location: 'Tube Coffee', category: 'Daily Product', uom: 'Pack', cpu: 0.0, opening_stock: 0 },
  { item_code: 'S0046', description_khmer: 'លត (1000g)', location: 'Tube Coffee', category: 'Daily Product', uom: 'Pack', cpu: 0.0, opening_stock: 0 },
  { item_code: 'V0038', description_khmer: 'ខ្ទឹមសបក (200g)', location: 'Tube Coffee', category: 'Daily Product', uom: 'Pack', cpu: 0.0, opening_stock: 0 },
  { item_code: 'V0039', description_khmer: 'ម្រះព្រៅ (1Bach)', location: 'Tube Coffee', category: 'Daily Product', uom: 'Pack', cpu: 0.0, opening_stock: 0 },
  { item_code: 'V0040', description_khmer: 'កូនខាត់ណា (1000g)', location: 'Tube Coffee', category: 'Daily Product', uom: 'Pack', cpu: 0.0, opening_stock: 0 },
  { item_code: 'V0041', description_khmer: 'ស្ពៃក្ដោប (500g)', location: 'Tube Coffee', category: 'Daily Product', uom: 'Pack', cpu: 0.0, opening_stock: 0 },
  { item_code: 'V0042', description_khmer: 'ប៉េងប៉ោះខ្ចី (1000g)', location: 'Tube Coffee', category: 'Daily Product', uom: 'Pack', cpu: 0.0, opening_stock: 0 },
  { item_code: 'V0043', description_khmer: 'ស្វាយខ្ចី (1000g)', location: 'Tube Coffee', category: 'Daily Product', uom: 'Pack', cpu: 0.0, opening_stock: 0 },
  { item_code: 'V0044', description_khmer: 'ត្រកួនជ្រក់ (1000g)', location: 'Tube Coffee', category: 'Daily Product', uom: 'Pack', cpu: 0.0, opening_stock: 0 },

  // ===== TUBE COFFEE : Dry Store =====
  { item_code: 'D0081', description_khmer: 'មីជាតិ(សាច់ជ្រូកជញ្ជ្រាំ) (24pack)', location: 'Tube Coffee', category: 'Dry Store', uom: 'CTN', cpu: 0.0, opening_stock: 0 },
  { item_code: 'D0009', description_khmer: 'ខ្ទឹមសបំពង (200g)', location: 'Tube Coffee', category: 'Dry Store', uom: 'Pack', cpu: 0.0, opening_stock: 0 },
  { item_code: 'D0010', description_khmer: 'ម្ទេសមត់ស្ងួត (250g)', location: 'Tube Coffee', category: 'Dry Store', uom: 'Pack', cpu: 0.0, opening_stock: 0 },
  { item_code: 'D0011', description_khmer: 'ពងមាន់ (1pcs)', location: 'Tube Coffee', category: 'Dry Store', uom: 'PCS', cpu: 0.0, opening_stock: 0 },
  { item_code: 'D0013', description_khmer: 'ប្រេងឆា (1Tin)', location: 'Tube Coffee', category: 'Dry Store', uom: 'Tin', cpu: 0.0, opening_stock: 0 },
  { item_code: 'D0015', description_khmer: 'ទឹកស៊ីអ៊ីវរូបគោ (450ml)', location: 'Tube Coffee', category: 'Dry Store', uom: 'BTL', cpu: 0.0, opening_stock: 0 },
  { item_code: 'D0016', description_khmer: 'ទឹកស៊ីអ៊ីវខ្មៅ (750ml)', location: 'Tube Coffee', category: 'Dry Store', uom: 'BTL', cpu: 0.0, opening_stock: 0 },
  { item_code: 'D0049', description_khmer: 'ថង់ច្រកសរសៃមី (500g)', location: 'Tube Coffee', category: 'Dry Store', uom: 'Pack', cpu: 0.0, opening_stock: 0 },
  { item_code: 'D0050', description_khmer: 'ទឹកម្ទេស (2000ml)', location: 'Tube Coffee', category: 'Dry Store', uom: 'BTL', cpu: 0.0, opening_stock: 0 },
  { item_code: 'D0082', description_khmer: 'ត្រីខរកំប៉ុង (10cans)', location: 'Tube Coffee', category: 'Dry Store', uom: 'Pack', cpu: 0.0, opening_stock: 0 },
  { item_code: 'D0017', description_khmer: 'អង្ករ ផ្កាម្លិះ (50000g)', location: 'Tube Coffee', category: 'Dry Store', uom: 'Pack', cpu: 0.0, opening_stock: 0 },
  { item_code: 'D0018', description_khmer: 'ប្រហិតសាច់ជ្រូក (1000g)', location: 'Tube Coffee', category: 'Dry Store', uom: 'Pack', cpu: 0.0, opening_stock: 0 },
  { item_code: 'D0053', description_khmer: 'ស្ពាហ្គាទី (500g)', location: 'Tube Coffee', category: 'Dry Store', uom: 'Pack', cpu: 0.0, opening_stock: 0 },
  { item_code: 'D0080', description_khmer: 'ពងទា (1pcs)', location: 'Tube Coffee', category: 'Dry Store', uom: 'PCS', cpu: 0.0, opening_stock: 0 },

  // ===== TUBE COFFEE : Semi Product Sauce =====
  { item_code: 'S0001', description_khmer: 'ទឹកផ្សំ បាយមាន់គ្រឿង (300g)', location: 'Tube Coffee', category: 'Semi Product Sauce', uom: 'Pack', cpu: 0.0, opening_stock: 0 },
  { item_code: 'S0021', description_khmer: 'ទឹកផ្សំ បាយឡុកឡាក់ (100g)', location: 'Tube Coffee', category: 'Semi Product Sauce', uom: 'Pack', cpu: 0.0, opening_stock: 0 },
  { item_code: 'S0039', description_khmer: 'ទឹកផ្សំ បាយមាន់បំពង (200g)', location: 'Tube Coffee', category: 'Semi Product Sauce', uom: 'Pack', cpu: 0.0, opening_stock: 0 },
  { item_code: 'S0006', description_khmer: 'ទឹកផ្សំឡុកឡាក់ (1000ml)', location: 'Tube Coffee', category: 'Semi Product Sauce', uom: 'BTL', cpu: 0.0, opening_stock: 0 },
  { item_code: 'S0009', description_khmer: 'ទឹកផ្សំមីសាច់ស្រួច (1000ml)', location: 'Tube Coffee', category: 'Semi Product Sauce', uom: 'BTL', cpu: 0.0, opening_stock: 0 },
  { item_code: 'S0003', description_khmer: 'ទឹកត្រីកោះកុង (1000ml)', location: 'Tube Coffee', category: 'Semi Product Sauce', uom: 'BTL', cpu: 0.0, opening_stock: 0 },
  { item_code: 'S0004', description_khmer: 'ទឹកត្រីជូរអែម (1000ml)', location: 'Tube Coffee', category: 'Semi Product Sauce', uom: 'BTL', cpu: 0.0, opening_stock: 0 },
  { item_code: 'S0005', description_khmer: 'អំបិលម្រេចក្រូចឆ្មា (250g)', location: 'Tube Coffee', category: 'Semi Product Sauce', uom: 'Pack', cpu: 0.0, opening_stock: 0 },
  { item_code: 'S0014', description_khmer: 'ម្ទេសឆា (500g)', location: 'Tube Coffee', category: 'Semi Product Sauce', uom: 'Pack', cpu: 0.0, opening_stock: 0 },
  { item_code: 'S0015', description_khmer: 'ទឹកប្រេងម្ទេស (500g)', location: 'Tube Coffee', category: 'Semi Product Sauce', uom: 'Pack', cpu: 0.0, opening_stock: 0 },
  { item_code: 'S0031', description_khmer: 'ទឹកខ្លាញ់ស្រូបបាយសាច់ជ្រូក (200g)', location: 'Tube Coffee', category: 'Semi Product Sauce', uom: 'Pack', cpu: 0.0, opening_stock: 0 },
  { item_code: 'S0011', description_khmer: 'ជ្រក់ម្ទេសម៉ាឡេ (500g)', location: 'Tube Coffee', category: 'Semi Product Sauce', uom: 'Pack', cpu: 0.0, opening_stock: 0 },
  { item_code: 'S0044', description_khmer: 'ទឹកផ្សំឆាខ្មៅ (1000ml)', location: 'Tube Coffee', category: 'Semi Product Sauce', uom: 'BTL', cpu: 0.0, opening_stock: 0 },
  { item_code: 'S0045', description_khmer: 'ទឹកផ្សំ ស្វាយខ្ចី (1000ml)', location: 'Tube Coffee', category: 'Semi Product Sauce', uom: 'BTL', cpu: 0.0, opening_stock: 0 },
  { item_code: 'S0047', description_khmer: 'ទឹកត្រីកោះកុងហឹរ (1000ml)', location: 'Tube Coffee', category: 'Semi Product Sauce', uom: 'BTL', cpu: 0.0, opening_stock: 0 },

  // ===== TUBE COFFEE : Semi Product Meat =====
  { item_code: 'S0024', description_khmer: 'ពងមាន់ចៀន (250g)', location: 'Tube Coffee', category: 'Semi Product Meat', uom: 'Pack', cpu: 0.0, opening_stock: 0 },
  { item_code: 'S0049', description_khmer: 'ទឹកស៊ុប (5000L)', location: 'Tube Coffee', category: 'Semi Product Meat', uom: 'Btl', cpu: 0.0, opening_stock: 0 },
  { item_code: 'S0008', description_khmer: 'ជ្រក់ត្រសក់ (1000g)', location: 'Tube Coffee', category: 'Semi Product Meat', uom: 'Pack', cpu: 0.0, opening_stock: 0 },
  { item_code: 'SM001', description_khmer: 'ពងមាន់ខរ (10pcs)', location: 'Tube Coffee', category: 'Semi Product Meat', uom: 'Pack', cpu: 0.0, opening_stock: 0 },
  { item_code: 'SM008', description_khmer: 'សាច់ មីសាច់ស្រួច (65g)', location: 'Tube Coffee', category: 'Semi Product Meat', uom: 'Pack', cpu: 0.0, opening_stock: 0 },
  { item_code: 'SM010', description_khmer: 'សាច់ គោ (50g)', location: 'Tube Coffee', category: 'Semi Product Meat', uom: 'Pack', cpu: 0.0, opening_stock: 0 },
  { item_code: 'SM013', description_khmer: 'សាច់ ឡុកឡាក់ (80g)', location: 'Tube Coffee', category: 'Semi Product Meat', uom: 'Pack', cpu: 0.0, opening_stock: 0 },
  { item_code: 'SM027', description_khmer: 'សាច់ ភ្លៅមាន់ (200g)', location: 'Tube Coffee', category: 'Semi Product Meat', uom: 'Pack', cpu: 0.0, opening_stock: 0 },
  { item_code: 'SM017', description_khmer: 'សាច់ជ្រូកអាំង (50g)', location: 'Tube Coffee', category: 'Semi Product Meat', uom: 'Pack', cpu: 0.0, opening_stock: 0 },
  { item_code: 'SM024', description_khmer: 'ប៉ាតេ (500g)', location: 'Tube Coffee', category: 'Semi Product Meat', uom: 'Pack', cpu: 0.0, opening_stock: 0 },
  { item_code: 'SM028', description_khmer: 'សាច់មាន់ស៊ីអ៊ីវ (90g)', location: 'Tube Coffee', category: 'Semi Product Meat', uom: 'Pack', cpu: 0.0, opening_stock: 0 },
  { item_code: 'SM029', description_khmer: 'សាច់ពងទាត្រីប្រម៉ា (70g)', location: 'Tube Coffee', category: 'Semi Product Meat', uom: 'Pack', cpu: 0.0, opening_stock: 0 },
  { item_code: 'SM030', description_khmer: 'សាច់ត្រីប្រលាក់ (160g)', location: 'Tube Coffee', category: 'Semi Product Meat', uom: 'Pack', cpu: 0.0, opening_stock: 0 },
  { item_code: 'SM031', description_khmer: 'ឆ្អឹងជំនីប្រលាក់ (160g)', location: 'Tube Coffee', category: 'Semi Product Meat', uom: 'Pack', cpu: 0.0, opening_stock: 0 },
  { item_code: 'SM032', description_khmer: 'ស្លាបមាន់ប្រលាក់ (190g)', location: 'Tube Coffee', category: 'Semi Product Meat', uom: 'Pack', cpu: 0.0, opening_stock: 0 },
  { item_code: 'SM033', description_khmer: 'សាច់ងៀតគោ (50g)', location: 'Tube Coffee', category: 'Semi Product Meat', uom: 'Pack', cpu: 0.0, opening_stock: 0 },
  { item_code: 'SM034', description_khmer: 'សាច់មាន់់ឆាខ្ញី (140g)', location: 'Tube Coffee', category: 'Semi Product Meat', uom: 'Pack', cpu: 0.0, opening_stock: 0 },
  { item_code: 'SM035', description_khmer: 'ឆាឆ្អឹងជំនីរជូអែម (150g)', location: 'Tube Coffee', category: 'Semi Product Meat', uom: 'Pack', cpu: 0.0, opening_stock: 0 },
  { item_code: 'SM036', description_khmer: 'សាច់ជ្រូកខ (150g)', location: 'Tube Coffee', category: 'Semi Product Meat', uom: 'Pack', cpu: 0.0, opening_stock: 0 },

  // ===== ONMART : FINISHED PRODUCT =====
  { item_code: '10130122', description_khmer: 'ប៉ាស្តាសាច់ក្រក (180g)', location: 'OnMart', category: 'FINISHED PRODUCT', uom: 'Pack', cpu: 0.0, opening_stock: 0 },
  { item_code: '10130123', description_khmer: 'ប៉ាស្តាគ្រឿងសមុទ្រហឹរ (180g)', location: 'OnMart', category: 'FINISHED PRODUCT', uom: 'Pack', cpu: 0.0, opening_stock: 0 },
  { item_code: '10130124', description_khmer: 'ប៉ាស្តាហេមកាបូណារ៉ា (180g)', location: 'OnMart', category: 'FINISHED PRODUCT', uom: 'Pack', cpu: 0.0, opening_stock: 0 },
  { item_code: '10130125', description_khmer: 'បាយឆាសាច់់មាន់ខ្ទឹម (160g)', location: 'OnMart', category: 'FINISHED PRODUCT', uom: 'Pack', cpu: 0.0, opening_stock: 0 },
  { item_code: '10130126', description_khmer: 'បាយឆាម៉ាឡា (200g)', location: 'OnMart', category: 'FINISHED PRODUCT', uom: 'Pack', cpu: 0.0, opening_stock: 0 },
  { item_code: '10130127', description_khmer: 'គុយទាវឆាសាច់គោ (300g)', location: 'OnMart', category: 'FINISHED PRODUCT', uom: 'Pack', cpu: 0.0, opening_stock: 0 },
  { item_code: '10130128', description_khmer: 'មីឆាសាច់មាន់ (200g)', location: 'OnMart', category: 'FINISHED PRODUCT', uom: 'Pack', cpu: 0.0, opening_stock: 0 },
  { item_code: '10130129', description_khmer: 'បាយសាស៊ីវ (200g)', location: 'OnMart', category: 'FINISHED PRODUCT', uom: 'Pack', cpu: 0.0, opening_stock: 0 },
  { item_code: '10130130', description_khmer: 'បាយឆាម្រះព្រៅ (250g)', location: 'OnMart', category: 'FINISHED PRODUCT', uom: 'Pack', cpu: 0.0, opening_stock: 0 },
  { item_code: '10130131', description_khmer: 'បាយឡុកឡាក់ (250g)', location: 'OnMart', category: 'FINISHED PRODUCT', uom: 'Pack', cpu: 0.0, opening_stock: 0 },
  { item_code: '10130132', description_khmer: 'លតឆា (250g)', location: 'OnMart', category: 'FINISHED PRODUCT', uom: 'Pack', cpu: 0.0, opening_stock: 0 },
  { item_code: '10130133', description_khmer: 'បាយឆាសាច់មាន់ (250g)', location: 'OnMart', category: 'FINISHED PRODUCT', uom: 'Pack', cpu: 0.0, opening_stock: 0 },
  { item_code: '10130134', description_khmer: 'បាយឆាខ្ញីសាច់មាន់ (250g)', location: 'OnMart', category: 'FINISHED PRODUCT', uom: 'Pack', cpu: 0.0, opening_stock: 0 },
  { item_code: '10140135', description_khmer: 'សាច់ស្លាយអូស្ត្រាលី (500g)', location: 'OnMart', category: 'FINISHED PRODUCT', uom: 'Pack', cpu: 0.0, opening_stock: 0 },
  { item_code: '10140136', description_khmer: 'បាខន (500g)', location: 'OnMart', category: 'FINISHED PRODUCT', uom: 'Pack', cpu: 0.0, opening_stock: 0 },
  { item_code: '10140137', description_khmer: 'បង្គា (500g)', location: 'OnMart', category: 'FINISHED PRODUCT', uom: 'Pack', cpu: 0.0, opening_stock: 0 },

  // ===== ONMART : Dry Store =====
  { item_code: '10150138', description_khmer: 'ពោតឆ្អិន (500g)', location: 'OnMart', category: 'Dry Store', uom: 'Pack', cpu: 0.0, opening_stock: 0 },
  { item_code: '10150139', description_khmer: 'ស្ពៃក្តោប (500g)', location: 'OnMart', category: 'Dry Store', uom: 'Pack', cpu: 0.0, opening_stock: 0 },
  { item_code: '10150140', description_khmer: 'ផ្សិតម្ចុល (500g)', location: 'OnMart', category: 'Dry Store', uom: 'Pack', cpu: 0.0, opening_stock: 0 },
  { item_code: '10150141', description_khmer: 'ខ្ទឹមខ្យល់ (500g)', location: 'OnMart', category: 'Dry Store', uom: 'Pack', cpu: 0.0, opening_stock: 0 },
  { item_code: '10150142', description_khmer: 'ម្ទេសម៉ាឡេ (100g)', location: 'OnMart', category: 'Dry Store', uom: 'Pack', cpu: 0.0, opening_stock: 0 },
  { item_code: '10150143', description_khmer: 'ទឹកផ្សំម៉ាឡា (3000g)', location: 'OnMart', category: 'Dry Store', uom: 'Pack', cpu: 0.0, opening_stock: 0 },

  // ===== ONMART : Semi Product Sauce =====
  { item_code: '10160144', description_khmer: 'ប្រហិតសាច់ជ្រូកកញ្ចប់ (500g)', location: 'OnMart', category: 'Semi Product Sauce', uom: 'Pack', cpu: 0.0, opening_stock: 0 },
  { item_code: '10160145', description_khmer: 'ប្រហិតកាំប្រម៉ា (5stick)', location: 'OnMart', category: 'Semi Product Sauce', uom: 'Pack', cpu: 0.0, opening_stock: 0 },
  { item_code: '10160146', description_khmer: 'ប្រហិតសាច់់គោមានស្នូរ (5stick)', location: 'OnMart', category: 'Semi Product Sauce', uom: 'Pack', cpu: 0.0, opening_stock: 0 },
  { item_code: '10160147', description_khmer: 'ប្រហិតបង្កង (5stick)', location: 'OnMart', category: 'Semi Product Sauce', uom: 'Pack', cpu: 0.0, opening_stock: 0 },
  { item_code: '10160148', description_khmer: 'ប្រហិតសាច់ជ្រូក (5stick)', location: 'OnMart', category: 'Semi Product Sauce', uom: 'Pack', cpu: 0.0, opening_stock: 0 },
  { item_code: '10160149', description_khmer: 'ប្រហិតត្រី (5stick)', location: 'OnMart', category: 'Semi Product Sauce', uom: 'Pack', cpu: 0.0, opening_stock: 0 },
  { item_code: '10160150', description_khmer: 'ឈាមទា (5stick)', location: 'OnMart', category: 'Semi Product Sauce', uom: 'Pack', cpu: 0.0, opening_stock: 0 },
  { item_code: '10160151', description_khmer: 'ប្រហិតសាច់គោមានស្នូរចៀន (5stick)', location: 'OnMart', category: 'Semi Product Sauce', uom: 'Pack', cpu: 0.0, opening_stock: 0 },
  { item_code: '10160152', description_khmer: 'ប្រហិតកាំប្រម៉ាចៀន (5stick)', location: 'OnMart', category: 'Semi Product Sauce', uom: 'Pack', cpu: 0.0, opening_stock: 0 },
  { item_code: '10160153', description_khmer: 'ប្រហិតពងត្រីចៀន (5stick)', location: 'OnMart', category: 'Semi Product Sauce', uom: 'Pack', cpu: 0.0, opening_stock: 0 },
  { item_code: '10160154', description_khmer: 'ប្រហិតសាច់គោចៀន (5stick)', location: 'OnMart', category: 'Semi Product Sauce', uom: 'Pack', cpu: 0.0, opening_stock: 0 },
  { item_code: '10160155', description_khmer: 'ប្រហិតបន្លែចៀន (5stick)', location: 'OnMart', category: 'Semi Product Sauce', uom: 'Pack', cpu: 0.0, opening_stock: 0 },
  { item_code: '10160156', description_khmer: 'ប្រហិតតៅហ៊ូ (5stick)', location: 'OnMart', category: 'Semi Product Sauce', uom: 'Pack', cpu: 0.0, opening_stock: 0 },
  { item_code: '10160157', description_khmer: 'ពងស្ងោ', location: 'OnMart', category: 'Semi Product Sauce', uom: 'Pack', cpu: 0.0, opening_stock: 0 },
];

/**
 * Normalizes all starter items to match application and database schema
 */
export function getNormalizedStarterItems() {
  return STARTER_ITEMS.map((item, index) => {
    const rawCode = item.code || item.item_code || `ITEM-${index + 1}`;
    const rawLoc = String(item.location).toUpperCase().replace(/\s+/g, '_');
    const location: 'TUBE_COFFEE' | 'ONMART' = rawLoc.includes('TUBE') ? 'TUBE_COFFEE' : 'ONMART';

    return {
      id: `starter-${rawCode}`,
      code: rawCode,
      description_khmer: item.description_khmer,
      category: item.category,
      uom: item.uom,
      cpu: Number(item.cpu) || 0,
      location,
      opening_stock: Number(item.opening_stock) || 0,
    };
  });
}

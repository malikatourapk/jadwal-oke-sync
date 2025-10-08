# Setup Realtime & RLS untuk Fitur Checkout dan Sync

Jalankan SQL commands berikut di **Supabase SQL Editor** untuk:
1. Mengaktifkan realtime sync otomatis
2. Memperbaiki RLS policy agar semua user approved bisa checkout

## 1. Enable Realtime untuk Semua Tabel

```sql
-- Enable realtime untuk products table
ALTER TABLE public.products REPLICA IDENTITY FULL;
ALTER publication supabase_realtime ADD TABLE public.products;

-- Enable realtime untuk receipts table
ALTER TABLE public.receipts REPLICA IDENTITY FULL;
ALTER publication supabase_realtime ADD TABLE public.receipts;

-- Enable realtime untuk receipt_items table
ALTER TABLE public.receipt_items REPLICA IDENTITY FULL;
ALTER publication supabase_realtime ADD TABLE public.receipt_items;
```

## 2. Fix RLS Policies untuk Receipts

```sql
-- Allow all authenticated users to insert receipts
DROP POLICY IF EXISTS "Users can insert own receipts" ON public.receipts;
CREATE POLICY "Users can insert own receipts"
ON public.receipts
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Allow users to view their own receipts
DROP POLICY IF EXISTS "Users can view own receipts" ON public.receipts;
CREATE POLICY "Users can view own receipts"
ON public.receipts
FOR SELECT
TO authenticated
USING (user_id = auth.uid());
```

## 3. Fix RLS Policies untuk Receipt Items

```sql
-- Allow insert receipt items for authenticated users
DROP POLICY IF EXISTS "Users can insert receipt items" ON public.receipt_items;
CREATE POLICY "Users can insert receipt items"
ON public.receipt_items
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.receipts
    WHERE receipts.id = receipt_items.receipt_id
    AND receipts.user_id = auth.uid()
  )
);

-- Allow users to view their receipt items
DROP POLICY IF EXISTS "Users can view receipt items" ON public.receipt_items;
CREATE POLICY "Users can view receipt items"
ON public.receipt_items
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.receipts
    WHERE receipts.id = receipt_items.receipt_id
    AND receipts.user_id = auth.uid()
  )
);
```

## 4. Ensure Products Table RLS untuk Semua User

```sql
-- Allow all authenticated users to manage products
DROP POLICY IF EXISTS "Authenticated users can view products" ON public.products;
CREATE POLICY "Authenticated users can view products"
ON public.products
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert products" ON public.products;
CREATE POLICY "Authenticated users can insert products"
ON public.products
FOR INSERT
TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update products" ON public.products;
CREATE POLICY "Authenticated users can update products"
ON public.products
FOR UPDATE
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Authenticated users can delete products" ON public.products;
CREATE POLICY "Authenticated users can delete products"
ON public.products
FOR DELETE
TO authenticated
USING (true);
```

## Cara Menjalankan:

1. Buka **Supabase Dashboard** project Anda
2. Ke menu **SQL Editor**
3. Copy-paste semua SQL commands di atas
4. Klik **Run** atau tekan `Ctrl+Enter`
5. Refresh aplikasi kasir

Setelah menjalankan SQL ini:
- ✅ Realtime sync akan berjalan otomatis tanpa perlu refresh
- ✅ Semua user yang sudah approved bisa checkout
- ✅ Data akan ter-sync secara realtime antar device

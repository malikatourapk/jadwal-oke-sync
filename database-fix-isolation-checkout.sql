-- ========================================
-- FIX DATABASE ISOLATION & CHECKOUT ISSUES
-- Run this SQL in Supabase SQL Editor
-- ========================================

-- 1. Add store_id to products table for data isolation
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_products_store_id ON public.products(store_id);

-- 2. Update RLS policies for products to filter by store
DROP POLICY IF EXISTS "Anyone can view products" ON public.products;
DROP POLICY IF EXISTS "Authenticated users can manage products" ON public.products;
DROP POLICY IF EXISTS "Users can view their store products" ON public.products;
DROP POLICY IF EXISTS "Users can manage their store products" ON public.products;

-- Only view products from your own store
CREATE POLICY "Users can view their store products"
ON public.products
FOR SELECT
TO authenticated
USING (
  store_id IN (
    SELECT id FROM public.stores WHERE owner_id = auth.uid()
  )
);

-- Only manage products from your own store  
CREATE POLICY "Users can manage their store products"
ON public.products
FOR ALL
TO authenticated
USING (
  store_id IN (
    SELECT id FROM public.stores WHERE owner_id = auth.uid()
  )
)
WITH CHECK (
  store_id IN (
    SELECT id FROM public.stores WHERE owner_id = auth.uid()
  )
);

-- 3. Update existing products to link to stores
-- Link products to the owner's store
DO $$
DECLARE
  store_record RECORD;
BEGIN
  FOR store_record IN 
    SELECT DISTINCT s.id as store_id, s.owner_id
    FROM public.stores s
  LOOP
    UPDATE public.products p
    SET store_id = store_record.store_id
    WHERE p.store_id IS NULL;
  END LOOP;
END $$;

-- 4. Change admin password default to 12345
UPDATE public.stores
SET admin_password = '12345'
WHERE admin_password IN ('122344566', '12234566') OR admin_password IS NULL;

UPDATE public.stores  
SET settings_password = '12345'
WHERE settings_password IN ('122344566', '12234566') OR settings_password IS NULL;

-- 5. Add WhatsApp report number field
ALTER TABLE public.stores
ADD COLUMN IF NOT EXISTS whatsapp_report_number TEXT;

-- Create store categories enum
CREATE TYPE public.store_category AS ENUM (
  'sembako',
  'bangunan', 
  'agen_sosis',
  'atk',
  'elektronik',
  'pakaian',
  'farmasi',
  'lainnya'
);

-- Create stores table
CREATE TABLE public.stores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category store_category NOT NULL,
  phone TEXT,
  address TEXT,
  cashier_name TEXT,
  owner_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

-- Create policies for stores
CREATE POLICY "Users can view their own stores" 
ON public.stores 
FOR SELECT 
USING (auth.uid() = owner_id);

CREATE POLICY "Users can create their own stores" 
ON public.stores 
FOR INSERT 
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own stores" 
ON public.stores 
FOR UPDATE 
USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own stores" 
ON public.stores 
FOR DELETE 
USING (auth.uid() = owner_id);

-- Add store_id to existing tables
ALTER TABLE public.receipts ADD COLUMN store_id UUID REFERENCES public.stores(id);
ALTER TABLE public.products ADD COLUMN store_id UUID REFERENCES public.stores(id);
ALTER TABLE public.shopping_items ADD COLUMN store_id UUID REFERENCES public.stores(id);

-- Update existing RLS policies to include store context
DROP POLICY IF EXISTS "Authenticated users can manage products" ON public.products;
CREATE POLICY "Users can manage products for their stores" 
ON public.products 
FOR ALL 
USING (
  auth.uid() IS NOT NULL AND 
  (store_id IS NULL OR store_id IN (SELECT id FROM public.stores WHERE owner_id = auth.uid()))
);

-- Update receipts RLS policies
DROP POLICY IF EXISTS "Users can create receipts" ON public.receipts;
DROP POLICY IF EXISTS "Users can view their own receipts" ON public.receipts;

CREATE POLICY "Users can create receipts for their stores" 
ON public.receipts 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id AND 
  (store_id IS NULL OR store_id IN (SELECT id FROM public.stores WHERE owner_id = auth.uid()))
);

CREATE POLICY "Users can view receipts for their stores" 
ON public.receipts 
FOR SELECT 
USING (
  auth.uid() = user_id AND 
  (store_id IS NULL OR store_id IN (SELECT id FROM public.stores WHERE owner_id = auth.uid()))
);

-- Update shopping_items RLS policies  
DROP POLICY IF EXISTS "Users can create their own shopping items" ON public.shopping_items;
DROP POLICY IF EXISTS "Users can view their own shopping items" ON public.shopping_items;
DROP POLICY IF EXISTS "Users can update their own shopping items" ON public.shopping_items;
DROP POLICY IF EXISTS "Users can delete their own shopping items" ON public.shopping_items;

CREATE POLICY "Users can create shopping items for their stores" 
ON public.shopping_items 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id AND 
  (store_id IS NULL OR store_id IN (SELECT id FROM public.stores WHERE owner_id = auth.uid()))
);

CREATE POLICY "Users can view shopping items for their stores" 
ON public.shopping_items 
FOR SELECT 
USING (
  auth.uid() = user_id AND 
  (store_id IS NULL OR store_id IN (SELECT id FROM public.stores WHERE owner_id = auth.uid()))
);

CREATE POLICY "Users can update shopping items for their stores" 
ON public.shopping_items 
FOR UPDATE 
USING (
  auth.uid() = user_id AND 
  (store_id IS NULL OR store_id IN (SELECT id FROM public.stores WHERE owner_id = auth.uid()))
);

CREATE POLICY "Users can delete shopping items for their stores" 
ON public.shopping_items 
FOR DELETE 
USING (
  auth.uid() = user_id AND 
  (store_id IS NULL OR store_id IN (SELECT id FROM public.stores WHERE owner_id = auth.uid()))
);

-- Create trigger for automatic timestamp updates on stores
CREATE TRIGGER update_stores_updated_at
BEFORE UPDATE ON public.stores
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
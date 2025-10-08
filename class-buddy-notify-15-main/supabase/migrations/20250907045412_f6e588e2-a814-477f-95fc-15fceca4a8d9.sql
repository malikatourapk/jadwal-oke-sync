-- Add missing columns to products for POS needs
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS cost_price numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sell_price numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_photocopy boolean NOT NULL DEFAULT false;

-- Backfill sell_price from existing price when available
UPDATE public.products
SET sell_price = price
WHERE sell_price = 0;

-- Receipts table to store transactions
CREATE TABLE IF NOT EXISTS public.receipts (
  id text PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  invoice_number text UNIQUE,
  subtotal numeric NOT NULL DEFAULT 0,
  discount numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  profit numeric NOT NULL DEFAULT 0,
  payment_method text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view receipts" ON public.receipts FOR SELECT USING (true);
CREATE POLICY "Anyone can insert receipts" ON public.receipts FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update receipts" ON public.receipts FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete receipts" ON public.receipts FOR DELETE USING (true);

-- Receipt items belonging to receipts
CREATE TABLE IF NOT EXISTS public.receipt_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_id text NOT NULL REFERENCES public.receipts(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  quantity integer NOT NULL,
  unit_price numeric NOT NULL,
  cost_price numeric NOT NULL,
  total_price numeric NOT NULL,
  profit numeric NOT NULL
);

ALTER TABLE public.receipt_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view receipt_items" ON public.receipt_items FOR SELECT USING (true);
CREATE POLICY "Anyone can insert receipt_items" ON public.receipt_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update receipt_items" ON public.receipt_items FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete receipt_items" ON public.receipt_items FOR DELETE USING (true);

-- Shopping items list for inventory restock planning
CREATE TABLE IF NOT EXISTS public.shopping_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  quantity integer,
  unit text,
  current_stock integer,
  notes text,
  is_completed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.shopping_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view shopping_items" ON public.shopping_items FOR SELECT USING (true);
CREATE POLICY "Anyone can insert shopping_items" ON public.shopping_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update shopping_items" ON public.shopping_items FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete shopping_items" ON public.shopping_items FOR DELETE USING (true);

-- Update timestamp triggers
DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;
CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_shopping_items_updated_at ON public.shopping_items;
CREATE TRIGGER update_shopping_items_updated_at
BEFORE UPDATE ON public.shopping_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- RPC for username/email lookup during sign-in
CREATE OR REPLACE FUNCTION public.get_user_by_username_or_email(identifier text)
RETURNS TABLE(email text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.email::text
  FROM auth.users AS u
  WHERE u.email = identifier
     OR (u.raw_user_meta_data ->> 'username') = identifier
  LIMIT 1
$$;
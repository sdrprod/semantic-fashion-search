-- ============================================
-- Add Affiliate Columns to Products Table
-- Run this in Supabase SQL Editor
-- ============================================

-- Add affiliate-specific columns
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS affiliate_network text,
ADD COLUMN IF NOT EXISTS merchant_id text,
ADD COLUMN IF NOT EXISTS merchant_name text,
ADD COLUMN IF NOT EXISTS category text,
ADD COLUMN IF NOT EXISTS in_stock boolean DEFAULT true;

-- Add unique constraint on product_url to prevent duplicates during sync
-- Drop it first if it exists (in case of re-running)
ALTER TABLE public.products
DROP CONSTRAINT IF EXISTS unique_product_url;

ALTER TABLE public.products
ADD CONSTRAINT unique_product_url UNIQUE (product_url);

-- Create indexes for filtering and querying
CREATE INDEX IF NOT EXISTS idx_products_affiliate_network ON public.products(affiliate_network);
CREATE INDEX IF NOT EXISTS idx_products_merchant ON public.products(merchant_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_in_stock ON public.products(in_stock) WHERE in_stock = true;

-- Add comments for documentation
COMMENT ON COLUMN public.products.affiliate_network IS 'Affiliate network source (e.g., impact, cj, shareasale)';
COMMENT ON COLUMN public.products.merchant_id IS 'Merchant/campaign identifier from affiliate network';
COMMENT ON COLUMN public.products.merchant_name IS 'Human-readable merchant/brand name';
COMMENT ON COLUMN public.products.category IS 'Product category from affiliate network';
COMMENT ON COLUMN public.products.in_stock IS 'Product availability status';

-- Verify the changes
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'products'
  AND table_schema = 'public'
ORDER BY ordinal_position;

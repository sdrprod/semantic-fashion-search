-- ============================================
-- Complete Products Table Migration
-- Cleanup duplicates + Add affiliate columns
-- Run this in Supabase SQL Editor
-- ============================================

-- STEP 1: Remove duplicate products
-- ============================================

DO $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete duplicates, keeping only the most recent one
  WITH duplicates AS (
    SELECT id
    FROM (
      SELECT
        id,
        ROW_NUMBER() OVER (
          PARTITION BY product_url
          ORDER BY created_at DESC, id DESC
        ) as row_num
      FROM public.products
    ) ranked
    WHERE row_num > 1
  )
  DELETE FROM public.products
  WHERE id IN (SELECT id FROM duplicates);

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE 'Deleted % duplicate products', deleted_count;
END $$;

-- STEP 2: Add affiliate columns
-- ============================================

ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS affiliate_network text,
ADD COLUMN IF NOT EXISTS merchant_id text,
ADD COLUMN IF NOT EXISTS merchant_name text,
ADD COLUMN IF NOT EXISTS category text,
ADD COLUMN IF NOT EXISTS in_stock boolean DEFAULT true;

-- STEP 3: Add unique constraint
-- ============================================

ALTER TABLE public.products
DROP CONSTRAINT IF EXISTS unique_product_url;

ALTER TABLE public.products
ADD CONSTRAINT unique_product_url UNIQUE (product_url);

-- STEP 4: Create indexes
-- ============================================

CREATE INDEX IF NOT EXISTS idx_products_affiliate_network ON public.products(affiliate_network);
CREATE INDEX IF NOT EXISTS idx_products_merchant ON public.products(merchant_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_in_stock ON public.products(in_stock) WHERE in_stock = true;

-- STEP 5: Add documentation
-- ============================================

COMMENT ON COLUMN public.products.affiliate_network IS 'Affiliate network source (e.g., impact, cj, shareasale)';
COMMENT ON COLUMN public.products.merchant_id IS 'Merchant/campaign identifier from affiliate network';
COMMENT ON COLUMN public.products.merchant_name IS 'Human-readable merchant/brand name';
COMMENT ON COLUMN public.products.category IS 'Product category from affiliate network';
COMMENT ON COLUMN public.products.in_stock IS 'Product availability status';

-- STEP 6: Verification
-- ============================================

-- Show final product count
SELECT COUNT(*) as total_products FROM public.products;

-- Show column structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'products'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- ============================================
-- Add target_gender column to products table
-- Run FIRST in Supabase SQL Editor before running classify-product-gender.mjs
-- ============================================

-- Add the column (safe to re-run)
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS target_gender text
  CHECK (target_gender IN ('women', 'men', 'unisex'));

-- Index for fast filtering in match_products RPC
CREATE INDEX IF NOT EXISTS idx_products_target_gender
  ON public.products(target_gender);

-- Comment
COMMENT ON COLUMN public.products.target_gender IS
  'Gender target: women, men, unisex, or NULL (unclassified). Set by classify-product-gender.mjs script.';

-- Verify
SELECT
  target_gender,
  COUNT(*) as count
FROM public.products
GROUP BY target_gender
ORDER BY count DESC;

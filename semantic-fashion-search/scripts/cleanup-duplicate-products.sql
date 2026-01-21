-- ============================================
-- Clean Up Duplicate Products
-- Run this BEFORE add-affiliate-columns.sql
-- ============================================

-- Step 1: View duplicates (for inspection)
SELECT
  product_url,
  COUNT(*) as duplicate_count,
  STRING_AGG(id::text, ', ') as duplicate_ids
FROM public.products
GROUP BY product_url
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;

-- Step 2: Delete duplicates, keeping only the most recent one
-- This will keep the product with the latest created_at timestamp
DELETE FROM public.products
WHERE id IN (
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
);

-- Step 3: Verify no duplicates remain
SELECT
  product_url,
  COUNT(*) as count
FROM public.products
GROUP BY product_url
HAVING COUNT(*) > 1;

-- Step 4: Show how many products remain
SELECT COUNT(*) as total_products FROM public.products;

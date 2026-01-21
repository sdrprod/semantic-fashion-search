-- Backfill merchant_name in safe 10,000-row batches using ctid
-- Run this query REPEATEDLY until it says "0 rows affected"

-- This query updates up to 10,000 rows at a time
WITH chunk AS (
  SELECT ctid
  FROM products
  WHERE merchant_name IS NULL
    AND brand IS NOT NULL
  LIMIT 10000
)
UPDATE products p
SET merchant_name = brand
FROM chunk
WHERE p.ctid = chunk.ctid;

-- Check progress after each run:
SELECT
  COUNT(*) FILTER (WHERE merchant_name IS NOT NULL) as with_merchant,
  COUNT(*) FILTER (WHERE merchant_name IS NULL AND brand IS NOT NULL) as remaining,
  COUNT(*) FILTER (WHERE merchant_name IS NULL AND brand IS NULL) as cannot_update,
  COUNT(*) as total
FROM products;

-- Instructions:
-- 1. Copy the UPDATE query above (lines 5-13)
-- 2. Click "Run" in Supabase SQL Editor
-- 3. Wait for completion (~2-5 seconds)
-- 4. Click "Run" again
-- 5. Repeat until you see "0 rows affected"
-- 6. Should take ~1-2 runs for 7,446 products

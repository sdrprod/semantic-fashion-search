-- ============================================================
-- PRE-MIGRATION VALIDATION SCRIPT
-- ============================================================
-- Run this in Supabase SQL Editor BEFORE the migration
-- This will show you the current state of your database

-- 1. Check current embedding column data type
SELECT
  column_name,
  data_type,
  character_maximum_length
FROM information_schema.columns
WHERE table_name = 'products'
  AND column_name = 'embedding';

-- Expected Result BEFORE migration:
-- column_name | data_type | character_maximum_length
-- embedding   | text      | NULL

-- 2. Count products with embeddings
SELECT
  COUNT(*) as total_products,
  COUNT(embedding) as products_with_embeddings,
  COUNT(embedding)::float / COUNT(*)::float * 100 as percentage_with_embeddings
FROM products;

-- Expected: ~20,058 total, 100% with embeddings

-- 3. Check sample embedding format (should be TEXT string like "[0.026,0.15,...]")
SELECT
  id,
  name,
  LEFT(embedding::text, 50) as embedding_sample,
  LENGTH(embedding::text) as embedding_length
FROM products
WHERE embedding IS NOT NULL
LIMIT 5;

-- Expected: embedding_sample should start with "["

-- 4. Check if match_products function exists
SELECT
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'match_products';

-- Expected: Should show match_products function

-- 5. Check for existing indexes on embedding column
SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'products'
  AND indexdef LIKE '%embedding%';

-- Expected: May show no indexes or text-based indexes

-- 6. Estimate database size before migration
SELECT
  pg_size_pretty(pg_total_relation_size('products')) as table_size,
  pg_size_pretty(pg_database_size(current_database())) as database_size;

-- ============================================================
-- SAVE THESE RESULTS! You'll compare after migration.
-- ============================================================

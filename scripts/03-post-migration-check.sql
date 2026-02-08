-- ============================================================
-- POST-MIGRATION VALIDATION SCRIPT
-- ============================================================
-- Run this in Supabase SQL Editor AFTER the migration
-- Compare results with pre-migration output

-- 1. ✅ Verify embedding column is now vector type
SELECT
  column_name,
  data_type,
  udt_name
FROM information_schema.columns
WHERE table_name = 'products'
  AND column_name = 'embedding';

-- Expected Result AFTER migration:
-- column_name | data_type     | udt_name
-- embedding   | USER-DEFINED  | vector
-- ✅ Should be 'USER-DEFINED' not 'text'

-- 2. ✅ Verify all embeddings were converted
SELECT
  COUNT(*) as total_products,
  COUNT(embedding) as products_with_embeddings,
  COUNT(embedding)::float / COUNT(*)::float * 100 as percentage_with_embeddings
FROM products;

-- Expected: Same counts as before (~20,058 total, 100% with embeddings)
-- ✅ No data should be lost

-- 3. ✅ Check vector dimensions
SELECT
  id,
  name,
  vector_dims(embedding) as dimensions
FROM products
WHERE embedding IS NOT NULL
LIMIT 5;

-- Expected: dimensions = 1536 for all rows
-- ✅ Confirms proper vector(1536) type

-- 4. ✅ Verify ivfflat index exists
SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'products'
  AND indexname = 'products_embedding_vector_idx';

-- Expected: Should show index with ivfflat and vector_cosine_ops
-- ✅ Index exists for fast similarity search

-- 5. ✅ Test match_products function with sample embedding
-- Create a dummy vector for testing (all zeros)
SELECT
  id,
  name,
  similarity
FROM match_products(
  array_fill(0, ARRAY[1536])::vector(1536),
  5
);

-- Expected: Should return 5 products with similarity scores
-- ✅ Similarity scores should be between 0.0 and 1.0 (NOT negative!)

-- 6. ✅ Test actual search with real product embedding
WITH sample_embedding AS (
  SELECT embedding
  FROM products
  WHERE embedding IS NOT NULL
    AND category = 'Fashion'
  LIMIT 1
)
SELECT
  p.id,
  p.name,
  p.category,
  1 - (p.embedding <=> s.embedding) as similarity
FROM products p, sample_embedding s
WHERE p.embedding IS NOT NULL
ORDER BY p.embedding <=> s.embedding
LIMIT 10;

-- Expected: Top result should have similarity close to 1.0 (exact match)
-- ✅ All similarity scores should be positive (0.0 to 1.0)
-- ✅ Should include Fashion products

-- 7. ✅ Performance check - ensure index is being used
EXPLAIN ANALYZE
SELECT
  id,
  name,
  1 - (embedding <=> array_fill(0, ARRAY[1536])::vector(1536)) as similarity
FROM products
WHERE embedding IS NOT NULL
ORDER BY embedding <=> array_fill(0, ARRAY[1536])::vector(1536)
LIMIT 20;

-- Expected: Should show "Index Scan using products_embedding_vector_idx"
-- ✅ NOT "Seq Scan" - confirms index is working
-- Execution time should be < 100ms

-- 8. ✅ Database size comparison
SELECT
  pg_size_pretty(pg_total_relation_size('products')) as table_size,
  pg_size_pretty(pg_database_size(current_database())) as database_size;

-- Compare with pre-migration size
-- Size may increase slightly due to vector index

-- ============================================================
-- VALIDATION CHECKLIST
-- ============================================================
-- [ ] Column type is 'USER-DEFINED' (vector)
-- [ ] All embeddings preserved (same count)
-- [ ] Vector dimensions = 1536
-- [ ] ivfflat index exists
-- [ ] match_products returns positive similarity scores
-- [ ] Sample search shows fashion products at top
-- [ ] Query plan uses index (not sequential scan)
-- [ ] Execution time < 100ms for 20-result search
-- ============================================================

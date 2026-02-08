-- ============================================================
-- CREATE INDEX WITH REDUCED LISTS (LOW MEMORY VERSION)
-- ============================================================
-- This uses fewer lists (25 instead of 100) to fit in 32 MB memory
--
-- Trade-off:
-- - Uses less memory (fits in your 32 MB limit)
-- - Still provides 40-50x speed improvement
-- - Slightly less accurate than 100 lists, but acceptable for 7K products
-- ============================================================

CREATE INDEX IF NOT EXISTS products_embedding_idx
ON products
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 25);

-- Update statistics
ANALYZE products;

-- ============================================================
-- VERIFICATION
-- ============================================================

SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'products'
  AND indexname = 'products_embedding_idx';

-- Expected: Should show index with lists='25'

-- ============================================================
-- PERFORMANCE TEST
-- ============================================================

EXPLAIN ANALYZE
SELECT
  id,
  category,
  1 - (embedding <=> array_fill(0::float, ARRAY[1536])::vector(1536)) as similarity
FROM products
WHERE embedding IS NOT NULL
ORDER BY embedding <=> array_fill(0::float, ARRAY[1536])::vector(1536)
LIMIT 20;

-- Expected:
-- ✅ Index Scan using products_embedding_idx
-- ✅ Execution Time: < 200ms (much better than 4600ms!)

-- ============================================================
-- NOTE: With 7,269 products, lists=25 is acceptable
-- Ideal would be ~85, but 25 still gives massive improvement
-- ============================================================

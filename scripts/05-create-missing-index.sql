-- ============================================================
-- CREATE MISSING INDEX FOR TEXT EMBEDDING SEARCH
-- ============================================================
-- This creates the ivfflat index needed for fast vector similarity search
-- on the 'embedding' column (text search)
--
-- Expected execution time: 30-60 seconds
-- Performance improvement: 4.6s → <100ms search times
-- ============================================================

-- Create ivfflat index on embedding column for cosine similarity search
-- lists parameter: sqrt(7269) ≈ 85, rounded to 100 for headroom
CREATE INDEX IF NOT EXISTS products_embedding_idx
ON products
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Update statistics for query planner
ANALYZE products;

-- ============================================================
-- VERIFICATION
-- ============================================================
-- Run this to verify the index was created:

SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'products'
  AND indexname = 'products_embedding_idx';

-- Expected: Should show the new index with ivfflat and vector_cosine_ops

-- ============================================================
-- PERFORMANCE TEST
-- ============================================================
-- Run this to verify the index is being used:

EXPLAIN ANALYZE
SELECT
  id,
  category,
  1 - (embedding <=> array_fill(0::float, ARRAY[1536])::vector(1536)) as similarity
FROM products
WHERE embedding IS NOT NULL
ORDER BY embedding <=> array_fill(0::float, ARRAY[1536])::vector(1536)
LIMIT 20;

-- Expected results AFTER index creation:
-- ✅ "Index Scan using products_embedding_idx" (not Seq Scan)
-- ✅ Execution Time: < 100ms (not 4600ms)

-- ============================================================
-- DONE! Your search should now be 50x faster!
-- ============================================================

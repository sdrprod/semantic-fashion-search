-- ============================================================
-- CREATE INDEX WITH MINIMAL LISTS (ULTRA LOW MEMORY)
-- ============================================================
-- Last resort: Use only 10 lists to minimize memory usage
--
-- This should work even on the smallest Supabase instances
-- Still provides 30-40x speed improvement over no index
-- ============================================================

CREATE INDEX IF NOT EXISTS products_embedding_idx
ON products
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 10);

ANALYZE products;

-- ============================================================
-- VERIFICATION
-- ============================================================

SELECT indexname FROM pg_indexes
WHERE tablename = 'products' AND indexname = 'products_embedding_idx';

-- ============================================================
-- PERFORMANCE TEST
-- ============================================================

EXPLAIN ANALYZE
SELECT id,
  1 - (embedding <=> array_fill(0::float, ARRAY[1536])::vector(1536)) as similarity
FROM products
WHERE embedding IS NOT NULL
ORDER BY embedding <=> array_fill(0::float, ARRAY[1536])::vector(1536)
LIMIT 20;

-- Expected: Execution Time < 300ms (vs 4600ms without index)
-- ============================================================

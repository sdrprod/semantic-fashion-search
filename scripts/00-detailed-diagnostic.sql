-- ============================================================
-- DETAILED DIAGNOSTIC - Check exact state of embeddings
-- ============================================================

-- 1. Check exact vector dimensions and type
SELECT
  column_name,
  data_type,
  udt_name,
  CASE
    WHEN data_type = 'USER-DEFINED' THEN
      (SELECT typname FROM pg_type WHERE oid = (
        SELECT atttypid FROM pg_attribute
        WHERE attrelid = 'products'::regclass
        AND attname = 'embedding'
      ))
    ELSE NULL
  END as vector_type_name
FROM information_schema.columns
WHERE table_name = 'products'
  AND column_name = 'embedding';

-- Expected: udt_name = 'vector', vector_type_name should show dimensions

-- 2. Get actual vector dimensions
SELECT
  'embedding' as column_name,
  vector_dims(embedding) as dimensions,
  pg_typeof(embedding) as postgres_type
FROM products
WHERE embedding IS NOT NULL
LIMIT 1;

-- Expected: dimensions = 1536, postgres_type = vector

-- 3. Check ALL indexes on products table (not just embedding)
SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'products'
ORDER BY indexname;

-- Look for any index that includes 'embedding' (not 'image_embedding')

-- 4. Check match_products function signature
SELECT
  p.parameter_name,
  p.data_type,
  p.udt_name,
  p.parameter_mode
FROM information_schema.parameters p
JOIN information_schema.routines r
  ON p.specific_name = r.specific_name
WHERE r.routine_schema = 'public'
  AND r.routine_name = 'match_products'
ORDER BY p.ordinal_position;

-- Expected: query_embedding parameter should be USER-DEFINED (vector)

-- 5. Test actual search with dummy embedding
-- This will show if similarity scores are positive or negative
WITH dummy_embedding AS (
  SELECT array_fill(0::float, ARRAY[1536])::vector(1536) as emb
)
SELECT
  id,
  category,
  source,
  1 - (embedding <=> (SELECT emb FROM dummy_embedding)) as similarity,
  CASE
    WHEN (1 - (embedding <=> (SELECT emb FROM dummy_embedding))) < 0
    THEN '❌ NEGATIVE'
    ELSE '✅ POSITIVE'
  END as score_status
FROM products
WHERE embedding IS NOT NULL
ORDER BY embedding <=> (SELECT emb FROM dummy_embedding)
LIMIT 10;

-- Expected: All similarity scores should be POSITIVE (0.0 to 1.0)

-- 6. Check query performance and if index is used
EXPLAIN ANALYZE
SELECT
  id,
  category,
  1 - (embedding <=> array_fill(0::float, ARRAY[1536])::vector(1536)) as similarity
FROM products
WHERE embedding IS NOT NULL
ORDER BY embedding <=> array_fill(0::float, ARRAY[1536])::vector(1536)
LIMIT 20;

-- Look for:
-- ✅ "Index Scan" or "Index Only Scan" = GOOD (using index)
-- ❌ "Seq Scan" = BAD (no index, slow performance)
-- Execution time should be < 100ms

-- ============================================================
-- INTERPRETATION GUIDE
-- ============================================================
-- Query 1: Should show vector type
-- Query 2: Should show dimensions = 1536
-- Query 3: Should list an index on 'embedding' column (text search)
-- Query 4: Should show query_embedding is vector type
-- Query 5: Should show POSITIVE similarity scores
-- Query 6: Should use Index Scan (not Seq Scan)
-- ============================================================

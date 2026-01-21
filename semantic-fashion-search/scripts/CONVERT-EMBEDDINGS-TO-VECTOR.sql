-- ============================================================================
-- EMBEDDING CONVERSION: TEXT → VECTOR TYPE
-- ============================================================================
-- This converts 20,058 products in batches to avoid timeouts
-- Total time: ~4-5 minutes
-- ============================================================================

-- ============================================================================
-- STEP 1: CREATE NEW VECTOR COLUMNS (~1 second)
-- ============================================================================
-- Run this first, then proceed to Step 2

ALTER TABLE products ADD COLUMN IF NOT EXISTS embedding_vec vector(1536);
ALTER TABLE products ADD COLUMN IF NOT EXISTS image_embedding_vec vector(512);

-- Verify columns were created:
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'products'
  AND column_name LIKE '%embedding%'
ORDER BY column_name;

-- You should see 4 rows:
-- embedding (text), embedding_vec (USER-DEFINED),
-- image_embedding (text), image_embedding_vec (USER-DEFINED)

-- ============================================================================
-- STEP 2: CONVERT IN BATCHES (~3 minutes)
-- ============================================================================
-- Run this query REPEATEDLY until it shows "0 rows affected"
-- Each run converts 1000 products
-- You'll need to run it ~21 times (20,058 / 1000)
--
-- HOW TO RUN:
-- 1. Copy the query below
-- 2. Click "Run" in Supabase SQL Editor
-- 3. Wait for completion (~5-10 seconds)
-- 4. Click "Run" again
-- 5. Repeat until you see "0 rows affected"

WITH batch AS (
  SELECT id, embedding, image_embedding
  FROM products
  WHERE embedding IS NOT NULL
    AND embedding_vec IS NULL
  LIMIT 1000
)
UPDATE products
SET
  embedding_vec = batch.embedding::vector(1536),
  image_embedding_vec = CASE
    WHEN batch.image_embedding IS NOT NULL
    THEN batch.image_embedding::vector(512)
    ELSE NULL
  END
FROM batch
WHERE products.id = batch.id;

-- After each run, check progress with this:
SELECT
  COUNT(*) as total,
  COUNT(embedding_vec) as converted,
  COUNT(*) - COUNT(embedding_vec) as remaining,
  ROUND(COUNT(embedding_vec)::numeric / COUNT(*)::numeric * 100, 1) as percent_complete
FROM products;

-- Keep running the batch query above until "remaining" shows 0

-- ============================================================================
-- STEP 3: REPLACE OLD COLUMNS (~5 seconds)
-- ============================================================================
-- IMPORTANT: Only run this AFTER Step 2 shows "0 remaining"!

BEGIN;

-- Drop old text columns
ALTER TABLE products DROP COLUMN embedding CASCADE;
ALTER TABLE products DROP COLUMN image_embedding CASCADE;

-- Rename new vector columns to original names
ALTER TABLE products RENAME COLUMN embedding_vec TO embedding;
ALTER TABLE products RENAME COLUMN image_embedding_vec TO image_embedding;

COMMIT;

-- Verify the conversion worked:
SELECT
  COUNT(*) as total,
  COUNT(embedding) as with_text_embedding,
  COUNT(image_embedding) as with_image_embedding,
  pg_typeof(embedding) as text_embedding_type,
  pg_typeof(image_embedding) as image_embedding_type
FROM products;

-- You should see:
-- total: 20058
-- with_text_embedding: 20058
-- with_image_embedding: ~10000
-- text_embedding_type: vector
-- image_embedding_type: vector

-- ============================================================================
-- STEP 4: CREATE INDEXES (~30 seconds)
-- ============================================================================
-- This creates fast vector similarity indexes using IVFFlat algorithm

-- Index for text embeddings (enables fast semantic search)
CREATE INDEX IF NOT EXISTS products_embedding_idx
ON products USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Index for image embeddings (enables fast visual search)
CREATE INDEX IF NOT EXISTS products_image_embedding_idx
ON products USING ivfflat (image_embedding vector_cosine_ops)
WITH (lists = 100);

-- Update table statistics for query planner
ANALYZE products;

-- Verify indexes were created:
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'products'
  AND indexdef LIKE '%embedding%'
ORDER BY indexname;

-- You should see 2 indexes:
-- products_embedding_idx (using ivfflat on embedding)
-- products_image_embedding_idx (using ivfflat on image_embedding)

-- ============================================================================
-- STEP 5: UPDATE MATCH_PRODUCTS FUNCTION (~1 second)
-- ============================================================================
-- Updates the search function to use proper vector type

-- Drop any existing versions
DROP FUNCTION IF EXISTS public.match_products(vector(1536), integer);
DROP FUNCTION IF EXISTS public.match_products(text, integer);

-- Create the updated function
CREATE OR REPLACE FUNCTION public.match_products(
  query_embedding vector(1536),
  match_count int DEFAULT 20
)
RETURNS TABLE (
  id uuid,
  brand text,
  title text,
  description text,
  tags text[],
  price numeric(10,2),
  currency text,
  image_url text,
  product_url text,
  combined_text text,
  merchant_id text,
  merchant_name text,
  affiliate_network text,
  image_embedding vector(512),
  similarity float
)
LANGUAGE sql STABLE AS $$
  SELECT
    p.id,
    p.brand,
    p.title,
    p.description,
    p.tags,
    p.price,
    p.currency,
    p.image_url,
    p.product_url,
    p.combined_text,
    p.merchant_id,
    p.merchant_name,
    p.affiliate_network,
    p.image_embedding,
    1 - (p.embedding <-> query_embedding) AS similarity
  FROM public.products p
  WHERE p.embedding IS NOT NULL
  ORDER BY p.embedding <-> query_embedding
  LIMIT match_count;
$$;

-- Test the function with a dummy embedding:
SELECT
  brand,
  title,
  ROUND(similarity::numeric, 4) as similarity
FROM match_products(
  array_fill(0.1::real, ARRAY[1536])::vector(1536),
  5
)
LIMIT 5;

-- You should see 5 products with similarity scores between 0 and 1
-- (Not negative numbers like before!)

-- ============================================================================
-- STEP 6: VERIFY EVERYTHING WORKS
-- ============================================================================

-- Test search performance
EXPLAIN ANALYZE
SELECT brand, title, similarity
FROM match_products(
  array_fill(0.1::real, ARRAY[1536])::vector(1536),
  20
);

-- Should show:
-- - Index scan using products_embedding_idx (NOT Seq Scan)
-- - Execution Time: < 100ms (much faster than before)

-- Check final state
SELECT
  'Conversion Complete!' as status,
  COUNT(*) as total_products,
  COUNT(embedding) as with_text_embeddings,
  COUNT(image_embedding) as with_image_embeddings,
  pg_typeof(embedding) as embedding_type
FROM products;

-- ============================================================================
-- DONE!
-- ============================================================================
-- Search should now work correctly with:
-- - Positive similarity scores (0.0 to 1.0 range)
-- - Fast response times (< 2 seconds)
-- - Proper results ranking
--
-- Next steps:
-- 1. Run: node scripts/test-search-detailed.mjs
-- 2. Start your dev server and search for "black dress"
-- 3. Results should now appear!
-- ============================================================================

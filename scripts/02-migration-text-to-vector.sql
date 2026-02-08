-- ============================================================
-- MIGRATION: Convert embedding column from TEXT to vector(1536)
-- ============================================================
-- IMPORTANT: Run this in Supabase SQL Editor
-- ESTIMATED TIME: 1-2 minutes for 20K products
-- ============================================================

-- Enable pgvector extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================
-- STEP 1: Create new vector column
-- ============================================================
-- This adds a new column of type vector(1536) alongside the existing TEXT column
ALTER TABLE products
ADD COLUMN embedding_vector vector(1536);

-- Verify column was created (optional check)
-- SELECT column_name, data_type FROM information_schema.columns
-- WHERE table_name = 'products' AND column_name = 'embedding_vector';

-- ============================================================
-- STEP 2: Convert TEXT embeddings to vector type
-- ============================================================
-- This converts "[0.026,0.15,...]" strings to actual vector(1536) values
-- The ::vector cast does the conversion automatically

UPDATE products
SET embedding_vector = embedding::vector
WHERE embedding IS NOT NULL;

-- Verify conversion (optional check)
-- SELECT COUNT(*) FROM products WHERE embedding_vector IS NOT NULL;
-- Should match the count of products with embeddings (~20,058)

-- ============================================================
-- STEP 3: Create ivfflat index for fast similarity search
-- ============================================================
-- This is CRITICAL for performance with 20K+ products
-- Using ivfflat with cosine distance for vector similarity search
-- Lists parameter: sqrt(total_rows) ≈ sqrt(20000) ≈ 141, rounded to 100

CREATE INDEX products_embedding_vector_idx
ON products
USING ivfflat (embedding_vector vector_cosine_ops)
WITH (lists = 100);

-- ============================================================
-- STEP 4: Drop old TEXT column
-- ============================================================
-- Remove the old text-based embedding column
-- ⚠️ POINT OF NO RETURN - after this, you can't easily roll back
-- Make sure Step 2 completed successfully before running this!

ALTER TABLE products
DROP COLUMN embedding;

-- ============================================================
-- STEP 5: Rename new column to 'embedding'
-- ============================================================
-- This makes the new vector column use the original name

ALTER TABLE products
RENAME COLUMN embedding_vector TO embedding;

-- ============================================================
-- STEP 6: Update statistics for query planner
-- ============================================================
-- This helps PostgreSQL optimize queries using the new index

ANALYZE products;

-- ============================================================
-- STEP 7: Update match_products function to use vector type
-- ============================================================
-- Update the function signature to explicitly use vector(1536)

CREATE OR REPLACE FUNCTION public.match_products(
  query_embedding vector(1536),
  match_count int DEFAULT 20
)
RETURNS TABLE (
  id bigint,
  name text,
  price numeric,
  image_url text,
  product_url text,
  category text,
  subcategory text,
  source text,
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    p.id,
    p.name,
    p.price,
    p.image_url,
    p.product_url,
    p.category,
    p.subcategory,
    p.source,
    1 - (p.embedding <=> query_embedding) AS similarity
  FROM public.products p
  WHERE p.embedding IS NOT NULL
  ORDER BY p.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- ============================================================
-- MIGRATION COMPLETE!
-- ============================================================
-- Next steps:
-- 1. Run the post-migration validation script (03-post-migration-check.sql)
-- 2. Test search functionality
-- 3. Monitor query performance
-- ============================================================

-- Fix embedding column type from text to vector(1536)
-- This will enable proper similarity search with positive scores
-- Run this in Supabase SQL Editor

-- IMPORTANT: This operation will take a few minutes on 20,000+ products
-- The database will remain accessible during this operation

BEGIN;

-- Step 1: Add new vector column
ALTER TABLE products
ADD COLUMN IF NOT EXISTS embedding_temp vector(1536);

-- Step 2: Convert text embeddings to vector type
-- This may take 1-2 minutes for 20K products
UPDATE products
SET embedding_temp = embedding::vector
WHERE embedding IS NOT NULL;

-- Step 3: Drop old text column and rename new one
ALTER TABLE products DROP COLUMN IF EXISTS embedding;
ALTER TABLE products RENAME COLUMN embedding_temp TO embedding;

-- Step 4: Create vector index for fast similarity search
-- Using ivfflat index with cosine distance
-- lists = 100 is good for ~20K products (sqrt of row count)
CREATE INDEX IF NOT EXISTS products_embedding_idx
ON products
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Step 5: Do the same for image_embedding if it exists
-- Check if image_embedding exists and is text type
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products'
      AND column_name = 'image_embedding'
  ) THEN
    -- Add temp column
    ALTER TABLE products ADD COLUMN IF NOT EXISTS image_embedding_temp vector(512);

    -- Convert (this will be fast if most are null)
    UPDATE products
    SET image_embedding_temp = image_embedding::vector
    WHERE image_embedding IS NOT NULL;

    -- Replace old column
    ALTER TABLE products DROP COLUMN IF EXISTS image_embedding;
    ALTER TABLE products RENAME COLUMN image_embedding_temp TO image_embedding;

    -- Create index
    CREATE INDEX IF NOT EXISTS products_image_embedding_idx
    ON products
    USING ivfflat (image_embedding vector_cosine_ops)
    WITH (lists = 100);

    RAISE NOTICE 'Image embedding column converted successfully';
  END IF;
END $$;

-- Step 6: Update match_products function to ensure it uses vector type
DROP FUNCTION IF EXISTS public.match_products(vector(1536), integer);
DROP FUNCTION IF EXISTS public.match_products(text, integer);

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

-- Step 7: Analyze table for query planner
ANALYZE products;

COMMIT;

-- Verification query
SELECT
  'Conversion complete!' as status,
  COUNT(*) as total_products,
  COUNT(embedding) as products_with_embeddings,
  pg_typeof(embedding) as embedding_type
FROM products
GROUP BY pg_typeof(embedding);

-- Test the function with a dummy embedding
SELECT
  'Function test: ' || COUNT(*)::text || ' products returned' as test_result
FROM match_products(
  array_fill(0.1::real, ARRAY[1536])::vector(1536),
  10
);

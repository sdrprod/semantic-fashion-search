-- Check and fix the vector index to use cosine distance ops
-- This makes queries faster by using the correct distance metric

-- 1. Check current indexes
SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'products'
  AND indexname LIKE '%embedding%';

-- 2. Drop old index if it exists
DROP INDEX IF EXISTS public.products_embedding_idx;

-- 3. Create new index with cosine distance ops
CREATE INDEX products_embedding_idx
ON public.products
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- 4. For image embeddings too
DROP INDEX IF EXISTS public.products_image_embedding_idx;

CREATE INDEX products_image_embedding_idx
ON public.products
USING ivfflat (image_embedding vector_cosine_ops)
WITH (lists = 100);

-- 5. Verify indexes were created
SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'products'
  AND indexname LIKE '%embedding%';

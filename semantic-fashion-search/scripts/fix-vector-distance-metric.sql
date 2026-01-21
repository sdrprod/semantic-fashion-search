-- Fix vector distance metric from L2 to Cosine for OpenAI embeddings
-- OpenAI embeddings are normalized, so cosine similarity is the correct metric
-- Run this in Supabase SQL editor

-- 1. Drop the old L2 index (we'll skip creating a new one for now)
-- For 566 products, sequential scan is fast enough without an index
DROP INDEX IF EXISTS products_embedding_idx;

-- 2. Update match_products function to use cosine distance
DROP FUNCTION IF EXISTS public.match_products(vector, integer);

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
    1 - (p.embedding <=> query_embedding) AS similarity
  FROM public.products p
  WHERE p.embedding IS NOT NULL
  ORDER BY p.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- Verify the change
SELECT 'Index and function updated to use cosine distance for OpenAI embeddings' as status;

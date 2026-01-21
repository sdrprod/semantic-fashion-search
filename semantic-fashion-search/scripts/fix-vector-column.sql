-- ============================================
-- Fix Vector Column Type
-- ============================================
-- Run this in Supabase SQL Editor to fix the vector column

-- 1. Check if vector extension is enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Drop existing products table (WARNING: This will delete all data)
DROP TABLE IF EXISTS public.products CASCADE;

-- 3. Recreate products table with correct vector type
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  tags text[],
  price numeric(10,2),
  currency text NOT NULL DEFAULT 'USD',
  image_url text NOT NULL,
  product_url text NOT NULL,
  combined_text text NOT NULL,
  embedding vector(1536),  -- This MUST be vector(1536), not text!
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 4. Create vector index
CREATE INDEX products_embedding_idx
ON public.products
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- 5. Recreate match_products function
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
    1 - (p.embedding <=> query_embedding) AS similarity
  FROM public.products p
  WHERE p.embedding IS NOT NULL
  ORDER BY p.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- 6. Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- 7. Create policies
CREATE POLICY "Allow public read access" ON public.products
  FOR SELECT
  USING (true);

CREATE POLICY "Allow service role full access" ON public.products
  FOR ALL
  USING (auth.role() = 'service_role');

-- 8. Verify the column type
SELECT
  column_name,
  data_type,
  udt_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'products'
  AND column_name = 'embedding';

-- Expected output: udt_name should be 'vector'

-- ============================================
-- Semantic Fashion Search - Supabase Schema
-- ============================================
-- Run this SQL in your Supabase SQL editor to set up the database

-- 1. Enable required extensions
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Create products table
CREATE TABLE IF NOT EXISTS public.products (
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
  embedding vector(1536),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Create vector index for similarity search
CREATE INDEX IF NOT EXISTS products_embedding_idx
ON public.products
USING ivfflat (embedding vector_l2_ops)
WITH (lists = 100);

-- 4. Create RPC function for semantic similarity search
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
    1 - (p.embedding <-> query_embedding) AS similarity
  FROM public.products p
  WHERE p.embedding IS NOT NULL
  ORDER BY p.embedding <-> query_embedding
  LIMIT match_count;
$$;

-- 5. Enable Row Level Security (optional, but recommended)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- 6. Create policy to allow read access (adjust as needed)
CREATE POLICY "Allow public read access" ON public.products
  FOR SELECT
  USING (true);

-- 7. Create policy to allow service role full access
CREATE POLICY "Allow service role full access" ON public.products
  FOR ALL
  USING (auth.role() = 'service_role');
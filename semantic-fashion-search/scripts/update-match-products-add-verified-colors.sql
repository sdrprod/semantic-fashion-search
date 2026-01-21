-- Update match_products function to include verified_colors and on_sale
-- Run this in Supabase SQL editor after adding the verified_colors column

-- First, drop the existing function
DROP FUNCTION IF EXISTS public.match_products(vector, integer);

-- Then create the updated version
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
  verified_colors jsonb,
  on_sale boolean,
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
    p.verified_colors,
    p.on_sale,
    1 - (p.embedding <-> query_embedding) AS similarity
  FROM public.products p
  WHERE p.embedding IS NOT NULL
  ORDER BY p.embedding <-> query_embedding
  LIMIT match_count;
$$;

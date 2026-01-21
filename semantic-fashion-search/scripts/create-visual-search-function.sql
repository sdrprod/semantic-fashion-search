-- Create function to match products by image embedding
-- This searches the image_embedding column instead of the text embedding column
-- Run this in Supabase SQL Editor

CREATE OR REPLACE FUNCTION public.match_products_by_image(
  query_embedding vector(512),
  match_count int DEFAULT 24,
  similarity_threshold float DEFAULT 0.5
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
    p.merchant_id,
    p.merchant_name,
    p.affiliate_network,
    1 - (p.image_embedding <-> query_embedding) AS similarity
  FROM public.products p
  WHERE p.image_embedding IS NOT NULL
    AND 1 - (p.image_embedding <-> query_embedding) >= similarity_threshold
  ORDER BY p.image_embedding <-> query_embedding
  LIMIT match_count;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.match_products_by_image(vector, int, float) TO anon;
GRANT EXECUTE ON FUNCTION public.match_products_by_image(vector, int, float) TO authenticated;
GRANT EXECUTE ON FUNCTION public.match_products_by_image(vector, int, float) TO service_role;

-- Create index if not exists (should already exist from previous migration)
CREATE INDEX IF NOT EXISTS products_image_embedding_idx
  ON public.products USING ivfflat (image_embedding vector_cosine_ops)
  WITH (lists = 100);

-- Verify function works
SELECT COUNT(*) as products_with_image_embeddings
FROM products
WHERE image_embedding IS NOT NULL;

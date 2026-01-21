-- Fix match_products to accept float array instead of text
-- This allows proper conversion to vector type

DROP FUNCTION IF EXISTS public.match_products(text, integer);
DROP FUNCTION IF EXISTS public.match_products(vector, integer);
DROP FUNCTION IF EXISTS public.match_products(vector(1536), integer);

-- Create function that accepts float array
CREATE OR REPLACE FUNCTION public.match_products(
  query_embedding float[],
  match_count integer DEFAULT 20
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
LANGUAGE sql STABLE AS $function$
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
    1 - (p.embedding <=> query_embedding::vector(1536)) AS similarity
  FROM public.products p
  WHERE p.embedding IS NOT NULL
  ORDER BY p.embedding <=> query_embedding::vector(1536)
  LIMIT match_count;
$function$;

-- Test with a dummy float array
SELECT brand, title, similarity
FROM match_products(
  array_fill(0.1, ARRAY[1536]),
  5
)
LIMIT 5;

-- Verify function signature
SELECT
  routine_name,
  routine_type,
  data_type,
  type_udt_name
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'match_products';

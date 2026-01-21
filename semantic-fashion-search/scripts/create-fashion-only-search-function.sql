-- Create a fashion-only search function that excludes DHGate products

CREATE OR REPLACE FUNCTION public.match_products_fashion_only(
  query_embedding vector,
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
    1 - (p.embedding <=> query_embedding) AS similarity
  FROM public.products p
  WHERE p.embedding IS NOT NULL
    AND p.brand NOT ILIKE '%dhgate%'
    AND p.title NOT ILIKE '%dhgate%'
  ORDER BY p.embedding <=> query_embedding
  LIMIT match_count;
$function$;

-- Test it
SELECT brand, title, ROUND(similarity::numeric, 4) as similarity
FROM match_products_fashion_only(
  array_fill(0.1::real, ARRAY[1536])::vector(1536),
  10
)
LIMIT 10;

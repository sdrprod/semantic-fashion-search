-- Fix match_products to use COSINE distance instead of L2 distance
-- OpenAI embeddings are normalized, so cosine distance is correct
-- L2 distance (<->) was giving negative similarity scores

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
    1 - (p.embedding <=> query_embedding) AS similarity
  FROM public.products p
  WHERE p.embedding IS NOT NULL
  ORDER BY p.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- Test the fix with a sample query
SELECT
  title,
  price,
  similarity,
  CASE
    WHEN similarity >= 0.5 THEN 'Excellent match'
    WHEN similarity >= 0.3 THEN 'Good match'
    WHEN similarity >= 0.0 THEN 'Poor match'
    ELSE 'Negative (ERROR)'
  END as quality
FROM match_products(
  (SELECT embedding FROM products LIMIT 1),
  10
);

-- Show stats on similarity scores
SELECT
  COUNT(*) as total_results,
  COUNT(*) FILTER (WHERE similarity >= 0.5) as excellent_matches,
  COUNT(*) FILTER (WHERE similarity >= 0.3) as good_matches,
  COUNT(*) FILTER (WHERE similarity >= 0.0) as positive_scores,
  COUNT(*) FILTER (WHERE similarity < 0.0) as negative_scores,
  MIN(similarity) as min_similarity,
  MAX(similarity) as max_similarity,
  AVG(similarity) as avg_similarity
FROM match_products(
  (SELECT embedding FROM products WHERE title ILIKE '%dress%' LIMIT 1),
  100
);

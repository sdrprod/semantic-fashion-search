-- ============================================
-- Update match_products RPC to support gender filtering
-- Run in Supabase SQL Editor AFTER classify-product-gender.mjs has finished
-- ============================================

-- Drop and recreate the function with an optional gender filter parameter.
-- Default behavior: exclude explicitly men's products (target_gender = 'men').
-- Passing filter_gender = 'all' disables gender filtering entirely.

CREATE OR REPLACE FUNCTION match_products(
  query_embedding vector(1536),
  match_count     int             DEFAULT 10,
  filter_gender   text            DEFAULT 'exclude_men'  -- 'exclude_men' | 'women' | 'unisex' | 'all'
)
RETURNS TABLE (
  id              text,
  title           text,
  description     text,
  brand           text,
  price           float8,
  currency        text,
  image_url       text,
  product_url     text,
  category        text,
  tags            text[],
  merchant_name   text,
  affiliate_network text,
  on_sale         boolean,
  verified_colors text[],
  image_embedding vector,
  target_gender   text,
  similarity      float8
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.title,
    p.description,
    p.brand,
    p.price,
    p.currency,
    p.image_url,
    p.product_url,
    p.category,
    p.tags,
    p.merchant_name,
    p.affiliate_network,
    p.on_sale,
    p.verified_colors,
    p.image_embedding,
    p.target_gender,
    1 - (p.embedding <=> query_embedding) AS similarity
  FROM products p
  WHERE
    -- Gender filter
    CASE filter_gender
      WHEN 'exclude_men' THEN (p.target_gender IS NULL OR p.target_gender != 'men')
      WHEN 'women'       THEN (p.target_gender = 'women' OR p.target_gender IS NULL)
      WHEN 'unisex'      THEN (p.target_gender = 'unisex')
      WHEN 'all'         THEN TRUE
      ELSE                    (p.target_gender IS NULL OR p.target_gender != 'men')
    END
  ORDER BY p.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION match_products(vector, int, text) TO authenticated;
GRANT EXECUTE ON FUNCTION match_products(vector, int, text) TO anon;
GRANT EXECUTE ON FUNCTION match_products(vector, int, text) TO service_role;

-- ============================================
-- Verification
-- ============================================

-- Check column exists and distribution
SELECT
  target_gender,
  COUNT(*) AS count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 1) AS pct
FROM products
GROUP BY target_gender
ORDER BY count DESC;

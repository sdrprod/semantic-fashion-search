-- ============================================================
-- FIX: match_products function to include ALL needed columns
-- ============================================================
-- Problem E: Function doesn't return verified_colors or on_sale
--
-- This fixes the function to return ALL columns that the
-- application code expects to use.
-- ============================================================

-- Drop existing function (handles any signature variations)
DROP FUNCTION IF EXISTS public.match_products(vector, integer);
DROP FUNCTION IF EXISTS public.match_products(vector(1536), integer);

-- Create the complete function with all columns
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
  verified_colors jsonb,        -- ✅ ADDED (Problem E fix)
  on_sale boolean,              -- ✅ ADDED (Problem E fix)
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
    p.verified_colors,          -- ✅ ADDED
    p.on_sale,                  -- ✅ ADDED
    1 - (p.embedding <=> query_embedding) AS similarity
  FROM public.products p
  WHERE p.embedding IS NOT NULL
  ORDER BY p.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- ============================================================
-- VERIFICATION
-- ============================================================

-- Test the function to see all returned columns
SELECT *
FROM match_products(
  array_fill(0, ARRAY[1536])::vector(1536),
  5
);

-- Check the function signature
SELECT
  routine_name,
  data_type,
  parameter_name,
  parameter_mode,
  ordinal_position
FROM information_schema.parameters
WHERE specific_schema = 'public'
  AND specific_name LIKE '%match_products%'
ORDER BY ordinal_position;

-- ============================================================
-- Expected results:
-- 1. First query should return 5 products with ALL columns
--    including verified_colors and on_sale
-- 2. Second query should show parameters including:
--    - query_embedding (IN)
--    - match_count (IN)
--    - verified_colors (OUT)
--    - on_sale (OUT)
-- ============================================================

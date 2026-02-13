-- ============================================================
-- FIX: Resolve match_products function overload ambiguity
-- ============================================================
-- Problem: Two versions of match_products exist simultaneously:
--   1. 2-param: match_products(vector, integer)          -- returns id as uuid
--   2. 3-param: match_products(vector, integer, text)    -- returns id as TEXT (bug!)
--
-- When both exist, PostgreSQL cannot resolve calls:
--   "Could not choose the best candidate function between..."
--
-- Additional: The 3-param version returns id as TEXT, causing:
--   "Returned type uuid does not match expected type text in column 1"
--
-- Fix: Drop ALL existing versions, create ONE correct function.
-- ============================================================

-- Step 1: Drop ALL existing match_products function variants
DROP FUNCTION IF EXISTS public.match_products(vector, integer);
DROP FUNCTION IF EXISTS public.match_products(vector(1536), integer);
DROP FUNCTION IF EXISTS public.match_products(vector, integer, text);
DROP FUNCTION IF EXISTS public.match_products(vector(1536), integer, text);

-- Step 2: Create ONE definitive function with gender filtering
CREATE OR REPLACE FUNCTION public.match_products(
  query_embedding vector(1536),
  match_count     int  DEFAULT 20,
  filter_gender   text DEFAULT 'exclude_men'  -- 'exclude_men' | 'women' | 'unisex' | 'all'
)
RETURNS TABLE (
  id              uuid,
  brand           text,
  title           text,
  description     text,
  tags            text[],
  price           numeric(10,2),
  currency        text,
  image_url       text,
  product_url     text,
  combined_text   text,
  merchant_id     text,
  merchant_name   text,
  affiliate_network text,
  image_embedding vector(512),
  verified_colors jsonb,
  on_sale         boolean,
  target_gender   text,
  similarity      float
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
    p.target_gender,
    1 - (p.embedding <=> query_embedding) AS similarity
  FROM public.products p
  WHERE
    p.embedding IS NOT NULL
    AND CASE filter_gender
      WHEN 'exclude_men' THEN (p.target_gender IS NULL OR p.target_gender != 'men')
      WHEN 'women'       THEN (p.target_gender = 'women' OR p.target_gender IS NULL)
      WHEN 'unisex'      THEN (p.target_gender = 'unisex')
      WHEN 'all'         THEN TRUE
      ELSE                    (p.target_gender IS NULL OR p.target_gender != 'men')
    END
  ORDER BY p.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- Step 3: Grant execute permissions
GRANT EXECUTE ON FUNCTION public.match_products(vector(1536), integer, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.match_products(vector(1536), integer, text) TO anon;
GRANT EXECUTE ON FUNCTION public.match_products(vector(1536), integer, text) TO service_role;

-- ============================================================
-- VERIFICATION
-- ============================================================

-- 1. Confirm only ONE function signature exists
SELECT
  p.proname AS function_name,
  pg_get_function_arguments(p.oid) AS arguments,
  pg_get_function_result(p.oid) AS returns
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname = 'match_products';

-- Expected: exactly ONE row with 3 parameters

-- 2. Test the function returns results
SELECT id, title, similarity
FROM public.match_products(
  array_fill(0, ARRAY[1536])::vector(1536),
  3,
  'exclude_men'
);

-- Expected: 3 rows with uuid IDs and similarity scores near 0.0
-- (zero vector won't match anything well, but should not error)

-- Clear all embeddings so they can be regenerated with proper vector format
-- Run this in Supabase SQL editor

UPDATE public.products
SET embedding = NULL
WHERE embedding IS NOT NULL;

-- Check result
SELECT
  COUNT(*) as total_products,
  COUNT(embedding) as products_with_embeddings,
  COUNT(*) - COUNT(embedding) as products_without_embeddings
FROM public.products;

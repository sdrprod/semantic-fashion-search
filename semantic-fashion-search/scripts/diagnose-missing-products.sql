-- Diagnose why only 889 products are being returned instead of 6,100+

-- 1. Check total counts
SELECT
  COUNT(*) as total_products,
  COUNT(embedding) FILTER (WHERE embedding IS NOT NULL) as with_text_embedding,
  COUNT(image_embedding) FILTER (WHERE image_embedding IS NOT NULL) as with_image_embedding,
  COUNT(verified_colors) FILTER (WHERE verified_colors IS NOT NULL) as with_verified_colors,
  COUNT(*) FILTER (WHERE embedding IS NULL) as missing_text_embedding,
  COUNT(*) FILTER (WHERE image_embedding IS NULL) as missing_image_embedding
FROM products;

-- 2. Check if embeddings are all zeros or invalid
SELECT
  COUNT(*) as products_with_embedding,
  COUNT(*) FILTER (WHERE array_length(embedding::float[], 1) = 1536) as correct_dimension,
  COUNT(*) FILTER (WHERE array_length(embedding::float[], 1) != 1536) as wrong_dimension
FROM products
WHERE embedding IS NOT NULL;

-- 3. Sample products with and without embeddings
SELECT
  'WITH EMBEDDING' as status,
  COUNT(*) as count,
  MIN(created_at) as oldest,
  MAX(created_at) as newest
FROM products
WHERE embedding IS NOT NULL

UNION ALL

SELECT
  'WITHOUT EMBEDDING' as status,
  COUNT(*) as count,
  MIN(created_at) as oldest,
  MAX(created_at) as newest
FROM products
WHERE embedding IS NULL;

-- 4. Check if there's a pattern in missing embeddings
SELECT
  merchant_name,
  COUNT(*) as total,
  COUNT(embedding) FILTER (WHERE embedding IS NOT NULL) as with_embedding,
  COUNT(*) - COUNT(embedding) as missing_embedding
FROM products
GROUP BY merchant_name
ORDER BY missing_embedding DESC
LIMIT 10;

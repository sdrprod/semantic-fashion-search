-- Check how many products have embeddings vs. verified colors
SELECT
  COUNT(*) as total_products,
  COUNT(embedding) as products_with_embeddings,
  COUNT(verified_colors) as products_with_colors,
  COUNT(*) - COUNT(embedding) as missing_embeddings,
  ROUND(100.0 * COUNT(embedding) / COUNT(*), 2) as embedding_coverage_percent
FROM products;

-- Sample products missing embeddings
SELECT
  id,
  title,
  price,
  merchant_name,
  verified_colors IS NOT NULL as has_colors,
  embedding IS NOT NULL as has_embedding
FROM products
WHERE embedding IS NULL
LIMIT 10;

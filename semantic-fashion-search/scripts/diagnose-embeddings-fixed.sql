-- Fixed diagnostic query - check embedding coverage
SELECT
  COUNT(*) as total_products,
  COUNT(*) FILTER (WHERE embedding IS NOT NULL) as with_text_embedding,
  COUNT(*) FILTER (WHERE image_embedding IS NOT NULL) as with_image_embedding,
  COUNT(*) FILTER (WHERE verified_colors IS NOT NULL) as with_verified_colors,
  COUNT(*) FILTER (WHERE embedding IS NULL) as missing_text_embedding,
  COUNT(*) FILTER (WHERE image_embedding IS NULL) as missing_image_embedding,
  COUNT(*) FILTER (WHERE embedding_vec IS NOT NULL) as with_embedding_vec,
  COUNT(*) FILTER (WHERE image_embedding_vec IS NOT NULL) as with_image_embedding_vec
FROM products;

-- Check if embeddings are in 'embedding' or 'embedding_vec' column
SELECT
  'Column Usage' as info,
  COUNT(*) FILTER (WHERE embedding IS NOT NULL AND embedding_vec IS NULL) as only_embedding,
  COUNT(*) FILTER (WHERE embedding IS NULL AND embedding_vec IS NOT NULL) as only_embedding_vec,
  COUNT(*) FILTER (WHERE embedding IS NOT NULL AND embedding_vec IS NOT NULL) as both_columns,
  COUNT(*) FILTER (WHERE embedding IS NULL AND embedding_vec IS NULL) as neither_column
FROM products;

-- Sample some products to see what's populated
SELECT
  title,
  price,
  embedding IS NOT NULL as has_embedding,
  embedding_vec IS NOT NULL as has_embedding_vec,
  image_embedding IS NOT NULL as has_image_embedding,
  verified_colors IS NOT NULL as has_verified_colors
FROM products
LIMIT 20;

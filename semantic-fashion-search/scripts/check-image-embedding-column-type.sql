-- Check the actual PostgreSQL type of image_embedding column

-- Method 1: Check column definition
SELECT
  column_name,
  data_type,
  udt_name,
  character_maximum_length
FROM information_schema.columns
WHERE table_name = 'products'
  AND column_name LIKE '%embedding%'
ORDER BY column_name;

-- Method 2: Check actual data type of a sample row
SELECT
  id,
  brand,
  pg_typeof(embedding) as text_embedding_type,
  pg_typeof(image_embedding) as image_embedding_type
FROM products
WHERE image_embedding IS NOT NULL
LIMIT 3;

-- Method 3: Count image embeddings
SELECT
  COUNT(*) as total_products,
  COUNT(image_embedding) as with_image_embedding,
  COUNT(*) - COUNT(image_embedding) as without_image_embedding,
  ROUND(COUNT(image_embedding)::numeric / COUNT(*)::numeric * 100, 1) as percent_complete
FROM products;

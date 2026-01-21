SELECT 
  COUNT(*) as total,
  COUNT(text_embedding) as with_embeddings,
  COUNT(*) - COUNT(text_embedding) as without_embeddings
FROM products;

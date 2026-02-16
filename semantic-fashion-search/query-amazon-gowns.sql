-- Find 4 Amazon products: black formal gowns/evening dresses over $200
SELECT 
  id,
  brand,
  title,
  description,
  price,
  image_url,
  product_url,
  verified_colors
FROM public.products
WHERE 
  price > 200
  AND verified_colors @> '"black"'::jsonb
  AND (
    title ILIKE '%gown%'
    OR title ILIKE '%formal%'
    OR title ILIKE '%evening%'
    OR description ILIKE '%gown%'
    OR description ILIKE '%formal%'
    OR description ILIKE '%evening%'
  )
  AND product_url LIKE '%amazon%'
ORDER BY price DESC
LIMIT 4;

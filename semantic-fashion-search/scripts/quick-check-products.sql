-- Quick check: Do we have products that should match "blue jeans"?

SELECT
  COUNT(*) as total_products,
  COUNT(*) FILTER (WHERE price >= 5) as products_above_5,
  COUNT(*) FILTER (WHERE price >= 20) as products_above_20,
  COUNT(*) FILTER (WHERE title ILIKE '%jeans%' OR title ILIKE '%denim%') as jeans_products,
  COUNT(*) FILTER (WHERE (title ILIKE '%jeans%' OR title ILIKE '%denim%') AND price >= 5) as jeans_above_5,
  COUNT(*) FILTER (WHERE verified_colors IS NOT NULL) as with_verified_colors
FROM products;

-- Show a few sample jean products
SELECT
  title,
  price,
  verified_colors,
  merchant_name,
  CASE
    WHEN title ILIKE '%men%' AND title NOT ILIKE '%women%' THEN 'Mens only'
    WHEN title ILIKE '%women%' THEN 'Includes womens'
    ELSE 'Neither'
  END as gender_indicator
FROM products
WHERE title ILIKE '%jeans%' OR title ILIKE '%denim%'
ORDER BY price DESC NULLS LAST
LIMIT 10;

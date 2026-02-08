-- ============================================================
-- CHECK VERIFIED COLORS COVERAGE
-- ============================================================
-- This shows how many products have verifiedColors vs relying on text

-- 1. Overall coverage statistics
SELECT
  COUNT(*) as total_products,
  COUNT(verified_colors) as products_with_verified_colors,
  COUNT(*) - COUNT(verified_colors) as products_without_verified_colors,
  ROUND(COUNT(verified_colors)::numeric / COUNT(*)::numeric * 100, 2) as coverage_percentage
FROM products;

-- 2. Coverage by category
SELECT
  category,
  COUNT(*) as total,
  COUNT(verified_colors) as with_verified_colors,
  COUNT(*) - COUNT(verified_colors) as without_verified_colors,
  ROUND(COUNT(verified_colors)::numeric / COUNT(*)::numeric * 100, 2) as coverage_percent
FROM products
GROUP BY category
ORDER BY total DESC;

-- 3. Coverage by affiliate network
SELECT
  affiliate_network,
  COUNT(*) as total,
  COUNT(verified_colors) as with_verified_colors,
  COUNT(*) - COUNT(verified_colors) as without_verified_colors,
  ROUND(COUNT(verified_colors)::numeric / COUNT(*)::numeric * 100, 2) as coverage_percent
FROM products
GROUP BY affiliate_network
ORDER BY total DESC;

-- 4. Sample products WITHOUT verified colors (need backfill)
SELECT
  id,
  title,
  category,
  affiliate_network,
  image_url,
  verified_colors
FROM products
WHERE verified_colors IS NULL
LIMIT 10;

-- 5. Sample products WITH verified colors (to see format)
SELECT
  id,
  title,
  verified_colors
FROM products
WHERE verified_colors IS NOT NULL
LIMIT 5;

-- 6. Check if products have images (required for vision analysis)
SELECT
  COUNT(*) as total_products,
  COUNT(image_url) as products_with_images,
  COUNT(*) - COUNT(image_url) as products_without_images,
  ROUND(COUNT(image_url)::numeric / COUNT(*)::numeric * 100, 2) as image_coverage_percent
FROM products;

-- ============================================================
-- This tells us:
-- - How many products need verifiedColors backfilled
-- - Which categories/networks need it most
-- - If all products have images (required for color detection)
-- ============================================================

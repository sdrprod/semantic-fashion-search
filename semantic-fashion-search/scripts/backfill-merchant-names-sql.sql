-- Backfill merchant_name from brand field
-- For Impact products, merchant_name = Manufacturer = brand

-- Count products without merchant_name
SELECT
  COUNT(*) as total_null,
  COUNT(*) FILTER (WHERE brand IS NOT NULL) as can_update
FROM products
WHERE merchant_name IS NULL;

-- Update merchant_name from brand (only where brand is not null)
UPDATE products
SET merchant_name = brand
WHERE merchant_name IS NULL
  AND brand IS NOT NULL;

-- Verify the update
SELECT
  COUNT(*) FILTER (WHERE merchant_name IS NOT NULL) as with_merchant,
  COUNT(*) FILTER (WHERE merchant_name IS NULL) as still_null,
  COUNT(*) as total
FROM products;

-- Show sample of updated products
SELECT brand, merchant_name, title
FROM products
WHERE merchant_name IS NOT NULL
  AND brand NOT ILIKE '%dhgate%'
LIMIT 20;

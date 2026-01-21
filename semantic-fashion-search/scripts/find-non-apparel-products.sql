-- Find potentially non-apparel products in the database
-- Uses word boundaries to avoid false positives
-- Run this in Supabase SQL Editor or via psql

SELECT
  id,
  title,
  brand,
  merchant_name,
  price,
  category,
  CASE
    -- Electronics
    WHEN (title || ' ' || COALESCE(description, '')) ~* '\y(phone case|iphone|samsung galaxy|android|charger|charging cable|usb cable|power adapter|headphones|earbuds|airpods|bluetooth speaker|smart watch electronics)\y' THEN 'Electronics'

    -- Kitchen/Home
    WHEN (title || ' ' || COALESCE(description, '')) ~* '\y(kitchen knife|garlic press|meat grinder|food processor|cookware set|frying pan|cooking pot|rice cooker|blender|mixer|utensil set)\y' THEN 'Kitchen'

    -- Furniture
    WHEN (title || ' ' || COALESCE(description, '')) ~* '\y(dining table|office chair|computer desk|bookshelf|sofa set|bed frame|mattress|cabinet|wardrobe furniture)\y' THEN 'Furniture'

    -- Toys/Games
    WHEN (title || ' ' || COALESCE(description, '')) ~* '\y(toy car|action figure|board game|puzzle set|video game|gaming console|playing cards|doll house)\y' THEN 'Toys/Games'

    -- Tools/Hardware
    WHEN (title || ' ' || COALESCE(description, '')) ~* '\y(power drill|tool kit|hammer set|screwdriver set|wrench set|toolbox|hardware kit|drill bit)\y' THEN 'Tools'

    -- Pet Supplies
    WHEN (title || ' ' || COALESCE(description, '')) ~* '\y(pet food|dog food|cat food|pet collar|dog leash|cat toy|pet bed|aquarium|fish tank)\y' THEN 'Pet Supplies'

    -- Home Decor (not apparel)
    WHEN (title || ' ' || COALESCE(description, '')) ~* '\y(picture frame|wall art|canvas painting|photo album|flower vase|table lamp|ceiling light|candle holder)\y' THEN 'Home Decor'

    -- Office Supplies
    WHEN (title || ' ' || COALESCE(description, '')) ~* '\y(office supplies|printer paper|notebook set|pen set|desk organizer|file folder|stapler|tape dispenser)\y' THEN 'Office'

    -- Baby/Kids (non-clothing)
    WHEN (title || ' ' || COALESCE(description, '')) ~* '\y(baby bottle|feeding bottle|pacifier|diaper bag insert|stroller|car seat|baby monitor|high chair)\y' THEN 'Baby Products'

    -- Automotive
    WHEN (title || ' ' || COALESCE(description, '')) ~* '\y(car parts|auto parts|car accessories non-clothing|tire|wheel|engine oil|car battery|windshield)\y' THEN 'Automotive'

    -- Sports Equipment (non-apparel)
    WHEN (title || ' ' || COALESCE(description, '')) ~* '\y(basketball ball|soccer ball|tennis racket|golf clubs|fishing rod|camping tent|sleeping bag equipment|bicycle)\y' THEN 'Sports Equipment'

    ELSE 'Other'
  END as reason,
  -- Show snippet of description for context
  LEFT(COALESCE(description, ''), 100) as description_snippet
FROM products
WHERE
  -- Electronics
  (title || ' ' || COALESCE(description, '')) ~* '\y(phone case|iphone|samsung galaxy|android|charger|charging cable|usb cable|power adapter|headphones|earbuds|airpods|bluetooth speaker|smart watch electronics)\y'

  -- Kitchen/Home
  OR (title || ' ' || COALESCE(description, '')) ~* '\y(kitchen knife|garlic press|meat grinder|food processor|cookware set|frying pan|cooking pot|rice cooker|blender|mixer|utensil set)\y'

  -- Furniture
  OR (title || ' ' || COALESCE(description, '')) ~* '\y(dining table|office chair|computer desk|bookshelf|sofa set|bed frame|mattress|cabinet|wardrobe furniture)\y'

  -- Toys/Games
  OR (title || ' ' || COALESCE(description, '')) ~* '\y(toy car|action figure|board game|puzzle set|video game|gaming console|playing cards|doll house)\y'

  -- Tools/Hardware
  OR (title || ' ' || COALESCE(description, '')) ~* '\y(power drill|tool kit|hammer set|screwdriver set|wrench set|toolbox|hardware kit|drill bit)\y'

  -- Pet Supplies
  OR (title || ' ' || COALESCE(description, '')) ~* '\y(pet food|dog food|cat food|pet collar|dog leash|cat toy|pet bed|aquarium|fish tank)\y'

  -- Home Decor
  OR (title || ' ' || COALESCE(description, '')) ~* '\y(picture frame|wall art|canvas painting|photo album|flower vase|table lamp|ceiling light|candle holder)\y'

  -- Office Supplies
  OR (title || ' ' || COALESCE(description, '')) ~* '\y(office supplies|printer paper|notebook set|pen set|desk organizer|file folder|stapler|tape dispenser)\y'

  -- Baby Products
  OR (title || ' ' || COALESCE(description, '')) ~* '\y(baby bottle|feeding bottle|pacifier|diaper bag insert|stroller|car seat|baby monitor|high chair)\y'

  -- Automotive
  OR (title || ' ' || COALESCE(description, '')) ~* '\y(car parts|auto parts|car accessories non-clothing|tire|wheel|engine oil|car battery|windshield)\y'

  -- Sports Equipment
  OR (title || ' ' || COALESCE(description, '')) ~* '\y(basketball ball|soccer ball|tennis racket|golf clubs|fishing rod|camping tent|sleeping bag equipment|bicycle)\y'

ORDER BY reason, title
LIMIT 500;

-- Also show a count by category
-- Uncomment to run:
--
-- SELECT
--   CASE
--     WHEN (title || ' ' || COALESCE(description, '')) ~* '\y(phone case|iphone|samsung galaxy|android|charger|charging cable)\y' THEN 'Electronics'
--     WHEN (title || ' ' || COALESCE(description, '')) ~* '\y(kitchen knife|garlic press|meat grinder|cookware set)\y' THEN 'Kitchen'
--     WHEN (title || ' ' || COALESCE(description, '')) ~* '\y(dining table|office chair|computer desk|bookshelf)\y' THEN 'Furniture'
--     WHEN (title || ' ' || COALESCE(description, '')) ~* '\y(toy car|action figure|board game|puzzle set)\y' THEN 'Toys/Games'
--     ELSE 'Other'
--   END as category,
--   COUNT(*) as count
-- FROM products
-- WHERE
--   (title || ' ' || COALESCE(description, '')) ~* '\y(phone case|iphone|samsung galaxy|android|charger|charging cable|kitchen knife|garlic press|toy car|action figure|dining table|office chair)\y'
-- GROUP BY category
-- ORDER BY count DESC;

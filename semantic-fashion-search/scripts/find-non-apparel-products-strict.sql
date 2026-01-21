-- Find DEFINITELY non-apparel products (strict matching to avoid false positives)
-- Uses very specific phrases that would never appear in fashion items
-- Run this in Supabase SQL Editor

SELECT
  id,
  title,
  brand,
  merchant_name,
  price,
  category,
  CASE
    -- Electronics (very specific)
    WHEN (title || ' ' || COALESCE(description, '')) ~* '\y(phone charger|mobile charger|usb charger|charging cable|usb cable|power bank|bluetooth headphones|wireless earbuds|cell phone case|iphone case|android phone|samsung phone|electronic gadget)\y' THEN 'Electronics'

    -- Kitchen (very specific)
    WHEN (title || ' ' || COALESCE(description, '')) ~* '\y(kitchen knife set|chef knife|garlic press|garlic peeler|meat grinder|food processor|cookware set|frying pan|cooking pot|rice cooker|electric kettle|coffee maker)\y' THEN 'Kitchen'

    -- Furniture (very specific)
    WHEN (title || ' ' || COALESCE(description, '')) ~* '\y(dining table|office chair|computer desk|bookshelf unit|sofa set|bed frame|mattress pad|storage cabinet)\y' THEN 'Furniture'

    -- Toys/Games (very specific)
    WHEN (title || ' ' || COALESCE(description, '')) ~* '\y(toy car|toy truck|action figure|board game|jigsaw puzzle|video game console|gaming controller|playing card deck)\y' THEN 'Toys/Games'

    -- Tools (very specific)
    WHEN (title || ' ' || COALESCE(description, '')) ~* '\y(power drill|cordless drill|tool kit|hammer set|screwdriver set|wrench set|saw blade|drill bits)\y' THEN 'Tools'

    -- Pet Supplies (very specific)
    WHEN (title || ' ' || COALESCE(description, '')) ~* '\y(dog food|cat food|pet food bowl|dog leash|pet collar|cat litter|pet bed|fish tank|aquarium filter)\y' THEN 'Pet Supplies'

    -- Home Decor (very specific - not wearable)
    WHEN (title || ' ' || COALESCE(description, '')) ~* '\y(picture frame|photo frame|wall art|canvas painting|flower vase|table lamp|floor lamp|ceiling light|wall clock)\y' THEN 'Home Decor'

    -- Office Supplies (very specific)
    WHEN (title || ' ' || COALESCE(description, '')) ~* '\y(printer paper|copy paper|notebook|spiral notebook|ballpoint pen|desk organizer|file folder|paper clips|stapler)\y' THEN 'Office'

    -- Baby Products (non-clothing)
    WHEN (title || ' ' || COALESCE(description, '')) ~* '\y(baby bottle|feeding bottle|baby formula|diaper cream|baby stroller|car seat|baby monitor|high chair)\y' THEN 'Baby Products'

    -- Automotive (very specific - removed "wheel" and "tire" alone)
    WHEN (title || ' ' || COALESCE(description, '')) ~* '\y(car parts|auto parts|car engine|motor oil|engine oil|car battery|windshield wiper|brake pads|spark plugs)\y' THEN 'Automotive'

    -- Sports Equipment (non-apparel, very specific)
    WHEN (title || ' ' || COALESCE(description, '')) ~* '\y(basketball ball|soccer ball|football ball|tennis racket|golf clubs|fishing rod|camping tent|yoga mat|dumbbell set|treadmill)\y' THEN 'Sports Equipment'

    -- Health/Beauty Devices (not cosmetics/apparel)
    WHEN (title || ' ' || COALESCE(description, '')) ~* '\y(blood pressure monitor|thermometer|massage gun|heating pad|humidifier|air purifier|scale)\y' THEN 'Health Devices'

    ELSE 'Other'
  END as reason,
  LEFT(COALESCE(description, ''), 150) as description_snippet
FROM products
WHERE
  -- Electronics
  (title || ' ' || COALESCE(description, '')) ~* '\y(phone charger|mobile charger|usb charger|charging cable|usb cable|power bank|bluetooth headphones|wireless earbuds|cell phone case|iphone case|android phone|samsung phone|electronic gadget)\y'

  -- Kitchen
  OR (title || ' ' || COALESCE(description, '')) ~* '\y(kitchen knife set|chef knife|garlic press|garlic peeler|meat grinder|food processor|cookware set|frying pan|cooking pot|rice cooker|electric kettle|coffee maker)\y'

  -- Furniture
  OR (title || ' ' || COALESCE(description, '')) ~* '\y(dining table|office chair|computer desk|bookshelf unit|sofa set|bed frame|mattress pad|storage cabinet)\y'

  -- Toys/Games
  OR (title || ' ' || COALESCE(description, '')) ~* '\y(toy car|toy truck|action figure|board game|jigsaw puzzle|video game console|gaming controller|playing card deck)\y'

  -- Tools
  OR (title || ' ' || COALESCE(description, '')) ~* '\y(power drill|cordless drill|tool kit|hammer set|screwdriver set|wrench set|saw blade|drill bits)\y'

  -- Pet Supplies
  OR (title || ' ' || COALESCE(description, '')) ~* '\y(dog food|cat food|pet food bowl|dog leash|pet collar|cat litter|pet bed|fish tank|aquarium filter)\y'

  -- Home Decor
  OR (title || ' ' || COALESCE(description, '')) ~* '\y(picture frame|photo frame|wall art|canvas painting|flower vase|table lamp|floor lamp|ceiling light|wall clock)\y'

  -- Office Supplies
  OR (title || ' ' || COALESCE(description, '')) ~* '\y(printer paper|copy paper|notebook|spiral notebook|ballpoint pen|desk organizer|file folder|paper clips|stapler)\y'

  -- Baby Products
  OR (title || ' ' || COALESCE(description, '')) ~* '\y(baby bottle|feeding bottle|baby formula|diaper cream|baby stroller|car seat|baby monitor|high chair)\y'

  -- Automotive (stricter)
  OR (title || ' ' || COALESCE(description, '')) ~* '\y(car parts|auto parts|car engine|motor oil|engine oil|car battery|windshield wiper|brake pads|spark plugs)\y'

  -- Sports Equipment
  OR (title || ' ' || COALESCE(description, '')) ~* '\y(basketball ball|soccer ball|football ball|tennis racket|golf clubs|fishing rod|camping tent|yoga mat|dumbbell set|treadmill)\y'

  -- Health Devices
  OR (title || ' ' || COALESCE(description, '')) ~* '\y(blood pressure monitor|thermometer|massage gun|heating pad|humidifier|air purifier|scale)\y'

ORDER BY reason, title
LIMIT 500;

-- Count summary (uncomment to run):
--
-- SELECT
--   COUNT(*) as total_suspicious_products
-- FROM products
-- WHERE
--   (title || ' ' || COALESCE(description, '')) ~* '\y(phone charger|mobile charger|kitchen knife set|garlic press|dining table|office chair|toy car|action figure|power drill|dog food|cat food|picture frame|printer paper)\y';

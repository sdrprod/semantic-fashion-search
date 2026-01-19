-- Add quality filter columns to search_settings table
-- Run this in Supabase SQL Editor

-- Add minimum price threshold column
ALTER TABLE search_settings
ADD COLUMN IF NOT EXISTS min_price_threshold numeric(10,2) DEFAULT 5.00;

-- Add filter enable/disable toggles
ALTER TABLE search_settings
ADD COLUMN IF NOT EXISTS enable_mens_filter boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS enable_price_filter boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS enable_non_apparel_filter boolean DEFAULT true;

-- Add comment explaining the columns
COMMENT ON COLUMN search_settings.min_price_threshold IS 'Minimum price to show products (quality control). Products below this price are filtered out.';
COMMENT ON COLUMN search_settings.enable_mens_filter IS 'Filter out men''s products from search results';
COMMENT ON COLUMN search_settings.enable_price_filter IS 'Enable minimum price filtering';
COMMENT ON COLUMN search_settings.enable_non_apparel_filter IS 'Filter out non-apparel materials (fabric, upholstery, etc.)';

-- Initialize existing row with default values if it exists
UPDATE search_settings
SET
  min_price_threshold = 5.00,
  enable_mens_filter = true,
  enable_price_filter = true,
  enable_non_apparel_filter = true
WHERE id = '00000000-0000-0000-0000-000000000001';

-- Verify the changes
SELECT
  similarity_threshold,
  diversity_factor,
  min_price_threshold,
  enable_mens_filter,
  enable_price_filter,
  enable_non_apparel_filter
FROM search_settings
WHERE id = '00000000-0000-0000-0000-000000000001';

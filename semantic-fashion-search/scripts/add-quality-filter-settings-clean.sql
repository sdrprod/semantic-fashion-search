-- Add quality filter columns
ALTER TABLE search_settings ADD COLUMN IF NOT EXISTS min_price_threshold numeric(10,2) DEFAULT 5.00;

ALTER TABLE search_settings ADD COLUMN IF NOT EXISTS enable_mens_filter boolean DEFAULT true;

ALTER TABLE search_settings ADD COLUMN IF NOT EXISTS enable_price_filter boolean DEFAULT true;

ALTER TABLE search_settings ADD COLUMN IF NOT EXISTS enable_non_apparel_filter boolean DEFAULT true;

-- Initialize existing row
UPDATE search_settings
SET
  min_price_threshold = 5.00,
  enable_mens_filter = true,
  enable_price_filter = true,
  enable_non_apparel_filter = true
WHERE id = '00000000-0000-0000-0000-000000000001';

-- Verify
SELECT
  similarity_threshold,
  diversity_factor,
  min_price_threshold,
  enable_mens_filter,
  enable_price_filter,
  enable_non_apparel_filter
FROM search_settings
WHERE id = '00000000-0000-0000-0000-000000000001';

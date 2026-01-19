-- Create search_settings table with all fields
CREATE TABLE IF NOT EXISTS search_settings (
  id uuid PRIMARY KEY DEFAULT '00000000-0000-0000-0000-000000000001',
  similarity_threshold numeric(3,2) DEFAULT 0.30,
  diversity_factor numeric(3,2) DEFAULT 0.10,
  default_page_size integer DEFAULT 10,
  max_page_size integer DEFAULT 50,
  category_weights jsonb DEFAULT '{}',
  brand_boosts jsonb DEFAULT '{}',
  min_price_threshold numeric(10,2) DEFAULT 5.00,
  enable_mens_filter boolean DEFAULT true,
  enable_price_filter boolean DEFAULT true,
  enable_non_apparel_filter boolean DEFAULT true,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid
);

-- Insert default settings row
INSERT INTO search_settings (
  id,
  similarity_threshold,
  diversity_factor,
  default_page_size,
  max_page_size,
  category_weights,
  brand_boosts,
  min_price_threshold,
  enable_mens_filter,
  enable_price_filter,
  enable_non_apparel_filter
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  0.30,
  0.10,
  10,
  50,
  '{}',
  '{}',
  5.00,
  true,
  true,
  true
) ON CONFLICT (id) DO NOTHING;

-- Verify
SELECT * FROM search_settings WHERE id = '00000000-0000-0000-0000-000000000001';

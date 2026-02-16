-- ============================================
-- Create Demo Products Table for Live Presentations
-- ============================================
-- This table stores pre-populated product data for demo searches
-- to ensure reliable, fast results during live presentations

-- Create demo_products table
CREATE TABLE IF NOT EXISTS public.demo_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand text NOT NULL,
  title text NOT NULL,
  description text,
  price numeric(10,2),
  currency text NOT NULL DEFAULT 'USD',
  image_url text NOT NULL,
  product_url text NOT NULL,
  verified_colors JSONB,
  target_gender text,
  demo_trigger text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create index on demo_trigger for fast lookups
CREATE INDEX IF NOT EXISTS idx_demo_products_trigger
  ON public.demo_products(demo_trigger);

-- Enable RLS (read-only for public)
ALTER TABLE public.demo_products ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Allow public read access on demo_products" ON public.demo_products
  FOR SELECT
  USING (true);

-- Service role full access
CREATE POLICY "Allow service role full access on demo_products" ON public.demo_products
  FOR ALL
  USING (true);

-- Verify table was created
SELECT 'demo_products table created successfully' as status;

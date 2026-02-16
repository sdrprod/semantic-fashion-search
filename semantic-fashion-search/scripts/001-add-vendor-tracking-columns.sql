-- Migration: Add vendor-agnostic tracking columns for product updates
-- These columns work for all vendors (Amazon, etc.) to support weekly diff/update strategy

ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS last_scraped_at timestamptz,
ADD COLUMN IF NOT EXISTS content_hash text,
ADD COLUMN IF NOT EXISTS sale_price numeric(10,2),
ADD COLUMN IF NOT EXISTS discount_percent numeric(5,2),
ADD COLUMN IF NOT EXISTS sale_end_date timestamptz,
ADD COLUMN IF NOT EXISTS is_on_sale boolean DEFAULT false;

-- Create index on content_hash for fast change detection
CREATE INDEX IF NOT EXISTS idx_products_content_hash ON public.products(content_hash);

-- Create index on last_scraped_at for sorting/filtering recent updates
CREATE INDEX IF NOT EXISTS idx_products_last_scraped_at ON public.products(last_scraped_at);

-- Create index on is_on_sale for filtering sales items
CREATE INDEX IF NOT EXISTS idx_products_is_on_sale ON public.products(is_on_sale);

-- Add comment explaining the new columns
COMMENT ON COLUMN public.products.last_scraped_at IS 'Timestamp when product was last fetched from vendor API';
COMMENT ON COLUMN public.products.content_hash IS 'SHA256 hash of key fields (title, brand, price, description) to detect content changes without re-embedding';
COMMENT ON COLUMN public.products.sale_price IS 'Discounted price if product is on sale (null if no sale)';
COMMENT ON COLUMN public.products.discount_percent IS 'Percentage discount being applied (null if no sale)';
COMMENT ON COLUMN public.products.sale_end_date IS 'When the current sale/discount ends (null if not on sale)';
COMMENT ON COLUMN public.products.is_on_sale IS 'Boolean flag for quick filtering of sale items';

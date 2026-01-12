-- Add content_hash column to products table for deduplication
-- This column will store a fingerprint based on title + brand + price bucket

-- Add the column if it doesn't exist
ALTER TABLE products
ADD COLUMN IF NOT EXISTS content_hash TEXT;

-- Create an index for fast duplicate lookups
CREATE INDEX IF NOT EXISTS idx_products_content_hash ON products(content_hash);

-- Add a comment explaining the column
COMMENT ON COLUMN products.content_hash IS 'Content-based fingerprint for deduplication: normalized_title|brand|price_bucket';

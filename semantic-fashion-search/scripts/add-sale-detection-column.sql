-- Add on_sale column to products table
-- This will track products that have "sale" or "on sale" in their text

ALTER TABLE products
ADD COLUMN IF NOT EXISTS on_sale BOOLEAN DEFAULT false;

-- Create index for efficient filtering
CREATE INDEX IF NOT EXISTS idx_products_on_sale ON products(on_sale) WHERE on_sale = true;

-- Verify the column was added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'products' AND column_name = 'on_sale';

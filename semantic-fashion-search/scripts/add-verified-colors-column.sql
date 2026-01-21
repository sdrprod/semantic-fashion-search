-- Add verified_colors column to products table
-- This stores AI-verified actual product colors (not just text mentions)

-- Add the column (JSONB array to store multiple colors)
ALTER TABLE products
ADD COLUMN IF NOT EXISTS verified_colors JSONB DEFAULT NULL;

-- Add an index for efficient color filtering
CREATE INDEX IF NOT EXISTS idx_products_verified_colors
ON products USING GIN (verified_colors);

-- Add a comment explaining the field
COMMENT ON COLUMN products.verified_colors IS
'AI-verified actual product colors extracted from image analysis.
Stored as JSON array: ["blue", "navy"] or ["red", "burgundy"].
NULL means not yet analyzed. Empty array [] means color could not be determined.';

-- Example queries after backfill:
-- Find all blue products: WHERE verified_colors ? 'blue'
-- Find blue OR navy: WHERE verified_colors ?| array['blue', 'navy']
-- Find multi-color: WHERE jsonb_array_length(verified_colors) > 1

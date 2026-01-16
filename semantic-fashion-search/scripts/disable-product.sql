-- Disable and blacklist specific product
-- Product: "Zip Halter Playsuit Women Summer Trend Backless Fitness Sleeveless Stretch Casual Sporty Workout Activity One Piece Rompers"

-- STEP 1: Find the product(s) to verify
SELECT
    id,
    title,
    brand,
    price,
    product_url,
    content_hash,
    affiliate_network,
    merchant_name
FROM products
WHERE title ILIKE '%Zip Halter Playsuit%'
   OR title ILIKE '%Backless Fitness Sleeveless%One Piece Rompers%';

-- STEP 2: Create blacklist table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS product_blacklist (
    id SERIAL PRIMARY KEY,
    title_pattern TEXT NOT NULL,
    content_hash TEXT,
    product_url TEXT,
    reason TEXT,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    UNIQUE(content_hash)
);

-- Add index for faster lookups during sync
CREATE INDEX IF NOT EXISTS idx_blacklist_content_hash ON product_blacklist(content_hash);
CREATE INDEX IF NOT EXISTS idx_blacklist_title_pattern ON product_blacklist(title_pattern);

-- STEP 3: Add to blacklist before deleting
-- This ensures it won't come back on future syncs
INSERT INTO product_blacklist (title_pattern, content_hash, product_url, reason)
SELECT
    title,
    content_hash,
    product_url,
    'Inappropriate/low quality product - manually blacklisted'
FROM products
WHERE title ILIKE '%Zip Halter Playsuit%'
   OR title ILIKE '%Backless Fitness Sleeveless%One Piece Rompers%'
ON CONFLICT (content_hash) DO NOTHING;

-- STEP 4: Delete the product(s)
DELETE FROM products
WHERE title ILIKE '%Zip Halter Playsuit%'
   OR title ILIKE '%Backless Fitness Sleeveless%One Piece Rompers%';

-- STEP 5: Verify deletion
SELECT COUNT(*) as remaining_count
FROM products
WHERE title ILIKE '%Zip Halter Playsuit%'
   OR title ILIKE '%Backless Fitness Sleeveless%One Piece Rompers%';

-- Should return 0 if successfully deleted

-- STEP 6: Verify blacklist entry
SELECT
    id,
    title_pattern,
    content_hash,
    reason,
    "createdAt"
FROM product_blacklist
WHERE title_pattern ILIKE '%Zip Halter Playsuit%'
   OR title_pattern ILIKE '%Backless Fitness Sleeveless%One Piece Rompers%';

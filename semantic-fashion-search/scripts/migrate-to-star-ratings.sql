-- ============================================
-- Migrate Product Feedback to Star Ratings (1-5)
-- Run this in Supabase SQL Editor
-- ============================================

-- Step 1: Add new rating column (1-5 stars)
ALTER TABLE public.product_feedback
ADD COLUMN IF NOT EXISTS rating smallint;

-- Step 2: Migrate existing data (vote -1/+1 to rating 1-5)
-- Convert: -1 (downvote) → 1 star, +1 (upvote) → 5 stars
UPDATE public.product_feedback
SET rating = CASE
  WHEN vote = -1 THEN 1
  WHEN vote = 1 THEN 5
  ELSE NULL
END
WHERE rating IS NULL;

-- Step 3: Make rating NOT NULL and add constraint
ALTER TABLE public.product_feedback
ALTER COLUMN rating SET NOT NULL;

ALTER TABLE public.product_feedback
ADD CONSTRAINT rating_valid CHECK (rating BETWEEN 1 AND 5);

-- Step 4: Drop old vote column
ALTER TABLE public.product_feedback
DROP COLUMN IF EXISTS vote;

-- Step 5: Update constraint for user-product uniqueness
-- For authenticated users: one rating per user per product
ALTER TABLE public.product_feedback
DROP CONSTRAINT IF EXISTS product_feedback_session_product_key;

-- Keep session_id nullable for backward compatibility during migration
-- Future: Remove session_id entirely once frontend is updated
ALTER TABLE public.product_feedback
ALTER COLUMN session_id DROP NOT NULL;

-- Create new unique constraint for authenticated users
CREATE UNIQUE INDEX IF NOT EXISTS idx_feedback_user_product
ON public.product_feedback(user_id, product_id)
WHERE user_id IS NOT NULL;

-- Step 6: Add updated_at trigger if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_product_feedback_updated_at ON public.product_feedback;
CREATE TRIGGER update_product_feedback_updated_at
    BEFORE UPDATE ON public.product_feedback
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Step 7: Update table comment
COMMENT ON TABLE public.product_feedback IS
  'Stores user ratings (1-5 stars) for products. Authenticated users only for persistent storage.';

COMMENT ON COLUMN public.product_feedback.rating IS
  '1-5 star rating (1=lowest, 5=highest)';

COMMENT ON COLUMN public.product_feedback.session_id IS
  'DEPRECATED: Keep for backward compatibility during migration. Will be removed.';

-- Step 8: Create view for aggregate stats (for API efficiency)
CREATE OR REPLACE VIEW product_rating_stats AS
SELECT
  product_id,
  COUNT(*) as total_ratings,
  ROUND(AVG(rating)::numeric, 2) as avg_rating,
  COUNT(*) FILTER (WHERE rating >= 3) as ratings_3_plus,
  COUNT(*) FILTER (WHERE rating = 5) as ratings_5_star,
  COUNT(*) FILTER (WHERE rating <= 2) as ratings_2_or_less,
  ROUND(
    (COUNT(*) FILTER (WHERE rating >= 3)::decimal / COUNT(*)::decimal) * 100,
    0
  ) as percent_3_plus,
  ROUND(
    (COUNT(*) FILTER (WHERE rating = 5)::decimal / COUNT(*)::decimal) * 100,
    0
  ) as percent_5_star,
  ROUND(
    (COUNT(*) FILTER (WHERE rating <= 2)::decimal / COUNT(*)::decimal) * 100,
    0
  ) as percent_2_or_less
FROM public.product_feedback
WHERE user_id IS NOT NULL  -- Only count authenticated users
GROUP BY product_id;

-- Grant select on view
GRANT SELECT ON product_rating_stats TO authenticated;
GRANT SELECT ON product_rating_stats TO anon;

-- Add comment on view
COMMENT ON VIEW product_rating_stats IS
  'Aggregate rating statistics per product. Used by API for stats display and community filtering.';

-- Step 9: Create index on rating for filtering queries
CREATE INDEX IF NOT EXISTS idx_feedback_rating ON public.product_feedback(rating);

-- ============================================
-- Verification Queries (run these to check)
-- ============================================

-- Check schema
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'product_feedback';

-- Check stats view
-- SELECT * FROM product_rating_stats LIMIT 5;

-- Check existing data
-- SELECT COUNT(*), MIN(rating), MAX(rating), AVG(rating)
-- FROM product_feedback;

-- ============================================
-- Migrate Product Feedback to Star Ratings (1-5)
-- IMPROVED VERSION with Guardrails
-- Run this in Supabase SQL Editor
-- ============================================

-- Begin transaction for atomicity (all-or-nothing)
BEGIN;

-- ============================================
-- PRE-FLIGHT CHECKS
-- ============================================

DO $$
DECLARE
  table_exists boolean;
  vote_column_exists boolean;
  rating_column_exists boolean;
  row_count integer;
  invalid_votes integer;
BEGIN
  -- Check if product_feedback table exists
  SELECT EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'product_feedback'
  ) INTO table_exists;

  IF NOT table_exists THEN
    RAISE EXCEPTION 'Table product_feedback does not exist. Cannot proceed with migration.';
  END IF;

  -- Check if vote column exists
  SELECT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'product_feedback'
    AND column_name = 'vote'
  ) INTO vote_column_exists;

  -- Check if rating column already exists
  SELECT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'product_feedback'
    AND column_name = 'rating'
  ) INTO rating_column_exists;

  -- Get row count
  SELECT COUNT(*) INTO row_count FROM public.product_feedback;

  -- Check for invalid vote values (not -1, 0, 1, or NULL)
  IF vote_column_exists THEN
    SELECT COUNT(*) INTO invalid_votes
    FROM public.product_feedback
    WHERE vote IS NOT NULL AND vote NOT IN (-1, 0, 1);

    IF invalid_votes > 0 THEN
      RAISE WARNING 'Found % rows with unexpected vote values (not -1, 0, 1, or NULL). These will be set to NULL.', invalid_votes;
    END IF;
  END IF;

  -- Log migration status
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Pre-flight checks complete:';
  RAISE NOTICE '- Table exists: %', table_exists;
  RAISE NOTICE '- Vote column exists: %', vote_column_exists;
  RAISE NOTICE '- Rating column exists: %', rating_column_exists;
  RAISE NOTICE '- Total rows: %', row_count;
  RAISE NOTICE '- Invalid votes: %', invalid_votes;
  RAISE NOTICE '========================================';

  IF rating_column_exists THEN
    RAISE NOTICE 'Rating column already exists. Migration may have already been run.';
    RAISE NOTICE 'Script will continue safely with IF NOT EXISTS checks.';
  END IF;

END $$;

-- ============================================
-- MIGRATION STEPS
-- ============================================

-- Step 1: Add new rating column (1-5 stars)
DO $$
BEGIN
  ALTER TABLE public.product_feedback
  ADD COLUMN IF NOT EXISTS rating smallint;

  RAISE NOTICE 'Step 1: Added rating column';
EXCEPTION
  WHEN duplicate_column THEN
    RAISE NOTICE 'Step 1: Rating column already exists, skipping';
END $$;

-- Step 2: Migrate existing data (vote -1/+1 to rating 1-5)
-- Convert: -1 (downvote) → 1 star, +1 (upvote) → 5 stars
-- Note: vote=0 or NULL → rating=NULL (will need manual handling if NOT NULL constraint applied)
DO $$
DECLARE
  updated_count integer;
BEGIN
  UPDATE public.product_feedback
  SET rating = CASE
    WHEN vote = -1 THEN 1
    WHEN vote = 1 THEN 5
    WHEN vote = 0 THEN 3  -- Neutral vote → 3 stars (middle ground)
    ELSE NULL
  END
  WHERE rating IS NULL;

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'Step 2: Migrated % existing vote records to rating values', updated_count;
END $$;

-- Step 3: Check for NULL ratings before applying NOT NULL constraint
DO $$
DECLARE
  null_count integer;
BEGIN
  SELECT COUNT(*) INTO null_count
  FROM public.product_feedback
  WHERE rating IS NULL;

  IF null_count > 0 THEN
    RAISE WARNING 'Found % rows with NULL rating. NOT NULL constraint will fail.', null_count;
    RAISE WARNING 'Consider deleting these rows or setting default values before proceeding.';
    RAISE EXCEPTION 'Cannot apply NOT NULL constraint with NULL values present.';
  END IF;

  -- Apply NOT NULL constraint
  ALTER TABLE public.product_feedback
  ALTER COLUMN rating SET NOT NULL;

  -- Add validation constraint
  ALTER TABLE public.product_feedback
  ADD CONSTRAINT rating_valid CHECK (rating BETWEEN 1 AND 5);

  RAISE NOTICE 'Step 3: Applied NOT NULL constraint and validation (rating 1-5)';
EXCEPTION
  WHEN check_violation THEN
    RAISE EXCEPTION 'Cannot apply constraint: rating_valid already exists or validation failed';
END $$;

-- Step 4: Drop old vote column (after successful migration)
DO $$
BEGIN
  ALTER TABLE public.product_feedback
  DROP COLUMN IF EXISTS vote;

  RAISE NOTICE 'Step 4: Dropped old vote column';
END $$;

-- Step 5: Update constraints for user-product uniqueness
DO $$
BEGIN
  -- Drop old session-based constraint
  ALTER TABLE public.product_feedback
  DROP CONSTRAINT IF EXISTS product_feedback_session_product_key;

  -- Make session_id nullable (backward compatibility)
  ALTER TABLE public.product_feedback
  ALTER COLUMN session_id DROP NOT NULL;

  -- Create new unique constraint for authenticated users
  CREATE UNIQUE INDEX IF NOT EXISTS idx_feedback_user_product
  ON public.product_feedback(user_id, product_id)
  WHERE user_id IS NOT NULL;

  RAISE NOTICE 'Step 5: Updated constraints for user-product uniqueness';
END $$;

-- Step 6: Add updated_at trigger
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

RAISE NOTICE 'Step 6: Created updated_at trigger';

-- Step 7: Update table and column comments
COMMENT ON TABLE public.product_feedback IS
  'Stores user ratings (1-5 stars) for products. Authenticated users only for persistent storage.';

COMMENT ON COLUMN public.product_feedback.rating IS
  '1-5 star rating (1=lowest, 5=highest)';

COMMENT ON COLUMN public.product_feedback.session_id IS
  'DEPRECATED: Keep for backward compatibility during migration. Will be removed in future version.';

-- Step 8: Create view for aggregate stats
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

-- Grant permissions on view
GRANT SELECT ON product_rating_stats TO authenticated;
GRANT SELECT ON product_rating_stats TO anon;

COMMENT ON VIEW product_rating_stats IS
  'Aggregate rating statistics per product. Used by API for stats display and community filtering.';

RAISE NOTICE 'Step 8: Created product_rating_stats view';

-- Step 9: Create index on rating column for performance
CREATE INDEX IF NOT EXISTS idx_feedback_rating ON public.product_feedback(rating);

RAISE NOTICE 'Step 9: Created index on rating column';

-- ============================================
-- POST-MIGRATION VERIFICATION
-- ============================================

DO $$
DECLARE
  total_rows integer;
  min_rating integer;
  max_rating integer;
  avg_rating numeric;
  null_ratings integer;
BEGIN
  -- Get statistics
  SELECT
    COUNT(*),
    MIN(rating),
    MAX(rating),
    ROUND(AVG(rating)::numeric, 2),
    COUNT(*) FILTER (WHERE rating IS NULL)
  INTO total_rows, min_rating, max_rating, avg_rating, null_ratings
  FROM public.product_feedback;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'Migration Complete - Verification:';
  RAISE NOTICE '- Total ratings: %', total_rows;
  RAISE NOTICE '- Rating range: % to %', min_rating, max_rating;
  RAISE NOTICE '- Average rating: %', avg_rating;
  RAISE NOTICE '- NULL ratings: %', null_ratings;
  RAISE NOTICE '========================================';

  -- Verify view works
  PERFORM * FROM product_rating_stats LIMIT 1;
  RAISE NOTICE '✓ product_rating_stats view is working';

  RAISE NOTICE '========================================';
  RAISE NOTICE '✓ MIGRATION SUCCESSFUL';
  RAISE NOTICE '========================================';
END $$;

-- Commit transaction
COMMIT;

-- ============================================
-- MANUAL VERIFICATION QUERIES
-- (Run these separately after migration)
-- ============================================

-- Check final schema
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'product_feedback'
-- ORDER BY ordinal_position;

-- Check stats view with sample data
-- SELECT * FROM product_rating_stats LIMIT 5;

-- Check rating distribution
-- SELECT rating, COUNT(*) as count
-- FROM product_feedback
-- GROUP BY rating
-- ORDER BY rating;

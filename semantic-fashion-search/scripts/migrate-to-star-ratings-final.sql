-- ============================================
-- Migrate Product Feedback to Star Ratings (1-5)
-- Simplified version - immediate drop of vote column
-- ============================================

-- ============================================
-- PRE-FLIGHT CHECKS
-- ============================================
DO $$
DECLARE
  table_exists boolean := false;
  vote_column_exists boolean := false;
  rating_column_exists boolean := false;
  row_count integer := 0;
  invalid_votes integer := 0;
BEGIN
  SELECT EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'product_feedback'
  ) INTO table_exists;

  IF NOT table_exists THEN
    RAISE EXCEPTION 'Table public.product_feedback does not exist. Aborting migration.';
  END IF;

  SELECT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'product_feedback'
      AND column_name = 'vote'
  ) INTO vote_column_exists;

  SELECT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'product_feedback'
      AND column_name = 'rating'
  ) INTO rating_column_exists;

  SELECT COUNT(*) INTO row_count FROM public.product_feedback;

  IF vote_column_exists THEN
    SELECT COUNT(*) INTO invalid_votes
    FROM public.product_feedback
    WHERE vote IS NOT NULL AND vote NOT IN (-1, 0, 1);
  ELSE
    invalid_votes := 0;
  END IF;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'Pre-flight checks:';
  RAISE NOTICE '- Table exists: %', table_exists;
  RAISE NOTICE '- Vote column exists: %', vote_column_exists;
  RAISE NOTICE '- Rating column exists: %', rating_column_exists;
  RAISE NOTICE '- Total rows: %', row_count;
  RAISE NOTICE '- Invalid vote values (not -1/0/1): %', invalid_votes;
  RAISE NOTICE '========================================';

  IF invalid_votes > 0 THEN
    RAISE WARNING 'There are % rows with invalid vote values. Setting them to NULL before migration.', invalid_votes;
  END IF;

  IF rating_column_exists THEN
    RAISE NOTICE 'Rating column already exists. Migration may have already been run.';
    RAISE NOTICE 'Script will continue safely with IF NOT EXISTS checks.';
  END IF;
END $$;

-- ============================================
-- SANITIZE INVALID VOTES (set unexpected values to NULL)
-- ============================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'product_feedback'
      AND column_name = 'vote'
  ) THEN
    UPDATE public.product_feedback
    SET vote = NULL
    WHERE vote IS NOT NULL AND vote NOT IN (-1, 0, 1);
    RAISE NOTICE 'Step 1: Sanitized invalid vote values';
  ELSE
    RAISE NOTICE 'Step 1: Vote column does not exist, skipping sanitization';
  END IF;
END $$;

-- ============================================
-- ADD rating column if missing
-- ============================================
ALTER TABLE public.product_feedback
  ADD COLUMN IF NOT EXISTS rating smallint;

COMMENT ON COLUMN public.product_feedback.rating IS '1-5 star rating (1=lowest, 5=highest)';

-- ============================================
-- MIGRATE vote -> rating
-- Mapping: -1 -> 1 star, 0 -> 3 stars, 1 -> 5 stars
-- ============================================
DO $$
DECLARE
  updated_count integer;
  vote_exists boolean;
BEGIN
  -- Check if vote column exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'product_feedback'
      AND column_name = 'vote'
  ) INTO vote_exists;

  IF vote_exists THEN
    UPDATE public.product_feedback
    SET rating = CASE
      WHEN vote = -1 THEN 1
      WHEN vote = 1 THEN 5
      WHEN vote = 0 THEN 3
      ELSE NULL
    END
    WHERE rating IS NULL;

    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RAISE NOTICE 'Step 2: Migrated % vote records to rating values', updated_count;
  ELSE
    RAISE NOTICE 'Step 2: Vote column does not exist, skipping migration (rating column may already be populated)';
  END IF;
END $$;

-- ============================================
-- VERIFY NO NULL RATINGS (abort if any remain)
-- ============================================
DO $$
DECLARE
  null_count integer := 0;
BEGIN
  SELECT COUNT(*) INTO null_count FROM public.product_feedback WHERE rating IS NULL;

  IF null_count > 0 THEN
    RAISE EXCEPTION 'Found % rows with NULL rating after migration. Cannot proceed with NOT NULL constraint.', null_count;
  END IF;

  RAISE NOTICE 'Step 3: Verified all ratings are non-NULL';
END $$;

-- ============================================
-- ADD CHECK constraint and set NOT NULL
-- ============================================
DO $$
BEGIN
  -- Add check constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_namespace n ON t.relnamespace = n.oid
    WHERE c.contype = 'c'
      AND c.conname = 'rating_valid'
      AND n.nspname = 'public'
      AND t.relname = 'product_feedback'
  ) THEN
    ALTER TABLE public.product_feedback
      ADD CONSTRAINT rating_valid CHECK (rating BETWEEN 1 AND 5);
    RAISE NOTICE 'Step 4a: Added rating_valid constraint (1-5)';
  ELSE
    RAISE NOTICE 'Step 4a: Constraint rating_valid already exists, skipping';
  END IF;

  -- Set NOT NULL if not already set
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'product_feedback'
      AND column_name = 'rating'
      AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE public.product_feedback
      ALTER COLUMN rating SET NOT NULL;
    RAISE NOTICE 'Step 4b: Set rating column to NOT NULL';
  ELSE
    RAISE NOTICE 'Step 4b: Column rating already NOT NULL';
  END IF;
END $$;

-- ============================================
-- DROP old vote column immediately
-- ============================================
DO $$
BEGIN
  ALTER TABLE public.product_feedback
    DROP COLUMN IF EXISTS vote;
  RAISE NOTICE 'Step 5: Dropped old vote column';
END $$;

-- ============================================
-- Update session_id nullability and unique index
-- ============================================
DO $$
BEGIN
  -- Drop old session-based constraint
  ALTER TABLE public.product_feedback
    DROP CONSTRAINT IF EXISTS product_feedback_session_product_key;

  -- Make session_id nullable (backward compatibility)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'product_feedback'
      AND column_name = 'session_id'
      AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE public.product_feedback ALTER COLUMN session_id DROP NOT NULL;
  END IF;

  COMMENT ON COLUMN public.product_feedback.session_id IS 'DEPRECATED: Keep for backward compatibility. Will be removed in future version.';

  RAISE NOTICE 'Step 6: Updated session_id constraints';
END $$;

-- Create unique index for authenticated users
CREATE UNIQUE INDEX IF NOT EXISTS idx_feedback_user_product
  ON public.product_feedback(user_id, product_id)
  WHERE user_id IS NOT NULL;

-- ============================================
-- Create updated_at trigger
-- ============================================
CREATE OR REPLACE FUNCTION public.update_product_feedback_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = clock_timestamp();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS update_product_feedback_updated_at ON public.product_feedback;

CREATE TRIGGER update_product_feedback_updated_at
  BEFORE UPDATE ON public.product_feedback
  FOR EACH ROW
  EXECUTE FUNCTION public.update_product_feedback_updated_at();

DO $$
BEGIN
  RAISE NOTICE 'Step 7: Created updated_at trigger';
END $$;

-- ============================================
-- Update table comments
-- ============================================
COMMENT ON TABLE public.product_feedback IS
  'Stores user ratings (1-5 stars) for products. Authenticated users only for persistent storage.';

-- ============================================
-- Create aggregate stats view
-- ============================================
CREATE OR REPLACE VIEW public.product_rating_stats AS
SELECT
  product_id,
  COUNT(*) AS total_ratings,
  ROUND(AVG(rating)::numeric, 2) AS avg_rating,
  COUNT(*) FILTER (WHERE rating >= 3) AS ratings_3_plus,
  COUNT(*) FILTER (WHERE rating = 5) AS ratings_5_star,
  COUNT(*) FILTER (WHERE rating <= 2) AS ratings_2_or_less,
  ROUND(
    (COUNT(*) FILTER (WHERE rating >= 3)::numeric / NULLIF(COUNT(*)::numeric, 0)) * 100,
    0
  ) AS percent_3_plus,
  ROUND(
    (COUNT(*) FILTER (WHERE rating = 5)::numeric / NULLIF(COUNT(*)::numeric, 0)) * 100,
    0
  ) AS percent_5_star,
  ROUND(
    (COUNT(*) FILTER (WHERE rating <= 2)::numeric / NULLIF(COUNT(*)::numeric, 0)) * 100,
    0
  ) AS percent_2_or_less
FROM public.product_feedback
WHERE user_id IS NOT NULL
GROUP BY product_id;

GRANT SELECT ON public.product_rating_stats TO authenticated;
GRANT SELECT ON public.product_rating_stats TO anon;

COMMENT ON VIEW public.product_rating_stats IS 'Aggregate rating statistics per product (authenticated users only).';

DO $$
BEGIN
  RAISE NOTICE 'Step 8: Created product_rating_stats view';
END $$;

-- ============================================
-- Create indexes for performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_feedback_product_rating ON public.product_feedback(product_id, rating);
CREATE INDEX IF NOT EXISTS idx_feedback_rating ON public.product_feedback(rating);

DO $$
BEGIN
  RAISE NOTICE 'Step 9: Created indexes on rating columns';
END $$;

-- ============================================
-- POST-MIGRATION VERIFICATION
-- ============================================
DO $$
DECLARE
  total_rows integer := 0;
  min_rating integer;
  max_rating integer;
  avg_rating numeric;
  null_ratings integer := 0;
BEGIN
  SELECT
    COUNT(*),
    MIN(rating),
    MAX(rating),
    ROUND(AVG(rating)::numeric, 2),
    COUNT(*) FILTER (WHERE rating IS NULL)
  INTO total_rows, min_rating, max_rating, avg_rating, null_ratings
  FROM public.product_feedback;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'Migration Verification:';
  RAISE NOTICE '- Total rows: %', total_rows;
  RAISE NOTICE '- Rating range: % to %', min_rating, max_rating;
  RAISE NOTICE '- Average rating: %', avg_rating;
  RAISE NOTICE '- NULL ratings: %', null_ratings;
  RAISE NOTICE '========================================';

  -- Test view works
  PERFORM 1 FROM public.product_rating_stats LIMIT 1;
  RAISE NOTICE '✓ product_rating_stats view is working';

  RAISE NOTICE '========================================';
  RAISE NOTICE '✓ MIGRATION COMPLETE';
  RAISE NOTICE 'vote column has been dropped';
  RAISE NOTICE 'rating column is ready (1-5 stars)';
  RAISE NOTICE '========================================';
END $$;

-- ============================================
-- MANUAL VERIFICATION QUERIES
-- (Run these separately after migration to inspect)
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

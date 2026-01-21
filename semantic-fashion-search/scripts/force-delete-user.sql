-- Force delete user from ALL auth tables
-- Run this in Supabase SQL Editor with careful attention

-- Get the user ID first
DO $$
DECLARE
  target_user_id uuid;
BEGIN
  -- Find the user
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = 'support@myatlaz.com';

  IF target_user_id IS NULL THEN
    RAISE NOTICE 'No user found with email support@myatlaz.com';
    RETURN;
  END IF;

  RAISE NOTICE 'Found user ID: %', target_user_id;

  -- Delete from all related tables
  DELETE FROM auth.sessions WHERE user_id = target_user_id;
  RAISE NOTICE 'Deleted sessions';

  DELETE FROM auth.refresh_tokens WHERE user_id = target_user_id;
  RAISE NOTICE 'Deleted refresh tokens';

  DELETE FROM auth.identities WHERE user_id = target_user_id;
  RAISE NOTICE 'Deleted identities';

  DELETE FROM auth.mfa_factors WHERE user_id = target_user_id;
  RAISE NOTICE 'Deleted MFA factors';

  DELETE FROM auth.mfa_challenges WHERE factor_id IN (
    SELECT id FROM auth.mfa_factors WHERE user_id = target_user_id
  );
  RAISE NOTICE 'Deleted MFA challenges';

  -- Delete from main users table last
  DELETE FROM auth.users WHERE id = target_user_id;
  RAISE NOTICE 'Deleted user record';

END $$;

-- Verify deletion
SELECT
  CASE
    WHEN COUNT(*) = 0 THEN '✓ User successfully deleted - you can now sign up again'
    ELSE '✗ User still exists - check error messages above'
  END as status
FROM auth.users
WHERE email = 'support@myatlaz.com';

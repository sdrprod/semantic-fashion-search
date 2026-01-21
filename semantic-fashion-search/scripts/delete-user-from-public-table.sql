-- Delete user from public.users table (the one causing 409 error)

-- First, check if the user exists
SELECT id, email, name, role, "emailVerified", "createdAt"
FROM public.users
WHERE email = 'support@myatlaz.com';

-- Delete the user
DELETE FROM public.users
WHERE email = 'support@myatlaz.com';

-- Also clean up any verification codes
DELETE FROM public.verification_codes
WHERE email = 'support@myatlaz.com';

-- Verify deletion
SELECT
  CASE
    WHEN COUNT(*) = 0 THEN '✓ User deleted from public.users - you can now sign up'
    ELSE '✗ User still exists'
  END as status
FROM public.users
WHERE email = 'support@myatlaz.com';

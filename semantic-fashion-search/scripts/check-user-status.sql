-- Check all places where the email might be stored

-- 1. Check auth.users table
SELECT id, email, email_confirmed_at, created_at, deleted_at
FROM auth.users
WHERE email = 'support@myatlaz.com';

-- 2. Check for any identities (OAuth connections)
SELECT id, user_id, provider, email
FROM auth.identities
WHERE email = 'support@myatlaz.com';

-- 3. Check for pending email confirmations
SELECT id, user_id, email, token_hash, created_at
FROM auth.one_time_tokens
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'support@myatlaz.com'
);

-- 4. Check for sessions
SELECT id, user_id, created_at
FROM auth.sessions
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'support@myatlaz.com'
);

-- 5. Check if there's a soft-deleted user
SELECT id, email, deleted_at
FROM auth.users
WHERE email = 'support@myatlaz.com'
  AND deleted_at IS NOT NULL;

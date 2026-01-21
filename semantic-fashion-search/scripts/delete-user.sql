-- Delete user so they can re-signup with same email
-- Run this in Supabase SQL Editor

-- First, check the user exists
SELECT id, email, created_at
FROM auth.users
WHERE email = 'support@myatlaz.com';

-- Delete the user (this will cascade to any related data)
DELETE FROM auth.users
WHERE email = 'support@myatlaz.com';

-- Verify deletion
SELECT id, email
FROM auth.users
WHERE email = 'support@myatlaz.com';
-- Should return no rows if successful

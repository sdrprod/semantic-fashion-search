-- Check ALL tables that might have user records

-- Check if there's a public.users or public.profiles table
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND (table_name LIKE '%user%' OR table_name LIKE '%profile%');

-- If you see a users/profiles table above, run this:
-- SELECT * FROM public.users WHERE email = 'support@myatlaz.com';
-- SELECT * FROM public.profiles WHERE email = 'support@myatlaz.com';

-- Remove pending user: Atlaz Support (support@myatlaz.com)
-- Run this in Supabase SQL Editor

-- 1. Delete verification codes for this email
DELETE FROM verification_codes
WHERE email = 'support@myatlaz.com';

-- 2. Delete the user record
DELETE FROM users
WHERE email = 'support@myatlaz.com';

-- Optional: Verify cleanup was successful
SELECT 'Verification Codes Remaining:' as check_type, COUNT(*) as count
FROM verification_codes
WHERE email = 'support@myatlaz.com'
UNION ALL
SELECT 'Users Remaining:' as check_type, COUNT(*) as count
FROM users
WHERE email = 'support@myatlaz.com';

-- Expected result: Both counts should be 0

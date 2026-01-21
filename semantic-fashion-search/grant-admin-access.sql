-- Grant admin access to Atlaz Support (support@myatlaz.com)

UPDATE users
SET role = 'admin',
    updatedAt = NOW()
WHERE email = 'support@myatlaz.com';

-- Verify the update
SELECT
    email,
    name,
    role,
    emailVerified,
    createdAt,
    updatedAt
FROM users
WHERE email = 'support@myatlaz.com';

-- Expected result: role should now be 'admin'

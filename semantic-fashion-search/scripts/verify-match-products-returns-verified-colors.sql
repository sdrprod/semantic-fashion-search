-- Verify that match_products function returns verified_colors
-- Run this in Supabase SQL editor

-- Check the function definition
SELECT
    p.proname AS function_name,
    pg_get_function_result(p.oid) AS return_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname = 'match_products';

-- This should show verified_colors in the return type
-- If it doesn't, you need to run: scripts/update-match-products-add-verified-colors.sql

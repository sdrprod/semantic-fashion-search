-- Check the ACTUAL match_products function definition in the database
SELECT
  routine_name,
  routine_definition,
  external_language,
  data_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'match_products';

-- Also check for any views or policies that might filter products
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'products';

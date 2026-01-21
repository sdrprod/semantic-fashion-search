-- Check if match_products function exists and its signature

SELECT
  routine_name,
  routine_type,
  data_type,
  type_udt_name
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'match_products';

-- Get the function definition
SELECT pg_get_functiondef(oid)
FROM pg_proc
WHERE proname = 'match_products'
  AND pronamespace = 'public'::regnamespace;

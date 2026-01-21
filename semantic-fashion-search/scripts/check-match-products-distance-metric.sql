-- Check the actual match_products function to see which distance operator it uses
SELECT
  routine_name,
  routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'match_products';

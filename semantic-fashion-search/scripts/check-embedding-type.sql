-- Check the actual data type of the embedding column
-- Run this in Supabase SQL Editor

SELECT
  column_name,
  data_type,
  udt_name,
  character_maximum_length
FROM information_schema.columns
WHERE table_name = 'products'
  AND column_name IN ('embedding', 'image_embedding');

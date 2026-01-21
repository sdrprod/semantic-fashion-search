-- Analyze "black dress" products with color mismatches
-- This shows why we need AI verification!

SELECT
  title,
  verified_colors,
  CASE
    WHEN verified_colors IS NULL THEN 'Not analyzed yet'
    WHEN jsonb_array_length(verified_colors) = 0 THEN 'AI: No clear color detected'
    WHEN verified_colors::text ILIKE '%black%' THEN 'AI: Confirmed black'
    ELSE 'AI: NOT black (vendor lied!)'
  END as color_status,
  CASE
    WHEN title ILIKE '%black%' THEN 'Text claims black'
    ELSE 'Text does not claim black'
  END as text_claim
FROM products
WHERE title ILIKE '%black%' AND title ILIKE '%dress%'
ORDER BY
  CASE
    WHEN verified_colors::text ILIKE '%black%' THEN 1
    WHEN jsonb_array_length(verified_colors) = 0 THEN 2
    WHEN verified_colors IS NOT NULL THEN 3
    ELSE 4
  END
LIMIT 20;

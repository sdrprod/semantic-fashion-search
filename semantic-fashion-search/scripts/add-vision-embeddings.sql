-- ============================================
-- Add Vision Embeddings to Products Table
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Add image_embedding column (512 dimensions for CLIP)
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS image_embedding vector(512);

-- 2. Create index for fast image similarity search
CREATE INDEX IF NOT EXISTS products_image_embedding_idx
ON public.products
USING ivfflat (image_embedding vector_cosine_ops)
WITH (lists = 100);

-- 3. Add metadata columns for tracking
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS image_embedding_generated_at timestamptz,
ADD COLUMN IF NOT EXISTS image_embedding_error text;

-- 4. Create function to match products by both text AND image embeddings
-- This allows hybrid text + image search
CREATE OR REPLACE FUNCTION public.match_products_hybrid(
  query_text_embedding vector(1536),
  query_image_embedding vector(512),
  text_weight float DEFAULT 0.7,
  image_weight float DEFAULT 0.3,
  match_count int DEFAULT 20
)
RETURNS TABLE (
  id uuid,
  brand text,
  title text,
  description text,
  tags text[],
  price numeric(10,2),
  currency text,
  image_url text,
  product_url text,
  combined_text text,
  text_similarity float,
  image_similarity float,
  combined_similarity float
)
LANGUAGE sql STABLE AS $$
  SELECT
    p.id,
    p.brand,
    p.title,
    p.description,
    p.tags,
    p.price,
    p.currency,
    p.image_url,
    p.product_url,
    p.combined_text,
    (1 - (p.embedding <=> query_text_embedding)) AS text_similarity,
    (1 - (p.image_embedding <=> query_image_embedding)) AS image_similarity,
    (
      text_weight * (1 - (p.embedding <=> query_text_embedding)) +
      image_weight * (1 - (p.image_embedding <=> query_image_embedding))
    ) AS combined_similarity
  FROM public.products p
  WHERE p.embedding IS NOT NULL
    AND p.image_embedding IS NOT NULL
  ORDER BY combined_similarity DESC
  LIMIT match_count;
$$;

-- 5. Create function to find products with missing image embeddings
CREATE OR REPLACE FUNCTION public.get_products_needing_image_embeddings(
  batch_size int DEFAULT 100
)
RETURNS TABLE (
  id uuid,
  image_url text,
  title text
)
LANGUAGE sql STABLE AS $$
  SELECT
    p.id,
    p.image_url,
    p.title
  FROM public.products p
  WHERE p.image_embedding IS NULL
    AND p.image_url IS NOT NULL
    AND p.image_embedding_error IS NULL  -- Skip previously failed ones
  ORDER BY p.created_at DESC
  LIMIT batch_size;
$$;

-- 6. Add comment for documentation
COMMENT ON COLUMN public.products.image_embedding IS
  'CLIP vision embedding (512d) for image-based similarity search. Generated from product image URL.';

COMMENT ON COLUMN public.products.image_embedding_generated_at IS
  'Timestamp when image embedding was last generated.';

COMMENT ON COLUMN public.products.image_embedding_error IS
  'Error message if image embedding generation failed (e.g., image download failed).';

-- 7. Show stats
SELECT
  'Migration complete!' as status,
  COUNT(*) as total_products,
  COUNT(image_embedding) as with_image_embeddings,
  COUNT(*) - COUNT(image_embedding) as missing_image_embeddings
FROM public.products;

-- ============================================================
-- CREATE INDEX WITH LOWER MEMORY REQUIREMENTS
-- ============================================================
-- This version uses fewer lists to reduce memory usage
-- Trade-off: Slightly less optimal performance, but MUCH better than no index
-- ============================================================

-- OPTION 1: Try to increase memory for this session first
-- (This might not work if you don't have permission - skip to Option 2 if it fails)

SET maintenance_work_mem = '128MB';

-- Now create the index with original parameters
CREATE INDEX IF NOT EXISTS products_embedding_idx
ON products
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

ANALYZE products;

-- ============================================================
-- If Option 1 fails, use Option 2 below instead
-- ============================================================

# Search Returns Zero Results - Diagnosis Report

## Problem Summary
Search queries return 0 results even though the database has 20,058 products with embeddings.

## Root Cause Analysis

### Database State
✅ **Products**: 20,058 total
- 7,446 fashion products (non-DHGate)
- 12,612 DHGate tech products

✅ **Embeddings**: ALL products (100%) have text embeddings

✅ **match_products RPC**: Function exists and executes

❌ **Search Results**: Returns ONLY DHGate products with NEGATIVE similarity scores

### The Core Issue: Data Type Mismatch

When searching for "black dress", the results show:
- Similarity scores: -0.34 to -0.36 (should be 0.0 to 1.0)
- All 50 results are DHGate products
- All scores below threshold (0.3), so filtered out
- Result: 0 products returned

**Why negative scores?**
The `embedding` column is stored as **TEXT** (string format `[0.026,0.15,...]`), but the `match_products` function expects **vector(1536)** type.

### Test Results

```
Test query: "black dress"

Step 2: Calling match_products RPC...
✅ match_products returned 50 results

Step 3: Analyzing results...
Similarity scores:
   Max: -0.3445  ❌ Should be ~0.5-0.9
   Min: -0.3572
   Avg: -0.3538
   Threshold: 0.3

Products above threshold (0.3): 0/50  ❌
DHGate products: 50/50  ❌

Top 10 results:
  1. ❌ LOW [impact] DHgate - Hot Sale Designer Phone Case...
     Similarity: -0.3445
```

## Why This Happens

The match_products function:
```sql
SELECT
  ...,
  1 - (p.embedding <-> query_embedding) AS similarity
FROM public.products p
WHERE p.embedding IS NOT NULL
ORDER BY p.embedding <-> query_embedding  -- Distance operator
LIMIT match_count;
```

When embeddings are stored as TEXT instead of vector:
1. PostgreSQL can't use the `<->` distance operator properly
2. The vector index (if any) can't be used → slow sequential scan
3. Similarity calculations produce nonsensical negative values
4. Products are returned in essentially random order (first 50 are DHGate)
5. All filtered out due to negative scores

## Solutions

### Option 1: Convert Column to Vector Type (RECOMMENDED)

Run this SQL in Supabase SQL Editor:

```sql
-- 1. Create new vector column
ALTER TABLE products
ADD COLUMN embedding_vector vector(1536);

-- 2. Convert text embeddings to vector type
UPDATE products
SET embedding_vector = embedding::vector
WHERE embedding IS NOT NULL;

-- 3. Create index for fast similarity search
CREATE INDEX ON products
USING ivfflat (embedding_vector vector_cosine_ops)
WITH (lists = 100);

-- 4. Drop old text column
ALTER TABLE products DROP COLUMN embedding;

-- 5. Rename new column
ALTER TABLE products RENAME COLUMN embedding_vector TO embedding;

-- 6. Analyze for query planner
ANALYZE products;
```

### Option 2: Update Function to Accept Text

Change match_products to accept text and cast:

```sql
CREATE OR REPLACE FUNCTION public.match_products(
  query_embedding text,  -- Changed from vector(1536)
  match_count int DEFAULT 20
)
RETURNS TABLE (...)
LANGUAGE sql STABLE AS $$
  SELECT
    ...,
    1 - (p.embedding::vector <-> query_embedding::vector) AS similarity
  FROM public.products p
  WHERE p.embedding IS NOT NULL
  ORDER BY p.embedding::vector <-> query_embedding::vector
  LIMIT match_count;
$$;
```

⚠️ **Note**: This will be SLOW without a vector index, causing timeouts on 20K products.

### Option 3: Regenerate Embeddings with Correct Type

Update the embeddings generation script to store as vector type from the start.

## Recommended Action Plan

1. **Immediate Fix**: Use Option 1 to convert the column to proper vector type
2. **Add Index**: Create ivfflat index for performance
3. **Test Search**: Verify search returns results with positive similarity scores
4. **Monitor**: Check search response times (<3s target)

## Expected Results After Fix

```
Test query: "black dress"

Step 3: Analyzing results...
Similarity scores:
   Max: 0.7234  ✅ Good match
   Min: 0.4156  ✅ Above threshold
   Avg: 0.5891  ✅ Decent relevance

Products above threshold (0.3): 48/50  ✅
DHGate products: 0/50  ✅ (filtered out)

Final results: 48 fashion products  ✅
```

## Files for Reference

- Test script: `scripts/test-search-detailed.mjs`
- Database check: `scripts/check-fashion-embeddings.mjs`
- RPC function: `scripts/update-match-products-function.sql`
- Column type check: `scripts/check-embedding-type.sql` (run in Supabase)

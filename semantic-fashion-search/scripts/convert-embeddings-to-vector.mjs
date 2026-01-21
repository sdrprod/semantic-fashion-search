#!/usr/bin/env node

/**
 * Convert embedding columns from text to vector type in batches
 * This avoids timeout issues with large datasets
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });
dotenv.config({ path: join(__dirname, '..', '.env') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function runSQL(sql) {
  const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql }).catch(() => ({ data: null, error: null }));

  // If exec_sql doesn't exist, try direct approach
  if (error?.code === '42883') {
    // Function doesn't exist, need to use REST API directly
    const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec_sql`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sql_query: sql })
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`SQL execution failed: ${response.status} ${text}`);
    }

    return await response.json();
  }

  if (error) throw error;
  return data;
}

async function convertEmbeddings() {
  console.log('='.repeat(70));
  console.log('CONVERT EMBEDDINGS FROM TEXT TO VECTOR TYPE');
  console.log('='.repeat(70));
  console.log('');

  console.log('⚠️  IMPORTANT: This script will modify the database structure.');
  console.log('   Make sure you have a backup if needed.');
  console.log('');

  // Step 1: Check current state
  console.log('Step 1: Checking current column types...');
  const { data: checkData } = await supabase
    .from('products')
    .select('id, embedding')
    .limit(1);

  if (!checkData || checkData.length === 0) {
    console.error('❌ No products found in database!');
    process.exit(1);
  }

  const sampleEmbedding = checkData[0].embedding;
  const isTextType = typeof sampleEmbedding === 'string' && sampleEmbedding.startsWith('[');

  if (!isTextType) {
    console.log('✅ Embeddings are already in vector format!');
    console.log('   No conversion needed.');
    return;
  }

  console.log('⚠️  Embeddings are in TEXT format, conversion needed.');
  console.log('');

  // Step 2: Create SQL script to run in Supabase SQL Editor
  console.log('Step 2: Creating optimized SQL script...');
  console.log('');

  const sqlScript = `
-- Optimized embedding type conversion
-- This version is faster and less likely to timeout

BEGIN;

-- Create new vector columns
ALTER TABLE products ADD COLUMN IF NOT EXISTS embedding_new vector(1536);
ALTER TABLE products ADD COLUMN IF NOT EXISTS image_embedding_new vector(512);

-- Convert in smaller transaction
-- We'll do this in batches via the app, not in one big transaction
COMMIT;

-- Now we need to convert in batches
-- Run this query multiple times until it returns 0 rows:

WITH batch AS (
  SELECT id, embedding, image_embedding
  FROM products
  WHERE embedding IS NOT NULL
    AND embedding_new IS NULL
  LIMIT 500
)
UPDATE products
SET
  embedding_new = batch.embedding::vector,
  image_embedding_new = CASE
    WHEN batch.image_embedding IS NOT NULL
    THEN batch.image_embedding::vector
    ELSE NULL
  END
FROM batch
WHERE products.id = batch.id;

-- After all batches are done, run this to finalize:
-- (Only run when the above query returns 0 rows affected)

BEGIN;

-- Drop old columns
ALTER TABLE products DROP COLUMN IF EXISTS embedding CASCADE;
ALTER TABLE products DROP COLUMN IF EXISTS image_embedding CASCADE;

-- Rename new columns
ALTER TABLE products RENAME COLUMN embedding_new TO embedding;
ALTER TABLE products RENAME COLUMN image_embedding_new TO image_embedding;

-- Create indexes
CREATE INDEX IF NOT EXISTS products_embedding_idx
ON products USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

CREATE INDEX IF NOT EXISTS products_image_embedding_idx
ON products USING ivfflat (image_embedding vector_cosine_ops)
WITH (lists = 100);

-- Update match_products function
DROP FUNCTION IF EXISTS public.match_products(vector(1536), integer);
DROP FUNCTION IF EXISTS public.match_products(text, integer);

CREATE OR REPLACE FUNCTION public.match_products(
  query_embedding vector(1536),
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
  merchant_id text,
  merchant_name text,
  affiliate_network text,
  image_embedding vector(512),
  similarity float
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
    p.merchant_id,
    p.merchant_name,
    p.affiliate_network,
    p.image_embedding,
    1 - (p.embedding <-> query_embedding) AS similarity
  FROM public.products p
  WHERE p.embedding IS NOT NULL
  ORDER BY p.embedding <-> query_embedding
  LIMIT match_count;
$$;

ANALYZE products;

COMMIT;

-- Verify
SELECT
  COUNT(*) as total,
  COUNT(embedding) as with_embedding,
  pg_typeof(embedding) as embedding_type
FROM products;
`.trim();

  console.log('📝 SQL SCRIPT TO RUN IN SUPABASE SQL EDITOR:');
  console.log('');
  console.log('Copy the script below and run it in Supabase SQL Editor.');
  console.log('The batch conversion query (in the middle) needs to be run');
  console.log('multiple times until it says "0 rows affected".');
  console.log('');
  console.log('='.repeat(70));
  console.log(sqlScript);
  console.log('='.repeat(70));
  console.log('');

  // Save to file
  const outputPath = join(__dirname, 'BATCH-CONVERT-EMBEDDINGS.sql');
  await import('fs').then(fs =>
    fs.promises.writeFile(outputPath, sqlScript, 'utf8')
  );

  console.log(`✅ Script saved to: ${outputPath}`);
  console.log('');
  console.log('INSTRUCTIONS:');
  console.log('1. Open Supabase SQL Editor');
  console.log('2. Copy and run the script up to the "WITH batch" query');
  console.log('3. Run the "WITH batch AS..." query repeatedly until 0 rows');
  console.log('4. Run the final "BEGIN...COMMIT" block to finalize');
  console.log('5. Come back here and run: node scripts/test-search-simple.mjs');
  console.log('');
}

convertEmbeddings()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  });

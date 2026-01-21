#!/usr/bin/env node

/**
 * Fix embedding type by converting in batches
 * This avoids timeout issues
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });
dotenv.config({ path: join(__dirname, '..', '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Use direct fetch to avoid Supabase client limitations
async function executeSQLDirect(sql) {
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({ query: sql })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`SQL failed: ${response.status} - ${text}`);
  }

  return response.json();
}

async function fixEmbeddings() {
  console.log('='.repeat(70));
  console.log('FIX EMBEDDING TYPE - BATCH CONVERSION');
  console.log('='.repeat(70));
  console.log('');

  console.log('This script will:');
  console.log('1. Add temporary vector columns');
  console.log('2. Convert embeddings in batches of 100');
  console.log('3. Replace old text columns with vector columns');
  console.log('4. Create indexes for fast search');
  console.log('');

  // Use Supabase client for data operations
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Phase 1: Setup
  console.log('Phase 1: Setting up vector columns...');
  console.log('Please run these commands in Supabase SQL Editor:');
  console.log('');
  console.log('ALTER TABLE products ADD COLUMN IF NOT EXISTS embedding_vec vector(1536);');
  console.log('ALTER TABLE products ADD COLUMN IF NOT EXISTS image_embedding_vec vector(512);');
  console.log('');
  console.log('Press Enter after you\'ve run the above commands...');

  // Wait for user
  await new Promise(resolve => {
    process.stdin.once('data', resolve);
  });

  // Phase 2: Check if we need to convert
  console.log('');
  console.log('Phase 2: Checking conversion status...');

  const { count: totalCount } = await supabase
    .from('products')
    .select('id', { count: 'exact', head: true });

  const { count: convertedCount } = await supabase
    .from('products')
    .select('id', { count: 'exact', head: true })
    .not('embedding_vec', 'is', null);

  console.log(`Total products: ${totalCount}`);
  console.log(`Already converted: ${convertedCount}`);
  console.log(`Need to convert: ${totalCount - convertedCount}`);
  console.log('');

  if (convertedCount === totalCount) {
    console.log('✅ All products already converted!');
    console.log('   Moving to finalization phase...');
  } else {
    // Phase 3: Convert in batches
    console.log('Phase 3: Converting embeddings in batches...');
    const BATCH_SIZE = 100;
    let processedTotal = convertedCount;

    while (processedTotal < totalCount) {
      const remaining = totalCount - processedTotal;
      const currentBatch = Math.min(BATCH_SIZE, remaining);

      console.log(`Converting batch: ${processedTotal + 1}-${processedTotal + currentBatch} of ${totalCount}...`);

      // Fetch batch that needs conversion
      const { data: batch, error: fetchError } = await supabase
        .from('products')
        .select('id, embedding, image_embedding')
        .is('embedding_vec', null)
        .not('embedding', 'is', null)
        .limit(BATCH_SIZE);

      if (fetchError) {
        console.error('❌ Error fetching batch:', fetchError);
        break;
      }

      if (!batch || batch.length === 0) {
        console.log('✅ No more products to convert');
        break;
      }

      // Convert each product in batch
      for (const product of batch) {
        try {
          // Parse text embedding to vector
          let embeddingVec = null;
          let imageEmbeddingVec = null;

          if (product.embedding) {
            if (typeof product.embedding === 'string') {
              embeddingVec = product.embedding; // PostgreSQL will handle the cast
            }
          }

          if (product.image_embedding) {
            if (typeof product.image_embedding === 'string') {
              imageEmbeddingVec = product.image_embedding;
            }
          }

          // Update with vector columns
          const { error: updateError } = await supabase
            .from('products')
            .update({
              embedding_vec: embeddingVec,
              image_embedding_vec: imageEmbeddingVec
            })
            .eq('id', product.id);

          if (updateError) {
            console.error(`  ❌ Failed to convert product ${product.id}:`, updateError.message);
          }
        } catch (err) {
          console.error(`  ❌ Error converting product ${product.id}:`, err.message);
        }
      }

      processedTotal += batch.length;

      // Progress update
      const progress = ((processedTotal / totalCount) * 100).toFixed(1);
      console.log(`  Progress: ${processedTotal}/${totalCount} (${progress}%)`);

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('');
    console.log('✅ Batch conversion complete!');
  }

  // Phase 4: Finalization
  console.log('');
  console.log('Phase 4: Finalization');
  console.log('Please run these commands in Supabase SQL Editor:');
  console.log('');
  console.log('BEGIN;');
  console.log('ALTER TABLE products DROP COLUMN IF EXISTS embedding CASCADE;');
  console.log('ALTER TABLE products DROP COLUMN IF EXISTS image_embedding CASCADE;');
  console.log('ALTER TABLE products RENAME COLUMN embedding_vec TO embedding;');
  console.log('ALTER TABLE products RENAME COLUMN image_embedding_vec TO image_embedding;');
  console.log('');
  console.log('-- Create indexes');
  console.log('CREATE INDEX IF NOT EXISTS products_embedding_idx');
  console.log('ON products USING ivfflat (embedding vector_cosine_ops)');
  console.log('WITH (lists = 100);');
  console.log('');
  console.log('CREATE INDEX IF NOT EXISTS products_image_embedding_idx');
  console.log('ON products USING ivfflat (image_embedding vector_cosine_ops)');
  console.log('WITH (lists = 100);');
  console.log('');
  console.log('ANALYZE products;');
  console.log('COMMIT;');
  console.log('');
  console.log('After running the above, test search with:');
  console.log('node scripts/test-search-detailed.mjs');
  console.log('');
}

fixEmbeddings()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Script failed:', error);
    console.error(error.stack);
    process.exit(1);
  });

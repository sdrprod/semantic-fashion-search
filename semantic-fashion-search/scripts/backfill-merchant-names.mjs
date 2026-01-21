#!/usr/bin/env node

/**
 * Backfill merchant_name for existing products
 * For Impact products, merchant_name = brand (Manufacturer field from API)
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

async function backfillMerchantNames() {
  console.log('='.repeat(70));
  console.log('BACKFILL MERCHANT NAMES');
  console.log('='.repeat(70));
  console.log('');

  // Step 1: Count products without merchant_name
  console.log('Step 1: Counting products without merchant_name...');
  const { count: nullCount } = await supabase
    .from('products')
    .select('id', { count: 'exact', head: true })
    .is('merchant_name', null);

  console.log(`   Found ${nullCount} products without merchant_name`);
  console.log('');

  if (nullCount === 0) {
    console.log('✅ All products already have merchant_name!');
    return;
  }

  // Step 2: Update merchant_name from brand for Impact products
  console.log('Step 2: Updating merchant_name from brand field...');
  console.log('   (For Impact products, merchant_name = Manufacturer = brand)');
  console.log('');

  // Update in batches using raw SQL (ctid-based for safety)
  const batchSize = 10000;
  let totalUpdated = 0;
  let batchNum = 0;

  console.log(`   Updating in batches of ${batchSize}...`);
  console.log('');

  while (true) {
    batchNum++;
    console.log(`   Batch ${batchNum}: Updating up to ${batchSize} products...`);

    // Use raw SQL with ctid-based batching (safe for large tables)
    const { data, error } = await supabase.rpc('exec_sql', {
      query: `
        WITH chunk AS (
          SELECT ctid
          FROM products
          WHERE merchant_name IS NULL
            AND brand IS NOT NULL
          LIMIT ${batchSize}
        )
        UPDATE products p
        SET merchant_name = brand
        FROM chunk
        WHERE p.ctid = chunk.ctid
        RETURNING p.id
      `
    });

    // If RPC doesn't work, use alternative approach with individual queries
    if (error) {
      console.log('   Using alternative batch method...');

      // Get batch of products
      const { data: batch, error: fetchError } = await supabase
        .from('products')
        .select('id, brand')
        .is('merchant_name', null)
        .not('brand', 'is', null)
        .limit(batchSize);

      if (fetchError) {
        console.error('❌ Error fetching batch:', fetchError);
        break;
      }

      if (!batch || batch.length === 0) {
        console.log('   No more products to update');
        break;
      }

      // Update each product individually (slower but works)
      let batchUpdated = 0;
      for (const product of batch) {
        const { error: updateError } = await supabase
          .from('products')
          .update({ merchant_name: product.brand })
          .eq('id', product.id);

        if (!updateError) {
          batchUpdated++;
        }
      }

      totalUpdated += batchUpdated;
      console.log(`   ✅ Batch ${batchNum}: Updated ${batchUpdated} products (Total: ${totalUpdated})`);

      if (batch.length < batchSize) {
        console.log('   Reached end of products');
        break;
      }
    } else {
      // RPC worked - count updated rows
      const rowsUpdated = data?.length || 0;
      totalUpdated += rowsUpdated;
      console.log(`   ✅ Batch ${batchNum}: Updated ${rowsUpdated} products (Total: ${totalUpdated})`);

      if (rowsUpdated === 0) {
        console.log('   No more products to update');
        break;
      }
    }

    // Rate limiting between batches
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  console.log('');
  console.log(`Total updated: ${totalUpdated} products`);

  console.log('');
  console.log('='.repeat(70));
  console.log('VERIFICATION');
  console.log('='.repeat(70));

  // Verify the update
  const { count: remainingNull } = await supabase
    .from('products')
    .select('id', { count: 'exact', head: true })
    .is('merchant_name', null);

  const { count: withMerchant } = await supabase
    .from('products')
    .select('id', { count: 'exact', head: true })
    .not('merchant_name', 'is', null);

  console.log(`✅ Updated: ${updated} products`);
  console.log(`   With merchant_name: ${withMerchant}`);
  console.log(`   Still null: ${remainingNull}`);
  console.log('');

  // Show sample of updated products
  console.log('Sample updated products:');
  const { data: samples } = await supabase
    .from('products')
    .select('brand, merchant_name, title')
    .not('merchant_name', 'is', null)
    .limit(10);

  samples?.forEach((p, i) => {
    console.log(`   ${i + 1}. Brand: ${p.brand} | Merchant: ${p.merchant_name}`);
    console.log(`      ${p.title.slice(0, 60)}...`);
  });
  console.log('');
}

backfillMerchantNames()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  });

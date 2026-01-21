#!/usr/bin/env node

/**
 * Backfill sale detection for existing products
 * Detects "sale" or "on sale" in title, description, or other text fields
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

/**
 * Check if product text indicates it's on sale
 */
function detectSale(product) {
  const text = [
    product.title || '',
    product.description || '',
  ].join(' ').toLowerCase();

  // Check for "sale" or "on sale" patterns
  return /\b(on\s+)?sale\b/.test(text);
}

async function backfillSaleDetection() {
  console.log('='.repeat(70));
  console.log('BACKFILL SALE DETECTION');
  console.log('='.repeat(70));
  console.log('');

  // Step 1: Get total count
  console.log('Step 1: Counting products...');
  const { count: totalCount, error: countError } = await supabase
    .from('products')
    .select('id', { count: 'exact', head: true });

  if (countError) {
    console.error('❌ Failed to count products:', countError);
    return;
  }

  console.log(`   Total products: ${totalCount}`);
  console.log('');

  // Step 2: Fetch all products in batches
  console.log('Step 2: Fetching all products in batches...');
  const batchSize = 1000;
  const allProducts = [];

  for (let offset = 0; offset < totalCount; offset += batchSize) {
    const { data: batch, error: fetchError } = await supabase
      .from('products')
      .select('id, title, description, on_sale, brand')
      .range(offset, offset + batchSize - 1);

    if (fetchError) {
      console.error(`❌ Failed to fetch batch at offset ${offset}:`, fetchError);
      continue;
    }

    allProducts.push(...batch);
    console.log(`   Fetched ${allProducts.length}/${totalCount} products...`);
  }

  console.log(`   ✅ Fetched ${allProducts.length} products`);
  console.log('');

  // Step 3: Detect sale status
  console.log('Step 3: Detecting sale status...');
  let onSaleCount = 0;
  let alreadyMarked = 0;
  const updates = [];

  for (const product of allProducts) {
    const isOnSale = detectSale(product);

    if (isOnSale) {
      onSaleCount++;

      // Only update if status changed
      if (!product.on_sale) {
        updates.push({
          id: product.id,
          on_sale: true
        });
      } else {
        alreadyMarked++;
      }
    } else if (product.on_sale) {
      // Product was marked on sale but no longer is
      updates.push({
        id: product.id,
        on_sale: false
      });
    }
  }

  console.log(`   Products on sale: ${onSaleCount}`);
  console.log(`   Already marked correctly: ${alreadyMarked}`);
  console.log(`   Need updating: ${updates.length}`);
  console.log('');

  // Show brand distribution of sale items for debugging
  const saleBrands = allProducts
    .filter(p => detectSale(p))
    .reduce((acc, p) => {
      const brand = p.brand || 'Unknown';
      acc[brand] = (acc[brand] || 0) + 1;
      return acc;
    }, {});

  const topBrands = Object.entries(saleBrands)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  if (topBrands.length > 0) {
    console.log('   Top brands with sale items:');
    topBrands.forEach(([brand, count]) => {
      console.log(`     ${brand}: ${count} items`);
    });
    console.log('');
  }

  if (updates.length === 0) {
    console.log('✅ All products already have correct sale status!');
    return;
  }

  // Step 4: Update in batches
  console.log('Step 4: Updating products...');
  const updateBatchSize = 100;
  let updated = 0;

  for (let i = 0; i < updates.length; i += updateBatchSize) {
    const batch = updates.slice(i, i + updateBatchSize);

    // Update each product individually (Supabase doesn't support batch upsert well)
    for (const update of batch) {
      const { error: updateError } = await supabase
        .from('products')
        .update({ on_sale: update.on_sale })
        .eq('id', update.id);

      if (!updateError) {
        updated++;
      }
    }

    console.log(`   Updated ${updated}/${updates.length} products...`);
  }

  console.log('');
  console.log(`✅ Updated ${updated} products`);
  console.log('');

  // Step 5: Verification
  console.log('='.repeat(70));
  console.log('VERIFICATION');
  console.log('='.repeat(70));

  const { count: totalOnSale } = await supabase
    .from('products')
    .select('id', { count: 'exact', head: true })
    .eq('on_sale', true);

  console.log(`Products marked on sale: ${totalOnSale}`);
  console.log('');

  // Sample sale products
  console.log('Sample products on sale:');
  const { data: samples } = await supabase
    .from('products')
    .select('brand, merchant_name, title, on_sale')
    .eq('on_sale', true)
    .limit(10);

  if (samples && samples.length > 0) {
    samples.forEach((p, i) => {
      const displayBrand = p.brand !== 'Unknown' ? p.brand : (p.merchant_name || 'Unknown');
      console.log(`   ${i + 1}. ${displayBrand} - ${p.title.slice(0, 60)}...`);
    });
  } else {
    console.log('   (No fashion products marked as on sale)');
  }
  console.log('');
}

backfillSaleDetection()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  });

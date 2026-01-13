#!/usr/bin/env node

/**
 * Rollback Bad Impact.com Sync
 *
 * Deletes products added during the unfiltered Impact.com sync
 * that added 6,763 products without proper men's/non-apparel filters.
 *
 * USAGE: node scripts/rollback-bad-sync.mjs
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, '..', '.env.local');
dotenv.config({ path: envPath });

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function rollbackBadSync() {
  console.log('🔄 ROLLBACK BAD SYNC SESSION\n');

  try {
    // Get current count
    const { count: beforeCount } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true });

    console.log(`📊 Current database: ${beforeCount} products`);
    console.log(`📊 Expected after rollback: ~6,373 products\n`);

    // Strategy: Delete the most recently added products
    // The sync started when we had 6,373 products
    // We now have 13,136 products
    // So we need to delete the ~6,763 newest products

    const PRODUCTS_TO_DELETE = beforeCount - 6373;

    if (PRODUCTS_TO_DELETE <= 0) {
      console.log('✅ Nothing to rollback - count is already at or below 6,373');
      return;
    }

    console.log(`🎯 Will delete ${PRODUCTS_TO_DELETE} most recent products\n`);

    // Get the newest products in batches (Supabase has 1000 row limit)
    console.log('📦 Fetching recently added products...');
    const recentProducts = [];
    const fetchBatchSize = 1000;
    let offset = 0;

    while (offset < PRODUCTS_TO_DELETE) {
      const { data: batch, error: fetchError } = await supabase
        .from('products')
        .select('id, title, created_at')
        .order('created_at', { ascending: false })
        .range(offset, offset + fetchBatchSize - 1);

      if (fetchError) {
        throw new Error(`Failed to fetch products: ${fetchError.message}`);
      }

      if (batch.length === 0) break;

      recentProducts.push(...batch);
      offset += fetchBatchSize;

      console.log(`   Fetched ${recentProducts.length}/${PRODUCTS_TO_DELETE}...`);
    }

    console.log(`✅ Found ${recentProducts.length} products to delete\n`);

    // Show sample
    console.log('🔍 Sample of products to be deleted:');
    recentProducts.slice(0, 10).forEach((p, i) => {
      console.log(`   ${i + 1}. "${p.title.slice(0, 60)}${p.title.length > 60 ? '...' : ''}"`);
      console.log(`      Created: ${new Date(p.created_at).toLocaleString()}`);
    });

    if (recentProducts.length > 10) {
      console.log(`   ... and ${recentProducts.length - 10} more\n`);
    } else {
      console.log('');
    }

    // Confirm
    console.log('⚠️  WARNING: This will permanently delete these products!');
    console.log('   Press Ctrl+C to cancel, or wait 5 seconds to proceed...\n');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Delete in batches
    console.log('🗑️  Deleting products...');
    const batchSize = 100;
    let deleted = 0;

    const ids = recentProducts.map(p => p.id);

    for (let i = 0; i < ids.length; i += batchSize) {
      const batch = ids.slice(i, i + batchSize);

      const { error: deleteError } = await supabase
        .from('products')
        .delete()
        .in('id', batch);

      if (deleteError) {
        console.error(`   ❌ Error deleting batch ${Math.floor(i / batchSize) + 1}:`, deleteError.message);
      } else {
        deleted += batch.length;
        console.log(`   ✅ Deleted batch ${Math.floor(i / batchSize) + 1} (${deleted}/${ids.length} total)`);
      }
    }

    // Final count
    const { count: afterCount } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true });

    console.log('\n✨ ROLLBACK COMPLETE!');
    console.log(`   Deleted: ${deleted} products`);
    console.log(`   Before: ${beforeCount} products`);
    console.log(`   After: ${afterCount} products\n`);

  } catch (error) {
    console.error('❌ Error during rollback:', error);
    process.exit(1);
  }
}

// Run rollback
rollbackBadSync();

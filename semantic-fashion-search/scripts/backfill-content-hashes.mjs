#!/usr/bin/env node

/**
 * Backfill content_hash for existing products
 * This updates all products that don't have a content_hash yet
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Deduplication functions
function normalizeText(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizePriceBucket(price) {
  if (!price || price <= 0) return 'no-price';
  const bucket = Math.round(price / 5) * 5;
  return `$${bucket}`;
}

function extractCoreTitle(title) {
  let core = title.toLowerCase();
  core = core.replace(/\b(for women|women's|womens|ladies|female)\b/g, '');
  core = core.replace(/\b(clothes|clothing|apparel|wear)\b/g, '');
  core = core.replace(/\b(size|sz|small|medium|large|xl+|[0-9]+)\b/g, '');
  core = core.replace(/\b(black|white|gray|grey|blue|red|green|pink|purple|navy|beige)\b/g, '');
  core = core.replace(/\s+/g, ' ').trim();
  return core;
}

function generateContentHash(product) {
  const coreTitle = extractCoreTitle(product.title);
  const normalizedBrand = normalizeText(product.brand);
  const priceBucket = normalizePriceBucket(product.price);
  return `${coreTitle}|${normalizedBrand}|${priceBucket}`;
}

async function backfillContentHashes() {
  console.log('\n🔄 Backfilling content hashes for existing products...\n');

  // Fetch all products without content_hash (in batches)
  console.log('📦 Fetching products...');

  let allProducts = [];
  let page = 0;
  const pageSize = 1000;
  let hasMore = true;

  while (hasMore) {
    const { data: batch, error } = await supabase
      .from('products')
      .select('id, title, brand, price')
      .is('content_hash', null)
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (error) {
      console.error('❌ Error fetching products:', error.message);
      process.exit(1);
    }

    if (batch && batch.length > 0) {
      allProducts = allProducts.concat(batch);
      page++;
      process.stdout.write(`  Fetched: ${allProducts.length} products...\r`);
      hasMore = batch.length === pageSize;
    } else {
      hasMore = false;
    }
  }

  const products = allProducts;

  console.log(''); // New line after progress

  if (!products || products.length === 0) {
    console.log('✅ All products already have content hashes!');
    return;
  }

  console.log(`Found ${products.length} products to update\n`);

  // Update in batches
  const batchSize = 50;
  let updated = 0;
  let errors = 0;

  for (let i = 0; i < products.length; i += batchSize) {
    const batch = products.slice(i, i + batchSize);

    console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(products.length / batchSize)}...`);

    for (const product of batch) {
      const contentHash = generateContentHash(product);

      const { error: updateError } = await supabase
        .from('products')
        .update({ content_hash: contentHash })
        .eq('id', product.id);

      if (updateError) {
        console.error(`  ❌ Error updating product ${product.id}:`, updateError.message);
        errors++;
      } else {
        updated++;
      }
    }

    process.stdout.write(`  Updated: ${updated}/${products.length}\r`);

    // Small delay to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log(`\n\n✅ Backfill complete!`);
  console.log(`   Updated: ${updated}`);
  console.log(`   Errors: ${errors}\n`);
}

backfillContentHashes()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
  });

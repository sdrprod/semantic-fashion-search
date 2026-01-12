#!/usr/bin/env node

/**
 * Deduplicate products in the database
 * - Generates content hashes for all products
 * - Identifies duplicates
 * - Keeps the best version of each duplicate
 * - Removes inferior duplicates
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Deduplication functions (copied from lib/deduplication.ts)
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

function generateProductFingerprint(product) {
  const coreTitle = extractCoreTitle(product.title);
  const normalizedBrand = normalizeText(product.brand);
  const priceBucket = normalizePriceBucket(product.price);
  return `${coreTitle}|${normalizedBrand}|${priceBucket}`;
}

function calculateQualityScore(product) {
  let score = 0;
  if (product.title.length > 50) score += 2;
  else if (product.title.length > 30) score += 1;

  if (product.description && product.description.length > 100) score += 3;
  else if (product.description && product.description.length > 50) score += 2;
  else if (product.description && product.description.length > 0) score += 1;

  if (product.price && product.price > 0) score += 2;

  if (product.brand && product.brand !== 'Unknown' && product.brand.trim() !== '') {
    score += 2;
  }

  if (product.image_url && product.image_url.trim() !== '') score += 1;

  return score;
}

async function deduplicateProducts(dryRun = true) {
  console.log('\n🔍 Starting product deduplication...');
  console.log(`Mode: ${dryRun ? 'DRY RUN (no changes)' : 'LIVE (will delete duplicates)'}\n`);

  // Step 1: Fetch all products (in batches to avoid limits)
  console.log('📦 Fetching all products...');

  let allProducts = [];
  let page = 0;
  const pageSize = 1000;
  let hasMore = true;

  while (hasMore) {
    const { data: batch, error } = await supabase
      .from('products')
      .select('id, title, description, brand, price, image_url, affiliate_network, created_at')
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

  console.log(`\nFound ${products.length} total products\n`);

  // Step 2: Generate content hashes and group by hash
  console.log('🔨 Generating content hashes...');
  const hashGroups = new Map();

  for (const product of products) {
    const hash = generateProductFingerprint(product);

    if (!hashGroups.has(hash)) {
      hashGroups.set(hash, []);
    }
    hashGroups.get(hash).push(product);
  }

  // Step 3: Find duplicate groups
  const duplicateGroups = Array.from(hashGroups.values()).filter(group => group.length > 1);
  const uniqueProducts = hashGroups.size;
  const totalDuplicates = products.length - uniqueProducts;

  console.log(`\n📊 Deduplication Analysis:`);
  console.log(`   Unique products: ${uniqueProducts}`);
  console.log(`   Duplicate groups: ${duplicateGroups.length}`);
  console.log(`   Total duplicates: ${totalDuplicates}`);
  console.log(`   Deduplication rate: ${((totalDuplicates / products.length) * 100).toFixed(1)}%\n`);

  if (duplicateGroups.length === 0) {
    console.log('✅ No duplicates found!');
    return;
  }

  // Step 4: Show sample duplicate groups
  console.log('📋 Sample duplicate groups (first 5):\n');
  console.log('='.repeat(100));

  for (let i = 0; i < Math.min(5, duplicateGroups.length); i++) {
    const group = duplicateGroups[i];
    console.log(`\n[Group ${i + 1}] ${group.length} duplicates:`);

    group.forEach((product, index) => {
      const qualityScore = calculateQualityScore(product);
      console.log(`  ${index + 1}. [Score: ${qualityScore}] ${product.title.substring(0, 80)}...`);
      console.log(`     Brand: ${product.brand} | Price: $${product.price} | Network: ${product.affiliate_network}`);
      console.log(`     ID: ${product.id}`);
    });
  }

  console.log('\n' + '='.repeat(100));

  // Step 5: Process duplicates (keep best, mark others for deletion)
  let toDelete = [];

  for (const group of duplicateGroups) {
    // Calculate quality scores
    const scored = group.map(p => ({
      product: p,
      qualityScore: calculateQualityScore(p),
    }));

    // Sort by quality (desc), then price (asc), then date (desc)
    scored.sort((a, b) => {
      if (a.qualityScore !== b.qualityScore) {
        return b.qualityScore - a.qualityScore;
      }
      const priceA = a.product.price || Infinity;
      const priceB = b.product.price || Infinity;
      if (priceA !== priceB) {
        return priceA - priceB;
      }
      const dateA = new Date(a.product.created_at).getTime();
      const dateB = new Date(b.product.created_at).getTime();
      return dateB - dateA;
    });

    // Keep the first (best), mark rest for deletion
    const [best, ...rest] = scored;
    toDelete.push(...rest.map(s => s.product.id));
  }

  console.log(`\n🗑️  Products to delete: ${toDelete.length}`);

  if (dryRun) {
    console.log('\n⚠️  DRY RUN - No changes made');
    console.log('Run with --live flag to actually delete duplicates\n');
    return;
  }

  // Step 6: Delete duplicates in batches
  console.log('\n🔄 Deleting duplicates...');
  const batchSize = 100;
  let deleted = 0;

  for (let i = 0; i < toDelete.length; i += batchSize) {
    const batch = toDelete.slice(i, i + batchSize);
    const { error } = await supabase
      .from('products')
      .delete()
      .in('id', batch);

    if (error) {
      console.error(`❌ Error deleting batch: ${error.message}`);
    } else {
      deleted += batch.length;
      process.stdout.write(`   Deleted: ${deleted} / ${toDelete.length}\r`);
    }
  }

  console.log(`\n✅ Deduplication complete!`);
  console.log(`   Deleted: ${deleted} duplicates`);
  console.log(`   Remaining: ${uniqueProducts} unique products\n`);
}

// Parse command line args
const isLive = process.argv.includes('--live');

// Run deduplication
deduplicateProducts(!isLive)
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
  });

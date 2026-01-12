#!/usr/bin/env node

/**
 * Cleanup Bad Products from Database
 *
 * Removes products that match the new filter criteria:
 * 1. Men's products
 * 2. Non-apparel materials (fabric, upholstery)
 * 3. Products under $20
 *
 * Run: node scripts/cleanup-bad-products.mjs
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

/**
 * Decode HTML entities
 */
function decodeHtmlEntities(text) {
  if (!text) return '';
  return text
    .replace(/&#039;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ');
}

/**
 * Check if product is for men
 */
function isMensProduct(title, description) {
  const mensTerms = [
    "men's", 'mens', "mens'", 'for men', 'for him', 'men only',
    'male', 'masculine', 'man ', 'gentleman', "gentleman's",
    'boys', "boy's", 'men ', 'menswear', 'mens pants', 'mens shirt',
    'mens jacket', 'mens suit', 'mens shoe', 'mens wear'
  ];

  const decodedTitle = decodeHtmlEntities(title);
  const decodedDescription = decodeHtmlEntities(description || '');
  const combinedText = `${decodedTitle} ${decodedDescription}`.toLowerCase();

  return mensTerms.some(term => combinedText.includes(term));
}

/**
 * Check if product is raw fabric or non-apparel material
 */
function isNonApparelMaterial(title, description) {
  const materialTerms = [
    'fabric by the yard', 'by the yard', 'fabric diy', 'diy material',
    'upholstery fabric', 'sofa fabric', 'cushion cover fabric',
    'curtain fabric', 'canvas fabric', 'raw fabric', 'cloth material',
    'bed-sheeting material', 'bedding fabric', 'home decor fabric',
    'craft fabric', 'sewing fabric', 'textile material', 'yard fabric',
    'width ', 'wide ', 'per yard', '/yard', 'fabric wholesale',
    'coral velvet fabric', 'flannel fabric', 'linen fabric',
    'cotton fabric', 'canvas by', 'material by', 'upholstery sofa',
    'cushion covers fabric', 'diy matreial', 'diy materia'
  ];

  const combinedText = `${title} ${description || ''}`.toLowerCase();

  // Check for fabric/material indicators
  const hasMaterialTerm = materialTerms.some(term => combinedText.includes(term));

  // Check for measurements indicating raw fabric
  const hasFabricMeasurement = /width\s*\d+|wide\s*\d+/i.test(combinedText);

  return hasMaterialTerm || hasFabricMeasurement;
}

/**
 * Check if product should be deleted
 */
function shouldDelete(product) {
  const reasons = [];

  // Check men's products
  if (isMensProduct(product.title, product.description)) {
    reasons.push("Men's product");
  }

  // Check non-apparel materials
  if (isNonApparelMaterial(product.title, product.description)) {
    reasons.push('Non-apparel material');
  }

  // Check price threshold
  if (product.price !== null && product.price !== undefined && product.price < 20) {
    reasons.push(`Price under $20 ($${product.price})`);
  }

  return { shouldDelete: reasons.length > 0, reasons };
}

/**
 * Main cleanup function
 */
async function cleanupBadProducts() {
  console.log('🧹 Starting cleanup of bad products...\n');

  try {
    // Fetch all products
    console.log('📦 Fetching all products from database...');
    const { data: products, error: fetchError } = await supabase
      .from('products')
      .select('*');

    if (fetchError) {
      throw new Error(`Failed to fetch products: ${fetchError.message}`);
    }

    console.log(`✅ Found ${products.length} total products\n`);

    // Analyze products
    const toDelete = [];
    const stats = {
      mensProducts: 0,
      nonApparel: 0,
      underPrice: 0,
      total: 0,
    };

    for (const product of products) {
      const { shouldDelete: doDelete, reasons } = shouldDelete(product);

      if (doDelete) {
        toDelete.push({ id: product.id, title: product.title, reasons });
        stats.total++;

        // Count by reason
        reasons.forEach(reason => {
          if (reason.includes("Men's")) stats.mensProducts++;
          if (reason.includes('Non-apparel')) stats.nonApparel++;
          if (reason.includes('Price under')) stats.underPrice++;
        });
      }
    }

    // Display summary
    console.log('📊 CLEANUP SUMMARY:');
    console.log(`   Total products to delete: ${stats.total}`);
    console.log(`   - Men's products: ${stats.mensProducts}`);
    console.log(`   - Non-apparel materials: ${stats.nonApparel}`);
    console.log(`   - Products under $20: ${stats.underPrice}\n`);

    if (toDelete.length === 0) {
      console.log('✨ No bad products found! Database is clean.');
      return;
    }

    // Show examples
    console.log('🔍 Examples of products to delete:');
    toDelete.slice(0, 10).forEach((item, i) => {
      console.log(`   ${i + 1}. "${item.title.slice(0, 70)}${item.title.length > 70 ? '...' : ''}"`);
      console.log(`      Reasons: ${item.reasons.join(', ')}`);
    });

    if (toDelete.length > 10) {
      console.log(`   ... and ${toDelete.length - 10} more\n`);
    } else {
      console.log('');
    }

    // Confirm deletion
    console.log('⚠️  WARNING: This will permanently delete these products from the database!');
    console.log('   Press Ctrl+C to cancel, or wait 5 seconds to proceed...\n');

    await new Promise(resolve => setTimeout(resolve, 5000));

    // Delete in batches
    console.log('🗑️  Deleting products...');
    const batchSize = 100;
    let deleted = 0;

    for (let i = 0; i < toDelete.length; i += batchSize) {
      const batch = toDelete.slice(i, i + batchSize);
      const ids = batch.map(p => p.id);

      const { error: deleteError } = await supabase
        .from('products')
        .delete()
        .in('id', ids);

      if (deleteError) {
        console.error(`   ❌ Error deleting batch ${Math.floor(i / batchSize) + 1}:`, deleteError.message);
      } else {
        deleted += batch.length;
        console.log(`   ✅ Deleted batch ${Math.floor(i / batchSize) + 1} (${deleted}/${toDelete.length} total)`);
      }
    }

    console.log('\n✨ CLEANUP COMPLETE!');
    console.log(`   Deleted: ${deleted} products`);
    console.log(`   Remaining: ${products.length - deleted} products\n`);

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  }
}

// Run cleanup
cleanupBadProducts();

#!/usr/bin/env node

/**
 * Cleanup Unchecked Products (Option 2)
 *
 * SAFE TARGETED CLEANUP:
 * - Only checks products that were NEVER checked by the buggy cleanup
 * - Leaves the first 1,000 products alone (already survived cleanup)
 * - Uses FIXED filters (men's, non-apparel, price)
 * - Conservative approach to preserve good data
 *
 * Run ONLY if you see men's products in search results after Option 1
 *
 * USAGE: node scripts/cleanup-unchecked-products.mjs
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
 * Check if product is for men (FIXED VERSION with word boundaries)
 */
function isMensProduct(title, description) {
  const decodedTitle = decodeHtmlEntities(title);
  const decodedDescription = decodeHtmlEntities(description || '');
  const combinedText = `${decodedTitle} ${decodedDescription}`.toLowerCase();

  // Use word boundaries to avoid false positives like "womens" matching "mens"
  const mensPatterns = [
    /\bmen'?s\b/,           // "men's" or "mens" as whole word
    /\bfor men\b/,
    /\bfor him\b/,
    /\bmen only\b/,
    /\bmale\b/,
    /\bmasculine\b/,
    /\bgentleman'?s?\b/,    // "gentleman" or "gentleman's"
    /\bboys?\b/,            // "boy" or "boys"
    /\bboy'?s\b/,           // "boy's"
    /\bmenswear\b/,
  ];

  // Check if text contains "women" or "woman" - if so, be more strict
  const hasWomen = /\bwom[ae]n'?s?\b/.test(combinedText);

  if (hasWomen) {
    // If it mentions women, only flag if it ALSO explicitly mentions men
    // and men appears more prominently
    const menMatches = (combinedText.match(/\bmen'?s?\b/g) || []).length;
    const womenMatches = (combinedText.match(/\bwom[ae]n'?s?\b/g) || []).length;

    // Only flag as men's if men is mentioned more than women
    if (menMatches <= womenMatches) {
      return false;
    }
  }

  return mensPatterns.some(pattern => pattern.test(combinedText));
}

/**
 * Check if product is raw fabric or non-apparel material
 */
function isNonApparelMaterial(title, description) {
  const materialTerms = [
    // Fabric/Material terms
    'fabric by the yard', 'by the yard', 'fabric diy', 'diy material',
    'upholstery fabric', 'sofa fabric', 'cushion cover fabric',
    'curtain fabric', 'canvas fabric', 'raw fabric', 'cloth material',
    'bed-sheeting material', 'bedding fabric', 'home decor fabric',
    'craft fabric', 'sewing fabric', 'textile material', 'yard fabric',
    'width ', 'wide ', 'per yard', '/yard', 'fabric wholesale',
    'coral velvet fabric', 'flannel fabric', 'linen fabric',
    'cotton fabric', 'canvas by', 'material by', 'upholstery sofa',
    'cushion covers fabric', 'diy matreial', 'diy materia',
    'fabric swatch', 'material swatch', 'fabric sample',
    'quilting fabric', 'patchwork fabric', 'fabric bolt',

    // Home decor (non-wearable)
    'throw pillow', 'pillow cover', 'cushion cover', 'bedding set',
    'duvet cover', 'comforter set', 'bed sheet', 'table cloth',
    'tablecloth', 'placemat', 'napkin set', 'window curtain',
    'shower curtain', 'bath mat', 'area rug', 'carpet',
    'wall tapestry', 'wall hanging', 'home textile',

    // Craft/DIY supplies
    'craft supply', 'sewing notion', 'zipper by', 'button pack',
    'elastic by', 'ribbon by', 'trim by', 'lace by',

    // Measurements indicating raw materials
    'meters length', 'yards length', 'cm width', 'inch width',
  ];

  const combinedText = `${title} ${description}`.toLowerCase();

  // Check for fabric/material indicators
  const hasMaterialTerm = materialTerms.some(term => combinedText.includes(term));

  // Check for measurements indicating raw fabric
  const hasFabricMeasurement = /width\s*\d+|wide\s*\d+|length\s*\d+|meters?\s+long|yards?\s+long/i.test(combinedText);

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
async function cleanupUncheckedProducts() {
  console.log('🧹 TARGETED CLEANUP: Unchecked Products Only\n');

  try {
    // Get total count
    const { count: totalCount } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true });

    console.log(`📊 Total products: ${totalCount}`);
    console.log(`📊 First 1,000: Already checked (SKIPPING)`);
    console.log(`📊 Remaining ${totalCount - 1000}: Will check with FIXED filters\n`);

    // Get the IDs of the first 1,000 products (by creation time)
    console.log('📦 Identifying first 1,000 products to skip...');
    const { data: first1000 } = await supabase
      .from('products')
      .select('id')
      .order('created_at', { ascending: true })
      .limit(1000);

    const skipIds = new Set(first1000.map(p => p.id));
    console.log(`✅ Will skip ${skipIds.size} products\n`);

    // Fetch unchecked products in batches
    console.log('📦 Fetching unchecked products...');
    const uncheckedProducts = [];
    const batchSize = 1000;
    let offset = 1000; // Start after first 1,000

    while (offset < totalCount) {
      const { data: batch } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: true })
        .range(offset, offset + batchSize - 1);

      if (!batch || batch.length === 0) break;

      uncheckedProducts.push(...batch);
      offset += batchSize;
      console.log(`   Fetched ${uncheckedProducts.length}...`);
    }

    console.log(`✅ Found ${uncheckedProducts.length} unchecked products\n`);

    // Analyze products
    const toDelete = [];
    const stats = {
      mensProducts: 0,
      nonApparel: 0,
      underPrice: 0,
      total: 0,
    };

    for (const product of uncheckedProducts) {
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
      console.log('✨ No bad products found! All unchecked products are good.');
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
    console.log('⚠️  WARNING: This will permanently delete these products!');
    console.log('   Press Ctrl+C to cancel, or wait 5 seconds to proceed...\n');

    await new Promise(resolve => setTimeout(resolve, 5000));

    // Delete in batches
    console.log('🗑️  Deleting products...');
    const deleteBatchSize = 100;
    let deleted = 0;

    for (let i = 0; i < toDelete.length; i += deleteBatchSize) {
      const batch = toDelete.slice(i, i + deleteBatchSize);
      const ids = batch.map(p => p.id);

      const { error: deleteError } = await supabase
        .from('products')
        .delete()
        .in('id', ids);

      if (deleteError) {
        console.error(`   ❌ Error deleting batch ${Math.floor(i / deleteBatchSize) + 1}:`, deleteError.message);
      } else {
        deleted += batch.length;
        console.log(`   ✅ Deleted batch ${Math.floor(i / deleteBatchSize) + 1} (${deleted}/${toDelete.length} total)`);
      }
    }

    // Final count
    const { count: afterCount } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true });

    console.log('\n✨ CLEANUP COMPLETE!');
    console.log(`   Deleted: ${deleted} products`);
    console.log(`   Before: ${totalCount} products`);
    console.log(`   After: ${afterCount} products\n`);

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  }
}

// Run cleanup
cleanupUncheckedProducts();

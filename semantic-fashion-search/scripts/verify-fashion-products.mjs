#!/usr/bin/env node

/**
 * Verify all products in database are actually fashion items
 * Uses the same logic as the sync quality filter
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

// Same fashion keywords used in impact.ts
const FASHION_KEYWORDS = [
  'dress', 'dresses', 'top', 'tops', 'blouse', 'shirt', 'pants', 'jeans',
  'skirt', 'shorts', 'jacket', 'coat', 'blazer', 'sweater', 'cardigan',
  'tshirt', 't-shirt', 'hoodie', 'sweatshirt', 'leggings', 'jumpsuit',
  'shoes', 'heels', 'boots', 'sandals', 'sneakers', 'flats', 'pumps',
  'loafers', 'slippers', 'wedges', 'footwear',
  'bag', 'handbag', 'purse', 'tote', 'clutch', 'backpack', 'wallet',
  'jewelry', 'necklace', 'earrings', 'bracelet', 'ring', 'watch',
  'scarf', 'belt', 'hat', 'cap', 'sunglasses', 'accessories',
  'fashion', 'women', 'mens', 'clothing', 'apparel', 'wear', 'outfit',
];

// Obvious non-fashion items
const DEFINITELY_NOT_FASHION = [
  'phone case', 'iphone', 'samsung', 'charger', 'cable', 'adapter',
  'kitchen knife', 'cookware', 'pot', 'pan', 'utensil',
  'furniture', 'chair', 'table', 'desk', 'shelf',
  'electronics', 'computer', 'laptop', 'tablet', 'monitor',
  'toy car', 'action figure', 'board game', 'puzzle',
  'tool kit', 'drill', 'hammer', 'screwdriver',
  'pet food', 'dog collar', 'cat toy', 'aquarium',
  'home decor', 'picture frame', 'vase', 'candle holder'
];

function isFashionProduct(title, description, category) {
  const text = `${title} ${description || ''} ${category || ''}`.toLowerCase();
  return FASHION_KEYWORDS.some(keyword => text.includes(keyword));
}

function isDefinitelyNotFashion(title, description) {
  const text = `${title} ${description || ''}`.toLowerCase();
  return DEFINITELY_NOT_FASHION.some(phrase => text.includes(phrase));
}

async function verifyFashionProducts() {
  console.log('='.repeat(70));
  console.log('VERIFYING FASHION PRODUCTS IN DATABASE');
  console.log('='.repeat(70));
  console.log('');

  // Get total count
  const { count: total } = await supabase
    .from('products')
    .select('id', { count: 'exact', head: true });

  console.log(`Total products: ${total}`);
  console.log('');

  // Fetch all products in batches
  console.log('Fetching products...');
  const batchSize = 1000;
  const allProducts = [];

  for (let offset = 0; offset < total; offset += batchSize) {
    const { data: batch } = await supabase
      .from('products')
      .select('id, title, brand, description, category, price')
      .range(offset, offset + batchSize - 1);

    if (batch) {
      allProducts.push(...batch);
      console.log(`   Fetched ${allProducts.length}/${total}...`);
    }
  }

  console.log('');
  console.log('Analyzing products...');
  console.log('');

  const notFashion = [];
  const noFashionKeywords = [];

  for (const product of allProducts) {
    // Check if definitely not fashion (obvious non-fashion items)
    if (isDefinitelyNotFashion(product.title, product.description)) {
      notFashion.push(product);
      continue;
    }

    // Check if has fashion keywords (should have scored 1 point for this)
    if (!isFashionProduct(product.title, product.description, product.category)) {
      noFashionKeywords.push(product);
    }
  }

  console.log('='.repeat(70));
  console.log('RESULTS');
  console.log('='.repeat(70));
  console.log(`Total products: ${total}`);
  console.log(`Definitely NOT fashion: ${notFashion.length} (${((notFashion.length / total) * 100).toFixed(1)}%)`);
  console.log(`No fashion keywords: ${noFashionKeywords.length} (${((noFashionKeywords.length / total) * 100).toFixed(1)}%)`);
  console.log('');

  if (notFashion.length > 0) {
    console.log('❌ DEFINITELY NOT FASHION (should be removed):');
    notFashion.slice(0, 20).forEach((p, i) => {
      console.log(`   ${i + 1}. ${p.brand || 'Unknown'} - ${p.title.slice(0, 70)}`);
    });
    console.log('');
  }

  if (noFashionKeywords.length > 0 && noFashionKeywords.length < 100) {
    console.log('⚠️  NO FASHION KEYWORDS (might be mislabeled):');
    noFashionKeywords.slice(0, 20).forEach((p, i) => {
      console.log(`   ${i + 1}. ${p.brand || 'Unknown'} - ${p.title.slice(0, 70)}`);
      console.log(`       Price: $${p.price || 'N/A'} | Category: ${p.category || 'N/A'}`);
    });
    console.log('');
  }

  console.log('='.repeat(70));
  console.log('RECOMMENDATION');
  console.log('='.repeat(70));

  if (notFashion.length > 0) {
    console.log(`❌ Found ${notFashion.length} non-fashion products that MUST be removed!`);
    console.log('   Run: node scripts/cleanup-non-fashion-products.mjs');
  } else if (noFashionKeywords.length > 50) {
    console.log(`⚠️  Found ${noFashionKeywords.length} products without fashion keywords.`);
    console.log('   These may be valid fashion items with poor descriptions.');
    console.log('   Manual review recommended before cleanup.');
  } else {
    console.log('✅ Database looks clean! All products appear to be fashion items.');
  }
  console.log('');
}

verifyFashionProducts()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  });

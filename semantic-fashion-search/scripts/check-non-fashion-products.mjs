#!/usr/bin/env node

/**
 * Check for non-fashion products in the database
 * These should have been filtered out during sync
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

// Fashion-related keywords that should appear in titles
const FASHION_KEYWORDS = [
  'dress', 'shirt', 'pants', 'jeans', 'skirt', 'shorts', 'jacket', 'coat',
  'sweater', 'cardigan', 'blazer', 'suit', 'blouse', 'top', 'tee', 't-shirt',
  'shoes', 'boots', 'heels', 'sandals', 'sneakers', 'flats', 'loafers',
  'bag', 'handbag', 'purse', 'tote', 'clutch', 'backpack', 'wallet',
  'jewelry', 'necklace', 'earrings', 'bracelet', 'ring', 'watch',
  'scarf', 'belt', 'hat', 'cap', 'beanie', 'sunglasses',
  'clothing', 'apparel', 'fashion', 'wear', 'outfit'
];

// Non-fashion keywords that indicate product shouldn't be in database
const NON_FASHION_KEYWORDS = [
  'phone', 'case', 'charger', 'cable', 'electronics', 'gadget',
  'kitchen', 'garlic', 'peeler', 'meat', 'cutter', 'appliance',
  'inflatable', 'toy', 'game', 'puzzle',
  'tool', 'hardware', 'machine', 'equipment',
  'pet', 'dog', 'cat', 'animal',
  'home', 'decor', 'furniture', 'light'
];

async function checkNonFashionProducts() {
  console.log('='.repeat(70));
  console.log('CHECKING FOR NON-FASHION PRODUCTS');
  console.log('='.repeat(70));
  console.log('');

  // Get total count
  const { count: total } = await supabase
    .from('products')
    .select('id', { count: 'exact', head: true });

  console.log(`Total products: ${total}`);
  console.log('');

  // Fetch all products in batches
  console.log('Fetching all products...');
  const batchSize = 1000;
  const allProducts = [];

  for (let offset = 0; offset < total; offset += batchSize) {
    const { data: batch } = await supabase
      .from('products')
      .select('id, title, brand, description')
      .range(offset, offset + batchSize - 1);

    if (batch) {
      allProducts.push(...batch);
      console.log(`   Fetched ${allProducts.length}/${total}...`);
    }
  }

  console.log('');
  console.log('Analyzing products...');
  console.log('');

  // Check each product
  const suspiciousProducts = [];

  for (const product of allProducts) {
    const text = `${product.title} ${product.description || ''}`.toLowerCase();

    // Check if it has fashion keywords
    const hasFashionKeyword = FASHION_KEYWORDS.some(keyword => text.includes(keyword));

    // Check if it has non-fashion keywords
    const hasNonFashionKeyword = NON_FASHION_KEYWORDS.some(keyword => text.includes(keyword));

    // Flag if no fashion keywords OR has non-fashion keywords
    if (!hasFashionKeyword || hasNonFashionKeyword) {
      suspiciousProducts.push({
        ...product,
        reason: !hasFashionKeyword ? 'No fashion keywords' : 'Has non-fashion keywords'
      });
    }
  }

  console.log('='.repeat(70));
  console.log('RESULTS');
  console.log('='.repeat(70));
  console.log(`Total products: ${total}`);
  console.log(`Suspicious (likely non-fashion): ${suspiciousProducts.length} (${((suspiciousProducts.length / total) * 100).toFixed(1)}%)`);
  console.log('');

  // Group by brand
  const brandCounts = suspiciousProducts.reduce((acc, p) => {
    const brand = p.brand || 'Unknown';
    acc[brand] = (acc[brand] || 0) + 1;
    return acc;
  }, {});

  const topBrands = Object.entries(brandCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  console.log('Top brands with suspicious products:');
  topBrands.forEach(([brand, count]) => {
    console.log(`   ${brand}: ${count} products`);
  });
  console.log('');

  // Show samples
  console.log('Sample suspicious products:');
  suspiciousProducts.slice(0, 20).forEach((p, i) => {
    console.log(`   ${i + 1}. [${p.reason}] ${p.brand} - ${p.title.slice(0, 60)}...`);
  });
  console.log('');

  console.log('='.repeat(70));
  console.log('RECOMMENDATION');
  console.log('='.repeat(70));

  if (suspiciousProducts.length > total * 0.05) {
    console.log('⚠️  More than 5% of products appear to be non-fashion items!');
    console.log(`   Consider running a cleanup to remove ${suspiciousProducts.length} suspicious products`);
    console.log('   Or adjust the quality filtering during product sync');
  } else {
    console.log('✅ Most products appear to be fashion-related');
  }
  console.log('');
}

checkNonFashionProducts()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  });

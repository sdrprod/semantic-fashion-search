#!/usr/bin/env node

/**
 * List CJ Affiliate products from database
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

async function listCJProducts(limit = 20) {
  console.log(`\n📋 Fetching first ${limit} CJ Affiliate products...\n`);

  const { data: products, error } = await supabase
    .from('products')
    .select('id, brand, title, price, currency, merchant_name, tags, created_at')
    .eq('affiliate_network', 'cj')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('❌ Database error:', error.message);
    process.exit(1);
  }

  if (!products || products.length === 0) {
    console.log('No CJ products found in database.');
    return;
  }

  console.log(`Found ${products.length} CJ products:\n`);
  console.log('='.repeat(100));

  products.forEach((product, index) => {
    console.log(`\n[${index + 1}] ${product.title}`);
    console.log(`    Brand: ${product.brand}`);
    console.log(`    Price: ${product.currency} ${product.price}`);
    console.log(`    Merchant: ${product.merchant_name}`);
    console.log(`    Tags: ${product.tags?.slice(0, 8).join(', ') || 'None'}${product.tags?.length > 8 ? '...' : ''}`);
    console.log(`    ID: ${product.id}`);
    console.log(`    Added: ${new Date(product.created_at).toLocaleString()}`);
  });

  console.log('\n' + '='.repeat(100));
  console.log(`\n✅ Listed ${products.length} products\n`);
}

// Parse command line args
const limit = parseInt(process.argv[2]) || 20;

// Run
listCJProducts(limit)
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
  });

#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function countProducts() {
  console.log('\n📊 Product Count by Network:\n');

  // Get total count
  const { count: total } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true });

  console.log(`Total products: ${total}`);

  // Count by network (fetch all in batches)
  let allProducts = [];
  let page = 0;
  const pageSize = 1000;
  let hasMore = true;

  while (hasMore) {
    const { data: batch } = await supabase
      .from('products')
      .select('affiliate_network')
      .not('affiliate_network', 'is', null)
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (batch && batch.length > 0) {
      allProducts = allProducts.concat(batch);
      page++;
      hasMore = batch.length === pageSize;
    } else {
      hasMore = false;
    }
  }

  const byNetwork = allProducts;

  const networkCounts = {};
  byNetwork.forEach(p => {
    const network = p.affiliate_network || 'unknown';
    networkCounts[network] = (networkCounts[network] || 0) + 1;
  });

  console.log('\nBy network:');
  Object.entries(networkCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([network, count]) => {
      console.log(`  ${network}: ${count}`);
    });

  console.log('');
}

countProducts()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
  });

#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Get total count first
const { count: totalCount } = await supabase
  .from('products')
  .select('*', { count: 'exact', head: true });

// Fetch all products in batches
const allProducts = [];
const batchSize = 1000;
for (let offset = 0; offset < totalCount; offset += batchSize) {
  const { data: batch } = await supabase
    .from('products')
    .select('affiliate_network, created_at, merchant_name')
    .range(offset, offset + batchSize - 1);

  allProducts.push(...batch);
  process.stdout.write(`\rFetching... ${allProducts.length}/${totalCount}`);
}
console.log('\n');

const networks = {};
let withoutNetwork = 0;
const merchants = {};

allProducts.forEach(p => {
  if (p.affiliate_network === null || p.affiliate_network === undefined) {
    withoutNetwork++;
  } else {
    networks[p.affiliate_network] = (networks[p.affiliate_network] || 0) + 1;
  }

  if (p.merchant_name) {
    merchants[p.merchant_name] = (merchants[p.merchant_name] || 0) + 1;
  }
});

// Date analysis
const dates = allProducts.map(p => new Date(p.created_at)).sort((a, b) => a - b);
const oldestDate = dates[0];
const newestDate = dates[dates.length - 1];

const today = new Date();
today.setHours(0, 0, 0, 0);
const addedToday = allProducts.filter(p => new Date(p.created_at) >= today).length;

console.log('='.repeat(70));
console.log('DATABASE ANALYSIS');
console.log('='.repeat(70));
console.log();
console.log('TOTAL:', allProducts.length, 'products');
console.log();
console.log('BY AFFILIATE NETWORK:');
Object.entries(networks).sort((a, b) => b[1] - a[1]).forEach(([network, count]) => {
  console.log('  ' + network + ':', count);
});
if (withoutNetwork > 0) {
  console.log('  (null/no network):', withoutNetwork);
}
console.log();
console.log('TOP 10 MERCHANTS:');
Object.entries(merchants)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10)
  .forEach(([merchant, count]) => {
    console.log('  ' + merchant + ':', count);
  });
console.log();
console.log('DATE INFO:');
console.log('  Oldest:', oldestDate.toLocaleString());
console.log('  Newest:', newestDate.toLocaleString());
console.log('  Added today:', addedToday);
console.log();

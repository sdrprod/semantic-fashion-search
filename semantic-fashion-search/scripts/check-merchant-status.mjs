#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const { count: total } = await supabase
  .from('products')
  .select('id', { count: 'exact', head: true });

const { count: withMerchant } = await supabase
  .from('products')
  .select('id', { count: 'exact', head: true })
  .not('merchant_name', 'is', null);

const { count: nullMerchant } = await supabase
  .from('products')
  .select('id', { count: 'exact', head: true })
  .is('merchant_name', null);

console.log('Current Status:');
console.log('Total products:', total);
console.log('With merchant_name:', withMerchant);
console.log('NULL merchant_name:', nullMerchant);
console.log('');

// Sample of products without merchant_name
const { data: samples } = await supabase
  .from('products')
  .select('brand, merchant_name, title')
  .is('merchant_name', null)
  .limit(5);

if (samples && samples.length > 0) {
  console.log('Sample products without merchant_name:');
  samples.forEach((p, i) => {
    console.log(`  ${i+1}. Brand: ${p.brand || 'NULL'}`);
    console.log(`     Title: ${p.title.slice(0, 60)}...`);
  });
} else {
  console.log('✅ All products have merchant_name!');
}

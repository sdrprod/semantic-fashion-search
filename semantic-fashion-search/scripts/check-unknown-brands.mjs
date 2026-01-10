#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const { data } = await supabase
  .from('products')
  .select('brand, merchant_name, title')
  .ilike('brand', 'unknown')
  .not('merchant_name', 'is', null)
  .limit(10);

console.log('Products with Unknown brand but have merchant_name:');
console.log('='.repeat(70));
data?.forEach((p, i) => {
  console.log(`${i+1}. Brand: ${p.brand} | Merchant: ${p.merchant_name}`);
  console.log(`   Title: ${p.title.slice(0, 60)}...`);
  console.log('');
});

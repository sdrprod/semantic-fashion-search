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

async function detailedCount() {
  console.log('\n📊 Detailed Product Count:\n');

  // Method 1: Select count
  const { data: allProducts } = await supabase
    .from('products')
    .select('id');

  console.log(`Method 1 (select): ${allProducts?.length || 0} products`);

  // Method 2: Count query
  const { count: totalCount } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true });

  console.log(`Method 2 (count): ${totalCount} products`);

  // By network
  const { data: impactProducts } = await supabase
    .from('products')
    .select('id')
    .eq('affiliate_network', 'impact');

  const { data: cjProducts } = await supabase
    .from('products')
    .select('id')
    .eq('affiliate_network', 'cj');

  console.log(`\nBy network:`);
  console.log(`  Impact: ${impactProducts?.length || 0}`);
  console.log(`  CJ: ${cjProducts?.length || 0}`);
  console.log(`  Total: ${(impactProducts?.length || 0) + (cjProducts?.length || 0)}`);

  // Check for nulls
  const { data: nullNetwork } = await supabase
    .from('products')
    .select('id')
    .is('affiliate_network', null);

  if (nullNetwork && nullNetwork.length > 0) {
    console.log(`  NULL network: ${nullNetwork.length}`);
  }

  console.log('');
}

detailedCount()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
  });

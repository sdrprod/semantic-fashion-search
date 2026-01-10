#!/usr/bin/env node

/**
 * Check what types of products are in the database
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

async function checkProductTypes() {
  console.log('='.repeat(70));
  console.log('CHECKING PRODUCT TYPES IN DATABASE');
  console.log('='.repeat(70));
  console.log('');

  // Count by affiliate network
  console.log('1. Count by affiliate_network:');
  const { data: impactCount } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('affiliate_network', 'impact');

  const { data: dhgateCount } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('affiliate_network', 'dhgate');

  const { data: nullCount } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .is('affiliate_network', null);

  console.log(`   Impact: ${impactCount?.count || 0}`);
  console.log(`   DHGate: ${dhgateCount?.count || 0}`);
  console.log(`   NULL: ${nullCount?.count || 0}`);
  console.log('');

  // Sample products
  console.log('2. Sample products:');
  const { data: samples } = await supabase
    .from('products')
    .select('id, brand, title, affiliate_network, merchant_name')
    .limit(10);

  if (samples && samples.length > 0) {
    samples.forEach((p, i) => {
      console.log(`   ${i + 1}. [${p.affiliate_network || 'null'}] ${p.brand || p.merchant_name || 'Unknown'} - ${p.title.slice(0, 60)}...`);
    });
  } else {
    console.log('   ❌ NO products found!');
  }
  console.log('');

  console.log('='.repeat(70));
  console.log('SUMMARY');
  console.log('='.repeat(70));

  const totalProducts = (impactCount?.count || 0) + (dhgateCount?.count || 0) + (nullCount?.count || 0);
  console.log(`Total fashion products: ${totalProducts}`);
  console.log('');

  if ((impactCount?.count || 0) === 0) {
    console.log('❌ CRITICAL: NO Impact products in database!');
    console.log('   The database expansion may not have worked correctly.');
    console.log('   Need to run: expand-database-impact.mjs');
  } else {
    console.log('✅ All products sourced from Impact.com fashion campaigns');
  }

  console.log('');
}

checkProductTypes()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  });

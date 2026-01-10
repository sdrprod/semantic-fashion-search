#!/usr/bin/env node

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

async function checkDatabaseState() {
  console.log('='.repeat(70));
  console.log('CURRENT DATABASE STATE - DETAILED CHECK');
  console.log('='.repeat(70));
  console.log('');

  // Get actual counts using data fetch
  console.log('Fetching product counts...');

  const { data: allProducts } = await supabase
    .from('products')
    .select('id, title, brand, affiliate_network, embedding, image_embedding')
    .limit(30000); // Fetch all

  if (!allProducts) {
    console.error('❌ Failed to fetch products!');
    return;
  }

  const total = allProducts.length;

  // Count by affiliate_network
  const impactProducts = allProducts.filter(p => p.affiliate_network === 'impact');
  const dhgateNetwork = allProducts.filter(p => p.affiliate_network === 'dhgate');
  const nullNetwork = allProducts.filter(p => !p.affiliate_network);

  // Count embeddings
  const withTextEmb = allProducts.filter(p => p.embedding).length;
  const withImageEmb = allProducts.filter(p => p.image_embedding).length;

  console.log('📊 TOTALS:');
  console.log(`   Total fashion products: ${total}`);
  console.log('');

  console.log('📍 BY AFFILIATE NETWORK:');
  console.log(`   Impact: ${impactProducts.length}`);
  console.log(`   DHGate: ${dhgateNetwork.length}`);
  console.log(`   NULL: ${nullNetwork.length}`);
  console.log('');

  console.log('🔢 EMBEDDINGS:');
  console.log(`   Text embeddings: ${withTextEmb}/${total} (${((withTextEmb / total) * 100).toFixed(1)}%)`);
  console.log(`   Image embeddings: ${withImageEmb}/${total} (${((withImageEmb / total) * 100).toFixed(1)}%)`);
  console.log('');

  // Sample products
  console.log('📋 SAMPLE PRODUCTS:');
  console.log('');
  allProducts.slice(0, 10).forEach((p, i) => {
    console.log(`   ${i + 1}. [${p.affiliate_network}] ${p.brand || 'Unknown'} - ${(p.title || 'No title').slice(0, 60)}`);
  });
  console.log('');

  console.log('='.repeat(70));
  console.log('ANALYSIS:');
  console.log('='.repeat(70));

  if (total !== 20058) {
    console.log(`⚠️  Expected 20,058 fashion products but found ${total}`);
  } else {
    console.log(`✅ Correct total: ${total} fashion products`);
  }

  if (withTextEmb === total) {
    console.log(`✅ All products have text embeddings`);
  } else {
    console.log(`⚠️  ${total - withTextEmb} products missing text embeddings`);
  }

  const imageEmbPercent = ((withImageEmb / total) * 100).toFixed(1);
  if (withImageEmb === total) {
    console.log(`✅ All products have image embeddings`);
  } else {
    console.log(`⚠️  Image embeddings: ${imageEmbPercent}% complete (${total - withImageEmb} remaining)`);
  }

  console.log('');
}

checkDatabaseState()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  });

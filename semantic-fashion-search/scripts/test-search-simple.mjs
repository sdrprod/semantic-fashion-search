#!/usr/bin/env node

/**
 * Simple test to verify search is working
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

async function testSearch() {
  console.log('='.repeat(70));
  console.log('SIMPLE SEARCH TEST');
  console.log('='.repeat(70));
  console.log('');

  // Step 1: Count total products
  console.log('Step 1: Counting total products...');
  const { count: totalProducts, error: countError } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.error('❌ Error counting products:', countError);
    process.exit(1);
  }
  console.log(`✅ Total products: ${totalProducts}`);
  console.log('');

  // Step 2: Count Impact products
  console.log('Step 2: Counting Impact products...');
  const { count: impactProducts, error: impactError } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('affiliate_network', 'impact');

  if (impactError) {
    console.error('❌ Error counting Impact products:', impactError);
  } else {
    console.log(`✅ Impact products: ${impactProducts}`);
  }
  console.log('');

  // Step 3: Check products with text embeddings
  console.log('Step 3: Checking products with embeddings...');
  const { data: sampleProducts, error: sampleError } = await supabase
    .from('products')
    .select('id, title, brand, affiliate_network')
    .not('text_embedding', 'is', null)
    .limit(5);

  if (sampleError) {
    console.error('❌ Error fetching sample products:', sampleError);
  } else if (sampleProducts && sampleProducts.length > 0) {
    console.log(`✅ Found ${sampleProducts.length} products with embeddings:`);
    sampleProducts.forEach((product, index) => {
      console.log(`   ${index + 1}. [${product.affiliate_network}] ${product.brand} - ${product.title.slice(0, 60)}...`);
    });
  } else {
    console.log('⚠️  No products with text embeddings found!');
  }
  console.log('');

  // Step 4: Test match_products RPC function
  console.log('Step 4: Testing match_products RPC function...');
  console.log('Creating test embedding (1536 dimensions of 0.1)...');

  const testEmbedding = new Array(1536).fill(0.1);
  const vectorString = `[${testEmbedding.join(',')}]`;

  console.log('Calling match_products...');
  const { data: matchResults, error: matchError } = await supabase
    .rpc('match_products', {
      query_embedding: vectorString,
      match_count: 10,
    });

  if (matchError) {
    console.error('❌ match_products RPC failed:', {
      message: matchError.message,
      details: matchError.details,
      hint: matchError.hint,
      code: matchError.code
    });
  } else if (matchResults && matchResults.length > 0) {
    console.log(`✅ match_products returned ${matchResults.length} results`);
    console.log('   First 3 results:');
    matchResults.slice(0, 3).forEach((result, index) => {
      console.log(`   ${index + 1}. ${result.brand} - ${result.title.slice(0, 60)}... (similarity: ${result.similarity})`);
    });
  } else {
    console.log('⚠️  match_products returned 0 results');
  }

  console.log('');
  console.log('='.repeat(70));
  console.log('TEST COMPLETE');
  console.log('='.repeat(70));
}

testSearch()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  });

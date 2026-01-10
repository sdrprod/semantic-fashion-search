#!/usr/bin/env node

/**
 * Check if database is properly set up for vector search
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

async function checkDatabaseSetup() {
  console.log('='.repeat(70));
  console.log('CHECKING DATABASE SETUP FOR VECTOR SEARCH');
  console.log('='.repeat(70));
  console.log('');

  // Check 1: Does match_products function exist?
  console.log('1. Checking match_products function...');

  // Create a dummy embedding
  const dummyEmbedding = new Array(1536).fill(0.1);
  const vectorString = `[${dummyEmbedding.join(',')}]`;

  const { data: funcTestData, error: funcError } = await supabase
    .rpc('match_products', {
      query_embedding: vectorString,
      match_count: 1
    });

  if (funcError) {
    if (funcError.code === '42883') {
      console.log('   ❌ match_products function does NOT exist!');
      console.log('   Need to run: scripts/update-match-products-function.sql');
    } else if (funcError.code === '57014') {
      console.log('   ⚠️  Function exists but TIMES OUT (no index or wrong type)');
    } else {
      console.log(`   ⚠️  Function exists but returns error: ${funcError.message} (code: ${funcError.code})`);
    }
  } else {
    console.log('   ✅ match_products function exists and works!');
    if (funcTestData && funcTestData.length > 0) {
      console.log(`      Returned ${funcTestData.length} result(s)`);
    }
  }
  console.log('');

  // Check 2: Count products with embeddings
  console.log('2. Checking products with embeddings...');
  const { count: withEmbeddings, error: embError } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .not('embedding', 'is', null);

  if (embError) {
    console.log('   ❌ Error:', embError.message);
  } else {
    console.log(`   ✅ Products with embeddings: ${withEmbeddings}`);
  }
  console.log('');

  // Check 3: Test simple embedding query
  console.log('3. Testing simple embedding query (no RPC)...');
  const { data: testProducts, error: testError } = await supabase
    .from('products')
    .select('id, title, brand, embedding')
    .not('embedding', 'is', null)
    .limit(3);

  if (testError) {
    console.log('   ❌ Error:', testError.message);
  } else if (testProducts && testProducts.length > 0) {
    console.log(`   ✅ Successfully queried ${testProducts.length} products with embeddings`);
    console.log(`   First product: ${testProducts[0].brand} - ${testProducts[0].title.slice(0, 50)}...`);

    // Check embedding format
    const embedding = testProducts[0].embedding;
    if (typeof embedding === 'string' && embedding.startsWith('[')) {
      console.log('   ⚠️  Embedding is stored as STRING, not vector type!');
      console.log('   This may cause performance issues.');
      console.log('   Length check:', embedding.length > 100 ? `${embedding.slice(0, 100)}...` : embedding);
    } else {
      console.log('   ✅ Embedding is in correct vector format');
    }
  }
  console.log('');

  console.log('='.repeat(70));
  console.log('DIAGNOSIS:');
  console.log('='.repeat(70));

  if (funcError) {
    if (funcError.code === '42883') {
      console.log('❌ match_products function MISSING');
      console.log('   FIX: Run scripts/update-match-products-function.sql in Supabase SQL Editor');
    } else if (funcError.code === '57014') {
      console.log('⚠️  match_products function EXISTS but TIMES OUT');
      console.log('   LIKELY CAUSE: embedding column stored as TEXT not VECTOR');
      console.log('   FIX: Need to convert embedding column to vector type with index');
    } else {
      console.log(`⚠️  match_products function has issues (error code: ${funcError.code})`);
      console.log(`   Error: ${funcError.message}`);
    }
  } else {
    console.log('✅ Database setup is WORKING!');
    console.log('   match_products function exists and returns results.');
  }
  console.log('');
}

checkDatabaseSetup()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  });

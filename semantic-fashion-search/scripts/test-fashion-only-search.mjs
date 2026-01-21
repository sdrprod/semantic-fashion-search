#!/usr/bin/env node

/**
 * Test search with FASHION products ONLY (no DHGate)
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });
dotenv.config({ path: join(__dirname, '..', '.env') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Generate embedding
async function generateEmbedding(text) {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      input: text,
      model: 'text-embedding-3-small',
    }),
  });

  const data = await response.json();
  return data.data[0].embedding;
}

async function testFashionOnlySearch() {
  console.log('='.repeat(70));
  console.log('FASHION-ONLY SEARCH TEST (NO DHGATE)');
  console.log('='.repeat(70));
  console.log('');

  const testQuery = 'black dress';

  console.log(`Test query: "${testQuery}"`);
  console.log('');

  // Step 1: Generate embedding
  console.log('Step 1: Generating embedding...');
  const embedding = await generateEmbedding(testQuery);
  console.log(`✅ Generated ${embedding.length}-dimensional embedding`);
  console.log(`   First 5 values: ${embedding.slice(0, 5).join(', ')}`);
  console.log('');

  // Step 2: Call match_products_fashion_only
  console.log('Step 2: Calling match_products_fashion_only RPC...');

  const { data: matchResults, error: matchError } = await supabase
    .rpc('match_products_fashion_only', {
      query_embedding: embedding,
      match_count: 50,
    });

  if (matchError) {
    console.error('❌ Search failed:', matchError);
    console.error('   Make sure you ran: scripts/create-fashion-only-search-function.sql');
    return;
  }

  console.log(`✅ Returned ${matchResults.length} fashion products`);
  console.log('');

  // Step 3: Analyze results
  console.log('Step 3: Analyzing results...');

  if (matchResults.length === 0) {
    console.log('⚠️  No fashion products found!');
    return;
  }

  // Show similarity distribution
  const similarities = matchResults.map(r => r.similarity);
  const maxSim = Math.max(...similarities);
  const minSim = Math.min(...similarities);
  const avgSim = similarities.reduce((a, b) => a + b, 0) / similarities.length;

  console.log('Similarity scores:');
  console.log(`   Max: ${maxSim.toFixed(4)}`);
  console.log(`   Min: ${minSim.toFixed(4)}`);
  console.log(`   Avg: ${avgSim.toFixed(4)}`);
  console.log(`   Threshold: 0.3`);
  console.log('');

  // Count how many pass threshold
  const aboveThreshold = matchResults.filter(r => r.similarity >= 0.3);
  console.log(`Products above threshold (0.3): ${aboveThreshold.length}/${matchResults.length}`);
  console.log('');

  // Verify no DHGate products
  const dhgateProducts = matchResults.filter(r =>
    r.brand?.toLowerCase().includes('dhgate') ||
    r.title?.toLowerCase().includes('dhgate')
  );

  if (dhgateProducts.length > 0) {
    console.log(`⚠️  Found ${dhgateProducts.length} DHGate products (should be 0!)`);
  } else {
    console.log('✅ No DHGate products (as expected)');
  }
  console.log('');

  // Show top 20 results
  console.log('Top 20 FASHION products:');
  matchResults.slice(0, 20).forEach((result, i) => {
    const passesThreshold = result.similarity >= 0.3;
    const status = passesThreshold ? '✅' : '❌ LOW';

    console.log(`  ${i + 1}. ${status} [${result.affiliate_network || 'unknown'}] ${result.brand || 'Unknown'} - ${result.title.slice(0, 50)}...`);
    console.log(`      Similarity: ${result.similarity.toFixed(4)} (${(result.similarity * 100).toFixed(1)}%) | Price: ${result.currency} ${result.price}`);
  });

  console.log('');

  // Check for dress-related products
  const dressProducts = matchResults.filter(r =>
    r.title?.toLowerCase().includes('dress') ||
    r.description?.toLowerCase().includes('dress')
  );

  console.log('='.repeat(70));
  console.log('ANALYSIS');
  console.log('='.repeat(70));
  console.log(`Fashion products with "dress" in text: ${dressProducts.length}/${matchResults.length}`);
  console.log('');

  if (dressProducts.length > 0) {
    console.log('Sample dress products:');
    dressProducts.slice(0, 10).forEach((p, i) => {
      console.log(`   ${i + 1}. ${p.brand || 'Unknown'} - ${p.title.slice(0, 60)}...`);
      console.log(`      Similarity: ${(p.similarity * 100).toFixed(1)}% | ${p.currency} ${p.price}`);
    });
    console.log('');
  }

  const finalResults = matchResults.filter(r => r.similarity >= 0.3);
  console.log(`✅ ${finalResults.length} fashion products meet threshold (0.3)`);
  console.log('   These would be shown to the user');
  console.log('');
}

testFashionOnlySearch()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  });

#!/usr/bin/env node

/**
 * Test search with detailed logging - directly call search functions
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

// Mock OpenAI embedding
async function generateMockEmbedding(text) {
  // Use fetch to call OpenAI
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

async function testDetailedSearch() {
  console.log('='.repeat(70));
  console.log('DETAILED SEARCH TEST');
  console.log('='.repeat(70));
  console.log('');

  const testQuery = 'black dress';

  console.log(`Test query: "${testQuery}"`);
  console.log('');

  // Step 1: Generate embedding
  console.log('Step 1: Generating embedding...');
  const embedding = await generateMockEmbedding(testQuery);
  console.log(`✅ Generated ${embedding.length}-dimensional embedding`);
  console.log(`   First 5 values: ${embedding.slice(0, 5).join(', ')}`);
  console.log('');

  // Step 2: Call match_products
  console.log('Step 2: Calling match_products RPC...');

  const { data: matchResults, error: matchError } = await supabase
    .rpc('match_products', {
      query_embedding: embedding,
      match_count: 50,
    });

  if (matchError) {
    console.error('❌ match_products failed:', matchError);
    return;
  }

  console.log(`✅ match_products returned ${matchResults.length} results`);
  console.log('');

  // Step 3: Analyze results
  console.log('Step 3: Analyzing results...');

  if (matchResults.length === 0) {
    console.log('⚠️  No results returned from match_products!');
    console.log('   This means there are no products with embeddings matching the query.');
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

  // Check for DHGate products
  const dhgateProducts = matchResults.filter(r =>
    r.brand?.toLowerCase().includes('dhgate') ||
    r.product_url?.toLowerCase().includes('dhgate') ||
    r.title?.toLowerCase().includes('dhgate')
  );

  console.log(`DHGate products: ${dhgateProducts.length}/${matchResults.length}`);
  console.log('');

  // Show top 10 results
  console.log('Top 10 results:');
  matchResults.slice(0, 10).forEach((result, i) => {
    const isDHGate = result.brand?.toLowerCase().includes('dhgate') ||
      result.product_url?.toLowerCase().includes('dhgate');

    const passesThreshold = result.similarity >= 0.3;
    const status = passesThreshold ? (isDHGate ? '⚠️ DHGATE' : '✅') : '❌ LOW';

    console.log(`  ${i + 1}. ${status} [${result.affiliate_network || 'unknown'}] ${result.brand} - ${result.title.slice(0, 50)}...`);
    console.log(`      Similarity: ${result.similarity.toFixed(4)} | Price: ${result.currency} ${result.price}`);
  });

  console.log('');

  // Final verdict
  const finalResults = matchResults.filter(r => {
    const isDHGate = r.brand?.toLowerCase().includes('dhgate') ||
      r.product_url?.toLowerCase().includes('dhgate') ||
      r.title?.toLowerCase().includes('dhgate');

    return r.similarity >= 0.3 && !isDHGate;
  });

  console.log('='.repeat(70));
  console.log('FINAL RESULTS AFTER FILTERING:');
  console.log('='.repeat(70));
  console.log(`Products that would be returned: ${finalResults.length}`);

  if (finalResults.length === 0) {
    console.log('');
    console.log('⚠️  NO RESULTS AFTER FILTERING!');
    console.log('');
    console.log('Possible reasons:');
    if (aboveThreshold.length === 0) {
      console.log('  1. ❌ No products have similarity >= 0.3');
      console.log('     - Embeddings may not match the query well');
      console.log('     - Try lowering threshold or checking embedding quality');
    }
    if (dhgateProducts.length === matchResults.length) {
      console.log('  2. ❌ All products are DHGate (being filtered out)');
      console.log('     - This should not happen with Impact products!');
    }
  } else {
    console.log('');
    console.log('First 3 final results:');
    finalResults.slice(0, 3).forEach((result, i) => {
      console.log(`  ${i + 1}. ${result.brand} - ${result.title.slice(0, 60)}...`);
      console.log(`     Similarity: ${(result.similarity * 100).toFixed(2)}%`);
    });
  }

  console.log('');
}

testDetailedSearch()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  });

#!/usr/bin/env node

/**
 * Test if embeddings are working correctly
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

async function testEmbeddingQuality() {
  console.log('='.repeat(70));
  console.log('TESTING EMBEDDING QUALITY');
  console.log('='.repeat(70));
  console.log('');

  // Get a product with "dress" in title
  console.log('Step 1: Finding a product with "dress" in title...');
  const { data: dressProducts, error: dressError } = await supabase
    .from('products')
    .select('id, brand, title, embedding')
    .ilike('title', '%dress%')
    .not('embedding', 'is', null)
    .limit(5);

  if (dressError || !dressProducts || dressProducts.length === 0) {
    console.log('❌ No products with "dress" found!');
    return;
  }

  console.log(`✅ Found ${dressProducts.length} products with "dress"`);
  console.log('');
  dressProducts.forEach((p, i) => {
    console.log(`   ${i + 1}. ${p.brand} - ${p.title.slice(0, 60)}...`);
  });
  console.log('');

  // Test 1: Search using that product's own embedding (should get 1.0 similarity)
  const testProduct = dressProducts[0];
  console.log('Step 2: Testing self-search (should get similarity = 1.0)...');
  console.log(`Using: ${testProduct.brand} - ${testProduct.title.slice(0, 60)}...`);
  console.log('');

  const { data: selfResults, error: selfError } = await supabase
    .rpc('match_products', {
      query_embedding: testProduct.embedding,
      match_count: 10
    });

  if (selfError) {
    console.error('❌ Self-search failed:', selfError);
    return;
  }

  console.log(`✅ Self-search returned ${selfResults.length} results`);
  console.log('');
  console.log('Top 5 results:');
  selfResults.slice(0, 5).forEach((p, i) => {
    const isExact = p.id === testProduct.id ? ' ⭐ EXACT MATCH' : '';
    console.log(`   ${i + 1}. ${p.brand || p.merchant_name || 'Unknown'} - ${p.title.slice(0, 50)}...${isExact}`);
    console.log(`      Similarity: ${(p.similarity * 100).toFixed(1)}%`);
  });
  console.log('');

  // Check if the exact product got 1.0 similarity
  const exactMatch = selfResults.find(p => p.id === testProduct.id);
  if (!exactMatch) {
    console.log('❌ PROBLEM: Original product not in top 10 results!');
  } else if (exactMatch.similarity < 0.99) {
    console.log(`❌ PROBLEM: Self-similarity is ${(exactMatch.similarity * 100).toFixed(1)}%, should be 100%!`);
    console.log('   This suggests embeddings are not normalized or cosine distance is wrong');
  } else {
    console.log(`✅ Self-similarity correct: ${(exactMatch.similarity * 100).toFixed(1)}%`);
  }
  console.log('');

  // Test 2: Check similarity score distribution
  const similarities = selfResults.map(p => p.similarity);
  const avgSimilarity = similarities.reduce((a, b) => a + b, 0) / similarities.length;
  const maxSimilarity = Math.max(...similarities);
  const minSimilarity = Math.min(...similarities);

  console.log('Step 3: Similarity score distribution...');
  console.log(`   Max: ${(maxSimilarity * 100).toFixed(1)}%`);
  console.log(`   Min: ${(minSimilarity * 100).toFixed(1)}%`);
  console.log(`   Avg: ${(avgSimilarity * 100).toFixed(1)}%`);
  console.log('');

  if (maxSimilarity < 0.3) {
    console.log('❌ PROBLEM: All similarities < 30%, even for exact match!');
    console.log('   Embeddings are likely corrupted or wrong');
  } else if (avgSimilarity < 0.2) {
    console.log('⚠️  Average similarity is very low');
    console.log('   Results may not be semantically relevant');
  } else {
    console.log('✅ Similarity scores look healthy');
  }

  console.log('');
  console.log('='.repeat(70));
  console.log('DIAGNOSIS');
  console.log('='.repeat(70));

  if (exactMatch && exactMatch.similarity >= 0.99) {
    console.log('✅ Embeddings are working correctly');
    console.log('   Text embeddings using text-embedding-3-small (1536 dimensions)');
    console.log('   Cosine distance function working properly');
  } else {
    console.log('❌ Embeddings are NOT working correctly');
    console.log('   Need to regenerate all embeddings');
  }
  console.log('');
}

testEmbeddingQuality()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  });

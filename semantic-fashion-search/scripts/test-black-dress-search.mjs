#!/usr/bin/env node

/**
 * Test "black dress" search specifically
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
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

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function testBlackDressSearch() {
  console.log('='.repeat(70));
  console.log('BLACK DRESS SEARCH TEST');
  console.log('='.repeat(70));
  console.log('');

  // Generate embedding for "black dress"
  console.log('Step 1: Generating embedding for "black dress"...');
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: 'black dress',
  });

  const embedding = response.data[0].embedding;
  console.log(`✅ Generated ${embedding.length}-dimensional embedding`);
  console.log(`   First 5 values: ${embedding.slice(0, 5).join(', ')}`);
  console.log('');

  // Search all fashion products
  console.log('Step 2: Searching for products...');
  console.log('');

  const { data: results, error } = await supabase
    .rpc('match_products', {
      query_embedding: embedding,
      match_count: 50
    });

  if (error) {
    console.error('❌ Search failed:', error);
    return;
  }

  console.log(`✅ Search returned ${results.length} results`);
  console.log('');

  // Show top results
  console.log('🟢 TOP 20 RESULTS:');
  results.slice(0, 20).forEach((p, i) => {
    const passes = p.similarity >= 0.3 ? '✅' : '❌';
    console.log(`   ${i + 1}. ${passes} ${p.brand || p.merchant_name || 'Unknown'} - ${p.title.slice(0, 60)}...`);
    console.log(`      Similarity: ${(p.similarity * 100).toFixed(1)}% | Price: ${p.currency} ${p.price || 'N/A'}`);
  });
  console.log('');

  const similarities = results.map(p => p.similarity);
  console.log('Similarity stats:');
  console.log(`   Max: ${(Math.max(...similarities) * 100).toFixed(1)}%`);
  console.log(`   Min: ${(Math.min(...similarities) * 100).toFixed(1)}%`);
  console.log(`   Avg: ${((similarities.reduce((a,b)=>a+b,0)/similarities.length) * 100).toFixed(1)}%`);
  console.log(`   Above 30%: ${results.filter(p => p.similarity >= 0.3).length}`);
  console.log('');

  // Check for dress-related products
  const dressProducts = results.filter(p =>
    p.title?.toLowerCase().includes('dress') ||
    p.description?.toLowerCase().includes('dress')
  );

  console.log('='.repeat(70));
  console.log('ANALYSIS');
  console.log('='.repeat(70));
  console.log(`Products with "dress": ${dressProducts.length}`);
  if (dressProducts.length > 0) {
    console.log('Sample dress products:');
    dressProducts.slice(0, 5).forEach((p, i) => {
      console.log(`   ${i + 1}. ${p.brand || p.merchant_name || 'Unknown'} - ${p.title.slice(0, 60)}...`);
      console.log(`      Similarity: ${(p.similarity * 100).toFixed(1)}%`);
    });
  }
  console.log('');

  if (results.filter(p => p.similarity >= 0.3).length === 0) {
    console.log('⚠️  No products meet 30% threshold');
    console.log('   Consider lowering threshold or checking embedding quality');
  } else {
    console.log(`✅ ${results.filter(p => p.similarity >= 0.3).length} products above 30% threshold`);
  }
  console.log('');
}

testBlackDressSearch()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  });

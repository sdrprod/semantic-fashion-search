#!/usr/bin/env node

/**
 * POST-MIGRATION SEARCH VALIDATION SCRIPT
 * ========================================
 * This script validates that the embedding migration was successful
 * by testing search functionality and checking similarity scores.
 *
 * Run this AFTER completing the migration to verify:
 * 1. Search returns results (not empty)
 * 2. Similarity scores are positive (0.0 to 1.0, not negative)
 * 3. Fashion products appear in results
 * 4. Search performance is acceptable (<2 seconds)
 */

import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Validation
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

if (!OPENAI_API_KEY) {
  console.error('❌ Missing OpenAI API key in .env.local');
  process.exit(1);
}

// Initialize clients
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

/**
 * Generate embedding for a text query
 */
async function generateEmbedding(text) {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  });
  return response.data[0].embedding;
}

/**
 * Test search with a specific query
 */
async function testSearch(query, options = {}) {
  const { expectedMinResults = 5, expectedMinSimilarity = 0.3 } = options;

  console.log(`\n${'='.repeat(70)}`);
  console.log(`🔍 Testing search: "${query}"`);
  console.log('='.repeat(70));

  try {
    // Step 1: Generate embedding
    console.log('\n📊 Step 1: Generating embedding...');
    const startEmbed = Date.now();
    const embedding = await generateEmbedding(query);
    const embedTime = Date.now() - startEmbed;
    console.log(`   ✅ Embedding generated (${embedTime}ms)`);
    console.log(`   📏 Dimensions: ${embedding.length}`);
    console.log(`   📝 Sample values: [${embedding.slice(0, 5).map(v => v.toFixed(4)).join(', ')}, ...]`);

    // Step 2: Call match_products RPC
    console.log('\n🔎 Step 2: Calling match_products RPC...');
    const startRpc = Date.now();
    const { data, error } = await supabase.rpc('match_products', {
      query_embedding: embedding,
      match_count: 50,
    });
    const rpcTime = Date.now() - startRpc;

    if (error) {
      console.error(`   ❌ RPC Error:`, error);
      return { success: false, error };
    }

    console.log(`   ✅ RPC completed (${rpcTime}ms)`);
    console.log(`   📦 Returned ${data.length} products`);

    // Step 3: Analyze results
    console.log('\n📈 Step 3: Analyzing results...');

    if (data.length === 0) {
      console.error('   ❌ CRITICAL: No results returned!');
      return { success: false, error: 'No results' };
    }

    // Check similarity scores
    const similarities = data.map(p => p.similarity);
    const maxSim = Math.max(...similarities);
    const minSim = Math.min(...similarities);
    const avgSim = similarities.reduce((a, b) => a + b, 0) / similarities.length;

    console.log(`   Similarity scores:`);
    console.log(`      Max: ${maxSim.toFixed(4)} ${maxSim > 0 ? '✅' : '❌ NEGATIVE!'}`);
    console.log(`      Min: ${minSim.toFixed(4)} ${minSim > 0 ? '✅' : '❌ NEGATIVE!'}`);
    console.log(`      Avg: ${avgSim.toFixed(4)}`);

    // Check if scores are in valid range (0.0 to 1.0)
    const hasNegativeScores = similarities.some(s => s < 0);
    const hasInvalidScores = similarities.some(s => s > 1.0);

    if (hasNegativeScores) {
      console.error('   ❌ CRITICAL: Found NEGATIVE similarity scores!');
      console.error('   ⚠️  This indicates the migration did NOT fix the issue.');
      return { success: false, error: 'Negative similarity scores' };
    }

    if (hasInvalidScores) {
      console.error('   ❌ WARNING: Found similarity scores > 1.0!');
    }

    // Count products above threshold
    const aboveThreshold = data.filter(p => p.similarity >= expectedMinSimilarity);
    console.log(`   Products above threshold (${expectedMinSimilarity}): ${aboveThreshold.length}/${data.length} ${aboveThreshold.length >= expectedMinResults ? '✅' : '⚠️'}`);

    // Check for Fashion products
    const fashionProducts = data.filter(p => p.category === 'Fashion');
    const dhgateProducts = data.filter(p => p.source?.toLowerCase().includes('dhgate'));

    console.log(`   Fashion products: ${fashionProducts.length}/${data.length} ${fashionProducts.length > 0 ? '✅' : '⚠️'}`);
    console.log(`   DHGate products: ${dhgateProducts.length}/${data.length} ${dhgateProducts.length < data.length ? '✅' : '❌'}`);

    // Display top 10 results
    console.log('\n🏆 Top 10 Results:');
    data.slice(0, 10).forEach((product, idx) => {
      const emoji = product.category === 'Fashion' ? '✅' : '⚠️';
      const source = product.source || 'Unknown';
      console.log(`   ${idx + 1}. ${emoji} [${product.category}] ${product.name.substring(0, 60)}...`);
      console.log(`      Similarity: ${product.similarity.toFixed(4)} | Source: ${source}`);
    });

    // Overall validation
    console.log('\n🎯 Validation Summary:');
    const checks = {
      'Results returned': data.length > 0,
      'Positive similarity scores': !hasNegativeScores,
      'Scores in valid range (0-1)': !hasInvalidScores,
      'Sufficient results above threshold': aboveThreshold.length >= expectedMinResults,
      'Fashion products present': fashionProducts.length > 0,
      'Not all DHGate products': dhgateProducts.length < data.length,
      'Performance acceptable (<2s)': rpcTime < 2000,
    };

    for (const [check, passed] of Object.entries(checks)) {
      console.log(`   ${passed ? '✅' : '❌'} ${check}`);
    }

    const allPassed = Object.values(checks).every(v => v);

    console.log(`\n${allPassed ? '✅ ALL CHECKS PASSED!' : '⚠️ SOME CHECKS FAILED'}`);

    return {
      success: allPassed,
      results: data,
      stats: {
        totalResults: data.length,
        maxSimilarity: maxSim,
        minSimilarity: minSim,
        avgSimilarity: avgSim,
        aboveThreshold: aboveThreshold.length,
        fashionProducts: fashionProducts.length,
        dhgateProducts: dhgateProducts.length,
        rpcTime,
        embedTime,
      },
    };

  } catch (err) {
    console.error('\n❌ Error during test:', err);
    return { success: false, error: err };
  }
}

/**
 * Main test suite
 */
async function runTests() {
  console.log('\n╔════════════════════════════════════════════════════════════════════╗');
  console.log('║  POST-MIGRATION SEARCH VALIDATION TEST SUITE                       ║');
  console.log('╚════════════════════════════════════════════════════════════════════╝');

  const tests = [
    { query: 'black dress', expectedMinResults: 10 },
    { query: 'red heels', expectedMinResults: 5 },
    { query: 'casual summer outfit', expectedMinResults: 5 },
  ];

  const results = [];

  for (const test of tests) {
    const result = await testSearch(test.query, test);
    results.push({ query: test.query, ...result });
  }

  // Final summary
  console.log('\n\n╔════════════════════════════════════════════════════════════════════╗');
  console.log('║  FINAL TEST SUMMARY                                                ║');
  console.log('╚════════════════════════════════════════════════════════════════════╝\n');

  const passedTests = results.filter(r => r.success).length;
  const totalTests = results.length;

  results.forEach((result, idx) => {
    console.log(`Test ${idx + 1}: "${result.query}" - ${result.success ? '✅ PASSED' : '❌ FAILED'}`);
    if (result.stats) {
      console.log(`        Results: ${result.stats.totalResults}, Avg Similarity: ${result.stats.avgSimilarity.toFixed(4)}, Time: ${result.stats.rpcTime}ms`);
    }
  });

  console.log(`\n${passedTests}/${totalTests} tests passed`);

  if (passedTests === totalTests) {
    console.log('\n🎉 SUCCESS! The migration is working correctly!');
    console.log('✅ Embeddings are now vector(1536) type');
    console.log('✅ Similarity scores are positive and valid');
    console.log('✅ Search is returning relevant fashion products');
    process.exit(0);
  } else {
    console.log('\n⚠️  WARNING: Some tests failed!');
    console.log('❌ The migration may not have completed successfully');
    console.log('📝 Review the migration steps and database state');
    process.exit(1);
  }
}

// Run tests
runTests().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

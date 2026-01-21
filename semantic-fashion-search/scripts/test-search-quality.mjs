import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Test queries to validate search quality
const testQueries = [
  'sunglasses',
  'eco friendly bags',
  'fitness equipment',
  'athletic wear',
  'yoga clothes',
  'workout gear',
  'sports apparel',
  'running shoes',
];

async function testSearch(query) {
  console.log(`\n🔍 Testing: "${query}"`);
  console.log('─'.repeat(60));

  // Generate query embedding
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: query,
  });

  const queryEmbedding = response.data[0].embedding;

  // Note: We need to ensure merchant_id is selected
  // The match_products function might not return it, so we'll need to fetch it separately

  // Search products (convert embedding to vector string format)
  const vectorString = `[${queryEmbedding.join(',')}]`;

  const { data: rawResults, error } = await supabase.rpc('match_products', {
    query_embedding: vectorString,
    match_count: 20,
  });

  if (error) {
    console.error('❌ Search error:', error);
    return;
  }

  if (!rawResults || rawResults.length === 0) {
    console.log('⚠️  No results found');
    return;
  }

  // Filter by similarity threshold (0.3) client-side
  const results = rawResults.filter(p => p.similarity >= 0.3);

  console.log(`✅ Found ${results.length} results\n`);

  // Show top 5 results with quality analysis
  results.slice(0, 5).forEach((product, i) => {
    const hasDescription = product.description && product.description.length > 10;
    const qualityIndicator = hasDescription ? '🟢 FULL DESC' : '🟡 TITLE ONLY';
    const merchantType = product.merchant_id?.startsWith('7') ? 'DHgate' : 'Premium';

    console.log(`${i + 1}. [${merchantType}] ${qualityIndicator}`);
    console.log(`   ${product.title.substring(0, 70)}...`);
    console.log(`   Similarity: ${(product.similarity * 100).toFixed(1)}%`);
    console.log(`   Price: $${product.price || 'N/A'}`);
    console.log('');
  });

  // Quality analysis
  const premiumProducts = results.filter(p => !p.merchant_id?.startsWith('7'));
  const dhgateProducts = results.filter(p => p.merchant_id?.startsWith('7'));
  const avgPremiumScore = premiumProducts.length > 0
    ? (premiumProducts.reduce((sum, p) => sum + p.similarity, 0) / premiumProducts.length * 100).toFixed(1)
    : 0;
  const avgDHgateScore = dhgateProducts.length > 0
    ? (dhgateProducts.reduce((sum, p) => sum + p.similarity, 0) / dhgateProducts.length * 100).toFixed(1)
    : 0;

  console.log('📊 QUALITY BREAKDOWN:');
  console.log(`   Premium brands: ${premiumProducts.length} (avg score: ${avgPremiumScore}%)`);
  console.log(`   DHgate: ${dhgateProducts.length} (avg score: ${avgDHgateScore}%)`);

  if (premiumProducts.length > 0 && dhgateProducts.length > 0 && avgPremiumScore > avgDHgateScore) {
    console.log('   ✅ Premium products ranking higher! (as expected)');
  }
}

async function runTests() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║          SEARCH QUALITY VALIDATION TEST                    ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('\nTesting semantic search ranking behavior...');
  console.log('Expected: Premium brands with full descriptions rank higher');
  console.log('          than DHgate products with title-only descriptions\n');

  for (const query of testQueries) {
    await testSearch(query);
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n' + '═'.repeat(60));
  console.log('✅ VALIDATION COMPLETE');
  console.log('═'.repeat(60));
  console.log('\nIf premium products consistently rank higher than DHgate');
  console.log('products, the semantic search quality hierarchy is working!');
  console.log('');
}

runTests().catch(console.error);

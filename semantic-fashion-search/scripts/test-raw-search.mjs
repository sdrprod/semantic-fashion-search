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

async function testRawSearch() {
  console.log('\n🔍 Testing raw search without threshold...\n');

  // Generate query embedding
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: 'sunglasses',
  });

  const queryEmbedding = response.data[0].embedding;
  console.log('Query embedding dimensions:', queryEmbedding.length);
  console.log('First 5 values:', queryEmbedding.slice(0, 5));

  // Convert to vector string
  const vectorString = `[${queryEmbedding.join(',')}]`;
  console.log('Vector string length:', vectorString.length, '\n');

  // Call match_products
  console.log('Calling match_products...');
  const { data, error } = await supabase.rpc('match_products', {
    query_embedding: vectorString,
    match_count: 5,
  });

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  console.log(`\n✅ Received ${data?.length || 0} results\n`);

  if (data && data.length > 0) {
    data.forEach((product, i) => {
      console.log(`${i + 1}. ${product.title}`);
      console.log(`   Similarity: ${product.similarity}`);
      console.log(`   Merchant: ${product.merchant_id}`);
      console.log(`   Description length: ${product.description?.length || 0}`);
      console.log('');
    });
  }
}

testRawSearch().catch(console.error);

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const openaiKey = process.env.OPENAI_API_KEY;

if (!supabaseUrl || !supabaseKey || !openaiKey) {
  console.error('Missing required credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Generate embedding for a query
async function generateEmbedding(text) {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${openaiKey}`,
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: text,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI embedding error: ${response.status} ${errorText}`);
  }

  const json = await response.json();
  return json.data[0]?.embedding;
}

async function testSearch() {
  const query = 'black dress';
  console.log(`\nTesting search for: "${query}"\n`);

  // Generate embedding
  console.log('1. Generating embedding...');
  const embedding = await generateEmbedding(query);
  console.log(`   Embedding length: ${embedding.length}`);
  console.log(`   Embedding sample: [${embedding.slice(0, 5).join(', ')}...]`);

  // Convert to PostgreSQL vector string format
  const vectorString = `[${embedding.join(',')}]`;
  console.log(`   Vector string length: ${vectorString.length}`);
  console.log(`   Vector string sample: ${vectorString.substring(0, 100)}...`);

  // Call match_products
  console.log('\n2. Calling match_products...');
  const result = await supabase.rpc('match_products', {
    query_embedding: vectorString,
    match_count: 10,
  });

  if (result.error) {
    console.error('\n❌ Error calling match_products:');
    console.error('   Message:', result.error.message);
    console.error('   Details:', result.error.details);
    console.error('   Hint:', result.error.hint);
    console.error('   Code:', result.error.code);
    return;
  }

  console.log(`\n✅ Success! Received ${result.data.length} results`);

  if (result.data.length > 0) {
    console.log('\nTop 5 results:');
    result.data.slice(0, 5).forEach((product, i) => {
      console.log(`\n${i + 1}. ${product.title} by ${product.brand}`);
      console.log(`   Similarity: ${product.similarity.toFixed(4)}`);
      console.log(`   Price: $${product.price}`);
    });
  } else {
    console.log('\n⚠️  No results returned');

    // Let's try to understand why
    console.log('\n3. Debugging - checking products table...');
    const { count } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true });
    console.log(`   Total products in database: ${count}`);

    const { data: withEmbedding } = await supabase
      .from('products')
      .select('id', { count: 'exact', head: false })
      .not('embedding', 'is', null);
    console.log(`   Products with embeddings: ${withEmbedding?.length || 0}`);
  }
}

testSearch().catch(console.error);

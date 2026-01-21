import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProducts() {
  console.log('Checking products table...\n');

  // Get total count
  const { count, error: countError } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.error('Error getting count:', countError);
    return;
  }

  console.log(`Total products in database: ${count}`);

  // Get a few sample products
  const { data, error } = await supabase
    .from('products')
    .select('id, title, brand, embedding')
    .limit(5);

  if (error) {
    console.error('Error getting products:', error);
    return;
  }

  console.log('\nSample products:');
  data.forEach((product, i) => {
    console.log(`\n${i + 1}. ${product.title} by ${product.brand}`);
    console.log(`   ID: ${product.id}`);
    console.log(`   Has embedding: ${product.embedding ? 'Yes' : 'No'}`);
    if (product.embedding) {
      console.log(`   Embedding type: ${typeof product.embedding}`);
      console.log(`   Embedding length: ${product.embedding.length}`);
      console.log(`   Embedding is array: ${Array.isArray(product.embedding)}`);
      if (typeof product.embedding === 'string') {
        console.log(`   Embedding (first 100 chars): ${product.embedding.substring(0, 100)}...`);
      } else if (Array.isArray(product.embedding)) {
        console.log(`   Embedding sample: [${product.embedding.slice(0, 5).join(', ')}...]`);
      }
    }
  });

  // Check for products with "black" and "dress" in title
  const { data: blackDresses, error: searchError } = await supabase
    .from('products')
    .select('id, title, brand, embedding')
    .ilike('title', '%black%')
    .ilike('title', '%dress%');

  if (searchError) {
    console.error('\nError searching for black dresses:', searchError);
    return;
  }

  console.log(`\n\nProducts with "black" and "dress" in title: ${blackDresses.length}`);
  blackDresses.forEach((product, i) => {
    console.log(`${i + 1}. ${product.title} by ${product.brand}`);
    console.log(`   Has embedding: ${product.embedding ? 'Yes' : 'No'}`);
  });
}

checkProducts().catch(console.error);

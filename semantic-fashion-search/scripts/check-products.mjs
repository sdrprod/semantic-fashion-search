import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkProducts() {
  console.log('\n📊 Checking DHgate products...\n');

  // Count products by embedding status
  const { data: allProducts } = await supabase
    .from('products')
    .select('id, embedding')
    .eq('merchant_id', '7187');

  const withEmbeddings = allProducts?.filter(p => p.embedding !== null).length || 0;
  const withoutEmbeddings = allProducts?.filter(p => p.embedding === null).length || 0;

  console.log(`Total DHgate products: ${allProducts?.length || 0}`);
  console.log(`  With embeddings: ${withEmbeddings}`);
  console.log(`  Without embeddings: ${withoutEmbeddings}\n`);

  // Show sample products
  const { data: samples } = await supabase
    .from('products')
    .select('title, description, combined_text, embedding')
    .eq('merchant_id', '7187')
    .limit(5);

  console.log('Sample products:\n');
  samples?.forEach((p, i) => {
    console.log(`${i + 1}. ${p.title}`);
    console.log(`   Description: ${p.description?.substring(0, 100) || '(empty)'}...`);
    console.log(`   Combined text: ${p.combined_text?.substring(0, 100) || '(empty)'}...`);
    console.log(`   Has embedding: ${p.embedding ? 'YES' : 'NO'}\n`);
  });
}

checkProducts().catch(console.error);

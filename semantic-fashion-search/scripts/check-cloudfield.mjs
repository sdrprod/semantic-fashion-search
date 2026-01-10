import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkCloudfield() {
  console.log('\n📊 Checking Cloudfield products...\n');

  const { data: products } = await supabase
    .from('products')
    .select('title, description, combined_text, embedding')
    .eq('merchant_id', '16350')
    .limit(5);

  if (!products || products.length === 0) {
    console.log('❌ No Cloudfield products found!');
    return;
  }

  console.log(`Found ${products.length} Cloudfield samples:\n`);

  products.forEach((p, i) => {
    console.log(`${i + 1}. ${p.title}`);
    console.log(`   Description: ${p.description?.substring(0, 100) || '(empty)'}...`);
    console.log(`   Combined text: ${p.combined_text?.substring(0, 100) || '(empty)'}...`);
    console.log(`   Has embedding: ${p.embedding ? 'YES' : 'NO'}`);
    if (p.embedding) {
      console.log(`   Embedding type: ${typeof p.embedding}`);
      console.log(`   Embedding sample: ${JSON.stringify(p.embedding).substring(0, 100)}...`);
    }
    console.log('');
  });
}

checkCloudfield().catch(console.error);

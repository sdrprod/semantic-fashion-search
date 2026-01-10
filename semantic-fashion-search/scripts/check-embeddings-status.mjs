import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkEmbeddings() {
  console.log('\n📊 Checking embedding status...\n');

  // Count total products
  const { data: allProducts, error: allError } = await supabase
    .from('products')
    .select('id, merchant_id, title, embedding', { count: 'exact' });

  if (allError) {
    console.error('Error:', allError);
    return;
  }

  const total = allProducts?.length || 0;
  const withEmbeddings = allProducts?.filter(p => p.embedding !== null).length || 0;
  const withoutEmbeddings = total - withEmbeddings;

  console.log(`Total products: ${total}`);
  console.log(`  With embeddings: ${withEmbeddings}`);
  console.log(`  Without embeddings: ${withoutEmbeddings}\n`);

  // Breakdown by merchant
  const merchantStats = new Map();

  allProducts?.forEach(p => {
    const merchantId = p.merchant_id || 'unknown';
    if (!merchantStats.has(merchantId)) {
      merchantStats.set(merchantId, { total: 0, withEmbeddings: 0 });
    }
    const stats = merchantStats.get(merchantId);
    stats.total++;
    if (p.embedding) stats.withEmbeddings++;
  });

  console.log('By merchant:');
  for (const [merchantId, stats] of merchantStats) {
    const merchantType = merchantId.startsWith('7') ? 'DHgate' : 'Premium';
    const percentage = Math.round((stats.withEmbeddings / stats.total) * 100);
    console.log(`  ${merchantId} (${merchantType}): ${stats.withEmbeddings}/${stats.total} (${percentage}%)`);
  }

  // Show sample products with embeddings
  console.log('\nSample products with embeddings:');
  const withEmb = allProducts?.filter(p => p.embedding !== null).slice(0, 3);
  withEmb?.forEach(p => {
    console.log(`  - ${p.title.substring(0, 60)}... (merchant: ${p.merchant_id})`);
    console.log(`    Embedding length: ${p.embedding.length}`);
  });

  // Show sample products without embeddings
  if (withoutEmbeddings > 0) {
    console.log('\nSample products WITHOUT embeddings:');
    const withoutEmb = allProducts?.filter(p => p.embedding === null).slice(0, 3);
    withoutEmb?.forEach(p => {
      console.log(`  - ${p.title.substring(0, 60)}... (merchant: ${p.merchant_id})`);
    });
  }
}

checkEmbeddings().catch(console.error);

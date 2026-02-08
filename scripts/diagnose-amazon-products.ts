import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../semantic-fashion-search/.env.local') });

import { getSupabaseClient } from '../semantic-fashion-search/lib/supabase';

const supabase = getSupabaseClient();

async function diagnoseAmazonProducts() {
  console.log('\n=== DIAGNOSING AMAZON PRODUCTS ===\n');

  // 1. Count total Amazon products
  const { count: totalAmazon } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('affiliate_network', 'amazon');

  console.log(`Total Amazon products: ${totalAmazon}`);

  // 2. Count with text embeddings
  const { count: withTextEmbeddings } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('affiliate_network', 'amazon')
    .not('text_embedding', 'is', null);

  console.log(`Amazon products with text embeddings: ${withTextEmbeddings}`);

  // 3. Count with vision embeddings
  const { count: withVisionEmbeddings } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('affiliate_network', 'amazon')
    .not('vision_embedding', 'is', null);

  console.log(`Amazon products with vision embeddings: ${withVisionEmbeddings}`);

  // 4. Sample Amazon black dress products
  const { data: blackDresses, error } = await supabase
    .from('products')
    .select('id, title, color, category, price, text_embedding, vision_embedding')
    .eq('affiliate_network', 'amazon')
    .ilike('title', '%black%dress%')
    .limit(10);

  console.log(`\nSample Amazon products with "black dress" in title: ${blackDresses?.length || 0}`);

  if (blackDresses && blackDresses.length > 0) {
    blackDresses.forEach((product, i) => {
      console.log(`\n${i + 1}. ${product.title}`);
      console.log(`   ID: ${product.id}`);
      console.log(`   Color: ${product.color}`);
      console.log(`   Category: ${product.category}`);
      console.log(`   Price: ${product.price}`);
      console.log(`   Has text embedding: ${product.text_embedding ? 'YES' : 'NO'}`);
      console.log(`   Has vision embedding: ${product.vision_embedding ? 'YES' : 'NO'}`);
    });
  }

  // 5. Count Amazon products by color "black"
  const { count: blackProducts } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('affiliate_network', 'amazon')
    .eq('color', 'black');

  console.log(`\nAmazon products with color='black': ${blackProducts}`);

  // 6. Count Amazon products by category "dress"
  const { count: dressProducts } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('affiliate_network', 'amazon')
    .eq('category', 'dress');

  console.log(`Amazon products with category='dress': ${dressProducts}`);

  // 7. Sample any Amazon products
  const { data: anySample } = await supabase
    .from('products')
    .select('id, title, color, category, price, affiliate_network, text_embedding, vision_embedding')
    .eq('affiliate_network', 'amazon')
    .limit(5);

  console.log(`\nFirst 5 Amazon products in database:`);
  anySample?.forEach((product, i) => {
    console.log(`\n${i + 1}. ${product.title}`);
    console.log(`   Color: ${product.color}`);
    console.log(`   Category: ${product.category}`);
    console.log(`   Price: $${product.price}`);
    console.log(`   Text embedding: ${product.text_embedding ? 'YES' : 'NO'}`);
    console.log(`   Vision embedding: ${product.vision_embedding ? 'YES' : 'NO'}`);
  });

  if (error) {
    console.error('Error:', error);
  }

  console.log('\n=== DIAGNOSIS COMPLETE ===\n');
}

diagnoseAmazonProducts().catch(console.error);

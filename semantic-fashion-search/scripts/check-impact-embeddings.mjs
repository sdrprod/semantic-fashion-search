#!/usr/bin/env node

/**
 * Check embeddings status specifically for Impact.com products
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
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

async function checkImpactEmbeddings() {
  console.log('='.repeat(70));
  console.log('IMPACT.COM PRODUCTS EMBEDDINGS STATUS');
  console.log('='.repeat(70));
  console.log('');

  // Total Impact products
  const { count: totalImpact, error: impactError } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('affiliate_network', 'impact');

  if (impactError) {
    console.error('Error counting Impact products:', impactError);
    process.exit(1);
  }

  // Impact products with text embeddings
  const { count: withTextEmbeddings, error: textError } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('affiliate_network', 'impact')
    .not('text_embedding', 'is', null);

  if (textError) {
    console.error('Error counting text embeddings:', textError);
    process.exit(1);
  }

  // Impact products with image embeddings
  const { count: withImageEmbeddings, error: imageError } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('affiliate_network', 'impact')
    .not('image_embedding', 'is', null);

  if (imageError) {
    console.error('Error counting image embeddings:', imageError);
    process.exit(1);
  }

  console.log('📊 IMPACT.COM PRODUCTS:');
  console.log(`   Total products: ${totalImpact}`);
  console.log('');
  console.log('📝 TEXT EMBEDDINGS:');
  console.log(`   With embeddings: ${withTextEmbeddings}`);
  console.log(`   Without embeddings: ${totalImpact - withTextEmbeddings}`);
  console.log(`   Coverage: ${((withTextEmbeddings / totalImpact) * 100).toFixed(1)}%`);
  console.log('');
  console.log('🖼️  IMAGE EMBEDDINGS:');
  console.log(`   With embeddings: ${withImageEmbeddings}`);
  console.log(`   Without embeddings: ${totalImpact - withImageEmbeddings}`);
  console.log(`   Coverage: ${((withImageEmbeddings / totalImpact) * 100).toFixed(1)}%`);
  console.log('');

  // Sample a few products to verify embedding format
  const { data: sampleProducts, error: sampleError } = await supabase
    .from('products')
    .select('id, title, text_embedding, image_embedding')
    .eq('affiliate_network', 'impact')
    .not('text_embedding', 'is', null)
    .limit(3);

  if (sampleError) {
    console.error('Error fetching sample products:', sampleError);
  } else if (sampleProducts && sampleProducts.length > 0) {
    console.log('📋 SAMPLE EMBEDDINGS (first 3 products):');
    sampleProducts.forEach((product, index) => {
      console.log(`\n${index + 1}. ${product.title}`);
      console.log(`   ID: ${product.id}`);
      console.log(`   Text embedding: ${product.text_embedding ? `✅ [${product.text_embedding.length} dimensions]` : '❌ Missing'}`);
      console.log(`   Image embedding: ${product.image_embedding ? `✅ [${product.image_embedding.length} dimensions]` : '❌ Missing'}`);
    });
  }

  console.log('');
  console.log('='.repeat(70));
}

checkImpactEmbeddings()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  });

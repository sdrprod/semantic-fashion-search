#!/usr/bin/env node

/**
 * Check if products have embeddings
 * All products are fashion items from Impact.com
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

async function checkFashionEmbeddings() {
  console.log('='.repeat(70));
  console.log('CHECKING PRODUCT EMBEDDINGS');
  console.log('='.repeat(70));
  console.log('');

  // Count total products (all are fashion)
  console.log('1. Total fashion products...');
  const { data: totalData, count: totalCount } = await supabase
    .from('products')
    .select('id', { count: 'exact' })
    .limit(1);

  console.log(`   Total: ${totalCount}`);
  console.log('');

  // Check products with embeddings
  console.log('2. Products WITH text embeddings...');
  const { data: withEmbData, count: withEmbCount } = await supabase
    .from('products')
    .select('id', { count: 'exact' })
    .not('embedding', 'is', null)
    .limit(1);

  console.log(`   With embeddings: ${withEmbCount}`);
  console.log('');

  // Sample products with embeddings
  console.log('3. Sample products WITH embeddings:');
  const { data: samples } = await supabase
    .from('products')
    .select('brand, title, embedding')
    .not('embedding', 'is', null)
    .limit(5);

  if (samples && samples.length > 0) {
    samples.forEach((p, i) => {
      const embLength = p.embedding ? (typeof p.embedding === 'string' ? 'string' : 'vector') : 'null';
      console.log(`   ${i + 1}. ${p.brand} - ${p.title.slice(0, 60)}...`);
      console.log(`      Embedding: ${embLength}`);
    });
  } else {
    console.log('   ❌ NO products with embeddings found!');
  }
  console.log('');

  console.log('='.repeat(70));
  console.log('SUMMARY');
  console.log('='.repeat(70));
  console.log(`Total fashion products: ${totalCount}`);
  console.log('');
  console.log('Text Embeddings:');
  console.log(`  Products with embeddings: ${withEmbCount}/${totalCount} (${((withEmbCount / totalCount) * 100).toFixed(1)}%)`);
  console.log('');

  if (withEmbCount === 0) {
    console.log('❌ CRITICAL: Products have NO embeddings!');
    console.log('   Need to regenerate embeddings for all products.');
  } else if (withEmbCount < totalCount) {
    console.log('⚠️  WARNING: Not all products have embeddings.');
    console.log(`   ${totalCount - withEmbCount} products are missing embeddings.`);
  } else {
    console.log('✅ All products have text embeddings.');
  }
  console.log('');
}

checkFashionEmbeddings()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  });

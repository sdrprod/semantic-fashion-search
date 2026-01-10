#!/usr/bin/env node

/**
 * Check status of image embeddings and look for errors
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

async function checkImageEmbeddingStatus() {
  console.log('='.repeat(70));
  console.log('IMAGE EMBEDDINGS STATUS');
  console.log('='.repeat(70));
  console.log('');

  // Total products (all are fashion)
  const { count: total } = await supabase
    .from('products')
    .select('id', { count: 'exact', head: true });

  // Products with image embeddings
  const { count: withImageEmb } = await supabase
    .from('products')
    .select('id', { count: 'exact', head: true })
    .not('image_embedding', 'is', null);

  // Products with image embedding errors
  const { count: withErrors } = await supabase
    .from('products')
    .select('id', { count: 'exact', head: true })
    .not('image_embedding_error', 'is', null);

  console.log('📊 OVERVIEW:');
  console.log(`   Total fashion products: ${total}`);
  console.log('');

  console.log('🖼️  IMAGE EMBEDDINGS:');
  console.log(`   With embeddings: ${withImageEmb}/${total} (${((withImageEmb / total) * 100).toFixed(1)}%)`);
  console.log(`   With errors: ${withErrors}/${total} (${((withErrors / total) * 100).toFixed(1)}%)`);
  console.log(`   Pending: ${total - withImageEmb - withErrors}`);
  console.log('');

  // Sample errors
  if (withErrors > 0) {
    console.log('❌ SAMPLE ERRORS:');
    const { data: errorSamples } = await supabase
      .from('products')
      .select('brand, title, image_url, image_embedding_error')
      .not('image_embedding_error', 'is', null)
      .limit(10);

    if (errorSamples && errorSamples.length > 0) {
      errorSamples.forEach((p, i) => {
        console.log(`   ${i + 1}. ${p.brand} - ${p.title.slice(0, 50)}...`);
        console.log(`      Error: ${p.image_embedding_error}`);
        console.log(`      Image URL: ${p.image_url?.slice(0, 80)}...`);
        console.log('');
      });
    }

    // Count 404 errors
    const { count: errors404 } = await supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .ilike('image_embedding_error', '%404%');

    console.log(`   404 errors: ${errors404}/${withErrors} (${((errors404 / withErrors) * 100).toFixed(1)}%)`);
    console.log('');
  }

  // Sample successful embeddings
  console.log('✅ SAMPLE SUCCESSFUL:');
  const { data: successSamples } = await supabase
    .from('products')
    .select('brand, title, image_url, image_embedding')
    .not('image_embedding', 'is', null)
    .limit(5);

  if (successSamples && successSamples.length > 0) {
    successSamples.forEach((p, i) => {
      const embType = typeof p.image_embedding === 'string' ? 'text' : 'vector';
      console.log(`   ${i + 1}. ${p.brand} - ${p.title.slice(0, 50)}...`);
      console.log(`      Type: ${embType}`);
    });
  }

  console.log('');
  console.log('='.repeat(70));
  console.log('RECOMMENDATIONS:');
  console.log('='.repeat(70));

  if (withErrors > withImageEmb / 2) {
    console.log('⚠️  HIGH ERROR RATE - More than 50% of attempts failed');
    console.log('   Should investigate and fix image URLs before continuing');
  }

  if (withImageEmb > 0) {
    console.log('✅ Some embeddings successfully generated');
    console.log('   Column type: Check if image_embedding is text or vector');
    console.log('   If text, it needs conversion along with text embeddings');
  }

  if (total - withImageEmb - withErrors > 1000) {
    console.log(`⚠️  Many products still pending (${total - withImageEmb - withErrors})`);
    console.log('   Consider running: node scripts/generate-impact-image-embeddings.mjs');
  }

  console.log('');
}

checkImageEmbeddingStatus()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  });

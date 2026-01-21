#!/usr/bin/env node

/**
 * Clean up products with broken image URLs (404 errors)
 * Useful for removing old DHGate products with expired images
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') });
dotenv.config({ path: join(__dirname, '..', '.env') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkImageUrl(url) {
  try {
    const response = await fetch(url, { method: 'HEAD', timeout: 5000 });
    return response.ok;
  } catch (error) {
    return false;
  }
}

async function cleanupBrokenImages(dryRun = true) {
  console.log('='.repeat(70));
  console.log('CLEANUP PRODUCTS WITH BROKEN IMAGES');
  console.log('='.repeat(70));
  console.log('');
  console.log(`Mode: ${dryRun ? 'DRY RUN (no changes)' : 'LIVE (will delete)'}`);
  console.log('');

  // Get products with image_embedding_error containing "404"
  const { data: products, error: fetchError } = await supabase
    .from('products')
    .select('id, title, brand, image_url, image_embedding_error')
    .or('image_embedding_error.ilike.%404%,image_embedding_error.ilike.%Failed to fetch image%')
    .limit(500);

  if (fetchError) {
    console.error('Error fetching products:', fetchError);
    process.exit(1);
  }

  if (!products || products.length === 0) {
    console.log('✅ No products with broken images found!');
    return;
  }

  console.log(`Found ${products.length} products with image errors`);
  console.log('');

  let deleted = 0;
  let kept = 0;

  for (const product of products) {
    console.log(`Checking: ${product.brand} - ${product.title.slice(0, 50)}...`);
    console.log(`  Image: ${product.image_url.slice(0, 80)}...`);
    console.log(`  Error: ${product.image_embedding_error}`);

    const imageWorks = await checkImageUrl(product.image_url);

    if (!imageWorks) {
      console.log(`  ❌ Image is broken`);

      if (!dryRun) {
        const { error: deleteError } = await supabase
          .from('products')
          .delete()
          .eq('id', product.id);

        if (deleteError) {
          console.error(`  ❌ Failed to delete:`, deleteError.message);
        } else {
          console.log(`  🗑️  Deleted`);
          deleted++;
        }
      } else {
        console.log(`  🗑️  Would delete (dry run)`);
        deleted++;
      }
    } else {
      console.log(`  ✅ Image is working - clearing error`);
      kept++;

      if (!dryRun) {
        await supabase
          .from('products')
          .update({ image_embedding_error: null })
          .eq('id', product.id);
      }
    }

    console.log('');

    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  console.log('='.repeat(70));
  console.log('CLEANUP SUMMARY');
  console.log('='.repeat(70));
  console.log(`Products checked: ${products.length}`);
  console.log(`Would delete: ${deleted}`);
  console.log(`Would keep: ${kept}`);
  console.log('');

  if (dryRun) {
    console.log('This was a DRY RUN - no changes were made');
    console.log('To actually delete, run: node cleanup-broken-images.mjs --live');
  } else {
    console.log(`✅ Deleted ${deleted} products with broken images`);
  }
}

// Parse arguments
const isLive = process.argv.includes('--live');

cleanupBrokenImages(!isLive)
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });

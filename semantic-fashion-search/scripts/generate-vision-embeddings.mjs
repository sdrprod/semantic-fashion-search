#!/usr/bin/env node

/**
 * Generate vision embeddings for products
 * Run this after syncing products to add image-based search capabilities
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { generateImageVisionEmbedding } from '../lib/vision-embeddings.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env.local first, then .env
dotenv.config({ path: join(__dirname, '..', '.env.local') });
dotenv.config({ path: join(__dirname, '..', '.env') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function generateVisionEmbeddings() {
  console.log('='.repeat(70));
  console.log('GENERATE VISION EMBEDDINGS FOR PRODUCTS');
  console.log('='.repeat(70));
  console.log('');

  try {
    // Get products without vision embeddings
    console.log('Fetching products needing vision embeddings...');
    const { data: products, error: fetchError } = await supabase
      .from('products')
      .select('id, image_url, title, brand')
      .is('image_embedding', null)
      .not('image_url', 'is', null)
      .limit(500); // Process in batches of 500

    if (fetchError) {
      console.error('Error fetching products:', fetchError);
      process.exit(1);
    }

    if (!products || products.length === 0) {
      console.log('✅ All products already have vision embeddings!');
      return;
    }

    console.log(`Found ${products.length} products needing vision embeddings`);
    console.log('');

    let processed = 0;
    let succeeded = 0;
    let failed = 0;

    // Process each product
    for (const product of products) {
      processed++;
      const progress = `[${processed}/${products.length}]`;

      try {
        console.log(`${progress} Processing: ${product.brand} - ${product.title.slice(0, 50)}...`);

        // Generate vision embedding for the image
        const embedding = await generateImageVisionEmbedding(product.image_url);

        // Convert to PostgreSQL vector format
        const vectorString = `[${embedding.join(',')}]`;

        // Update the product with the vision embedding
        const { error: updateError } = await supabase
          .from('products')
          .update({
            image_embedding: vectorString,
            image_embedding_generated_at: new Date().toISOString(),
            image_embedding_error: null,
          })
          .eq('id', product.id);

        if (updateError) {
          console.error(`${progress} ❌ Database update failed:`, updateError.message);
          failed++;
        } else {
          console.log(`${progress} ✅ Success`);
          succeeded++;
        }

      } catch (error) {
        console.error(`${progress} ❌ Failed:`, error.message);

        // Record the error in the database
        await supabase
          .from('products')
          .update({
            image_embedding_error: error.message.slice(0, 500),
          })
          .eq('id', product.id);

        failed++;
      }

      // Rate limiting - don't overwhelm the image servers
      if (processed < products.length) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      // Progress update every 10 products
      if (processed % 10 === 0) {
        console.log('');
        console.log(`Progress: ${processed}/${products.length} (${succeeded} succeeded, ${failed} failed)`);
        console.log('');
      }
    }

    // Final summary
    console.log('');
    console.log('='.repeat(70));
    console.log('SUMMARY');
    console.log('='.repeat(70));
    console.log(`Total processed: ${processed}`);
    console.log(`Succeeded: ${succeeded}`);
    console.log(`Failed: ${failed}`);
    console.log(`Success rate: ${((succeeded / processed) * 100).toFixed(1)}%`);
    console.log('');

    if (failed > 0) {
      console.log('⚠️  Some products failed. Run this script again to retry failed products.');
    } else {
      console.log('✅ All products processed successfully!');
    }

  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

// Run the script
generateVisionEmbeddings()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });

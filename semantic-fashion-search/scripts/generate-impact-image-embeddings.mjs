#!/usr/bin/env node

/**
 * Generate image embeddings ONLY for Impact.com products
 * This ensures we only process the new fashion products, not old DHGate items
 */

import { createClient } from '@supabase/supabase-js';
import {
  AutoProcessor,
  CLIPVisionModelWithProjection,
  RawImage,
  env as transformersEnv
} from '@xenova/transformers';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') });
dotenv.config({ path: join(__dirname, '..', '.env') });

// Configure transformers to cache models locally
transformersEnv.cacheDir = './.cache/transformers';

// Model and processor will be loaded on first use
let clipProcessor = null;
let clipModel = null;

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Initialize CLIP model and processor
 */
async function initializeModel() {
  if (!clipProcessor || !clipModel) {
    console.log('Loading CLIP vision model (this may take a few minutes on first run)...');
    clipProcessor = await AutoProcessor.from_pretrained('Xenova/clip-vit-base-patch32');
    clipModel = await CLIPVisionModelWithProjection.from_pretrained('Xenova/clip-vit-base-patch32');
    console.log('✅ Model loaded successfully\n');
  }
}

/**
 * Generate image embedding for a single product
 */
async function generateImageEmbedding(imageUrl) {
  try {
    // Load and process image
    const image = await RawImage.fromURL(imageUrl);
    const imageInputs = await clipProcessor(image);

    // Generate embedding
    const { image_embeds } = await clipModel(imageInputs);

    // Convert to array and return
    return Array.from(image_embeds.data);
  } catch (error) {
    throw new Error(`Failed to generate embedding: ${error.message}`);
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('='.repeat(70));
  console.log('GENERATE IMAGE EMBEDDINGS FOR IMPACT.COM PRODUCTS');
  console.log('='.repeat(70));
  console.log('');

  // Initialize model
  await initializeModel();

  // Count total Impact products needing embeddings
  console.log('Counting Impact.com products needing image embeddings...');
  const { count: totalCount, error: countError } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('affiliate_network', 'impact')
    .is('image_embedding', null)
    .not('image_url', 'is', null);

  if (countError) {
    console.error('Error counting products:', countError);
    process.exit(1);
  }

  console.log(`Found ${totalCount} Impact.com products needing image embeddings`);
  console.log('');

  if (totalCount === 0) {
    console.log('✅ All Impact.com products already have image embeddings!');
    return;
  }

  // Estimate time
  const estimatedSeconds = totalCount * 1.5; // ~1.5 seconds per image
  const estimatedMinutes = Math.ceil(estimatedSeconds / 60);
  const estimatedHours = Math.floor(estimatedMinutes / 60);

  console.log('Estimates:');
  if (estimatedHours > 0) {
    console.log(`  Time: ~${estimatedHours}h ${estimatedMinutes % 60}m`);
  } else {
    console.log(`  Time: ~${estimatedMinutes} minutes`);
  }
  console.log('');

  // Process in batches
  const BATCH_SIZE = 50;
  let totalProcessed = 0;
  let totalSucceeded = 0;
  let totalFailed = 0;

  while (totalProcessed < totalCount) {
    // Fetch next batch
    const { data: products, error: fetchError } = await supabase
      .from('products')
      .select('id, image_url, title, brand')
      .eq('affiliate_network', 'impact')
      .is('image_embedding', null)
      .not('image_url', 'is', null)
      .limit(BATCH_SIZE);

    if (fetchError) {
      console.error('Error fetching batch:', fetchError);
      break;
    }

    if (!products || products.length === 0) {
      break;
    }

    console.log(`\nProcessing batch ${Math.floor(totalProcessed / BATCH_SIZE) + 1}: ${products.length} products`);

    // Process each product in batch
    for (const product of products) {
      try {
        // Generate embedding
        const embedding = await generateImageEmbedding(product.image_url);

        // Update database
        const { error: updateError } = await supabase
          .from('products')
          .update({ image_embedding: embedding })
          .eq('id', product.id);

        if (updateError) {
          console.error(`  ❌ Failed to update product ${product.id}:`, updateError.message);
          totalFailed++;
        } else {
          totalSucceeded++;

          // Progress indicator
          if (totalSucceeded % 10 === 0) {
            const progress = ((totalSucceeded / totalCount) * 100).toFixed(1);
            console.log(`  Progress: ${totalSucceeded}/${totalCount} (${progress}%)`);
          }
        }
      } catch (error) {
        console.error(`  ❌ Error processing ${product.brand} - ${product.title}:`, error.message);
        totalFailed++;
      }

      totalProcessed++;
    }

    // Small delay between batches
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Final summary
  console.log('');
  console.log('='.repeat(70));
  console.log('SUMMARY');
  console.log('='.repeat(70));
  console.log(`Total processed: ${totalProcessed}`);
  console.log(`Succeeded: ${totalSucceeded}`);
  console.log(`Failed: ${totalFailed}`);
  console.log(`Success rate: ${((totalSucceeded / totalProcessed) * 100).toFixed(1)}%`);
  console.log('');

  if (totalFailed > 0) {
    console.log('⚠️  Some embeddings failed. Run this script again to retry failed products.');
  } else {
    console.log('✅ All Impact.com products now have image embeddings!');
  }
}

main()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  });

#!/usr/bin/env node

/**
 * Generate vision embeddings for products
 * Standalone version that doesn't require TypeScript compilation
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

// Get the directory of this script
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from parent directory (semantic-fashion-search/)
dotenv.config({ path: join(__dirname, '..', '.env') });

// Configure transformers to cache models locally
transformersEnv.cacheDir = './.cache/transformers';

// Model and processor will be loaded on first use
let clipProcessor = null;
let clipVisionModel = null;

async function getClipModels() {
  if (!clipProcessor || !clipVisionModel) {
    console.log('[Vision] Loading CLIP vision model and processor (first time may take a moment)...');
    clipProcessor = await AutoProcessor.from_pretrained('Xenova/clip-vit-base-patch32');
    // Use the vision-specific model, not the full CLIP model
    clipVisionModel = await CLIPVisionModelWithProjection.from_pretrained('Xenova/clip-vit-base-patch32');
    console.log('[Vision] CLIP vision model loaded successfully');
  }
  return { processor: clipProcessor, model: clipVisionModel };
}

async function generateImageVisionEmbedding(imageUrl) {
  console.log(`[Vision] Processing image: ${imageUrl.slice(0, 80)}...`);

  try {
    // Load the image using RawImage (handles downloading and decoding)
    const image = await RawImage.fromURL(imageUrl);

    // Get the CLIP models
    const { processor, model } = await getClipModels();

    // Process the image for CLIP (creates pixel_values tensor)
    const imageInputs = await processor(image);

    // Generate embedding from vision model
    const output = await model(imageInputs);

    // Get the image embeddings (projected to shared space)
    const embedding = output.image_embeds;

    // Convert to regular array
    const embeddingArray = Array.from(embedding.data);

    // Normalize the embedding
    const norm = Math.sqrt(embeddingArray.reduce((sum, val) => sum + val * val, 0));
    const normalizedEmbedding = embeddingArray.map(val => val / norm);

    console.log(`[Vision] Generated image embedding (${normalizedEmbedding.length}d)`);

    return normalizedEmbedding;
  } catch (error) {
    console.error(`[Vision] Error processing image:`, error.message);
    throw error;
  }
}

async function main() {
  console.log('='.repeat(70));
  console.log('GENERATE VISION EMBEDDINGS FOR PRODUCTS');
  console.log('='.repeat(70));
  console.log('');

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // Get overall counts first
    console.log('Checking overall progress...');
    const { count: totalProducts } = await supabase
      .from('products')
      .select('id', { count: 'exact', head: true });

    const { count: completedProducts } = await supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .not('image_embedding', 'is', null);

    const remainingProducts = totalProducts - completedProducts;

    console.log(`Total products: ${totalProducts}`);
    console.log(`Completed: ${completedProducts} (${((completedProducts / totalProducts) * 100).toFixed(1)}%)`);
    console.log(`Remaining: ${remainingProducts}`);
    console.log('');

    // Get products without vision embeddings
    console.log('Fetching next batch of products needing vision embeddings...');
    const { data: products, error: fetchError } = await supabase
      .from('products')
      .select('id, image_url, title, brand')
      .is('image_embedding', null)
      .not('image_url', 'is', null)
      .limit(500); // Process in batches of 500
    console.log('DEBUG: First 5 product IDs:', products.slice(0, 5).map(p => ({ id: p.id, title: p.title })));

    if (fetchError) {
      console.error('Error fetching products:', fetchError);
      process.exit(1);
    }

    if (!products || products.length === 0) {
      console.log('✅ All products already have vision embeddings!');
      return;
    }

    console.log(`Found ${products.length} products in this batch`);
    console.log('');

    let processed = 0;
    let succeeded = 0;
    let failed = 0;

    // Process each product
    for (const product of products) {
      processed++;
      const overallProgress = completedProducts + processed;
      const progress = `[${overallProgress}/${totalProducts}]`;

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
        const currentTotal = completedProducts + succeeded;
        const percentComplete = ((currentTotal / totalProducts) * 100).toFixed(1);
        console.log('');
        console.log(`Overall Progress: ${currentTotal}/${totalProducts} (${percentComplete}%) | This batch: ${succeeded} succeeded, ${failed} failed`);
        console.log('');
      }
    }

    // Final summary
    const finalTotal = completedProducts + succeeded;
    const finalPercentComplete = ((finalTotal / totalProducts) * 100).toFixed(1);
    const remainingAfterBatch = totalProducts - finalTotal;

    console.log('');
    console.log('='.repeat(70));
    console.log('BATCH SUMMARY');
    console.log('='.repeat(70));
    console.log(`This batch processed: ${processed}`);
    console.log(`This batch succeeded: ${succeeded}`);
    console.log(`This batch failed: ${failed}`);
    console.log(`Batch success rate: ${((succeeded / processed) * 100).toFixed(1)}%`);
    console.log('');
    console.log('='.repeat(70));
    console.log('OVERALL PROGRESS');
    console.log('='.repeat(70));
    console.log(`Total products: ${totalProducts}`);
    console.log(`Completed: ${finalTotal} (${finalPercentComplete}%)`);
    console.log(`Remaining: ${remainingAfterBatch}`);
    console.log('');

    if (failed > 0) {
      console.log('⚠️  Some products failed. Run this script again to retry failed products.');
    } else if (remainingAfterBatch > 0) {
      console.log(`✅ Batch completed successfully! Run again to process ${remainingAfterBatch} remaining products.`);
    } else {
      console.log('✅ All products have vision embeddings!');
    }

  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

// Run the script
main()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });

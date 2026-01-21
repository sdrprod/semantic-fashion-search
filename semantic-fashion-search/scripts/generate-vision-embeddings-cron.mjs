#!/usr/bin/env node

/**
 * CRON-READY Vision Embeddings Generator
 *
 * Optimized for automated/scheduled execution:
 * - Batch processing with configurable limits
 * - Comprehensive logging to file
 * - Error handling and retries
 * - Exit codes for monitoring
 * - Optional notifications
 *
 * USAGE:
 * # Manual run
 * node scripts/generate-vision-embeddings-cron.mjs
 *
 * # Cron schedule (every hour)
 * 0 * * * * cd /path/to/project && node scripts/generate-vision-embeddings-cron.mjs >> logs/vision-embeddings.log 2>&1
 *
 * # Cron schedule (every 6 hours)
 * 0 */6 * * * cd /path/to/project && node scripts/generate-vision-embeddings-cron.mjs >> logs/vision-embeddings.log 2>&1
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
import { writeFileSync, mkdirSync, existsSync } from 'fs';

// Get the directory of this script
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from parent directory
dotenv.config({ path: join(__dirname, '..', '.env') });

// Configuration
const CONFIG = {
  BATCH_SIZE: parseInt(process.env.VISION_BATCH_SIZE || '500'),
  MAX_RETRIES: 3,
  RETRY_DELAY_MS: 5000,
  LOG_DIRECTORY: join(__dirname, '..', 'logs'),
  ENABLE_NOTIFICATIONS: process.env.ENABLE_VISION_NOTIFICATIONS === 'true',
  NOTIFICATION_EMAIL: process.env.NOTIFICATION_EMAIL || '',
};

// Configure transformers
transformersEnv.cacheDir = './.cache/transformers';

// Model cache
let clipProcessor = null;
let clipVisionModel = null;

// Logging utilities
function getTimestamp() {
  return new Date().toISOString();
}

function log(level, message, data = null) {
  const logEntry = {
    timestamp: getTimestamp(),
    level,
    message,
    ...(data && { data }),
  };

  const logLine = data
    ? `[${logEntry.timestamp}] ${level}: ${message} ${JSON.stringify(data)}`
    : `[${logEntry.timestamp}] ${level}: ${message}`;

  console.log(logLine);

  // Also write to log file
  try {
    if (!existsSync(CONFIG.LOG_DIRECTORY)) {
      mkdirSync(CONFIG.LOG_DIRECTORY, { recursive: true });
    }

    const logFile = join(CONFIG.LOG_DIRECTORY, `vision-embeddings-${new Date().toISOString().split('T')[0]}.log`);
    writeFileSync(logFile, logLine + '\n', { flag: 'a' });
  } catch (error) {
    console.error('Failed to write log file:', error.message);
  }
}

async function getClipModels() {
  if (!clipProcessor || !clipVisionModel) {
    log('INFO', 'Loading CLIP vision model and processor...');
    clipProcessor = await AutoProcessor.from_pretrained('Xenova/clip-vit-base-patch32');
    clipVisionModel = await CLIPVisionModelWithProjection.from_pretrained('Xenova/clip-vit-base-patch32');
    log('INFO', 'CLIP vision model loaded successfully');
  }
  return { processor: clipProcessor, model: clipVisionModel };
}

async function generateImageVisionEmbedding(imageUrl, retries = 0) {
  try {
    const image = await RawImage.fromURL(imageUrl);
    const { processor, model } = await getClipModels();
    const imageInputs = await processor(image);
    const output = await model(imageInputs);
    const embedding = output.image_embeds;
    const embeddingArray = Array.from(embedding.data);

    // Normalize
    const norm = Math.sqrt(embeddingArray.reduce((sum, val) => sum + val * val, 0));
    const normalizedEmbedding = embeddingArray.map(val => val / norm);

    return normalizedEmbedding;
  } catch (error) {
    if (retries < CONFIG.MAX_RETRIES) {
      log('WARN', `Retry ${retries + 1}/${CONFIG.MAX_RETRIES} for image`, { url: imageUrl, error: error.message });
      await new Promise(resolve => setTimeout(resolve, CONFIG.RETRY_DELAY_MS));
      return generateImageVisionEmbedding(imageUrl, retries + 1);
    }
    throw error;
  }
}

async function sendNotification(subject, body) {
  if (!CONFIG.ENABLE_NOTIFICATIONS || !CONFIG.NOTIFICATION_EMAIL) {
    return;
  }

  // TODO: Implement notification system (email, Slack, etc.)
  log('INFO', 'Notification would be sent', { subject, to: CONFIG.NOTIFICATION_EMAIL });
}

async function main() {
  const startTime = Date.now();
  log('INFO', '='.repeat(70));
  log('INFO', 'VISION EMBEDDINGS CRON JOB STARTED');
  log('INFO', '='.repeat(70));
  log('INFO', 'Configuration', {
    batchSize: CONFIG.BATCH_SIZE,
    maxRetries: CONFIG.MAX_RETRIES,
    notifications: CONFIG.ENABLE_NOTIFICATIONS,
  });

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  let exitCode = 0;

  try {
    // Check total remaining
    const { count: totalRemaining } = await supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .is('image_embedding', null)
      .not('image_url', 'is', null);

    log('INFO', `Total products needing embeddings: ${totalRemaining || 0}`);

    if (!totalRemaining || totalRemaining === 0) {
      log('INFO', 'All products have vision embeddings. Nothing to do.');
      await sendNotification(
        'Vision Embeddings: Complete',
        'All products have vision embeddings.'
      );
      process.exit(0);
    }

    // Fetch batch to process
    const { data: products, error: fetchError } = await supabase
      .from('products')
      .select('id, image_url, title, brand')
      .is('image_embedding', null)
      .not('image_url', 'is', null)
      .limit(CONFIG.BATCH_SIZE);

    if (fetchError) {
      log('ERROR', 'Failed to fetch products', { error: fetchError });
      exitCode = 1;
      throw fetchError;
    }

    if (!products || products.length === 0) {
      log('INFO', 'No products to process.');
      process.exit(0);
    }

    log('INFO', `Processing batch of ${products.length} products`);

    let processed = 0;
    let succeeded = 0;
    let failed = 0;
    const failedProducts = [];

    // Process each product
    for (const product of products) {
      processed++;

      try {
        const embedding = await generateImageVisionEmbedding(product.image_url);
        const vectorString = `[${embedding.join(',')}]`;

        const { error: updateError } = await supabase
          .from('products')
          .update({
            image_embedding: vectorString,
            image_embedding_generated_at: new Date().toISOString(),
            image_embedding_error: null,
          })
          .eq('id', product.id);

        if (updateError) {
          log('ERROR', 'Database update failed', {
            product: product.title,
            error: updateError.message,
          });
          failed++;
          failedProducts.push({ id: product.id, title: product.title, error: updateError.message });
        } else {
          succeeded++;
          if (succeeded % 50 === 0) {
            log('INFO', `Progress: ${succeeded}/${products.length} completed`);
          }
        }

      } catch (error) {
        log('ERROR', 'Failed to process product', {
          product: product.title,
          error: error.message,
        });

        // Record error in database
        await supabase
          .from('products')
          .update({
            image_embedding_error: error.message.slice(0, 500),
          })
          .eq('id', product.id);

        failed++;
        failedProducts.push({ id: product.id, title: product.title, error: error.message });
      }

      // Rate limiting
      if (processed < products.length) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    // Summary
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    const successRate = ((succeeded / processed) * 100).toFixed(1);
    const remaining = totalRemaining - succeeded;

    log('INFO', '='.repeat(70));
    log('INFO', 'SUMMARY');
    log('INFO', '='.repeat(70));
    log('INFO', 'Results', {
      processed,
      succeeded,
      failed,
      successRate: `${successRate}%`,
      duration: `${duration}s`,
      remaining,
    });

    if (failedProducts.length > 0) {
      log('WARN', `${failedProducts.length} products failed`, {
        samples: failedProducts.slice(0, 5),
      });
    }

    // Send notification if enabled
    if (CONFIG.ENABLE_NOTIFICATIONS) {
      const subject = failed > 0
        ? `Vision Embeddings: Completed with ${failed} failures`
        : `Vision Embeddings: ${succeeded} products processed successfully`;

      const body = `
Batch Processing Complete

Processed: ${processed}
Succeeded: ${succeeded}
Failed: ${failed}
Success Rate: ${successRate}%
Duration: ${duration}s
Remaining: ${remaining}

${failed > 0 ? `\nFailed products:\n${failedProducts.slice(0, 10).map(p => `- ${p.title}: ${p.error}`).join('\n')}` : ''}
      `.trim();

      await sendNotification(subject, body);
    }

    // Set exit code
    if (failed > 0 && succeeded === 0) {
      exitCode = 1; // All failed
    } else if (failed > 0) {
      exitCode = 2; // Partial success
    }

  } catch (error) {
    log('ERROR', 'Fatal error', { error: error.message, stack: error.stack });
    await sendNotification(
      'Vision Embeddings: FAILED',
      `Fatal error: ${error.message}\n\nStack trace:\n${error.stack}`
    );
    exitCode = 1;
  }

  const totalDuration = ((Date.now() - startTime) / 1000).toFixed(1);
  log('INFO', `Job completed in ${totalDuration}s with exit code ${exitCode}`);
  process.exit(exitCode);
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  log('ERROR', 'Uncaught exception', { error: error.message, stack: error.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  log('ERROR', 'Unhandled rejection', { reason, promise });
  process.exit(1);
});

// Run
main();

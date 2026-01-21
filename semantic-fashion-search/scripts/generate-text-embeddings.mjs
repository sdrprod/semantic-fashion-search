#!/usr/bin/env node

/**
 * Generate text embeddings for all products missing embeddings
 *
 * USAGE:
 *   node scripts/generate-text-embeddings.mjs
 *
 * This script calls the admin API endpoint to generate embeddings
 * for products in batches until all products have embeddings.
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') });
dotenv.config({ path: join(__dirname, '..', '.env') });

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const ADMIN_SECRET = process.env.ADMIN_SECRET;
const BATCH_SIZE = 100; // Process 100 products at a time

if (!ADMIN_SECRET) {
  console.error('❌ ADMIN_SECRET not found in environment');
  process.exit(1);
}

/**
 * Call the admin API endpoint
 */
async function callAdminAPI(action, batchSize = BATCH_SIZE) {
  const response = await fetch(`${API_BASE}/api/admin/generate-embeddings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-secret': ADMIN_SECRET,
    },
    body: JSON.stringify({ action, batchSize }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API error ${response.status}: ${error}`);
  }

  return await response.json();
}

/**
 * Main execution
 */
async function main() {
  console.log('='.repeat(70));
  console.log('GENERATE TEXT EMBEDDINGS FOR PRODUCTS');
  console.log('='.repeat(70));
  console.log('');

  console.log('Checking server availability...');
  try {
    await fetch(API_BASE);
    console.log(`✅ Server running at ${API_BASE}`);
  } catch (err) {
    console.error('❌ Server not responding at', API_BASE);
    console.error('Please start the dev server first: npm run dev');
    process.exit(1);
  }

  // Count products needing embeddings
  console.log('\nCounting products without embeddings...');
  const countResult = await callAdminAPI('count');
  const totalToProcess = countResult.count;

  console.log(`Found ${totalToProcess} products needing embeddings`);
  console.log('');

  if (totalToProcess === 0) {
    console.log('✅ All products already have embeddings!');
    return;
  }

  // Estimate cost and time
  const estimatedCost = (totalToProcess / 1000) * 0.02; // $0.02 per 1K tokens (rough estimate)
  const estimatedMinutes = Math.ceil((totalToProcess * 0.1) / 60); // 100ms per product

  console.log('Estimates:');
  console.log(`  Cost: ~$${estimatedCost.toFixed(2)} (OpenAI API)`);
  console.log(`  Time: ~${estimatedMinutes} minutes`);
  console.log(`  Batch size: ${BATCH_SIZE} products per request`);
  console.log('');

  // Process in batches
  let totalGenerated = 0;
  let totalErrors = 0;
  let batchNumber = 1;

  while (totalGenerated < totalToProcess) {
    const remaining = totalToProcess - totalGenerated;
    const currentBatchSize = Math.min(BATCH_SIZE, remaining);

    console.log(`Batch ${batchNumber}: Processing ${currentBatchSize} products...`);

    try {
      const result = await callAdminAPI('generate', currentBatchSize);

      totalGenerated += result.generated;
      totalErrors += result.errors;

      const progress = ((totalGenerated / totalToProcess) * 100).toFixed(1);
      console.log(`  ✅ Generated: ${result.generated}, Errors: ${result.errors}`);
      console.log(`  Progress: ${totalGenerated}/${totalToProcess} (${progress}%)`);
      console.log('');

      if (result.generated === 0) {
        // No more products to process
        break;
      }

      batchNumber++;

      // Small delay between batches to avoid overwhelming the API
      if (totalGenerated < totalToProcess) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }

    } catch (err) {
      console.error(`❌ Batch ${batchNumber} failed:`, err.message);
      console.error('Continuing with next batch...\n');
      batchNumber++;
    }
  }

  // Final summary
  console.log('='.repeat(70));
  console.log('SUMMARY');
  console.log('='.repeat(70));
  console.log(`Total embeddings generated: ${totalGenerated}`);
  console.log(`Total errors: ${totalErrors}`);
  console.log(`Success rate: ${((totalGenerated / (totalGenerated + totalErrors)) * 100).toFixed(1)}%`);
  console.log('');

  if (totalErrors > 0) {
    console.log('⚠️  Some embeddings failed. Run this script again to retry failed products.');
  } else {
    console.log('✅ All embeddings generated successfully!');
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

#!/usr/bin/env node

/**
 * BULK BACKFILL: Extract colors for ALL products using GPT-4 Vision
 *
 * This is an enhanced version of extract-product-colors.mjs with:
 * - Better error handling and retry logic
 * - Progress tracking and resumability
 * - Cost estimation
 * - Automatic batching with progress saves
 * - Better rate limiting
 *
 * Usage:
 *   node scripts/10-backfill-verified-colors-bulk.mjs [--dry-run] [--batch-size=100]
 *
 * Examples:
 *   # See what would happen without making changes
 *   node scripts/10-backfill-verified-colors-bulk.mjs --dry-run
 *
 *   # Process 100 products at a time
 *   node scripts/10-backfill-verified-colors-bulk.mjs --batch-size=100
 *
 *   # Resume from where you left off (automatically skips processed)
 *   node scripts/10-backfill-verified-colors-bulk.mjs
 */

import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env.local') });

// Validate environment
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

if (!process.env.OPENAI_API_KEY) {
  console.error('❌ Missing OpenAI API key in .env.local');
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Configuration
const RATE_LIMIT_MS = 500; // 2 requests per second
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

// Pricing (as of Jan 2025)
const GPT4O_VISION_COST_PER_IMAGE = 0.00015; // $0.15 per 1000 images (low detail)

/**
 * Extract colors from product image using GPT-4 Vision
 */
async function extractProductColors(imageUrl, title, retryCount = 0) {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 150,
      messages: [
        {
          role: 'system',
          content: `You are a fashion color expert. Analyze product images and identify the PRIMARY colors visible.

IMPORTANT RULES:
1. Return 1-3 dominant colors (what someone would call the product)
2. Use standard color names: black, white, red, blue, navy, green, yellow, orange, purple, pink, brown, beige, grey, cream, gold, silver
3. For blue shades: use "blue" for most blues, "navy" for dark blue
4. For neutral tones: use "beige", "cream", "tan", or "brown" as appropriate
5. If multi-colored with no dominant color, list up to 3 main colors
6. If metallic/shiny: use "gold", "silver", "metallic"
7. If pattern dominates: list pattern colors (e.g., "blue" and "white" for blue/white stripes)
8. If truly unclear or image won't load: return empty array

Respond ONLY with a JSON array of color strings.
Examples:
- ["black"]
- ["blue", "navy"]
- ["red", "gold"]
- ["multicolor"] (only if truly equal mix of 4+ colors)
- [] (if cannot determine)`,
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Product: "${title}"\n\nWhat are the primary colors of this product?`,
            },
            {
              type: 'image_url',
              image_url: {
                url: imageUrl,
                detail: 'low', // Fast and cheap
              },
            },
          ],
        },
      ],
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from GPT-4 Vision');
    }

    // Parse JSON response
    const jsonMatch = content.match(/\[[\s\S]*?\]/);
    if (!jsonMatch) {
      throw new Error(`Could not parse JSON from response: ${content}`);
    }

    const colors = JSON.parse(jsonMatch[0]);
    return colors;

  } catch (error) {
    // Retry on transient errors
    if (retryCount < MAX_RETRIES && (
      error.message.includes('rate limit') ||
      error.message.includes('timeout') ||
      error.message.includes('network')
    )) {
      console.log(`  ⚠️ Retry ${retryCount + 1}/${MAX_RETRIES}: ${error.message}`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
      return extractProductColors(imageUrl, title, retryCount + 1);
    }

    throw error;
  }
}

/**
 * Process a batch of products
 */
async function processBatch(products, dryRun = false) {
  let successCount = 0;
  let errorCount = 0;
  let skippedCount = 0;

  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    const progress = `[${i + 1}/${products.length}]`;

    try {
      console.log(`${progress} ${product.title.slice(0, 60)}...`);

      // Skip if no image URL
      if (!product.image_url) {
        console.log(`  ⊘ Skipped: No image URL`);
        skippedCount++;
        continue;
      }

      if (dryRun) {
        console.log(`  [DRY RUN] Would analyze image: ${product.image_url}`);
        successCount++;
      } else {
        // Extract colors
        const colors = await extractProductColors(product.image_url, product.title);
        console.log(`  ✓ Colors: ${colors.length > 0 ? colors.join(', ') : 'none detected'}`);

        // Update database
        const { error } = await supabase
          .from('products')
          .update({ verified_colors: colors })
          .eq('id', product.id);

        if (error) {
          throw error;
        }

        successCount++;

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_MS));
      }

    } catch (error) {
      console.error(`  ❌ Error: ${error.message}`);
      errorCount++;
    }
  }

  return { successCount, errorCount, skippedCount };
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const batchSize = parseInt(args.find(arg => arg.startsWith('--batch-size='))?.split('=')[1]) || 100;

  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║  BULK BACKFILL: Product Color Verification (GPT-4 Vision)     ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  if (dryRun) {
    console.log('🔍 DRY RUN MODE - No changes will be made\n');
  }

  // Step 1: Get statistics
  console.log('📊 Analyzing database...\n');

  const { count: totalProducts } = await supabase
    .from('products')
    .select('id', { count: 'exact', head: true });

  const { count: productsWithColors } = await supabase
    .from('products')
    .select('id', { count: 'exact', head: true })
    .not('verified_colors', 'is', null);

  const { count: productsNeedingColors } = await supabase
    .from('products')
    .select('id', { count: 'exact', head: true })
    .is('verified_colors', null);

  console.log(`Total products: ${totalProducts}`);
  console.log(`✅ With verified colors: ${productsWithColors} (${((productsWithColors / totalProducts) * 100).toFixed(1)}%)`);
  console.log(`❌ Need color analysis: ${productsNeedingColors} (${((productsNeedingColors / totalProducts) * 100).toFixed(1)}%)`);

  if (productsNeedingColors === 0) {
    console.log('\n🎉 All products already have verified colors!');
    process.exit(0);
  }

  // Step 2: Cost estimation
  const estimatedCost = productsNeedingColors * GPT4O_VISION_COST_PER_IMAGE;
  const estimatedTime = Math.ceil(productsNeedingColors / (1000 / RATE_LIMIT_MS) / 60); // minutes

  console.log(`\n💰 Cost Estimation:`);
  console.log(`   Products to process: ${productsNeedingColors}`);
  console.log(`   Estimated cost: $${estimatedCost.toFixed(2)}`);
  console.log(`   Estimated time: ~${estimatedTime} minutes`);

  if (dryRun) {
    console.log('\n✓ Dry run complete - no changes made');
    process.exit(0);
  }

  // Step 3: Confirm with user
  console.log(`\n⚠️  This will process ${productsNeedingColors} products`);
  console.log(`   Cost: ~$${estimatedCost.toFixed(2)}`);
  console.log(`   Time: ~${estimatedTime} minutes`);
  console.log(`\n   Press Ctrl+C to cancel, or wait 5 seconds to continue...\n`);

  await new Promise(resolve => setTimeout(resolve, 5000));

  // Step 4: Process batches
  console.log('🚀 Starting bulk processing...\n');

  let totalSuccess = 0;
  let totalErrors = 0;
  let totalSkipped = 0;
  let processedCount = 0;

  while (processedCount < productsNeedingColors) {
    // Fetch next batch
    const { data: products, error } = await supabase
      .from('products')
      .select('id, title, image_url')
      .is('verified_colors', null)
      .order('id', { ascending: true })
      .limit(batchSize);

    if (error) {
      console.error('❌ Failed to fetch products:', error);
      break;
    }

    if (!products || products.length === 0) {
      break;
    }

    console.log(`\n${'='.repeat(70)}`);
    console.log(`Batch ${Math.floor(processedCount / batchSize) + 1}: Processing ${products.length} products`);
    console.log(`Progress: ${processedCount}/${productsNeedingColors} (${((processedCount / productsNeedingColors) * 100).toFixed(1)}%)`);
    console.log('='.repeat(70) + '\n');

    const batchResults = await processBatch(products, false);

    totalSuccess += batchResults.successCount;
    totalErrors += batchResults.errorCount;
    totalSkipped += batchResults.skippedCount;
    processedCount += products.length;

    console.log(`\nBatch complete: ✓ ${batchResults.successCount} | ❌ ${batchResults.errorCount} | ⊘ ${batchResults.skippedCount}`);
  }

  // Final summary
  console.log('\n' + '╔════════════════════════════════════════════════════════════════╗');
  console.log('║  BACKFILL COMPLETE                                             ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  console.log(`Total processed: ${processedCount}`);
  console.log(`✅ Successful: ${totalSuccess}`);
  console.log(`❌ Errors: ${totalErrors}`);
  console.log(`⊘ Skipped (no image): ${totalSkipped}`);

  // Check final coverage
  const { count: finalNeedingColors } = await supabase
    .from('products')
    .select('id', { count: 'exact', head: true })
    .is('verified_colors', null);

  if (finalNeedingColors > 0) {
    console.log(`\n⚠️ ${finalNeedingColors} products still need processing`);
    console.log(`   (Likely due to errors - run script again to retry)`);
  } else {
    console.log(`\n🎉 All products now have verified colors!`);
  }

  const actualCost = totalSuccess * GPT4O_VISION_COST_PER_IMAGE;
  console.log(`\n💰 Actual cost: ~$${actualCost.toFixed(2)}`);
}

main().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});

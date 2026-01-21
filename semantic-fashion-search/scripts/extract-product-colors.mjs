/**
 * Extract and verify product colors using GPT-4 Vision
 *
 * This script analyzes product images to determine ACTUAL colors,
 * not just what the text description says. Fixes issues like:
 * - "Available in blue" text but showing purple product
 * - Missing color information entirely
 * - Ambiguous color descriptions
 *
 * Usage:
 *   node scripts/extract-product-colors.mjs [--batch-size=50] [--start-id=123]
 */

import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Analyze product image to extract actual colors
 */
async function extractProductColors(imageUrl, title) {
  try {
    console.log(`  Analyzing: ${title.slice(0, 50)}...`);

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
                detail: 'low', // Fast processing, sufficient for color detection
              },
            },
          ],
        },
      ],
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      console.log(`  ⚠️ No response from GPT-4 Vision`);
      return [];
    }

    // Parse JSON response
    const jsonMatch = content.match(/\[[\s\S]*?\]/);
    if (!jsonMatch) {
      console.log(`  ⚠️ Could not parse JSON from response: ${content}`);
      return [];
    }

    const colors = JSON.parse(jsonMatch[0]);
    console.log(`  ✓ Colors detected: ${colors.join(', ') || 'none'}`);
    return colors;

  } catch (error) {
    console.error(`  ❌ Error analyzing image:`, error.message);
    return []; // Return empty array on error (will retry later)
  }
}

/**
 * Process a batch of products
 */
async function processBatch(products) {
  console.log(`\nProcessing batch of ${products.length} products...`);
  let successCount = 0;
  let errorCount = 0;

  for (const product of products) {
    try {
      // Extract colors from image
      const colors = await extractProductColors(product.image_url, product.title);

      // Update database with verified colors
      const { error } = await supabase
        .from('products')
        .update({
          verified_colors: colors.length > 0 ? colors : [], // Empty array means analyzed but no clear color
        })
        .eq('id', product.id);

      if (error) {
        console.error(`  ❌ Failed to update product ${product.id}:`, error.message);
        errorCount++;
      } else {
        successCount++;
      }

      // Rate limit: ~2 requests per second
      await new Promise(resolve => setTimeout(resolve, 600));

    } catch (error) {
      console.error(`  ❌ Error processing product ${product.id}:`, error.message);
      errorCount++;
    }
  }

  console.log(`✓ Batch complete: ${successCount} succeeded, ${errorCount} failed`);
  return { successCount, errorCount };
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2);
  const batchSize = parseInt(args.find(arg => arg.startsWith('--batch-size='))?.split('=')[1]) || 50;
  const startId = parseInt(args.find(arg => arg.startsWith('--start-id='))?.split('=')[1]) || 0;

  console.log('='.repeat(60));
  console.log('Product Color Extraction (GPT-4 Vision)');
  console.log('='.repeat(60));
  console.log(`Batch size: ${batchSize}`);
  console.log(`Starting from ID: ${startId}`);
  console.log('');

  // Get products that need color analysis (verified_colors IS NULL)
  let query = supabase
    .from('products')
    .select('id, title, image_url')
    .is('verified_colors', null)
    .order('id', { ascending: true });

  if (startId > 0) {
    query = query.gte('id', startId);
  }

  const { data: products, error } = await query.limit(batchSize);

  if (error) {
    console.error('❌ Failed to fetch products:', error);
    process.exit(1);
  }

  if (!products || products.length === 0) {
    console.log('✓ No products need color analysis!');
    console.log('All products have been processed.');
    process.exit(0);
  }

  console.log(`Found ${products.length} products to analyze\n`);

  // Process batch
  const { successCount, errorCount } = await processBatch(products);

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('Summary:');
  console.log(`  Products processed: ${successCount + errorCount}`);
  console.log(`  Successful: ${successCount}`);
  console.log(`  Failed: ${errorCount}`);

  // Check if more products remain
  const { count } = await supabase
    .from('products')
    .select('id', { count: 'exact', head: true })
    .is('verified_colors', null);

  if (count > 0) {
    console.log(`\n⚠️ ${count} products still need analysis`);
    console.log(`Run again to continue processing`);
  } else {
    console.log(`\n✓ All products have been analyzed!`);
  }
  console.log('='.repeat(60));
}

main().catch(console.error);

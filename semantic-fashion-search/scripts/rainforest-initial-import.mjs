import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// Load .env.local manually
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, 'utf-8');
  const envLines = envFile.split('\n');
  for (const line of envLines) {
    const [key, value] = line.split('=');
    if (key && value) {
      process.env[key.trim()] = value.trim();
    }
  }
}

const RAINFOREST_API_KEY = process.env.RAINFOREST_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const API_BASE = 'https://api.rainforestapi.com/request';

// Load weighting analysis
const analysisPath = path.join(process.cwd(), 'rainforest-weighting-analysis.json');
const analysisData = JSON.parse(fs.readFileSync(analysisPath, 'utf-8'));

// Configuration
const TOTAL_TARGET_PRODUCTS = 5000; // Phase 1: Test with 5,000 first
const PRODUCTS_PER_SEARCH = 50; // Try to fetch ~50 products per category search
const BATCH_SIZE = 100; // Insert/update in batches
const CREDIT_BUDGET = 50; // Phase 1: Limited to 50 credits for testing

let creditsUsed = 0;
let productsImported = 0;
let productsFailed = 0;

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Generate SHA256 hash of product content for change detection
function generateContentHash(product) {
  const contentToHash = [
    product.title,
    product.brand,
    product.price,
    product.description,
  ]
    .filter(v => v)
    .join('|')
    .toLowerCase();

  return crypto.createHash('sha256').update(contentToHash).digest('hex');
}

// Make Rainforest API request
async function makeRainforestRequest(params) {
  if (creditsUsed >= CREDIT_BUDGET) {
    throw new Error(`Credit budget (${CREDIT_BUDGET}) exceeded. Used: ${creditsUsed}`);
  }

  const url = new URL(API_BASE);
  url.searchParams.append('api_key', RAINFOREST_API_KEY);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });

  try {
    const response = await fetch(url.toString());
    const data = await response.json();

    if (data.request_info?.credits_used_this_request) {
      creditsUsed += data.request_info.credits_used_this_request;
    }

    if (!response.ok || data.error) {
      throw new Error(`API error: ${data.error || response.statusText}`);
    }

    return data;
  } catch (error) {
    console.error(`[API] Error:`, error.message);
    throw error;
  }
}

// Map Rainforest product to our DB schema
function mapRainforestProduct(rainforestProduct, category, subcategory) {
  // Rainforest API uses 'image' (singular) for search results
  const imageUrl = rainforestProduct.image || null;

  // Skip products without images (database requires image_url to be non-null)
  if (!imageUrl) {
    return null;
  }

  const description =
    rainforestProduct.description ||
    (rainforestProduct.feature_bullets ? rainforestProduct.feature_bullets.join(' ') : '');

  // Check for sales/offers
  let salePrice = null;
  let discountPercent = null;
  let saleEndDate = null;
  let isOnSale = false;

  // Handle offers for sales/deals
  if (rainforestProduct.offers && rainforestProduct.offers.length > 0) {
    const offer = rainforestProduct.offers[0];
    const offerPrice = offer.price?.value || offer.price || null;
    const currentPrice = rainforestProduct.price?.value || rainforestProduct.price || null;

    if (offerPrice && currentPrice && parseFloat(offerPrice) < parseFloat(currentPrice)) {
      isOnSale = true;
      salePrice = parseFloat(offerPrice);
      const originalPrice = parseFloat(currentPrice);
      if (originalPrice > 0) {
        discountPercent = ((originalPrice - salePrice) / originalPrice) * 100;
      }
      const saleEndDateObj = new Date();
      saleEndDateObj.setDate(saleEndDateObj.getDate() + 7);
      saleEndDate = saleEndDateObj.toISOString();
    }
  }

  // Extract price from nested structure
  const priceValue = rainforestProduct.price?.value || null;

  const product = {
    brand: rainforestProduct.brand || 'Unknown Brand',
    title: rainforestProduct.title || 'Untitled Product',
    description,
    price: priceValue ? parseFloat(priceValue) : null,
    currency: 'USD',
    image_url: imageUrl,
    product_url: rainforestProduct.link || rainforestProduct.url,
    category: `${subcategory}`,
    merchant_name: 'Amazon',
    affiliate_network: 'amazon-associates',
    in_stock: rainforestProduct.stock_status !== 'out_of_stock',
    sale_price: salePrice,
    discount_percent: discountPercent,
    sale_end_date: saleEndDate,
    is_on_sale: isOnSale,
    last_scraped_at: new Date().toISOString(),
  };

  // Generate content hash for change detection
  product.content_hash = generateContentHash(product);

  // Tags from category
  product.tags = [category, subcategory];

  // Combined text for embedding
  product.combined_text = [product.title, product.brand, product.description, category, subcategory]
    .filter(t => t)
    .join(' ');

  return product;
}

// Upsert product to Supabase
async function upsertProduct(product) {
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Check if product exists by URL
  const { data: existing, error: fetchError } = await supabase
    .from('products')
    .select('id, content_hash')
    .eq('product_url', product.product_url)
    .single();

  if (fetchError && fetchError.code !== 'PGRST116') {
    // PGRST116 = no rows returned (expected for new products)
    throw fetchError;
  }

  if (existing) {
    // Product exists - check if content changed
    if (existing.content_hash === product.content_hash) {
      // No changes, skip update
      return { status: 'skipped', reason: 'no_content_change' };
    }

    // Content changed, update product
    const { error: updateError } = await supabase
      .from('products')
      .update({
        ...product,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id);

    if (updateError) throw updateError;
    return { status: 'updated', id: existing.id };
  } else {
    // New product, insert
    const { error: insertError } = await supabase.from('products').insert([product]);

    if (insertError) throw insertError;
    return { status: 'inserted' };
  }
}

// Fetch products for a single category
async function importCategory(category) {
  const { topLevel, subcategory, productsPerThousand } = category;

  // Calculate how many products to import for this category
  const targetCount = Math.round((productsPerThousand / 1000) * TOTAL_TARGET_PRODUCTS);

  console.log(`\n📁 Category: ${topLevel} → ${subcategory}`);
  console.log(`   Target products: ${targetCount}`);

  const categoryLabel = `${topLevel} ${subcategory}`.toLowerCase();
  let pagesNeeded = Math.ceil(targetCount / PRODUCTS_PER_SEARCH);

  console.log(`   Search pages needed: ${pagesNeeded}`);

  let productsCollected = 0;
  let pagesFetched = 0;

  for (let page = 1; page <= pagesNeeded && productsCollected < targetCount; page++) {
    try {
      console.log(`   [Page ${page}/${pagesNeeded}] Fetching products...`);

      const searchResult = await makeRainforestRequest({
        type: 'search',
        search_term: categoryLabel,
        amazon_domain: 'amazon.com',
        page: page.toString(),
      });

      if (!searchResult.search_results || searchResult.search_results.length === 0) {
        console.log(`   ⚠️  No results for page ${page}`);
        break;
      }

      const pageProducts = searchResult.search_results.slice(0, PRODUCTS_PER_SEARCH);

      for (const rainforestProduct of pageProducts) {
        if (productsCollected >= targetCount) break;

        try {
          const mappedProduct = mapRainforestProduct(rainforestProduct, topLevel, subcategory);

          // Skip if product mapping returned null (no image, etc)
          if (!mappedProduct) {
            continue;
          }

          const result = await upsertProduct(mappedProduct);

          if (result.status !== 'skipped') {
            productsCollected++;
            if (result.status === 'inserted') {
              productsImported++;
            }
          }
        } catch (error) {
          console.error(`      ❌ Failed to upsert product: ${error.message}`);
          productsFailed++;
        }

        // Rate limiting
        await sleep(100);
      }

      pagesFetched++;
      console.log(`   ✅ Page ${page} complete. Total collected: ${productsCollected}/${targetCount}`);
      console.log(`   Credits used: ${creditsUsed}`);

      // Rate limit between pages
      await sleep(500);
    } catch (error) {
      console.error(`   ❌ Error fetching page ${page}: ${error.message}`);
      if (creditsUsed >= CREDIT_BUDGET) {
        console.log(`   💳 Credit budget exhausted. Stopping import.`);
        break;
      }
    }
  }

  return { targetCount, productsCollected, pagesFetched };
}

async function main() {
  console.log('🚀 Rainforest Initial Product Import\n');
  console.log(`📋 Target: ${TOTAL_TARGET_PRODUCTS} products across ${analysisData.categories.length} categories`);
  console.log(`💳 Credit budget: ${CREDIT_BUDGET}\n`);

  console.log(`${'='.repeat(80)}`);
  console.log(`STARTING IMPORT`);
  console.log(`${'='.repeat(80)}\n`);

  const startTime = Date.now();
  let categoriesProcessed = 0;

  for (const category of analysisData.categories) {
    if (creditsUsed >= CREDIT_BUDGET) {
      console.log(`\n💳 Credit budget reached (${creditsUsed}/${CREDIT_BUDGET}). Stopping.`);
      break;
    }

    try {
      await importCategory(category);
      categoriesProcessed++;
    } catch (error) {
      console.error(`\n❌ Fatal error in category import: ${error.message}`);
      break;
    }

    // Rate limiting between categories
    await sleep(1000);
  }

  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  console.log(`\n${'='.repeat(80)}`);
  console.log(`IMPORT COMPLETE`);
  console.log(`${'='.repeat(80)}`);
  console.log(`Categories processed: ${categoriesProcessed}/${analysisData.categories.length}`);
  console.log(`Products imported: ${productsImported}`);
  console.log(`Products failed: ${productsFailed}`);
  console.log(`Total time: ${duration}s`);
  console.log(`Credits used: ${creditsUsed}/${CREDIT_BUDGET}`);
  console.log(`Credits remaining: ${Math.max(0, CREDIT_BUDGET - creditsUsed)}`);
}

main().catch(err => {
  console.error('\n❌ Fatal error:', err.message);
  console.error(err.stack);
  process.exit(1);
});

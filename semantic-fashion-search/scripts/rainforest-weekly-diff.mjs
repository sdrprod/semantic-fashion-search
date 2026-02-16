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

// Configuration
const CREDIT_BUDGET = 50; // Weekly credit budget for diffs
const BATCH_SIZE = 20; // Check batches of products at a time
const DAYS_SINCE_LAST_SCRAPE = 7; // Re-check products last scraped 7+ days ago

let creditsUsed = 0;
let productsChecked = 0;
let productsUpdated = 0;
let productsUnchanged = 0;
let productsFailed = 0;

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Generate SHA256 hash for change detection
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

// Extract ASIN from Amazon URL
function extractAsin(url) {
  if (!url) return null;
  const match = url.match(/\/dp\/([A-Z0-9]{10})/);
  return match ? match[1] : null;
}

// Fetch product details from Rainforest using ASIN
async function fetchProductDetails(asin, productUrl) {
  try {
    const response = await makeRainforestRequest({
      type: 'product',
      asin: asin,
      amazon_domain: 'amazon.com',
    });

    if (!response.product) {
      console.log(`      ⚠️  No product data for ASIN ${asin}`);
      return null;
    }

    return response.product;
  } catch (error) {
    console.error(`      ❌ Failed to fetch product ${asin}: ${error.message}`);
    return null;
  }
}

// Map Rainforest product to DB schema
function mapRainforestProduct(rainforestProduct, existingProduct) {
  const images = rainforestProduct.images || [];
  const imageUrl = images[0] || null;

  const description =
    rainforestProduct.description ||
    (rainforestProduct.feature_bullets ? rainforestProduct.feature_bullets.join(' ') : '');

  // Check for sales/offers
  let salePrice = null;
  let discountPercent = null;
  let saleEndDate = null;
  let isOnSale = false;

  if (rainforestProduct.offers && rainforestProduct.offers.length > 0) {
    const offer = rainforestProduct.offers[0];
    const currentPrice = parseFloat(rainforestProduct.price || offer.price);
    const offerPrice = parseFloat(offer.price);

    if (offerPrice < currentPrice) {
      isOnSale = true;
      salePrice = offerPrice;
      discountPercent = ((currentPrice - offerPrice) / currentPrice) * 100;
      const saleEndDateObj = new Date();
      saleEndDateObj.setDate(saleEndDateObj.getDate() + 7);
      saleEndDate = saleEndDateObj.toISOString();
    }
  }

  const product = {
    brand: rainforestProduct.brand || existingProduct.brand || 'Unknown Brand',
    title: rainforestProduct.title || existingProduct.title,
    description,
    price: rainforestProduct.price ? parseFloat(rainforestProduct.price) : existingProduct.price,
    currency: existingProduct.currency || 'USD',
    image_url: imageUrl || existingProduct.image_url,
    sale_price: salePrice,
    discount_percent: discountPercent,
    sale_end_date: saleEndDate,
    is_on_sale: isOnSale,
    in_stock: rainforestProduct.stock_status !== 'out_of_stock',
    last_scraped_at: new Date().toISOString(),
  };

  // Generate content hash for change detection
  product.content_hash = generateContentHash(product);

  return product;
}

// Update product in Supabase if content changed
async function updateProductIfChanged(existingProduct, rainforestData) {
  const mappedProduct = mapRainforestProduct(rainforestData, existingProduct);

  // Check if content hash changed
  if (mappedProduct.content_hash === existingProduct.content_hash) {
    // Content unchanged, just update last_scraped_at
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    await supabase
      .from('products')
      .update({ last_scraped_at: new Date().toISOString() })
      .eq('id', existingProduct.id);

    return { status: 'unchanged' };
  }

  // Content changed, update product
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const { error: updateError } = await supabase
    .from('products')
    .update({
      ...mappedProduct,
      updated_at: new Date().toISOString(),
    })
    .eq('id', existingProduct.id);

  if (updateError) throw updateError;
  return { status: 'updated' };
}

// Get products that need checking (last scraped 7+ days ago)
async function getProductsToCheck() {
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - DAYS_SINCE_LAST_SCRAPE);

  const { data: products, error } = await supabase
    .from('products')
    .select('id, product_url, title, brand, price, description, content_hash, merchant_name')
    .eq('merchant_name', 'Amazon')
    .lt('last_scraped_at', sevenDaysAgo.toISOString())
    .limit(1000); // Limit to 1000 per run

  if (error) throw error;
  return products || [];
}

async function main() {
  console.log('🚀 Rainforest Weekly Diff/Update Script\n');
  console.log(`📋 Checking products last scraped 7+ days ago`);
  console.log(`💳 Credit budget: ${CREDIT_BUDGET}\n`);

  console.log(`${'='.repeat(80)}`);
  console.log(`PHASE 1: Fetching Products to Check`);
  console.log(`${'='.repeat(80)}\n`);

  let productsToCheck = [];
  try {
    productsToCheck = await getProductsToCheck();
    console.log(`Found ${productsToCheck.length} products to check\n`);
  } catch (error) {
    console.error(`❌ Failed to fetch products: ${error.message}`);
    process.exit(1);
  }

  if (productsToCheck.length === 0) {
    console.log('✅ No products need checking. All are up to date.');
    return;
  }

  console.log(`${'='.repeat(80)}`);
  console.log(`PHASE 2: Checking for Updates`);
  console.log(`${'='.repeat(80)}\n`);

  for (let i = 0; i < productsToCheck.length; i++) {
    if (creditsUsed >= CREDIT_BUDGET) {
      console.log(`\n💳 Credit budget reached (${creditsUsed}/${CREDIT_BUDGET}). Stopping.`);
      break;
    }

    const product = productsToCheck[i];
    productsChecked++;

    try {
      const asin = extractAsin(product.product_url);
      if (!asin) {
        console.log(`[${i + 1}/${productsToCheck.length}] ⚠️  Skipped (no ASIN): ${product.title}`);
        continue;
      }

      console.log(`[${i + 1}/${productsToCheck.length}] Checking: ${product.title.substring(0, 50)}...`);

      const rainforestData = await fetchProductDetails(asin, product.product_url);
      if (!rainforestData) {
        productsFailed++;
        continue;
      }

      const result = await updateProductIfChanged(product, rainforestData);

      if (result.status === 'updated') {
        console.log(`      ✅ Updated (content changed)`);
        productsUpdated++;
      } else {
        console.log(`      ✓ Unchanged (content hash match)`);
        productsUnchanged++;
      }

      console.log(`      Credits used: ${creditsUsed}/${CREDIT_BUDGET}`);

      // Rate limiting
      await sleep(300);
    } catch (error) {
      console.error(`      ❌ Error: ${error.message}`);
      productsFailed++;
    }
  }

  console.log(`\n${'='.repeat(80)}`);
  console.log(`UPDATE SUMMARY`);
  console.log(`${'='.repeat(80)}`);
  console.log(`Products checked: ${productsChecked}`);
  console.log(`Products updated: ${productsUpdated}`);
  console.log(`Products unchanged: ${productsUnchanged}`);
  console.log(`Products failed: ${productsFailed}`);
  console.log(`Credits used: ${creditsUsed}/${CREDIT_BUDGET}`);
  console.log(`Credits remaining: ${Math.max(0, CREDIT_BUDGET - creditsUsed)}`);

  if (productsUpdated > 0) {
    console.log(`\n✅ ${productsUpdated} products were updated with new information.`);
  } else {
    console.log(`\n✓ No products needed updates this week.`);
  }
}

main().catch(err => {
  console.error('\n❌ Fatal error:', err.message);
  console.error(err.stack);
  process.exit(1);
});

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import readline from 'readline';

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
const PRODUCTS_PER_PAGE = 50;
const PAGES_TO_CHECK = 3; // Check first 3 pages = ~150 products
const CREDIT_BUDGET = 25;

let creditsUsed = 0;

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

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

function mapRainforestProduct(rainforestProduct, topLevel, subcategory) {
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

  product.content_hash = generateContentHash(product);
  product.tags = [topLevel, subcategory];
  product.combined_text = [product.title, product.brand, product.description, topLevel, subcategory]
    .filter(t => t)
    .join(' ');

  return product;
}

async function getExistingProducts(productUrls) {
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const { data: existing, error } = await supabase
    .from('products')
    .select('product_url, content_hash, price, is_on_sale, sale_price')
    .in('product_url', productUrls);

  if (error && error.code !== 'PGRST116') throw error;

  return (existing || []).reduce((map, p) => {
    map[p.product_url] = p;
    return map;
  }, {});
}

async function upsertProduct(product) {
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const { data: existing } = await supabase
    .from('products')
    .select('id, content_hash')
    .eq('product_url', product.product_url)
    .single();

  if (existing) {
    if (existing.content_hash === product.content_hash) {
      return { status: 'unchanged' };
    }

    await supabase
      .from('products')
      .update({
        ...product,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id);

    return { status: 'updated', id: existing.id };
  } else {
    await supabase.from('products').insert([product]);
    return { status: 'inserted' };
  }
}

function createReadlineInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

function askQuestion(rl, question) {
  return new Promise(resolve => {
    rl.question(question, answer => {
      resolve(answer.toLowerCase().trim());
    });
  });
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Usage: node rainforest-check-category.mjs <category> [<subcategory>]');
    console.log('\nExamples:');
    console.log('  node rainforest-check-category.mjs "Footwear" "Sneakers"');
    console.log('  node rainforest-check-category.mjs "Dresses"');
    console.log('\nIf subcategory is omitted, uses category name for search.');
    process.exit(1);
  }

  const topLevel = args[0];
  const subcategory = args[1] || args[0];
  const searchTerm = `${topLevel} ${subcategory}`.toLowerCase();

  console.log('🔍 Rainforest On-Demand Category Checker\n');
  console.log(`📁 Checking: ${topLevel} → ${subcategory}`);
  console.log(`🔎 Search term: "${searchTerm}"`);
  console.log(`💳 Credit budget: ${CREDIT_BUDGET}\n`);

  console.log(`${'='.repeat(80)}`);
  console.log(`PHASE 1: Fetching Products from Rainforest API`);
  console.log(`${'='.repeat(80)}\n`);

  const allProducts = [];
  let totalResults = 0;

  try {
    for (let page = 1; page <= PAGES_TO_CHECK; page++) {
      if (creditsUsed >= CREDIT_BUDGET) {
        console.log(`\n💳 Credit budget reached. Stopping at page ${page - 1}.`);
        break;
      }

      console.log(`📄 Page ${page} - Searching...`);

      const searchResult = await makeRainforestRequest({
        type: 'search',
        search_term: searchTerm,
        amazon_domain: 'amazon.com',
        page: page.toString(),
      });

      if (!searchResult.search_results || searchResult.search_results.length === 0) {
        console.log(`   No results found.`);
        break;
      }

      totalResults = searchResult.pagination?.total || 0;
      allProducts.push(...searchResult.search_results);

      console.log(`   Found ${searchResult.search_results.length} products`);
      console.log(`   Total available: ${totalResults}`);
      console.log(`   Credits used: ${creditsUsed}/${CREDIT_BUDGET}\n`);

      await sleep(500);
    }

    if (allProducts.length === 0) {
      console.log('❌ No products found for this category.');
      process.exit(1);
    }

    console.log(`${'='.repeat(80)}`);
    console.log(`PHASE 2: Comparing with Database`);
    console.log(`${'='.repeat(80)}\n`);

    const productUrls = allProducts.map(p => p.link || p.url).filter(Boolean);
    console.log(`Checking ${productUrls.length} products against database...`);

    const existing = await getExistingProducts(productUrls);

    let newProducts = [];
    let updatedProducts = [];
    let unchangedProducts = [];

    for (const rainforestProduct of allProducts) {
      const mapped = mapRainforestProduct(rainforestProduct, topLevel, subcategory);

      // Skip if product mapping returned null (no image, etc)
      if (!mapped) {
        continue;
      }

      const url = mapped.product_url;

      if (!existing[url]) {
        newProducts.push(mapped);
      } else {
        const oldData = existing[url];
        if (oldData.content_hash === mapped.content_hash) {
          unchangedProducts.push(mapped);
        } else {
          updatedProducts.push({ old: oldData, new: mapped });
        }
      }
    }

    console.log('\n📊 Results Summary:');
    console.log(`   New products: ${newProducts.length}`);
    console.log(`   Updated products: ${updatedProducts.length}`);
    console.log(`   Unchanged products: ${unchangedProducts.length}`);
    console.log(`   Total checked: ${allProducts.length}\n`);

    if (updatedProducts.length > 0) {
      console.log(`Changes Detected:`);
      updatedProducts.forEach((item, i) => {
        console.log(`\n   ${i + 1}. ${item.new.title.substring(0, 60)}...`);
        if (item.old.price !== item.new.price) {
          console.log(`      💰 Price: $${item.old.price} → $${item.new.price}`);
        }
        if (item.old.is_on_sale !== item.new.is_on_sale) {
          console.log(`      🏷️  Sale: ${item.old.is_on_sale ? 'Yes' : 'No'} → ${item.new.is_on_sale ? 'Yes' : 'No'}`);
        }
        if (item.old.sale_price !== item.new.sale_price) {
          console.log(`      🔖 Sale Price: $${item.old.sale_price || 'N/A'} → $${item.new.sale_price || 'N/A'}`);
        }
      });
    }

    if (newProducts.length === 0 && updatedProducts.length === 0) {
      console.log('✓ No new or updated products found. All products are current.');
      process.exit(0);
    }

    console.log(`\n${'='.repeat(80)}`);
    console.log(`PHASE 3: Confirm Update`);
    console.log(`${'='.repeat(80)}\n`);

    const rl = createReadlineInterface();

    let shouldUpdate = false;
    if (newProducts.length > 0 || updatedProducts.length > 0) {
      const answer = await askQuestion(rl, `Apply changes? (${newProducts.length} new, ${updatedProducts.length} updated) [y/n]: `);
      shouldUpdate = answer === 'y' || answer === 'yes';
    }

    rl.close();

    if (!shouldUpdate) {
      console.log('❌ Update cancelled.');
      process.exit(0);
    }

    console.log(`\n${'='.repeat(80)}`);
    console.log(`PHASE 4: Updating Database`);
    console.log(`${'='.repeat(80)}\n`);

    let insertedCount = 0;
    let updatedCount = 0;

    for (const product of newProducts) {
      try {
        const result = await upsertProduct(product);
        if (result.status === 'inserted') insertedCount++;
      } catch (error) {
        console.error(`   ❌ Failed to insert: ${product.title.substring(0, 40)}`);
      }
    }

    for (const item of updatedProducts) {
      try {
        const result = await upsertProduct(item.new);
        if (result.status === 'updated') updatedCount++;
      } catch (error) {
        console.error(`   ❌ Failed to update: ${item.new.title.substring(0, 40)}`);
      }
    }

    console.log(`✅ Inserted: ${insertedCount}`);
    console.log(`✅ Updated: ${updatedCount}`);

    console.log(`\n${'='.repeat(80)}`);
    console.log(`SUMMARY`);
    console.log(`${'='.repeat(80)}`);
    console.log(`Category: ${topLevel} → ${subcategory}`);
    console.log(`Products checked: ${allProducts.length}`);
    console.log(`Products inserted: ${insertedCount}`);
    console.log(`Products updated: ${updatedCount}`);
    console.log(`Credits used: ${creditsUsed}/${CREDIT_BUDGET}`);
    console.log(`Credits remaining: ${Math.max(0, CREDIT_BUDGET - creditsUsed)}`);

    if (insertedCount > 0 || updatedCount > 0) {
      console.log(`\n⚠️  Remember to run embedding scripts to update vector embeddings!`);
    }
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();

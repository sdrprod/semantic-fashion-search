#!/usr/bin/env node

/**
 * Sync women's fashion products from Amazon via Rainforest API
 *
 * Usage:
 *   node scripts/sync-amazon-products.mjs [maxProducts] [category]
 *
 * Examples:
 *   node scripts/sync-amazon-products.mjs 500 "Women's Dresses"
 *   node scripts/sync-amazon-products.mjs 1000 all
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../.env.local') });

const RAINFOREST_API_KEY = process.env.RAINFOREST_API_KEY;
const AMAZON_ASSOCIATE_ID = process.env.AMAZON_ASSOCIATE_ID || 'atlazai-20';
const RAINFOREST_API_URL = 'https://api.rainforestapi.com/request';

// Supabase configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase credentials');
  console.error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

if (!RAINFOREST_API_KEY) {
  console.error('❌ Missing Rainforest API key');
  console.error('Set RAINFOREST_API_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Women's fashion categories on Amazon
const FASHION_CATEGORIES = {
  'all': null, // Fetch all categories
  'dresses': 'Women\'s Dresses',
  'tops': 'Women\'s Tops Tees & Blouses',
  'pants': 'Women\'s Pants',
  'shoes': 'Women\'s Shoes',
  'jewelry': 'Women\'s Jewelry',
  'handbags': 'Women\'s Handbags & Wallets',
  'activewear': 'Women\'s Active Wear',
  'swimwear': 'Women\'s Swimwear',
  'lingerie': 'Women\'s Lingerie',
  'outerwear': 'Women\'s Coats Jackets & Vests',
};

// Search keywords for broad fashion coverage
const FASHION_KEYWORDS = [
  'womens dress',
  'womens top',
  'womens blouse',
  'womens pants',
  'womens jeans',
  'womens shoes',
  'womens boots',
  'womens heels',
  'womens jewelry',
  'womens necklace',
  'womens earrings',
  'womens handbag',
  'womens purse',
  'womens activewear',
  'womens swimsuit',
  'womens jacket',
  'womens coat',
];

// Bundle/lot keywords to filter out
const BUNDLE_KEYWORDS = [
  'bundle',
  'mystery box',
  'mystery bundle',
  'lot of',
  'bulk lot',
  'wholesale lot',
  'mixed lot',
  'grab bag',
  'pack of',
];

function isBundle(title) {
  const titleLower = title.toLowerCase();
  return BUNDLE_KEYWORDS.some(keyword => titleLower.includes(keyword));
}

// Men's product keywords to filter out
const MENS_KEYWORDS = [
  "men's",
  'mens',
  'for men',
  'male',
  'masculine',
  'gentleman',
  'boys',
  "boy's",
  'menswear',
];

function isMensProduct(title, description) {
  const text = `${title} ${description}`.toLowerCase();

  // Check for unisex first
  const unisexPatterns = ['unisex', 'for men and women', 'men & women'];
  if (unisexPatterns.some(pattern => text.includes(pattern))) {
    return false;
  }

  return MENS_KEYWORDS.some(keyword => text.includes(keyword));
}

// Deduplication functions
function normalizeText(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizePriceBucket(price) {
  if (!price || price <= 0) return 'no-price';
  const bucket = Math.round(price / 5) * 5;
  return `$${bucket}`;
}

function extractCoreTitle(title) {
  let core = title.toLowerCase();
  core = core.replace(/\b(for women|women's|womens|ladies|female)\b/g, '');
  core = core.replace(/\b(clothes|clothing|apparel|wear)\b/g, '');
  core = core.replace(/\b(size|sz|small|medium|large|xl+|[0-9]+)\b/g, '');
  core = core.replace(/\b(black|white|gray|grey|blue|red|green|pink|purple|navy|beige)\b/g, '');
  core = core.replace(/\s+/g, ' ').trim();
  return core;
}

function generateContentHash(product) {
  const coreTitle = extractCoreTitle(product.title);
  const normalizedBrand = normalizeText(product.brand);
  const priceBucket = normalizePriceBucket(product.price);
  return `${coreTitle}|${normalizedBrand}|${priceBucket}`;
}

function assessQuality(product) {
  let score = 0;

  // Has description - up to 3 points
  if (product.description && product.description.trim() !== '') {
    score += 1;
    if (product.description.length > 50) score += 1;
    if (product.description.length > 150) score += 1;
  }

  // Has valid price - up to 2 points
  if (product.price && product.price > 0) {
    score += 1;
    if (product.price >= 15 && product.price <= 500) score += 1;
  }

  // Has brand - 1 point
  if (product.brand && product.brand !== 'Unknown' && product.brand.trim() !== '') {
    score += 1;
  }

  // Has image - 1 point
  if (product.imageUrl && product.imageUrl.trim() !== '') {
    score += 1;
  }

  // Has rating - 1 point
  if (product.rating && product.rating >= 3.5) {
    score += 1;
  }

  return score;
}

/**
 * Fetch products from Amazon using Rainforest API
 */
async function fetchAmazonProducts(keyword, page = 1) {
  const params = {
    api_key: RAINFOREST_API_KEY,
    type: 'search',
    amazon_domain: 'amazon.com',
    search_term: keyword,
    page: page.toString(),
    associate_id: AMAZON_ASSOCIATE_ID,
  };

  const url = `${RAINFOREST_API_URL}?${new URLSearchParams(params).toString()}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Rainforest API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();

    if (!data.search_results) {
      console.warn(`⚠️ No search results for keyword: ${keyword}`);
      return [];
    }

    return data.search_results || [];
  } catch (error) {
    console.error(`❌ Error fetching products for "${keyword}":`, error.message);
    return [];
  }
}

/**
 * Convert Amazon product to our schema
 */
function convertAmazonProduct(item) {
  // Extract price
  let price = null;
  if (item.price?.value) {
    price = parseFloat(item.price.value);
  } else if (item.prices && item.prices.length > 0) {
    const priceStr = item.prices[0]?.value || item.prices[0]?.raw;
    if (priceStr) {
      const match = priceStr.match(/[\d,]+\.?\d*/);
      if (match) {
        price = parseFloat(match[0].replace(/,/g, ''));
      }
    }
  }

  // Get product URL with affiliate tag
  const productUrl = item.link || `https://www.amazon.com/dp/${item.asin}?tag=${AMAZON_ASSOCIATE_ID}`;

  // Get image URL
  const imageUrl = item.image || item.image_url || '';

  // Get title
  const title = item.title || '';

  // Get brand
  const brand = item.brand || 'Amazon';

  // Get description (combine available text)
  const descriptionParts = [];
  if (item.product_title) descriptionParts.push(item.product_title);
  if (item.feature_bullets) descriptionParts.push(item.feature_bullets.join(' '));
  const description = descriptionParts.join(' ').slice(0, 500);

  // Get rating
  const rating = item.rating || null;

  // Detect sale
  const onSale = Boolean(
    item.is_prime ||
    item.deal ||
    item.coupon ||
    (item.price?.raw && item.price.raw.toLowerCase().includes('save'))
  );

  return {
    asin: item.asin,
    title,
    description,
    brand,
    price,
    currency: 'USD',
    imageUrl,
    productUrl,
    rating,
    onSale,
  };
}

/**
 * Extract tags from product data
 */
function extractTags(title, description, category) {
  const text = `${title} ${description} ${category}`.toLowerCase();
  const tags = new Set();

  const fashionKeywords = [
    'dress', 'top', 'blouse', 'shirt', 'pants', 'jeans', 'leggings',
    'skirt', 'shorts', 'jumpsuit', 'romper',
    'jacket', 'coat', 'blazer', 'cardigan', 'sweater',
    'shoes', 'boots', 'heels', 'sandals', 'sneakers', 'flats',
    'jewelry', 'necklace', 'bracelet', 'earrings', 'ring',
    'handbag', 'purse', 'wallet', 'clutch', 'tote',
    'activewear', 'athletic', 'yoga', 'gym', 'workout',
    'swimsuit', 'bikini', 'swimwear',
    'lingerie', 'bra', 'underwear',
    'black', 'white', 'blue', 'red', 'pink', 'green', 'purple', 'navy',
    'casual', 'formal', 'elegant', 'trendy', 'vintage',
    'summer', 'winter', 'spring', 'fall',
  ];

  for (const keyword of fashionKeywords) {
    if (text.includes(keyword)) {
      tags.add(keyword);
    }
  }

  return Array.from(tags);
}

/**
 * Main sync function
 */
async function syncProducts(maxProducts = 500, category = 'all', minQualityScore = 5) {
  console.log(`\n🔄 Starting Amazon product sync via Rainforest API...`);
  console.log(`   Max products: ${maxProducts}`);
  console.log(`   Category: ${category}`);
  console.log(`   Min quality score: ${minQualityScore}`);
  console.log(`   Price range: $15 - $500`);
  console.log(`   Amazon Associate ID: ${AMAZON_ASSOCIATE_ID}`);
  console.log(`   Excluding: Men's Products, Bundles\n`);

  let synced = 0;
  let errors = 0;
  let skipped = 0;

  let stats = {
    mens: 0,
    bundles: 0,
    priceRange: 0,
    missingFields: 0,
    lowQuality: 0,
    duplicates: 0,
    lowRating: 0,
  };

  // Determine which keywords to use
  const keywords = category === 'all' ? FASHION_KEYWORDS : [category];

  for (const keyword of keywords) {
    if (synced >= maxProducts) break;

    console.log(`\n🔍 Searching for: "${keyword}"`);

    let page = 1;
    const maxPages = 3; // Fetch up to 3 pages per keyword

    while (page <= maxPages && synced < maxProducts) {
      try {
        console.log(`   📄 Fetching page ${page}...`);
        const products = await fetchAmazonProducts(keyword, page);

        if (products.length === 0) {
          console.log(`   ℹ️ No more products found for "${keyword}"`);
          break;
        }

        console.log(`   📦 Processing ${products.length} products from page ${page}...`);

        for (const item of products) {
          if (synced >= maxProducts) break;

          // Convert to our schema
          const product = convertAmazonProduct(item);

          // Filter: Bundles
          if (isBundle(product.title)) {
            stats.bundles++;
            skipped++;
            continue;
          }

          // Filter: Men's products
          if (isMensProduct(product.title, product.description || '')) {
            stats.mens++;
            skipped++;
            continue;
          }

          // Filter: Price range
          if (!product.price || product.price < 15 || product.price > 500) {
            stats.priceRange++;
            skipped++;
            continue;
          }

          // Filter: Required fields
          if (!product.productUrl || !product.title || !product.imageUrl) {
            stats.missingFields++;
            skipped++;
            continue;
          }

          // Filter: Low ratings (if rating available)
          if (product.rating !== null && product.rating < 3.5) {
            stats.lowRating++;
            skipped++;
            continue;
          }

          // Check quality score
          const qualityScore = assessQuality(product);
          if (qualityScore < minQualityScore) {
            stats.lowQuality++;
            skipped++;
            continue;
          }

          // Extract tags
          const tags = extractTags(product.title, product.description, keyword);

          // Create combined text for search
          const combinedText = `${product.title} ${product.description} ${product.brand} ${tags.join(' ')}`;

          // Generate content hash for deduplication
          const contentHash = generateContentHash(product);

          // Check for existing duplicate
          const { data: existingProducts } = await supabase
            .from('products')
            .select('id, title, description, brand, price, image_url')
            .eq('content_hash', contentHash);

          if (existingProducts && existingProducts.length > 0) {
            // Duplicate exists - compare quality
            const existingQuality = assessQuality({
              description: existingProducts[0].description,
              price: existingProducts[0].price,
              brand: existingProducts[0].brand,
              imageUrl: existingProducts[0].image_url,
            });

            const newQuality = qualityScore;

            // Only insert if new product is better quality or lower price
            if (newQuality <= existingQuality && product.price >= existingProducts[0].price) {
              stats.duplicates++;
              skipped++;
              continue;
            }

            // New product is better - delete the old one
            await supabase
              .from('products')
              .delete()
              .eq('id', existingProducts[0].id);
          }

          try {
            // Upsert to database
            const { error: upsertError } = await supabase
              .from('products')
              .upsert({
                brand: product.brand,
                title: product.title,
                description: product.description,
                tags: tags,
                price: product.price,
                currency: product.currency,
                image_url: product.imageUrl,
                product_url: product.productUrl,
                combined_text: combinedText,
                content_hash: contentHash,
                affiliate_network: 'amazon',
                merchant_id: product.asin,
                merchant_name: 'Amazon',
                on_sale: product.onSale,
              }, {
                onConflict: 'product_url',
                ignoreDuplicates: false,
              });

            if (upsertError) {
              console.error(`   ❌ Error upserting ${product.asin}:`, upsertError.message);
              errors++;
            } else {
              synced++;
              if (synced % 10 === 0) {
                process.stdout.write(`   ✅ Synced: ${synced} | Skipped: ${skipped}\r`);
              }
            }
          } catch (err) {
            console.error(`   ❌ Error processing ${product.asin}:`, err.message);
            errors++;
          }
        }

        console.log(`   ✅ Page ${page} complete - Synced: ${synced} | Skipped: ${skipped}`);

        page++;

        // Rate limiting - Rainforest API has rate limits
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay between requests

      } catch (err) {
        console.error(`   ❌ Error fetching page ${page} for "${keyword}":`, err.message);
        errors++;
        break;
      }
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log('📊 Sync Summary');
  console.log(`${'='.repeat(60)}`);
  console.log(`✅ Synced: ${synced}`);
  console.log(`❌ Errors: ${errors}`);
  console.log(`⏭️  Skipped: ${skipped}`);
  console.log(`\nSkip Reasons:`);
  console.log(`   Men's products: ${stats.mens}`);
  console.log(`   Bundles: ${stats.bundles}`);
  console.log(`   Duplicates: ${stats.duplicates}`);
  console.log(`   Price range: ${stats.priceRange}`);
  console.log(`   Missing fields: ${stats.missingFields}`);
  console.log(`   Low quality: ${stats.lowQuality}`);
  console.log(`   Low rating: ${stats.lowRating}`);
  console.log(`${'='.repeat(60)}\n`);

  return { synced, errors, skipped };
}

// Parse command line args
const maxProducts = parseInt(process.argv[2]) || 500;
const category = process.argv[3] || 'all';

// Run sync
syncProducts(maxProducts, category, 5)
  .then(result => {
    console.log('✅ Sync complete!');
    process.exit(result.errors > 0 ? 1 : 0);
  })
  .catch(err => {
    console.error('❌ Sync failed:', err);
    process.exit(1);
  });

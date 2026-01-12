#!/usr/bin/env node

/**
 * Sync activewear/athleisure products from CJ Affiliate
 *
 * Usage:
 *   node scripts/sync-cj-products.mjs [maxProducts]
 *
 * Example:
 *   node scripts/sync-cj-products.mjs 500
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../.env.local') });

const CJ_TOKEN = process.env.CJ_AFFILIATE_TOKEN || 'nogiW53n2svnVTcrcLp7rScybw';
const CJ_CID = process.env.CJ_AFFILIATE_CID || '7790932';
const CJ_API_URL = 'https://ads.api.cj.com/query';

// Supabase configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase credentials');
  console.error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Activewear keywords
const ACTIVEWEAR_KEYWORDS = [
  'athleisure',
  'activewear',
  'athletic wear',
  'gym clothes',
  'workout clothes',
];

// Bundle keywords
const BUNDLE_KEYWORDS = [
  'bundle',
  'mystery box',
  'mystery bundle',
  'lot of',
  'bulk lot',
  'wholesale lot',
  'mixed lot',
  'grab bag',
];

function isBundle(title) {
  const titleLower = title.toLowerCase();
  return BUNDLE_KEYWORDS.some(keyword => titleLower.includes(keyword));
}

function isPoshmark(advertiserName) {
  return advertiserName && advertiserName.toLowerCase().includes('poshmark');
}

// Men's product keywords
const MENS_KEYWORDS = [
  "men's",
  'mens',
  'for men',
  'male',
  'masculine',
  'man ',
  'gentleman',
  'him',
  'his',
  'boys',
  "boy's",
];

function isMensProduct(title, description) {
  const text = `${title} ${description}`.toLowerCase();
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
  const coreTitle = extractCoreTitle(product.name);
  const normalizedBrand = normalizeText(product.brand);
  const priceBucket = normalizePriceBucket(product.price);
  return `${coreTitle}|${normalizedBrand}|${priceBucket}`;
}

function assessQuality(product) {
  let score = 0;

  // Has description - 1 point
  if (product.description && product.description.trim() !== '') {
    score += 1;
    if (product.description.length > 50) score += 1;
    if (product.description.length > 150) score += 1;
  }

  // Has valid price - 1 point
  if (product.price && product.price > 0) {
    score += 1;
    if (product.price >= 20 && product.price <= 200) score += 1;
  }

  // Has brand - 1 point
  if (product.brand && product.brand !== 'Unknown' && product.brand.trim() !== '') {
    score += 1;
  }

  // Has image - 1 point
  if (product.imageUrl && product.imageUrl.trim() !== '') {
    score += 1;
  }

  return score;
}

async function fetchCJProducts(limit = 100, offset = 0) {
  const keywordsList = ACTIVEWEAR_KEYWORDS.map(k => `"${k}"`).join(', ');
  const query = `
    {
      shoppingProducts(
        companyId: "${CJ_CID}"
        keywords: [${keywordsList}]
        currency: "USD"
        limit: ${limit}
        offset: ${offset}
      ) {
        totalCount
        count
        resultList {
          id
          title
          description
          advertiserId
          advertiserName
          price {
            amount
            currency
          }
          availability
          imageLink
          link
          linkCode(pid: "${CJ_CID}") {
            clickUrl
          }
          brand
          condition
          googleProductCategory {
            id
            name
          }
        }
      }
    }
  `;

  const response = await fetch(CJ_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${CJ_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`CJ API error: ${response.status} ${errorText}`);
  }

  const data = await response.json();

  if (!data.data?.shoppingProducts) {
    throw new Error('Invalid response from CJ Affiliate API');
  }

  return data.data.shoppingProducts;
}

function extractTags(name, description, category) {
  const text = `${name} ${description} ${category}`.toLowerCase();
  const tags = new Set();

  const allKeywords = [
    'leggings', 'yoga pants', 'joggers', 'sweatpants', 'athletic shorts',
    'sports bra', 'tank top', 'workout top', 'hoodie', 'sweatshirt',
    'running shoes', 'sneakers', 'athletic shoes',
    'activewear', 'athleisure', 'sportswear',
    'yoga', 'running', 'gym', 'workout', 'training', 'fitness',
    'compression', 'moisture wicking', 'quick dry', 'seamless',
    'black', 'white', 'gray', 'grey', 'navy', 'blue', 'pink', 'purple',
  ];

  for (const keyword of allKeywords) {
    if (text.includes(keyword)) {
      tags.add(keyword);
    }
  }

  if (category) {
    tags.add(category.toLowerCase());
  }

  return Array.from(tags);
}

async function syncProducts(maxProducts = 500, minQualityScore = 4) {
  console.log(`\n🔄 Starting CJ Affiliate sync...`);
  console.log(`   Max products: ${maxProducts}`);
  console.log(`   Min quality score: ${minQualityScore}`);
  console.log(`   Price range: $20 - $2000`);
  console.log(`   Excluding: Poshmark, Men's Products, Bundles`);
  console.log(`   Focus: Women's Activewear/Athleisure Only\n`);

  let synced = 0;
  let errors = 0;
  let skipped = 0;
  let offset = 0;
  const limit = 100;

  let stats = {
    poshmark: 0,
    mens: 0,
    bundles: 0,
    priceRange: 0,
    missingFields: 0,
    lowQuality: 0,
    duplicates: 0,
  };

  while (synced < maxProducts) {
    try {
      const productsData = await fetchCJProducts(limit, offset);

      console.log(`📦 Fetched ${productsData.count} products (offset ${offset}, total available: ${productsData.totalCount.toLocaleString()})`);

      if (productsData.resultList.length === 0) {
        console.log('✅ No more products to fetch');
        break;
      }

      for (const item of productsData.resultList) {
        // Filter: Poshmark
        if (isPoshmark(item.advertiserName)) {
          stats.poshmark++;
          skipped++;
          continue;
        }

        // Filter: Men's products
        if (isMensProduct(item.title, item.description || '')) {
          stats.mens++;
          skipped++;
          continue;
        }

        // Filter: Bundles
        if (isBundle(item.title)) {
          stats.bundles++;
          skipped++;
          continue;
        }

        // Filter: Price range
        const price = item.price ? parseFloat(item.price.amount) : 0;
        if (price < 20 || price > 2000) {
          stats.priceRange++;
          skipped++;
          continue;
        }

        // Filter: Required fields
        const productUrl = item.linkCode?.clickUrl || item.link || '';
        const imageUrl = item.imageLink || '';
        if (!productUrl || !item.title || !imageUrl) {
          stats.missingFields++;
          skipped++;
          continue;
        }

        // Build product object
        const product = {
          id: item.id,
          name: item.title,
          description: item.description || '',
          price: price > 0 ? price : null,
          currency: item.price?.currency || 'USD',
          imageUrl,
          productUrl,
          brand: item.brand || item.advertiserName || 'Unknown',
          category: item.googleProductCategory?.name || 'Activewear',
          merchantName: item.advertiserName || 'Unknown',
          merchantId: item.advertiserId,
        };

        // Check quality score
        const qualityScore = assessQuality(product);
        if (qualityScore < minQualityScore) {
          stats.lowQuality++;
          skipped++;
          continue;
        }

        // Extract tags
        const tags = extractTags(product.name, product.description, product.category);

        // Detect sale status
        const text = `${product.name} ${product.description}`.toLowerCase();
        const onSale = /\b(on\s+)?sale\b/.test(text);

        // Create combined text
        const combinedText = `${product.name} ${product.description} ${product.brand} ${tags.join(' ')}`;

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
              title: product.name,
              description: product.description,
              tags: tags,
              price: product.price,
              currency: product.currency,
              image_url: product.imageUrl,
              product_url: product.productUrl,
              combined_text: combinedText,
              content_hash: contentHash,
              affiliate_network: 'cj',
              merchant_id: product.merchantId,
              merchant_name: product.merchantName,
              on_sale: onSale,
            }, {
              onConflict: 'product_url',
              ignoreDuplicates: false,
            });

          if (upsertError) {
            console.error(`   ❌ Error upserting ${product.id}:`, upsertError.message);
            errors++;
          } else {
            synced++;
            if (synced % 10 === 0) {
              process.stdout.write(`   ✅ Synced: ${synced}\r`);
            }
          }
        } catch (err) {
          console.error(`   ❌ Error processing ${product.id}:`, err.message);
          errors++;
        }

        if (synced >= maxProducts) break;
      }

      console.log(`   ✅ Synced: ${synced} | Skipped: ${skipped}`);

      offset += limit;

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (synced >= maxProducts) break;

    } catch (err) {
      console.error('❌ Fetch error:', err.message);
      errors++;
      break;
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log('📊 Sync Summary');
  console.log(`${'='.repeat(60)}`);
  console.log(`✅ Synced: ${synced}`);
  console.log(`❌ Errors: ${errors}`);
  console.log(`⏭️  Skipped: ${skipped}`);
  console.log(`\nSkip Reasons:`);
  console.log(`   Poshmark: ${stats.poshmark}`);
  console.log(`   Men's products: ${stats.mens}`);
  console.log(`   Bundles: ${stats.bundles}`);
  console.log(`   Duplicates: ${stats.duplicates}`);
  console.log(`   Price range: ${stats.priceRange}`);
  console.log(`   Missing fields: ${stats.missingFields}`);
  console.log(`   Low quality: ${stats.lowQuality}`);
  console.log(`${'='.repeat(60)}\n`);

  return { synced, errors, skipped };
}

// Parse command line args
const maxProducts = parseInt(process.argv[2]) || 500;

// Run sync
syncProducts(maxProducts, 4)
  .then(result => {
    console.log('✅ Sync complete!');
    process.exit(result.errors > 0 ? 1 : 0);
  })
  .catch(err => {
    console.error('❌ Sync failed:', err);
    process.exit(1);
  });

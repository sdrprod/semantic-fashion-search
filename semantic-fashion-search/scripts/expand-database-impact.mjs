#!/usr/bin/env node

/**
 * Expand Product Database with Impact.com Campaigns
 *
 * This script discovers and syncs high-quality fashion products from Impact.com
 * to reach ~15,000 total products with good diversity across categories.
 *
 * USAGE:
 *   node scripts/expand-database-impact.mjs
 *
 * FEATURES:
 *   - Auto-discovers fashion campaigns
 *   - Quality filtering (price, image, description)
 *   - Category diversity tracking
 *   - Progress monitoring
 *   - Skips existing products
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env.local first (takes precedence), then .env
dotenv.config({ path: join(__dirname, '..', '.env.local') });
dotenv.config({ path: join(__dirname, '..', '.env') });

// Impact API configuration
const IMPACT_API_BASE = 'https://api.impact.com';
const IMPACT_ACCOUNT_SID = process.env.IMPACT_ACCOUNT_SID;
const IMPACT_AUTH_TOKEN = process.env.IMPACT_AUTH_TOKEN;

// Target goals
const TARGET_TOTAL_PRODUCTS = 20000;
const MIN_PRODUCTS_PER_CATEGORY = 1000;

// Quality filters
const MIN_PRICE = 10;
const MAX_PRICE = 2000;
const MIN_DESCRIPTION_LENGTH = 50;

// Category keywords for diversity
const CATEGORY_KEYWORDS = {
  dresses: ['dress', 'gown', 'cocktail', 'evening'],
  tops: ['top', 'blouse', 'shirt', 'tee', 'sweater'],
  bottoms: ['pants', 'jeans', 'skirt', 'shorts', 'leggings'],
  outerwear: ['jacket', 'coat', 'blazer', 'cardigan'],
  shoes: ['shoe', 'heel', 'boot', 'sandal', 'sneaker', 'flat'],
  bags: ['bag', 'handbag', 'purse', 'tote', 'clutch', 'backpack'],
  jewelry: ['jewelry', 'necklace', 'earring', 'bracelet', 'ring'],
  accessories: ['scarf', 'belt', 'hat', 'sunglasses', 'watch']
};

/**
 * Create Impact API authorization header
 */
function getAuthHeader() {
  const credentials = Buffer.from(`${IMPACT_ACCOUNT_SID}:${IMPACT_AUTH_TOKEN}`).toString('base64');
  return `Basic ${credentials}`;
}

/**
 * Fetch available campaigns from Impact
 */
async function fetchCampaigns() {
  console.log('Fetching available Impact.com campaigns...');

  try {
    const response = await fetch(
      `${IMPACT_API_BASE}/Mediapartners/${IMPACT_ACCOUNT_SID}/Campaigns`,
      {
        headers: {
          'Authorization': getAuthHeader(),
          'Accept': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Impact API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`Found ${data.Campaigns?.length || 0} total campaigns`);

    // DEBUG: Log raw structure of first campaign
    if (data.Campaigns && data.Campaigns.length > 0) {
      console.log('\n🔍 DEBUG: First campaign structure:');
      console.log(JSON.stringify(data.Campaigns[0], null, 2));
      console.log('\n🔍 DEBUG: Available properties:', Object.keys(data.Campaigns[0]));
      console.log('');
    }

    return data.Campaigns || [];
  } catch (error) {
    console.error('Error fetching campaigns:', error.message);
    return [];
  }
}

/**
 * Filter campaigns for fashion-related ones
 */
function filterFashionCampaigns(campaigns) {
  const fashionKeywords = [
    'fashion', 'clothing', 'apparel', 'shoes', 'footwear',
    'accessories', 'jewelry', 'handbag', 'dress', 'retail',
    'boutique', 'style', 'wear', 'outlet', 'store', 'shop'
  ];

  return campaigns.filter(campaign => {
    const name = campaign.CampaignName?.toLowerCase() || '';
    const description = campaign.CampaignDescription?.toLowerCase() || '';

    return fashionKeywords.some(keyword =>
      name.includes(keyword) || description.includes(keyword)
    );
  });
}

/**
 * Fetch products from a campaign
 */
async function fetchCampaignProducts(campaignId, page = 1, pageSize = 100) {
  try {
    const url = `${IMPACT_API_BASE}/Mediapartners/${IMPACT_ACCOUNT_SID}/Catalogs/${campaignId}/Items?Page=${page}&PageSize=${pageSize}`;
    console.log(`  Fetching: ${url}`);

    const response = await fetch(url, {
      headers: {
        'Authorization': getAuthHeader(),
        'Accept': 'application/json'
      }
    });

    console.log(`  Response status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      if (response.status === 404) {
        console.log(`  ⚠️  No product catalog available (404)`);
        return { Items: [], TotalCount: 0 };
      }
      const errorBody = await response.text().catch(() => 'Unable to read error');
      console.error(`  ❌ API error: ${response.status} - ${errorBody}`);
      throw new Error(`Impact API error: ${response.status}`);
    }

    const data = await response.json();
    console.log(`  ✅ Found ${data.Items?.length || 0} items (Total: ${data.TotalCount || 0})`);
    return data;
  } catch (error) {
    console.error(`  ❌ Error fetching products for campaign ${campaignId}:`, error.message);
    return { Items: [], TotalCount: 0 };
  }
}

/**
 * Determine product category from title/description
 */
function categorizeProduct(product) {
  const text = `${product.Name} ${product.Description}`.toLowerCase();

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(keyword => text.includes(keyword))) {
      return category;
    }
  }

  return 'other';
}

/**
 * Quality check for products
 */
function passesQualityCheck(product) {
  // Must have required fields
  if (!product.Name || !product.ImageUrl || !product.Url) {
    return { passed: false, reason: 'Missing required fields' };
  }

  // Price check
  const price = parseFloat(product.CurrentPrice || product.Price);
  if (isNaN(price) || price < MIN_PRICE || price > MAX_PRICE) {
    return { passed: false, reason: `Price out of range: $${price}` };
  }

  // Description check - allow "none" or use Name if Description is empty/short
  const description = product.Description && product.Description.toLowerCase() !== 'none'
    ? product.Description
    : product.Name;

  if (!description || description.length < MIN_DESCRIPTION_LENGTH) {
    return { passed: false, reason: 'Description too short' };
  }

  // Image URL check
  if (!product.ImageUrl.match(/\.(jpg|jpeg|png|webp)(\?|$)/i)) {
    return { passed: false, reason: 'Invalid image format' };
  }

  return { passed: true };
}

/**
 * Convert Impact product to our schema
 */
function convertProduct(impactProduct, campaignName) {
  // Use Name as description if Description is "none" or empty
  const description = impactProduct.Description && impactProduct.Description.toLowerCase() !== 'none'
    ? impactProduct.Description
    : impactProduct.Name;

  return {
    title: impactProduct.Name,
    description: description,
    brand: impactProduct.Manufacturer || impactProduct.CampaignName || campaignName,
    price: parseFloat(impactProduct.CurrentPrice || impactProduct.Price) || null,
    currency: impactProduct.Currency || 'USD',
    image_url: impactProduct.ImageUrl,
    product_url: impactProduct.Url,
    tags: impactProduct.Labels || [],
    merchant_id: impactProduct.CatalogId,
    merchant_name: impactProduct.CampaignName || campaignName,
    affiliate_network: 'impact',
    combined_text: `${impactProduct.Manufacturer || impactProduct.CampaignName || ''} ${impactProduct.Name} ${description}`.trim()
  };
}

/**
 * Main execution
 */
async function main() {
  console.log('='.repeat(70));
  console.log('EXPAND PRODUCT DATABASE WITH IMPACT.COM CAMPAIGNS');
  console.log('='.repeat(70));
  console.log('');

  // Verify credentials are loaded
  console.log('Pre-flight checks:');
  console.log(`  ✓ IMPACT_ACCOUNT_SID: ${IMPACT_ACCOUNT_SID ? `${IMPACT_ACCOUNT_SID.slice(0, 8)}...` : '❌ MISSING'}`);
  console.log(`  ✓ IMPACT_AUTH_TOKEN: ${IMPACT_AUTH_TOKEN ? '***' + IMPACT_AUTH_TOKEN.slice(-4) : '❌ MISSING'}`);
  console.log(`  ✓ SUPABASE_URL: ${process.env.SUPABASE_URL ? 'loaded' : '❌ MISSING'}`);
  console.log(`  ✓ SUPABASE_SERVICE_ROLE_KEY: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? 'loaded' : '❌ MISSING'}`);
  console.log('');

  if (!IMPACT_ACCOUNT_SID || !IMPACT_AUTH_TOKEN) {
    console.error('❌ Impact.com credentials missing!');
    console.error('Please ensure IMPACT_ACCOUNT_SID and IMPACT_AUTH_TOKEN are set in .env.local');
    process.exit(1);
  }

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Supabase credentials missing!');
    console.error('Please ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env or .env.local');
    process.exit(1);
  }

  // Initialize Supabase
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Check current database status
  console.log('Checking current database status...');
  const { count: currentCount } = await supabase
    .from('products')
    .select('id', { count: 'exact', head: true });

  console.log(`Current products: ${currentCount}`);
  console.log(`Target products: ${TARGET_TOTAL_PRODUCTS}`);
  console.log(`Need to add: ${TARGET_TOTAL_PRODUCTS - currentCount}`);
  console.log('');

  if (currentCount >= TARGET_TOTAL_PRODUCTS) {
    console.log('✅ Target already reached!');
    return;
  }

  // Use configured campaign IDs (these are known to have product catalogs)
  const configuredIds = process.env.IMPACT_CAMPAIGN_IDS?.split(',').map(id => id.trim()) || [];

  if (configuredIds.length === 0) {
    console.log('❌ No campaign IDs configured in IMPACT_CAMPAIGN_IDS');
    console.log('Please add campaign IDs to .env.local');
    return;
  }

  console.log(`Using ${configuredIds.length} configured campaign IDs from IMPACT_CAMPAIGN_IDS`);
  console.log('Campaign IDs:', configuredIds.join(', '));
  console.log('');

  // Track progress
  let totalAdded = 0;
  let totalSkipped = 0;
  let totalFailed = 0;
  const categoryCount = {};

  // Process each configured campaign ID
  for (const campaignId of configuredIds) {
    const campaignName = `Campaign ${campaignId}`;

    console.log(`\n${'='.repeat(70)}`);
    console.log(`Processing: ${campaignName} (${campaignId})`);
    console.log(`${'='.repeat(70)}`);

    let page = 1;
    let hasMore = true;
    let campaignAdded = 0;

    while (hasMore && (currentCount + totalAdded) < TARGET_TOTAL_PRODUCTS) {
      const response = await fetchCampaignProducts(campaignId, page);

      if (!response.Items || response.Items.length === 0) {
        hasMore = false;
        break;
      }

      console.log(`\nPage ${page}: ${response.Items.length} products`);

      // Track rejection reasons
      const rejectionReasons = new Map();

      for (const item of response.Items) {
        // Quality check
        const quality = passesQualityCheck(item);
        if (!quality.passed) {
          totalSkipped++;
          // Track rejection reasons
          rejectionReasons.set(quality.reason, (rejectionReasons.get(quality.reason) || 0) + 1);
          continue;
        }

        // Convert to our schema
        const product = convertProduct(item, campaignName);

        // Category tracking
        const category = categorizeProduct(product);
        categoryCount[category] = (categoryCount[category] || 0) + 1;

        // Insert into database
        try {
          const { error } = await supabase
            .from('products')
            .insert([product]);

          if (error) {
            if (error.code === '23505') { // Duplicate
              totalSkipped++;
            } else {
              console.error(`Error inserting product:`, error.message);
              totalFailed++;
            }
          } else {
            totalAdded++;
            campaignAdded++;

            if (totalAdded % 100 === 0) {
              console.log(`Progress: ${totalAdded} added, ${totalSkipped} skipped, ${totalFailed} failed`);
            }
          }
        } catch (err) {
          console.error(`Exception inserting product:`, err.message);
          totalFailed++;
        }

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      page++;
      hasMore = response.Items.length === 100;

      // Print rejection summary for this page
      if (rejectionReasons.size > 0) {
        console.log(`  Rejection summary:`);
        Array.from(rejectionReasons.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .forEach(([reason, count]) => {
            console.log(`    - ${reason}: ${count}`);
          });
      }
    }

    console.log(`\nCampaign complete: ${campaignAdded} products added`);
  }

  // Final summary
  console.log('');
  console.log('='.repeat(70));
  console.log('SUMMARY');
  console.log('='.repeat(70));
  console.log(`Total added: ${totalAdded}`);
  console.log(`Total skipped: ${totalSkipped}`);
  console.log(`Total failed: ${totalFailed}`);
  console.log(`New total: ${currentCount + totalAdded}`);
  console.log('');
  console.log('Category Distribution:');
  Object.entries(categoryCount)
    .sort((a, b) => b[1] - a[1])
    .forEach(([category, count]) => {
      console.log(`  ${category}: ${count}`);
    });
  console.log('');

  if (currentCount + totalAdded >= TARGET_TOTAL_PRODUCTS) {
    console.log('✅ Target reached!');
  } else {
    console.log(`⚠️  Still need ${TARGET_TOTAL_PRODUCTS - (currentCount + totalAdded)} more products`);
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

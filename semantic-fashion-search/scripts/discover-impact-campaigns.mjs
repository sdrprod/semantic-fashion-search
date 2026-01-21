#!/usr/bin/env node

/**
 * Discover all Impact.com campaigns (catalogs) and analyze fashion/apparel availability
 *
 * This script:
 * 1. Attempts to discover all campaigns you're approved for
 * 2. Samples products from each campaign
 * 3. Analyzes: USD %, fashion %, quality score, merchant diversity
 * 4. Recommends best campaigns to add to configuration
 *
 * Note: Impact.com API calls them "catalogs" but they're campaigns in business terminology
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env.local from parent directory
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const IMPACT_API_BASE = 'https://api.impact.com';
const ACCOUNT_SID = process.env.IMPACT_ACCOUNT_SID;
const AUTH_TOKEN = process.env.IMPACT_AUTH_TOKEN;

if (!ACCOUNT_SID || !AUTH_TOKEN) {
  console.error('❌ Missing Impact API credentials');
  console.error('Set IMPACT_ACCOUNT_SID and IMPACT_AUTH_TOKEN in .env.local');
  process.exit(1);
}

const authHeader = Buffer.from(`${ACCOUNT_SID}:${AUTH_TOKEN}`).toString('base64');

// Fashion keywords for categorization
const FASHION_KEYWORDS = [
  'dress', 'shirt', 'pants', 'jeans', 'skirt', 'jacket', 'coat', 'sweater',
  'shoes', 'boots', 'heels', 'sandals', 'sneakers', 'bag', 'handbag', 'purse',
  'jewelry', 'necklace', 'earrings', 'watch', 'scarf', 'belt', 'hat',
  'clothing', 'apparel', 'fashion', 'women', 'mens', 'wear',
];

const NON_FASHION_KEYWORDS = [
  'phone', 'charger', 'cable', 'electronics', 'headphone', 'speaker',
  'computer', 'laptop', 'tablet', 'kitchen', 'appliance', 'tool',
  'toy', 'game', 'pet', 'dog', 'cat',
];

/**
 * Fetch products from a campaign
 */
async function fetchCampaignProducts(campaignId, page = 1, pageSize = 100) {
  const url = `${IMPACT_API_BASE}/Mediapartners/${ACCOUNT_SID}/Catalogs/${campaignId}/Items?Page=${page}&PageSize=${pageSize}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${authHeader}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    return null;
  }
}

/**
 * Analyze a product for fashion relevance and quality
 */
function analyzeProduct(product) {
  const name = (product.Name || '').toLowerCase();
  const description = (product.Description || '').toLowerCase();
  const text = `${name} ${description}`;

  // Check currency
  const isUSD = product.Currency === 'USD';

  // Check fashion keywords
  const hasFashionKeyword = FASHION_KEYWORDS.some(kw => text.includes(kw));
  const hasNonFashionKeyword = NON_FASHION_KEYWORDS.some(kw => text.includes(kw));
  const isFashion = hasFashionKeyword && !hasNonFashionKeyword;

  // Check quality indicators
  const hasDescription = description.length > 20;
  const currentPrice = parseFloat(product.CurrentPrice || product.Price || '0');
  const hasValidPrice = currentPrice > 0;
  const hasBrand = product.Manufacturer && product.Manufacturer !== 'Unknown';

  let qualityScore = 0;
  if (hasDescription) qualityScore++;
  if (description.length > 100) qualityScore++;
  if (hasValidPrice && currentPrice >= 5 && currentPrice <= 500) qualityScore += 2;
  if (hasBrand) qualityScore++;
  if (isFashion) qualityScore++;

  return {
    isUSD,
    isFashion,
    qualityScore,
    price: hasValidPrice ? currentPrice : null,
    brand: product.Manufacturer || 'Unknown',
  };
}

/**
 * Sample and analyze a campaign
 */
async function analyzeCampaign(campaignId, sampleSize = 100) {
  console.log(`\n📊 Analyzing campaign ${campaignId}...`);

  const data = await fetchCampaignProducts(campaignId, 1, sampleSize);

  if (!data || !data.Items || data.Items.length === 0) {
    console.log(`   ❌ No products available`);
    return null;
  }

  const products = data.Items;
  const totalAvailable = data.TotalCount || products.length;

  let usdCount = 0;
  let fashionCount = 0;
  let highQualityCount = 0;
  const qualityScores = [];
  const brands = new Set();
  const currencies = new Set();

  products.forEach(product => {
    const analysis = analyzeProduct(product);

    if (analysis.isUSD) usdCount++;
    if (analysis.isFashion) fashionCount++;
    if (analysis.qualityScore >= 5) highQualityCount++;

    qualityScores.push(analysis.qualityScore);
    brands.add(analysis.brand);
    currencies.add(product.Currency);
  });

  const usdPercent = Math.round((usdCount / products.length) * 100);
  const fashionPercent = Math.round((fashionCount / products.length) * 100);
  const qualityPercent = Math.round((highQualityCount / products.length) * 100);
  const avgQuality = (qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length).toFixed(1);

  // Determine if campaign is worth using
  const isGoodCampaign = usdPercent >= 80 && fashionPercent >= 40 && qualityPercent >= 30;

  console.log(`   ${isGoodCampaign ? '✅' : '❌'} Campaign ${campaignId}`);
  console.log(`   Products: ${totalAvailable.toLocaleString()} total, sampled ${products.length}`);
  console.log(`   USD: ${usdPercent}% | Fashion: ${fashionPercent}% | Quality ≥5: ${qualityPercent}%`);
  console.log(`   Avg quality score: ${avgQuality}/6`);
  console.log(`   Brands: ${brands.size} unique`);
  console.log(`   Currencies: ${Array.from(currencies).join(', ')}`);

  return {
    campaignId,
    totalAvailable,
    sampled: products.length,
    usdPercent,
    fashionPercent,
    qualityPercent,
    avgQuality: parseFloat(avgQuality),
    uniqueBrands: brands.size,
    currencies: Array.from(currencies),
    isGoodCampaign,
  };
}

/**
 * Try to discover campaigns by testing common ID patterns
 */
async function discoverCampaigns() {
  console.log('🔍 IMPACT CAMPAIGN DISCOVERY\n');
  console.log('Scanning for approved campaigns with fashion/apparel products...\n');

  // Known campaigns from config
  const knownCampaigns = [7183, 7184, 7186, 7187, 21283];

  // Expand search range based on known IDs
  const campaignsToTest = [
    ...knownCampaigns,
    // Test nearby IDs (DHGate pattern: 718x, 719x)
    7180, 7181, 7182, 7185, 7188, 7189, 7190, 7191, 7192, 7193,
    // Test other ranges that might exist
    7160, 7161, 7162, 7163, 7164, 7165, 7166, 7167, 7168, 7169, 7170,
    // Test 5-digit ranges
    21280, 21281, 21282, 21284, 21285, 21286, 21287, 21288, 21289, 21290,
    // Test lower ranges
    11923, 22361, 28532,
    // Test 4-digit ranges
    1000, 1001, 1002, 2000, 2001, 3000, 3001, 4000, 5000, 6000,
  ];

  const results = [];

  for (const campaignId of campaignsToTest) {
    const result = await analyzeCampaign(campaignId);
    if (result) {
      results.push(result);
    }

    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  return results;
}

/**
 * Main execution
 */
async function main() {
  const results = await discoverCampaigns();

  console.log('\n' + '='.repeat(80));
  console.log('SUMMARY');
  console.log('='.repeat(80) + '\n');

  if (results.length === 0) {
    console.log('❌ No campaigns found with available products\n');
    return;
  }

  // Sort by quality (fashion % * quality %)
  results.sort((a, b) => {
    const scoreA = (a.fashionPercent / 100) * (a.qualityPercent / 100) * 10000;
    const scoreB = (b.fashionPercent / 100) * (b.qualityPercent / 100) * 10000;
    return scoreB - scoreA;
  });

  console.log('All Discovered Campaigns:\n');
  results.forEach(r => {
    const status = r.isGoodCampaign ? '✅' : '❌';
    const inConfig = [7183, 7184, 7186, 7187, 21283].includes(parseInt(r.campaignId)) ? '📌 IN CONFIG' : '';
    console.log(`${status} Campaign ${r.campaignId} ${inConfig}`);
    console.log(`   ${r.totalAvailable.toLocaleString()} products | ${r.usdPercent}% USD | ${r.fashionPercent}% fashion | ${r.qualityPercent}% quality ≥5`);
    console.log(`   Avg quality: ${r.avgQuality}/6 | Brands: ${r.uniqueBrands} | Currencies: ${r.currencies.join(', ')}\n`);
  });

  // Recommendations
  const goodCampaigns = results.filter(r => r.isGoodCampaign);
  const newCampaigns = goodCampaigns.filter(r => ![7183, 7184, 7186, 7187, 21283].includes(parseInt(r.campaignId)));

  if (newCampaigns.length > 0) {
    console.log('\n💡 NEW CAMPAIGNS TO ADD:\n');
    newCampaigns.forEach(r => {
      console.log(`Campaign ${r.campaignId}: ${r.fashionPercent}% fashion, ${r.qualityPercent}% high quality, ${r.totalAvailable.toLocaleString()} products`);
    });

    const newIds = newCampaigns.map(r => r.campaignId).join(',');
    console.log(`\nAdd to .env.local IMPACT_CAMPAIGN_IDS: ${newIds}`);
  } else {
    console.log('\n✅ You\'re already using the best available campaigns!');
    console.log('No better campaigns found in the scanned ranges.');
  }

  console.log('\n' + '='.repeat(80) + '\n');
}

main().catch(console.error);

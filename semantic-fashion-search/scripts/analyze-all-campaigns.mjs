#!/usr/bin/env node

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });
dotenv.config({ path: join(__dirname, '..', '.env') });

const IMPACT_API_BASE = 'https://api.impact.com';

// Get credentials
const credentials = {
  accountSid: process.env.IMPACT_ACCOUNT_SID,
  authToken: process.env.IMPACT_AUTH_TOKEN,
};

function createAuthHeader() {
  const encoded = Buffer.from(`${credentials.accountSid}:${credentials.authToken}`).toString('base64');
  return `Basic ${encoded}`;
}

// Fashion category whitelist
const FASHION_CATEGORIES = [
  'women', 'womens', "women's", 'ladies', 'female',
  'men', 'mens', "men's", 'male',
  'clothing', 'apparel', 'fashion',
  'shoes', 'footwear', 'boots', 'sandals', 'heels', 'sneakers',
  'accessories', 'jewelry', 'jewellery', 'watches',
  'bags', 'handbags', 'purses', 'wallets', 'backpacks',
  'sunglasses', 'eyewear', 'belts', 'hats', 'scarves', 'gloves',
  'dresses', 'tops', 'bottoms', 'outerwear', 'activewear', 'sportswear',
  'swimwear', 'lingerie', 'underwear', 'sleepwear', 'loungewear',
  'suits', 'jackets', 'coats', 'sweaters', 'hoodies', 'shirts', 'blouses',
  'pants', 'jeans', 'shorts', 'skirts', 'leggings',
];

// Non-fashion keywords
const NON_FASHION_KEYWORDS = [
  'phone', 'iphone', 'tablet', 'ipad', 'computer', 'laptop',
  'watch strap', 'watch band', 'apple watch', 'smart watch',
  'kitchen', 'waffle', 'grill', 'toy', 'game',
  'electronics', 'gadget', 'charger', 'cable',
];

function isFashionCategory(category) {
  if (!category) return false;
  const categoryLower = category.toLowerCase();
  return FASHION_CATEGORIES.some(prefix => categoryLower.startsWith(prefix.toLowerCase()));
}

function hasNonFashionKeywords(name, description) {
  const text = `${name} ${description}`.toLowerCase();
  return NON_FASHION_KEYWORDS.some(keyword => text.includes(keyword));
}

function assessProductQuality(product) {
  let score = 0;

  // Has valid description
  const hasValidDescription = product.Description &&
                               product.Description !== 'null' &&
                               product.Description !== 'none' &&
                               product.Description.trim() !== '';
  if (hasValidDescription) {
    score += 1;
    if (product.Description.length > 50) score += 1;
    if (product.Description.length > 150) score += 1;
  }

  // Has valid price
  if (product.Price && product.Price > 0) {
    score += 1;
    if (product.Price >= 5 && product.Price <= 500) score += 1;
  }

  // Has brand
  if (product.Manufacturer && product.Manufacturer !== 'Unknown' && product.Manufacturer.trim() !== '') {
    score += 1;
  }

  // Is fashion product
  const isFashion = isFashionCategory(product.Category);
  if (isFashion) {
    score += 1;
  }

  return score;
}

async function analyzeCampaign(campaignId) {
  const url = `${IMPACT_API_BASE}/Mediapartners/${credentials.accountSid}/Catalogs/${campaignId}/Items?Page=1&PageSize=100`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': createAuthHeader(),
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      return {
        campaignId,
        error: `HTTP ${response.status}`,
        totalProducts: 0,
      };
    }

    const data = await response.json();
    const products = data.Items || [];
    const totalProducts = data.TotalCount || 0;

    if (products.length === 0) {
      return {
        campaignId,
        totalProducts: 0,
        error: 'No products',
      };
    }

    // Analyze first 100 products
    const merchants = new Set();
    let usdCount = 0;
    let fashionCategoryCount = 0;
    let nonFashionKeywordCount = 0;
    let quality5Plus = 0;
    let quality6Plus = 0;
    const qualityScores = [];

    products.forEach(p => {
      merchants.add(p.Manufacturer || 'Unknown');

      if (p.Currency === 'USD') usdCount++;

      const isFashion = isFashionCategory(p.Category);
      if (isFashion) fashionCategoryCount++;

      const hasNonFashion = hasNonFashionKeywords(p.Name, p.Description || '');
      if (hasNonFashion) nonFashionKeywordCount++;

      const score = assessProductQuality(p);
      qualityScores.push(score);
      if (score >= 5) quality5Plus++;
      if (score >= 6) quality6Plus++;
    });

    const merchantList = Array.from(merchants);
    const isDHGate = merchantList.some(m => m.toLowerCase().includes('dhgate'));

    const usdPercent = ((usdCount / products.length) * 100).toFixed(0);
    const fashionPercent = ((fashionCategoryCount / products.length) * 100).toFixed(0);
    const nonFashionPercent = ((nonFashionKeywordCount / products.length) * 100).toFixed(0);
    const quality5Percent = ((quality5Plus / products.length) * 100).toFixed(0);
    const quality6Percent = ((quality6Plus / products.length) * 100).toFixed(0);

    const avgScore = (qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length).toFixed(1);

    return {
      campaignId,
      totalProducts,
      merchants: merchantList,
      isDHGate,
      usdPercent: parseInt(usdPercent),
      fashionPercent: parseInt(fashionPercent),
      nonFashionPercent: parseInt(nonFashionPercent),
      quality5Percent: parseInt(quality5Percent),
      quality6Percent: parseInt(quality6Percent),
      avgQualityScore: parseFloat(avgScore),
      sampleSize: products.length,
    };

  } catch (error) {
    return {
      campaignId,
      error: error.message,
      totalProducts: 0,
    };
  }
}

async function main() {
  const campaignIds = process.env.IMPACT_CAMPAIGN_IDS.split(',').map(id => id.trim());

  console.log('='.repeat(80));
  console.log('COMPREHENSIVE CAMPAIGN ANALYSIS');
  console.log('='.repeat(80));
  console.log('');
  console.log(`Analyzing ${campaignIds.length} campaigns...`);
  console.log('');

  const results = [];

  for (const campaignId of campaignIds) {
    process.stdout.write(`Analyzing campaign ${campaignId}... `);
    const result = await analyzeCampaign(campaignId);
    results.push(result);

    if (result.error) {
      console.log(`❌ ${result.error}`);
    } else {
      console.log(`✅ (${result.totalProducts.toLocaleString()} products)`);
    }

    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('');
  console.log('='.repeat(80));
  console.log('RESULTS BY QUALITY');
  console.log('='.repeat(80));
  console.log('');

  // Separate DHGate and non-DHGate
  const dhgateCampaigns = results.filter(r => r.isDHGate && !r.error);
  const nonDHGateCampaigns = results.filter(r => !r.isDHGate && !r.error);
  const errorCampaigns = results.filter(r => r.error);

  // Sort by quality
  dhgateCampaigns.sort((a, b) => b.quality6Percent - a.quality6Percent);
  nonDHGateCampaigns.sort((a, b) => b.quality6Percent - a.quality6Percent);

  console.log('🏆 NON-DHGATE CAMPAIGNS (HIGHEST QUALITY):');
  console.log('');
  if (nonDHGateCampaigns.length > 0) {
    nonDHGateCampaigns.forEach(c => {
      const status = c.quality6Percent >= 60 ? '✅ EXCELLENT' :
                     c.quality6Percent >= 40 ? '✅ GOOD' :
                     c.quality6Percent >= 20 ? '⚠️  FAIR' : '❌ POOR';
      console.log(`  Campaign ${c.campaignId}: ${status}`);
      console.log(`    Total: ${c.totalProducts.toLocaleString()} products`);
      console.log(`    Merchants: ${c.merchants.slice(0, 3).join(', ')}${c.merchants.length > 3 ? '...' : ''}`);
      console.log(`    USD: ${c.usdPercent}% | Fashion: ${c.fashionPercent}% | Non-Fashion Keywords: ${c.nonFashionPercent}%`);
      console.log(`    Quality 5+: ${c.quality5Percent}% | Quality 6+: ${c.quality6Percent}% | Avg Score: ${c.avgQualityScore}`);
      console.log('');
    });
  } else {
    console.log('  None found');
    console.log('');
  }

  console.log('📦 DHGATE CAMPAIGNS:');
  console.log('');
  if (dhgateCampaigns.length > 0) {
    dhgateCampaigns.forEach(c => {
      const status = c.quality6Percent >= 50 ? '✅ GOOD' :
                     c.quality6Percent >= 30 ? '⚠️  FAIR' : '❌ POOR';
      console.log(`  Campaign ${c.campaignId}: ${status}`);
      console.log(`    Total: ${c.totalProducts.toLocaleString()} products`);
      console.log(`    USD: ${c.usdPercent}% | Fashion: ${c.fashionPercent}% | Non-Fashion Keywords: ${c.nonFashionPercent}%`);
      console.log(`    Quality 5+: ${c.quality5Percent}% | Quality 6+: ${c.quality6Percent}% | Avg Score: ${c.avgQualityScore}`);
      console.log('');
    });
  }

  if (errorCampaigns.length > 0) {
    console.log('❌ CAMPAIGNS WITH ERRORS:');
    console.log('');
    errorCampaigns.forEach(c => {
      console.log(`  Campaign ${c.campaignId}: ${c.error}`);
    });
    console.log('');
  }

  console.log('='.repeat(80));
  console.log('RECOMMENDATIONS');
  console.log('='.repeat(80));
  console.log('');

  // Best non-DHGate campaigns
  const excellent = nonDHGateCampaigns.filter(c => c.quality6Percent >= 60 && c.usdPercent >= 80);
  const good = nonDHGateCampaigns.filter(c => c.quality6Percent >= 40 && c.usdPercent >= 80);

  console.log('🎯 RECOMMENDED FOR SYNC (Premium Quality 6+):');
  console.log('');

  if (excellent.length > 0) {
    console.log('  TIER 1 - EXCELLENT (Quality 6+: 60%+):');
    excellent.forEach(c => {
      const expectedProducts = Math.round(c.totalProducts * (c.quality6Percent / 100));
      console.log(`    ${c.campaignId}: ~${expectedProducts.toLocaleString()} products expected (${c.quality6Percent}% pass rate)`);
    });
    console.log('');
  }

  if (good.length > 0) {
    console.log('  TIER 2 - GOOD (Quality 6+: 40-60%):');
    good.forEach(c => {
      const expectedProducts = Math.round(c.totalProducts * (c.quality6Percent / 100));
      console.log(`    ${c.campaignId}: ~${expectedProducts.toLocaleString()} products expected (${c.quality6Percent}% pass rate)`);
    });
    console.log('');
  }

  const goodDHGate = dhgateCampaigns.filter(c => c.quality6Percent >= 40 && c.usdPercent >= 80);
  if (goodDHGate.length > 0) {
    console.log('  TIER 3 - DHGATE (Quality 6+: 40%+):');
    goodDHGate.forEach(c => {
      const expectedProducts = Math.round(c.totalProducts * (c.quality6Percent / 100));
      console.log(`    ${c.campaignId}: ~${expectedProducts.toLocaleString()} products expected (${c.quality6Percent}% pass rate)`);
    });
    console.log('');
  }

  const totalExpected = [
    ...excellent,
    ...good,
    ...goodDHGate,
  ].reduce((sum, c) => sum + Math.round(c.totalProducts * (c.quality6Percent / 100)), 0);

  console.log(`📊 TOTAL EXPECTED WITH QUALITY 6+: ~${totalExpected.toLocaleString()} products`);
  console.log('');
  console.log('Done!');
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Analysis failed:', error);
    process.exit(1);
  });

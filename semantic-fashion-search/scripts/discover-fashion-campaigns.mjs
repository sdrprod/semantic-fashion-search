#!/usr/bin/env node

/**
 * Comprehensive campaign discovery for fashion products
 * Analyzes ALL available Impact campaigns to find high-quality fashion vendors
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });
dotenv.config({ path: join(__dirname, '..', '.env') });

const IMPACT_API_BASE = 'https://api.impact.com';

const credentials = {
  accountSid: process.env.IMPACT_ACCOUNT_SID,
  authToken: process.env.IMPACT_AUTH_TOKEN,
};

function createAuthHeader() {
  const encoded = Buffer.from(`${credentials.accountSid}:${credentials.authToken}`).toString('base64');
  return `Basic ${encoded}`;
}

// Fashion keywords for title/description matching
const FASHION_KEYWORDS = [
  'dress', 'shirt', 'pants', 'jeans', 'skirt', 'jacket', 'coat', 'sweater',
  'shoes', 'boots', 'heels', 'sandals', 'sneakers', 'bag', 'handbag', 'wallet',
  'jewelry', 'necklace', 'earrings', 'bracelet', 'ring', 'watch', 'scarf',
  'belt', 'hat', 'sunglasses', 'clothing', 'apparel', 'fashion', 'wear',
];

// Obvious non-fashion keywords
const NON_FASHION_KEYWORDS = [
  'phone case', 'iphone', 'charger', 'cable', 'kitchen knife', 'cookware',
  'furniture', 'toy car', 'action figure', 'power drill', 'tool kit',
  'pet food', 'dog food', 'picture frame', 'office supplies',
];

function isFashionProduct(name, description, category) {
  const text = `${name} ${description || ''} ${category || ''}`.toLowerCase();
  return FASHION_KEYWORDS.some(keyword => text.includes(keyword));
}

function hasNonFashionKeywords(name, description) {
  const text = `${name} ${description || ''}`.toLowerCase();
  return NON_FASHION_KEYWORDS.some(phrase => text.includes(phrase));
}

function assessProductQuality(product) {
  let score = 0;

  // Has valid description
  const hasValidDescription = product.Description &&
                               product.Description !== 'null' &&
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
  if (isFashionProduct(product.Name, product.Description, product.Category)) {
    score += 1;
  }

  return score;
}

async function analyzeCampaign(campaignId, advertiserName) {
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
        advertiserName,
        error: `HTTP ${response.status}`,
      };
    }

    const data = await response.json();
    const products = data.Items || [];
    const totalProducts = data.TotalCount || 0;

    if (products.length === 0) {
      return {
        campaignId,
        advertiserName,
        totalProducts: 0,
        error: 'No products',
      };
    }

    // Analyze sample
    const merchants = new Set();
    let usdCount = 0;
    let fashionCount = 0;
    let nonFashionCount = 0;
    let quality5Plus = 0;
    let quality6Plus = 0;
    const qualityScores = [];

    products.forEach(p => {
      merchants.add(p.Manufacturer || 'Unknown');

      if (p.Currency === 'USD') usdCount++;

      const isFashion = isFashionProduct(p.Name, p.Description, p.Category);
      if (isFashion) fashionCount++;

      const hasNonFashion = hasNonFashionKeywords(p.Name, p.Description || '');
      if (hasNonFashion) nonFashionCount++;

      const score = assessProductQuality(p);
      qualityScores.push(score);
      if (score >= 5) quality5Plus++;
      if (score >= 6) quality6Plus++;
    });

    const merchantList = Array.from(merchants);
    const isDHGate = merchantList.some(m => m.toLowerCase().includes('dhgate'));

    const usdPercent = Math.round((usdCount / products.length) * 100);
    const fashionPercent = Math.round((fashionCount / products.length) * 100);
    const nonFashionPercent = Math.round((nonFashionCount / products.length) * 100);
    const quality5Percent = Math.round((quality5Plus / products.length) * 100);
    const quality6Percent = Math.round((quality6Plus / products.length) * 100);
    const avgScore = (qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length).toFixed(1);

    return {
      campaignId,
      advertiserName,
      totalProducts,
      merchants: merchantList,
      isDHGate,
      usdPercent,
      fashionPercent,
      nonFashionPercent,
      quality5Percent,
      quality6Percent,
      avgQualityScore: parseFloat(avgScore),
      sampleSize: products.length,
    };

  } catch (error) {
    return {
      campaignId,
      advertiserName,
      error: error.message,
    };
  }
}

async function main() {
  console.log('='.repeat(80));
  console.log('FASHION CAMPAIGN DISCOVERY');
  console.log('='.repeat(80));
  console.log('');

  // List of all campaigns
  const campaigns = [
    { id: '11352', name: 'Bluehost' },
    { id: '11832', name: 'Underground Printing' },
    { id: '12108', name: 'Digitrading Hongkong Limited' },
    { id: '16384', name: 'EPP TIMES' },
    { id: '16860', name: 'HK Petrus International Trade Co., Limited' },
    { id: '17880', name: 'HK Petrus International Trade Co., Limited' },
    { id: '17059', name: 'Hong Kong Yuzhou Information Technology Co.,Limited' },
    { id: '17634', name: 'YouParcel' },
    { id: '18534', name: 'eBrands Global Oy' },
    { id: '18662', name: 'eBrands Global Oy' },
    { id: '24273', name: 'eBrands Global Oy' },
    { id: '24275', name: 'eBrands Global Oy' },
    { id: '32511', name: 'Flying Shark' },
    { id: '20350', name: 'Angelbliss' },
    { id: '22474', name: 'Bytedance Pte. Ltd.' },
    { id: '26892', name: "Xi'an Zuan Ge La Fu Network Technology Co., Ltd." },
    { id: '26893', name: "Xi'an Zuan Ge La Fu Network Technology Co., Ltd." },
    { id: '30483', name: 'PremiumStyle Co., Limited' },
    { id: '46576', name: 'Larosastyle Affiliate Program' },
    { id: '38125', name: 'Doba.Inc' },
    { id: '38260', name: 'Kaverta' },
    { id: '38928', name: 'kingbullbike' },
    { id: '46603', name: 'Fitory' },
    { id: '44202', name: '8000Kicks' },
    { id: '44724', name: 'Nobis Inc' },
    { id: '44973', name: 'Margovil' },
    { id: '46802', name: 'Hong Kong Lanjing Clothing Co., Limited' },
    { id: '47032', name: 'COMENII' },
  ];

  console.log(`Analyzing ${campaigns.length} campaigns...`);
  console.log('');

  const results = [];

  for (const campaign of campaigns) {
    process.stdout.write(`Analyzing ${campaign.id} (${campaign.name})... `);
    const result = await analyzeCampaign(campaign.id, campaign.name);
    results.push(result);

    if (result.error) {
      console.log(`❌ ${result.error}`);
    } else {
      console.log(`✅ ${result.totalProducts.toLocaleString()} products`);
    }

    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 800));
  }

  console.log('');
  console.log('='.repeat(80));
  console.log('FASHION CAMPAIGNS RANKED BY QUALITY');
  console.log('='.repeat(80));
  console.log('');

  // Filter for fashion campaigns (80%+ USD, 50%+ fashion, <20% non-fashion)
  const fashionCampaigns = results.filter(r =>
    !r.error &&
    r.totalProducts > 0 &&
    r.usdPercent >= 80 &&
    r.fashionPercent >= 50 &&
    r.nonFashionPercent < 20
  );

  // Separate non-DHGate and DHGate
  const nonDHGate = fashionCampaigns.filter(r => !r.isDHGate);
  const dhgate = fashionCampaigns.filter(r => r.isDHGate);

  // Sort by quality
  nonDHGate.sort((a, b) => b.quality6Percent - a.quality6Percent);
  dhgate.sort((a, b) => b.quality6Percent - a.quality6Percent);

  console.log('🏆 NON-DHGATE FASHION CAMPAIGNS (PREFERRED):');
  console.log('');
  if (nonDHGate.length > 0) {
    nonDHGate.forEach((c, i) => {
      const tier = c.quality6Percent >= 60 ? '⭐⭐⭐ EXCELLENT' :
                   c.quality6Percent >= 40 ? '⭐⭐ GOOD' :
                   c.quality6Percent >= 20 ? '⭐ FAIR' : 'POOR';
      const expectedYield = Math.round(c.totalProducts * (c.quality6Percent / 100));

      console.log(`${i + 1}. Campaign ${c.campaignId}: ${c.advertiserName}`);
      console.log(`   ${tier}`);
      console.log(`   Total Products: ${c.totalProducts.toLocaleString()}`);
      console.log(`   Top Merchants: ${c.merchants.slice(0, 3).join(', ')}`);
      console.log(`   USD: ${c.usdPercent}% | Fashion: ${c.fashionPercent}% | Quality 6+: ${c.quality6Percent}%`);
      console.log(`   Expected Yield: ~${expectedYield.toLocaleString()} quality products`);
      console.log('');
    });
  } else {
    console.log('   No high-quality non-DHGate fashion campaigns found.');
    console.log('');
  }

  if (dhgate.length > 0) {
    console.log('📦 DHGATE FASHION CAMPAIGNS:');
    console.log('');
    dhgate.forEach((c, i) => {
      const tier = c.quality6Percent >= 50 ? '⭐⭐ GOOD' :
                   c.quality6Percent >= 30 ? '⭐ FAIR' : 'POOR';
      const expectedYield = Math.round(c.totalProducts * (c.quality6Percent / 100));

      console.log(`${i + 1}. Campaign ${c.campaignId}`);
      console.log(`   ${tier}`);
      console.log(`   USD: ${c.usdPercent}% | Fashion: ${c.fashionPercent}% | Quality 6+: ${c.quality6Percent}%`);
      console.log(`   Expected Yield: ~${expectedYield.toLocaleString()} quality products`);
      console.log('');
    });
  }

  console.log('='.repeat(80));
  console.log('SUMMARY & RECOMMENDATIONS');
  console.log('='.repeat(80));
  console.log('');

  const excellent = nonDHGate.filter(c => c.quality6Percent >= 60);
  const good = nonDHGate.filter(c => c.quality6Percent >= 40 && c.quality6Percent < 60);

  if (excellent.length > 0) {
    console.log('🎯 TIER 1 - EXCELLENT (Quality 6+: 60%+):');
    excellent.forEach(c => {
      const expectedYield = Math.round(c.totalProducts * (c.quality6Percent / 100));
      console.log(`   ${c.campaignId} (${c.advertiserName}): ~${expectedYield.toLocaleString()} products`);
    });
    console.log('');
  }

  if (good.length > 0) {
    console.log('✅ TIER 2 - GOOD (Quality 6+: 40-60%):');
    good.forEach(c => {
      const expectedYield = Math.round(c.totalProducts * (c.quality6Percent / 100));
      console.log(`   ${c.campaignId} (${c.advertiserName}): ~${expectedYield.toLocaleString()} products`);
    });
    console.log('');
  }

  const totalExpected = [...excellent, ...good].reduce((sum, c) =>
    sum + Math.round(c.totalProducts * (c.quality6Percent / 100)), 0
  );

  console.log(`📊 TOTAL EXPECTED FROM NON-DHGATE: ~${totalExpected.toLocaleString()} quality products`);
  console.log('');

  if (excellent.length > 0 || good.length > 0) {
    console.log('💡 NEXT STEPS:');
    console.log('   1. Add recommended campaign IDs to your sync configuration');
    console.log('   2. Test with small batch first (100-500 products)');
    console.log('   3. Verify quality before scaling up');
    console.log('');
  } else {
    console.log('⚠️  No high-quality non-DHGate campaigns found.');
    console.log('   Continue using DHGate campaigns with quality filtering.');
    console.log('');
  }

  console.log('Done!');
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Discovery failed:', error);
    process.exit(1);
  });

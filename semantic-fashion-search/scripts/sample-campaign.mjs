#!/usr/bin/env node

/**
 * Sample products from a specific campaign
 * Usage: node scripts/sample-campaign.mjs <campaignId> [sampleSize]
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

const campaignId = process.argv[2];
const sampleSize = parseInt(process.argv[3]) || 50;

if (!campaignId) {
  console.error('Usage: node scripts/sample-campaign.mjs <campaignId> [sampleSize]');
  process.exit(1);
}

async function sampleCampaign() {
  console.log('='.repeat(80));
  console.log(`SAMPLING CAMPAIGN ${campaignId}`);
  console.log('='.repeat(80));
  console.log('');

  const url = `${IMPACT_API_BASE}/Mediapartners/${credentials.accountSid}/Catalogs/${campaignId}/Items?Page=1&PageSize=${sampleSize}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': createAuthHeader(),
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`Error: HTTP ${response.status}`);
      process.exit(1);
    }

    const data = await response.json();
    const products = data.Items || [];
    const totalProducts = data.TotalCount || 0;

    console.log(`Total products in campaign: ${totalProducts.toLocaleString()}`);
    console.log(`Sampling ${products.length} products:`);
    console.log('');

    // Analyze sample
    let usdCount = 0;
    let fashionCount = 0;
    let hasDescriptionCount = 0;
    let hasBrandCount = 0;
    const prices = [];
    const currencies = new Set();
    const merchants = new Set();

    const fashionKeywords = [
      'dress', 'shirt', 'pants', 'jeans', 'skirt', 'jacket', 'coat', 'sweater',
      'shoes', 'boots', 'heels', 'sandals', 'sneakers', 'bag', 'handbag', 'wallet',
      'jewelry', 'necklace', 'earrings', 'bracelet', 'ring', 'watch', 'scarf',
      'belt', 'hat', 'sunglasses', 'clothing', 'apparel', 'fashion', 'wear',
    ];

    products.forEach(p => {
      currencies.add(p.Currency);
      merchants.add(p.Manufacturer || 'Unknown');

      if (p.Currency === 'USD') usdCount++;
      if (p.Price) prices.push(p.Price);

      const text = `${p.Name} ${p.Description || ''} ${p.Category || ''}`.toLowerCase();
      const isFashion = fashionKeywords.some(kw => text.includes(kw));
      if (isFashion) fashionCount++;

      if (p.Description && p.Description !== 'null' && p.Description.trim()) hasDescriptionCount++;
      if (p.Manufacturer && p.Manufacturer !== 'Unknown' && p.Manufacturer.trim()) hasBrandCount++;
    });

    console.log('SUMMARY:');
    console.log(`  Currencies: ${Array.from(currencies).join(', ')}`);
    console.log(`  USD: ${usdCount}/${products.length} (${Math.round(usdCount/products.length*100)}%)`);
    console.log(`  Fashion keywords: ${fashionCount}/${products.length} (${Math.round(fashionCount/products.length*100)}%)`);
    console.log(`  Has description: ${hasDescriptionCount}/${products.length} (${Math.round(hasDescriptionCount/products.length*100)}%)`);
    console.log(`  Has brand: ${hasBrandCount}/${products.length} (${Math.round(hasBrandCount/products.length*100)}%)`);
    console.log(`  Merchants: ${Array.from(merchants).slice(0, 5).join(', ')}${merchants.size > 5 ? '...' : ''}`);

    if (prices.length > 0) {
      const avgPrice = (prices.reduce((a, b) => a + b, 0) / prices.length).toFixed(2);
      const minPrice = Math.min(...prices).toFixed(2);
      const maxPrice = Math.max(...prices).toFixed(2);
      console.log(`  Price range: $${minPrice} - $${maxPrice} (avg: $${avgPrice})`);
    }

    console.log('');
    console.log('SAMPLE PRODUCTS:');
    console.log('');

    products.slice(0, 50).forEach((p, i) => {
      const merchant = p.Manufacturer || 'Unknown';
      const price = p.Price ? `$${p.Price.toFixed(2)}` : 'N/A';
      const currency = p.Currency || 'N/A';

      console.log(`${i + 1}. [${merchant}] ${p.Name.slice(0, 70)}`);
      console.log(`   Price: ${price} ${currency} | Category: ${p.Category || 'N/A'}`);

      if (p.Description && p.Description !== 'null') {
        console.log(`   Desc: ${p.Description.slice(0, 100)}${p.Description.length > 100 ? '...' : ''}`);
      }
      console.log('');
    });

    console.log('='.repeat(80));
    console.log('ASSESSMENT');
    console.log('='.repeat(80));
    console.log('');

    const usdPercent = Math.round(usdCount/products.length*100);
    const fashionPercent = Math.round(fashionCount/products.length*100);

    if (usdPercent >= 80 && fashionPercent >= 50) {
      console.log('✅ GOOD CANDIDATE: High USD % and fashion %');
      console.log('   Recommended for sync with quality filtering (minQualityScore: 5-6)');
    } else if (usdPercent < 80) {
      console.log('⚠️  LOW USD %: Many products not in USD');
      console.log('   Will be filtered out during sync');
    } else if (fashionPercent < 50) {
      console.log('⚠️  LOW FASHION %: Many non-fashion products');
      console.log('   Quality filtering will reject most products');
    } else {
      console.log('⚠️  MIXED QUALITY: Some issues but might work with strict filtering');
    }

    console.log('');
    console.log('Done!');

  } catch (error) {
    console.error('Sample failed:', error.message);
    process.exit(1);
  }
}

sampleCampaign();

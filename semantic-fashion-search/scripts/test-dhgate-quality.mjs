import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const accountSid = process.env.IMPACT_ACCOUNT_SID;
const authToken = process.env.IMPACT_AUTH_TOKEN;
const authHeader = 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64');

// DHgate campaigns (the 6 highest-volume campaigns)
const dhgateCampaigns = [
  { id: '7183', name: 'DHgate 1' },
  { id: '7184', name: 'DHgate 2' },
  { id: '7186', name: 'DHgate 3' },
  { id: '7187', name: 'DHgate 4' },
  { id: '11923', name: 'DHgate 5' },
  { id: '16350', name: 'DHgate 6' },
];

// Fashion-related keywords to identify fashion products
const fashionKeywords = [
  // Clothing
  'dress', 'dresses', 'top', 'tops', 'blouse', 'shirt', 'pants', 'jeans',
  'skirt', 'shorts', 'jacket', 'coat', 'blazer', 'sweater', 'cardigan',
  'tshirt', 't-shirt', 'hoodie', 'sweatshirt', 'leggings', 'jumpsuit',
  // Footwear
  'shoes', 'heels', 'boots', 'sandals', 'sneakers', 'flats', 'pumps',
  'loafers', 'slippers', 'wedges', 'footwear',
  // Accessories
  'bag', 'handbag', 'purse', 'tote', 'clutch', 'backpack', 'wallet',
  'jewelry', 'necklace', 'earrings', 'bracelet', 'ring', 'watch',
  'scarf', 'belt', 'hat', 'cap', 'sunglasses', 'accessories',
  // General fashion
  'fashion', 'women', 'mens', 'clothing', 'apparel', 'wear', 'outfit',
  'style', 'boutique', 'designer', 'luxury',
];

function isFashionProduct(name, description, category) {
  const text = `${name} ${description} ${category}`.toLowerCase();
  return fashionKeywords.some(keyword => text.includes(keyword));
}

function assessQuality(item) {
  const scores = {
    hasDescription: 0,
    descriptionQuality: 0,
    hasPrice: 0,
    priceReasonable: 0,
    hasBrand: 0,
    isFashion: 0,
    total: 0,
  };

  // Check description
  const description = item.Description || '';
  if (description && description !== 'null' && description.trim() !== '') {
    scores.hasDescription = 1;

    // Quality based on length (good descriptions are detailed)
    if (description.length > 50) scores.descriptionQuality = 1;
    if (description.length > 150) scores.descriptionQuality = 2;
  }

  // Check price
  const currentPrice = item.CurrentPrice || item.Price || '0';
  const price = parseFloat(currentPrice);
  if (price > 0) {
    scores.hasPrice = 1;

    // Reasonable price range for fashion ($5-$500)
    if (price >= 5 && price <= 500) {
      scores.priceReasonable = 1;
    }
  }

  // Check brand
  const brand = item.Manufacturer || '';
  if (brand && brand !== 'Unknown' && brand.trim() !== '') {
    scores.hasBrand = 1;
  }

  // Check if fashion product
  const name = item.Name || '';
  const category = item.Category || '';
  if (isFashionProduct(name, description, category)) {
    scores.isFashion = 1;
  }

  // Calculate total quality score (0-7 points)
  scores.total = scores.hasDescription + scores.descriptionQuality +
                 scores.hasPrice + scores.priceReasonable +
                 scores.hasBrand + scores.isFashion;

  return scores;
}

console.log('\n🎯 Testing DHgate product quality for fashion items...\n');

let totalProducts = 0;
const qualityBuckets = {
  total: 0,
  hasBasicData: 0,        // USD + URL + title + image
  hasDescription: 0,       // + description
  isFashion: 0,           // + fashion keywords
  mediumQuality: 0,       // quality score >= 4
  highQuality: 0,         // quality score >= 5
  premiumQuality: 0,      // quality score >= 6
};

const exampleProducts = {
  low: null,
  medium: null,
  high: null,
  premium: null,
};

for (const campaign of dhgateCampaigns) {
  try {
    // Fetch 100 products from each campaign
    const url = `https://api.impact.com/Mediapartners/${accountSid}/Catalogs/${campaign.id}/Items?PageSize=100`;

    const response = await fetch(url, {
      headers: {
        'Authorization': authHeader,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.log(`${campaign.name}: ❌ API Error (${response.status})`);
      continue;
    }

    const data = await response.json();
    const items = data.Items || [];

    let campaignStats = {
      basic: 0,
      hasDesc: 0,
      fashion: 0,
      medium: 0,
      high: 0,
      premium: 0,
    };

    for (const item of items) {
      qualityBuckets.total++;
      totalProducts++;

      // Check basic required data
      const currency = item.Currency || '';
      const hasUrl = (item.Url || item.TrackingUrl || item.OriginalUrl || '').trim() !== '';
      const hasTitle = (item.Name || '').trim() !== '';
      const hasImage = (item.ImageUrl || '').trim() !== '';

      if (currency === 'USD' && hasUrl && hasTitle && hasImage) {
        qualityBuckets.hasBasicData++;
        campaignStats.basic++;

        // Check description
        const description = item.Description || '';
        const hasValidDesc = description && description !== 'null' && description.trim() !== '';

        if (hasValidDesc) {
          qualityBuckets.hasDescription++;
          campaignStats.hasDesc++;
        }

        // Assess full quality
        const quality = assessQuality(item);

        if (quality.isFashion) {
          qualityBuckets.isFashion++;
          campaignStats.fashion++;
        }

        if (quality.total >= 4) {
          qualityBuckets.mediumQuality++;
          campaignStats.medium++;
          if (!exampleProducts.medium) exampleProducts.medium = item;
        }

        if (quality.total >= 5) {
          qualityBuckets.highQuality++;
          campaignStats.high++;
          if (!exampleProducts.high) exampleProducts.high = item;
        }

        if (quality.total >= 6) {
          qualityBuckets.premiumQuality++;
          campaignStats.premium++;
          if (!exampleProducts.premium) exampleProducts.premium = item;
        }

        // Capture low quality example
        if (!exampleProducts.low && quality.total <= 2) {
          exampleProducts.low = item;
        }
      }
    }

    console.log(`${campaign.name} (${campaign.id}):`);
    console.log(`  Sample: ${items.length} products`);
    console.log(`  Basic valid: ${campaignStats.basic} (${((campaignStats.basic / items.length) * 100).toFixed(1)}%)`);
    console.log(`  Has description: ${campaignStats.hasDesc} (${((campaignStats.hasDesc / items.length) * 100).toFixed(1)}%)`);
    console.log(`  Fashion items: ${campaignStats.fashion} (${((campaignStats.fashion / items.length) * 100).toFixed(1)}%)`);
    console.log(`  Medium quality (score≥4): ${campaignStats.medium} (${((campaignStats.medium / items.length) * 100).toFixed(1)}%)`);
    console.log(`  High quality (score≥5): ${campaignStats.high} (${((campaignStats.high / items.length) * 100).toFixed(1)}%)`);
    console.log(`  Premium (score≥6): ${campaignStats.premium} (${((campaignStats.premium / items.length) * 100).toFixed(1)}%)`);
    console.log('');

    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 200));

  } catch (err) {
    console.log(`${campaign.name}: ❌ Error - ${err.message}`);
  }
}

console.log('═'.repeat(70));
console.log('OVERALL QUALITY DISTRIBUTION:');
console.log(`  Total sampled: ${totalProducts} products`);
console.log(`  Basic valid data: ${qualityBuckets.hasBasicData} (${((qualityBuckets.hasBasicData / totalProducts) * 100).toFixed(1)}%)`);
console.log(`  Has description: ${qualityBuckets.hasDescription} (${((qualityBuckets.hasDescription / totalProducts) * 100).toFixed(1)}%)`);
console.log(`  Fashion items: ${qualityBuckets.isFashion} (${((qualityBuckets.isFashion / totalProducts) * 100).toFixed(1)}%)`);
console.log(`  Medium quality: ${qualityBuckets.mediumQuality} (${((qualityBuckets.mediumQuality / totalProducts) * 100).toFixed(1)}%)`);
console.log(`  High quality: ${qualityBuckets.highQuality} (${((qualityBuckets.highQuality / totalProducts) * 100).toFixed(1)}%)`);
console.log(`  Premium quality: ${qualityBuckets.premiumQuality} (${((qualityBuckets.premiumQuality / totalProducts) * 100).toFixed(1)}%)`);
console.log('═'.repeat(70));

// Calculate projections
const totalDHgateInventory = 395752;

console.log('\nPROJECTIONS FROM 395,752 DHGATE PRODUCTS:');
console.log(`  Basic valid: ~${Math.round(totalDHgateInventory * (qualityBuckets.hasBasicData / totalProducts)).toLocaleString()}`);
console.log(`  Has description: ~${Math.round(totalDHgateInventory * (qualityBuckets.hasDescription / totalProducts)).toLocaleString()}`);
console.log(`  Fashion items: ~${Math.round(totalDHgateInventory * (qualityBuckets.isFashion / totalProducts)).toLocaleString()}`);
console.log(`  Medium quality: ~${Math.round(totalDHgateInventory * (qualityBuckets.mediumQuality / totalProducts)).toLocaleString()}`);
console.log(`  High quality: ~${Math.round(totalDHgateInventory * (qualityBuckets.highQuality / totalProducts)).toLocaleString()}`);
console.log(`  Premium quality: ~${Math.round(totalDHgateInventory * (qualityBuckets.premiumQuality / totalProducts)).toLocaleString()}`);

console.log('\n' + '═'.repeat(70));
console.log('QUALITY THRESHOLDS:');
console.log('  Medium (score≥4): USD + description + price + (fashion OR brand)');
console.log('  High (score≥5): Above + good description (50+ chars) OR reasonable price');
console.log('  Premium (score≥6): Above + detailed description (150+ chars) + brand');
console.log('═'.repeat(70));

// Show examples
console.log('\nEXAMPLE PRODUCTS:\n');

if (exampleProducts.low) {
  const item = exampleProducts.low;
  console.log('LOW QUALITY (score ≤2):');
  console.log(`  Name: ${item.Name}`);
  console.log(`  Description: ${item.Description || 'NONE'}`);
  console.log(`  Price: ${item.CurrentPrice || 'NONE'} ${item.Currency || ''}`);
  console.log(`  Brand: ${item.Manufacturer || 'NONE'}`);
  console.log('');
}

if (exampleProducts.medium) {
  const item = exampleProducts.medium;
  console.log('MEDIUM QUALITY (score 4):');
  console.log(`  Name: ${item.Name}`);
  console.log(`  Description: ${(item.Description || '').substring(0, 80)}...`);
  console.log(`  Price: ${item.CurrentPrice || 'NONE'} ${item.Currency || ''}`);
  console.log(`  Brand: ${item.Manufacturer || 'NONE'}`);
  console.log('');
}

if (exampleProducts.high) {
  const item = exampleProducts.high;
  console.log('HIGH QUALITY (score 5):');
  console.log(`  Name: ${item.Name}`);
  console.log(`  Description: ${(item.Description || '').substring(0, 100)}...`);
  console.log(`  Price: ${item.CurrentPrice || 'NONE'} ${item.Currency || ''}`);
  console.log(`  Brand: ${item.Manufacturer || 'NONE'}`);
  console.log('');
}

if (exampleProducts.premium) {
  const item = exampleProducts.premium;
  console.log('PREMIUM QUALITY (score ≥6):');
  console.log(`  Name: ${item.Name}`);
  console.log(`  Description: ${(item.Description || '').substring(0, 120)}...`);
  console.log(`  Price: ${item.CurrentPrice || 'NONE'} ${item.Currency || ''}`);
  console.log(`  Brand: ${item.Manufacturer || 'NONE'}`);
  console.log('');
}

console.log('═'.repeat(70));
console.log('RECOMMENDATIONS:');

const projectedHigh = Math.round(totalDHgateInventory * (qualityBuckets.highQuality / totalProducts));
const projectedMedium = Math.round(totalDHgateInventory * (qualityBuckets.mediumQuality / totalProducts));

if (projectedHigh > 10000) {
  console.log('  🎯 RECOMMENDED: Sync HIGH quality products only (score ≥5)');
  console.log(`     Estimated: ~${projectedHigh.toLocaleString()} products`);
  console.log('     Rationale: Best user experience, sufficient inventory');
} else if (projectedMedium > 5000) {
  console.log('  🎯 RECOMMENDED: Sync MEDIUM quality products (score ≥4)');
  console.log(`     Estimated: ~${projectedMedium.toLocaleString()} products`);
  console.log('     Rationale: Good balance of quality and quantity');
} else {
  console.log('  ⚠️  WARNING: DHgate may not have enough quality fashion products');
  console.log('     Consider syncing all available and filtering by description only');
}

console.log('');

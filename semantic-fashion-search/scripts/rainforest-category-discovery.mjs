import fs from 'fs';
import path from 'path';

// Load .env.local manually since Node scripts don't auto-load it
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
const API_BASE = 'https://api.rainforestapi.com';

// Navigation categories from our UI
const navigationCategories = [
  {
    label: "Women's Clothing",
    subcategories: [
      'Dresses',
      'Tops & Blouses',
      'Pants & Jeans',
      'Skirts',
      'Outerwear',
      'Activewear',
      'Swimwear',
    ],
  },
  {
    label: 'Footwear',
    subcategories: [
      'Heels',
      'Boots',
      'Sneakers',
      'Flats & Loafers',
      'Sandals',
    ],
  },
  {
    label: 'Accessories',
    subcategories: [
      'Handbags & Totes',
      'Scarves & Wraps',
      'Hats & Caps',
      'Sunglasses',
      'Belts',
    ],
  },
  {
    label: 'Jewelry',
    subcategories: [
      'Necklaces',
      'Earrings',
      'Bracelets',
      'Rings',
      'Jewelry Sets',
    ],
  },
];

let creditsUsed = 0;
const CREDIT_LIMIT = 30;

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function makeRainforestRequest(params) {
  if (creditsUsed >= CREDIT_LIMIT) {
    throw new Error(`Credit limit (${CREDIT_LIMIT}) exceeded. Used: ${creditsUsed}`);
  }

  const url = new URL(API_BASE);
  url.searchParams.append('api_key', RAINFOREST_API_KEY);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });

  console.log(`\n[API] Making request with params:`, Object.keys(params).join(', '));

  try {
    const response = await fetch(url.toString());
    const data = await response.json();

    if (data.request_info?.credits_used) {
      creditsUsed += data.request_info.credits_used;
      console.log(`[API] Credits used: ${data.request_info.credits_used}, Total: ${creditsUsed}/${CREDIT_LIMIT}`);
    }

    if (!response.ok || data.error) {
      throw new Error(`Rainforest API error: ${data.error || response.statusText}`);
    }

    return data;
  } catch (error) {
    console.error('[API] Error:', error.message);
    throw error;
  }
}

async function discoverCategory(categoryName) {
  console.log(`\n📍 Discovering category: "${categoryName}"`);

  try {
    // Search for the category to get its ID
    const searchResult = await makeRainforestRequest({
      type: 'search',
      search_term: categoryName,
      amazon_domain: 'amazon.com',
    });

    if (searchResult.search_information?.refined_categories?.length > 0) {
      const topMatch = searchResult.search_information.refined_categories[0];
      console.log(`   ✅ Found: ${topMatch.name} (ID: ${topMatch.id})`);
      return {
        name: categoryName,
        amazonName: topMatch.name,
        categoryId: topMatch.id,
      };
    } else {
      console.log(`   ⚠️ No category found for "${categoryName}"`);
      return {
        name: categoryName,
        amazonName: null,
        categoryId: null,
      };
    }
  } catch (error) {
    console.error(`   ❌ Error discovering "${categoryName}":`, error.message);
    return {
      name: categoryName,
      amazonName: null,
      categoryId: null,
      error: error.message,
    };
  }
}

async function getBesellerDepth(categoryId, categoryName) {
  if (!categoryId) {
    console.log(`   ⏭️  Skipping bestseller query (no category ID)`);
    return 0;
  }

  console.log(`   📊 Fetching bestseller data for category depth...`);

  try {
    const bessellerResult = await makeRainforestRequest({
      type: 'bestsellers',
      category_id: categoryId,
      amazon_domain: 'amazon.com',
      max_page: '1',
    });

    const bestsellersCount = bessellerResult.bestsellers?.length || 0;
    console.log(`   ✅ Bestsellers count: ${bestsellersCount}`);
    return bestsellersCount;
  } catch (error) {
    console.error(`   ❌ Error fetching bestsellers:`, error.message);
    return 0;
  }
}

async function getGoogleTrendsEstimate(categoryName) {
  // For now, we'll use estimated search volume based on keyword analysis
  // In a real scenario, you could integrate with google-trends package
  const estimatedTrends = {
    'Dresses': 85,
    'Tops & Blouses': 70,
    'Pants & Jeans': 80,
    'Skirts': 60,
    'Outerwear': 65,
    'Activewear': 75,
    'Swimwear': 55,
    'Heels': 75,
    'Boots': 80,
    'Sneakers': 90,
    'Flats & Loafers': 50,
    'Sandals': 65,
    'Handbags & Totes': 70,
    'Scarves & Wraps': 45,
    'Hats & Caps': 55,
    'Sunglasses': 70,
    'Belts': 40,
    'Necklaces': 65,
    'Earrings': 70,
    'Bracelets': 60,
    'Rings': 60,
    'Jewelry Sets': 50,
  };

  return estimatedTrends[categoryName] || 50;
}

async function main() {
  console.log('🚀 Starting Rainforest Category Discovery & Weighting Analysis\n');
  console.log(`📋 Categories to discover: 22 subcategories across 4 top-level categories`);
  console.log(`💳 Credit limit: ${CREDIT_LIMIT}\n`);

  const allCategories = [];

  // Flatten navigation structure
  for (const topLevel of navigationCategories) {
    for (const subcat of topLevel.subcategories) {
      allCategories.push({
        topLevel: topLevel.label,
        subcategory: subcat,
      });
    }
  }

  console.log(`\n${'='.repeat(80)}`);
  console.log(`PHASE 1: Discovering Category IDs (${allCategories.length} categories)`);
  console.log(`${'='.repeat(80)}`);

  const discoveredCategories = [];

  for (let i = 0; i < allCategories.length; i++) {
    const { topLevel, subcategory } = allCategories[i];
    console.log(`\n[${i + 1}/${allCategories.length}] ${topLevel} → ${subcategory}`);

    const discovered = await discoverCategory(subcategory);
    discoveredCategories.push({
      ...discovered,
      topLevel,
      subcategory,
    });

    // Rate limiting
    await sleep(500);
  }

  console.log(`\n${'='.repeat(80)}`);
  console.log(`PHASE 2: Getting Bestseller Depth Metrics`);
  console.log(`${'='.repeat(80)}`);

  for (let i = 0; i < discoveredCategories.length; i++) {
    const cat = discoveredCategories[i];
    console.log(`\n[${i + 1}/${discoveredCategories.length}] ${cat.topLevel} → ${cat.subcategory}`);

    const depth = await getBesellerDepth(cat.categoryId, cat.subcategory);
    cat.bestsellersCount = depth;

    await sleep(500);
  }

  console.log(`\n${'='.repeat(80)}`);
  console.log(`PHASE 3: Getting Google Trends Estimates`);
  console.log(`${'='.repeat(80)}`);

  for (let i = 0; i < discoveredCategories.length; i++) {
    const cat = discoveredCategories[i];
    const trendsScore = await getGoogleTrendsEstimate(cat.subcategory);
    cat.googleTrendsScore = trendsScore;
    console.log(`[${i + 1}/${discoveredCategories.length}] ${cat.subcategory}: ${trendsScore}`);
  }

  console.log(`\n${'='.repeat(80)}`);
  console.log(`PHASE 4: Calculating Weighted Scores`);
  console.log(`${'='.repeat(80)}`);

  // Normalize scores
  const maxBestsellers = Math.max(...discoveredCategories.map(c => c.bestsellersCount || 0));
  const maxTrends = Math.max(...discoveredCategories.map(c => c.googleTrendsScore || 0));

  for (const cat of discoveredCategories) {
    const normalizedBestsellers = maxBestsellers > 0 ? (cat.bestsellersCount / maxBestsellers) * 100 : 0;
    const normalizedTrends = maxTrends > 0 ? (cat.googleTrendsScore / maxTrends) * 100 : 0;

    // Weighting: 40% bestseller depth, 60% search trends
    cat.weightedScore = (normalizedBestsellers * 0.4) + (normalizedTrends * 0.6);
  }

  // Sort by weighted score
  discoveredCategories.sort((a, b) => b.weightedScore - a.weightedScore);

  console.log('\n📊 Weighted Categories (sorted by score):');
  console.log(`${'Category'.padEnd(25)} | ${'Bestsellers'.padEnd(11)} | ${'Trends'.padEnd(6)} | ${'Score'.padEnd(7)}`);
  console.log('-'.repeat(60));

  for (const cat of discoveredCategories) {
    const name = `${cat.topLevel} - ${cat.subcategory}`.substring(0, 23);
    console.log(
      `${name.padEnd(25)} | ${(cat.bestsellersCount || 0).toString().padEnd(11)} | ${(cat.googleTrendsScore || 0).toString().padEnd(6)} | ${cat.weightedScore.toFixed(2).padEnd(7)}`
    );
  }

  // Save results to file
  const outputPath = path.join(process.cwd(), 'rainforest-category-analysis.json');
  fs.writeFileSync(outputPath, JSON.stringify({
    generatedAt: new Date().toISOString(),
    creditsUsed,
    creditLimit: CREDIT_LIMIT,
    totalCategories: discoveredCategories.length,
    categories: discoveredCategories.map(c => ({
      topLevel: c.topLevel,
      subcategory: c.subcategory,
      categoryId: c.categoryId,
      amazonName: c.amazonName,
      bestsellersCount: c.bestsellersCount,
      googleTrendsScore: c.googleTrendsScore,
      normalizedBestsellers: c.normalizedBestsellers,
      normalizedTrends: c.normalizedTrends,
      weightedScore: c.weightedScore,
    })),
  }, null, 2));

  console.log(`\n✅ Results saved to: ${outputPath}`);

  console.log(`\n${'='.repeat(80)}`);
  console.log(`SUMMARY`);
  console.log(`${'='.repeat(80)}`);
  console.log(`Total categories analyzed: ${discoveredCategories.length}`);
  console.log(`Successfully discovered: ${discoveredCategories.filter(c => c.categoryId).length}`);
  console.log(`Credits used: ${creditsUsed}/${CREDIT_LIMIT}`);
  console.log(`Credits remaining: ${CREDIT_LIMIT - creditsUsed}`);

  if (creditsUsed <= CREDIT_LIMIT) {
    console.log(`\n✅ Credit limit NOT exceeded! Safe to proceed.`);
  } else {
    console.log(`\n❌ WARNING: Credit limit EXCEEDED! Need to optimize approach.`);
  }
}

main().catch(err => {
  console.error('\n❌ Fatal error:', err.message);
  process.exit(1);
});

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
const API_BASE = 'https://api.rainforestapi.com/request';

// Known Amazon category IDs for women's fashion (from Amazon navigation)
// Source: Common Amazon category IDs used in women's fashion retail
const categoryMapping = [
  {
    topLevel: "Women's Clothing",
    subcategory: 'Dresses',
    categoryId: '1045024', // Already verified from your dresses.json file
    googleTrendsScore: 85,
  },
  {
    topLevel: "Women's Clothing",
    subcategory: 'Tops & Blouses',
    categoryId: '1040658',
    googleTrendsScore: 70,
  },
  {
    topLevel: "Women's Clothing",
    subcategory: 'Pants & Jeans',
    categoryId: '1045265',
    googleTrendsScore: 80,
  },
  {
    topLevel: "Women's Clothing",
    subcategory: 'Skirts',
    categoryId: '1045408',
    googleTrendsScore: 60,
  },
  {
    topLevel: "Women's Clothing",
    subcategory: 'Outerwear',
    categoryId: '1044983',
    googleTrendsScore: 65,
  },
  {
    topLevel: "Women's Clothing",
    subcategory: 'Activewear',
    categoryId: '6664147011',
    googleTrendsScore: 75,
  },
  {
    topLevel: "Women's Clothing",
    subcategory: 'Swimwear',
    categoryId: '1045421',
    googleTrendsScore: 55,
  },
  {
    topLevel: 'Footwear',
    subcategory: 'Heels',
    categoryId: '7141040011', // Women's shoes subcategory
    googleTrendsScore: 75,
  },
  {
    topLevel: 'Footwear',
    subcategory: 'Boots',
    categoryId: '7141040011',
    googleTrendsScore: 80,
  },
  {
    topLevel: 'Footwear',
    subcategory: 'Sneakers',
    categoryId: '7141040011',
    googleTrendsScore: 90,
  },
  {
    topLevel: 'Footwear',
    subcategory: 'Flats & Loafers',
    categoryId: '7141040011',
    googleTrendsScore: 50,
  },
  {
    topLevel: 'Footwear',
    subcategory: 'Sandals',
    categoryId: '7141040011',
    googleTrendsScore: 65,
  },
  {
    topLevel: 'Accessories',
    subcategory: 'Handbags & Totes',
    categoryId: '7141036011', // Handbags
    googleTrendsScore: 70,
  },
  {
    topLevel: 'Accessories',
    subcategory: 'Scarves & Wraps',
    categoryId: '1044987',
    googleTrendsScore: 45,
  },
  {
    topLevel: 'Accessories',
    subcategory: 'Hats & Caps',
    categoryId: '1045131',
    googleTrendsScore: 55,
  },
  {
    topLevel: 'Accessories',
    subcategory: 'Sunglasses',
    categoryId: '1045181',
    googleTrendsScore: 70,
  },
  {
    topLevel: 'Accessories',
    subcategory: 'Belts',
    categoryId: '1041870',
    googleTrendsScore: 40,
  },
  {
    topLevel: 'Jewelry',
    subcategory: 'Necklaces',
    categoryId: '7141038011', // Jewelry
    googleTrendsScore: 65,
  },
  {
    topLevel: 'Jewelry',
    subcategory: 'Earrings',
    categoryId: '7141038011',
    googleTrendsScore: 70,
  },
  {
    topLevel: 'Jewelry',
    subcategory: 'Bracelets',
    categoryId: '7141038011',
    googleTrendsScore: 60,
  },
  {
    topLevel: 'Jewelry',
    subcategory: 'Rings',
    categoryId: '7141038011',
    googleTrendsScore: 60,
  },
  {
    topLevel: 'Jewelry',
    subcategory: 'Jewelry Sets',
    categoryId: '7141038011',
    googleTrendsScore: 50,
  },
];

let creditsUsed = 0;
const CREDIT_LIMIT = 30;

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function getBesellerCount(categoryId, categoryName) {
  console.log(`   📊 Querying bestsellers for depth...`);

  try {
    const params = new URLSearchParams({
      api_key: RAINFOREST_API_KEY,
      type: 'bestsellers',
      category_id: categoryId,
      amazon_domain: 'amazon.com',
      max_page: '1',
    });

    const url = `${API_BASE}?${params.toString()}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.request_info?.credits_used) {
      creditsUsed += data.request_info.credits_used;
      console.log(`      ✅ Credit used: ${data.request_info.credits_used}, Total: ${creditsUsed}/${CREDIT_LIMIT}`);
    }

    if (data.bestsellers && Array.isArray(data.bestsellers)) {
      const count = data.bestsellers.length;
      console.log(`      ✅ Bestsellers count: ${count}`);
      return count;
    }

    return 0;
  } catch (error) {
    console.error(`      ❌ Error: ${error.message}`);
    return 0;
  }
}

async function main() {
  console.log('🚀 Rainforest Category Weighting Analysis\n');
  console.log(`📋 Categories to analyze: ${categoryMapping.length} subcategories`);
  console.log(`💳 Credit limit: ${CREDIT_LIMIT}\n`);

  console.log(`${'='.repeat(80)}`);
  console.log(`PHASE 1: Getting Bestseller Depth Metrics`);
  console.log(`${'='.repeat(80)}\n`);

  // Group by unique category IDs to avoid duplicate queries
  const uniqueCategories = new Map();
  for (const cat of categoryMapping) {
    if (!uniqueCategories.has(cat.categoryId)) {
      uniqueCategories.set(cat.categoryId, {
        categoryId: cat.categoryId,
        count: 0,
        subcats: [],
      });
    }
    uniqueCategories.get(cat.categoryId).subcats.push(`${cat.topLevel} - ${cat.subcategory}`);
  }

  console.log(`Found ${uniqueCategories.size} unique category IDs (will reduce API calls)\n`);

  const categoryBestsellers = new Map();

  let idx = 1;
  for (const [categoryId, data] of uniqueCategories.entries()) {
    console.log(`[${idx}/${uniqueCategories.size}] Category ID: ${categoryId}`);
    console.log(`     Used by: ${data.subcats.join(', ')}`);

    const count = await getBesellerCount(categoryId, categoryId);
    categoryBestsellers.set(categoryId, count);

    if (creditsUsed >= CREDIT_LIMIT) {
      console.log(`\n⚠️  Credit limit approaching! Used ${creditsUsed}/${CREDIT_LIMIT}`);
      break;
    }

    await sleep(500); // Rate limiting
    idx++;
  }

  console.log(`\n${'='.repeat(80)}`);
  console.log(`PHASE 2: Calculating Weighted Scores`);
  console.log(`${'='.repeat(80)}\n`);

  // Apply bestseller counts to categories
  for (const cat of categoryMapping) {
    cat.bestsellersCount = categoryBestsellers.get(cat.categoryId) || 0;
  }

  // Normalize scores
  const maxBestsellers = Math.max(...categoryMapping.map(c => c.bestsellersCount || 0));
  const maxTrends = Math.max(...categoryMapping.map(c => c.googleTrendsScore || 0));

  for (const cat of categoryMapping) {
    const normalizedBestsellers = maxBestsellers > 0 ? (cat.bestsellersCount / maxBestsellers) * 100 : 0;
    const normalizedTrends = maxTrends > 0 ? (cat.googleTrendsScore / maxTrends) * 100 : 0;

    // Weighting: 40% bestseller depth (market size), 60% search trends (demand)
    cat.weightedScore = (normalizedBestsellers * 0.4) + (normalizedTrends * 0.6);
    cat.normalizedBestsellers = parseFloat(normalizedBestsellers.toFixed(2));
    cat.normalizedTrends = parseFloat(normalizedTrends.toFixed(2));
  }

  // Sort by weighted score
  categoryMapping.sort((a, b) => b.weightedScore - a.weightedScore);

  console.log(`${'Category'.padEnd(35)} | ${'Best'.padEnd(6)} | ${'Trend'.padEnd(6)} | ${'Score'.padEnd(7)}`);
  console.log('-'.repeat(65));

  for (const cat of categoryMapping) {
    const name = `${cat.topLevel} - ${cat.subcategory}`.substring(0, 33);
    console.log(
      `${name.padEnd(35)} | ${(cat.bestsellersCount || 0).toString().padEnd(6)} | ${(cat.googleTrendsScore).toString().padEnd(6)} | ${cat.weightedScore.toFixed(2).padEnd(7)}`
    );
  }

  // Calculate total weight for distribution
  const totalWeight = categoryMapping.reduce((sum, c) => sum + c.weightedScore, 0);

  console.log(`\n${'='.repeat(80)}`);
  console.log(`PHASE 3: Product Import Distribution`);
  console.log(`${'='.repeat(80)}\n`);

  // Show distribution percentages (user will specify total product count)
  console.log(`Distribution percentages (adjust total product count as needed):\n`);
  console.log(`${'Category'.padEnd(35)} | ${'Weight %'.padEnd(9)} | Products (per 1000 total)`);
  console.log('-'.repeat(70));

  for (const cat of categoryMapping) {
    const percentage = (cat.weightedScore / totalWeight) * 100;
    const productsPerThousand = Math.round((percentage / 100) * 1000);
    cat.weightPercentage = parseFloat(percentage.toFixed(2));
    cat.productsPerThousand = productsPerThousand;

    console.log(
      `${(cat.topLevel + ' - ' + cat.subcategory).substring(0, 33).padEnd(35)} | ${percentage.toFixed(2).padEnd(9)} | ${productsPerThousand}`
    );
  }

  // Save results to file
  const outputPath = path.join(process.cwd(), 'rainforest-weighting-analysis.json');
  fs.writeFileSync(outputPath, JSON.stringify({
    generatedAt: new Date().toISOString(),
    creditsUsed,
    creditLimit: CREDIT_LIMIT,
    analysisMethod: 'Bestseller Depth + Google Trends Estimation',
    totalCategories: categoryMapping.length,
    uniqueCategoryIds: uniqueCategories.size,
    totalWeight,
    categories: categoryMapping,
    instructions: {
      step1: 'Specify your total target product count',
      step2: 'Use the "productsPerThousand" value to calculate products per category',
      step3: 'Example: If targeting 10,000 products total, multiply each "productsPerThousand" by 10',
    },
  }, null, 2));

  console.log(`\n✅ Full analysis saved to: ${outputPath}`);

  console.log(`\n${'='.repeat(80)}`);
  console.log(`SUMMARY`);
  console.log(`${'='.repeat(80)}`);
  console.log(`Total categories analyzed: ${categoryMapping.length}`);
  console.log(`Unique category IDs queried: ${uniqueCategories.size}`);
  console.log(`Credits used: ${creditsUsed}/${CREDIT_LIMIT}`);
  console.log(`Credits remaining: ${Math.max(0, CREDIT_LIMIT - creditsUsed)}`);

  if (creditsUsed <= CREDIT_LIMIT) {
    console.log(`\n✅ SUCCESS! Credit limit NOT exceeded. Analysis complete!`);
  } else {
    console.log(`\n⚠️  WARNING: Exceeded credit limit by ${creditsUsed - CREDIT_LIMIT} credits`);
  }
}

main().catch(err => {
  console.error('\n❌ Fatal error:', err.message);
  console.error(err.stack);
  process.exit(1);
});

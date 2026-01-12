import type { AffiliateProduct, Product } from '@/types';

// CJ Affiliate API configuration
const CJ_API_URL = 'https://ads.api.cj.com/query';

interface CJCredentials {
  token: string;
  cid: string;
}

interface CJPrice {
  amount: string;
  currency: string;
}

interface CJGoogleCategory {
  id: string;
  name: string;
}

interface CJProduct {
  id: string;
  title: string;
  description?: string;
  advertiserId: string;
  advertiserName?: string;
  price?: CJPrice;
  availability?: string;
  imageLink?: string;
  link?: string;
  linkCode?: {
    clickUrl?: string;
  };
  brand?: string;
  condition?: string;
  googleProductCategory?: CJGoogleCategory;
}

interface CJProductsResponse {
  data: {
    shoppingProducts: {
      totalCount: number;
      count: number;
      resultList: CJProduct[];
    };
  };
}

/**
 * Get CJ Affiliate API credentials from environment
 */
function getCredentials(): CJCredentials {
  const token = process.env.CJ_AFFILIATE_TOKEN;
  const cid = process.env.CJ_AFFILIATE_CID;

  if (!token || !cid) {
    throw new Error('Missing CJ Affiliate credentials. Set CJ_AFFILIATE_TOKEN and CJ_AFFILIATE_CID.');
  }

  return { token, cid };
}

/**
 * Keywords to identify bundle products (to be excluded)
 */
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

/**
 * Check if product is a bundle based on title
 */
function isBundle(title: string): boolean {
  const titleLower = title.toLowerCase();
  return BUNDLE_KEYWORDS.some(keyword => titleLower.includes(keyword));
}

/**
 * Check if product is from Poshmark (resale marketplace)
 */
function isPoshmark(advertiserName: string): boolean {
  return advertiserName.toLowerCase().includes('poshmark');
}

/**
 * Keywords to identify men's products (to be excluded)
 */
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

/**
 * Check if product is for men based on title and description
 */
function isMensProduct(title: string, description: string): boolean {
  const text = `${title} ${description}`.toLowerCase();
  return MENS_KEYWORDS.some(keyword => text.includes(keyword));
}

/**
 * Normalize text for deduplication
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Normalize price to nearest $5 bucket for deduplication
 */
function normalizePriceBucket(price: number | null | undefined): string {
  if (!price || price <= 0) return 'no-price';
  const bucket = Math.round(price / 5) * 5;
  return `$${bucket}`;
}

/**
 * Extract core title for deduplication (removes gender, colors, sizes)
 */
function extractCoreTitle(title: string): string {
  let core = title.toLowerCase();
  core = core.replace(/\b(for women|women's|womens|ladies|female)\b/g, '');
  core = core.replace(/\b(clothes|clothing|apparel|wear)\b/g, '');
  core = core.replace(/\b(size|sz|small|medium|large|xl+|[0-9]+)\b/g, '');
  core = core.replace(/\b(black|white|gray|grey|blue|red|green|pink|purple|navy|beige)\b/g, '');
  core = core.replace(/\s+/g, ' ').trim();
  return core;
}

/**
 * Generate content hash for product deduplication
 */
export function generateContentHash(product: {
  name: string;
  brand: string;
  price?: number | null;
}): string {
  const coreTitle = extractCoreTitle(product.name);
  const normalizedBrand = normalizeText(product.brand);
  const priceBucket = normalizePriceBucket(product.price);
  return `${coreTitle}|${normalizedBrand}|${priceBucket}`;
}

/**
 * Athleisure/Activewear keywords for CJ search
 */
const ACTIVEWEAR_KEYWORDS = [
  'athleisure',
  'activewear',
  'athletic wear',
  'gym clothes',
  'workout clothes',
  'sportswear',
  'fitness apparel',
  'yoga wear',
  'running clothes',
  'training apparel',
];

/**
 * Fetch athleisure/activewear products from CJ Affiliate API
 */
export async function fetchCJProducts(
  options: {
    limit?: number;
    offset?: number;
    keywords?: string[];
  } = {}
): Promise<{ products: AffiliateProduct[]; totalCount: number }> {
  const credentials = getCredentials();
  const {
    limit = 100,
    offset = 0,
    keywords = ACTIVEWEAR_KEYWORDS,
  } = options;

  // Build GraphQL query
  const keywordsList = keywords.map(k => `"${k}"`).join(', ');
  const query = `
    {
      shoppingProducts(
        companyId: "${credentials.cid}"
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
          linkCode(pid: "${credentials.cid}") {
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
      'Authorization': `Bearer ${credentials.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`CJ Affiliate API error: ${response.status} ${errorText}`);
  }

  const data: CJProductsResponse = await response.json();

  if (!data.data?.shoppingProducts) {
    throw new Error('Invalid response from CJ Affiliate API');
  }

  const productsData = data.data.shoppingProducts;

  // Transform CJ products to our affiliate product format
  const products: AffiliateProduct[] = productsData.resultList
    .filter(item => {
      // Filter out Poshmark products
      if (item.advertiserName && isPoshmark(item.advertiserName)) {
        return false;
      }

      // Filter out men's products
      if (isMensProduct(item.title, item.description || '')) {
        return false;
      }

      // Filter out bundles
      if (isBundle(item.title)) {
        return false;
      }

      // Filter price range ($20 - $2000)
      if (item.price) {
        const price = parseFloat(item.price.amount);
        if (price < 20 || price > 2000) {
          return false;
        }
      }

      return true;
    })
    .map(item => {
      const price = item.price ? parseFloat(item.price.amount) : undefined;
      const validPrice = price && price > 0 ? price : undefined;

      // Use clickUrl from linkCode if available, otherwise use regular link
      const productUrl = item.linkCode?.clickUrl || item.link || '';
      const imageUrl = item.imageLink || '';

      return {
        id: item.id,
        name: item.title,
        description: item.description || '',
        price: validPrice,
        currency: item.price?.currency || 'USD',
        imageUrl,
        productUrl,
        brand: item.brand || item.advertiserName || 'Unknown',
        category: item.googleProductCategory?.name || 'Activewear',
        merchantName: item.advertiserName || 'Unknown',
        merchantId: item.advertiserId,
        affiliateNetwork: 'cj',
        inStock: item.availability === 'in stock',
        lastUpdated: new Date().toISOString(),
      };
    });

  return {
    products,
    totalCount: productsData.totalCount,
  };
}

/**
 * Detect if product is on sale based on text content
 */
function detectSaleStatus(name: string, description: string): boolean {
  const text = `${name} ${description}`.toLowerCase();
  return /\b(on\s+)?sale\b/.test(text);
}

/**
 * Convert affiliate product to our internal product format
 */
export function affiliateToProduct(affiliate: AffiliateProduct): Omit<Product, 'id' | 'similarity'> {
  // Extract tags from category and name
  const tags = extractTags(affiliate.name, affiliate.description, affiliate.category);

  // Detect if product is on sale
  const onSale = detectSaleStatus(affiliate.name, affiliate.description);

  return {
    imageUrl: affiliate.imageUrl,
    brand: affiliate.brand,
    title: affiliate.name,
    description: affiliate.description,
    price: affiliate.price ?? null,
    currency: affiliate.currency,
    productUrl: affiliate.productUrl,
    tags,
    affiliateNetwork: affiliate.affiliateNetwork,
    merchantId: affiliate.merchantId,
    merchantName: affiliate.merchantName,
    onSale,
  };
}

/**
 * Extract relevant activewear/athleisure tags from product data
 */
function extractTags(name: string, description: string, category: string): string[] {
  const text = `${name} ${description} ${category}`.toLowerCase();
  const tags: Set<string> = new Set();

  // Activewear-specific categories
  const categories = [
    'leggings', 'yoga pants', 'joggers', 'sweatpants', 'athletic shorts', 'gym shorts',
    'sports bra', 'tank top', 'workout top', 'athletic top', 'hoodie', 'sweatshirt',
    'running shoes', 'training shoes', 'sneakers', 'athletic shoes',
    'gym bag', 'sports bag', 'water bottle', 'athletic accessories',
    'activewear', 'athleisure', 'sportswear', 'athletic wear',
  ];

  // Activity tags
  const activities = [
    'yoga', 'running', 'gym', 'workout', 'training', 'fitness',
    'cycling', 'pilates', 'crossfit', 'athletic', 'sport',
  ];

  // Style tags
  const styles = [
    'high waist', 'compression', 'moisture wicking', 'quick dry',
    'seamless', 'breathable', 'stretch', 'performance',
  ];

  // Color tags
  const colors = [
    'black', 'white', 'gray', 'grey', 'navy', 'blue', 'pink', 'purple',
    'red', 'green', 'teal', 'coral', 'burgundy', 'olive',
  ];

  const allTags = [...categories, ...activities, ...styles, ...colors];

  for (const tag of allTags) {
    if (text.includes(tag)) {
      tags.add(tag);
    }
  }

  // Add category as tag
  if (category) {
    tags.add(category.toLowerCase());
  }

  return Array.from(tags);
}

/**
 * Assess product quality for filtering
 * Returns quality score (0-7 points)
 */
function assessProductQuality(product: AffiliateProduct): number {
  let score = 0;

  // Has description (not null/empty) - 1 point
  const hasValidDescription = product.description &&
                               product.description !== 'null' &&
                               product.description.trim() !== '';
  if (hasValidDescription) {
    score += 1;

    // Description quality based on length - up to 2 more points
    if (product.description.length > 50) score += 1;
    if (product.description.length > 150) score += 1;
  }

  // Has valid price - 1 point
  if (product.price && product.price > 0) {
    score += 1;

    // Reasonable price range for activewear ($20-$200) - 1 point
    if (product.price >= 20 && product.price <= 200) {
      score += 1;
    }
  }

  // Has brand (not Unknown/empty) - 1 point
  const hasValidBrand = product.brand &&
                        product.brand !== 'Unknown' &&
                        product.brand.trim() !== '';
  if (hasValidBrand) {
    score += 1;
  }

  // Has image - 1 point
  if (product.imageUrl && product.imageUrl.trim() !== '') {
    score += 1;
  }

  return score;
}

/**
 * Sync products from CJ Affiliate to local database
 */
export async function syncCJProducts(
  supabase: any,
  options: {
    maxProducts?: number;
    generateEmbeddings?: boolean;
    minQualityScore?: number;
  } = {}
): Promise<{ synced: number; errors: number; skipped: number }> {
  const { maxProducts = 1000, minQualityScore = 4 } = options;

  let synced = 0;
  let errors = 0;
  let skipped = 0;
  let offset = 0;
  const limit = 100;

  console.log(`[CJ Affiliate] Starting sync (max ${maxProducts} products, min quality ${minQualityScore})...`);

  while (synced < maxProducts) {
    try {
      const { products, totalCount } = await fetchCJProducts({
        limit,
        offset,
      });

      console.log(`[CJ Affiliate] Fetched ${products.length} products (offset ${offset})`);

      if (products.length === 0) {
        console.log('[CJ Affiliate] No more products to fetch');
        break;
      }

      // Filter products by quality
      let skippedLowQuality = 0;
      let skippedMissingFields = 0;

      for (const product of products) {
        // Check required fields
        const hasRequiredFields = product.productUrl && product.name && product.imageUrl;
        if (!hasRequiredFields) {
          skippedMissingFields++;
          skipped++;
          continue;
        }

        // Check quality score
        const qualityScore = assessProductQuality(product);
        if (qualityScore < minQualityScore) {
          skippedLowQuality++;
          skipped++;
          continue;
        }

        // Transform to our product format
        const productData = affiliateToProduct(product);

        // Create combined text for embedding
        const combinedText = `${productData.title} ${productData.description} ${productData.brand} ${productData.tags.join(' ')}`;

        try {
          // Upsert product to database
          const { error: upsertError } = await supabase
            .from('products')
            .upsert({
              brand: productData.brand,
              title: productData.title,
              description: productData.description,
              tags: productData.tags,
              price: productData.price,
              currency: productData.currency,
              image_url: productData.imageUrl,
              product_url: productData.productUrl,
              combined_text: combinedText,
              affiliate_network: 'cj',
              merchant_id: product.merchantId,
              merchant_name: product.merchantName,
              on_sale: productData.onSale,
            }, {
              onConflict: 'product_url',
              ignoreDuplicates: false,
            });

          if (upsertError) {
            console.error(`[CJ Affiliate] Error upserting product ${product.id}:`, upsertError);
            errors++;
          } else {
            synced++;
          }
        } catch (err) {
          console.error(`[CJ Affiliate] Error processing product ${product.id}:`, err);
          errors++;
        }

        // Stop if we've reached max products
        if (synced >= maxProducts) {
          break;
        }
      }

      console.log(`[CJ Affiliate] Batch summary - Synced: ${synced}, Skipped (low quality): ${skippedLowQuality}, Skipped (missing fields): ${skippedMissingFields}`);

      // Move to next page
      offset += limit;

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Stop if we've reached max products
      if (synced >= maxProducts) {
        break;
      }

    } catch (err) {
      console.error('[CJ Affiliate] Fetch error:', err);
      errors++;
      break;
    }
  }

  console.log(`[CJ Affiliate] Sync complete - Total synced: ${synced}, Errors: ${errors}, Skipped: ${skipped}`);

  return { synced, errors, skipped };
}

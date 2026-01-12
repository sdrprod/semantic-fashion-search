import type { AffiliateProduct, Product } from '@/types';
import { generateProductFingerprint, calculateProductQualityScore } from './deduplication';

// Impact API configuration
const IMPACT_API_BASE = 'https://api.impact.com';

interface ImpactCredentials {
  accountSid: string;
  authToken: string;
}

interface ImpactProduct {
  Id: string;
  Name: string;
  Description: string;
  Price: number;
  Currency: string;
  ImageUrl: string;
  OriginalUrl: string;
  TrackingUrl: string;
  Manufacturer: string;
  CatalogId: string;
  Category: string;
  InStock: boolean;
  Labels: string[];
  LastUpdated: string;
}

interface ImpactCatalogResponse {
  Items: ImpactProduct[];
  TotalCount: number;
  Page: number;
  PageSize: number;
}

/**
 * Get Impact API credentials from environment
 */
function getCredentials(): ImpactCredentials {
  const accountSid = process.env.IMPACT_ACCOUNT_SID;
  const authToken = process.env.IMPACT_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    throw new Error('Missing Impact API credentials. Set IMPACT_ACCOUNT_SID and IMPACT_AUTH_TOKEN.');
  }

  return { accountSid, authToken };
}

/**
 * Create authorization header for Impact API
 */
function createAuthHeader(credentials: ImpactCredentials): string {
  const encoded = Buffer.from(`${credentials.accountSid}:${credentials.authToken}`).toString('base64');
  return `Basic ${encoded}`;
}

/**
 * Fetch products from Impact API catalog
 */
export async function fetchImpactProducts(
  options: {
    campaignId?: string;
    page?: number;
    pageSize?: number;
    category?: string;
    query?: string;
  } = {}
): Promise<{ products: AffiliateProduct[]; totalCount: number }> {
  const credentials = getCredentials();
  const campaignId = options.campaignId || process.env.IMPACT_CAMPAIGN_ID;

  if (!campaignId) {
    throw new Error('Missing IMPACT_CAMPAIGN_ID');
  }

  const {
    page = 1,
    pageSize = 100,
    category,
    query,
  } = options;

  // Build query parameters
  const params = new URLSearchParams({
    Page: page.toString(),
    PageSize: pageSize.toString(),
  });

  if (category) {
    params.append('Category', category);
  }

  if (query) {
    params.append('Query', query);
  }

  const url = `${IMPACT_API_BASE}/Mediapartners/${credentials.accountSid}/Catalogs/${campaignId}/Items?${params}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': createAuthHeader(credentials),
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Impact API error: ${response.status} ${errorText}`);
  }

  const data: ImpactCatalogResponse = await response.json();

  // Debug: Log first product to see actual API response structure
  if (data.Items && data.Items.length > 0) {
    console.log('[Impact API] Sample product fields:', Object.keys(data.Items[0]));
    console.log('[Impact API] First product:', JSON.stringify(data.Items[0], null, 2));
  }

  // Transform Impact products to our affiliate product format
  const products: AffiliateProduct[] = data.Items.map(item => {
    // Try multiple possible URL field names (Url is most common from actual API responses)
    const productUrl = (item as any).Url || item.TrackingUrl || item.OriginalUrl || (item as any).ProductUrl || (item as any).ClickUrl || '';
    const imageUrl = item.ImageUrl || (item as any).Image || (item as any).ImageURL || '';

    // Parse price - Impact API returns CurrentPrice as a string
    const currentPrice = (item as any).CurrentPrice || item.Price || '0';
    const price = parseFloat(currentPrice);
    const validPrice = price > 0 ? price : undefined;

    // Clean up description - avoid "null" strings
    const description = item.Description && item.Description !== 'null' ? item.Description : '';

    return {
      id: item.Id,
      name: item.Name,
      description,
      price: validPrice,
      currency: item.Currency || 'USD',
      imageUrl,
      productUrl,
      brand: item.Manufacturer || 'Unknown',
      category: item.Category || 'Fashion',
      merchantName: item.Manufacturer,
      merchantId: item.CatalogId,
      affiliateNetwork: 'impact',
      inStock: item.InStock !== false,
      lastUpdated: item.LastUpdated || new Date().toISOString(),
    };
  });

  return {
    products,
    totalCount: data.TotalCount,
  };
}

/**
 * Detect if product is on sale based on text content
 */
function detectSaleStatus(name: string, description: string): boolean {
  const text = `${name} ${description}`.toLowerCase();
  // Check for "sale" or "on sale" patterns
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
    price: affiliate.price ?? null, // Convert undefined to null for Product type
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
 * Extract relevant fashion tags from product data
 */
function extractTags(name: string, description: string, category: string): string[] {
  const text = `${name} ${description} ${category}`.toLowerCase();
  const tags: Set<string> = new Set();

  // Category tags
  const categories = [
    'dress', 'dresses', 'top', 'tops', 'blouse', 'shirt', 'pants', 'jeans',
    'skirt', 'shorts', 'jacket', 'coat', 'blazer', 'sweater', 'cardigan',
    'shoes', 'heels', 'boots', 'sandals', 'sneakers', 'flats',
    'bag', 'handbag', 'purse', 'tote', 'clutch', 'backpack',
    'jewelry', 'necklace', 'earrings', 'bracelet', 'ring', 'watch',
    'scarf', 'belt', 'hat', 'sunglasses', 'accessories',
  ];

  // Style tags
  const styles = [
    'casual', 'formal', 'elegant', 'bohemian', 'minimalist', 'classic',
    'modern', 'vintage', 'romantic', 'edgy', 'sporty', 'preppy',
    'streetwear', 'luxury', 'sustainable', 'eco-friendly',
  ];

  // Color tags
  const colors = [
    'black', 'white', 'red', 'blue', 'green', 'yellow', 'pink', 'purple',
    'orange', 'brown', 'beige', 'gray', 'grey', 'navy', 'burgundy',
    'cream', 'ivory', 'gold', 'silver', 'metallic', 'multicolor',
  ];

  // Material tags
  const materials = [
    'cotton', 'silk', 'wool', 'cashmere', 'linen', 'leather', 'suede',
    'denim', 'velvet', 'satin', 'chiffon', 'lace', 'knit', 'jersey',
  ];

  // Pattern tags
  const patterns = [
    'floral', 'striped', 'plaid', 'polka dot', 'solid', 'printed',
    'animal print', 'geometric', 'abstract', 'checkered',
  ];

  // Occasion tags
  const occasions = [
    'work', 'office', 'party', 'wedding', 'date night', 'casual',
    'beach', 'vacation', 'brunch', 'cocktail', 'evening', 'daytime',
  ];

  const allTags = [...categories, ...styles, ...colors, ...materials, ...patterns, ...occasions];

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
 * Fashion category whitelist
 * Categories must start with one of these prefixes to be considered fashion
 */
const FASHION_CATEGORY_WHITELIST = [
  // Women's Fashion
  'women', 'womens', "women's", 'ladies', 'female',
  // Men's Fashion
  'men', 'mens', "men's", 'male',
  // Clothing
  'clothing', 'apparel', 'fashion',
  // Footwear
  'shoes', 'footwear', 'boots', 'sandals', 'heels', 'sneakers',
  // Accessories
  'accessories', 'jewelry', 'jewellery', 'watches',
  'bags', 'handbags', 'purses', 'wallets', 'backpacks',
  'sunglasses', 'eyewear', 'belts', 'hats', 'scarves', 'gloves',
  // Specific clothing categories
  'dresses', 'tops', 'bottoms', 'outerwear', 'activewear', 'sportswear',
  'swimwear', 'lingerie', 'underwear', 'sleepwear', 'loungewear',
  'suits', 'jackets', 'coats', 'sweaters', 'hoodies', 'shirts', 'blouses',
  'pants', 'jeans', 'shorts', 'skirts', 'leggings',
];

/**
 * Check if product category is in fashion whitelist
 */
function isFashionCategory(category: string): boolean {
  if (!category) return false;

  const categoryLower = category.toLowerCase();

  // Check if category starts with any whitelisted fashion category
  return FASHION_CATEGORY_WHITELIST.some(prefix =>
    categoryLower.startsWith(prefix.toLowerCase())
  );
}

/**
 * Non-fashion keywords that indicate product should be rejected
 */
const NON_FASHION_KEYWORDS = [
  // Electronics & Gadgets
  'phone', 'iphone', 'samsung', 'galaxy', 'case', 'charger', 'cable', 'electronics',
  'headphone', 'earbud', 'speaker', 'bluetooth', 'wireless', 'usb', 'led', 'battery',
  'remote', 'control', 'smart watch', 'smartwatch', 'watch strap', 'watch band', 'apple watch', 'gadget', 'device',
  'tablet', 'ipad', 'android',
  'tv box', 'tv stick', 'android tv', 'streaming device', 'dongle', 'set top',
  'ipad cover', 'ipad case', 'tablet case',
  // Computers & Peripherals
  'computer', 'laptop', 'keyboard', 'mouse', 'monitor', 'printer',
  'switch', 'ethernet', 'router', 'modem', 'network',
  'graphics card', 'gpu', 'rtx', 'rx7800', 'rx7900', 'rtx3050', 'rtx4060', 'rtx4070', 'rtx4080', 'rtx4090',
  'motherboard', 'mainboard', 'pcie', 'nvme', 'ssd', 'hard drive', 'storage drive',
  'asus', 'gigabyte', 'msi motherboard', 'asrock',
  'ram', 'ddr4', 'ddr5', 'memory module',
  // Kitchen & Appliances
  'kitchen', 'garlic', 'peeler', 'meat', 'cutter', 'appliance', 'machine',
  'blender', 'mixer', 'toaster', 'microwave', 'processor', 'cookware',
  'wafflemaker', 'waffle maker', 'barbecue', 'bbq grill', 'teppanyaki', 'grill',
  // Toys & Games
  'inflatable', 'toy', 'game', 'puzzle', 'console', 'controller', 'doll',
  'playstation', 'xbox', 'nintendo', 'gaming',
  // Tools & Hardware
  'tool', 'hardware', 'equipment', 'power supply', 'circuit', 'motor',
  'drill', 'saw', 'wrench', 'screwdriver', 'bearing', 'gear', 'hammer',
  // Pets
  'pet', 'dog', 'cat', 'animal feed', 'pet food',
  // Photography & Video
  'camera', 'gopro', 'lens', 'tripod', 'backdrop', 'photography', 'studio',
  'lighting', 'softbox', 'reflector',
  // Baby & Nursery
  'baby shower', 'baby birthday', 'nursery', 'newborn', 'diaper',
  // Automotive & Sports Equipment
  'bicycle', 'bike', 'cycling', 'fishing', 'rod', 'reel',
  'drone', 'quadcopter',
  // Communications
  'walkie talkie', 'radio', 'antenna',
  // Home & Office
  'fan', 'electric fan', 'desk fan', 'piggy bank', 'coin bank',
  'curler', 'curling iron', 'hair curler',
  // Vision & Reading
  'bifocal', 'reading glasses', 'magnifying',
  // Party & Decorations (non-wearable)
  'party backdrop', 'birthday backdrop', 'decoration backdrop',
  // Safety & Industrial
  'safety light', 'flashlight', 'clip light', 'night vision',
  'spray ball', 'rotating clip', 'tri clover', 'industrial',
  // Outdoor & Camping (non-apparel)
  'tent', 'sleeping bag', 'camping stove',
  // Sports Equipment (non-apparel)
  'golf bag', 'golf club', 'golf accessory', 'golf cover',
  'roller skate', 'rollerblades', 'freestyle slalom', 'three wheel',
  // Packaging (non-wearable)
  'jewelry box', 'paper box packaging', 'gift box',
  // Inappropriate/Adult Content (optional - consider search-time filtering instead)
  // 'sexy', 'seductive', 'revealing', 'provocative',
];

/**
 * Check if product contains non-fashion keywords
 */
function hasNonFashionKeywords(name: string, description: string): boolean {
  const text = `${name} ${description}`.toLowerCase();
  return NON_FASHION_KEYWORDS.some(keyword => text.includes(keyword));
}

/**
 * Check if merchant is DHGate (requires stricter quality filtering)
 */
function isDHGateMerchant(merchantName: string): boolean {
  return merchantName.toLowerCase().includes('dhgate');
}

/**
 * Get minimum quality score threshold for a merchant
 * DHGate requires higher quality (6-7) due to data quality issues
 * Other merchants use the default threshold (5)
 */
function getMinQualityScoreForMerchant(merchantName: string, defaultMinScore: number): number {
  if (isDHGateMerchant(merchantName)) {
    // DHGate requires excellent quality: good description, valid price, brand, and fashion category
    return Math.max(6, defaultMinScore);
  }
  return defaultMinScore;
}

/**
 * Check if product is a fashion item (legacy keyword-based check)
 */
function isFashionProduct(name: string, description: string, category: string): boolean {
  const text = `${name} ${description} ${category}`.toLowerCase();

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
  ];

  return fashionKeywords.some(keyword => text.includes(keyword));
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

    // Reasonable price range for fashion ($5-$500) - 1 point
    if (product.price >= 5 && product.price <= 500) {
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

  // Is fashion product - 1 point
  if (isFashionProduct(product.name, product.description, product.category)) {
    score += 1;
  }

  return score;
}

/**
 * Sync products from Impact to local database
 */
export async function syncImpactProducts(
  supabase: any,
  options: {
    campaignId?: string;
    maxProducts?: number;
    generateEmbeddings?: boolean;
    minQualityScore?: number;
  } = {}
): Promise<{ synced: number; errors: number; duplicates?: number }> {
  const { maxProducts = 1000, generateEmbeddings = true, minQualityScore = 5 } = options;

  let synced = 0;
  let errors = 0;
  let duplicates = 0;
  let page = 1;
  const pageSize = 100;

  while (synced < maxProducts) {
    try {
      const { products, totalCount } = await fetchImpactProducts({
        ...options,
        page,
        pageSize,
      });

      if (products.length === 0) break;

      // Filter products by quality and required fields BEFORE transformation
      let skippedMissingFields = 0;
      let skippedNonUSD = 0;
      let skippedNonFashion = 0;
      let skippedLowQuality = 0;
      let skippedNonFashionKeywords = 0;
      const qualityScores: number[] = [];

      const validProducts = products.filter(p => {
        // Check required fields
        const hasRequiredFields = p.productUrl && p.name && p.imageUrl;
        if (!hasRequiredFields) {
          skippedMissingFields++;
          return false;
        }

        // MVP: Only sync USD products (will internationalize later)
        const isUSD = p.currency === 'USD';
        if (!isUSD) {
          skippedNonUSD++;
          return false;
        }

        // CRITICAL: Must be in fashion category whitelist
        if (!isFashionCategory(p.category)) {
          skippedNonFashion++;
          return false;
        }

        // CRITICAL: Must not contain non-fashion keywords (phone, electronics, etc.)
        if (hasNonFashionKeywords(p.name, p.description)) {
          skippedNonFashionKeywords++;
          return false;
        }

        // Check quality score with merchant-specific thresholds
        const qualityScore = assessProductQuality(p);
        qualityScores.push(qualityScore);

        // Apply stricter quality threshold for DHGate (6+) vs other merchants (5+)
        const merchantMinScore = getMinQualityScoreForMerchant(p.merchantName, minQualityScore);
        if (qualityScore < merchantMinScore) {
          skippedLowQuality++;
          return false;
        }

        return true;
      });

      // Log filtering stats with quality score distribution
      const avgScore = qualityScores.length > 0
        ? (qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length).toFixed(1)
        : '0.0';
      const minScore = qualityScores.length > 0 ? Math.min(...qualityScores) : 0;
      const maxScore = qualityScores.length > 0 ? Math.max(...qualityScores) : 0;

      console.log(`Page ${page} filtering: ${validProducts.length}/${products.length} passed | Quality scores: min=${minScore}, max=${maxScore}, avg=${avgScore} | Threshold: ${minQualityScore} | Rejected: ${skippedNonFashion} non-fashion, ${skippedNonFashionKeywords} non-fashion keywords, ${skippedLowQuality} low quality, ${skippedMissingFields} missing fields, ${skippedNonUSD} non-USD`);

      // Convert and prepare products for insertion with deduplication
      const productsToInsert = [];

      for (const p of validProducts) {
        const product = affiliateToProduct(p);
        // Use title as fallback when description is empty (for DHgate and other low-quality sources)
        const descriptionText = product.description?.trim() || product.title;

        // Generate content hash for deduplication
        const contentHash = generateProductFingerprint({
          title: product.title,
          brand: product.brand,
          price: product.price,
        });

        // Check for existing duplicate
        const { data: existingProducts, error: checkError } = await supabase
          .from('products')
          .select('id, title, description, brand, price, image_url, affiliate_network')
          .eq('content_hash', contentHash);

        if (checkError) {
          console.error('Error checking for duplicates:', checkError.message);
          // Continue anyway - let database handle it
        }

        // If duplicate found, compare quality
        if (existingProducts && existingProducts.length > 0) {
          const existingProduct = existingProducts[0];

          // Calculate quality scores
          const existingQuality = calculateProductQualityScore({
            title: existingProduct.title,
            description: existingProduct.description,
            price: existingProduct.price,
            brand: existingProduct.brand,
            imageUrl: existingProduct.image_url,
            affiliateNetwork: existingProduct.affiliate_network,
          });

          const newQuality = calculateProductQualityScore({
            title: product.title,
            description: product.description,
            price: product.price,
            brand: product.brand,
            imageUrl: product.imageUrl,
            affiliateNetwork: product.affiliateNetwork,
          });

          // If new product is not better quality AND not cheaper, skip it
          if (newQuality <= existingQuality && (product.price ?? Infinity) >= (existingProduct.price ?? 0)) {
            duplicates++;
            continue;
          }

          // New product is better - delete the old one
          const { error: deleteError } = await supabase
            .from('products')
            .delete()
            .eq('id', existingProduct.id);

          if (deleteError) {
            console.error('Error deleting inferior duplicate:', deleteError.message);
          }
        }

        // Add to insert list
        productsToInsert.push({
          brand: product.brand,
          title: product.title,
          description: product.description,
          tags: product.tags,
          price: product.price,
          currency: product.currency,
          image_url: product.imageUrl,
          product_url: product.productUrl,
          combined_text: `${product.title} ${descriptionText} ${product.tags?.join(' ')}`,
          affiliate_network: product.affiliateNetwork,
          merchant_id: product.merchantId,
          merchant_name: product.merchantName,
          on_sale: product.onSale || false,
          content_hash: contentHash,
        });

        // Check if we've reached the quota
        if (productsToInsert.length >= (maxProducts - synced)) {
          break;
        }
      }

      if (productsToInsert.length === 0) {
        console.log(`No valid products found on page ${page} (all duplicates or filtered), skipping...`);
        page++;
        continue;
      }

      console.log(`Inserting ${productsToInsert.length} products from page ${page} (${duplicates} duplicates skipped so far)...`);

      // Upsert products to database
      const { error } = await supabase
        .from('products')
        .upsert(productsToInsert, {
          onConflict: 'product_url',
          ignoreDuplicates: false,
        });

      if (error) {
        console.error('Database insert error:', error);
        errors += productsToInsert.length;
      } else {
        synced += productsToInsert.length;
      }

      // Check if we've synced enough products or reached end of results
      if (synced >= maxProducts || products.length < pageSize) break;

      page++;

      // Rate limiting - Impact has API limits
      await new Promise(resolve => setTimeout(resolve, 200));

    } catch (err) {
      console.error('Sync error:', err);
      errors++;
      break;
    }
  }

  console.log(`Sync complete: ${synced} synced, ${errors} errors, ${duplicates} duplicates skipped`);

  return { synced, errors, duplicates };
}

/**
 * Get all campaign IDs from environment
 */
export function getAllCampaignIds(): string[] {
  const campaignIds = process.env.IMPACT_CAMPAIGN_IDS;

  if (!campaignIds) {
    // Fall back to single campaign ID
    const singleId = process.env.IMPACT_CAMPAIGN_ID;
    if (singleId) {
      return [singleId];
    }
    return [];
  }

  return campaignIds.split(',').map(id => id.trim()).filter(Boolean);
}

/**
 * Sync products from all configured Impact campaigns
 */
export async function syncAllCampaigns(
  supabase: any,
  options: {
    maxProductsPerCampaign?: number;
    generateEmbeddings?: boolean;
    minQualityScore?: number;
    onProgress?: (campaignId: string, synced: number, errors: number, duplicates: number) => void;
  } = {}
): Promise<{
  totalSynced: number;
  totalErrors: number;
  totalDuplicates: number;
  campaignResults: Array<{ campaignId: string; synced: number; errors: number; duplicates: number }>;
}> {
  const { maxProductsPerCampaign = 500, generateEmbeddings = true, minQualityScore = 5, onProgress } = options;

  const campaignIds = getAllCampaignIds();

  if (campaignIds.length === 0) {
    throw new Error('No campaign IDs configured. Set IMPACT_CAMPAIGN_IDS or IMPACT_CAMPAIGN_ID.');
  }

  let totalSynced = 0;
  let totalErrors = 0;
  let totalDuplicates = 0;
  const campaignResults: Array<{ campaignId: string; synced: number; errors: number; duplicates: number }> = [];

  console.log(`Starting sync for ${campaignIds.length} campaigns...`);

  for (const campaignId of campaignIds) {
    try {
      console.log(`Syncing campaign ${campaignId}...`);

      const { synced, errors, duplicates = 0 } = await syncImpactProducts(supabase, {
        campaignId,
        maxProducts: maxProductsPerCampaign,
        generateEmbeddings,
        minQualityScore,
      });

      totalSynced += synced;
      totalErrors += errors;
      totalDuplicates += duplicates;
      campaignResults.push({ campaignId, synced, errors, duplicates });

      console.log(`Campaign ${campaignId}: synced ${synced}, errors ${errors}, duplicates ${duplicates}`);

      if (onProgress) {
        onProgress(campaignId, synced, errors, duplicates);
      }

      // Rate limiting between campaigns
      await new Promise(resolve => setTimeout(resolve, 500));

    } catch (err) {
      console.error(`Error syncing campaign ${campaignId}:`, err);
      totalErrors++;
      campaignResults.push({ campaignId, synced: 0, errors: 1, duplicates: 0 });
    }
  }

  console.log(`Sync complete: ${totalSynced} products synced, ${totalErrors} errors, ${totalDuplicates} duplicates skipped across ${campaignIds.length} campaigns`);

  return {
    totalSynced,
    totalErrors,
    totalDuplicates,
    campaignResults,
  };
}

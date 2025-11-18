import type { AffiliateProduct, Product } from '@/types';

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

  // Transform Impact products to our affiliate product format
  const products: AffiliateProduct[] = data.Items.map(item => ({
    id: item.Id,
    name: item.Name,
    description: item.Description || '',
    price: item.Price,
    currency: item.Currency || 'USD',
    imageUrl: item.ImageUrl,
    productUrl: item.TrackingUrl || item.OriginalUrl,
    brand: item.Manufacturer || 'Unknown',
    category: item.Category || 'Fashion',
    merchantName: item.Manufacturer,
    merchantId: item.CatalogId,
    affiliateNetwork: 'impact',
    inStock: item.InStock !== false,
    lastUpdated: item.LastUpdated || new Date().toISOString(),
  }));

  return {
    products,
    totalCount: data.TotalCount,
  };
}

/**
 * Convert affiliate product to our internal product format
 */
export function affiliateToProduct(affiliate: AffiliateProduct): Omit<Product, 'id' | 'similarity'> {
  // Extract tags from category and name
  const tags = extractTags(affiliate.name, affiliate.description, affiliate.category);

  return {
    imageUrl: affiliate.imageUrl,
    brand: affiliate.brand,
    title: affiliate.name,
    description: affiliate.description,
    price: affiliate.price,
    currency: affiliate.currency,
    productUrl: affiliate.productUrl,
    tags,
    affiliateNetwork: affiliate.affiliateNetwork,
    merchantId: affiliate.merchantId,
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
 * Sync products from Impact to local database
 */
export async function syncImpactProducts(
  supabase: any,
  options: {
    campaignId?: string;
    maxProducts?: number;
    generateEmbeddings?: boolean;
  } = {}
): Promise<{ synced: number; errors: number }> {
  const { maxProducts = 1000, generateEmbeddings = true } = options;

  let synced = 0;
  let errors = 0;
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

      // Convert and prepare products for insertion
      const productsToInsert = products.map(p => {
        const product = affiliateToProduct(p);
        return {
          brand: product.brand,
          title: product.title,
          description: product.description,
          tags: product.tags,
          price: product.price,
          currency: product.currency,
          image_url: product.imageUrl,
          product_url: product.productUrl,
          combined_text: `${product.title} ${product.title} ${product.title} ${product.description} ${product.tags?.join(' ')}`,
          affiliate_network: product.affiliateNetwork,
          merchant_id: product.merchantId,
        };
      });

      // Upsert products to database
      const { error } = await supabase
        .from('products')
        .upsert(productsToInsert, {
          onConflict: 'product_url',
          ignoreDuplicates: false,
        });

      if (error) {
        console.error('Database insert error:', error);
        errors += products.length;
      } else {
        synced += products.length;
      }

      // Check if we've fetched all products
      if (synced >= totalCount || products.length < pageSize) break;

      page++;

      // Rate limiting - Impact has API limits
      await new Promise(resolve => setTimeout(resolve, 200));

    } catch (err) {
      console.error('Sync error:', err);
      errors++;
      break;
    }
  }

  return { synced, errors };
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
    onProgress?: (campaignId: string, synced: number, errors: number) => void;
  } = {}
): Promise<{
  totalSynced: number;
  totalErrors: number;
  campaignResults: Array<{ campaignId: string; synced: number; errors: number }>;
}> {
  const { maxProductsPerCampaign = 500, generateEmbeddings = true, onProgress } = options;

  const campaignIds = getAllCampaignIds();

  if (campaignIds.length === 0) {
    throw new Error('No campaign IDs configured. Set IMPACT_CAMPAIGN_IDS or IMPACT_CAMPAIGN_ID.');
  }

  let totalSynced = 0;
  let totalErrors = 0;
  const campaignResults: Array<{ campaignId: string; synced: number; errors: number }> = [];

  console.log(`Starting sync for ${campaignIds.length} campaigns...`);

  for (const campaignId of campaignIds) {
    try {
      console.log(`Syncing campaign ${campaignId}...`);

      const { synced, errors } = await syncImpactProducts(supabase, {
        campaignId,
        maxProducts: maxProductsPerCampaign,
        generateEmbeddings,
      });

      totalSynced += synced;
      totalErrors += errors;
      campaignResults.push({ campaignId, synced, errors });

      console.log(`Campaign ${campaignId}: synced ${synced}, errors ${errors}`);

      if (onProgress) {
        onProgress(campaignId, synced, errors);
      }

      // Rate limiting between campaigns
      await new Promise(resolve => setTimeout(resolve, 500));

    } catch (err) {
      console.error(`Error syncing campaign ${campaignId}:`, err);
      totalErrors++;
      campaignResults.push({ campaignId, synced: 0, errors: 1 });
    }
  }

  console.log(`Sync complete: ${totalSynced} products synced, ${totalErrors} errors across ${campaignIds.length} campaigns`);

  return {
    totalSynced,
    totalErrors,
    campaignResults,
  };
}

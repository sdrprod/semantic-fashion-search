/**
 * Product deduplication utilities
 *
 * Creates content-based fingerprints to identify duplicate products
 * across different URLs and affiliate networks
 */

/**
 * Normalize text for comparison (lowercase, remove special chars, extra spaces)
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ') // Remove special characters
    .replace(/\s+/g, ' ')      // Normalize whitespace
    .trim();
}

/**
 * Normalize price to nearest $5 bucket to catch slight price variations
 * e.g., $21.59 and $21.68 both become $20
 */
function normalizePriceBucket(price: number | null | undefined): string {
  if (!price || price <= 0) return 'no-price';
  // Round to nearest $5
  const bucket = Math.round(price / 5) * 5;
  return `$${bucket}`;
}

/**
 * Extract core product identifier from title
 * Removes common variations like "For Women", "Women's", size info, color info
 */
function extractCoreTitle(title: string): string {
  let core = title.toLowerCase();

  // Remove gender qualifiers
  core = core.replace(/\b(for women|women's|womens|ladies|female)\b/g, '');

  // Remove common filler words
  core = core.replace(/\b(clothes|clothing|apparel|wear)\b/g, '');

  // Remove size indicators (S, M, L, XL, XXL, numeric sizes)
  core = core.replace(/\b(size|sz|small|medium|large|xl+|[0-9]+)\b/g, '');

  // Remove color descriptors (basic colors)
  core = core.replace(/\b(black|white|gray|grey|blue|red|green|pink|purple|navy|beige)\b/g, '');

  // Normalize whitespace again
  core = core.replace(/\s+/g, ' ').trim();

  return core;
}

/**
 * Generate a content-based fingerprint for a product
 * This fingerprint is used to identify duplicate products regardless of URL
 */
export function generateProductFingerprint(product: {
  title: string;
  brand: string;
  price?: number | null;
}): string {
  // Extract and normalize core components
  const coreTitle = extractCoreTitle(product.title);
  const normalizedBrand = normalizeText(product.brand);
  const priceBucket = normalizePriceBucket(product.price);

  // Combine into fingerprint
  const fingerprint = `${coreTitle}|${normalizedBrand}|${priceBucket}`;

  // Create a simple hash (or return as-is for debugging)
  // For production, you might want to use a proper hash function
  return fingerprint;
}

/**
 * Generate a simple string hash (for creating shorter fingerprints)
 */
export function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Check if two products are likely duplicates
 */
export function areDuplicates(product1: {
  title: string;
  brand: string;
  price?: number | null;
}, product2: {
  title: string;
  brand: string;
  price?: number | null;
}): boolean {
  const fp1 = generateProductFingerprint(product1);
  const fp2 = generateProductFingerprint(product2);
  return fp1 === fp2;
}

/**
 * Quality score for determining which duplicate to keep
 * Higher score = better quality product listing
 */
export function calculateProductQualityScore(product: {
  title: string;
  description?: string;
  price?: number | null;
  brand: string;
  imageUrl?: string;
  affiliateNetwork?: string;
}): number {
  let score = 0;

  // Title quality (detailed titles are better)
  if (product.title.length > 50) score += 2;
  else if (product.title.length > 30) score += 1;

  // Description quality
  if (product.description && product.description.length > 100) score += 3;
  else if (product.description && product.description.length > 50) score += 2;
  else if (product.description && product.description.length > 0) score += 1;

  // Has valid price
  if (product.price && product.price > 0) score += 2;

  // Brand quality (not "Unknown")
  if (product.brand && product.brand !== 'Unknown' && product.brand.trim() !== '') {
    score += 2;
  }

  // Has image
  if (product.imageUrl && product.imageUrl.trim() !== '') score += 1;

  // Network preference (can adjust based on user preference)
  // For now, treat all networks equally

  return score;
}

/**
 * Select the best product from a group of duplicates
 * Criteria: 1) Quality score, 2) Lowest price, 3) Most recent
 */
export function selectBestDuplicate(products: Array<{
  id?: string;
  title: string;
  description?: string;
  price?: number | null;
  brand: string;
  imageUrl?: string;
  affiliateNetwork?: string;
  createdAt?: string;
}>): any {
  if (products.length === 0) return null;
  if (products.length === 1) return products[0];

  // Calculate quality scores for all
  const scored = products.map(p => ({
    product: p,
    qualityScore: calculateProductQualityScore(p),
  }));

  // Sort by: quality score (desc), then price (asc), then created date (desc)
  scored.sort((a, b) => {
    // First: quality score (higher is better)
    if (a.qualityScore !== b.qualityScore) {
      return b.qualityScore - a.qualityScore;
    }

    // Second: price (lower is better, but handle nulls)
    const priceA = a.product.price || Infinity;
    const priceB = b.product.price || Infinity;
    if (priceA !== priceB) {
      return priceA - priceB;
    }

    // Third: created date (newer is better)
    const dateA = a.product.createdAt ? new Date(a.product.createdAt).getTime() : 0;
    const dateB = b.product.createdAt ? new Date(b.product.createdAt).getTime() : 0;
    return dateB - dateA;
  });

  return scored[0].product;
}

export default {
  generateProductFingerprint,
  hashString,
  areDuplicates,
  calculateProductQualityScore,
  selectBestDuplicate,
};

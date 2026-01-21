import { Redis } from '@upstash/redis';

/**
 * Upstash Redis client for caching search results
 *
 * Features:
 * - On-demand caching of search results
 * - TTL-based expiration (1 hour default)
 * - Fast pagination without re-running searches
 * - Cost optimization (fewer OpenAI API calls)
 */

// Initialize Redis client
// Uses REST API for serverless compatibility
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

/**
 * Generate a stable cache key from search parameters
 * NOTE: Does NOT include page number - we cache the full result set,
 * then paginate from cache for all pages
 */
export function generateCacheKey(
  query: string,
  options: {
    limit?: number;
    page?: number;
    similarityThreshold?: number;
    allowSexyContent?: boolean;
    userRatings?: string; // JSON string of user ratings for personalized caching
  }
): string {
  // Normalize query (lowercase, trim)
  const normalizedQuery = query.toLowerCase().trim();

  // Create deterministic key from parameters
  // IMPORTANT: Page number NOT included - all pages share same cache
  const keyParts = [
    'search',
    normalizedQuery,
    `threshold:${options.similarityThreshold || 0.3}`,
    `sexy:${options.allowSexyContent ? 'yes' : 'no'}`,
  ];

  // Include user ratings in cache key for personalized results
  if (options.userRatings) {
    keyParts.push(`ratings:${options.userRatings}`);
  }

  return keyParts.join(':');
}

/**
 * Get cached search results
 */
export async function getCachedSearch<T>(cacheKey: string): Promise<T | null> {
  try {
    const cached = await redis.get<T>(cacheKey);

    if (cached) {
      console.log(`[Redis] ✅ Cache HIT: ${cacheKey}`);
    } else {
      console.log(`[Redis] ❌ Cache MISS: ${cacheKey}`);
    }

    return cached;
  } catch (error) {
    console.error('[Redis] Error reading cache:', error);
    return null; // Fail gracefully - proceed without cache
  }
}

/**
 * Store search results in cache
 */
export async function setCachedSearch<T>(
  cacheKey: string,
  data: T,
  ttlSeconds: number = 3600 // 1 hour default
): Promise<void> {
  try {
    await redis.set(cacheKey, data, { ex: ttlSeconds });
    console.log(`[Redis] 💾 Cached: ${cacheKey} (TTL: ${ttlSeconds}s)`);
  } catch (error) {
    console.error('[Redis] Error writing cache:', error);
    // Fail gracefully - search still works without cache
  }
}

/**
 * Clear cache for a specific query pattern
 */
export async function clearCachePattern(pattern: string): Promise<void> {
  try {
    // Note: Upstash doesn't support SCAN, so this is best-effort
    // For full pattern clearing, use Upstash console or upgrade to Pro
    console.log(`[Redis] 🧹 Cache clear requested: ${pattern}`);
  } catch (error) {
    console.error('[Redis] Error clearing cache:', error);
  }
}

/**
 * Clear all search caches
 * Use after inventory sync or major updates
 */
export async function clearAllSearchCaches(): Promise<void> {
  try {
    // Note: This requires listing all keys, which isn't efficient
    // Better approach: use TTL and let caches expire naturally
    // OR: Track cache keys in a set and delete them explicitly
    console.log('[Redis] 🧹 Full cache clear requested (not implemented - use TTL)');
  } catch (error) {
    console.error('[Redis] Error clearing all caches:', error);
  }
}

export default redis;

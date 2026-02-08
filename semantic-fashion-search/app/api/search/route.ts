import { NextRequest, NextResponse } from 'next/server';
import { semanticSearch } from '@/lib/search';
import { generateCacheKey, getCachedSearch, setCachedSearch } from '@/lib/redis';
import type { SearchResponse } from '@/types';

export async function POST(request: NextRequest) {
  console.log('[Search API] Request received');

  try {
    const body = await request.json();
    const { query, limit = 12, page = 1, userRatings = {} } = body;

    console.log('[Search API] Query params:', { query, limit, page, userRatingsCount: Object.keys(userRatings).length });

    // Validate query
    if (!query || typeof query !== 'string' || query.trim().length < 3) {
      console.log('[Search API] Invalid query');
      return NextResponse.json(
        { error: 'Query must be at least 3 characters.' },
        { status: 400 }
      );
    }

    // Validate pagination params
    const validatedLimit = Math.min(Math.max(1, limit), 50);
    const validatedPage = Math.max(1, page);

    // Check sexy intent on user query
    let hasSexyIntent = false;
    const sexyKeywords = [
      'sexy', 'lingerie', 'intimate', 'risque', 'provocative', 'enticing',
      'skimpy', 'revealing', 'sultry', 'seductive', 'alluring', 'naughty',
      'racy', 'steamy', 'sensual', 'erotic', 'burlesque', 'negligee',
      'teddy', 'bodysuit', 'fishnet', 'lace bra', 'thong', 'garter',
      'bedroom', 'boudoir', 'spicy', 'hot outfit', 'daring'
    ];
    const lowerQuery = query.trim().toLowerCase();
    hasSexyIntent = sexyKeywords.some(keyword => lowerQuery.includes(keyword));
    console.log(`[Search API] User query sexy intent: ${hasSexyIntent ? 'YES' : 'NO'}`);

    // Generate cache key (page-agnostic - same key for all pages)
    // Include userRatings in cache key to ensure personalized results
    const cacheKey = generateCacheKey(query.trim(), {
      allowSexyContent: hasSexyIntent,
      userRatings: Object.keys(userRatings).length > 0 ? JSON.stringify(userRatings) : undefined,
    });

    // Check cache first for FULL result set
    const cachedFullResults = await getCachedSearch<SearchResponse>(cacheKey);

    if (cachedFullResults) {
      console.log('[Search API] Cache HIT ⚡ - paginating from cached results');

      // Paginate from cached full results
      const startIndex = (validatedPage - 1) * validatedLimit;
      const endIndex = startIndex + validatedLimit;
      const paginatedResults = cachedFullResults.results.slice(startIndex, endIndex);

      return NextResponse.json({
        ...cachedFullResults,
        results: paginatedResults,
        page: validatedPage,
        pageSize: validatedLimit,
      });
    }

    console.log('[Search API] Cache MISS - starting semantic search...');

    // Perform semantic search - optimized for <2 second load time
    // Fetches ~100 raw results → ~50-70 after filtering → 4-6 pages cached
    const searchResponse = await semanticSearch(query.trim(), {
      limit: 100, // Optimized for fast initial load (<2 sec)
      page: 1,
      allowSexyContent: hasSexyIntent,
      userRatings, // Pass user ratings for personalized filtering and boosting
    });

    console.log('[Search API] Search complete, total results:', searchResponse.results.length);

    // Cache the FULL result set (1 hour TTL)
    await setCachedSearch(cacheKey, searchResponse, 3600);

    // Paginate the requested page from full results
    const startIndex = (validatedPage - 1) * validatedLimit;
    const endIndex = startIndex + validatedLimit;
    const paginatedResults = searchResponse.results.slice(startIndex, endIndex);

    return NextResponse.json({
      ...searchResponse,
      results: paginatedResults,
      page: validatedPage,
      pageSize: validatedLimit,
    });
  } catch (err) {
    // Enhanced error logging for debugging production issues
    console.error('[Search API] ========== ERROR DETAILS ==========');
    console.error('[Search API] Error type:', err instanceof Error ? err.constructor.name : typeof err);
    console.error('[Search API] Error message:', err instanceof Error ? err.message : String(err));
    console.error('[Search API] Error stack:', err instanceof Error ? err.stack : 'No stack trace');

    // Log environment info to help debug
    console.error('[Search API] Environment:', {
      hasAnthropicKey: !!process.env.ANTHROPIC_API_KEY,
      hasOpenAIKey: !!process.env.OPENAI_API_KEY,
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY || !!process.env.SUPABASE_ANON_KEY,
      nodeEnv: process.env.NODE_ENV,
    });

    console.error('[Search API] ==============================');

    // Return more helpful error in development, generic in production
    const isDevelopment = process.env.NODE_ENV === 'development';
    return NextResponse.json(
      {
        error: 'Internal server error.',
        ...(isDevelopment && {
          details: err instanceof Error ? err.message : String(err),
          type: err instanceof Error ? err.constructor.name : typeof err,
        }),
      },
      { status: 500 }
    );
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 });
}

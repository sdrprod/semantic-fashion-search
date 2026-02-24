import { NextRequest, NextResponse } from 'next/server';
import { semanticSearch } from '@/lib/search';
import { generateCacheKey, getCachedSearch, setCachedSearch } from '@/lib/redis';
import type { SearchResponse } from '@/types';

export async function POST(request: NextRequest) {
  console.log('[Search API] Request received');

  try {
    const body = await request.json();
    const { query, limit = 12, page = 1, userRatings = {}, skipVisionReranking = false } = body;

    console.log('[Search API] Query params:', { query, limit, page, userRatingsCount: Object.keys(userRatings).length, skipVisionReranking });

    // Validate query
    if (!query || typeof query !== 'string' || query.trim().length < 3) {
      console.log('[Search API] Invalid query');
      return NextResponse.json(
        { error: 'Query must be at least 3 characters.' },
        { status: 400 }
      );
    }

    // Validate pagination params
    // Cap at 200 (up from 50) to support browse category pagination
    const validatedLimit = Math.min(Math.max(1, limit), 200);
    const validatedPage = Math.max(1, page);

    // Check if this is a demo query - skip caching for demo queries
    const DEMO_TRIGGER = 'Modern long black dress with a romantic neckline for a formal evening event';
    const isDemoQuery = query.toLowerCase().trim() === DEMO_TRIGGER.toLowerCase().trim();
    if (isDemoQuery) {
      console.log('[Search API] 🎬 DEMO QUERY DETECTED - Skipping cache for demo search');
    }

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

    // Check cache first for FULL result set (skip for demo queries)
    let cachedFullResults: SearchResponse | null = null;
    if (!isDemoQuery) {
      cachedFullResults = await getCachedSearch<SearchResponse>(cacheKey);
    }

    if (cachedFullResults) {
      const startIndex = (validatedPage - 1) * validatedLimit;
      const endIndex = startIndex + validatedLimit;

      if (startIndex < cachedFullResults.results.length) {
        console.log('[Search API] Cache HIT ⚡ - paginating from cached results');
        const paginatedResults = cachedFullResults.results.slice(startIndex, endIndex);
        return NextResponse.json({
          ...cachedFullResults,
          results: paginatedResults,
          page: validatedPage,
          pageSize: validatedLimit,
        });
      }

      // Requested page is beyond what's cached (e.g. browse query, page 9+)
      // Fall through to a fresh DB fetch for this specific page
      console.log(`[Search API] Cache HIT but page ${validatedPage} beyond cached range (${cachedFullResults.results.length} results) — fetching live`);
    }

    const isBeyondCache = !!cachedFullResults;

    // For page 1 (or first fetch): fetch a large pool for caching future pages.
    // For deep pages on browse queries: fetch just the needed slice directly.
    const fetchLimit = validatedPage === 1 ? Math.max(100, validatedLimit) : validatedLimit;
    const fetchPage = validatedPage;

    console.log(`[Search API] ${isBeyondCache ? 'Beyond-cache fetch' : 'Cache MISS'} - starting semantic search (limit=${fetchLimit}, page=${fetchPage})...`);

    const searchResponse = await semanticSearch(query.trim(), {
      limit: fetchLimit,
      page: fetchPage,
      allowSexyContent: hasSexyIntent,
      userRatings,
      skipVisionReranking,
    });

    console.log('[Search API] Search complete, total results:', searchResponse.results.length);

    // Only cache page-1 results (the full initial pool for fast subsequent pages)
    if (!isDemoQuery && validatedPage === 1) {
      await setCachedSearch(cacheKey, searchResponse, 3600);
    } else if (isDemoQuery) {
      console.log('[Search API] 🎬 DEMO QUERY - Not caching results (instant demo search always fresh)');
    }

    // Page 1: slice down to validatedLimit; deep pages: results already match requested slice
    const startIndex = (validatedPage - 1) * validatedLimit;
    const paginatedResults = validatedPage === 1
      ? searchResponse.results.slice(startIndex, startIndex + validatedLimit)
      : searchResponse.results;

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

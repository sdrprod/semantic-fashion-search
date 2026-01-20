import { NextRequest, NextResponse } from 'next/server';
import { semanticSearch } from '@/lib/search';
import { generateCacheKey, getCachedSearch, setCachedSearch } from '@/lib/redis';
import type { SearchResponse } from '@/types';

export async function POST(request: NextRequest) {
  console.log('[Search API] Request received');

  try {
    const body = await request.json();
    const { query, limit = 12, page = 1 } = body;

    console.log('[Search API] Query params:', { query, limit, page });

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
    const cacheKey = generateCacheKey(query.trim(), {
      allowSexyContent: hasSexyIntent,
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

    // Perform semantic search - get ALL results (page 1 with large limit)
    const searchResponse = await semanticSearch(query.trim(), {
      limit: 120, // Fetch all results at once
      page: 1,
      allowSexyContent: hasSexyIntent,
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
    console.error('[Search API] Error:', err);
    console.error('[Search API] Error stack:', err instanceof Error ? err.stack : 'No stack trace');
    return NextResponse.json(
      { error: 'Internal server error.' },
      { status: 500 }
    );
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 });
}

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

    // Generate cache key
    const cacheKey = generateCacheKey(query.trim(), {
      limit: validatedLimit,
      page: validatedPage,
      allowSexyContent: hasSexyIntent,
    });

    // Check cache first
    const cachedResults = await getCachedSearch<SearchResponse>(cacheKey);
    if (cachedResults) {
      console.log('[Search API] Returning cached results ⚡');
      return NextResponse.json(cachedResults);
    }

    console.log('[Search API] Starting semantic search...');

    // Perform semantic search with intent extraction
    const searchResponse = await semanticSearch(query.trim(), {
      limit: validatedLimit,
      page: validatedPage,
      allowSexyContent: hasSexyIntent, // Pass through the user intent
    });

    console.log('[Search API] Search complete, results:', searchResponse.results.length);

    // Cache the results (1 hour TTL)
    await setCachedSearch(cacheKey, searchResponse, 3600);

    return NextResponse.json(searchResponse);
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

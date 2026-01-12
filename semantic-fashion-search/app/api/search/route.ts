import { NextRequest, NextResponse } from 'next/server';
import { semanticSearch } from '@/lib/search';

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

    console.log('[Search API] Starting semantic search...');

    // Perform semantic search with intent extraction
    const searchResponse = await semanticSearch(query.trim(), {
      limit: validatedLimit,
      page: validatedPage,
    });

    console.log('[Search API] Search complete, results:', searchResponse.results.length);

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

import { NextRequest, NextResponse } from 'next/server';
import { semanticSearch } from '@/lib/search';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, limit = 10, page = 1 } = body;

    // Validate query
    if (!query || typeof query !== 'string' || query.trim().length < 3) {
      return NextResponse.json(
        { error: 'Query must be at least 3 characters.' },
        { status: 400 }
      );
    }

    // Validate pagination params
    const validatedLimit = Math.min(Math.max(1, limit), 50);
    const validatedPage = Math.max(1, page);

    // Perform semantic search with intent extraction
    const searchResponse = await semanticSearch(query.trim(), {
      limit: validatedLimit,
      page: validatedPage,
    });

    return NextResponse.json(searchResponse);
  } catch (err) {
    console.error('Search error:', err);
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

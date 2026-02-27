import { NextRequest, NextResponse } from 'next/server';
import { extractIntent } from '@/lib/intent';
import { refineResults } from '@/lib/search';
import type { Product, ParsedIntent } from '@/types';

interface RefineRequest {
  currentResults: Product[];
  refinementQuery: string;
  userRatings?: { [id: string]: number };
}

export async function POST(request: NextRequest) {
  try {
    const body: RefineRequest = await request.json();
    const { currentResults, refinementQuery, userRatings = {} } = body;

    console.log('[Refine API] Refining', currentResults.length, 'results with query:', refinementQuery);

    if (!refinementQuery || typeof refinementQuery !== 'string' || refinementQuery.trim().length < 2) {
      return NextResponse.json(
        { error: 'Refinement query must be at least 2 characters.' },
        { status: 400 }
      );
    }

    if (!Array.isArray(currentResults) || currentResults.length === 0) {
      return NextResponse.json(
        {
          results: [],
          totalCount: 0,
          intent: {
            searchQueries: [],
          },
        },
        { status: 200 }
      );
    }

    // Extract intent from refinement query
    console.log('[Refine API] Extracting intent from refinement query...');
    const refinementIntent = await extractIntent(refinementQuery);
    console.log('[Refine API] Extracted intent:', refinementIntent);

    // Re-rank current results based on new intent
    console.log('[Refine API] Re-ranking results...');
    const rerankedResults = await refineResults(currentResults, refinementIntent, userRatings);

    console.log('[Refine API] Refinement complete, returning', rerankedResults.length, 'results');

    return NextResponse.json(
      {
        results: rerankedResults.slice(0, 100),
        totalCount: rerankedResults.length,
        intent: refinementIntent,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error('[Refine API] Error:', err instanceof Error ? err.message : String(err));

    return NextResponse.json(
      {
        error: 'Failed to refine results',
        details: err instanceof Error ? err.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 });
}

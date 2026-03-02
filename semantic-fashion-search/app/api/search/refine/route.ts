import { NextRequest, NextResponse } from 'next/server';
import { refineResultsSemantically, RefinementFilters } from '@/lib/search';
import type { Product } from '@/types';

interface RefineRequest {
  currentResults: Product[];
  refinementQuery: string;
  originalQuery?: string;
  userRatings?: { [id: string]: number };
}

/**
 * Extract a numeric price range from natural language.
 * Returns null if no price constraint is detected.
 */
function extractPriceRange(query: string): { min: number | null; max: number | null } | null {
  const lower = query.toLowerCase();
  const between = lower.match(/between\s+\$?(\d+)\s+and\s+\$?(\d+)/);
  if (between) return { min: +between[1], max: +between[2] };
  const under = lower.match(/(?:under|below|less\s+than|max|at\s+most)\s+\$?(\d+)/);
  if (under) return { min: null, max: +under[1] };
  const over = lower.match(/(?:over|above|more\s+than|min|at\s+least)\s+\$?(\d+)/);
  if (over) return { min: +over[1], max: null };
  return null;
}

/**
 * Detect an explicit color negation: "except black", "not red", "without white", etc.
 * Returns the excluded color word, or null if no negation is present.
 *
 * This is the one attribute that embedding similarity cannot handle — a product
 * embedding for "black shoes" has *high* similarity to the query "not black shoes",
 * so a logical NOT must be applied as a hard filter rather than via semantics.
 */
function extractColorExclusion(query: string): string | null {
  const lower = query.toLowerCase();
  const match = lower.match(
    /\b(?:except|without|excluding|other\s+than|anything\s+but|not|no)\s+(?:the\s+|colou?r\s+)?([a-z-]+(?:\s+[a-z-]+)?)\b/
  );
  return match ? match[1].trim() : null;
}

export async function POST(request: NextRequest) {
  try {
    const body: RefineRequest = await request.json();
    const { currentResults, refinementQuery, userRatings = {} } = body;

    if (!refinementQuery || typeof refinementQuery !== 'string' || refinementQuery.trim().length < 2) {
      return NextResponse.json(
        { error: 'Refinement query must be at least 2 characters.' },
        { status: 400 }
      );
    }

    if (!Array.isArray(currentResults) || currentResults.length === 0) {
      return NextResponse.json({ results: [], totalCount: 0 }, { status: 200 });
    }

    const query = refinementQuery.trim();
    console.log('[Refine API] Refining', currentResults.length, 'results with:', query);

    // Build the two hard filters that semantic similarity cannot handle
    const filters: RefinementFilters = {};
    const priceRange = extractPriceRange(query);
    if (priceRange) filters.priceRange = priceRange;
    const excludeColor = extractColorExclusion(query);
    if (excludeColor) filters.excludeColor = excludeColor;

    const results = await refineResultsSemantically(currentResults, query, filters, userRatings);

    console.log('[Refine API] Refinement complete, returning', results.length, 'results');

    return NextResponse.json(
      { results: results.slice(0, 100), totalCount: results.length },
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

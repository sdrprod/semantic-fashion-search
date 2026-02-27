import { NextRequest, NextResponse } from 'next/server';
import { extractIntent } from '@/lib/intent';
import { refineResults } from '@/lib/search';
import type { Product, ParsedIntent } from '@/types';

interface RefineRequest {
  currentResults: Product[];
  refinementQuery: string;
  userRatings?: { [id: string]: number };
}

const COLOR_LIST = [
  'black','white','red','blue','navy','green','yellow','orange','purple','pink',
  'brown','beige','cream','grey','gray','gold','silver','tan','burgundy','maroon',
  'olive','coral','ivory','nude','rose','blush','khaki','camel','emerald','lavender',
  'teal','turquoise','cobalt','champagne','charcoal','off-white','off white',
];

const CATEGORY_MAP: Record<string, string[]> = {
  'dress':    ['dress','dresses','gown','gowns','sundress','maxi','midi','mini dress'],
  'skirt':    ['skirt','skirts'],
  'blouse':   ['blouse','blouses'],
  'top':      ['top','tops','cami','camisole','tank','tee','t-shirt'],
  'shirt':    ['shirt','shirts','button-down','button down'],
  'pants':    ['pants','trousers','jeans','leggings','chinos','joggers','culottes'],
  'shorts':   ['shorts'],
  'shoes':    ['shoes','heels','boots','sandals','sneakers','loafers','flats','pumps','mules','clogs'],
  'bag':      ['bag','bags','purse','handbag','tote','clutch','backpack','satchel'],
  'jacket':   ['jacket','coat','blazer','trench','parka','outerwear'],
  'sweater':  ['sweater','knit','cardigan','pullover','hoodie'],
  'jumpsuit': ['jumpsuit','romper','playsuit'],
  'suit':     ['suit','suits','pantsuit'],
};

/**
 * Fast local parser for common fashion refinement attributes.
 * Handles colors, garment types, and price ranges without calling Claude.
 * Returns null if the query is too complex — caller should fall back to extractIntent().
 */
function fastParseRefinementIntent(query: string): ParsedIntent | null {
  const lower = query.toLowerCase();

  let color: string | null = null;
  for (const c of COLOR_LIST) {
    if (lower.includes(c)) { color = c; break; }
  }

  let primaryItem: string | undefined;
  for (const [item, keywords] of Object.entries(CATEGORY_MAP)) {
    if (keywords.some(k => lower.includes(k))) { primaryItem = item; break; }
  }

  let priceRange: { min: number | null; max: number | null } | undefined;
  const betweenMatch = lower.match(/between\s+\$?(\d+)\s+and\s+\$?(\d+)/);
  const underMatch   = lower.match(/(?:under|below|less than|max|at most)\s+\$?(\d+)/);
  const overMatch    = lower.match(/(?:over|above|more than|min|at least)\s+\$?(\d+)/);
  if (betweenMatch) priceRange = { min: +betweenMatch[1], max: +betweenMatch[2] };
  else if (underMatch) priceRange = { min: null, max: +underMatch[1] };
  else if (overMatch)  priceRange = { min: +overMatch[1], max: null };

  // If we couldn't extract anything useful, let Claude handle it
  if (!color && !primaryItem && !priceRange) return null;

  const parts = [color, primaryItem].filter(Boolean);
  const priceDesc = priceRange?.max ? ` under $${priceRange.max}` : priceRange?.min ? ` over $${priceRange.min}` : '';

  return {
    color,
    primaryItem,
    priceRange,
    style: [],
    constraints: [],
    secondaryItems: [],
    searchQueries: [],
    explanation: `Showing ${parts.join(' ')}${priceDesc} results.`,
  };
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
          intent: { searchQueries: [] },
        },
        { status: 200 }
      );
    }

    // Try fast local parser first (instant, no API call)
    let refinementIntent = fastParseRefinementIntent(refinementQuery.trim());
    if (refinementIntent) {
      console.log('[Refine API] Fast parser handled query, skipping Claude');
    } else {
      // Complex query — fall back to Claude intent extraction
      console.log('[Refine API] Fast parser insufficient, extracting intent with Claude...');
      refinementIntent = await extractIntent(refinementQuery);
      console.log('[Refine API] Extracted intent:', refinementIntent);
    }

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

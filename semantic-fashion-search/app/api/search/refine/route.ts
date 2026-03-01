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
// Qualifier words that modify a category (e.g. "hiking boots", "rain jacket").
// The fast parser can't understand these — fall back to Claude so the qualifier
// is captured in ParsedIntent.style / ParsedIntent.constraints.
const CATEGORY_QUALIFIERS = [
  'hiking', 'running', 'trail', 'rain', 'snow', 'winter', 'summer', 'spring', 'fall',
  'athletic', 'workout', 'sport', 'sports', 'gym', 'outdoor', 'waterproof', 'insulated',
  'warm', 'lightweight', 'casual', 'formal', 'business', 'office', 'work',
  'comfortable', 'stretchy', 'slim', 'oversized', 'fitted',
];

function fastParseRefinementIntent(query: string): ParsedIntent | null {
  const lower = query.toLowerCase();

  // If the query contains a qualifier word that modifies a category, the fast parser
  // can't handle it correctly — fall back to Claude for proper intent extraction.
  if (CATEGORY_QUALIFIERS.some(q => lower.includes(q))) return null;

  // --- Color detection (negation must be checked BEFORE positive) ---
  // Match patterns like "except black", "not black", "without black",
  // "no black", "anything but black", "other than black", "all colors except black"
  const negationPattern = /\b(?:except|without|excluding|other\s+than|anything\s+but|all\s+colou?rs?\s+except|every\s+colou?r\s+(?:except|but)|no)\s+(?:the\s+|colou?r\s+)?(\S+)/;
  const negationMatch = lower.match(negationPattern);

  let excludeColor: string | null = null;
  let color: string | null = null;

  if (negationMatch) {
    // Check if the captured word is a known color
    const candidate = negationMatch[1].replace(/[^a-z-]/g, '');
    if (COLOR_LIST.includes(candidate)) {
      excludeColor = candidate;
    }
  }

  // Only look for a positive color if no exclusion was detected
  if (!excludeColor) {
    for (const c of COLOR_LIST) {
      if (lower.includes(c)) { color = c; break; }
    }
  }

  // Store the actual matched keyword (e.g. "heels"), not the canonical key ("shoes").
  // refineResults does a literal title check against primaryItem, so "heels" must
  // produce "heel"/"heels" title matches — not "shoes".
  let primaryItem: string | undefined;
  outer: for (const keywords of Object.values(CATEGORY_MAP)) {
    for (const keyword of keywords) {
      if (lower.includes(keyword)) {
        primaryItem = keyword;
        break outer;
      }
    }
  }

  let priceRange: { min: number | null; max: number | null } | undefined;
  const betweenMatch = lower.match(/between\s+\$?(\d+)\s+and\s+\$?(\d+)/);
  const underMatch   = lower.match(/(?:under|below|less than|max|at most)\s+\$?(\d+)/);
  const overMatch    = lower.match(/(?:over|above|more than|min|at least)\s+\$?(\d+)/);
  if (betweenMatch) priceRange = { min: +betweenMatch[1], max: +betweenMatch[2] };
  else if (underMatch) priceRange = { min: null, max: +underMatch[1] };
  else if (overMatch)  priceRange = { min: +overMatch[1], max: null };

  // If we couldn't extract anything useful, let Claude handle it
  if (!color && !excludeColor && !primaryItem && !priceRange) return null;

  const parts = [color, primaryItem].filter(Boolean);
  const priceDesc = priceRange?.max ? ` under $${priceRange.max}` : priceRange?.min ? ` over $${priceRange.min}` : '';
  const explanation = excludeColor
    ? `Showing all colors except ${excludeColor}.`
    : `Showing ${parts.join(' ')}${priceDesc} results.`;

  return {
    color,
    excludeColor,
    primaryItem,
    priceRange,
    style: [],
    constraints: [],
    secondaryItems: [],
    searchQueries: [],
    explanation,
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

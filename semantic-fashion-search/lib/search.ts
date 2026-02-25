import { getSupabaseClient, ProductRow } from './supabase';
import { generateEmbedding, generateEmbeddings } from './embeddings';
import { extractIntent, isSimpleQuery, createSimpleIntent, classifySearchMode } from './intent';
import type { SearchMode } from './intent';
import { rerankWithVision, shouldUseVisionReranking } from './vision-reranking';
import { generateClipTextEmbedding, clipCosineSimilarity } from './clip-query';
import type { Product, SearchResponse, ParsedIntent, SearchQuery } from '@/types';

// Quality filter settings cache
interface QualityFilterSettings {
  minPriceThreshold: number;
  enableMensFilter: boolean;
  enablePriceFilter: boolean;
  enableNonApparelFilter: boolean;
  searchMode: SearchMode;
  hybridVectorWeight: number;
  hybridTextWeight: number;
}

// Database row type for search_settings
interface SearchSettingsRow {
  min_price_threshold: number;
  enable_mens_filter: boolean;
  enable_price_filter: boolean;
  enable_non_apparel_filter: boolean;
  search_mode: SearchMode | null;
  hybrid_vector_weight: number | null;
  hybrid_text_weight: number | null;
}

let cachedSettings: QualityFilterSettings | null = null;
let settingsCacheTime: number = 0;
const SETTINGS_CACHE_TTL = 60000; // 1 minute

/**
 * Fetch quality filter settings from database with caching
 */
async function getQualityFilterSettings(): Promise<QualityFilterSettings> {
  // Return cached settings if still fresh
  if (cachedSettings && Date.now() - settingsCacheTime < SETTINGS_CACHE_TTL) {
    return cachedSettings;
  }

  try {
    const supabase = getSupabaseClient(true);
    const { data, error } = await supabase
      .from('search_settings')
      .select('min_price_threshold, enable_mens_filter, enable_price_filter, enable_non_apparel_filter, search_mode, hybrid_vector_weight, hybrid_text_weight')
      .eq('id', '00000000-0000-0000-0000-000000000001')
      .single<SearchSettingsRow>();

    if (error) {
      console.error('[getQualityFilterSettings] Database error:', error);
      return {
        minPriceThreshold: 5.00,
        enableMensFilter: true,
        enablePriceFilter: true,
        enableNonApparelFilter: true,
        searchMode: 'auto',
        hybridVectorWeight: 0.60,
        hybridTextWeight: 0.40,
      };
    }

    if (!data) {
      console.warn('[getQualityFilterSettings] No settings found, using defaults');
      return {
        minPriceThreshold: 5.00,
        enableMensFilter: true,
        enablePriceFilter: true,
        enableNonApparelFilter: true,
        searchMode: 'auto',
        hybridVectorWeight: 0.60,
        hybridTextWeight: 0.40,
      };
    }

    cachedSettings = {
      minPriceThreshold: data.min_price_threshold,
      enableMensFilter: data.enable_mens_filter,
      enablePriceFilter: data.enable_price_filter,
      enableNonApparelFilter: data.enable_non_apparel_filter,
      searchMode: data.search_mode ?? 'auto',
      hybridVectorWeight: data.hybrid_vector_weight ?? 0.60,
      hybridTextWeight: data.hybrid_text_weight ?? 0.40,
    };
    settingsCacheTime = Date.now();

    return cachedSettings;
  } catch (error) {
    console.error('[getQualityFilterSettings] Error fetching settings:', error);
    return {
      minPriceThreshold: 5.00,
      enableMensFilter: true,
      enablePriceFilter: true,
      enableNonApparelFilter: true,
      searchMode: 'auto' as SearchMode,
      hybridVectorWeight: 0.60,
      hybridTextWeight: 0.40,
    };
  }
}

interface SearchOptions {
  limit?: number;
  page?: number;
  similarityThreshold?: number;
  diversityFactor?: number;
  allowSexyContent?: boolean; // Explicitly allow sexy/provocative content
  userRatings?: { [productId: string]: number }; // User's personal ratings (1-5)
  skipVisionReranking?: boolean; // Skip vision re-ranking (for pagination to avoid timeout)
}

/**
 * Fetch pre-populated demo products for live presentations
 */
async function getDemoSearchResults(limit: number = 12, page: number = 1): Promise<SearchResponse> {
  const DEMO_TRIGGER = 'Modern long black dress with a romantic neckline for a formal evening event';
  try {
    const supabase = getSupabaseClient(true);

    // Fetch all demo products
    const { data: demoProductsData, error } = await supabase
      .from('demo_products')
      .select('*')
      .eq('demo_trigger', DEMO_TRIGGER)
      .order('price', { ascending: false });

    if (error || !demoProductsData) {
      console.error('[getDemoSearchResults] Error fetching demo products:', error);
      return {
        query: DEMO_TRIGGER,
        results: [],
        totalCount: 0,
        intent: {
          searchQueries: [{ query: 'black dress formal evening', category: 'dresses', priority: 1, weight: 1.0 }],
          primaryItem: 'dress',
          priceRange: undefined,
          occasion: 'formal evening',
          style: ['romantic', 'elegant', 'black'],
        },
        qualityWarning: 'Demo products not available',
      };
    }

    // Convert demo products to Product type
    const demoProducts = demoProductsData as any[];
    const products: Product[] = demoProducts.map(p => ({
      id: p.id,
      brand: p.brand,
      title: p.title,
      description: p.description || '',
      price: parseFloat(p.price) || 0,
      currency: p.currency || 'USD',
      imageUrl: p.image_url,
      productUrl: p.product_url,
      verifiedColors: Array.isArray(p.verified_colors) ? p.verified_colors : [],
      similarity: 0.95, // Demo products are perfect matches
    }));

    // Paginate results
    const startIdx = (page - 1) * limit;
    const paginatedProducts = products.slice(startIdx, startIdx + limit);

    console.log(`[getDemoSearchResults] Returned ${paginatedProducts.length} demo products (page ${page}, total ${products.length})`);

    return {
      query: DEMO_TRIGGER,
      results: paginatedProducts,
      totalCount: products.length,
      intent: {
        searchQueries: [{ query: 'black dress formal evening', category: 'dresses', priority: 1, weight: 1.0 }],
        primaryItem: 'dress',
        priceRange: undefined,
        occasion: 'formal evening',
        style: ['romantic', 'elegant', 'black'],
      },
      qualityWarning: undefined,
    };
  } catch (error) {
    console.error('[getDemoSearchResults] Error:', error);
    return {
      query: DEMO_TRIGGER,
      results: [],
      totalCount: 0,
      intent: {
        searchQueries: [{ query: 'black dress formal evening', category: 'dresses', priority: 1, weight: 1.0 }],
        primaryItem: 'dress',
      },
      qualityWarning: 'Demo search encountered an error',
    };
  }
}

/**
 * Detect if query is asking to see "everything" or "all items"
 * These queries should show broad results without aggressive filtering
 */
function detectBroadQuery(query: string): boolean {
  const broadPatterns = [
    /show\s+me\s+everything/i,
    /show\s+me\s+all/i,
    /\ball\b.*\b(?:items?|products?|dresses?|tops?|pants?|shoes?|bags?)/i,
    /everything\s+you\s+have/i,
    /all\s+of\s+your/i,
    /\bevery\b.*\b(?:items?|products?|dresses?|tops?|pants?|shoes?)/i,
    /what.*do\s+you\s+have\s+in/i,
    /browse/i,
    /catalog/i,
    // Simple 1-2 word category queries from nav (user is browsing, not searching for something specific)
    /^(?:footwear|shoes?|boots?|heels?|sneakers?|sandals?|loafers?|flats?|mules?|pumps?|wedges?)$/i,
    /^(?:dresses?|skirts?|tops?|blouses?|pants?|jeans?|activewear|swimwear|outerwear|leggings?|shorts?)$/i,
    /^(?:accessories|jewelry|jewellery|handbags?|bags?|wallets?|scarves?|sunglasses?|shades?)$/i,
    /^(?:hats?|caps?|beanies?|fedoras?|berets?|belts?|wraps?|shawls?|gloves?)$/i,
    /^(?:necklaces?|earrings?|bracelets?|rings?|pendants?|bangles?|brooches?)$/i,
    /^(?:jewelry\s+sets?|scarves?\s+and\s+wraps?|handbags?\s+and\s+totes?)$/i,
    /^women'?s?\s+clothing$/i,
    /^men'?s?\s+clothing$/i,
    /^(?:clothing|fashion|apparel|style)$/i,
    /^(?:flats?\s+and\s+loafers?|tops?\s+and\s+blouses?|pants?\s+and\s+jeans?)$/i,
    /^(?:hats?\s+and\s+caps?|scarves?\s+and\s+wraps?)$/i,
    // Two-word nav queries (the "X & Y" items with "and" removed)
    /^(?:pants?\s+jeans?|tops?\s+blouses?|flats?\s+loafers?|handbags?\s+totes?|scarves?\s+wraps?)$/i,
  ];

  return broadPatterns.some(pattern => pattern.test(query));
}

/**
 * Curated FTS browse terms — only unambiguous garment NOUNS.
 *
 * Unlike generateSearchTermVariations (designed for ILIKE/vector matching),
 * this map excludes style adjectives like "maxi" and "midi" that cause
 * cross-category false positives in full-text search. FTS stemming already
 * handles those: searching for "dress" catches "Maxi Dress" because "dress"
 * is a word in that title. We never need "maxi" as a standalone search term.
 *
 * Keyed by the de-pluralized root of broad category nav items.
 * Specific garment words (e.g. "skirt", "jeans") don't appear here —
 * they're used directly in the FTS query without expansion.
 */
const FTS_CATEGORY_TERMS: Record<string, string[]> = {
  dress: ['dress', 'gown', 'sundress', 'romper', 'jumpsuit', 'frock'],
  shoe: ['shoe', 'heel', 'boot', 'sandal', 'sneaker', 'loafer', 'pump', 'slipper', 'mule', 'wedge', 'oxford'],
  top: ['top', 'blouse', 'shirt', 'sweater', 'cardigan', 'tunic', 'camisole', 'pullover', 'hoodie'],
  bag: ['bag', 'purse', 'handbag', 'tote', 'clutch', 'backpack', 'satchel', 'wallet'],
  outerwear: ['jacket', 'coat', 'blazer', 'vest', 'parka', 'trench', 'windbreaker'],
  jewelry: ['necklace', 'earring', 'bracelet', 'pendant', 'bangle', 'brooch', 'choker', 'anklet'],
};

/**
 * Direct DB query for nav category browsing — bypasses vector search entirely.
 * Uses PostgreSQL full-text search (websearch_to_tsquery) for word-boundary-aware
 * matching: "top" matches "top"/"tops" but NOT "laptop"/"stopper".
 * Paginated server-side. Used when isBroadQuery=true.
 */
async function browseCategorySearch(
  searchQueries: SearchQuery[],
  settings: QualityFilterSettings,
  page: number,
  limit: number,
): Promise<{ products: Product[]; totalCount: number }> {
  const supabase = getSupabaseClient(true);

  // Build FTS terms: for single broad categories (e.g. "Dresses"), expand via
  // curated garment-noun map. For multi-term nav queries (e.g. "pants jeans"),
  // use each word directly — FTS stemming handles plurals automatically.
  const allTerms = new Set<string>();
  for (const sq of searchQueries) {
    if (searchQueries.length === 1) {
      // Single broad category — check for curated expansion
      const word = sq.query.toLowerCase();
      const stem = word.endsWith('sses') ? word.slice(0, -2)
        : word === 'scarves' ? 'scarf'
        : word.replace(/s$/, '') || word;
      const expansion = FTS_CATEGORY_TERMS[stem];
      if (expansion) {
        expansion.forEach(t => allTerms.add(t));
      } else {
        // No expansion (e.g. "skirts" → "skirt") — use word directly
        allTerms.add(word);
      }
    } else {
      // Multi-term nav query (e.g. "pants jeans") — use each word directly
      allTerms.add(sq.query.toLowerCase());
    }
  }

  const ftsQuery = [...allTerms].join(' OR ');
  console.log(`[browseCategorySearch] FTS query: ${ftsQuery}`);

  // Determine if we're browsing a garment category (as opposed to shoes/bags/jewelry).
  // Garment pages need cross-category exclusions to prevent accessories that merely
  // reference a garment ("chain belt for dresses", "belt for skirt/jeans") from showing.
  const garmentStems = new Set(['dress', 'skirt', 'top', 'blouse', 'pant', 'jean',
    'legging', 'short', 'sweater', 'cardigan', 'tunic', 'camisole', 'pullover',
    'hoodie', 'outerwear', 'jacket', 'coat', 'blazer']);
  const isGarmentBrowse = [...allTerms].some(t =>
    garmentStems.has(t) || garmentStems.has(t.replace(/s$/, ''))
  );

  // Build query — count:exact gives us the total for pagination
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let q: any = supabase
    .from('products')
    .select(
      'id, brand, title, description, price, currency, image_url, product_url, merchant_name, on_sale, verified_colors, tags',
      { count: 'exact' }
    )
    .textSearch('title', ftsQuery, { type: 'websearch', config: 'english' })
    .not('image_url', 'is', null)
    .neq('image_url', '');

  // Cross-category exclusions for garment browse pages.
  // These ILIKE patterns match accessories/hardware that mention a garment
  // in usage context ("chain belt for dresses") rather than being the garment.
  if (isGarmentBrowse) {
    const accessoryPhrases = [
      '%chain belt%',  // chain belt accessories
      '%sash belt%',   // sash belt accessories
      '%rope belt%',   // rope/tassel belt accessories
      '%waist belt%',  // waist belt accessories
      '%belly belt%',  // belly chain belt
      '%belt for%',    // "belt for dresses/skirts/jeans"
      '%dress up%',    // "dress up costume" / halloween
    ];
    for (const phrase of accessoryPhrases) {
      q = q.not('title', 'ilike', phrase);
    }
    console.log(`[browseCategorySearch] 🚫 Applying ${accessoryPhrases.length} garment cross-exclusions`);
  }

  if (settings.enablePriceFilter && settings.minPriceThreshold > 0) {
    q = q.gte('price', settings.minPriceThreshold);
  }

  // Safe server-side men's filter: "women's" does NOT contain "men's" as a substring
  if (settings.enableMensFilter) {
    q = q.not('title', 'ilike', "%men's%");
  }

  const startIndex = (page - 1) * limit;
  const { data, error, count } = await q
    .order('price', { ascending: true, nullsFirst: false })
    .range(startIndex, startIndex + limit - 1);

  if (error || !data) {
    console.error('[browseCategorySearch] Query error:', error);
    return { products: [], totalCount: 0 };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const products: Product[] = (data as any[]).map(row => ({
    id: row.id,
    brand: row.brand || '',
    title: row.title || '',
    description: row.description || '',
    price: row.price,
    currency: row.currency || 'USD',
    imageUrl: row.image_url || '',
    productUrl: row.product_url || '',
    merchantName: row.merchant_name,
    onSale: row.on_sale,
    verifiedColors: row.verified_colors,
    tags: row.tags || [],
    similarity: 1.0, // not a similarity-ranked result
  }));

  return { products, totalCount: count ?? 0 };
}

/**
 * Perform semantic search with intent extraction
 */
export async function semanticSearch(
  query: string,
  options: SearchOptions = {}
): Promise<SearchResponse> {
  const {
    limit = 12,
    page = 1,
    similarityThreshold = 0.3,  // Back to 0.3 with proper embeddings
    diversityFactor = 0.1,
    allowSexyContent = false, // Default to filtering sexy content
    userRatings = {}, // User's personal ratings (session or persistent)
    skipVisionReranking = false, // Skip vision re-ranking (for pagination)
  } = options;

  // CHECK FOR DEMO MODE - exact match on demo trigger phrase
  const DEMO_TRIGGER = 'Modern long black dress with a romantic neckline for a formal evening event';
  if (query.toLowerCase().trim() === DEMO_TRIGGER.toLowerCase().trim()) {
    console.log('[semanticSearch] 🎬 DEMO MODE ACTIVATED - Returning pre-populated demo results');
    return await getDemoSearchResults(limit, page);
  }

  // Detect broad queries that want to see "everything" in a category/color
  const isBroadQuery = detectBroadQuery(query);
  console.log(`[semanticSearch] Query type: ${isBroadQuery ? 'BROAD (show everything)' : 'SPECIFIC (targeted)'}`);

  // Determine if we need full intent extraction or simple search.
  // Broad queries (nav browsing) also use the simple path — no LLM needed
  // since the user is just clicking a category link, not describing an outfit.
  let intent: ParsedIntent;

  if (isSimpleQuery(query) || isBroadQuery) {
    intent = createSimpleIntent(query);
  } else {
    intent = await extractIntent(query);
  }

  // SHORTCUT: For nav category browsing, skip vector search and query the DB directly.
  // browseCategorySearch uses ILIKE title matching — fast, no embedding needed, returns
  // ALL matching products (paginated), and is immune to the sexy-product filter that
  // incorrectly blocks e.g. "thong sandals" or "mesh dresses" from category pages.
  if (isBroadQuery && intent.searchQueries.every(sq => sq.category !== 'all')) {
    console.log(
      `[semanticSearch] 🛍️ Browse mode: direct DB query for ` +
      `${intent.searchQueries.map(sq => sq.query).join(' + ')}`
    );
    const settings = await getQualityFilterSettings();
    const { products, totalCount } = await browseCategorySearch(
      intent.searchQueries,
      settings,
      page,
      limit,
    );
    console.log(
      `[semanticSearch] 🛍️ Browse results: ${products.length} on page ${page}, ${totalCount} total`
    );
    return { query, results: products, totalCount, page, pageSize: limit, intent };
  }

  // Fetch results sized for query type:
  // Simple queries: 50 raw → ~25-35 filtered (fast)
  // Complex queries: 100 raw → ~50-70 filtered (more coverage)
  const initialFetchSize = isSimpleQuery(query) ? 50 : 100;
  const poolSize = initialFetchSize; // Will implement lazy-loading for additional pages

  const searchResults = await executeMultiSearch(
    intent.searchQueries,
    poolSize,
    similarityThreshold,
    allowSexyContent
  );

  // Merge and rank ALL results from the pool
  const allRankedResults = rankResults(
    searchResults,
    intent.searchQueries,
    poolSize,
    diversityFactor
  );

  // Apply tiered quality thresholds - higher bar for top results
  // BUT: Be more lenient for broad queries (user wants to see everything)
  const qualityFilteredResults = allRankedResults.filter((product, index) => {
    let requiredSimilarity = similarityThreshold;

    // For broad queries, lower the threshold significantly to show more results
    if (isBroadQuery) {
      requiredSimilarity = similarityThreshold - 0.1; // 0.2 instead of 0.3
    }
    // For specific queries, apply tiered quality thresholds
    else {
      // Top result: require +0.10 similarity boost (minimum 0.40 for best match)
      if (index === 0) {
        requiredSimilarity = similarityThreshold + 0.10;
      }
      // Results 2-3: require +0.07 similarity boost (minimum 0.37)
      else if (index < 3) {
        requiredSimilarity = similarityThreshold + 0.07;
      }
      // Results 4-6: require +0.05 similarity boost (minimum 0.35)
      else if (index < 6) {
        requiredSimilarity = similarityThreshold + 0.05;
      }
      // Results 7-12: require +0.02 similarity boost (minimum 0.32)
      else if (index < 12) {
        requiredSimilarity = similarityThreshold + 0.02;
      }
      // Results 13+: use base threshold (minimum 0.30)
    }

    const passes = (product.similarity || 0) >= requiredSimilarity;

    if (!passes) {
      console.log(
        `[semanticSearch] ⚠️ Filtered result #${index + 1} for insufficient quality: ` +
        `"${product.title?.slice(0, 50)}..." ` +
        `(similarity: ${product.similarity?.toFixed(3)}, required: ${requiredSimilarity.toFixed(3)})`
      );
    }

    return passes;
  });

  console.log(
    `[semanticSearch] Quality filtering: ${allRankedResults.length} → ${qualityFilteredResults.length} results ` +
    `(filtered ${allRankedResults.length - qualityFilteredResults.length})`
  );

  // Apply color filtering if user specified a color
  let colorFilteredResults = qualityFilteredResults;
  let colorMatchCount = 0;

  if (intent.color) {
    console.log(`[semanticSearch] 🎨 User specified color: "${intent.color}"`);

    // Check each product for color match
    colorFilteredResults = qualityFilteredResults.map((product, index) => {
      const matchesColor = productMatchesColor(product, intent.color!);
      if (matchesColor) colorMatchCount++;

      return { ...product, matchesColor };
    });

    // Sort to prioritize color matches at the top
    colorFilteredResults.sort((a, b) => {
      // Both match or both don't match: maintain similarity order
      if (a.matchesColor === b.matchesColor) {
        return (b.similarity || 0) - (a.similarity || 0);
      }
      // Color matches come first
      return b.matchesColor ? 1 : -1;
    });

    console.log(`[semanticSearch] 🎨 Color matches: ${colorMatchCount}/${colorFilteredResults.length}`);

    // CRITICAL: For color queries, ALWAYS filter strictly to only show matching colors
    // Users expect "black dress" to show ONLY black dresses, not blue/red/yellow ones
    if (colorMatchCount > 0) {
      console.log(`[semanticSearch] 🎯 Applying strict color filter - removing non-matching items`);
      colorFilteredResults = colorFilteredResults.filter(p => p.matchesColor);
      console.log(`[semanticSearch] 🎨 After strict color filtering: ${colorFilteredResults.length} results`);
    } else {
      // No color matches at all - show all results but warn
      console.log(`[semanticSearch] ⚠️ No color matches found for "${intent.color}" - showing all results`);
    }
  }

  // Apply category filtering if user specified a garment type
  let categoryFilteredResults = colorFilteredResults;
  let categoryMatchCount = 0;

  // Get primary category from the first search query (highest priority)
  const primaryCategory = intent.searchQueries && intent.searchQueries.length > 0
    ? intent.searchQueries[0].category
    : 'all';

  if (primaryCategory && primaryCategory !== 'all') {
    console.log(`[semanticSearch] 👔 User specified category: "${primaryCategory}"`);

    // Check each product for category match type (exact, partial, or none)
    let exactMatchCount = 0;
    let partialMatchCount = 0;

    categoryFilteredResults = colorFilteredResults.map((product) => {
      const categoryMatchType = getCategoryMatchType(product, primaryCategory);
      const matchesCategory = categoryMatchType !== 'none';

      if (categoryMatchType === 'exact') exactMatchCount++;
      if (categoryMatchType === 'partial') partialMatchCount++;
      if (matchesCategory) categoryMatchCount++;

      return { ...product, matchesCategory, categoryMatchType };
    });

    // TIERED SORTING: Exact matches first, then partial matches, then by similarity
    categoryFilteredResults.sort((a, b) => {
      const aType = (a as any).categoryMatchType;
      const bType = (b as any).categoryMatchType;

      // Tier 1: Exact matches (highest priority)
      if (aType === 'exact' && bType !== 'exact') return -1;
      if (bType === 'exact' && aType !== 'exact') return 1;

      // Tier 2: Partial matches (medium priority)
      if (aType === 'partial' && bType === 'none') return -1;
      if (bType === 'partial' && aType === 'none') return 1;

      // Within same tier: sort by similarity
      return (b.similarity || 0) - (a.similarity || 0);
    });

    console.log(`[semanticSearch] 👔 Category matches: ${exactMatchCount} exact, ${partialMatchCount} partial, ${categoryMatchCount} total`);

    // CRITICAL: Filter out 'none' matches (completely unrelated items)
    // Keep exact and partial matches
    if (categoryMatchCount > 0) {
      console.log(`[semanticSearch] 🎯 Applying tiered category filter`);
      console.log(`[semanticSearch]    - Tier 1: ${exactMatchCount} exact matches (pure category)`);
      console.log(`[semanticSearch]    - Tier 2: ${partialMatchCount} partial matches (includes category)`);
      categoryFilteredResults = categoryFilteredResults.filter(p => p.matchesCategory);
      console.log(`[semanticSearch] 👔 After tiered filtering: ${categoryFilteredResults.length} results`);
    } else {
      // No category matches at all - show all results but warn
      console.log(`[semanticSearch] ⚠️ No category matches found for "${primaryCategory}" - showing all results`);
    }
  }

  // HYBRID BROWSE FIX: For broad nav queries, apply a title-based cross-category exclusion.
  // Vector search semantically ranks the correct garment type first, but accessories
  // marketed toward dress occasions (e.g. "Prom Dress Necklace", "Cocktail Dress Earring Set")
  // can have the category word in their title and slip through the category filter.
  // This ensures cleaner browsing results without blocking exact dress queries.
  if (isBroadQuery && primaryCategory !== 'all') {
    // Map of browse category → unambiguous title terms that indicate a DIFFERENT product type.
    // Terms are chosen to be specific enough that they won't appear in real garment titles
    // (e.g. 'necklace' won't appear in a real dress title, but WILL appear in jewelry).
    const browseExclusions: Record<string, string[]> = {
      dress: ['necklace', 'earring', 'bracelet', 'bangle', 'anklet', 'brooch'],
      tops: ['necklace', 'earring', 'bracelet', 'bangle', 'anklet', 'brooch'],
      bottoms: ['necklace', 'earring', 'bracelet', 'bangle', 'anklet', 'brooch'],
      shoes: ['necklace', 'earring', 'bracelet', 'bangle', 'anklet', 'brooch'],
      bags: ['necklace', 'earring', 'bracelet', 'bangle', 'anklet', 'brooch'],
      outerwear: ['necklace', 'earring', 'bracelet', 'bangle', 'anklet', 'brooch'],
    };
    const exclusions = browseExclusions[primaryCategory] ?? [];
    if (exclusions.length > 0) {
      const preExclCount = categoryFilteredResults.length;
      categoryFilteredResults = categoryFilteredResults.filter(product => {
        const titleLower = product.title.toLowerCase();
        return !exclusions.some(term => titleLower.includes(term));
      });
      if (preExclCount !== categoryFilteredResults.length) {
        console.log(
          `[semanticSearch] 🚫 Browse cross-category exclusion (${primaryCategory}): ` +
          `removed ${preExclCount - categoryFilteredResults.length} jewelry items ` +
          `from title scan (${categoryFilteredResults.length} remain)`
        );
      }
    }
  }

  // Apply price range filtering if user specified budget
  let priceFilteredResults = categoryFilteredResults;

  if (intent.priceRange && (intent.priceRange.min !== null || intent.priceRange.max !== null)) {
    const { min, max } = intent.priceRange;
    console.log(`[semanticSearch] 💰 Price range filter: $${min || '0'} - $${max || '∞'}`);

    priceFilteredResults = categoryFilteredResults.filter(product => {
      if (product.price === null || product.price === undefined) return false;

      const aboveMin = min === null || product.price >= min;
      const belowMax = max === null || product.price <= max;

      return aboveMin && belowMax;
    });

    console.log(`[semanticSearch] 💰 Price filtering: ${categoryFilteredResults.length} → ${priceFilteredResults.length} results`);
  }

  // CRITICAL: Apply vision-based re-ranking for queries with visual descriptors
  // This ensures "sexy boots" shows heeled/stiletto boots first, not work boots
  // NOTE: Only analyze first 6 products to stay under Netlify 10-second timeout
  // Each GPT-4 Vision call takes ~1-2 seconds, so 6 products = 6-12 seconds (safe)
  // SKIP on pagination to avoid timeout (pagination should use cached results)
  let visionRankedResults = priceFilteredResults;
  if (!skipVisionReranking && shouldUseVisionReranking(query) && priceFilteredResults.length > 0) {
    console.log(`[semanticSearch] 👁️ Query has visual descriptors - applying GPT-4 Vision re-ranking...`);
    try {
      visionRankedResults = await rerankWithVision(priceFilteredResults, query, 6);
      console.log(`[semanticSearch] 👁️ Vision re-ranking complete`);
    } catch (error) {
      console.error('[semanticSearch] ❌ Vision re-ranking failed, using original order:', error);
      visionRankedResults = priceFilteredResults;
    }
  } else if (skipVisionReranking) {
    console.log(`[semanticSearch] ⏭️ Skipping vision re-ranking (pagination request)`);
  }

  // FEATURE: Rating-based filtering and boosting (personal + community)
  let ratingFilteredResults = visionRankedResults;

  // Only apply rating filtering if user has ratings or we can fetch community stats
  const hasUserRatings = Object.keys(userRatings).length > 0;

  if (hasUserRatings && visionRankedResults.length > 0) {
    console.log(`[semanticSearch] ⭐ User has ${Object.keys(userRatings).length} ratings - applying personal filtering/boosting`);

    // Step 1: Fetch community stats for all products in results
    const productIds = visionRankedResults.map(p => p.id).join(',');
    let communityStats: { [key: string]: any } = {};

    try {
      // Construct full URL for stats API
      // In production (Netlify), detect the current host from environment
      let baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

      if (!baseUrl) {
        // Fallback detection for Netlify/Vercel
        if (process.env.URL) {
          // Netlify provides URL env var
          baseUrl = process.env.URL;
        } else if (process.env.VERCEL_URL) {
          // Vercel provides VERCEL_URL
          baseUrl = `https://${process.env.VERCEL_URL}`;
        } else {
          // Last resort: localhost (development only)
          baseUrl = 'http://localhost:3000';
        }
      }

      console.log(`[semanticSearch] ⭐ Fetching community stats from: ${baseUrl}/api/ratings/stats`);

      const statsResponse = await fetch(`${baseUrl}/api/ratings/stats?productIds=${productIds}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        // Add timeout to prevent hanging
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });

      if (statsResponse.ok) {
        const data = await statsResponse.json();
        communityStats = data.stats || {};
        console.log(`[semanticSearch] ⭐ Fetched community stats for ${Object.keys(communityStats).length} products`);
      } else {
        console.warn(`[semanticSearch] ⚠️ Rating stats API returned ${statsResponse.status}: ${statsResponse.statusText}`);
      }
    } catch (error) {
      console.error('[semanticSearch] ⚠️ Failed to fetch community stats:', error);
      // Continue without ratings - this is non-critical
    }

    // Step 2: Apply personal filtering (hide ≤2 stars)
    ratingFilteredResults = visionRankedResults.filter(product => {
      const userRating = userRatings[product.id] || 0;

      // If user rated this product ≤2 stars, hide it
      if (userRating > 0 && userRating <= 2) {
        console.log(`[semanticSearch] ⭐ Hiding product rated ${userRating} stars: "${product.title.slice(0, 50)}..."`);
        return false;
      }

      return true;
    });

    console.log(`[semanticSearch] ⭐ Personal filtering: ${visionRankedResults.length} → ${ratingFilteredResults.length} results`);

    // Step 3: Apply community filtering (51% rule - min 10 ratings)
    ratingFilteredResults = ratingFilteredResults.filter(product => {
      const stats = communityStats[product.id];

      // If community wants to hide this product, hide it
      if (stats?.shouldHide) {
        console.log(`[semanticSearch] ⭐ Hiding community-flagged product: "${product.title.slice(0, 50)}..." (${stats.totalRatings} ratings, ${stats.percent2OrLess}% rated ≤2)`);
        return false;
      }

      return true;
    });

    console.log(`[semanticSearch] ⭐ Community filtering: ${ratingFilteredResults.length} results after community rules`);

    // Step 4: Apply personal + community boosting
    ratingFilteredResults = ratingFilteredResults.map(product => {
      const userRating = userRatings[product.id] || 0;
      const stats = communityStats[product.id];

      // Calculate personal boost
      let personalBoost = 0;
      if (userRating === 5) personalBoost = 0.15;
      else if (userRating === 4) personalBoost = 0.10;
      else if (userRating === 3) personalBoost = 0.05;

      // Calculate community boost
      const communityBoost = stats?.communityBoost || 0;

      // Apply combined boost to similarity score
      const totalBoost = personalBoost + communityBoost;
      const adjustedSimilarity = (product.similarity || 0) + totalBoost;

      if (totalBoost > 0) {
        console.log(
          `[semanticSearch] ⭐ Boosting "${product.title.slice(0, 40)}...": ` +
          `personal +${personalBoost.toFixed(2)} (${userRating}⭐), ` +
          `community +${communityBoost.toFixed(2)}, ` +
          `total: ${product.similarity?.toFixed(3)} → ${adjustedSimilarity.toFixed(3)}`
        );
      }

      return {
        ...product,
        similarity: adjustedSimilarity,
        userRating, // Preserve for debugging
        personalBoost, // Preserve for debugging
        communityBoost, // Preserve for debugging
      };
    });

    // Step 5: Re-sort by adjusted similarity
    ratingFilteredResults.sort((a, b) => (b.similarity || 0) - (a.similarity || 0));

    console.log(`[semanticSearch] ⭐ Rating filtering complete: ${ratingFilteredResults.length} results with adjusted rankings`);
  }

  // FEATURE: Category-based grouping for multi-category searches
  // If user specifies multiple categories (e.g., "clothing, shoes, and jewelry"),
  // group results by category and show them in the order mentioned
  let categoryGroupedResults = ratingFilteredResults;

  if (intent.searchQueries && intent.searchQueries.length > 1) {
    console.log(`[semanticSearch] 📦 Multi-category search detected (${intent.searchQueries.length} categories) - grouping results`);

    // Create category groups based on search query order (preserves user's requested order)
    const categoryGroups = new Map<string, Product[]>();

    // Initialize groups in the order specified by user
    intent.searchQueries.forEach(sq => {
      categoryGroups.set(sq.category.toLowerCase(), []);
    });

    // Assign each product to its best matching category
    ratingFilteredResults.forEach(product => {
      const productText = `${product.title} ${product.description}`.toLowerCase();

      // Try to match product to one of the specified categories
      let bestCategory: string | null = null;
      for (const sq of intent.searchQueries) {
        const category = sq.category.toLowerCase();
        if (productMatchesCategory(product, category)) {
          bestCategory = category;
          break; // Use first matching category to avoid duplicates
        }
      }

      // If matched, add to that category group
      if (bestCategory && categoryGroups.has(bestCategory)) {
        categoryGroups.get(bestCategory)!.push(product);
      }
    });

    // Concatenate groups in user-specified order
    categoryGroupedResults = [];
    let groupIndex = 0;
    categoryGroups.forEach((products, category) => {
      if (products.length > 0) {
        console.log(`[semanticSearch] 📦 Group ${++groupIndex}: ${category} (${products.length} items)`);
        categoryGroupedResults.push(...products);
      }
    });

    console.log(`[semanticSearch] 📦 Total after grouping: ${categoryGroupedResults.length} products`);
  }

  // Calculate pagination
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedResults = categoryGroupedResults.slice(startIndex, endIndex);

  // Use actual total count from filtered results
  const totalCount = categoryGroupedResults.length;

  console.log(`[semanticSearch] Pagination: page=${page}, showing ${startIndex}-${endIndex} of ${totalCount} total results`);

  // Detect low quality results and add warning message
  let qualityWarning: string | undefined;
  const warningMessage = "We know this may not be exactly what you've asked for right now, and that's because we are continuing to add hundreds and sometimes thousands of new products daily. We don't have the best match(es) YET for that search, but we know exactly what you mean, and we are working on updating our inventory to make this experience better for you.";

  // Check for zero results FIRST (most critical)
  if (categoryGroupedResults.length === 0) {
    qualityWarning = warningMessage;
    console.log(`[semanticSearch] ⚠️ Quality warning: ZERO results after filtering`);
  }
  // Check quality metrics if we have results
  else if (categoryGroupedResults.length > 0) {
    const maxSimilarity = Math.max(...categoryGroupedResults.map(p => p.similarity || 0));
    const avgSimilarity = categoryGroupedResults.reduce((sum, p) => sum + (p.similarity || 0), 0) / categoryGroupedResults.length;

    // Show warning only for very poor matches — threshold lowered to reduce false positives
    // (specific attribute queries like "chunky heel boots" legitimately score 0.35-0.44
    // but still return relevant products; the Y/N feedback system will handle quality signals)
    if (maxSimilarity < 0.30 && avgSimilarity < 0.25) {
      qualityWarning = warningMessage;
      console.log(`[semanticSearch] ⚠️ Quality warning: low similarity - max: ${maxSimilarity.toFixed(3)}, avg: ${avgSimilarity.toFixed(3)}`);
    }
  }

  // CRITICAL: Show warning if user specified color but insufficient matches (check regardless of result count)
  // For broad queries, only warn if we have <12 total results (more lenient)
  if (intent.color) {
    if (isBroadQuery) {
      // Broad query: only warn if very few results
      if (colorFilteredResults.length < 12) {
        qualityWarning = warningMessage;
        console.log(`[semanticSearch] ⚠️ Quality warning (broad query): only ${colorFilteredResults.length} items in "${intent.color}"`);
      }
    } else {
      // Specific query: warn if insufficient matches
      if (colorMatchCount < 6 || colorFilteredResults.length < 12) {
        qualityWarning = warningMessage;
        console.log(`[semanticSearch] ⚠️ Quality warning: insufficient color matches (${colorMatchCount} found, ${colorFilteredResults.length} after filtering for "${intent.color}")`);
      }
    }
  }

  // Show warning if price filtering removed too many results (not for broad queries)
  if (!isBroadQuery && intent.priceRange && priceFilteredResults.length < 6 && categoryFilteredResults.length > priceFilteredResults.length) {
    qualityWarning = warningMessage;
    console.log(`[semanticSearch] ⚠️ Quality warning: insufficient results in price range`);
  }

  // Show warning if category filtering removed too many results (not for broad queries)
  if (!isBroadQuery && primaryCategory && primaryCategory !== 'all' && categoryMatchCount < 6) {
    qualityWarning = warningMessage;
    console.log(`[semanticSearch] ⚠️ Quality warning: insufficient category matches for "${primaryCategory}"`);
  }

  return {
    query,
    results: paginatedResults,
    totalCount,
    page,
    pageSize: limit,
    intent,
    qualityWarning,
  };
}

/**
 * Check if query explicitly requests sexy/provocative items
 */
function hasSexyIntent(query: string): boolean {
  const sexyKeywords = [
    'sexy', 'lingerie', 'intimate', 'risque', 'provocative', 'enticing',
    'skimpy', 'revealing', 'sultry', 'seductive', 'alluring', 'naughty',
    'racy', 'steamy', 'sensual', 'erotic', 'burlesque', 'negligee',
    'teddy', 'bodysuit', 'fishnet', 'lace bra', 'thong', 'garter',
    'bedroom', 'boudoir', 'spicy', 'hot outfit'
  ];

  const lowerQuery = query.toLowerCase();
  return sexyKeywords.some(keyword => lowerQuery.includes(keyword));
}

/**
 * Check if product contains sexy/provocative content
 */
function isSexyProduct(title: string, description: string): boolean {
  // Strong sexy indicators (check title + description)
  const strongSexyTerms = [
    'sexy', 'lingerie', 'intimate', 'revealing', 'see-through',
    'fishnet', 'teddy', 'negligee', 'babydoll', 'chemise',
    'garter', 'g-string', 'crotchless',
    'open bust', 'cupless', 'peek-a-boo', 'peekaboo', 'erotic', 'naughty',
    'boudoir', 'sultry', 'provocative', 'enticing', 'lace bra set',
    'adult costume', 'roleplay', 'role play', 'burlesque', 'stripper'
  ];
  // Note: 'thong' is intentionally excluded above — it is also a legitimate footwear
  // term ("thong sandal", "flip-flop thong"). Handled contextually below.

  // Weak indicators (only check if in TITLE - too many false positives in descriptions)
  const weakSexyTerms = [
    'sheer', 'transparent', 'mesh', 'bodysuit', 'bedroom'
  ];

  const combinedText = `${title} ${description}`.toLowerCase();
  const titleOnly = title.toLowerCase();

  // Check strong indicators in full text
  const hasStrongIndicator = strongSexyTerms.some(term => combinedText.includes(term));

  // Check weak indicators ONLY in title (vendors stuff "mesh" in descriptions)
  const hasWeakIndicator = weakSexyTerms.some(term => titleOnly.includes(term));

  // 'thong' is a legitimate footwear term (thong sandals, flip-flop thong style).
  // Only flag as sexy when 'thong' appears WITHOUT adjacent footwear words.
  const hasThongSexy = combinedText.includes('thong') &&
    !/thong\s*(sandal|flip|flat|shoe|slipper|slide)|(?:sandal|slipper|flip|slide)\S*\s+thong/i.test(combinedText);

  return hasStrongIndicator || hasWeakIndicator || hasThongSexy;
}

/**
 * Check if product matches the specified category/garment type
 * CRITICAL: Category mismatches should be penalized heavily (tops vs pants, etc.)
 */
/**
 * Determine category match type: 'exact', 'partial', or 'none'
 * - exact: Pure category match (search "dress" → product IS a dress)
 * - partial: Includes category (search "necklace" → jewelry set that includes necklace)
 * - none: Completely unrelated (search "dress" → shoes/pants)
 *
 * CRITICAL: This is SEMANTIC and DYNAMIC - not hardcoded patterns
 * - If user searches "t-shirt", we look for "t-shirt" or "tshirt" in the product
 * - If found AND it's the main item → exact
 * - If found AND it's part of a set → partial
 * - If NOT found at all → none
 */
function getCategoryMatchType(product: Product, category: string): 'exact' | 'partial' | 'none' {
  const title = product.title.toLowerCase();
  const description = (product.description || '').toLowerCase();
  const combinedText = `${title} ${description}`;
  const normalizedCategory = category.toLowerCase();

  // Generate search term variations for flexible matching
  // e.g., "t-shirt" → ["t-shirt", "tshirt", "t shirt", "tee shirt"]
  const searchTerms = generateSearchTermVariations(normalizedCategory);

  // Check if ANY variation of the search term appears in the product
  const containsSearchTerm = searchTerms.some(term => combinedText.includes(term));

  if (!containsSearchTerm) {
    // Search term not found at all → completely unrelated
    return 'none';
  }

  // Multi-piece indicators (set, bundle, outfit, etc.)
  const multiPieceIndicators = [
    'set', 'piece', 'suit', 'outfit', 'bundle', 'pack', 'kit',
    'matching', 'co-ord', 'coord', 'coordinating',
    'includes', 'with', 'and', '+', 'combo', 'collection'
  ];

  const isMultiPiece = multiPieceIndicators.some(indicator => combinedText.includes(indicator));

  // Unwanted context indicators (when term appears but in wrong context)
  // e.g., "shoe organizer" when searching "shoe" or "dress form" when searching "dress"
  const unwantedContexts = [
    'organizer', 'cleaner', 'rack', 'holder', 'storage', 'box', 'container',
    'hanger', 'display', 'mannequin', 'form', 'stand', 'picture', 'print',
    'poster', 'photo', 'image', 'pattern', 'template', 'tutorial'
  ];

  const hasUnwantedContext = unwantedContexts.some(context => combinedText.includes(context));

  if (hasUnwantedContext) {
    // Term appears but in wrong context (e.g., "shoe organizer") → exclude
    return 'none';
  }

  // Determine if it's the PRIMARY item or part of a set
  if (isMultiPiece) {
    // It's a set/bundle that includes the searched item
    return 'partial';
  } else {
    // It's the primary item itself
    return 'exact';
  }
}

/**
 * Generate search term variations for flexible matching
 * e.g., "t-shirt" → ["t-shirt", "tshirt", "t shirt", "tee shirt", "tee"]
 */
function generateSearchTermVariations(term: string): string[] {
  const variations = [term]; // Always include original

  // Common fashion term variations
  const commonVariations: Record<string, string[]> = {
    't-shirt': ['t-shirt', 'tshirt', 't shirt', 'tee shirt', 'tee'],
    'tshirt': ['t-shirt', 'tshirt', 't shirt', 'tee shirt'],
    'sweatshirt': ['sweat shirt', 'sweatshirt'],
    'hoodie': ['hoodie', 'hooded sweatshirt', 'pullover hoodie'],
    'sneaker': ['sneaker', 'trainer', 'athletic shoe'],
    'handbag': ['handbag', 'hand bag', 'purse'],
    'necklace': ['necklace', 'neck lace', 'pendant'],
    'bracelet': ['bracelet', 'bangle', 'wrist band'],
    'earring': ['earring', 'ear ring', 'earbob'],
    // Abstract intent categories → concrete product terms
    // These map the LLM/simple-intent category names to terms that actually
    // appear in product titles, fixing category matching for nav browsing.
    'bottoms': ['pants', 'jeans', 'skirt', 'trousers', 'leggings', 'shorts', 'chino', 'jogger', 'jegging'],
    'tops': ['top', 'blouse', 'shirt', 'sweater', 'cardigan', 'tee', 'tunic', 'tank', 'cami', 'camisole'],
    'shoes': ['shoe', 'heel', 'boot', 'sandal', 'sneaker', 'loafer', 'flat', 'pump', 'slipper', 'mule', 'wedge', 'trainer'],
    'bags': ['bag', 'purse', 'handbag', 'tote', 'clutch', 'backpack', 'satchel', 'hobo', 'pouch', 'wallet'],
    'outerwear': ['jacket', 'coat', 'blazer', 'vest', 'parka', 'anorak', 'windbreaker', 'trench', 'hoodie', 'cardigan'],
    'hat': ['hat', 'cap', 'beanie', 'fedora', 'beret', 'visor', 'bucket', 'snapback', 'baseball'],
    'scarf': ['scarf', 'scarve', 'wrap', 'shawl', 'stole', 'pashmina', 'bandana', 'neckerchief'],
    'sunglasses': ['sunglasses', 'sunglass', 'eyewear', 'shades', 'eyeglasses', 'glasses'],
    'belt': ['belt', 'waistband', 'sash', 'cinch', 'girdle'],
    'jewelry': ['necklace', 'earring', 'bracelet', 'ring', 'pendant', 'bangle', 'brooch', 'jewel', 'cuff', 'anklet', 'choker', 'charm'],
    'accessories': ['hat', 'cap', 'scarf', 'wrap', 'belt', 'sunglasses', 'eyewear', 'shades', 'glove', 'hair', 'headband', 'scrunchie'],
    // 'maxi' and 'midi' intentionally excluded — they are length descriptors, not garment type nouns.
    // "Maxi Dress" already matches via 'dress'; "Maxi Gold Necklace" must NOT match as a dress.
    'dress': ['dress', 'gown', 'frock', 'sundress', 'romper', 'jumpsuit'],
  };

  // Check if we have predefined variations
  if (commonVariations[term]) {
    return [...new Set([...variations, ...commonVariations[term]])];
  }

  // Generate hyphen/space variations
  if (term.includes('-')) {
    variations.push(term.replace(/-/g, ' ')); // "t-shirt" → "t shirt"
    variations.push(term.replace(/-/g, ''));   // "t-shirt" → "tshirt"
  }

  if (term.includes(' ')) {
    variations.push(term.replace(/\s+/g, '-')); // "t shirt" → "t-shirt"
    variations.push(term.replace(/\s+/g, ''));   // "t shirt" → "tshirt"
  }

  // Remove duplicates
  return [...new Set(variations)];
}

// Legacy function for backward compatibility - returns true if exact or partial match
function productMatchesCategory(product: Product, category: string): boolean {
  const matchType = getCategoryMatchType(product, category);
  return matchType === 'exact' || matchType === 'partial';
}

/**
 * Check if product matches the specified color
 * CRITICAL: User-specified colors MUST match in first 3-6 results
 *
 * Phase 1 LLM Enhancement: Uses AI-verified colors when available (verifiedColors field),
 * falls back to text-based matching for products not yet analyzed.
 */
function productMatchesColor(product: Product, color: string): boolean {
  const normalizedColor = color.toLowerCase();

  // PHASE 1: Use AI-verified colors if available (most accurate)
  if (product.verifiedColors && product.verifiedColors.length > 0) {
    // Check if any verified color matches the requested color
    const hasDirectMatch = product.verifiedColors.some(
      verifiedColor => verifiedColor.toLowerCase() === normalizedColor
    );

    if (hasDirectMatch) {
      return true;
    }

    // Check color variations/synonyms for verified colors
    const colorVariations: Record<string, string[]> = {
      black: ['noir', 'ebony', 'jet black'],
      white: ['ivory', 'cream', 'off-white', 'eggshell'],
      red: ['crimson', 'scarlet', 'burgundy', 'wine', 'maroon'],
      blue: ['navy', 'cobalt', 'royal blue', 'sky blue', 'azure'],
      green: ['olive', 'emerald', 'forest green', 'sage', 'mint'],
      pink: ['rose', 'blush', 'hot pink', 'fuchsia', 'magenta'],
      purple: ['violet', 'lavender', 'plum', 'mauve', 'lilac'],
      yellow: ['gold', 'mustard', 'lemon', 'canary'],
      orange: ['rust', 'coral', 'peach', 'tangerine', 'burnt orange'],
      brown: ['tan', 'beige', 'taupe', 'khaki', 'camel', 'chocolate'],
      grey: ['gray', 'charcoal', 'slate', 'silver', 'pewter'],
      gray: ['grey', 'charcoal', 'slate', 'silver', 'pewter'],
    };

    // Check if requested color is a variation of any verified color
    const requestedVariations = colorVariations[normalizedColor] || [];
    const hasVariationMatch = product.verifiedColors.some(verifiedColor =>
      requestedVariations.includes(verifiedColor.toLowerCase())
    );

    if (hasVariationMatch) {
      return true;
    }

    // Verified colors exist but don't match - return false
    // This is the key improvement: we trust AI verification over text descriptions
    return false;
  }

  // FALLBACK: Text-based matching for products not yet analyzed
  // This maintains backward compatibility during transition period
  const combinedText = `${product.title} ${product.description}`.toLowerCase();

  // Direct color match (e.g., "black", "red", "navy blue")
  if (combinedText.includes(normalizedColor)) {
    return true;
  }

  // Handle color variations and synonyms
  const colorVariations: Record<string, string[]> = {
    black: ['noir', 'ebony', 'jet black'],
    white: ['ivory', 'cream', 'off-white', 'eggshell'],
    red: ['crimson', 'scarlet', 'burgundy', 'wine', 'maroon'],
    blue: ['navy', 'cobalt', 'royal blue', 'sky blue', 'azure'],
    green: ['olive', 'emerald', 'forest green', 'sage', 'mint'],
    pink: ['rose', 'blush', 'hot pink', 'fuchsia', 'magenta'],
    purple: ['violet', 'lavender', 'plum', 'mauve', 'lilac'],
    yellow: ['gold', 'mustard', 'lemon', 'canary'],
    orange: ['rust', 'coral', 'peach', 'tangerine', 'burnt orange'],
    brown: ['tan', 'beige', 'taupe', 'khaki', 'camel', 'chocolate'],
    grey: ['gray', 'charcoal', 'slate', 'silver', 'pewter'],
    gray: ['grey', 'charcoal', 'slate', 'silver', 'pewter'],
  };

  // Check variations
  const variations = colorVariations[normalizedColor] || [];
  return variations.some(variation => combinedText.includes(variation));
}

/**
 * Decode HTML entities in text
 */
function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&#039;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ');
}

/**
 * Check if product is for men
 */
function isMensProduct(title: string, description: string): boolean {
  // Decode HTML entities first
  const decodedTitle = decodeHtmlEntities(title);
  const decodedDescription = decodeHtmlEntities(description);
  const combinedText = `${decodedTitle} ${decodedDescription}`.toLowerCase();

  // Check for unisex indicators - if product explicitly says it's for both, allow it
  const unisexPatterns = [
    /\bunisex\b/,
    /\bfor men and women\b/,
    /\bfor women and men\b/,
    /\bmen & women\b/,
    /\bwomen & men\b/,
    /\bmens and womens\b/,
    /\bwomens and mens\b/,
  ];

  if (unisexPatterns.some(pattern => pattern.test(combinedText))) {
    return false; // It's unisex, don't filter
  }

  // Use word boundaries to avoid false positives like "womens" matching "mens"
  const mensPatterns = [
    /\bmen'?s\b/,           // "men's" or "mens" as whole word
    /\bfor men\b/,
    /\bfor him\b/,
    /\bmen only\b/,
    /\bmale\b/,
    /\bmasculine\b/,
    /\bgentleman'?s?\b/,    // "gentleman" or "gentleman's"
    /\bboys?\b/,            // "boy" or "boys"
    /\bboy'?s\b/,           // "boy's"
    /\bmenswear\b/,
  ];

  // Check if text contains "women" or "woman" - if so, be more strict
  const hasWomen = /\bwom[ae]n'?s?\b/.test(combinedText);

  if (hasWomen) {
    // If it mentions women, only flag if it ALSO explicitly mentions men
    // and men appears more prominently
    const menMatches = (combinedText.match(/\bmen'?s?\b/g) || []).length;
    const womenMatches = (combinedText.match(/\bwom[ae]n'?s?\b/g) || []).length;

    // Only flag as men's if men is mentioned more than women
    if (menMatches <= womenMatches) {
      return false;
    }
  }

  return mensPatterns.some(pattern => pattern.test(combinedText));
}

/**
 * Check if product is raw fabric or non-apparel material
 */
function isNonApparelMaterial(title: string, description: string): boolean {
  const materialTerms = [
    // Fabric/Material terms
    'fabric by the yard', 'by the yard', 'fabric diy', 'diy material',
    'upholstery fabric', 'sofa fabric', 'cushion cover fabric',
    'curtain fabric', 'canvas fabric', 'raw fabric', 'cloth material',
    'bed-sheeting material', 'bedding fabric', 'home decor fabric',
    'craft fabric', 'sewing fabric', 'textile material', 'yard fabric',
    'width ', 'wide ', 'per yard', '/yard', 'fabric wholesale',
    'coral velvet fabric', 'flannel fabric', 'linen fabric',
    'cotton fabric', 'canvas by', 'material by', 'upholstery sofa',
    'cushion covers fabric', 'diy matreial', 'diy materia',
    'fabric swatch', 'material swatch', 'fabric sample',
    'quilting fabric', 'patchwork fabric', 'fabric bolt',

    // Home decor (non-wearable)
    'throw pillow', 'pillow cover', 'cushion cover', 'bedding set',
    'duvet cover', 'comforter set', 'bed sheet', 'table cloth',
    'tablecloth', 'placemat', 'napkin set', 'window curtain',
    'shower curtain', 'bath mat', 'area rug', 'carpet',
    'wall tapestry', 'wall hanging', 'home textile',

    // Craft/DIY supplies
    'craft supply', 'sewing notion', 'zipper by', 'button pack',
    'elastic by', 'ribbon by', 'trim by', 'lace by',

    // Measurements indicating raw materials
    'meters length', 'yards length', 'cm width', 'inch width',
  ];

  const combinedText = `${title} ${description}`.toLowerCase();

  // Check for fabric/material indicators
  const hasMaterialTerm = materialTerms.some(term => combinedText.includes(term));

  // Check for measurements indicating raw fabric (e.g., "Width 145cm", "Wide 59\"")
  const hasFabricMeasurement = /width\s*\d+|wide\s*\d+|length\s*\d+|meters?\s+long|yards?\s+long/i.test(combinedText);

  return hasMaterialTerm || hasFabricMeasurement;
}

/**
 * Execute multiple semantic searches in parallel
 */
async function executeMultiSearch(
  queries: SearchQuery[],
  limit: number,
  similarityThreshold: number,
  allowSexyContent: boolean = false
): Promise<Map<string, Product[]>> {
  console.log('[executeMultiSearch] Starting with queries:', queries.map(q => q.query));

  // Fetch quality filter settings
  const qualitySettings = await getQualityFilterSettings();
  console.log('[executeMultiSearch] Quality filter settings:', qualitySettings);

  const supabase = getSupabaseClient(true) as any;
  const results = new Map<string, Product[]>();

  // Generate text embeddings for all queries in batch
  const queryTexts = queries.map(q => q.query);
  console.log('[executeMultiSearch] Generating text embeddings for:', queryTexts);

  const textEmbeddings = await generateEmbeddings(queryTexts);
  console.log('[executeMultiSearch] Text embeddings generated:', textEmbeddings.length, 'embeddings of length', textEmbeddings[0]?.length);

  // Fire CLIP text embedding requests in parallel with the upcoming DB searches.
  // Used for post-retrieval image re-ranking (CLIP text ↔ stored CLIP image embeddings).
  // Resolves to null per-query if HUGGINGFACE_API_KEY is not set — no impact on search.
  const clipEmbeddingPromises = queryTexts.map(text => generateClipTextEmbedding(text));

  // Execute searches in parallel
  const searchPromises = queries.map(async (searchQuery, index) => {
    const textEmbedding = textEmbeddings[index];

    // Calculate how many results to fetch based on priority and weight
    // Cap at 200 to ensure <2 second query time (target: fast initial load)
    const fetchLimit = Math.min(Math.ceil(limit * searchQuery.weight * 1.5), 200);

    const searchModeResult = classifySearchMode(
      searchQuery.query,
      qualitySettings.searchMode,
      qualitySettings.hybridVectorWeight,
      qualitySettings.hybridTextWeight
    );

    // For single-word nav browse queries in hybrid mode, expand the FTS query text
    // to include category synonyms. "outerwear" as a literal FTS term matches products
    // titled "Men's Outerwear & Coats" (mostly men's → all filtered → 0 results).
    // Expanding to "jacket OR coat OR blazer OR vest..." matches the actual women's
    // vocabulary used in product titles, while the vector component stays "outerwear"
    // for semantic relevance.
    let ftsQueryText = searchQuery.query;
    if (searchModeResult.useHybrid && !searchQuery.query.trim().includes(' ')) {
      const variations = generateSearchTermVariations(searchQuery.query.trim().toLowerCase());
      if (variations.length > 1) {
        ftsQueryText = variations.join(' OR ');
        console.log(`[executeMultiSearch] 📖 FTS expanded "${searchQuery.query}" → "${ftsQueryText}"`);
      }
    }

    console.log(`[executeMultiSearch] "${searchQuery.query}" → mode=${qualitySettings.searchMode} useHybrid=${searchModeResult.useHybrid} vw=${searchModeResult.vectorWeight} tw=${searchModeResult.textWeight}`);
    console.log(`[executeMultiSearch] Calling ${searchModeResult.useHybrid ? 'hybrid_match_products' : 'match_products'} for "${searchQuery.query}" with limit ${fetchLimit}`);

    let data: any[] = [];

    try {
      const result = searchModeResult.useHybrid
        ? await supabase.rpc('hybrid_match_products', {
            query_embedding: textEmbedding,
            query_text: ftsQueryText,
            match_count: fetchLimit,
            vector_weight: searchModeResult.vectorWeight,
            text_weight: searchModeResult.textWeight,
          })
        : await supabase.rpc('match_products', {
            query_embedding: textEmbedding,
            match_count: fetchLimit,
            filter_gender: 'exclude_men',
          });

      if (result.error) {
        console.error(`[executeMultiSearch] RPC error for "${searchQuery.query}":`, {
          message: result.error.message,
          details: result.error.details,
          hint: result.error.hint,
          code: result.error.code
        });
        return { query: searchQuery.query, products: [] };
      }

      data = result.data || [];
      console.log(`[executeMultiSearch] Success for "${searchQuery.query}": received ${data.length} products`);

      // Log similarity scores
      if (data.length > 0) {
        const similarities = data.map((row: any) => row.similarity).slice(0, 10);
        console.log(`[executeMultiSearch] Similarity scores for "${searchQuery.query}":`, similarities);
        console.log(`[executeMultiSearch] Similarity threshold: ${similarityThreshold}`);
      }
    } catch (err) {
      console.error(`[executeMultiSearch] Exception for "${searchQuery.query}":`, err);
      return { query: searchQuery.query, products: [] };
    }

    // Filter by similarity threshold and convert to Product type
    console.log(`[executeMultiSearch] Filtering ${data.length} products with text threshold ${similarityThreshold}`);
    console.log(`[executeMultiSearch] Sexy content allowed: ${allowSexyContent ? 'YES' : 'NO'}`);

    let filteredProducts = data.filter((row: ProductRow & { similarity: number }) => {
      // FILTER 1: Content filtering - Remove sexy/provocative items unless explicitly requested
      if (!allowSexyContent && isSexyProduct(row.title, row.description || '')) {
        console.log(`[executeMultiSearch] ❌ Filtered sexy product (not requested): "${row.title?.slice(0, 60)}..."`);
        return false;
      }

      // FILTER 2: Men's products (configurable)
      if (qualitySettings.enableMensFilter && isMensProduct(row.title, row.description || '')) {
        console.log(`[executeMultiSearch] ❌ Filtered men's product: "${row.title?.slice(0, 60)}..."`);
        return false;
      }

      // FILTER 3: Non-apparel materials (configurable)
      if (qualitySettings.enableNonApparelFilter && isNonApparelMaterial(row.title, row.description || '')) {
        console.log(`[executeMultiSearch] ❌ Filtered non-apparel material: "${row.title?.slice(0, 60)}..."`);
        return false;
      }

      // FILTER 4: Price threshold (configurable)
      if (qualitySettings.enablePriceFilter &&
          row.price !== null &&
          row.price !== undefined &&
          row.price < qualitySettings.minPriceThreshold) {
        console.log(`[executeMultiSearch] ❌ Filtered low-price product ($${row.price}): "${row.title?.slice(0, 60)}..."`);
        return false;
      }

      // FILTER 5: DHGate quality - Apply stricter threshold for DHGate vendors
      const isDHGate = row.product_url?.toLowerCase().includes('dhgate') ||
                       row.brand?.toLowerCase().includes('dhgate');
      const requiredThreshold = isDHGate ? similarityThreshold + 0.1 : similarityThreshold;

      const passes = row.similarity >= requiredThreshold;

      if (!passes && data.indexOf(row) < 3) {
        console.log(
          `[executeMultiSearch] Filtered out "${row.title?.slice(0, 60)}..." ` +
          `(similarity: ${row.similarity?.toFixed(3)}, required: ${requiredThreshold?.toFixed(3)}` +
          `${isDHGate ? ' [DHGate+0.1]' : ''})`
        );
      }

      return passes;
    });

    // Convert to Product type
    const products: Product[] = filteredProducts.map((row: ProductRow & { similarity: number }) => ({
      id: row.id,
      imageUrl: row.image_url,
      brand: row.brand,
      title: row.title,
      description: row.description,
      price: row.price,
      currency: row.currency,
      productUrl: row.product_url,
      tags: row.tags,
      similarity: row.similarity,
      merchantName: row.merchant_name,
      onSale: row.on_sale,
      verifiedColors: row.verified_colors, // AI-verified actual colors from image analysis
    }));

    // IMAGE RE-RANKING: blend text similarity with CLIP image similarity.
    // The CLIP request was fired before the DB search above, so most of its
    // latency is hidden.  Falls back silently if HF API is unavailable.
    const clipEmbedding = await clipEmbeddingPromises[index];
    let finalProducts = products;

    if (clipEmbedding && products.length > 0) {
      const productIds = products.map(p => p.id);

      const { data: imgData } = await supabase
        .from('products')
        .select('id, image_embedding')
        .in('id', productIds)
        .not('image_embedding', 'is', null);

      if (imgData && imgData.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const imgMap = new Map<string, number[]>(
          (imgData as any[])
            .filter(d => d.image_embedding)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .map((d: any) => {
              const emb: number[] =
                typeof d.image_embedding === 'string'
                  ? JSON.parse(d.image_embedding)
                  : d.image_embedding;
              return [d.id as string, emb] as [string, number[]];
            })
        );

        finalProducts = products
          .map(product => {
            const imageEmb = imgMap.get(product.id);
            if (!imageEmb) return product;
            const imageSim = clipCosineSimilarity(clipEmbedding, imageEmb);
            // 70% text/semantic similarity + 30% CLIP visual similarity
            const combined = 0.7 * (product.similarity || 0) + 0.3 * imageSim;
            return { ...product, similarity: combined };
          })
          .sort((a, b) => (b.similarity || 0) - (a.similarity || 0));

        console.log(
          `[executeMultiSearch] 🖼️ CLIP image re-ranking applied for "${searchQuery.query}": ` +
          `${imgData.length}/${products.length} products re-ranked`
        );
      }
    }

    return { query: searchQuery.query, products: finalProducts };
  });

  const searchResults = await Promise.all(searchPromises);

  for (const result of searchResults) {
    results.set(result.query, result.products);
  }

  return results;
}

/**
 * Rank and merge results from multiple searches
 */
function rankResults(
  searchResults: Map<string, Product[]>,
  queries: SearchQuery[],
  limit: number,
  diversityFactor: number
): Product[] {
  // Score each product based on which queries it matched
  const productScores = new Map<string, { product: Product; score: number }>();

  for (const query of queries) {
    const products = searchResults.get(query.query) || [];

    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      const existing = productScores.get(product.id);

      // Calculate score based on:
      // - Similarity score from vector search
      // - Query weight (primary items weighted higher)
      // - Position in results (earlier = better)
      const positionScore = 1 - (i / products.length) * 0.3;
      const queryScore = (product.similarity || 0.5) * query.weight * positionScore;

      if (existing) {
        // Product matched multiple queries - boost its score
        productScores.set(product.id, {
          product,
          score: existing.score + queryScore * 0.5,
        });
      } else {
        productScores.set(product.id, { product, score: queryScore });
      }
    }
  }

  // Sort by score
  let rankedProducts = Array.from(productScores.values())
    .sort((a, b) => b.score - a.score)
    .map(item => item.product);

  // Deduplicate by title+brand — catches the same Amazon product imported with
  // different URL parameters across multiple search term variations
  const seenTitleBrand = new Set<string>();
  rankedProducts = rankedProducts.filter(p => {
    const key = `${(p.brand || '').toLowerCase().trim()}::${(p.title || '').toLowerCase().trim()}`;
    if (seenTitleBrand.has(key)) return false;
    seenTitleBrand.add(key);
    return true;
  });

  // Apply diversity factor within similarity tiers to preserve quality ordering
  // This ensures best matches always appear first, regardless of brand
  if (diversityFactor > 0 && rankedProducts.length > 0) {
    // Group products by similarity score ranges
    const highQuality = rankedProducts.filter(p => (p.similarity || 0) >= 0.6);
    const mediumQuality = rankedProducts.filter(p => (p.similarity || 0) >= 0.4 && (p.similarity || 0) < 0.6);
    const lowerQuality = rankedProducts.filter(p => (p.similarity || 0) < 0.4);

    // Apply diversity within each tier separately to maintain similarity order
    const diverseHigh = applyDiversity(highQuality, diversityFactor);
    const diverseMedium = applyDiversity(mediumQuality, diversityFactor);
    const diverseLow = applyDiversity(lowerQuality, diversityFactor);

    // Concatenate tiers to preserve quality ordering
    rankedProducts = [...diverseHigh, ...diverseMedium, ...diverseLow];

    console.log(`[rankResults] Applied diversity within tiers - High: ${diverseHigh.length}, Medium: ${diverseMedium.length}, Low: ${diverseLow.length}`);
  }

  return rankedProducts.slice(0, limit);
}

/**
 * Apply diversity to results to avoid showing too-similar items
 */
function applyDiversity(products: Product[], factor: number): Product[] {
  if (products.length <= 1) return products;

  const diverse: Product[] = [products[0]];
  const brandCounts = new Map<string, number>();
  brandCounts.set(products[0].brand, 1);

  for (let i = 1; i < products.length; i++) {
    const product = products[i];
    const brandCount = brandCounts.get(product.brand) || 0;

    // Allow up to 10 per brand (increased from 3) to handle catalogs with limited brand diversity
    const shouldInclude = brandCount < 10 || Math.random() > factor;

    if (shouldInclude) {
      diverse.push(product);
      brandCounts.set(product.brand, brandCount + 1);
    }
  }

  return diverse;
}

/**
 * Simple semantic search without intent extraction (for simple queries)
 */
export async function simpleSearch(
  query: string,
  limit: number = 12
): Promise<Product[]> {
  const supabase = getSupabaseClient(true) as any;
  const embedding = await generateEmbedding(query);

  // Pass embedding array directly - PostgreSQL will convert to vector
  const { data, error } = await supabase.rpc('match_products', {
    query_embedding: embedding,
    match_count: limit,
    filter_gender: 'exclude_men',
  });

  if (error) {
    console.error('Search error:', error);
    throw new Error('Search failed');
  }

  return (data || []).map((row: ProductRow & { similarity: number }) => ({
    id: row.id,
    imageUrl: row.image_url,
    brand: row.brand,
    title: row.title,
    description: row.description,
    price: row.price,
    currency: row.currency,
    productUrl: row.product_url,
    tags: row.tags,
    similarity: row.similarity,
    merchantName: row.merchant_name,
    onSale: row.on_sale,
  }));
}

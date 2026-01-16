import { getSupabaseClient, ProductRow } from './supabase';
import { generateEmbedding, generateEmbeddings } from './embeddings';
import { extractIntent, isSimpleQuery, createSimpleIntent } from './intent';
import { generateTextVisionEmbedding, calculateCosineSimilarity } from './vision-embeddings-api';
import type { Product, SearchResponse, ParsedIntent, SearchQuery } from '@/types';

interface SearchOptions {
  limit?: number;
  page?: number;
  similarityThreshold?: number;
  diversityFactor?: number;
  enableImageValidation?: boolean;
  imageValidationThreshold?: number;
  allowSexyContent?: boolean; // Explicitly allow sexy/provocative content
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
  ];

  return broadPatterns.some(pattern => pattern.test(query));
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
    enableImageValidation = false,  // DISABLED - vision model broken, needs fixing
    imageValidationThreshold = 0.6,  // 60% image similarity required
    allowSexyContent = false, // Default to filtering sexy content
  } = options;

  // Detect broad queries that want to see "everything" in a category/color
  const isBroadQuery = detectBroadQuery(query);
  console.log(`[semanticSearch] Query type: ${isBroadQuery ? 'BROAD (show everything)' : 'SPECIFIC (targeted)'}`);

  // Determine if we need full intent extraction or simple search
  let intent: ParsedIntent;

  if (isSimpleQuery(query)) {
    intent = createSimpleIntent(query);
  } else {
    intent = await extractIntent(query);
  }

  // Fetch a MUCH larger pool of results to enable proper pagination
  // We need extra because filtering reduces the count significantly
  // Quality filtering + color filtering + price filtering can reduce by 50-70%
  const maxPages = 10; // Support up to 10 pages (was 5)
  const poolSize = limit * maxPages; // Fetch 120 results instead of 60

  const searchResults = await executeMultiSearch(
    intent.searchQueries,
    poolSize,
    similarityThreshold,
    enableImageValidation,
    imageValidationThreshold,
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
      // Top result: require +0.25 similarity boost (minimum 0.55 for best match)
      if (index === 0) {
        requiredSimilarity = similarityThreshold + 0.25;
      }
      // Results 2-3: require +0.20 similarity boost (minimum 0.50)
      else if (index < 3) {
        requiredSimilarity = similarityThreshold + 0.20;
      }
      // Results 4-6: require +0.15 similarity boost (minimum 0.45)
      else if (index < 6) {
        requiredSimilarity = similarityThreshold + 0.15;
      }
      // Results 7-12: require +0.10 similarity boost (minimum 0.40)
      else if (index < 12) {
        requiredSimilarity = similarityThreshold + 0.10;
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

    // CRITICAL: If we have very few color matches in top results, filter out non-matches
    // UNLESS it's a broad query (user wants to see everything in that color)
    if (!isBroadQuery) {
      const top12Results = colorFilteredResults.slice(0, 12);
      const top12ColorMatches = top12Results.filter(p => p.matchesColor).length;

      // If less than 50% of top 12 results match color, aggressively filter
      // This prevents showing blue/red/yellow dresses when user asks for "black dresses"
      if (top12ColorMatches < 6) {
        console.log(`[semanticSearch] ⚠️ Low color match rate in top results (${top12ColorMatches}/12) - filtering non-matches`);
        colorFilteredResults = colorFilteredResults.filter(p => p.matchesColor);
        console.log(`[semanticSearch] 🎨 After aggressive filtering: ${colorFilteredResults.length} results`);
      }
    } else {
      // For broad queries, ALWAYS filter by color but don't require high match rates
      console.log(`[semanticSearch] 📋 Broad query: showing all color matches without aggressive filtering`);
      colorFilteredResults = colorFilteredResults.filter(p => p.matchesColor);
      console.log(`[semanticSearch] 🎨 After broad filtering: ${colorFilteredResults.length} results`);
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

    // Check each product for category match
    categoryFilteredResults = colorFilteredResults.map((product, index) => {
      const matchesCategory = productMatchesCategory(product, primaryCategory);
      if (matchesCategory) categoryMatchCount++;

      return { ...product, matchesCategory };
    });

    // Sort to prioritize category matches at the top
    categoryFilteredResults.sort((a, b) => {
      // Both match or both don't match: maintain similarity order
      if (a.matchesCategory === b.matchesCategory) {
        return (b.similarity || 0) - (a.similarity || 0);
      }
      // Category matches come first
      return b.matchesCategory ? 1 : -1;
    });

    console.log(`[semanticSearch] 👔 Category matches: ${categoryMatchCount}/${categoryFilteredResults.length}`);

    // CRITICAL: If we have very few category matches in top results, filter out non-matches
    // UNLESS it's a broad query (user wants to see everything, across all categories)
    if (!isBroadQuery) {
      const top12Results = categoryFilteredResults.slice(0, 12);
      const top12CategoryMatches = top12Results.filter(p => p.matchesCategory).length;

      // If less than 50% of top 12 results match category, aggressively filter
      if (top12CategoryMatches < 6) {
        console.log(`[semanticSearch] ⚠️ Low category match rate in top results (${top12CategoryMatches}/12) - filtering non-matches`);
        categoryFilteredResults = categoryFilteredResults.filter(p => p.matchesCategory);
        console.log(`[semanticSearch] 👔 After aggressive filtering: ${categoryFilteredResults.length} results`);
      }
    } else {
      // For broad queries, DON'T filter by category - show items from all categories
      console.log(`[semanticSearch] 📋 Broad query: showing all categories without filtering`);
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

  // Calculate pagination
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedResults = priceFilteredResults.slice(startIndex, endIndex);

  // Use actual total count from filtered results
  const totalCount = priceFilteredResults.length;

  console.log(`[semanticSearch] Pagination: page=${page}, showing ${startIndex}-${endIndex} of ${totalCount} total results`);

  // Detect low quality results and add warning message
  let qualityWarning: string | undefined;
  const warningMessage = "We know this may not be exactly what you've asked for right now, and that's because we are continuing to add hundreds and sometimes thousands of new products daily. We don't have the best match(es) YET for that search, but we know exactly what you mean, and we are working on updating our inventory to make this experience better for you.";

  // Check for zero results FIRST (most critical)
  if (priceFilteredResults.length === 0) {
    qualityWarning = warningMessage;
    console.log(`[semanticSearch] ⚠️ Quality warning: ZERO results after filtering`);
  }
  // Check quality metrics if we have results
  else if (priceFilteredResults.length > 0) {
    const maxSimilarity = Math.max(...priceFilteredResults.map(p => p.similarity || 0));
    const avgSimilarity = priceFilteredResults.reduce((sum, p) => sum + (p.similarity || 0), 0) / priceFilteredResults.length;

    // Show warning if best match is below 0.45 or average is below 0.35
    if (maxSimilarity < 0.45 || avgSimilarity < 0.35) {
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
  const sexyTerms = [
    'sexy', 'lingerie', 'intimate', 'revealing', 'sheer', 'see-through',
    'transparent', 'mesh', 'fishnet', 'teddy', 'bodysuit', 'negligee',
    'babydoll', 'chemise', 'garter', 'thong', 'g-string', 'crotchless',
    'open bust', 'cupless', 'peek-a-boo', 'peekaboo', 'erotic', 'naughty',
    'boudoir', 'bedroom', 'sultry', 'provocative', 'enticing', 'lace bra set',
    'adult costume', 'roleplay', 'role play', 'burlesque', 'stripper'
  ];

  const combinedText = `${title} ${description}`.toLowerCase();
  return sexyTerms.some(term => combinedText.includes(term));
}

/**
 * Check if product matches the specified category/garment type
 * CRITICAL: Category mismatches should be penalized heavily (tops vs pants, etc.)
 */
function productMatchesCategory(product: Product, category: string): boolean {
  const combinedText = `${product.title} ${product.description}`.toLowerCase();
  const normalizedCategory = category.toLowerCase();

  // Define category keywords and exclusions
  const categoryPatterns: Record<string, { include: string[], exclude: string[] }> = {
    tops: {
      include: ['top', 'blouse', 'shirt', 'tee', 't-shirt', 'tank', 'cami', 'camisole', 'sweater', 'pullover', 'sweatshirt', 'hoodie', 'tunic', 'halter', 'crop top', 'bra top', 'sports bra'],
      exclude: ['pants', 'legging', 'bottom', 'jean', 'trouser', 'short', 'skirt', 'dress', 'jumpsuit', 'romper', 'playsuit', 'overall']
    },
    bottoms: {
      include: ['pants', 'legging', 'jean', 'trouser', 'short', 'skirt', 'culottes', 'capri', 'jogger', 'sweatpants', 'yoga pants', 'athletic pants'],
      exclude: ['top', 'blouse', 'shirt', 'dress', 'jumpsuit', 'romper', 'overall']
    },
    dress: {
      include: ['dress', 'gown', 'maxi', 'midi', 'mini dress', 'sundress', 'evening dress', 'cocktail dress', 'wrap dress', 'shift dress', 'bodycon', 'a-line dress'],
      exclude: ['top', 'bottom', 'pants', 'skirt separate', 'two-piece', '2-piece']
    },
    shoes: {
      include: ['shoe', 'boot', 'heel', 'sandal', 'sneaker', 'flat', 'pump', 'loafer', 'mule', 'slipper', 'wedge', 'ankle boot', 'knee boot'],
      exclude: ['shoe bag', 'shoe organizer', 'shoe cleaner', 'insole', 'sock']
    },
    bags: {
      include: ['bag', 'purse', 'handbag', 'tote', 'clutch', 'satchel', 'crossbody', 'shoulder bag', 'backpack', 'messenger', 'hobo bag', 'bucket bag'],
      exclude: ['luggage', 'suitcase', 'travel bag', 'gym bag', 'shoe bag', 'laundry bag']
    },
    outerwear: {
      include: ['jacket', 'coat', 'blazer', 'cardigan', 'parka', 'bomber', 'trench', 'puffer', 'peacoat', 'windbreaker', 'anorak', 'duster'],
      exclude: ['vest', 'dress', 'shirt jacket', 'overshirt']
    },
    accessories: {
      include: ['jewelry', 'necklace', 'bracelet', 'earring', 'ring', 'scarf', 'belt', 'hat', 'cap', 'beanie', 'watch', 'sunglasses', 'glove'],
      exclude: ['dress', 'top', 'pants', 'shoe']
    }
  };

  const pattern = categoryPatterns[normalizedCategory];
  if (!pattern) {
    // Unknown category - don't filter
    return true;
  }

  // Check for exclusions first (hard blocking)
  const hasExclusion = pattern.exclude.some(term => combinedText.includes(term));
  if (hasExclusion) {
    return false;
  }

  // Check for inclusions
  const hasInclusion = pattern.include.some(term => combinedText.includes(term));
  return hasInclusion;
}

/**
 * Check if product matches the specified color
 * CRITICAL: User-specified colors MUST match in first 3-6 results
 */
function productMatchesColor(product: Product, color: string): boolean {
  const combinedText = `${product.title} ${product.description}`.toLowerCase();
  const normalizedColor = color.toLowerCase();

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
  enableImageValidation: boolean = false,
  imageValidationThreshold: number = 0.6,
  allowSexyContent: boolean = false
): Promise<Map<string, Product[]>> {
  console.log('[executeMultiSearch] Starting with queries:', queries.map(q => q.query));
  console.log('[executeMultiSearch] Image validation:', enableImageValidation ? 'ENABLED' : 'DISABLED');

  const supabase = getSupabaseClient(true) as any;
  const results = new Map<string, Product[]>();

  // Generate text embeddings for all queries in batch
  const queryTexts = queries.map(q => q.query);
  console.log('[executeMultiSearch] Generating text embeddings for:', queryTexts);

  const textEmbeddings = await generateEmbeddings(queryTexts);
  console.log('[executeMultiSearch] Text embeddings generated:', textEmbeddings.length, 'embeddings of length', textEmbeddings[0]?.length);

  // Generate vision embeddings if image validation is enabled
  // Uses serverless-compatible API version (vision-embeddings-api.ts)
  let visionEmbeddings: number[][] | null = null;
  if (enableImageValidation) {
    console.log('[executeMultiSearch] Generating vision embeddings for image validation...');
    try {
      visionEmbeddings = await Promise.all(
        queryTexts.map(text => generateTextVisionEmbedding(text))
      );
      console.log('[executeMultiSearch] Vision embeddings generated:', visionEmbeddings.length);
    } catch (error) {
      console.error('[executeMultiSearch] Vision embedding generation failed, continuing without image validation:', error);
      visionEmbeddings = null;
    }
  }

  // Execute searches in parallel
  const searchPromises = queries.map(async (searchQuery, index) => {
    const textEmbedding = textEmbeddings[index];
    const visionEmbedding = visionEmbeddings?.[index];

    // Calculate how many results to fetch based on priority and weight
    const fetchLimit = Math.ceil(limit * searchQuery.weight * 1.5);

    console.log(`[executeMultiSearch] Calling match_products for "${searchQuery.query}" with limit ${fetchLimit}`);
    console.log(`[executeMultiSearch] Text embedding sample for "${searchQuery.query}":`, textEmbedding?.slice(0, 5));

    let data: any[] = [];

    try {
      // Pass embedding array directly - PostgreSQL will convert to vector
      const result = await supabase.rpc('match_products', {
        query_embedding: textEmbedding,
        match_count: fetchLimit,
      });

      if (result.error) {
        console.error(`[executeMultiSearch] Error for "${searchQuery.query}":`, {
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

      // FILTER 2: Men's products - Always filter out men's clothing
      if (isMensProduct(row.title, row.description || '')) {
        console.log(`[executeMultiSearch] ❌ Filtered men's product: "${row.title?.slice(0, 60)}..."`);
        return false;
      }

      // FILTER 3: Non-apparel materials - Filter out raw fabric, upholstery, DIY materials
      if (isNonApparelMaterial(row.title, row.description || '')) {
        console.log(`[executeMultiSearch] ❌ Filtered non-apparel material: "${row.title?.slice(0, 60)}..."`);
        return false;
      }

      // FILTER 4: Price threshold - Minimum $20 for quality control
      if (row.price !== null && row.price !== undefined && row.price < 20) {
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

    // STAGE 2: Image validation (if enabled and vision embedding available)
    // Uses serverless-compatible vision embeddings from vision-embeddings-api.ts
    if (visionEmbedding && enableImageValidation) {
      console.log(`[executeMultiSearch] Applying image validation (threshold: ${imageValidationThreshold})...`);

      const beforeCount = filteredProducts.length;
      filteredProducts = filteredProducts.filter((row: any) => {
        // Skip if product doesn't have image embedding yet
        if (!row.image_embedding) {
          console.log(`[executeMultiSearch] Skipping image validation for "${row.title}" (no image embedding)`);
          return true; // Keep products without embeddings for now
        }

        // Parse the image embedding from vector format
        let imageEmbedding: number[];
        try {
          if (typeof row.image_embedding === 'string') {
            imageEmbedding = JSON.parse(row.image_embedding);
          } else if (Array.isArray(row.image_embedding)) {
            imageEmbedding = row.image_embedding;
          } else {
            console.log(`[executeMultiSearch] Invalid image embedding format for "${row.title}"`);
            return true;
          }

          // Calculate image similarity
          const imageSimilarity = calculateCosineSimilarity(visionEmbedding, imageEmbedding);
          const passes = imageSimilarity >= imageValidationThreshold;

          if (!passes) {
            console.log(
              `[executeMultiSearch] ❌ Image validation FAILED for "${row.title}" ` +
              `(image similarity: ${(imageSimilarity * 100).toFixed(1)}%, required: ${(imageValidationThreshold * 100).toFixed(1)}%)`
            );
          } else {
            console.log(
              `[executeMultiSearch] ✅ Image validation PASSED for "${row.title}" ` +
              `(image similarity: ${(imageSimilarity * 100).toFixed(1)}%)`
            );
          }

          return passes;
        } catch (error) {
          console.error(`[executeMultiSearch] Error validating image for "${row.title}":`, error);
          return true; // Keep on error
        }
      });

      const filteredCount = beforeCount - filteredProducts.length;
      console.log(`[executeMultiSearch] Image validation filtered out ${filteredCount}/${beforeCount} products`);
    }

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
    }));

    return { query: searchQuery.query, products };
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

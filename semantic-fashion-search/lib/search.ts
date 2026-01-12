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
  } = options;

  // Determine if we need full intent extraction or simple search
  let intent: ParsedIntent;

  if (isSimpleQuery(query)) {
    intent = createSimpleIntent(query);
  } else {
    intent = await extractIntent(query);
  }

  // Fetch a larger pool of results to enable proper pagination
  // We fetch more than needed and paginate through them
  const maxPages = 5; // Support up to 5 pages
  const poolSize = limit * maxPages;

  const searchResults = await executeMultiSearch(
    intent.searchQueries,
    poolSize,
    similarityThreshold,
    enableImageValidation,
    imageValidationThreshold
  );

  // Merge and rank ALL results from the pool
  const allRankedResults = rankResults(
    searchResults,
    intent.searchQueries,
    poolSize,
    diversityFactor
  );

  // Calculate pagination
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedResults = allRankedResults.slice(startIndex, endIndex);

  // Use actual total count from ranked results
  const totalCount = allRankedResults.length;

  console.log(`[semanticSearch] Pagination: page=${page}, showing ${startIndex}-${endIndex} of ${totalCount} total results`);

  return {
    query,
    results: paginatedResults,
    totalCount,
    page,
    pageSize: limit,
    intent,
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
 * Execute multiple semantic searches in parallel
 */
async function executeMultiSearch(
  queries: SearchQuery[],
  limit: number,
  similarityThreshold: number,
  enableImageValidation: boolean = false,
  imageValidationThreshold: number = 0.6
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

    // Check if query has explicit sexy intent
    const queryHasSexyIntent = hasSexyIntent(searchQuery.query);
    console.log(`[executeMultiSearch] Query sexy intent: ${queryHasSexyIntent ? 'YES' : 'NO'}`);

    let filteredProducts = data.filter((row: ProductRow & { similarity: number }) => {
      // FILTER 1: Content filtering - Remove sexy/provocative items unless explicitly requested
      if (!queryHasSexyIntent && isSexyProduct(row.title, row.description || '')) {
        console.log(`[executeMultiSearch] ❌ Filtered sexy product (not requested): "${row.title?.slice(0, 60)}..."`);
        return false;
      }

      // FILTER 2: DHGate quality - Apply stricter threshold for DHGate vendors
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

  // Apply diversity factor - avoid too many similar items
  if (diversityFactor > 0) {
    rankedProducts = applyDiversity(rankedProducts, diversityFactor);
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

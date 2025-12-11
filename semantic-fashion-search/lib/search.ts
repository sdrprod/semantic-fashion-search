import { getSupabaseClient, ProductRow } from './supabase';
import { generateEmbedding, generateEmbeddings } from './embeddings';
import { extractIntent, isSimpleQuery, createSimpleIntent } from './intent';
import type { Product, SearchResponse, ParsedIntent, SearchQuery } from '@/types';

interface SearchOptions {
  limit?: number;
  page?: number;
  similarityThreshold?: number;
  diversityFactor?: number;
}

/**
 * Perform semantic search with intent extraction
 */
export async function semanticSearch(
  query: string,
  options: SearchOptions = {}
): Promise<SearchResponse> {
  const {
    limit = 10,
    page = 1,
    similarityThreshold = 0.3,  // Back to 0.3 with proper embeddings
    diversityFactor = 0.1,
  } = options;

  // Determine if we need full intent extraction or simple search
  let intent: ParsedIntent;

  if (isSimpleQuery(query)) {
    intent = createSimpleIntent(query);
  } else {
    intent = await extractIntent(query);
  }

  // Execute searches for all queries
  const searchResults = await executeMultiSearch(
    intent.searchQueries,
    limit,
    page,
    similarityThreshold
  );

  // Merge and rank results
  const rankedResults = rankResults(
    searchResults,
    intent.searchQueries,
    limit,
    diversityFactor
  );

  return {
    query,
    results: rankedResults,
    totalCount: rankedResults.length,
    page,
    pageSize: limit,
    intent,
  };
}

/**
 * Execute multiple semantic searches in parallel
 */
async function executeMultiSearch(
  queries: SearchQuery[],
  limit: number,
  page: number,
  similarityThreshold: number
): Promise<Map<string, Product[]>> {
  console.log('[executeMultiSearch] Starting with queries:', queries.map(q => q.query));

  const supabase = getSupabaseClient(true) as any;
  const results = new Map<string, Product[]>();

  // Generate embeddings for all queries in batch
  const queryTexts = queries.map(q => q.query);
  console.log('[executeMultiSearch] Generating embeddings for:', queryTexts);

  const embeddings = await generateEmbeddings(queryTexts);
  console.log('[executeMultiSearch] Embeddings generated:', embeddings.length, 'embeddings of length', embeddings[0]?.length);

  // Execute searches in parallel
  const searchPromises = queries.map(async (searchQuery, index) => {
    const embedding = embeddings[index];

    // Calculate how many results to fetch based on priority and weight
    const fetchLimit = Math.ceil(limit * searchQuery.weight * 1.5);

    console.log(`[executeMultiSearch] Calling match_products for "${searchQuery.query}" with limit ${fetchLimit}`);
    console.log(`[executeMultiSearch] Embedding sample for "${searchQuery.query}":`, embedding?.slice(0, 5));

    let data: any[] = [];

    try {
      // Convert embedding array to PostgreSQL vector string format
      const vectorString = `[${embedding.join(',')}]`;

      const result = await supabase.rpc('match_products', {
        query_embedding: vectorString,
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
    console.log(`[executeMultiSearch] Filtering ${data.length} products with threshold ${similarityThreshold}`);
    const products: Product[] = data
      .filter((row: ProductRow & { similarity: number }) => {
        const passes = row.similarity >= similarityThreshold;
        if (!passes && data.indexOf(row) < 3) {
          console.log(`[executeMultiSearch] Filtered out "${row.title}" (similarity: ${row.similarity})`);
        }
        return passes;
      })
      .map((row: ProductRow & { similarity: number }) => ({
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

    // Penalize if we already have many from this brand
    const shouldInclude = brandCount < 3 || Math.random() > factor;

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
  limit: number = 10
): Promise<Product[]> {
  const supabase = getSupabaseClient(true) as any;
  const embedding = await generateEmbedding(query);

  // Convert embedding array to PostgreSQL vector string format
  const vectorString = `[${embedding.join(',')}]`;

  const { data, error } = await supabase.rpc('match_products', {
    query_embedding: vectorString,
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
  }));
}

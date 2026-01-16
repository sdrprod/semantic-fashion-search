/**
 * Vision-Based Re-Ranking using GPT-4 Vision
 *
 * This module uses GPT-4 Vision to analyze product images and re-rank
 * search results based on visual similarity, not just text matching.
 *
 * Critical for queries like "sexy boots" where text descriptions may match
 * but images don't (work boots vs heeled boots).
 */

import OpenAI from 'openai';
import type { Product } from '@/types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface VisualAnalysisResult {
  score: number; // 0-10 score for how well image matches query
  reasoning: string; // Why this score was given
  isMatch: boolean; // Whether this is a good visual match
}

/**
 * Analyze a single product image against a query using GPT-4 Vision
 */
async function analyzeProductImage(
  imageUrl: string,
  query: string,
  productTitle: string
): Promise<VisualAnalysisResult> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 300,
      messages: [
        {
          role: 'system',
          content: `You are a fashion expert analyzing product images for search relevance.

Your task: Score how well this product image matches the user's search query on a scale of 0-10.

Scoring guidelines:
- 9-10: Perfect match - image clearly shows exactly what was requested
- 7-8: Good match - image shows item with most requested characteristics
- 5-6: Partial match - image shows the item type but missing key characteristics
- 3-4: Weak match - item type matches but style/characteristics are opposite
- 0-2: No match - completely wrong item type or characteristics

Example: Query "sexy boots", Image shows:
- Thigh-high stiletto boots → 10 (perfect)
- Heeled ankle boots with platform → 8 (good)
- Regular ankle boots with small heel → 5 (partial)
- Flat work boots → 2 (weak)
- Fuzzy winter boots → 1 (no match)

Respond in JSON format:
{
  "score": <number 0-10>,
  "reasoning": "<why this score>",
  "isMatch": <true if score >= 6, false otherwise>
}`,
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `User's search query: "${query}"\n\nProduct title: "${productTitle}"\n\nAnalyze this product image:`,
            },
            {
              type: 'image_url',
              image_url: {
                url: imageUrl,
                detail: 'low', // Low detail for faster processing
              },
            },
          ],
        },
      ],
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from GPT-4 Vision');
    }

    // Parse JSON response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not extract JSON from response');
    }

    const result = JSON.parse(jsonMatch[0]) as VisualAnalysisResult;
    console.log(`[Vision Rerank] ${productTitle.slice(0, 40)}: score=${result.score}, match=${result.isMatch}`);

    return result;
  } catch (error) {
    console.error('[Vision Rerank] Error analyzing image:', error);
    // Return neutral score on error (don't boost or penalize)
    return {
      score: 5,
      reasoning: 'Error during analysis',
      isMatch: true,
    };
  }
}

/**
 * Re-rank search results using GPT-4 Vision analysis
 *
 * @param products - Initial search results ranked by text similarity
 * @param query - User's search query
 * @param maxToAnalyze - Maximum number of products to analyze (default: 12 for top 1 page, reduces serverless timeout risk)
 * @returns Re-ranked products with vision scores
 */
export async function rerankWithVision(
  products: Product[],
  query: string,
  maxToAnalyze: number = 12
): Promise<Product[]> {
  if (products.length === 0) {
    return products;
  }

  console.log(`[Vision Rerank] Analyzing top ${Math.min(products.length, maxToAnalyze)} products for query: "${query}"`);

  // Analyze top N products in parallel (batches of 3 for consistent speed and rate limit safety)
  const productsToAnalyze = products.slice(0, maxToAnalyze);
  const batchSize = 3;
  const analyzedProducts: (Product & { visionScore?: number; visionMatch?: boolean })[] = [];

  for (let i = 0; i < productsToAnalyze.length; i += batchSize) {
    const batch = productsToAnalyze.slice(i, i + batchSize);

    const batchResults = await Promise.all(
      batch.map(async (product) => {
        const analysis = await analyzeProductImage(product.imageUrl, query, product.title);
        return {
          ...product,
          visionScore: analysis.score,
          visionMatch: analysis.isMatch,
        };
      })
    );

    analyzedProducts.push(...batchResults);
  }

  // Add remaining products without vision scores
  const remainingProducts = products.slice(maxToAnalyze);

  // Combine and re-rank:
  // 1. Products with vision scores sorted by: vision score (70%) + text similarity (30%)
  // 2. Products without vision scores (maintain original order)
  const reranked = [
    ...analyzedProducts.sort((a, b) => {
      const scoreA = (a.visionScore || 5) * 0.7 + (a.similarity || 0) * 100 * 0.3;
      const scoreB = (b.visionScore || 5) * 0.7 + (b.similarity || 0) * 100 * 0.3;
      return scoreB - scoreA;
    }),
    ...remainingProducts,
  ];

  console.log(`[Vision Rerank] Top 5 after reranking:`);
  reranked.slice(0, 5).forEach((p, i) => {
    console.log(`  ${i + 1}. ${p.title.slice(0, 50)} (vision: ${p.visionScore || 'N/A'}, text: ${(p.similarity || 0).toFixed(3)})`);
  });

  return reranked;
}

/**
 * Determine if a query would benefit from vision-based re-ranking
 *
 * Queries with visual/style descriptors (sexy, elegant, casual, professional, etc.)
 * benefit from vision analysis because text descriptions often mismatch images.
 */
export function shouldUseVisionReranking(query: string): boolean {
  const visualKeywords = [
    // Style descriptors
    'sexy', 'elegant', 'casual', 'professional', 'formal', 'glamorous',
    'cute', 'trendy', 'stylish', 'chic', 'edgy', 'bohemian', 'vintage',
    'minimalist', 'classic', 'modern', 'sophisticated',

    // Visual characteristics
    'high heel', 'stiletto', 'platform', 'wedge', 'flat',
    'thigh-high', 'knee-high', 'ankle',
    'bodycon', 'flowy', 'fitted', 'loose', 'tight',
    'sheer', 'opaque', 'sparkly', 'metallic', 'shiny',
    'strappy', 'backless', 'off-shoulder', 'halter',

    // Occasions with strong visual associations
    'party', 'club', 'date night', 'wedding', 'cocktail',
    'red carpet', 'gala', 'prom',
  ];

  const lowerQuery = query.toLowerCase();
  return visualKeywords.some(keyword => lowerQuery.includes(keyword));
}

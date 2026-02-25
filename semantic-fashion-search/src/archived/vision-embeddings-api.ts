/**
 * ============================================================
 * DEPRECATED — DO NOT USE
 * ============================================================
 *
 * This file is archived and excluded from TypeScript compilation
 * (see tsconfig.json: exclude: ["src"]).
 *
 * Why it was removed:
 *   - `generateTextVisionEmbedding` was a misleading stub that called
 *     `generateEmbedding` (OpenAI text-embedding, 1536d) and returned
 *     the result labeled as a "vision embedding."
 *   - The stored CLIP image embeddings in `products.image_embedding` are
 *     512-dimensional. Comparing a 1536d text embedding against a 512d
 *     CLIP embedding would throw a dimension-mismatch error.
 *   - `generateImageVisionEmbedding` always threw:
 *     "Image vision embedding not yet available in serverless environment"
 *   - The image validation pipeline in search.ts was always disabled
 *     (`enableImageValidation = false`) because of the above issues.
 *
 * What replaces it:
 *   - True multi-modal search via `match_products_hybrid()` SQL function
 *     (in scripts/add-vision-embeddings.sql), which combines:
 *       • Text embedding (OpenAI 1536d)  — semantic intent
 *       • Image embedding (CLIP 512d)    — visual appearance
 *     The query-side CLIP embedding is generated at runtime via the
 *     HuggingFace Inference API (clip-vit-base-patch32).
 *
 * ============================================================
 */

/**
 * Calculate cosine similarity between two vectors
 */
export function calculateCosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) {
    throw new Error('Vectors must have the same dimensions');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  const similarity = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  return similarity;
}

/**
 * STUB — returned OpenAI text embeddings (1536d) labeled as "vision embeddings."
 * Incompatible with stored CLIP embeddings (512d).
 */
export async function generateTextVisionEmbedding(text: string): Promise<number[]> {
  const { generateEmbedding } = await import('../../semantic-fashion-search/lib/embeddings');

  console.log('[Vision API] Generating text-based vision proxy for:', text.slice(0, 50));

  try {
    const embedding = await generateEmbedding(text);
    return embedding;
  } catch (error) {
    console.error('[Vision API] Error generating vision embedding:', error);
    throw new Error('Failed to generate vision embedding');
  }
}

/**
 * STUB — always threw "not yet available in serverless environment."
 */
export async function generateImageVisionEmbedding(
  imageData: Buffer | Blob | string
): Promise<number[]> {
  console.log('[Vision API] Image embedding generation not yet implemented for serverless');
  throw new Error('Image vision embedding not yet available in serverless environment');
}

/**
 * Normalize an embedding vector
 */
export function normalizeEmbedding(embedding: number[]): number[] {
  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  return embedding.map(val => val / magnitude);
}

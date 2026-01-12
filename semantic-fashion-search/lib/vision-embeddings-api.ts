/**
 * Vision Embeddings - Serverless-Compatible API Version
 *
 * This module provides vision embedding functionality that works in
 * serverless environments (Netlify Functions, Vercel, AWS Lambda).
 *
 * Uses OpenAI's API for vision processing instead of local CLIP model.
 * For batch processing, use vision-embeddings.ts with local CLIP model.
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
 * Generate vision embedding for text using OpenAI (serverless-safe)
 *
 * For now, we'll use text embeddings as a proxy for visual concepts.
 * This is a temporary solution until we have a proper vision API.
 *
 * TODO: Integrate proper vision API when available
 */
export async function generateTextVisionEmbedding(text: string): Promise<number[]> {
  // For serverless, we'll use OpenAI text embeddings as a proxy
  // The text describes visual concepts which correlates reasonably well
  const { generateEmbedding } = await import('./embeddings');

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
 * Generate vision embedding from uploaded image
 *
 * TODO: Implement proper image-to-embedding pipeline
 * Options:
 * 1. External API service (Replicate, HuggingFace Inference API)
 * 2. Dedicated vision processing server
 * 3. OpenAI GPT-4 Vision → text description → text embedding
 */
export async function generateImageVisionEmbedding(
  imageData: Buffer | Blob | string
): Promise<number[]> {
  console.log('[Vision API] Image embedding generation not yet implemented for serverless');

  // TODO: Implement image processing
  // For now, return a placeholder to avoid breaking the app
  throw new Error('Image vision embedding not yet available in serverless environment');
}

/**
 * Normalize an embedding vector
 */
export function normalizeEmbedding(embedding: number[]): number[] {
  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  return embedding.map(val => val / magnitude);
}

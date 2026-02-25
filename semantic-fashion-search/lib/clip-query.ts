/**
 * CLIP Text Embedding — Serverless-safe runtime query embedding
 *
 * Uses HuggingFace Inference API to generate a 512-dimensional CLIP text
 * embedding for a search query. The result lives in the same vector space as
 * the stored `products.image_embedding` CLIP vectors, enabling text-to-image
 * similarity scoring at search time.
 *
 * Requires: HUGGINGFACE_API_KEY environment variable
 * Model: openai/clip-vit-base-patch32 (same model used for image embedding generation)
 *
 * Gracefully returns null when:
 *   - HUGGINGFACE_API_KEY is not set
 *   - The API call fails or times out
 *   - The response format is unexpected
 */

const HF_API_URL =
  'https://api-inference.huggingface.co/pipeline/feature-extraction/openai/clip-vit-base-patch32';

const CLIP_TIMEOUT_MS = 4000; // 4 s — must fit within search pipeline budget

/**
 * Generate a 512d CLIP text embedding for the given query string.
 * Returns null (graceful skip) if the HF API is unavailable or misconfigured.
 */
export async function generateClipTextEmbedding(
  text: string
): Promise<number[] | null> {
  const apiKey = process.env.HUGGINGFACE_API_KEY;
  if (!apiKey) {
    // Feature disabled — no penalty, just no image re-ranking
    return null;
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), CLIP_TIMEOUT_MS);

    const response = await fetch(HF_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: text,
        options: { wait_for_model: true },
      }),
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!response.ok) {
      console.warn(
        `[CLIP] HuggingFace API returned ${response.status} — skipping image re-ranking`
      );
      return null;
    }

    const data = await response.json();

    // HF feature-extraction returns: number[] or number[][]
    const embedding: unknown = Array.isArray(data) && Array.isArray(data[0])
      ? data[0]
      : data;

    if (!Array.isArray(embedding) || embedding.length !== 512) {
      console.warn(
        `[CLIP] Unexpected embedding shape: ${Array.isArray(embedding) ? embedding.length : typeof embedding}d — expected 512d`
      );
      return null;
    }

    console.log(`[CLIP] Generated 512d text embedding for: "${text.slice(0, 60)}"`);
    return embedding as number[];
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      console.warn('[CLIP] HuggingFace API timed out — skipping image re-ranking');
    } else {
      console.warn('[CLIP] HuggingFace API error — skipping image re-ranking:', err);
    }
    return null;
  }
}

/**
 * Cosine similarity between two equal-length vectors.
 * Both vectors should already be unit-normalized (CLIP embeddings are).
 */
export function clipCosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

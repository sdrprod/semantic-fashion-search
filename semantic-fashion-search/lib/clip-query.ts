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

// sentence-transformers/clip-ViT-B-32 wraps the same CLIP ViT-B/32 weights as
// openai/clip-vit-base-patch32 but exposes the TEXT encoder via the HF inference
// API reliably.  Its 512-d text output lives in the same projected embedding space
// as the vision encoder used to generate stored product image_embeddings, making
// cross-modal cosine similarity valid.
// NOTE: must use api-inference.huggingface.co directly — router.huggingface.co
// routes to "hf-inference" provider which does not support sentence-transformers models.
const HF_API_URL =
  'https://api-inference.huggingface.co/models/sentence-transformers/clip-ViT-B-32';

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
    console.warn('[CLIP] HUGGINGFACE_API_KEY not set — image re-ranking disabled');
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
      const errorBody = await response.text().catch(() => '');
      console.warn(
        `[CLIP] HuggingFace API returned ${response.status} — skipping image re-ranking. Body: ${errorBody.slice(0, 300)}`
      );
      return null;
    }

    const data = await response.json();

    // sentence-transformers returns number[][] (batch × dims) for a single input,
    // e.g. [[0.12, -0.03, ...]] — unwrap the outer batch dimension.
    // Fall back to treating a flat number[] as the embedding directly.
    let embedding: unknown;
    if (Array.isArray(data) && Array.isArray(data[0])) {
      embedding = data[0];          // [[...512 floats...]] → [...512 floats...]
    } else if (Array.isArray(data)) {
      embedding = data;             // flat array (older API response shape)
    } else {
      embedding = null;
    }

    if (!Array.isArray(embedding) || (embedding as number[]).length !== 512) {
      console.warn(
        `[CLIP] Unexpected embedding shape: ${Array.isArray(embedding) ? (embedding as number[]).length : typeof embedding}d — expected 512d. Raw response: ${JSON.stringify(data).slice(0, 200)}`
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

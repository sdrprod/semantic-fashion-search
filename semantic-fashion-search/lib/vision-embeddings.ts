import { pipeline, env } from '@xenova/transformers';

// Configure transformers to cache models locally
env.cacheDir = './.cache/transformers';

// Lazy-load the CLIP model (only loads on first use)
let clipModel: any = null;

/**
 * Get or initialize the CLIP model
 */
async function getClipModel() {
  if (!clipModel) {
    console.log('[Vision] Loading CLIP model (first time may take a moment)...');
    clipModel = await pipeline('feature-extraction', 'Xenova/clip-vit-base-patch32');
    console.log('[Vision] CLIP model loaded successfully');
  }
  return clipModel;
}

/**
 * Generate vision embedding for text (e.g., search query)
 * Returns a 512-dimensional vector representing the visual concept
 */
export async function generateTextVisionEmbedding(text: string): Promise<number[]> {
  try {
    const model = await getClipModel();

    // Generate embedding for the text as a visual concept
    const output = await model(text, {
      pooling: 'mean',
      normalize: true,
    });

    // Convert to regular array
    const embedding = Array.from(output.data) as number[];

    console.log(`[Vision] Generated text vision embedding: ${text.slice(0, 50)}... (${embedding.length}d)`);

    return embedding;
  } catch (error) {
    console.error('[Vision] Error generating text vision embedding:', error);
    throw new Error('Failed to generate text vision embedding');
  }
}

/**
 * Generate vision embedding for an image URL
 * Downloads the image and creates a vector representation
 */
export async function generateImageVisionEmbedding(imageUrl: string): Promise<number[]> {
  try {
    console.log(`[Vision] Processing image: ${imageUrl.slice(0, 80)}...`);

    // Download the image
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
    }

    const imageBuffer = await response.arrayBuffer();
    const imageBlob = new Blob([imageBuffer]);

    // Convert to a format CLIP can process
    const model = await getClipModel();
    const output = await model(imageBlob, {
      pooling: 'mean',
      normalize: true,
    });

    // Convert to regular array
    const embedding = Array.from(output.data) as number[];

    console.log(`[Vision] Generated image embedding (${embedding.length}d)`);

    return embedding;
  } catch (error) {
    console.error(`[Vision] Error processing image ${imageUrl}:`, error);
    // Return null embedding on error - will be handled by caller
    throw error;
  }
}

/**
 * Calculate cosine similarity between two embeddings
 * Returns a score between -1 and 1 (higher is more similar)
 */
export function calculateCosineSimilarity(embedding1: number[], embedding2: number[]): number {
  if (embedding1.length !== embedding2.length) {
    throw new Error('Embeddings must have the same dimension');
  }

  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;

  for (let i = 0; i < embedding1.length; i++) {
    dotProduct += embedding1[i] * embedding2[i];
    norm1 += embedding1[i] * embedding1[i];
    norm2 += embedding2[i] * embedding2[i];
  }

  const similarity = dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  return similarity;
}

/**
 * Validate if an image matches a text query well enough
 * Returns true if the image is relevant to the query
 */
export async function validateImageRelevance(
  imageUrl: string,
  queryText: string,
  threshold: number = 0.6
): Promise<{ relevant: boolean; similarity: number }> {
  try {
    // Generate embeddings for both
    const [imageEmbedding, textEmbedding] = await Promise.all([
      generateImageVisionEmbedding(imageUrl),
      generateTextVisionEmbedding(queryText),
    ]);

    // Calculate similarity
    const similarity = calculateCosineSimilarity(imageEmbedding, textEmbedding);
    const relevant = similarity >= threshold;

    console.log(
      `[Vision] Image relevance for "${queryText}": ${(similarity * 100).toFixed(1)}% ` +
      `(threshold: ${(threshold * 100).toFixed(1)}%) - ${relevant ? 'PASS' : 'FAIL'}`
    );

    return { relevant, similarity };
  } catch (error) {
    console.error('[Vision] Error validating image relevance:', error);
    // On error, assume relevant to avoid false negatives
    return { relevant: true, similarity: 0.5 };
  }
}

/**
 * Generate vision embeddings in batch for multiple images
 * More efficient than processing one at a time
 */
export async function generateImageVisionEmbeddingsBatch(
  imageUrls: string[],
  onProgress?: (current: number, total: number) => void
): Promise<Array<{ url: string; embedding: number[] | null }>> {
  const results: Array<{ url: string; embedding: number[] | null }> = [];

  for (let i = 0; i < imageUrls.length; i++) {
    const url = imageUrls[i];

    try {
      const embedding = await generateImageVisionEmbedding(url);
      results.push({ url, embedding });
    } catch (error) {
      console.error(`[Vision] Failed to process image ${i + 1}/${imageUrls.length}:`, error);
      results.push({ url, embedding: null });
    }

    if (onProgress) {
      onProgress(i + 1, imageUrls.length);
    }

    // Small delay to avoid overwhelming the system
    if (i < imageUrls.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  return results;
}

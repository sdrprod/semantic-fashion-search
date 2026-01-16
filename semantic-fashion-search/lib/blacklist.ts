import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Check if a product is blacklisted
 */
export async function isProductBlacklisted(
  contentHash: string,
  title: string
): Promise<boolean> {
  try {
    // Check by content hash (most reliable)
    if (contentHash) {
      const { data: hashMatch, error: hashError } = await supabase
        .from('product_blacklist')
        .select('id')
        .eq('content_hash', contentHash)
        .maybeSingle();

      if (hashError) {
        console.error('[Blacklist] Error checking content hash:', hashError);
      }

      if (hashMatch) {
        console.log('[Blacklist] Product blocked by content hash:', contentHash);
        return true;
      }
    }

    // Check by title pattern (fallback)
    const { data: titleMatches, error: titleError } = await supabase
      .from('product_blacklist')
      .select('title_pattern');

    if (titleError) {
      console.error('[Blacklist] Error checking title patterns:', titleError);
      return false;
    }

    if (titleMatches && titleMatches.length > 0) {
      for (const entry of titleMatches) {
        const pattern = entry.title_pattern.toLowerCase();
        const productTitle = title.toLowerCase();

        // Simple substring match (can be enhanced with regex if needed)
        if (productTitle.includes(pattern) || pattern.includes(productTitle)) {
          console.log('[Blacklist] Product blocked by title pattern:', pattern);
          return true;
        }
      }
    }

    return false;
  } catch (error) {
    console.error('[Blacklist] Error checking blacklist:', error);
    return false; // Don't block on error
  }
}

/**
 * Add a product to the blacklist
 */
export async function addToBlacklist(
  titlePattern: string,
  contentHash: string | null,
  productUrl: string | null,
  reason: string
): Promise<boolean> {
  try {
    const { error } = await supabase.from('product_blacklist').insert({
      title_pattern: titlePattern,
      content_hash: contentHash,
      product_url: productUrl,
      reason: reason,
    });

    if (error) {
      // Ignore duplicate errors (UNIQUE constraint)
      if (error.code === '23505') {
        console.log('[Blacklist] Product already blacklisted');
        return true;
      }
      console.error('[Blacklist] Error adding to blacklist:', error);
      return false;
    }

    console.log('[Blacklist] Added to blacklist:', titlePattern);
    return true;
  } catch (error) {
    console.error('[Blacklist] Error adding to blacklist:', error);
    return false;
  }
}

/**
 * Remove a product from the blacklist
 */
export async function removeFromBlacklist(contentHash: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('product_blacklist')
      .delete()
      .eq('content_hash', contentHash);

    if (error) {
      console.error('[Blacklist] Error removing from blacklist:', error);
      return false;
    }

    console.log('[Blacklist] Removed from blacklist:', contentHash);
    return true;
  } catch (error) {
    console.error('[Blacklist] Error removing from blacklist:', error);
    return false;
  }
}

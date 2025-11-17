import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';
import { syncImpactProducts } from '@/lib/impact';
import { generateEmbedding } from '@/lib/embeddings';

/**
 * Sync products from affiliate network to database
 * POST /api/admin/sync-products
 *
 * Headers:
 *   x-admin-secret: Required for authentication
 *
 * Body:
 *   source: 'impact' | 'cj' (affiliate network)
 *   campaignId?: string (optional, uses env default)
 *   maxProducts?: number (default: 1000)
 *   generateEmbeddings?: boolean (default: true)
 */
export async function POST(request: NextRequest) {
  try {
    // Verify admin secret
    const adminSecret = request.headers.get('x-admin-secret');
    if (adminSecret !== process.env.ADMIN_SECRET) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      source = 'impact',
      campaignId,
      maxProducts = 1000,
      generateEmbeddings = true,
    } = body;

    if (source !== 'impact') {
      return NextResponse.json(
        { error: 'Currently only Impact is supported. CJ integration coming soon.' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient(true);

    // Sync products from affiliate network
    const { synced, errors } = await syncImpactProducts(supabase, {
      campaignId,
      maxProducts,
      generateEmbeddings: false, // We'll generate separately for better control
    });

    // Generate embeddings if requested
    let embeddingsGenerated = 0;
    if (generateEmbeddings && synced > 0) {
      // Fetch products without embeddings
      const { data: products } = await supabase
        .from('products')
        .select('id, combined_text')
        .is('embedding', null)
        .limit(synced);

      const typedProducts = products as Array<{ id: string; combined_text: string }> | null;

      if (typedProducts && typedProducts.length > 0) {
        // Generate embeddings in batches
        const batchSize = 50;
        for (let i = 0; i < typedProducts.length; i += batchSize) {
          const batch = typedProducts.slice(i, i + batchSize);

          const embeddings = await Promise.all(
            batch.map(p => generateEmbedding(p.combined_text))
          );

          // Update products with embeddings
          for (let j = 0; j < batch.length; j++) {
            await (supabase as any)
              .from('products')
              .update({ embedding: embeddings[j] })
              .eq('id', batch[j].id);

            embeddingsGenerated++;
          }

          // Rate limiting for OpenAI
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
    }

    return NextResponse.json({
      success: true,
      synced,
      errors,
      embeddingsGenerated,
      message: `Synced ${synced} products with ${errors} errors. Generated ${embeddingsGenerated} embeddings.`,
    });

  } catch (err) {
    console.error('Sync error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Sync failed' },
      { status: 500 }
    );
  }
}

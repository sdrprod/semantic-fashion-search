import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';
import { syncImpactProducts, syncAllCampaigns, getAllCampaignIds } from '@/lib/impact';
import { syncCJProducts } from '@/lib/cj-affiliate';
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
 *   syncAll?: boolean (sync all configured campaigns)
 *   campaignId?: string (optional, uses env default for single sync)
 *   maxProducts?: number (default: 1000 for single, 500 per campaign for syncAll)
 *   generateEmbeddings?: boolean (default: true)
 *   minQualityScore?: number (default: 5, range: 0-7)
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
      syncAll = false,
      campaignId,
      maxProducts = 1000,
      generateEmbeddings = true,
      minQualityScore = 5,
    } = body;

    const supabase = getSupabaseClient(true);

    let synced = 0;
    let errors = 0;
    let skipped = 0;
    let campaignResults: Array<{ campaignId: string; synced: number; errors: number }> | undefined;

    // Handle CJ Affiliate
    if (source === 'cj') {
      const result = await syncCJProducts(supabase, {
        maxProducts,
        generateEmbeddings: false, // We'll generate separately for better control
        minQualityScore: minQualityScore || 4, // CJ default is 4 (lower than Impact)
      });

      synced = result.synced;
      errors = result.errors;
      skipped = result.skipped;
    }
    // Handle Impact
    else if (source === 'impact') {
      if (syncAll) {
      // Sync all configured campaigns
      const campaignIds = getAllCampaignIds();

      if (campaignIds.length === 0) {
        return NextResponse.json(
          { error: 'No campaign IDs configured. Set IMPACT_CAMPAIGN_IDS environment variable.' },
          { status: 400 }
        );
      }

      const result = await syncAllCampaigns(supabase, {
        maxProductsPerCampaign: maxProducts || 500,
        generateEmbeddings: false, // We'll generate separately for better control
        minQualityScore,
      });

      synced = result.totalSynced;
      errors = result.totalErrors;
      campaignResults = result.campaignResults;
    } else {
      // Sync single campaign (backward compatible)
      const result = await syncImpactProducts(supabase, {
        campaignId,
        maxProducts,
        generateEmbeddings: false, // We'll generate separately for better control
        minQualityScore,
      });

      synced = result.synced;
      errors = result.errors;
      }
    } else {
      return NextResponse.json(
        { error: `Unknown affiliate network source: ${source}. Supported: 'impact', 'cj'` },
        { status: 400 }
      );
    }

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
            // Convert embedding array to PostgreSQL vector format
            const vectorString = `[${embeddings[j].join(',')}]`;

            await (supabase as any)
              .from('products')
              .update({ embedding: vectorString })
              .eq('id', batch[j].id);

            embeddingsGenerated++;
          }

          // Rate limiting for OpenAI
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
    }

    const response: {
      success: boolean;
      synced: number;
      errors: number;
      skipped?: number;
      embeddingsGenerated: number;
      message: string;
      campaignResults?: Array<{ campaignId: string; synced: number; errors: number }>;
    } = {
      success: true,
      synced,
      errors,
      skipped: skipped > 0 ? skipped : undefined,
      embeddingsGenerated,
      message: syncAll
        ? `Synced ${synced} products from ${campaignResults?.length || 0} campaigns with ${errors} errors. Generated ${embeddingsGenerated} embeddings.`
        : `Synced ${synced} products${skipped > 0 ? ` (skipped ${skipped})` : ''} with ${errors} errors. Generated ${embeddingsGenerated} embeddings.`,
    };

    if (campaignResults) {
      response.campaignResults = campaignResults;
    }

    return NextResponse.json(response);

  } catch (err) {
    console.error('Sync error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Sync failed' },
      { status: 500 }
    );
  }
}

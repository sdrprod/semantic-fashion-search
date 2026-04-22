import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';
import { generateEmbedding } from '@/lib/embeddings';

/**
 * Generate embeddings for products
 * POST /api/admin/generate-embeddings
 *
 * Headers:
 *   x-admin-secret: Required for authentication
 *
 * Body:
 *   action: 'count' | 'generate'
 *   batchSize?: number (default: 50)
 *   force?: boolean — if true, re-generate embeddings for ALL products (even those
 *           that already have one). Required when the embedding model has changed,
 *           since stale embeddings from a different model produce near-zero cosine
 *           similarity and the search threshold filters everything out.
 *   offset?: number — row offset for paginating through the full catalog in force mode
 */
export async function POST(request: NextRequest) {
  try {
    const adminSecret = request.headers.get('x-admin-secret');
    if (adminSecret !== process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action = 'count', batchSize = 50, force = false, offset = 0 } = body;

    const supabase = getSupabaseClient(true);

    if (action === 'count') {
      // In force mode, report total products; otherwise report those missing embeddings.
      let q = supabase.from('products').select('*', { count: 'exact', head: true });
      if (!force) q = q.is('embedding', null);

      const { count, error } = await q;
      if (error) throw new Error(`Failed to count products: ${error.message}`);

      const { count: totalCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true });

      return NextResponse.json({
        needsEmbedding: count ?? 0,
        totalProducts: totalCount ?? 0,
        mode: force ? 'force (all products)' : 'normal (missing only)',
      });
    }

    if (action === 'generate') {
      // force=true: process ALL products at the given offset (re-index after model change)
      // force=false: process only products with null embeddings (normal first-time indexing)
      let q = supabase
        .from('products')
        .select('id, combined_text, title')
        .order('created_at', { ascending: true })
        .range(offset, offset + batchSize - 1);

      if (!force) q = (q as any).is('embedding', null);

      const { data: products, error: fetchError } = await q;

      if (fetchError) throw new Error(`Failed to fetch products: ${fetchError.message}`);

      const typedProducts = products as Array<{ id: string; combined_text: string; title: string }> | null;

      if (!typedProducts || typedProducts.length === 0) {
        return NextResponse.json({
          generated: 0,
          errors: 0,
          processed: 0,
          nextOffset: null,
          message: force
            ? `No more products at offset ${offset} — re-indexing complete`
            : 'No products need embeddings',
        });
      }

      let generated = 0;
      let errors = 0;

      for (const product of typedProducts) {
        try {
          const textToEmbed = product.combined_text || product.title || '';
          if (!textToEmbed.trim()) {
            errors++;
            continue;
          }

          const embedding = await generateEmbedding(textToEmbed);
          const vectorString = `[${embedding.join(',')}]`;

          const { error: updateError } = await (supabase as any)
            .from('products')
            .update({ embedding: vectorString })
            .eq('id', product.id);

          if (updateError) {
            console.error(`Failed to update product ${product.id}:`, updateError);
            errors++;
          } else {
            generated++;
          }

          // Stay well under OpenAI rate limits
          await new Promise(resolve => setTimeout(resolve, 100));

        } catch (err) {
          console.error(`Error generating embedding for product ${product.id}:`, err);
          errors++;
        }
      }

      const nextOffset = typedProducts.length === batchSize ? offset + batchSize : null;

      return NextResponse.json({
        generated,
        errors,
        processed: typedProducts.length,
        nextOffset,
        message: `Processed ${typedProducts.length} products (offset ${offset}): ${generated} updated, ${errors} errors. ${nextOffset !== null ? `Next offset: ${nextOffset}` : 'Batch complete.'}`,
      });
    }

    return NextResponse.json(
      { error: 'Invalid action. Use "count" or "generate".' },
      { status: 400 }
    );

  } catch (err) {
    console.error('Generate embeddings error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to generate embeddings' },
      { status: 500 }
    );
  }
}

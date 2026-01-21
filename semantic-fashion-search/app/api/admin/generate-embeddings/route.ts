import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';
import { generateEmbedding } from '@/lib/embeddings';

/**
 * Generate embeddings for products without embeddings
 * POST /api/admin/generate-embeddings
 *
 * Headers:
 *   x-admin-secret: Required for authentication
 *
 * Body:
 *   action: 'count' | 'generate'
 *   batchSize?: number (default: 50)
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
    const { action = 'count', batchSize = 50 } = body;

    const supabase = getSupabaseClient(true);

    if (action === 'count') {
      // Count products without embeddings
      const { count, error } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .is('embedding', null);

      if (error) {
        throw new Error(`Failed to count products: ${error.message}`);
      }

      return NextResponse.json({
        count: count || 0,
      });
    }

    if (action === 'generate') {
      // Fetch products without embeddings (limited by batchSize)
      const { data: products, error: fetchError } = await supabase
        .from('products')
        .select('id, combined_text')
        .is('embedding', null)
        .limit(batchSize);

      if (fetchError) {
        throw new Error(`Failed to fetch products: ${fetchError.message}`);
      }

      const typedProducts = products as Array<{ id: string; combined_text: string }> | null;

      if (!typedProducts || typedProducts.length === 0) {
        return NextResponse.json({
          generated: 0,
          errors: 0,
          message: 'No products need embeddings',
        });
      }

      let generated = 0;
      let errors = 0;

      // Generate embeddings for each product
      for (const product of typedProducts) {
        try {
          const embedding = await generateEmbedding(product.combined_text);

          // Convert embedding array to PostgreSQL vector format
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

          // Rate limiting for OpenAI API (3,500 RPM = ~58 RPS, but let's be conservative)
          await new Promise(resolve => setTimeout(resolve, 100));

        } catch (err) {
          console.error(`Error generating embedding for product ${product.id}:`, err);
          errors++;
        }
      }

      return NextResponse.json({
        generated,
        errors,
        message: `Generated ${generated} embeddings with ${errors} errors`,
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

import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';
import { generateEmbedding } from '@/lib/embeddings';

/**
 * Diagnostic endpoint to check production environment setup
 * Access at /api/diagnose
 */
export async function GET() {
  try {
    const diagnostics: Record<string, any> = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'unknown',
      envVars: {
        hasAnthropicKey: !!process.env.ANTHROPIC_API_KEY,
        hasOpenAIKey: !!process.env.OPENAI_API_KEY,
        hasSupabaseUrl: !!(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL),
        hasSupabaseServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        hasSupabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        baseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'NOT SET',
        platform: process.env.NETLIFY ? 'Netlify' : (process.env.VERCEL ? 'Vercel' : 'Unknown'),
      },
      openai: { status: 'untested' as string, embeddingDimensions: null as number | null, error: null as string | null },
      supabase: {
        connection: 'untested' as string,
        productCount: null as number | null,
        productsWithEmbeddings: null as number | null,
        productsWithoutEmbeddings: null as number | null,
        sampleSimilarity: null as number | null,
        rpcFunctionExists: null as boolean | null,
        error: null as string | null,
      },
      recommendations: [] as string[],
    };

    // --- Test OpenAI embedding ---
    try {
      const testEmbedding = await generateEmbedding('black dress');
      diagnostics.openai.status = 'ok';
      diagnostics.openai.embeddingDimensions = testEmbedding.length;
    } catch (err: any) {
      diagnostics.openai.status = 'error';
      diagnostics.openai.error = err.message;
      diagnostics.recommendations.push(`CRITICAL: OpenAI embedding failed — ${err.message}`);
    }

    // --- Test Supabase connection + product counts ---
    try {
      const supabase = getSupabaseClient(true);

      // Total product count
      const { count: totalCount, error: countError } = await supabase
        .from('products')
        .select('id', { count: 'exact', head: true });

      if (countError) throw countError;
      diagnostics.supabase.connection = 'ok';
      diagnostics.supabase.productCount = totalCount;

      // Products with embeddings
      const { count: withEmbCount, error: embErr } = await supabase
        .from('products')
        .select('id', { count: 'exact', head: true })
        .not('embedding', 'is', null);

      if (!embErr) {
        diagnostics.supabase.productsWithEmbeddings = withEmbCount;
        diagnostics.supabase.productsWithoutEmbeddings = (totalCount ?? 0) - (withEmbCount ?? 0);
      }

      // Test RPC function with a real embedding (if OpenAI worked)
      if (diagnostics.openai.status === 'ok') {
        try {
          const testEmbedding = await generateEmbedding('black dress');
          const { data: rpcData, error: rpcError } = await (supabase as any).rpc('hybrid_match_products', {
            query_embedding: testEmbedding,
            query_text: 'black dress',
            match_count: 5,
            vector_weight: 0.6,
            text_weight: 0.4,
          });

          if (rpcError) {
            diagnostics.supabase.rpcFunctionExists = false;
            diagnostics.supabase.error = `RPC error: ${rpcError.message}`;
            diagnostics.recommendations.push(`CRITICAL: hybrid_match_products RPC failed — ${rpcError.message}`);
          } else {
            diagnostics.supabase.rpcFunctionExists = true;
            const rows = rpcData ?? [];
            diagnostics.supabase.sampleSimilarity = rows.length > 0
              ? rows.map((r: any) => parseFloat(r.similarity?.toFixed(4))).slice(0, 5)
              : 'no results returned';
            if (rows.length === 0) {
              diagnostics.recommendations.push('WARNING: RPC returned 0 results for "black dress" — products may lack embeddings');
            }
          }
        } catch (rpcEx: any) {
          diagnostics.supabase.rpcFunctionExists = false;
          diagnostics.supabase.error = rpcEx.message;
        }
      }

      if ((totalCount ?? 0) === 0) {
        diagnostics.recommendations.push('CRITICAL: products table is empty — re-sync products from affiliate APIs');
      } else if ((diagnostics.supabase.productsWithoutEmbeddings ?? 0) > 0) {
        diagnostics.recommendations.push(
          `WARNING: ${diagnostics.supabase.productsWithoutEmbeddings} products have no embeddings — run /api/admin/generate-embeddings`
        );
      }
    } catch (err: any) {
      diagnostics.supabase.connection = 'error';
      diagnostics.supabase.error = err.message;
      diagnostics.recommendations.push(`CRITICAL: Supabase connection failed — ${err.message}`);
    }

    if (diagnostics.recommendations.length === 0) {
      diagnostics.recommendations.push('All systems operational');
    }

    return NextResponse.json(diagnostics, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Diagnostic check failed', message: error.message },
      { status: 500 }
    );
  }
}

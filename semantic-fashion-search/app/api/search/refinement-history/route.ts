import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getSupabaseClient } from '@/lib/supabase';

interface RefinementHistoryRequest {
  initialQuery: string;
  refinements: string[];
  resultCounts: number[];
  timestamps: number[];
  clickedProductId?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: RefinementHistoryRequest = await request.json();
    const { initialQuery, refinements, resultCounts, timestamps, clickedProductId } = body;

    // Validation
    if (!initialQuery || !Array.isArray(refinements) || !Array.isArray(resultCounts)) {
      return NextResponse.json(
        { error: 'Invalid request: missing required fields' },
        { status: 400 }
      );
    }

    console.log('[Refinement History API] Saving refinement for user:', session.user.id);
    console.log('[Refinement History API] Initial query:', initialQuery);
    console.log('[Refinement History API] Refinements:', refinements);

    // Store in Supabase
    const supabase = getSupabaseClient(true);
    const { data, error } = await (supabase.from('search_refinement_history') as any).insert({
      user_id: session.user.id,
      initial_query: initialQuery,
      refinement_path: refinements,
      result_count_at_each_level: resultCounts,
      refinement_timestamps: timestamps,
      clicked_product_id: clickedProductId || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (error) {
      console.error('[Refinement History API] Database error:', error);
      throw error;
    }

    console.log('[Refinement History API] Successfully saved refinement history');

    return NextResponse.json(
      { success: true, data },
      { status: 201 }
    );
  } catch (err) {
    console.error('[Refinement History API] Error:', err instanceof Error ? err.message : String(err));

    return NextResponse.json(
      {
        error: 'Failed to save refinement history',
        details: err instanceof Error ? err.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 });
}

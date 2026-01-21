import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  console.log('[Feedback API] Request received');

  try {
    const body = await request.json();
    const { sessionId, productId, vote } = body;

    console.log('[Feedback API] Vote params:', { sessionId, productId, vote });

    // Validate session ID
    if (!sessionId || typeof sessionId !== 'string' || sessionId.trim().length === 0) {
      console.log('[Feedback API] Invalid session ID');
      return NextResponse.json(
        { error: 'Invalid session ID' },
        { status: 400 }
      );
    }

    // Validate product ID (should be a UUID)
    if (!productId || typeof productId !== 'string' || productId.trim().length === 0) {
      console.log('[Feedback API] Invalid product ID');
      return NextResponse.json(
        { error: 'Invalid product ID' },
        { status: 400 }
      );
    }

    // Validate vote value (must be 1, -1, or 0 for removal)
    if (vote !== 1 && vote !== -1 && vote !== 0) {
      console.log('[Feedback API] Invalid vote value:', vote);
      return NextResponse.json(
        { error: 'Vote must be 1 (upvote), -1 (downvote), or 0 (remove)' },
        { status: 400 }
      );
    }

    // Get Supabase client (server-side with service role)
    const supabase = getSupabaseClient(true);

    // If vote is 0, delete the record (remove vote)
    if (vote === 0) {
      console.log('[Feedback API] Deleting vote from database...');

      const { error } = await (supabase as any)
        .from('product_feedback')
        .delete()
        .eq('session_id', sessionId.trim())
        .eq('product_id', productId.trim());

      if (error) {
        console.error('[Feedback API] Supabase delete error:', error);
        return NextResponse.json(
          { error: 'Failed to remove vote from database' },
          { status: 500 }
        );
      }

      console.log('[Feedback API] Vote removed successfully');
    } else {
      // Upsert vote (insert or update if exists)
      console.log('[Feedback API] Upserting vote to database...');

      // Using 'any' type assertion since product_feedback table type is not in the generated types yet
      const { error } = await (supabase as any)
        .from('product_feedback')
        .upsert(
          {
            session_id: sessionId.trim(),
            product_id: productId.trim(),
            vote: vote,
            updated_at: new Date().toISOString()
          },
          {
            onConflict: 'session_id,product_id'
          }
        );

      if (error) {
        console.error('[Feedback API] Supabase upsert error:', error);
        return NextResponse.json(
          { error: 'Failed to save vote to database' },
          { status: 500 }
        );
      }

      console.log('[Feedback API] Vote saved successfully');
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[Feedback API] Error:', err);
    console.error('[Feedback API] Error stack:', err instanceof Error ? err.stack : 'No stack trace');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 });
}

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getSupabaseClient } from '@/lib/supabase';

/**
 * POST /api/ratings
 * Save or update a product rating (1-5 stars)
 * Requires authentication
 */
export async function POST(request: NextRequest) {
  console.log('[Ratings API] POST request received');

  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      console.log('[Ratings API] Unauthorized: no session');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const body = await request.json();
    const { productId, rating, feedbackText } = body;

    console.log('[Ratings API] Rating params:', { userId, productId, rating, hasFeedback: !!feedbackText });

    // Validate product ID
    if (!productId || typeof productId !== 'string' || productId.trim().length === 0) {
      console.log('[Ratings API] Invalid product ID');
      return NextResponse.json(
        { error: 'Invalid product ID' },
        { status: 400 }
      );
    }

    // Validate rating (1-5) — required
    if (
      typeof rating !== 'number' ||
      rating < 1 ||
      rating > 5 ||
      !Number.isInteger(rating)
    ) {
      console.log('[Ratings API] Invalid rating value:', rating);
      return NextResponse.json(
        { error: 'Rating must be an integer between 1 and 5' },
        { status: 400 }
      );
    }

    // Validate feedbackText if provided
    const cleanedFeedback =
      typeof feedbackText === 'string' && feedbackText.trim().length > 0
        ? feedbackText.trim().slice(0, 500)
        : null;

    // Get Supabase client (server-side with service role)
    const supabase = getSupabaseClient(true);

    console.log('[Ratings API] Upserting rating to database...');

    // Upsert rating (insert or update if exists)
    const { error } = await (supabase as any)
      .from('product_feedback')
      .upsert(
        {
          user_id: userId,
          product_id: productId.trim(),
          rating: rating,
          ...(cleanedFeedback !== null && { feedback_text: cleanedFeedback }),
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,product_id',
        }
      );

    if (error) {
      console.error('[Ratings API] Supabase upsert error:', error);
      return NextResponse.json(
        { error: 'Failed to save rating to database' },
        { status: 500 }
      );
    }

    console.log('[Ratings API] Rating saved successfully');

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[Ratings API] Error:', err);
    console.error('[Ratings API] Error stack:', err instanceof Error ? err.stack : 'No stack trace');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/ratings?productId=xxx
 * Delete a product rating
 * Requires authentication
 */
export async function DELETE(request: NextRequest) {
  console.log('[Ratings API] DELETE request received');

  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      console.log('[Ratings API] Unauthorized: no session');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    console.log('[Ratings API] Delete params:', { userId, productId });

    // Validate product ID
    if (!productId || productId.trim().length === 0) {
      console.log('[Ratings API] Invalid product ID');
      return NextResponse.json(
        { error: 'Invalid product ID' },
        { status: 400 }
      );
    }

    // Get Supabase client
    const supabase = getSupabaseClient(true);

    console.log('[Ratings API] Deleting rating from database...');

    // Delete rating
    const { error } = await (supabase as any)
      .from('product_feedback')
      .delete()
      .eq('user_id', userId)
      .eq('product_id', productId.trim());

    if (error) {
      console.error('[Ratings API] Supabase delete error:', error);
      return NextResponse.json(
        { error: 'Failed to delete rating from database' },
        { status: 500 }
      );
    }

    console.log('[Ratings API] Rating deleted successfully');

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[Ratings API] Error:', err);
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

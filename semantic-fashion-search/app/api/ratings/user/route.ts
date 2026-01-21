import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getSupabaseClient } from '@/lib/supabase';

/**
 * GET /api/ratings/user
 * Fetch all ratings for the authenticated user
 * Returns: { ratings: { [productId]: rating } }
 */
export async function GET(request: NextRequest) {
  console.log('[Ratings API] GET user ratings request');

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

    // Get Supabase client
    const supabase = getSupabaseClient(true);

    console.log('[Ratings API] Fetching ratings for user:', userId);

    // Fetch all ratings for this user
    const { data, error } = await (supabase as any)
      .from('product_feedback')
      .select('product_id, rating')
      .eq('user_id', userId);

    if (error) {
      console.error('[Ratings API] Supabase fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch ratings from database' },
        { status: 500 }
      );
    }

    // Convert array to object: { [productId]: rating }
    const ratings: { [key: string]: number } = {};
    if (data) {
      for (const row of data) {
        ratings[row.product_id] = row.rating;
      }
    }

    console.log('[Ratings API] Found', Object.keys(ratings).length, 'ratings');

    return NextResponse.json({ ratings });
  } catch (err) {
    console.error('[Ratings API] Error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getSupabaseClient } from '@/lib/supabase';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = getSupabaseClient(true);

    // Get total products count
    const { count: totalProducts } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true });

    // Get total searches count
    const { count: totalSearches } = await supabase
      .from('search_analytics')
      .select('*', { count: 'exact', head: true });

    // Get total subscribers count
    const { count: totalSubscribers } = await supabase
      .from('email_subscribers')
      .select('*', { count: 'exact', head: true })
      .is('unsubscribed_at', null);

    return NextResponse.json({
      totalProducts: totalProducts || 0,
      totalSearches: totalSearches || 0,
      totalSubscribers: totalSubscribers || 0,
    });
  } catch (err) {
    console.error('Stats error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}

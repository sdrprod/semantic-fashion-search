import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getSupabaseClient } from '@/lib/supabase';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.user?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const supabase = getSupabaseClient(true);
    const { data, error } = await supabase
      .from('products')
      .select('category')
      .not('category', 'is', null);

    if (error) {
      console.error('[admin/categories] error:', error);
      return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
    }

    const categories = [...new Set((data || []).map((r: { category: string }) => r.category))]
      .filter(Boolean)
      .sort();

    return NextResponse.json({ categories });
  } catch (err) {
    console.error('[admin/categories] exception:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

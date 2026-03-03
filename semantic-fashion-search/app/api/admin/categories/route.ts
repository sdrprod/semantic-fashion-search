import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getSupabaseClient } from '@/lib/supabase';

// Canonical target categories that should always be available in the admin Move dropdown,
// regardless of whether any products currently carry that category value.
// Uses lowercase plural nouns consistent with the FTS browse terms.
const CANONICAL_CATEGORIES = [
  'activewear',
  'belts',
  'boots',
  'dresses',
  'earrings',
  'flats',
  'handbags',
  'hats',
  'heels',
  'jewelry',
  'jumpsuits',
  'necklaces',
  'outerwear',
  'pants',
  'rings',
  'sandals',
  'scarves',
  'skirts',
  'sneakers',
  'sunglasses',
  'swimwear',
  'tops',
  'watches',
];

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

    const dbCategories = (data || []).map((r: { category: string }) => r.category);

    // Merge DB categories with canonical list; deduplicate and sort.
    const categories = [...new Set([...CANONICAL_CATEGORIES, ...dbCategories])]
      .filter(Boolean)
      .sort();

    return NextResponse.json({ categories });
  } catch (err) {
    console.error('[admin/categories] exception:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

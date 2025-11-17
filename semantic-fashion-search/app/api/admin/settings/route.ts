import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getSupabaseClient } from '@/lib/supabase';

interface SearchSettingsRow {
  id: string;
  similarity_threshold: number;
  diversity_factor: number;
  default_page_size: number;
  max_page_size: number;
  category_weights: Record<string, number> | null;
  brand_boosts: Record<string, number> | null;
  updated_at: string;
  updated_by: string | null;
}

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

    const { data, error } = await supabase
      .from('search_settings')
      .select('*')
      .single<SearchSettingsRow>();

    if (error || !data) {
      // Return defaults if no settings exist
      return NextResponse.json({
        similarityThreshold: 0.3,
        diversityFactor: 0.1,
        defaultPageSize: 10,
        maxPageSize: 50,
        categoryWeights: {},
        brandBoosts: {},
      });
    }

    return NextResponse.json({
      similarityThreshold: data.similarity_threshold,
      diversityFactor: data.diversity_factor,
      defaultPageSize: data.default_page_size,
      maxPageSize: data.max_page_size,
      categoryWeights: data.category_weights || {},
      brandBoosts: data.brand_boosts || {},
    });
  } catch (err) {
    console.error('Settings fetch error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is editor or admin
    const role = session.user?.role;
    if (role !== 'editor' && role !== 'admin') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      similarityThreshold,
      diversityFactor,
      defaultPageSize,
      maxPageSize,
      categoryWeights,
      brandBoosts,
    } = body;

    const supabase = getSupabaseClient(true);

    // Get user ID
    const userEmail = session.user?.email;
    let userId: string | undefined;

    if (userEmail) {
      const { data: user } = await supabase
        .from('users')
        .select('id')
        .eq('email', userEmail)
        .single();
      userId = (user as { id: string } | null)?.id;
    }

    // Upsert settings
    const { error } = await supabase
      .from('search_settings')
      .upsert({
        id: '00000000-0000-0000-0000-000000000001', // Fixed ID for single row
        similarity_threshold: similarityThreshold,
        diversity_factor: diversityFactor,
        default_page_size: defaultPageSize,
        max_page_size: maxPageSize,
        category_weights: categoryWeights,
        brand_boosts: brandBoosts,
        updated_at: new Date().toISOString(),
        updated_by: userId,
      } as any);

    if (error) {
      console.error('Settings update error:', error);
      return NextResponse.json(
        { error: 'Failed to save settings' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Settings update error:', err);
    return NextResponse.json(
      { error: 'Failed to save settings' },
      { status: 500 }
    );
  }
}

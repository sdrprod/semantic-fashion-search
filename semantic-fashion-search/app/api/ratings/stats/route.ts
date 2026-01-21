import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';
import { redis } from '@/lib/redis';

interface ProductStats {
  productId: string;
  totalRatings: number;
  avgRating: number;
  percent3Plus: number;
  percent5Star: number;
  percent2OrLess: number;
  shouldHide: boolean; // Community hiding (51% rule)
  communityBoost: number; // Boost factor for search ranking
}

/**
 * GET /api/ratings/stats?productIds=id1,id2,id3
 * Fetch aggregate rating statistics for products
 * Cached for 1 hour in Redis
 *
 * Returns: { stats: { [productId]: ProductStats } }
 */
export async function GET(request: NextRequest) {
  console.log('[Stats API] Request received');

  try {
    const { searchParams } = new URL(request.url);
    const productIdsParam = searchParams.get('productIds');

    if (!productIdsParam) {
      return NextResponse.json(
        { error: 'productIds parameter required' },
        { status: 400 }
      );
    }

    const productIds = productIdsParam.split(',').map(id => id.trim()).filter(Boolean);

    if (productIds.length === 0) {
      return NextResponse.json({ stats: {} });
    }

    if (productIds.length > 100) {
      return NextResponse.json(
        { error: 'Maximum 100 product IDs per request' },
        { status: 400 }
      );
    }

    console.log('[Stats API] Fetching stats for', productIds.length, 'products');

    const stats: { [key: string]: ProductStats } = {};

    // Try to get from cache first
    if (redis) {
      const cacheKey = `product_stats:${productIds.sort().join(',')}`;
      try {
        const cached = await redis.get(cacheKey);
        if (cached) {
          console.log('[Stats API] Cache HIT');
          return NextResponse.json({ stats: JSON.parse(cached) });
        }
      } catch (err) {
        console.error('[Stats API] Redis error:', err);
      }
    }

    // Cache miss - fetch from database
    console.log('[Stats API] Cache MISS - fetching from database');

    const supabase = getSupabaseClient(true);

    // Use the materialized view we created in migration
    const { data, error } = await (supabase as any)
      .from('product_rating_stats')
      .select('*')
      .in('product_id', productIds);

    if (error) {
      console.error('[Stats API] Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch stats from database' },
        { status: 500 }
      );
    }

    // Process results
    for (const row of data || []) {
      const totalRatings = parseInt(row.total_ratings);
      const percent2OrLess = parseFloat(row.percent_2_or_less) || 0;
      const percent3Plus = parseFloat(row.percent_3_plus) || 0;
      const percent5Star = parseFloat(row.percent_5_star) || 0;

      // Community hiding: 51% rule (minimum 10 ratings)
      const shouldHide = totalRatings >= 10 && percent2OrLess >= 51;

      // Community boost calculation
      let communityBoost = 0;
      if (totalRatings >= 5) {
        // 5-star percentage boost
        if (percent5Star >= 60) communityBoost += 0.12;
        else if (percent5Star >= 40) communityBoost += 0.08;
        else if (percent5Star >= 20) communityBoost += 0.04;

        // 3+ star percentage boost
        if (percent3Plus >= 80) communityBoost += 0.06;
        else if (percent3Plus >= 60) communityBoost += 0.03;
      }

      stats[row.product_id] = {
        productId: row.product_id,
        totalRatings,
        avgRating: parseFloat(row.avg_rating) || 0,
        percent3Plus: Math.round(percent3Plus),
        percent5Star: Math.round(percent5Star),
        percent2OrLess: Math.round(percent2OrLess),
        shouldHide,
        communityBoost,
      };
    }

    // Fill in missing products with zero stats
    for (const productId of productIds) {
      if (!stats[productId]) {
        stats[productId] = {
          productId,
          totalRatings: 0,
          avgRating: 0,
          percent3Plus: 0,
          percent5Star: 0,
          percent2OrLess: 0,
          shouldHide: false,
          communityBoost: 0,
        };
      }
    }

    // Cache for 1 hour
    if (redis) {
      const cacheKey = `product_stats:${productIds.sort().join(',')}`;
      try {
        await redis.set(cacheKey, JSON.stringify(stats), { ex: 3600 });
      } catch (err) {
        console.error('[Stats API] Failed to cache:', err);
      }
    }

    console.log('[Stats API] Returning stats for', Object.keys(stats).length, 'products');

    return NextResponse.json({ stats });
  } catch (err) {
    console.error('[Stats API] Error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

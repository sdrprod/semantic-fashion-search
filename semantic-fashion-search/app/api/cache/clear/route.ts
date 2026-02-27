import { NextResponse } from 'next/server';
import redis from '@/lib/redis';

export async function POST() {
  if (!redis) {
    return NextResponse.json(
      { success: false, message: 'Redis not configured' },
      { status: 503 }
    );
  }

  try {
    await redis.flushdb();
    console.log('[Cache Clear] Redis cache flushed');
    return NextResponse.json({ success: true, message: 'Cache cleared' });
  } catch (error) {
    console.error('[Cache Clear] Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to clear cache' },
      { status: 500 }
    );
  }
}

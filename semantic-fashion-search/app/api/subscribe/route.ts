import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    // Validate email
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'Please provide a valid email address.' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient(true);

    // Check if already subscribed
    const { data: existingData } = await supabase
      .from('email_subscribers')
      .select('id, unsubscribed_at')
      .eq('email', email.toLowerCase())
      .single();

    const existing = existingData as { id: string; unsubscribed_at: string | null } | null;

    if (existing) {
      if (existing.unsubscribed_at) {
        // Re-subscribe
        await (supabase as any)
          .from('email_subscribers')
          .update({
            unsubscribed_at: null,
            subscribed_at: new Date().toISOString(),
          })
          .eq('id', existing.id);

        return NextResponse.json({
          success: true,
          message: 'Welcome back! You have been re-subscribed.',
        });
      }

      return NextResponse.json({
        success: true,
        message: 'You are already subscribed.',
      });
    }

    // Create new subscription
    const { error } = await (supabase as any).from('email_subscribers').insert({
      email: email.toLowerCase(),
      preferences: {
        newArrivals: true,
        sales: true,
        recommendations: true,
      },
    });

    if (error) {
      console.error('Subscription error:', error);
      return NextResponse.json(
        { error: 'Failed to subscribe. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Thank you for subscribing!',
    });
  } catch (err) {
    console.error('Subscription error:', err);
    return NextResponse.json(
      { error: 'Internal server error.' },
      { status: 500 }
    );
  }
}

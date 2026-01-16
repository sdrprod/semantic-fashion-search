import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { email, code } = await request.json();

    if (!email || !code) {
      return NextResponse.json(
        { error: 'Email and code are required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient(true) as any;

    // Find verification code
    const { data: verificationData, error: fetchError } = await supabase
      .from('verification_codes')
      .select('*')
      .eq('email', email.toLowerCase())
      .eq('code', code)
      .eq('type', 'signup')
      .is('usedAt', null)
      .single();

    if (fetchError || !verificationData) {
      return NextResponse.json(
        { error: 'Invalid or expired verification code' },
        { status: 400 }
      );
    }

    // Check if code is expired
    const expiresAt = new Date(verificationData.expiresAt);
    if (new Date() > expiresAt) {
      return NextResponse.json(
        { error: 'This verification code has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    // Mark code as used
    await supabase
      .from('verification_codes')
      .update({ usedAt: new Date().toISOString() })
      .eq('id', verificationData.id);

    // Mark email as verified
    const { error: updateError } = await supabase
      .from('users')
      .update({
        emailVerified: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .eq('email', email.toLowerCase());

    if (updateError) {
      console.error('[Verify Email] Error updating user:', updateError);
      return NextResponse.json(
        { error: 'Failed to verify email. Please try again.' },
        { status: 500 }
      );
    }

    console.log('[Verify Email] Email verified successfully:', email);

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully! You can now sign in.',
    });
  } catch (error: any) {
    console.error('[Verify Email API] Error:', error);
    return NextResponse.json(
      { error: 'An error occurred during verification. Please try again.' },
      { status: 500 }
    );
  }
}

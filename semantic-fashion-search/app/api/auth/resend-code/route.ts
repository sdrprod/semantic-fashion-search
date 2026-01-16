import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';
import { sendVerificationEmail, generateVerificationCode } from '@/lib/email';
import { randomBytes } from 'crypto';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient(true) as any;

    // Check if user exists and is not verified
    const { data: user } = await supabase
      .from('users')
      .select('id, name, emailVerified')
      .eq('email', email.toLowerCase())
      .single();

    if (!user) {
      return NextResponse.json(
        { error: 'No account found with this email' },
        { status: 404 }
      );
    }

    if (user.emailVerified) {
      return NextResponse.json(
        { error: 'This email is already verified. Please sign in.' },
        { status: 400 }
      );
    }

    // Delete any existing unused codes
    await supabase
      .from('verification_codes')
      .delete()
      .eq('email', email.toLowerCase())
      .eq('type', 'signup')
      .is('usedAt', null);

    // Generate new code
    const code = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await supabase.from('verification_codes').insert({
      id: randomBytes(16).toString('hex'),
      email: email.toLowerCase(),
      code: code,
      type: 'signup',
      expiresAt: expiresAt.toISOString(),
      createdAt: new Date().toISOString(),
    });

    // Send email
    const firstName = user.name?.split(' ')[0] || 'there';
    const emailResult = await sendVerificationEmail(email, code, firstName);

    if (!emailResult.success) {
      return NextResponse.json(
        { error: 'Failed to send email. Please try again later.' },
        { status: 500 }
      );
    }

    console.log('[Resend Code] New verification code sent to:', email);

    return NextResponse.json({
      success: true,
      message: 'A new verification code has been sent to your email.',
    });
  } catch (error: any) {
    console.error('[Resend Code API] Error:', error);
    return NextResponse.json(
      { error: 'An error occurred. Please try again.' },
      { status: 500 }
    );
  }
}

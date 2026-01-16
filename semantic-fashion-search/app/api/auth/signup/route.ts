import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';
import { sendVerificationEmail, generateVerificationCode } from '@/lib/email';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';

export async function POST(request: Request) {
  try {
    const { firstName, lastName, email, password } = await request.json();

    // Validation
    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient(true) as any;

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, emailVerified')
      .eq('email', email.toLowerCase())
      .single();

    if (existingUser?.emailVerified) {
      return NextResponse.json(
        { error: 'An account with this email already exists. Please sign in instead.' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate verification code
    const code = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Create or update user
    const fullName = `${firstName} ${lastName}`;
    const userId = existingUser?.id || randomBytes(16).toString('hex');

    if (existingUser) {
      // Update existing unverified user
      await supabase
        .from('users')
        .update({
          name: fullName,
          password: hashedPassword,
          updatedAt: new Date().toISOString(),
        })
        .eq('email', email.toLowerCase());
    } else {
      // Create new user
      await supabase.from('users').insert({
        id: userId,
        email: email.toLowerCase(),
        name: fullName,
        password: hashedPassword,
        role: 'viewer',
        emailVerified: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    // Delete any existing unused codes for this email
    await supabase
      .from('verification_codes')
      .delete()
      .eq('email', email.toLowerCase())
      .eq('type', 'signup')
      .is('usedAt', null);

    // Create new verification code
    await supabase.from('verification_codes').insert({
      id: randomBytes(16).toString('hex'),
      email: email.toLowerCase(),
      code: code,
      type: 'signup',
      expiresAt: expiresAt.toISOString(),
      createdAt: new Date().toISOString(),
    });

    // Send verification email
    const emailResult = await sendVerificationEmail(email, code, firstName);

    if (!emailResult.success) {
      console.error('[Signup] Failed to send verification email:', emailResult.error);
      // Don't fail the signup if email fails - user can resend
    }

    return NextResponse.json({
      success: true,
      message: 'Account created! Please check your email for the verification code.',
      email: email.toLowerCase(),
    });
  } catch (error: any) {
    console.error('[Signup API] Error:', error);
    return NextResponse.json(
      { error: 'An error occurred during signup. Please try again.' },
      { status: 500 }
    );
  }
}

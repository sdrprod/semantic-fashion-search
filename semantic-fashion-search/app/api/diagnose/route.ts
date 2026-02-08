import { NextResponse } from 'next/server';

/**
 * Diagnostic endpoint to check production environment setup
 * Access at /api/diagnose
 */
export async function GET() {
  try {
    const diagnostics = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'unknown',
      checks: {
        // Check environment variables (show presence, not values for security)
        hasAnthropicKey: !!process.env.ANTHROPIC_API_KEY,
        hasOpenAIKey: !!process.env.OPENAI_API_KEY,
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasSupabaseKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY || !!process.env.SUPABASE_ANON_KEY,
        hasBaseUrl: !!process.env.NEXT_PUBLIC_BASE_URL,

        // Show what NEXT_PUBLIC_BASE_URL is set to (safe to show)
        baseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'NOT SET (defaulting to localhost)',

        // Check if we're running in serverless
        isServerless: !!process.env.AWS_LAMBDA_FUNCTION_NAME || !!process.env.NETLIFY,
        platform: process.env.NETLIFY ? 'Netlify' : (process.env.VERCEL ? 'Vercel' : 'Unknown'),
      },
      recommendations: [] as string[],
    };

    // Add recommendations based on findings
    if (!diagnostics.checks.hasAnthropicKey) {
      diagnostics.recommendations.push('CRITICAL: ANTHROPIC_API_KEY not set - intent extraction will fail');
    }
    if (!diagnostics.checks.hasOpenAIKey) {
      diagnostics.recommendations.push('CRITICAL: OPENAI_API_KEY not set - embedding generation will fail');
    }
    if (!diagnostics.checks.hasSupabaseUrl) {
      diagnostics.recommendations.push('CRITICAL: NEXT_PUBLIC_SUPABASE_URL not set - database queries will fail');
    }
    if (!diagnostics.checks.hasSupabaseKey) {
      diagnostics.recommendations.push('CRITICAL: SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY not set - database queries will fail');
    }
    if (!diagnostics.checks.hasBaseUrl) {
      diagnostics.recommendations.push('WARNING: NEXT_PUBLIC_BASE_URL not set - rating stats API calls will use localhost and fail in production');
    }

    if (diagnostics.recommendations.length === 0) {
      diagnostics.recommendations.push('All environment variables are properly configured!');
    }

    return NextResponse.json(diagnostics, { status: 200 });
  } catch (error: any) {
    console.error('[Diagnose] Error:', error);
    return NextResponse.json(
      {
        error: 'Diagnostic check failed',
        message: error.message,
        stack: error.stack,
      },
      { status: 500 }
    );
  }
}

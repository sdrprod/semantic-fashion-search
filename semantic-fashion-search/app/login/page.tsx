'use client';

import { signIn, useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';

function LoginContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const verified = searchParams.get('verified');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showEmailLogin, setShowEmailLogin] = useState(false);

  useEffect(() => {
    if (session) {
      // Only redirect to admin if user has admin/editor role
      if (session.user?.role === 'admin' || session.user?.role === 'editor') {
        router.push('/admin');
      } else {
        // Regular users go to home
        router.push('/');
      }
    }
  }, [session, router]);

  useEffect(() => {
    if (verified) {
      setShowEmailLogin(true);
    }
  }, [verified]);

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
        setLoading(false);
        return;
      }

      // Session will be updated, and useEffect above will handle redirect based on role
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="login-card" style={{ margin: '0 auto' }}>
      <h1 className="login-title">Sign In</h1>
      <p className="login-subtitle">
        {verified
          ? 'Email verified! Sign in to continue'
          : 'Sign in to access your account'}
      </p>

      {verified && (
        <div style={{
          background: '#efe',
          border: '1px solid #cfc',
          padding: '12px',
          borderRadius: '6px',
          marginBottom: '16px',
          color: '#363',
          fontSize: '14px',
          textAlign: 'center'
        }}>
          ✓ Your email has been verified successfully!
        </div>
      )}

      {!showEmailLogin ? (
        <>
          <button
            onClick={() => signIn('google', { callbackUrl: '/' })}
            className="google-btn"
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Sign in with Google
          </button>

          <div style={{ margin: '24px 0', textAlign: 'center' }}>
            <button
              onClick={() => setShowEmailLogin(true)}
              style={{
                background: 'none',
                border: 'none',
                color: '#17a2b8',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              Or sign in with email
            </button>
          </div>
        </>
      ) : (
        <>
          <form onSubmit={handleEmailSignIn}>
            {error && (
              <div style={{
                background: '#fee',
                border: '1px solid #fcc',
                padding: '12px',
                borderRadius: '6px',
                marginBottom: '16px',
                color: '#c33',
                fontSize: '14px'
              }}>
                {error}
              </div>
            )}

            <div style={{ marginBottom: '16px' }}>
              <label htmlFor="email" style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 500, color: '#333' }}>
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '2px solid #e1e4e8',
                  borderRadius: '6px',
                  fontSize: '14px',
                }}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label htmlFor="password" style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 500, color: '#333' }}>
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '2px solid #e1e4e8',
                  borderRadius: '6px',
                  fontSize: '14px',
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                background: loading ? '#ccc' : 'linear-gradient(135deg, #17a2b8 0%, #0d7a8a 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                marginBottom: '12px',
              }}
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>

            <button
              type="button"
              onClick={() => setShowEmailLogin(false)}
              style={{
                width: '100%',
                padding: '12px',
                background: 'white',
                color: '#17a2b8',
                border: '2px solid #e1e4e8',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Back to Google Sign In
            </button>
          </form>
        </>
      )}

      <p style={{ marginTop: '24px', textAlign: 'center', fontSize: '14px', color: '#666' }}>
        Don&apos;t have an account?{' '}
        <a href="/signup" style={{ color: '#17a2b8', textDecoration: 'none', fontWeight: 600 }}>
          Sign Up
        </a>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navigation />
      <main style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #17a2b8 0%, #0d7a8a 100%)',
        padding: '3rem 2rem',
      }}>
        <div style={{ width: '100%', maxWidth: '420px' }}>
          <Suspense fallback={
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
              <p style={{ color: 'white' }}>Loading...</p>
            </div>
          }>
            <LoginContent />
          </Suspense>
        </div>
      </main>
      <Footer />
    </div>
  );
}

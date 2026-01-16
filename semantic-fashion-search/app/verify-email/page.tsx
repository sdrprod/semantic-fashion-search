'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Link from 'next/link';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get('email');
  const codeParam = searchParams.get('code');

  const [email, setEmail] = useState(emailParam || '');
  const [code, setCode] = useState(codeParam || '');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  // Auto-verify if code is in URL
  useEffect(() => {
    if (emailParam && codeParam) {
      handleVerify(emailParam, codeParam);
    }
  }, []);

  const handleVerify = async (verifyEmail?: string, verifyCode?: string) => {
    const emailToVerify = verifyEmail || email;
    const codeToVerify = verifyCode || code;

    if (!emailToVerify || !codeToVerify) {
      setError('Please enter the verification code');
      return;
    }

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailToVerify, code: codeToVerify }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Verification failed');
        setLoading(false);
        return;
      }

      setSuccess('Email verified successfully! Signing you in...');

      // Wait a moment then redirect to sign in
      setTimeout(() => {
        router.push('/admin/login?verified=true');
      }, 2000);
    } catch (err) {
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      setError('Email address is required');
      return;
    }

    setError('');
    setSuccess('');
    setResending(true);

    try {
      const response = await fetch('/api/auth/resend-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to resend code');
        setResending(false);
        return;
      }

      setSuccess('A new verification code has been sent to your email!');
      setResending(false);
    } catch (err) {
      setError('An error occurred. Please try again.');
      setResending(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card" style={{ maxWidth: '480px' }}>
        <div style={{ marginBottom: '20px', textAlign: 'center' }}>
          <Link href="/" style={{ color: '#667eea', textDecoration: 'none', fontSize: '14px', fontWeight: 600 }}>
            ← Back to Home
          </Link>
        </div>

        <h1 className="login-title">Verify Your Email</h1>
        <p className="login-subtitle">
          We sent a 6-digit code to <strong>{email}</strong>
        </p>

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

        {success && (
          <div style={{
            background: '#efe',
            border: '1px solid #cfc',
            padding: '12px',
            borderRadius: '6px',
            marginBottom: '16px',
            color: '#363',
            fontSize: '14px'
          }}>
            {success}
          </div>
        )}

        <form onSubmit={(e) => { e.preventDefault(); handleVerify(); }}>
          <div style={{ marginBottom: '24px' }}>
            <label htmlFor="code" style={{ display: 'block', marginBottom: '12px', fontSize: '14px', fontWeight: 500, color: '#333', textAlign: 'center' }}>
              Enter your 6-digit code
            </label>
            <input
              type="text"
              id="code"
              value={code}
              onChange={(e) => {
                setCode(e.target.value.replace(/\D/g, '').slice(0, 6));
                setError('');
              }}
              maxLength={6}
              required
              placeholder="000000"
              autoComplete="off"
              style={{
                width: '100%',
                padding: '16px',
                border: '2px solid #e1e4e8',
                borderRadius: '8px',
                fontSize: '32px',
                textAlign: 'center',
                letterSpacing: '12px',
                fontFamily: "'Courier New', monospace",
                fontWeight: 'bold',
                color: '#667eea',
              }}
            />
            <p style={{ marginTop: '8px', fontSize: '12px', color: '#666', textAlign: 'center' }}>
              Code expires in 10 minutes
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || code.length !== 6}
            style={{
              width: '100%',
              padding: '12px',
              background: loading || code.length !== 6 ? '#ccc' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 600,
              cursor: loading || code.length !== 6 ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              marginBottom: '16px',
            }}
          >
            {loading ? 'Verifying...' : 'Verify Email'}
          </button>

          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            style={{
              width: '100%',
              padding: '12px',
              background: 'white',
              color: '#667eea',
              border: '2px solid #667eea',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: resending ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {resending ? 'Sending...' : 'Resend Code'}
          </button>
        </form>

        <p style={{ marginTop: '24px', textAlign: 'center', fontSize: '14px', color: '#666' }}>
          Wrong email?{' '}
          <Link href="/signup" style={{ color: '#667eea', textDecoration: 'none', fontWeight: 600 }}>
            Sign Up Again
          </Link>
        </p>
      </div>
    </div>
  );
}


export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="login-container"><div className="login-card"><p>Loading...</p></div></div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}

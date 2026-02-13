'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';

export default function SignUpPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    setError('');
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Signup failed');
        setLoading(false);
        return;
      }

      // Redirect to verification page
      router.push(`/verify-email?email=${encodeURIComponent(data.email)}`);
    } catch (err) {
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  const handleGoogleSignUp = () => {
    signIn('google', { callbackUrl: '/' });
  };

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
      <div className="login-card" style={{ maxWidth: '480px', width: '100%' }}>
        <h1 className="login-title">Create Account</h1>
        <p className="login-subtitle">
          Sign up to start discovering fashion items
        </p>

        {/* Google Sign Up */}
        <button onClick={handleGoogleSignUp} className="google-btn">
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Sign up with Google
        </button>

        <div style={{ margin: '24px 0', textAlign: 'center', color: '#666', position: 'relative' }}>
          <hr style={{ border: 'none', borderTop: '1px solid #e1e4e8', margin: '0' }} />
          <span style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', background: 'white', padding: '0 16px', fontSize: '14px' }}>
            OR
          </span>
        </div>

        {/* Email Sign Up Form */}
        <form onSubmit={handleEmailSignUp}>
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div>
              <label htmlFor="firstName" style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 500, color: '#333' }}>
                First Name
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '2px solid #e1e4e8',
                  borderRadius: '6px',
                  fontSize: '14px',
                  transition: 'border-color 0.2s',
                }}
              />
            </div>
            <div>
              <label htmlFor="lastName" style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 500, color: '#333' }}>
                Last Name
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '2px solid #e1e4e8',
                  borderRadius: '6px',
                  fontSize: '14px',
                  transition: 'border-color 0.2s',
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label htmlFor="email" style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 500, color: '#333' }}>
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '2px solid #e1e4e8',
                borderRadius: '6px',
                fontSize: '14px',
                transition: 'border-color 0.2s',
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
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={8}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '2px solid #e1e4e8',
                borderRadius: '6px',
                fontSize: '14px',
                transition: 'border-color 0.2s',
              }}
            />
            <p style={{ marginTop: '6px', fontSize: '12px', color: '#666' }}>
              Must be at least 8 characters
            </p>
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
              transition: 'all 0.2s',
            }}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <p style={{ marginTop: '24px', textAlign: 'center', fontSize: '14px', color: '#666' }}>
          Already have an account?{' '}
          <Link href="/login" style={{ color: '#17a2b8', textDecoration: 'none', fontWeight: 600 }}>
            Sign In
          </Link>
        </p>
      </div>
      </main>
      <Footer />
    </div>
  );
}

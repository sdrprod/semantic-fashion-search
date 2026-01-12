'use client';

import { useState } from 'react';

export function EmailSubscribe() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setStatus('error');
      setMessage('Please enter a valid email address.');
      return;
    }

    setStatus('loading');

    try {
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage(data.message);
        setEmail('');
      } else {
        setStatus('error');
        setMessage(data.error || 'Failed to subscribe. Please try again.');
      }
    } catch {
      setStatus('error');
      setMessage('Failed to subscribe. Please try again.');
    }
  };

  return (
    <section className="email-subscribe">
      <h2 className="email-subscribe-title">Stay Updated on Fashion Trends</h2>
      <p className="email-subscribe-subtitle">
        Get exclusive deals and personalized fashion recommendations delivered to your inbox
      </p>

      <form onSubmit={handleSubmit} className="email-subscribe-form">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          className="email-subscribe-input"
          disabled={status === 'loading'}
        />
        <button
          type="submit"
          className="email-subscribe-button"
          disabled={status === 'loading'}
        >
          {status === 'loading' ? 'Subscribing...' : 'Subscribe'}
        </button>
      </form>

      {message && (
        <p style={{
          marginTop: '1rem',
          color: status === 'error' ? '#dc3545' : '#17a2b8',
          fontWeight: 600
        }}>
          {message}
        </p>
      )}
    </section>
  );
}

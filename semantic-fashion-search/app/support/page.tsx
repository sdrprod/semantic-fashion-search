import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';

export const metadata = { title: 'Support - ATLAZ AI' };

export default function SupportPage() {
  return (
    <div className="app">
      <Navigation />
      <div className="container">
        <main className="main-content" style={{ paddingTop: '3rem', paddingBottom: '4rem', maxWidth: '680px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '1rem' }}>Support</h1>
          <p style={{ color: '#666', marginBottom: '2rem' }}>
            We&apos;re here to help. Find answers to common questions or reach out directly.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ background: '#f9f9f9', borderRadius: '12px', padding: '1.5rem' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.75rem' }}>Browse Help Topics</h2>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <li><a href="/faq" style={{ color: '#000', textDecoration: 'underline' }}>Frequently Asked Questions</a></li>
                <li><a href="/shipping" style={{ color: '#000', textDecoration: 'underline' }}>Shipping Information</a></li>
                <li><a href="/returns" style={{ color: '#000', textDecoration: 'underline' }}>Returns &amp; Exchanges</a></li>
                <li><a href="/track-order" style={{ color: '#000', textDecoration: 'underline' }}>Track Your Order</a></li>
                <li><a href="/size-guide" style={{ color: '#000', textDecoration: 'underline' }}>Size Guide</a></li>
              </ul>
            </div>

            <div style={{ background: '#f9f9f9', borderRadius: '12px', padding: '1.5rem' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.75rem' }}>Contact Our Team</h2>
              <p style={{ color: '#555', marginBottom: '0.5rem' }}>
                <strong>Email:</strong>{' '}
                <a href="mailto:hello@myatlaz.com" style={{ color: '#000', textDecoration: 'underline' }}>
                  hello@myatlaz.com
                </a>
              </p>
              <p style={{ color: '#555' }}>
                <strong>Hours:</strong> Monday–Friday, 9am–5pm ET
              </p>
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
}

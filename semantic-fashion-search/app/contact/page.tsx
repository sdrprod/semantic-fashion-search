import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';

export const metadata = { title: 'Contact Us - ATLAZ AI' };

export default function ContactPage() {
  return (
    <div className="app">
      <Navigation />
      <div className="container">
        <main className="main-content" style={{ paddingTop: '3rem', paddingBottom: '4rem', maxWidth: '680px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '1rem' }}>Contact Us</h1>
          <p style={{ color: '#666', marginBottom: '2rem' }}>
            We&apos;d love to hear from you. Our team typically responds within 1–2 business days.
          </p>

          <div style={{ background: '#f9f9f9', borderRadius: '12px', padding: '2rem', marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>Get in Touch</h2>
            <p style={{ marginBottom: '0.5rem' }}>
              <strong>Email:</strong>{' '}
              <a href="mailto:hello@myatlaz.com" style={{ color: '#000', textDecoration: 'underline' }}>
                hello@myatlaz.com
              </a>
            </p>
            <p style={{ marginBottom: '0.5rem' }}>
              <strong>Support hours:</strong> Monday–Friday, 9am–5pm ET
            </p>
          </div>

          <div style={{ background: '#f9f9f9', borderRadius: '12px', padding: '2rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>Frequently Asked</h2>
            <p style={{ color: '#555', marginBottom: '0.75rem' }}>
              Before reaching out, you may find a quick answer in our <a href="/faq" style={{ color: '#000', textDecoration: 'underline' }}>FAQ</a>.
            </p>
            <p style={{ color: '#555' }}>
              For order tracking, visit our <a href="/track-order" style={{ color: '#000', textDecoration: 'underline' }}>Track Order</a> page.
            </p>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
}

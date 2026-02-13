import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';

export const metadata = { title: 'Track Order - ATLAZ AI' };

export default function TrackOrderPage() {
  return (
    <div className="app">
      <Navigation />
      <div className="container">
        <main className="main-content" style={{ paddingTop: '3rem', paddingBottom: '4rem', maxWidth: '680px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '1rem' }}>Track Your Order</h1>
          <p style={{ color: '#666', marginBottom: '2rem' }}>
            Orders are fulfilled directly by our retail partners. To track your shipment, visit the retailer where you completed your purchase.
          </p>

          <div style={{ background: '#f9f9f9', borderRadius: '12px', padding: '2rem', marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>Where to Track</h2>
            <ol style={{ color: '#555', paddingLeft: '1.5rem', lineHeight: '2.2' }}>
              <li>Check your email for a shipping confirmation from the retailer.</li>
              <li>Click the tracking link in the confirmation email.</li>
              <li>Or log in to your account on the retailer&apos;s website.</li>
            </ol>
          </div>

          <div style={{ background: '#f9f9f9', borderRadius: '12px', padding: '2rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>Didn&apos;t Receive a Confirmation?</h2>
            <p style={{ color: '#555' }}>
              Check your spam folder first. If you still can&apos;t find it, contact the retailer&apos;s customer service directly. You can also reach us at{' '}
              <a href="mailto:hello@myatlaz.com" style={{ color: '#000', textDecoration: 'underline' }}>
                hello@myatlaz.com
              </a>{' '}
              and we&apos;ll help connect you with the right retailer.
            </p>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
}

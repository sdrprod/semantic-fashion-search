import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';

export const metadata = { title: 'Returns & Exchanges - ATLAZ AI' };

export default function ReturnsPage() {
  return (
    <div className="app">
      <Navigation />
      <div className="container">
        <main className="main-content" style={{ paddingTop: '3rem', paddingBottom: '4rem', maxWidth: '680px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '1rem' }}>Returns &amp; Exchanges</h1>
          <p style={{ color: '#666', marginBottom: '2rem' }}>
            Because ATLAZ AI connects you with products from third-party retailers, return and exchange policies are managed directly by each retailer.
          </p>

          <div style={{ background: '#f9f9f9', borderRadius: '12px', padding: '2rem', marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>How Returns Work</h2>
            <ol style={{ color: '#555', paddingLeft: '1.5rem', lineHeight: '2.2' }}>
              <li>Visit the retailer&apos;s website where you made your purchase.</li>
              <li>Log in to your account and navigate to your orders.</li>
              <li>Follow the retailer&apos;s return instructions.</li>
              <li>Contact the retailer&apos;s customer service if you need assistance.</li>
            </ol>
          </div>

          <div style={{ background: '#f9f9f9', borderRadius: '12px', padding: '2rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>Need Help?</h2>
            <p style={{ color: '#555' }}>
              If you&apos;re having trouble reaching a retailer or need guidance, contact us at{' '}
              <a href="mailto:hello@myatlaz.com" style={{ color: '#000', textDecoration: 'underline' }}>
                hello@myatlaz.com
              </a>{' '}
              and we&apos;ll do our best to help.
            </p>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
}

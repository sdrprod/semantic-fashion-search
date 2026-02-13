import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';

export const metadata = { title: 'Sustainability - ATLAZ AI' };

export default function SustainabilityPage() {
  return (
    <div className="app">
      <Navigation />
      <div className="container">
        <main className="main-content" style={{ paddingTop: '3rem', paddingBottom: '4rem', maxWidth: '720px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '1rem' }}>Sustainability</h1>
          <p style={{ color: '#666', marginBottom: '2rem', lineHeight: '1.7' }}>
            Fashion is one of the most resource-intensive industries in the world. We believe better discovery can lead to more intentional purchasing — buying less, but better.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ background: '#f9f9f9', borderRadius: '12px', padding: '1.5rem' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.75rem' }}>Our Commitment</h2>
              <p style={{ color: '#555', lineHeight: '1.7' }}>
                We&apos;re committed to surfacing sustainable fashion brands alongside mainstream retailers, making it easier to discover eco-conscious options. We&apos;re working to expand our network of verified sustainable brands.
              </p>
            </div>

            <div style={{ background: '#f9f9f9', borderRadius: '12px', padding: '1.5rem' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.75rem' }}>Smarter Shopping</h2>
              <p style={{ color: '#555', lineHeight: '1.7' }}>
                By helping you find exactly what you&apos;re looking for on the first try, we aim to reduce impulse buys, returns, and the environmental cost of &quot;buy-to-browse.&quot; The right item, found faster, is better for everyone.
              </p>
            </div>

            <div style={{ background: '#f9f9f9', borderRadius: '12px', padding: '1.5rem' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.75rem' }}>More Coming Soon</h2>
              <p style={{ color: '#555', lineHeight: '1.7' }}>
                We&apos;re developing sustainability filters and brand certification labels. Have suggestions? <a href="/contact" style={{ color: '#000', textDecoration: 'underline' }}>Let us know</a>.
              </p>
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
}

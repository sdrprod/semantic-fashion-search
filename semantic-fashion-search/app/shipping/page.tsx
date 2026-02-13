import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';

export const metadata = { title: 'Shipping Info - ATLAZ AI' };

export default function ShippingPage() {
  return (
    <div className="app">
      <Navigation />
      <div className="container">
        <main className="main-content" style={{ paddingTop: '3rem', paddingBottom: '4rem', maxWidth: '680px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '1rem' }}>Shipping Info</h1>
          <p style={{ color: '#666', marginBottom: '2rem' }}>
            ATLAZ AI connects you with products from a curated network of fashion retailers. Shipping details vary by merchant.
          </p>

          <div style={{ background: '#f9f9f9', borderRadius: '12px', padding: '2rem', marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>How It Works</h2>
            <p style={{ color: '#555', marginBottom: '0.75rem' }}>
              When you click a product, you&apos;ll be taken directly to the retailer&apos;s website to complete your purchase. Shipping policies, costs, and delivery times are set by each individual retailer.
            </p>
            <p style={{ color: '#555' }}>
              Check the retailer&apos;s website for their specific shipping rates and estimated delivery windows.
            </p>
          </div>

          <div style={{ background: '#f9f9f9', borderRadius: '12px', padding: '2rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>Typical Shipping Times</h2>
            <ul style={{ color: '#555', paddingLeft: '1.5rem', lineHeight: '2' }}>
              <li>Standard shipping: 5–7 business days</li>
              <li>Expedited shipping: 2–3 business days</li>
              <li>Overnight shipping: 1 business day</li>
              <li>International shipping: 7–21 business days</li>
            </ul>
            <p style={{ color: '#888', marginTop: '1rem', fontSize: '0.9rem' }}>
              * Times are estimates. Actual delivery depends on the retailer and your location.
            </p>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
}

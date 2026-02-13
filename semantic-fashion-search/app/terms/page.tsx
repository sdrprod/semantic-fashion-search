import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';

export const metadata = { title: 'Terms of Service - ATLAZ AI' };

export default function TermsPage() {
  return (
    <div className="app">
      <Navigation />
      <div className="container">
        <main className="main-content" style={{ paddingTop: '3rem', paddingBottom: '4rem', maxWidth: '720px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>Terms of Service</h1>
          <p style={{ color: '#888', fontSize: '0.875rem', marginBottom: '2rem' }}>Last updated: February 2025</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', lineHeight: '1.8', color: '#444' }}>
            <section>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '0.75rem', color: '#000' }}>1. Acceptance of Terms</h2>
              <p>By accessing or using ATLAZ AI (&quot;the Service&quot;), you agree to be bound by these Terms of Service. If you do not agree, please do not use the Service.</p>
            </section>

            <section>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '0.75rem', color: '#000' }}>2. Description of Service</h2>
              <p>ATLAZ AI is a fashion discovery platform that uses artificial intelligence to match your descriptions and images with products from third-party retailers. We do not sell products directly. All purchases are made on the retailer&apos;s website.</p>
            </section>

            <section>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '0.75rem', color: '#000' }}>3. Use of Service</h2>
              <p>You agree to use the Service only for lawful purposes and in accordance with these Terms. You may not use the Service to upload harmful, illegal, or infringing content.</p>
            </section>

            <section>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '0.75rem', color: '#000' }}>4. Affiliate Disclosure</h2>
              <p>ATLAZ AI participates in affiliate programs. When you click through to a retailer and make a purchase, we may earn a commission at no extra cost to you. This does not influence our search results.</p>
            </section>

            <section>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '0.75rem', color: '#000' }}>5. Intellectual Property</h2>
              <p>The ATLAZ AI name, logo, and technology are owned by ATLAZ AI. Product images and descriptions remain the property of their respective retailers and brands.</p>
            </section>

            <section>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '0.75rem', color: '#000' }}>6. Disclaimer</h2>
              <p>The Service is provided &quot;as is.&quot; We make no warranties about the accuracy, availability, or fitness for purpose of search results. We are not responsible for products purchased from third-party retailers.</p>
            </section>

            <section>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '0.75rem', color: '#000' }}>7. Contact</h2>
              <p>Questions about these Terms? <a href="mailto:legal@myatlaz.com" style={{ color: '#000', textDecoration: 'underline' }}>legal@myatlaz.com</a></p>
            </section>

            <div style={{ background: '#fff3cd', borderRadius: '8px', padding: '1rem', fontSize: '0.875rem', color: '#7a5c00' }}>
              <strong>Note:</strong> These are preliminary terms. Full, legally reviewed terms will be published before our public launch.
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
}

import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';

export const metadata = { title: 'Blog - ATLAZ AI' };

export default function BlogPage() {
  return (
    <div className="app">
      <Navigation />
      <div className="container">
        <main className="main-content" style={{ paddingTop: '3rem', paddingBottom: '4rem', maxWidth: '720px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>Blog</h1>
          <p style={{ color: '#666', marginBottom: '3rem' }}>
            Style tips, AI fashion insights, and trend reports from the ATLAZ AI team.
          </p>

          <div style={{ background: '#f9f9f9', borderRadius: '12px', padding: '3rem', textAlign: 'center' }}>
            <p style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.75rem' }}>Coming Soon</p>
            <p style={{ color: '#555', lineHeight: '1.7' }}>
              We&apos;re working on articles about AI-powered style discovery, trend forecasting, and how to get the most out of ATLAZ AI. Check back soon.
            </p>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
}

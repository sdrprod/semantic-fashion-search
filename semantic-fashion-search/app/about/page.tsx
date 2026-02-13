import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';

export const metadata = { title: 'Our Story - ATLAZ AI' };

export default function AboutPage() {
  return (
    <div className="app">
      <Navigation />
      <div className="container">
        <main className="main-content" style={{ paddingTop: '3rem', paddingBottom: '4rem', maxWidth: '720px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '1rem' }}>Our Story</h1>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', lineHeight: '1.8', color: '#444' }}>
            <p>
              ATLAZ AI was founded on a simple idea: finding fashion you love should feel as natural as describing it to a friend. Traditional search — keywords, filters, and endless scrolling — wasn&apos;t built for the way we actually think about style.
            </p>
            <p>
              We built an AI that understands fashion the way you do. Tell it you need &quot;something elegant but not too formal for a garden party,&quot; and it knows exactly what you mean. Upload photos of pieces you love, and it finds you similar styles from across the web.
            </p>
            <p>
              We partner with fashion retailers of all sizes to surface their best products — from independent designers to established brands — so you can discover items you&apos;d never find through traditional search.
            </p>
            <p>
              We&apos;re a small, passionate team obsessed with the intersection of AI and personal style. We believe great fashion discovery should be available to everyone.
            </p>
          </div>

          <div style={{ background: '#f9f9f9', borderRadius: '12px', padding: '2rem', marginTop: '2.5rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.75rem' }}>Get in Touch</h2>
            <p style={{ color: '#555' }}>
              Questions, partnership inquiries, or just want to say hello?{' '}
              <a href="/contact" style={{ color: '#000', textDecoration: 'underline' }}>Contact us</a>.
            </p>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
}

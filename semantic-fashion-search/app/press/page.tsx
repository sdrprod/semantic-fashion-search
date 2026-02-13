import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';

export const metadata = { title: 'Press - ATLAZ AI' };

export default function PressPage() {
  return (
    <div className="app">
      <Navigation />
      <div className="container">
        <main className="main-content" style={{ paddingTop: '3rem', paddingBottom: '4rem', maxWidth: '680px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '1rem' }}>Press</h1>
          <p style={{ color: '#666', marginBottom: '2rem', lineHeight: '1.7' }}>
            Journalists and media professionals: we&apos;d love to tell you more about ATLAZ AI. Reach out to our press team for interviews, assets, and information.
          </p>

          <div style={{ background: '#f9f9f9', borderRadius: '12px', padding: '2rem', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.75rem' }}>Press Contact</h2>
            <p style={{ color: '#555', marginBottom: '0.5rem' }}>
              <strong>Email:</strong>{' '}
              <a href="mailto:press@myatlaz.com" style={{ color: '#000', textDecoration: 'underline' }}>
                press@myatlaz.com
              </a>
            </p>
            <p style={{ color: '#555' }}>We aim to respond to press inquiries within 24 hours.</p>
          </div>

          <div style={{ background: '#f9f9f9', borderRadius: '12px', padding: '2rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.75rem' }}>About ATLAZ AI</h2>
            <p style={{ color: '#555', lineHeight: '1.7' }}>
              ATLAZ AI is an AI-powered fashion discovery platform that lets shoppers find clothing and accessories using natural language descriptions and image uploads. Launched in 2024, ATLAZ AI partners with fashion retailers across the web to surface products that precisely match shoppers&apos; style intent.
            </p>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
}

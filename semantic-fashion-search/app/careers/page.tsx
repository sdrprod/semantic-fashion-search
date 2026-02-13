import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';

export const metadata = { title: 'Careers - ATLAZ AI' };

export default function CareersPage() {
  return (
    <div className="app">
      <Navigation />
      <div className="container">
        <main className="main-content" style={{ paddingTop: '3rem', paddingBottom: '4rem', maxWidth: '680px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '1rem' }}>Careers</h1>
          <p style={{ color: '#666', marginBottom: '2rem', lineHeight: '1.7' }}>
            We&apos;re building the future of fashion discovery with AI. If you&apos;re passionate about fashion, technology, and creating delightful user experiences, we&apos;d love to meet you.
          </p>

          <div style={{ background: '#f9f9f9', borderRadius: '12px', padding: '2rem', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.75rem' }}>Open Positions</h2>
            <p style={{ color: '#555', fontStyle: 'italic' }}>
              We don&apos;t have any open roles right now, but we&apos;re always interested in exceptional people. If you think you&apos;d be a great fit, reach out.
            </p>
          </div>

          <div style={{ background: '#f9f9f9', borderRadius: '12px', padding: '2rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.75rem' }}>Interested?</h2>
            <p style={{ color: '#555' }}>
              Send your resume and a note about yourself to{' '}
              <a href="mailto:careers@myatlaz.com" style={{ color: '#000', textDecoration: 'underline' }}>
                careers@myatlaz.com
              </a>
            </p>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
}

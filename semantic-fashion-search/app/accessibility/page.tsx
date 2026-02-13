import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';

export const metadata = { title: 'Accessibility - ATLAZ AI' };

export default function AccessibilityPage() {
  return (
    <div className="app">
      <Navigation />
      <div className="container">
        <main className="main-content" style={{ paddingTop: '3rem', paddingBottom: '4rem', maxWidth: '720px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '1rem' }}>Accessibility</h1>
          <p style={{ color: '#666', marginBottom: '2rem', lineHeight: '1.7' }}>
            ATLAZ AI is committed to making fashion discovery accessible to everyone.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', lineHeight: '1.8', color: '#444' }}>
            <section style={{ background: '#f9f9f9', borderRadius: '12px', padding: '1.5rem' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.75rem', color: '#000' }}>Our Standards</h2>
              <p>We aim to conform to the Web Content Accessibility Guidelines (WCAG) 2.1 Level AA. This includes making our site perceivable, operable, understandable, and robust for all users, including those using assistive technologies.</p>
            </section>

            <section style={{ background: '#f9f9f9', borderRadius: '12px', padding: '1.5rem' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.75rem', color: '#000' }}>Current Features</h2>
              <ul style={{ paddingLeft: '1.5rem', margin: 0 }}>
                <li>Keyboard-navigable interface</li>
                <li>Screen reader-compatible ARIA labels on interactive elements</li>
                <li>Sufficient color contrast ratios</li>
                <li>Descriptive alt text on product images</li>
                <li>Resizable text that reflows correctly</li>
              </ul>
            </section>

            <section style={{ background: '#f9f9f9', borderRadius: '12px', padding: '1.5rem' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.75rem', color: '#000' }}>Feedback</h2>
              <p>
                If you encounter any accessibility barriers, please let us know at{' '}
                <a href="mailto:accessibility@myatlaz.com" style={{ color: '#000', textDecoration: 'underline' }}>
                  accessibility@myatlaz.com
                </a>
                . We take all feedback seriously and will work to address issues promptly.
              </p>
            </section>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
}

import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';

export const metadata = { title: 'Cookie Policy - ATLAZ AI' };

export default function CookiePolicyPage() {
  return (
    <div className="app">
      <Navigation />
      <div className="container">
        <main className="main-content" style={{ paddingTop: '3rem', paddingBottom: '4rem', maxWidth: '720px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>Cookie Policy</h1>
          <p style={{ color: '#888', fontSize: '0.875rem', marginBottom: '2rem' }}>Last updated: February 2025</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', lineHeight: '1.8', color: '#444' }}>
            <section>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '0.75rem', color: '#000' }}>What Are Cookies?</h2>
              <p>Cookies are small text files stored in your browser when you visit a website. They help the site remember your preferences and improve your experience.</p>
            </section>

            <section>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '0.75rem', color: '#000' }}>Cookies We Use</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ background: '#f9f9f9', borderRadius: '8px', padding: '1rem' }}>
                  <strong>Essential cookies</strong>
                  <p style={{ margin: '0.25rem 0 0', fontSize: '0.9rem' }}>Required for the site to function — session management, authentication tokens. Cannot be disabled.</p>
                </div>
                <div style={{ background: '#f9f9f9', borderRadius: '8px', padding: '1rem' }}>
                  <strong>Preference cookies</strong>
                  <p style={{ margin: '0.25rem 0 0', fontSize: '0.9rem' }}>Remember your settings and preferences for a better experience on future visits.</p>
                </div>
                <div style={{ background: '#f9f9f9', borderRadius: '8px', padding: '1rem' }}>
                  <strong>Analytics cookies</strong>
                  <p style={{ margin: '0.25rem 0 0', fontSize: '0.9rem' }}>Help us understand how users interact with the site so we can improve it. Data is aggregated and anonymized.</p>
                </div>
              </div>
            </section>

            <section>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '0.75rem', color: '#000' }}>Managing Cookies</h2>
              <p>You can control cookies through your browser settings. Disabling essential cookies may affect site functionality. See your browser&apos;s help documentation for instructions.</p>
            </section>

            <section>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '0.75rem', color: '#000' }}>Contact</h2>
              <p>Questions? <a href="mailto:privacy@myatlaz.com" style={{ color: '#000', textDecoration: 'underline' }}>privacy@myatlaz.com</a></p>
            </section>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
}

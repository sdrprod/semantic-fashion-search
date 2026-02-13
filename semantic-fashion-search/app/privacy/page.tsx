import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';

export const metadata = { title: 'Privacy Policy - ATLAZ AI' };

export default function PrivacyPage() {
  return (
    <div className="app">
      <Navigation />
      <div className="container">
        <main className="main-content" style={{ paddingTop: '3rem', paddingBottom: '4rem', maxWidth: '720px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>Privacy Policy</h1>
          <p style={{ color: '#888', fontSize: '0.875rem', marginBottom: '2rem' }}>Last updated: February 2025</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', lineHeight: '1.8', color: '#444' }}>
            <section>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '0.75rem', color: '#000' }}>1. Information We Collect</h2>
              <p>
                When you use ATLAZ AI, we may collect: search queries you enter, images you upload for visual search, account information if you create an account (email, name), and usage data such as pages visited and search results clicked.
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '0.75rem', color: '#000' }}>2. How We Use Your Information</h2>
              <p>We use collected information to: provide and improve our search service, personalize search results based on your preferences and ratings, send transactional emails (account verification, password reset), and analyze usage patterns to improve our product.</p>
            </section>

            <section>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '0.75rem', color: '#000' }}>3. Information Sharing</h2>
              <p>We do not sell your personal information. We may share data with: service providers who help us operate the platform (e.g., database, AI processing), retail partners when you click through to their sites (subject to their privacy policies), and authorities when required by law.</p>
            </section>

            <section>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '0.75rem', color: '#000' }}>4. Cookies</h2>
              <p>We use cookies and similar technologies to keep you logged in, remember your preferences, and analyze site traffic. See our <a href="/cookie-policy" style={{ color: '#000', textDecoration: 'underline' }}>Cookie Policy</a> for details.</p>
            </section>

            <section>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '0.75rem', color: '#000' }}>5. Your Rights</h2>
              <p>You may request access to, correction of, or deletion of your personal data at any time by contacting us at <a href="mailto:privacy@myatlaz.com" style={{ color: '#000', textDecoration: 'underline' }}>privacy@myatlaz.com</a>.</p>
            </section>

            <section>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '0.75rem', color: '#000' }}>6. Contact</h2>
              <p>For privacy-related inquiries: <a href="mailto:privacy@myatlaz.com" style={{ color: '#000', textDecoration: 'underline' }}>privacy@myatlaz.com</a></p>
            </section>

            <div style={{ background: '#fff3cd', borderRadius: '8px', padding: '1rem', fontSize: '0.875rem', color: '#7a5c00' }}>
              <strong>Note:</strong> This is a preliminary privacy policy. A full, legally reviewed policy will be published before our public launch.
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
}

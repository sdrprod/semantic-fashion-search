import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';

export const metadata = { title: 'Size Guide - ATLAZ AI' };

export default function SizeGuidePage() {
  return (
    <div className="app">
      <Navigation />
      <div className="container">
        <main className="main-content" style={{ paddingTop: '3rem', paddingBottom: '4rem', maxWidth: '720px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '1rem' }}>Size Guide</h1>
          <p style={{ color: '#666', marginBottom: '2rem' }}>
            Sizing varies by brand and retailer. Always check the individual product page for brand-specific sizing charts.
          </p>

          <div style={{ background: '#f9f9f9', borderRadius: '12px', padding: '2rem', marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>Women&apos;s Clothing — General Guide</h2>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #ddd' }}>
                    <th style={{ padding: '8px 12px', textAlign: 'left' }}>US Size</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left' }}>EU Size</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left' }}>UK Size</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left' }}>Bust (in)</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left' }}>Waist (in)</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left' }}>Hips (in)</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['XS / 0–2', '32–34', '4–6', '31–33', '23–25', '33–35'],
                    ['S / 4–6', '36–38', '8–10', '33–35', '25–27', '35–37'],
                    ['M / 8–10', '40–42', '12–14', '35–37', '27–29', '37–39'],
                    ['L / 12–14', '44–46', '16–18', '37–40', '29–32', '39–42'],
                    ['XL / 16–18', '48–50', '20–22', '40–43', '32–35', '42–45'],
                  ].map(([us, eu, uk, bust, waist, hips]) => (
                    <tr key={us} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '8px 12px' }}>{us}</td>
                      <td style={{ padding: '8px 12px' }}>{eu}</td>
                      <td style={{ padding: '8px 12px' }}>{uk}</td>
                      <td style={{ padding: '8px 12px' }}>{bust}</td>
                      <td style={{ padding: '8px 12px' }}>{waist}</td>
                      <td style={{ padding: '8px 12px' }}>{hips}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ background: '#f9f9f9', borderRadius: '12px', padding: '2rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>Tips for Finding Your Size</h2>
            <ul style={{ color: '#555', paddingLeft: '1.5rem', lineHeight: '2' }}>
              <li>Measure yourself with a soft tape measure.</li>
              <li>When between sizes, size up for comfort.</li>
              <li>Check each brand&apos;s size chart — sizing can differ significantly.</li>
              <li>Read customer reviews for fit feedback.</li>
            </ul>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
}

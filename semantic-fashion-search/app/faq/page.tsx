import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';

export const metadata = { title: 'FAQ - ATLAZ AI' };

const faqs = [
  {
    q: 'What is ATLAZ AI?',
    a: 'ATLAZ AI is an AI-powered fashion search engine. You describe what you\'re looking for in natural language — or upload images — and we find matching products from across our network of fashion retailers.',
  },
  {
    q: 'How does the AI search work?',
    a: 'Our AI understands the intent and style behind your words, not just keywords. It matches your description against thousands of products using semantic understanding, so you get relevant results even when you can\'t find the exact words.',
  },
  {
    q: 'Do I need an account to use ATLAZ AI?',
    a: 'No account is required to search. Creating an account lets you save your search history and receive personalized recommendations over time.',
  },
  {
    q: 'Are the products sold directly by ATLAZ AI?',
    a: 'No. ATLAZ AI is a discovery platform. When you click a product, you\'re taken to the retailer\'s website to complete your purchase. We earn a small commission from some retailers when you buy through our links.',
  },
  {
    q: 'How do I return or exchange a product?',
    a: 'Returns are handled directly by the retailer where you made your purchase. Visit our Returns & Exchanges page for guidance.',
  },
  {
    q: 'Can I search by uploading a photo?',
    a: 'Yes! Use the "Search by Image" feature to upload up to 5 images. Our AI analyzes the style, colors, and aesthetic and finds similar items. You can also combine image upload with a text description for even more precise results.',
  },
  {
    q: 'Why do I sometimes see unrelated products?',
    a: 'AI search is powerful but not perfect. If results don\'t match your intent, try rephrasing your query with more specific details — like color, occasion, or style. Rate the relevance of results (the star icons on each product card) to help improve future searches.',
  },
  {
    q: 'How do the star ratings work?',
    a: 'The stars on each product card let you rate how relevant the result is to your search (1 = not relevant, 5 = excellent match). These ratings help our AI learn your preferences and improve results over time.',
  },
];

export default function FaqPage() {
  return (
    <div className="app">
      <Navigation />
      <div className="container">
        <main className="main-content" style={{ paddingTop: '3rem', paddingBottom: '4rem', maxWidth: '720px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>Frequently Asked Questions</h1>
          <p style={{ color: '#666', marginBottom: '2.5rem' }}>
            Can&apos;t find an answer? <a href="/contact" style={{ color: '#000', textDecoration: 'underline' }}>Contact us</a>.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {faqs.map(({ q, a }) => (
              <div key={q} style={{ background: '#f9f9f9', borderRadius: '12px', padding: '1.5rem' }}>
                <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>{q}</h2>
                <p style={{ color: '#555', margin: 0, lineHeight: '1.7' }}>{a}</p>
              </div>
            ))}
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
}

import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Semantic Fashion Search - AI-Powered Fashion Discovery',
  description: 'Discover clothing that matches your exact vision using natural language. Our AI understands your style preferences and finds the perfect pieces for any occasion.',
  keywords: ['fashion', 'AI search', 'semantic search', 'clothing', 'style', 'shopping'],
  openGraph: {
    title: 'Semantic Fashion Search',
    description: 'AI-powered fashion discovery using natural language',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Semantic Fashion Search',
    description: 'AI-powered fashion discovery using natural language',
  },
};

// JSON-LD structured data for SEO
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Semantic Fashion Search',
  description: 'AI-powered fashion discovery using natural language',
  applicationCategory: 'ShoppingApplication',
  operatingSystem: 'Web',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
  featureList: [
    'Natural language search',
    'AI-powered recommendations',
    'Multi-item outfit suggestions',
    'Semantic understanding of style preferences',
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}

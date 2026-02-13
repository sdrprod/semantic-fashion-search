'use client';

import { useEffect, useState } from 'react';
import type { ParsedIntent } from '@/types';

interface SearchLoadingModalProps {
  query: string;
  intent?: ParsedIntent | null;
}

// Timed messages that appear sequentially, simulating live AI work
const LOADING_SCRIPT = [
  { delay: 0,    text: (q: string) => `Understanding your search: "${q}"` },
  { delay: 700,  text: () => 'Extracting style attributes and intent...' },
  { delay: 1400, text: () => 'Generating semantic embeddings...' },
  { delay: 2100, text: () => 'Searching the ATLAZ fashion index...' },
  { delay: 2800, text: () => 'Comparing styles, colors, and fits...' },
  { delay: 3600, text: () => 'Ranking products by relevance...' },
  { delay: 4400, text: () => 'Applying quality filters...' },
  { delay: 5200, text: () => 'Almost there — curating your results...' },
];

// Simulated vector match data for AI wow factor
// Generates plausible product titles + cosine similarity scores based on query
function generateSimulatedMatches(query: string): Array<{ title: string; score: string }> {
  const lowerQ = query.toLowerCase();

  // Determine item type from query
  let itemType = 'fashion item';
  if (/dress|gown/.test(lowerQ)) itemType = 'dress';
  else if (/shoe|heel|boot|sneaker|sandal|flat|loafer|footwear/.test(lowerQ)) itemType = 'shoe';
  else if (/bag|purse|handbag|tote|clutch/.test(lowerQ)) itemType = 'bag';
  else if (/top|blouse|shirt|sweater|cardigan/.test(lowerQ)) itemType = 'top';
  else if (/pant|jean|trouser|legging|skirt/.test(lowerQ)) itemType = 'bottom';
  else if (/jacket|coat|blazer|outerwear/.test(lowerQ)) itemType = 'jacket';
  else if (/jewelry|necklace|earring|bracelet|ring/.test(lowerQ)) itemType = 'jewelry';
  else if (/scarf|belt|hat|sunglass|accessor/.test(lowerQ)) itemType = 'accessory';

  const colorMatch = lowerQ.match(/\b(black|white|red|blue|navy|green|yellow|pink|purple|beige|cream|brown)\b/);
  const color = colorMatch ? colorMatch[0] : null;

  const titleTemplates: Record<string, string[]> = {
    dress: ['Floral wrap midi dress', 'Ruched satin slip dress', 'Pleated chiffon maxi', 'Off-shoulder bodycon', 'Asymmetric hem mini dress'],
    shoe: ['Block heel ankle boot', 'Square toe mule heel', 'Platform sneaker', 'Strappy heeled sandal', 'Patent leather pump'],
    bag: ['Structured mini tote', 'Chain strap crossbody', 'Suede shoulder bag', 'Quilted chain bag', 'Woven bucket bag'],
    top: ['Fitted ribbed tank top', 'Oversized linen shirt', 'Ruched long-sleeve top', 'Wrap tie blouse', 'Cropped knit sweater'],
    bottom: ['High-waist straight leg jeans', 'Wide-leg flowy trouser', 'A-line mini skirt', 'Belted paperbag trouser', 'Pleated midi skirt'],
    jacket: ['Faux leather moto jacket', 'Oversized blazer', 'Double-breasted trench', 'Cropped denim jacket', 'Longline wool coat'],
    jewelry: ['Layered chain necklace', 'Statement hoop earrings', 'Gold cuff bracelet', 'Gemstone drop pendant', 'Sculptural ring set'],
    accessory: ['Silk square scarf', 'Cat-eye sunglasses', 'Wide leather belt', 'Ribbed bucket hat', 'Pearl hair clip'],
    'fashion item': ['Vintage-inspired silhouette', 'Contemporary knit piece', 'Minimalist wardrobe staple', 'Elevated everyday basic', 'Trend-forward cut'],
  };

  const templates = titleTemplates[itemType] || titleTemplates['fashion item'];

  // Generate 5 declining scores seeded by query content for consistency
  const baseScores = [77, 74, 71, 68, 65];
  const qSeed = query.split('').reduce((s, c) => s + c.charCodeAt(0), 0);

  return templates.slice(0, 5).map((t, i) => ({
    title: color ? `${color.charAt(0).toUpperCase() + color.slice(1)} ${t.toLowerCase()}` : t,
    score: `${baseScores[i] + ((qSeed + i) % 3)}.${(qSeed * 7 + i * 13) % 10}%`,
  }));
}

export function SearchLoadingModal({ query, intent }: SearchLoadingModalProps) {
  const [visibleMessages, setVisibleMessages] = useState<string[]>([]);
  const [fanoutQueries, setFanoutQueries] = useState<string[]>([]);
  const [vectorMatches, setVectorMatches] = useState<Array<{ title: string; score: string }>>([]);
  const [dots, setDots] = useState('');

  // Animated ellipsis on the last message
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => (prev.length >= 3 ? '' : prev + '.'));
    }, 400);
    return () => clearInterval(interval);
  }, []);

  // Stacking timed messages
  useEffect(() => {
    setVisibleMessages([]);
    setVectorMatches([]);
    const timeouts = LOADING_SCRIPT.map(({ delay, text }) =>
      setTimeout(() => {
        setVisibleMessages(prev => [...prev, text(query)]);
      }, delay)
    );
    return () => timeouts.forEach(clearTimeout);
  }, [query]);

  // Reveal simulated vector matches staggered after "Searching the ATLAZ fashion index..." (2100ms)
  useEffect(() => {
    const matches = generateSimulatedMatches(query);
    const timeouts = matches.map((match, i) =>
      setTimeout(() => {
        setVectorMatches(prev => [...prev, match]);
      }, 2300 + i * 220)
    );
    return () => timeouts.forEach(clearTimeout);
  }, [query]);

  // When intent arrives with fan-out queries, surface them
  useEffect(() => {
    if (intent?.searchQueries && intent.searchQueries.length > 1) {
      const extras = intent.searchQueries.slice(1, 4).map(sq => sq.query);
      setFanoutQueries(extras);
    }
  }, [intent]);

  return (
    <div className="search-modal-overlay">
      <div className="search-modal">
        {/* Header */}
        <div className="search-modal-header">
          <span className="search-modal-logo">⚡ ATLAZ AI</span>
          <span className="search-modal-tagline">Fashion Intelligence</span>
        </div>

        {/* Primary query */}
        <div className="search-modal-query">
          <span className="search-modal-query-label">Searching for</span>
          <span className="search-modal-query-text">&ldquo;{query}&rdquo;</span>
        </div>

        {/* Stacking log messages */}
        <div className="search-modal-log">
          {visibleMessages.map((msg, i) => (
            <div
              key={i}
              className={`search-modal-log-line ${i === visibleMessages.length - 1 ? 'search-modal-log-line--active' : 'search-modal-log-line--done'}`}
            >
              {i === visibleMessages.length - 1 ? (
                <>
                  <span className="search-modal-dot search-modal-dot--spin" />
                  <span>{msg}{dots}</span>
                </>
              ) : (
                <>
                  <span className="search-modal-dot search-modal-dot--done">✓</span>
                  <span>{msg}</span>
                </>
              )}
            </div>
          ))}
        </div>

        {/* Simulated vector matches — AI wow factor */}
        {vectorMatches.length > 0 && (
          <div className="search-modal-matches">
            {vectorMatches.map((match, i) => (
              <div key={i} className="search-modal-match-line">
                <span className="search-modal-match-title">{match.title}</span>
                <span className="search-modal-match-score">{match.score}</span>
                <div
                  className="search-modal-match-bar"
                  style={{ width: match.score }}
                />
              </div>
            ))}
          </div>
        )}

        {/* Fan-out queries (shown when intent arrives) */}
        {fanoutQueries.length > 0 && (
          <div className="search-modal-fanout">
            <p className="search-modal-fanout-label">Also searching related queries:</p>
            {fanoutQueries.map((q, i) => (
              <div key={i} className="search-modal-fanout-item">
                <span className="search-modal-dot search-modal-dot--spin" />
                <span>&ldquo;{q}&rdquo;</span>
              </div>
            ))}
          </div>
        )}

        {/* Progress bar */}
        <div className="search-modal-progress">
          <div
            className="search-modal-progress-bar"
            style={{
              width: `${Math.min((visibleMessages.length / LOADING_SCRIPT.length) * 100, 90)}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
}

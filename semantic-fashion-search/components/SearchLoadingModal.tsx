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

export function SearchLoadingModal({ query, intent }: SearchLoadingModalProps) {
  const [visibleMessages, setVisibleMessages] = useState<string[]>([]);
  const [fanoutQueries, setFanoutQueries] = useState<string[]>([]);
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
    const timeouts = LOADING_SCRIPT.map(({ delay, text }) =>
      setTimeout(() => {
        setVisibleMessages(prev => [...prev, text(query)]);
      }, delay)
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

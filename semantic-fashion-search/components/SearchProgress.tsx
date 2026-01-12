'use client';

import { useState, useEffect } from 'react';

interface SearchQuery {
  query: string;
  similarity?: number;
}

interface SearchProgressProps {
  userQuery: string;
  fanoutQueries?: SearchQuery[];
}

export function SearchProgress({ userQuery, fanoutQueries = [] }: SearchProgressProps) {
  const [currentIndex, setCurrentIndex] = useState(-1); // -1 means show user query

  useEffect(() => {
    if (fanoutQueries.length === 0) return;

    // Start with user query, then cycle through fanout queries
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % (fanoutQueries.length + 1) - 1);
    }, 2000); // Change every 2 seconds

    return () => clearInterval(interval);
  }, [fanoutQueries.length]);

  const currentQuery = currentIndex === -1 ? userQuery : fanoutQueries[currentIndex]?.query;
  const currentSimilarity = currentIndex === -1 ? null : fanoutQueries[currentIndex]?.similarity;

  return (
    <div className="search-progress">
      <div className="search-progress-spinner"></div>
      <div className="search-progress-content">
        <p className="search-progress-label">
          {currentIndex === -1 ? 'Searching for:' : 'Also searching:'}
        </p>
        <p className="search-progress-query">
          "{currentQuery}"
        </p>
        {currentSimilarity != null && (
          <p className="search-progress-match">
            Match: {(currentSimilarity * 100).toFixed(2)}%
          </p>
        )}
      </div>
    </div>
  );
}

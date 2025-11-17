'use client';

import React, { useState } from 'react';

interface SearchBarProps {
  initialQuery?: string;
  onSearch: (query: string) => void;
  loading?: boolean;
  placeholder?: string;
}

export function SearchBar({
  initialQuery = '',
  onSearch,
  loading = false,
  placeholder = 'Describe what you\'re looking for...',
}: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim().length >= 3) {
      onSearch(query.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="search-bar">
      <textarea
        className="search-input"
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={loading}
        rows={3}
        aria-label="Search query"
      />
      <button
        type="submit"
        className="search-button"
        disabled={loading || query.trim().length < 3}
        aria-label={loading ? 'Searching...' : 'Search'}
      >
        {loading ? 'Searching...' : 'Search'}
      </button>
    </form>
  );
}

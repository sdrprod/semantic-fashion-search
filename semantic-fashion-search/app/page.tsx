'use client';

import { useState } from 'react';
import { SearchBar } from '@/components/SearchBar';
import { ProductCard } from '@/components/ProductCard';
import { Pagination } from '@/components/Pagination';
import { EmailSubscribe } from '@/components/EmailSubscribe';
import type { Product, ParsedIntent } from '@/types';

export default function Home() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [intent, setIntent] = useState<ParsedIntent | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  const hasSearched = results.length > 0 || error !== null || loading || intent !== null;

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery || searchQuery.trim().length < 3) {
      return;
    }

    setQuery(searchQuery);
    setLoading(true);
    setError(null);
    setIntent(null);
    setPage(1);

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: searchQuery.trim(),
          limit: pageSize,
          page: 1,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Search request failed' }));
        throw new Error(errorData.error || 'Search request failed');
      }

      const data = await response.json();
      setResults(data.results || []);
      setIntent(data.intent || null);
      setTotalCount(data.totalCount || data.results?.length || 0);
    } catch (err) {
      console.error('Search failed:', err);
      setError(err instanceof Error ? err.message : 'Search failed. Please try again.');
      setResults([]);
      setIntent(null);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = async (newPage: number) => {
    if (!query || newPage < 1) return;

    setLoading(true);
    setPage(newPage);

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: query.trim(),
          limit: pageSize,
          page: newPage,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to load page');
      }

      const data = await response.json();
      setResults(data.results || []);
      setTotalCount(data.totalCount || data.results?.length || 0);
    } catch (err) {
      console.error('Page load failed:', err);
      setError('Failed to load page. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    if (query) {
      setPage(1);
      handleSearch(query);
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="app">
      <div className="container">
        <header className="header">
          <h1 className="title">Semantic Fashion Search</h1>
          <p className="subtitle">
            Discover clothing that matches your exact vision using natural language
          </p>
        </header>

        <SearchBar
          initialQuery={query}
          onSearch={handleSearch}
          loading={loading}
          placeholder="Describe what you're looking for in detail... For example: 'I'm going to a garden party and need something floral and elegant but not too formal'"
        />

        <main className="main-content">
          {!hasSearched && (
            <div className="hint-text">
              <p>
                Type a detailed description of what you're looking for and press Enter or
                click Search.
              </p>
              <p>
                Try complex queries like: "I'm going to a party with my new significant other
                and need to look both stunning and like I'm not trying to show anyone up,
                so it's a really fine line - show me ideas for dresses, shoes, and bags"
              </p>
            </div>
          )}

          {loading && (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Analyzing your request and finding perfect matches...</p>
            </div>
          )}

          {error && (
            <div className="error-state">
              <p>{error}</p>
            </div>
          )}

          {!loading && !error && intent?.explanation && (
            <div className="intent-explanation">
              <strong>Understanding your request:</strong> {intent.explanation}
            </div>
          )}

          {!loading && !error && results.length === 0 && hasSearched && (
            <div className="empty-state">
              <p>No matches found. Try adjusting your description.</p>
            </div>
          )}

          {!loading && !error && results.length > 0 && (
            <>
              <div className="results-header">
                <p className="results-count">
                  Showing {results.length} of {totalCount} results
                </p>
              </div>

              <div className="results-grid">
                {results.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {totalCount > pageSize && (
                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  pageSize={pageSize}
                  onPageChange={handlePageChange}
                  onPageSizeChange={handlePageSizeChange}
                />
              )}
            </>
          )}
        </main>

        <EmailSubscribe />

        <footer className="footer">
          <p>Powered by AI-driven semantic search technology</p>
        </footer>
      </div>
    </div>
  );
}

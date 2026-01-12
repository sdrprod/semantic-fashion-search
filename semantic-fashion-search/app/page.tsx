'use client';

import { useState } from 'react';
import { SearchBar } from '@/components/SearchBar';
import { ImageUpload } from '@/components/ImageUpload';
import { ProductCard } from '@/components/ProductCard';
import { Pagination } from '@/components/Pagination';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { HowToUse } from '@/components/HowToUse';
import { EmailSubscribe } from '@/components/EmailSubscribe';
import type { Product, ParsedIntent } from '@/types';

const EXAMPLE_SEARCHES = [
  'Sinky black dress for date night',
  'Casual summer brunch outfit',
  'Business casual blazer',
];

export default function Home() {
  const [query, setQuery] = useState('');
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [intent, setIntent] = useState<ParsedIntent | null>(null);
  const [searchType, setSearchType] = useState<'text' | 'visual' | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  const hasSearched = results.length > 0 || error !== null || loading || intent !== null;

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery || searchQuery.trim().length < 3) {
      return;
    }

    setQuery(searchQuery);
    setSearchType('text');
    setLoading(true);
    setError(null);
    setIntent(null);
    setPage(1);
    setUploadedImages([]); // Clear uploaded images when doing text search

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

  const handleVisualSearch = async () => {
    if (uploadedImages.length === 0 && (!query || query.trim().length < 3)) {
      setError('Please upload at least one image or enter a text description.');
      return;
    }

    // Capture query NOW before it gets cleared
    const searchQuery = query.trim();

    setSearchType('visual');
    setLoading(true);
    setError(null);
    setIntent(null);
    setResults([]); // Clear previous results
    setPage(1);

    try {
      const formData = new FormData();

      // Add images
      uploadedImages.forEach((file, index) => {
        formData.append(`image${index}`, file);
      });

      // Add optional text query
      if (searchQuery && searchQuery.length >= 3) {
        formData.append('query', searchQuery);
      }

      const response = await fetch('/api/search/visual', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Visual search failed' }));
        throw new Error(errorData.error || 'Visual search failed');
      }

      const data = await response.json();
      console.log('[Visual Search] Response:', data);
      setResults(data.results || []);
      setTotalCount(data.results?.length || 0);

      // Create a custom intent message for visual search
      const imageText = uploadedImages.length === 1 ? '1 image' : `${uploadedImages.length} images`;
      const intentMsg = searchQuery
        ? `I understand you're looking for items similar to ${imageText} with the description: "${searchQuery}". Is that correct?`
        : `I understand you're looking for items similar to ${imageText}. Is that correct?`;

      setIntent({ explanation: intentMsg } as ParsedIntent);
    } catch (err) {
      console.error('Visual search failed:', err);
      setError(err instanceof Error ? err.message : 'Visual search failed. Please try again.');
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
      <Navigation />

      <div className="container">
        {/* Hero Section */}
        {!hasSearched && (
          <header className="hero">
            <h1 className="hero-title">
              Describe Your Fashion Vibe and Build Your Own AI Fashion Consultant with ATLAZ AI
            </h1>
            <p className="hero-subtitle">
              Describe what you're looking for in natural language
            </p>

            <SearchBar
              initialQuery={query}
              onSearch={handleSearch}
              loading={loading}
              placeholder="Try: 'I need a floral dress for a garden party that's elegant but not too formal'"
            />

            <div className="visual-search-section">
              <div className="visual-search-header">
                <h2 className="visual-search-title">Or Search by Image</h2>
                <p className="visual-search-subtitle">Upload up to 3 images to find similar styles</p>
              </div>

              <ImageUpload
                onImagesChange={setUploadedImages}
                maxFiles={3}
                disabled={loading}
              />

              {uploadedImages.length > 0 && (
                <button
                  className="visual-search-btn"
                  onClick={handleVisualSearch}
                  disabled={loading}
                >
                  {loading ? 'Searching...' : `Search by Visual`}
                </button>
              )}
            </div>

            {/* Example Searches */}
            <div className="example-searches">
              <p className="example-searches-label">Try these example searches:</p>
              <div className="example-searches-pills">
                {EXAMPLE_SEARCHES.map((example, i) => (
                  <button
                    key={i}
                    className="example-search-pill"
                    onClick={() => handleSearch(example)}
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          </header>
        )}

        <main className="main-content">
          {!hasSearched && <HowToUse />}

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

          {!loading && !error && hasSearched && (
            <>
              {/* Show sample search queries from intent fan-out */}
              {intent?.searchQueries && intent.searchQueries.length > 1 && searchType === 'text' && (
                <div className="search-fanout">
                  <p className="fanout-label">Also searching these queries and more:</p>
                  <div className="fanout-queries">
                    {intent.searchQueries
                      .slice()
                      .sort(() => Math.random() - 0.5)
                      .slice(0, 3)
                      .map((sq, i) => (
                        <span key={i} className="fanout-query">
                          "{sq.query}"
                        </span>
                      ))}
                  </div>
                </div>
              )}

              <div className="intent-explanation">
                {intent?.explanation || `I understand that you are looking for ${query}. Is that correct?`}
              </div>
            </>
          )}

          {!loading && !error && results.length === 0 && hasSearched && (
            <div className="empty-state">
              <p>No matches found. Try adjusting your description.</p>
            </div>
          )}

          {!loading && !error && results.length > 0 && (
            <>
              <div className="results-header">
                <div className="results-info">
                  <p className="results-count">
                    Showing {results.length} of {totalCount} results
                  </p>
                </div>
                <button
                  className="new-search-btn"
                  onClick={() => window.location.href = '/'}
                >
                  New Search
                </button>
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
      </div>

      <Footer />
    </div>
  );
}

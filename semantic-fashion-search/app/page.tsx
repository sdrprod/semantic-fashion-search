'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { SearchBar } from '@/components/SearchBar';
import { ImageUpload } from '@/components/ImageUpload';
import { ProductCard } from '@/components/ProductCard';
import { Pagination } from '@/components/Pagination';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { HowToUse } from '@/components/HowToUse';
import { EmailSubscribe } from '@/components/EmailSubscribe';
import { useSessionRatings } from '@/src/hooks/useSessionRatings';
import { usePersistentRatings } from '@/src/hooks/usePersistentRatings';
import type { Product, ParsedIntent } from '@/types';

const EXAMPLE_SEARCHES = [
  'Sinky black dress for date night',
  'Casual summer brunch outfit',
  'Business casual blazer',
];

function HomeContent() {
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const [query, setQuery] = useState('');
  const [actualSearchQuery, setActualSearchQuery] = useState(''); // The query actually used for search (may differ for visual search)
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [intent, setIntent] = useState<ParsedIntent | null>(null);
  const [qualityWarning, setQualityWarning] = useState<string | null>(null);
  const [searchType, setSearchType] = useState<'text' | 'visual' | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [totalCount, setTotalCount] = useState(0);
  const [fanoutSeed, setFanoutSeed] = useState(0); // For controlled randomization
  const [authError, setAuthError] = useState<string | null>(null);

  // Rating hooks - session (anonymous) and persistent (authenticated)
  const sessionRatings = useSessionRatings();
  const persistentRatings = usePersistentRatings({
    userId: session?.user?.id || null,
    autoFetch: true,
  });

  const hasSearched = results.length > 0 || error !== null || loading || intent !== null;

  // Check for authorization errors
  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam === 'unauthorized') {
      setAuthError('You do not have permission to access the admin area. Please contact an administrator if you need access.');
      // Clear the error parameter from URL
      window.history.replaceState({}, '', '/');
    }
  }, [searchParams]);

  // Reset to initial blank search state
  const handleReset = () => {
    setQuery('');
    setActualSearchQuery('');
    setUploadedImages([]);
    setResults([]);
    setError(null);
    setIntent(null);
    setQualityWarning(null);
    setSearchType(null);
    setPage(1);
    setTotalCount(0);
    setFanoutSeed(0);
  };

  // Refresh the "also searching for" queries
  const handleRefreshFanout = () => {
    setFanoutSeed(prev => prev + 1);
  };

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery || searchQuery.trim().length < 3) {
      return;
    }

    setQuery(searchQuery);
    setLoading(true);
    setError(null);
    setIntent(null);
    setQualityWarning(null);
    setPage(1);

    // If images are uploaded, use hybrid search
    if (uploadedImages.length > 0) {
      console.log('[Search] Using hybrid search (text + images)');
      await handleVisualSearch();
      return;
    }

    // Otherwise, use text-only search
    setSearchType('text');

    // Gather user ratings (session or persistent depending on auth state)
    const currentRatings = session?.user?.id && persistentRatings.isLoaded
      ? persistentRatings.ratings
      : sessionRatings.ratings;

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
          userRatings: currentRatings, // Include user's ratings for personalization
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Search request failed' }));
        throw new Error(errorData.error || 'Search request failed');
      }

      const data = await response.json();
      setResults(data.results || []);
      setIntent(data.intent || null);
      setQualityWarning(data.qualityWarning || null);
      setTotalCount(data.totalCount || data.results?.length || 0);
      setActualSearchQuery(searchQuery.trim()); // Store the actual query used
    } catch (err) {
      console.error('Search failed:', err);
      setError(err instanceof Error ? err.message : 'Search failed. Please try again.');
      setResults([]);
      setIntent(null);
      setQualityWarning(null);
    } finally {
      setLoading(false);
    }
  };

  const handleVisualSearch = async () => {
    if (uploadedImages.length === 0 && (!query || query.trim().length < 3)) {
      setError('Please upload at least one image or enter a text description.');
      return;
    }

    // Capture query for search
    const searchQuery = query.trim();

    // Determine search type
    const hasImages = uploadedImages.length > 0;
    const hasText = searchQuery && searchQuery.length >= 3;
    setSearchType(hasImages && hasText ? 'visual' : hasImages ? 'visual' : 'text');

    setLoading(true);
    setError(null);
    setIntent(null);
    setQualityWarning(null);
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
      setTotalCount(data.totalCount || data.results?.length || 0);
      setQualityWarning(data.qualityWarning || null);

      // Store the actual query generated by visual search for pagination
      setActualSearchQuery(data.query || searchQuery.trim());

      // Create a custom intent message based on search type
      const imageText = uploadedImages.length === 1 ? '1 image' : `${uploadedImages.length} images`;
      let intentMsg = '';

      if (data.meta?.searchType === 'hybrid') {
        // Hybrid search (images + text)
        intentMsg = `Perfect! I can help you find pieces that match "${searchQuery}" while also capturing the style, colors, and vibe from the ${imageText} you uploaded. By combining your description with visual analysis, we're searching for the most precise matches - this is the best way to find exactly what you're envisioning! Does that sound right?`;
      } else if (searchQuery) {
        // Image + text but processed as visual
        intentMsg = `I can help you find pieces similar to the ${imageText} you shared, with a focus on "${searchQuery}". I'm analyzing the style, colors, and aesthetic from your images to find matching items that fit your description. How does that sound?`;
      } else {
        // Image-only search
        intentMsg = `I'm analyzing the ${imageText} you uploaded to find pieces with similar styles, colors, and aesthetics! I'll search for items that match the vibe and look of what you've shown me. Does that work for you?`;
      }

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
    if (!actualSearchQuery || newPage < 1) return;

    setLoading(true);
    setPage(newPage);

    // Gather user ratings (session or persistent depending on auth state)
    const currentRatings = session?.user?.id && persistentRatings.isLoaded
      ? persistentRatings.ratings
      : sessionRatings.ratings;

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: actualSearchQuery, // Use the actual search query (may be generated from images)
          limit: pageSize,
          page: newPage,
          userRatings: currentRatings, // Include user's ratings for personalization
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to load page');
      }

      const data = await response.json();
      setResults(data.results || []);
      setQualityWarning(data.qualityWarning || null);
      // DON'T update totalCount during pagination - it was set during initial search
      // setTotalCount(data.totalCount || data.results?.length || 0);
    } catch (err) {
      console.error('Page load failed:', err);
      setError('Failed to load page. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    if (actualSearchQuery) {
      setPage(1);
      handleSearch(actualSearchQuery);
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="app">
      <Navigation onReset={handleReset} />

      <div className="container">
        {/* Authorization Error Message */}
        {authError && (
          <div style={{
            background: '#fee',
            border: '2px solid #fcc',
            padding: '16px 20px',
            borderRadius: '8px',
            marginBottom: '24px',
            color: '#c33',
            fontSize: '15px',
            fontWeight: 500,
          }}>
            {authError}
          </div>
        )}

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
                <p className="visual-search-subtitle">
                  Upload up to 5 images to find similar styles (top, jacket, shoes, bag, accessories)
                  <span className="hybrid-hint"> • Combine with text for ultra-precise results</span>
                </p>
              </div>

              <ImageUpload
                onImagesChange={setUploadedImages}
                maxFiles={5}
                disabled={loading}
              />

              {uploadedImages.length > 0 && (
                <>
                  <button
                    className="visual-search-btn"
                    onClick={handleVisualSearch}
                    disabled={loading}
                  >
                    {loading ? 'Searching...' :
                      query && query.trim().length >= 3
                        ? `🔍 Hybrid Search (Text + Images)`
                        : `🔍 Search by Images`}
                  </button>
                  {query && query.trim().length >= 3 && (
                    <p className="hybrid-search-note">
                      Combining your text description with uploaded images for the most accurate results
                    </p>
                  )}
                </>
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
                  <div className="fanout-header">
                    <p className="fanout-label">Also searching these queries and more:</p>
                    <button
                      className="fanout-refresh-btn"
                      onClick={handleRefreshFanout}
                      title="Show different queries"
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path
                          d="M13.65 2.35C12.2 0.9 10.21 0 8 0 3.58 0 0.01 3.58 0.01 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L9 7h7V0l-2.35 2.35z"
                          fill="currentColor"
                        />
                      </svg>
                    </button>
                  </div>
                  <div className="fanout-queries">
                    {intent.searchQueries
                      .slice()
                      .sort(() => {
                        // Seed-based randomization for controlled refresh
                        const hash = (str: string) => {
                          let h = fanoutSeed;
                          for (let i = 0; i < str.length; i++) {
                            h = Math.imul(31, h) + str.charCodeAt(i) | 0;
                          }
                          return h;
                        };
                        return Math.sin(hash(Math.random().toString())) - 0.5;
                      })
                      .slice(0, 3)
                      .map((sq, i) => (
                        <span key={`${fanoutSeed}-${i}`} className="fanout-query">
                          "{sq.query}"
                        </span>
                      ))}
                  </div>
                </div>
              )}

              <div className="intent-explanation">
                {intent?.explanation || `I understand that you are looking for ${query}. Is that correct?`}
              </div>

              {/* Quality Warning - shown when similarity scores are low */}
              {qualityWarning && (
                <div className="quality-warning">
                  <div className="quality-warning-icon">ℹ️</div>
                  <div className="quality-warning-content">
                    <p className="quality-warning-text">{qualityWarning}</p>
                    <button
                      className="quality-warning-btn"
                      onClick={handleReset}
                    >
                      Start New Search
                    </button>
                  </div>
                </div>
              )}
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
                    {(() => {
                      const start = (page - 1) * pageSize + 1;
                      const end = Math.min(page * pageSize, totalCount);
                      return `Showing results ${start}-${end} of ${totalCount}`;
                    })()}
                  </p>
                </div>
                <button
                  className="new-search-btn"
                  onClick={handleReset}
                >
                  New Search
                </button>
              </div>

              <div className="results-grid">
                {results.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    sessionRatings={sessionRatings}
                    persistentRatings={persistentRatings}
                  />
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

              {/* New Search button at bottom of results */}
              <div className="results-footer">
                <button
                  className="new-search-btn-bottom"
                  onClick={handleReset}
                >
                  Start New Search
                </button>
              </div>
            </>
          )}
        </main>

        <EmailSubscribe />
      </div>

      <Footer />
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HomeContent />
    </Suspense>
  );
}

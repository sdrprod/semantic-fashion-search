import { useSearch } from "./hooks/useSearch";
import { SearchBar } from "./components/SearchBar";
import { ProductCard } from "./components/ProductCard";

export function App() {
  const { query, setQuery, results, loading, error, runSearch } = useSearch();

  const hasSearched = results.length > 0 || error !== null || loading;

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
          value={query}
          onChange={setQuery}
          onSubmit={runSearch}
          loading={loading}
        />

        <main className="main-content">
          {!hasSearched && (
            <div className="hint-text">
              <p>
                Type a detailed description of what you're looking for and press Enter or
                click Search.
              </p>
              <p>
                For example: "black fitted midi dress with square neckline, minimal, no
                cutouts"
              </p>
            </div>
          )}

          {loading && (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Searching for your perfect match...</p>
            </div>
          )}

          {error && (
            <div className="error-state">
              <p>{error}</p>
            </div>
          )}

          {!loading && !error && results.length === 0 && hasSearched && (
            <div className="empty-state">
              <p>No matches found. Try adjusting your description.</p>
            </div>
          )}

          {!loading && !error && results.length > 0 && (
            <div className="results-grid">
              {results.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

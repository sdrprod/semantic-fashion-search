import { useSearch } from "./hooks/useSearch";
import { useSession } from "./hooks/useSession";
import { useFeedback } from "./hooks/useFeedback";
import { SearchBar } from "./components/SearchBar";
import { ProductCard } from "./components/ProductCard";
import { RefinementBox } from "./components/RefinementBox";

export function App() {
  const {
    query,
    setQuery,
    refinement,
    setRefinement,
    results,
    loading,
    error,
    showRefinement,
    runSearch
  } = useSearch();

  const sessionId = useSession();
  const { votes, hiddenProducts, upvote, downvote } = useFeedback(sessionId);

  // Filter out downvoted products
  const visibleResults = results.filter(product => !hiddenProducts.has(product.id));

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
          onSubmit={() => runSearch(false)}
          loading={loading}
        />

        <RefinementBox
          value={refinement}
          onChange={setRefinement}
          onRefine={() => runSearch(true)}
          loading={loading}
          show={showRefinement && results.length > 0}
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

          {!loading && !error && visibleResults.length > 0 && (
            <div className="results-grid">
              {visibleResults.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onUpvote={upvote}
                  onDownvote={downvote}
                  currentVote={votes.get(product.id)}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

import { useState } from "react";
import { searchProducts } from "../lib/api";
import type { Product } from "../types";

const RESULTS_PER_PAGE = 24;
const MAX_RESULTS = 100;

export function useSearch() {
  const [query, setQuery] = useState("");
  const [refinement, setRefinement] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRefinement, setShowRefinement] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const runSearch = async (useRefinement = false) => {
    // Build the search query
    let searchQuery = query.trim();

    // If refining, combine original query with refinement
    if (useRefinement && refinement.trim()) {
      searchQuery = `${query.trim()}. ${refinement.trim()}`;
    }

    // Don't search if query is empty or too short
    if (!searchQuery || searchQuery.length < 3) {
      return;
    }

    setLoading(true);
    setError(null);
    setCurrentPage(1);

    try {
      const response = await searchProducts(searchQuery, {
        limit: RESULTS_PER_PAGE,
        page: 1,
      });

      setResults(response.results);

      // Check if there are more results available
      setHasMore(response.results.length === RESULTS_PER_PAGE && RESULTS_PER_PAGE < MAX_RESULTS);

      // Show refinement box after initial search (only if not already showing)
      if (!useRefinement && !showRefinement) {
        setShowRefinement(true);
      }

      // Clear refinement after using it
      if (useRefinement) {
        setRefinement("");
      }
    } catch (err) {
      console.error("Search failed:", err);
      setError(err instanceof Error ? err.message : "Search failed. Please try again.");
      setResults([]);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    if (!query || loadingMore || !hasMore) return;

    setLoadingMore(true);
    setError(null);

    try {
      const nextPage = currentPage + 1;
      const response = await searchProducts(query, {
        limit: RESULTS_PER_PAGE,
        page: nextPage,
      });

      setResults(prev => [...prev, ...response.results]);
      setCurrentPage(nextPage);

      // Check if we've hit the max or no more results
      const totalLoaded = results.length + response.results.length;
      setHasMore(
        response.results.length === RESULTS_PER_PAGE &&
        totalLoaded < MAX_RESULTS
      );
    } catch (err) {
      console.error("Load more failed:", err);
      setError(err instanceof Error ? err.message : "Failed to load more results.");
    } finally {
      setLoadingMore(false);
    }
  };

  return {
    query,
    setQuery,
    refinement,
    setRefinement,
    results,
    loading,
    loadingMore,
    error,
    showRefinement,
    setShowRefinement,
    hasMore,
    runSearch,
    loadMore,
  };
}
